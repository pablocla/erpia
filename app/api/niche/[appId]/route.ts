import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { getNicheApp } from "@/lib/niche/niche-apps-catalog"
import {
  avisarCuotaWhatsApp,
  cobrarCuotaNiche,
  generarCuotaMasiva,
  linkPagoCuota,
  listarSociosNiche,
  registrarCuotaNiche,
} from "@/lib/niche/cuotas-service"
import {
  crearMovimientoNiche,
  listarMovimientosNiche,
  resumenNiche,
  actualizarEstadoMovimiento,
} from "@/lib/niche/movimientos-service"
import { encolarWhatsAppNiche, enviarWhatsAppMasivoNiche } from "@/lib/niche/niche-whatsapp"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { appId } = await params
  const app = getNicheApp(appId)
  if (!app) return NextResponse.json({ error: "App no encontrada" }, { status: 404 })

  const acceso = await canUseSku(auth.auth.empresaId, app.sku)
  if (!acceso.ok && app.sku !== "niche.prestamo_barrio") {
    return NextResponse.json({ error: "App no activa", sku: app.sku }, { status: 403 })
  }

  if (app.engine === "cuotas") {
    const data = await listarSociosNiche(auth.auth.empresaId, app.sku)
    const resumen = await resumenNiche(auth.auth.empresaId, app.sku)
    return NextResponse.json({ app, resumen, ...data })
  }

  const movimientos = await listarMovimientosNiche(auth.auth.empresaId, app.sku)
  const resumen = await resumenNiche(auth.auth.empresaId, app.sku)
  return NextResponse.json({ app, resumen, movimientos })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { appId } = await params
  const app = getNicheApp(appId)
  if (!app) return NextResponse.json({ error: "App no encontrada" }, { status: 404 })

  const acceso = await canUseSku(auth.auth.empresaId, app.sku)
  if (!acceso.ok && app.sku !== "niche.prestamo_barrio") {
    return NextResponse.json({ error: "App no activa" }, { status: 403 })
  }

  const body = await request.json()
  const action = body.action as string

  if (action === "whatsapp_masivo") {
    const result = await enviarWhatsAppMasivoNiche({
      empresaId: auth.auth.empresaId,
      appSku: app.sku,
      appId,
      mensaje: body.mensaje ?? "",
      soloPendientes: Boolean(body.soloPendientes),
    })
    return NextResponse.json(result)
  }

  if (action === "marcar_estado" && body.id) {
    const estado = body.estado ?? "pagado"
    const row = await actualizarEstadoMovimiento(
      auth.auth.empresaId,
      Number(body.id),
      estado,
    )

    let whatsappEncolado = false
    if (estado === "listo" && row.cliente?.telefono) {
      whatsappEncolado = await encolarWhatsAppNiche({
        empresaId: auth.auth.empresaId,
        appSku: app.sku,
        clienteNombre: row.cliente.nombre,
        telefono: row.cliente.telefono,
        concepto: row.titulo,
        monto: Number(row.monto),
      })
    }

    return NextResponse.json({ ...row, whatsappEncolado })
  }

  if (action === "avisar_cuota" && body.id) {
    const r = await avisarCuotaWhatsApp(auth.auth.empresaId, app.sku, Number(body.id))
    if (!r.ok) return NextResponse.json({ error: r.error, linkPago: r.linkPago }, { status: 400 })
    return NextResponse.json(r)
  }

  if (action === "link_pago_cuota" && body.id) {
    const r = await linkPagoCuota(auth.auth.empresaId, Number(body.id))
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json(r)
  }

  if (action === "link_pago_mov" && body.id) {
    const mov = await listarMovimientosNiche(auth.auth.empresaId, app.sku, { limit: 500 })
    const row = mov.find((m) => m.id === Number(body.id))
    if (!row?.clienteId) {
      return NextResponse.json({ error: "Movimiento sin cliente" }, { status: 400 })
    }
    const { resolverLinkPagoDeudor } = await import("@/lib/mercadopago/deudor-pago-link")
    const link = await resolverLinkPagoDeudor({
      empresaId: auth.auth.empresaId,
      clienteId: row.clienteId,
      clienteNombre: row.cliente?.nombre ?? "Cliente",
      monto: Number(row.monto),
      titulo: row.titulo,
    })
    if (!link) return NextResponse.json({ error: "MP no configurado" }, { status: 400 })
    return NextResponse.json({ ok: true, linkPago: link })
  }

  if (app.engine === "cuotas" && action === "cuota") {
    const row = await registrarCuotaNiche(auth.auth.empresaId, app.sku, {
      clienteId: Number(body.clienteId),
      monto: Number(body.monto),
      periodo: body.periodo ?? new Date().toISOString().slice(0, 7),
      titulo: body.titulo,
      marcarPagado: Boolean(body.marcarPagado),
    })
    return NextResponse.json(row)
  }

  if (app.engine === "cuotas" && action === "cobrar_cuota") {
    const result = await cobrarCuotaNiche(auth.auth.empresaId, Number(body.id))
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (app.engine === "cuotas" && action === "generar_masiva") {
    const result = await generarCuotaMasiva(
      auth.auth.empresaId,
      app.sku,
      body.periodo ?? new Date().toISOString().slice(0, 7),
      Number(body.monto)
    )
    return NextResponse.json(result)
  }


  const categoria = body.categoria ?? app.categorias[0] ?? "movimiento"
  const row = await crearMovimientoNiche(auth.auth.empresaId, {
    appSku: app.sku,
    categoria,
    titulo: body.titulo ?? body.concepto ?? "Registro",
    clienteId: body.clienteId ? Number(body.clienteId) : undefined,
    monto: body.monto != null ? Number(body.monto) : 0,
    estado: body.estado ?? (categoria === "ticket" ? "pendiente" : "pendiente"),
    periodo: body.periodo,
    venceEn: body.venceEn ? new Date(body.venceEn) : undefined,
    metadata: body.metadata,
  })
  return NextResponse.json(row)
}
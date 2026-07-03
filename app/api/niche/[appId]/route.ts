import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { getNicheApp } from "@/lib/niche/niche-apps-catalog"
import { listarMorososCuota, listarSociosNiche, registrarCuotaNiche } from "@/lib/niche/cuotas-service"
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
    if (app.appId === "plancha" && estado === "listo" && row.cliente?.telefono) {
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
import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { tieneAccesoInmobiliaria } from "@/lib/inmobiliaria/inmobiliaria-access"
import { prisma } from "@/lib/prisma"
import { cobrosService } from "@/lib/cobros/cobros-service"
import { resolverLinkPagoDeudor } from "@/lib/mercadopago/deudor-pago-link"
import { encolarWhatsAppNiche } from "@/lib/niche/niche-whatsapp"

/**
 * POST actions:
 * - cobrar: registra recibo sobre cuentaCobrarId
 * - link_pago: genera preferencia MP
 * - avisar: WA + link MP si hay
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  if (!(await tieneAccesoInmobiliaria(auth.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const body = await request.json()
  const action = (body.action as string) || "link_pago"
  const cuentaCobrarId = Number(body.cuentaCobrarId)
  if (!cuentaCobrarId) {
    return NextResponse.json({ error: "cuentaCobrarId requerido" }, { status: 400 })
  }

  const cc = await prisma.cuentaCobrar.findFirst({
    where: {
      id: cuentaCobrarId,
      cliente: { empresaId: auth.auth.empresaId },
      saldo: { gt: 0 },
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
    },
  })
  if (!cc) {
    return NextResponse.json({ error: "Cuenta a cobrar no encontrada o ya saldada" }, { status: 404 })
  }

  const monto = Number(cc.saldo)
  const titulo = cc.observaciones ?? "Alquiler pendiente"

  if (action === "cobrar") {
    try {
      const recibo = await cobrosService.registrarCobro({
        empresaId: auth.auth.empresaId,
        clienteId: cc.clienteId,
        items: [{ cuentaCobrarId: cc.id, monto }],
        medioPago: body.medioPago ?? "transferencia",
        observaciones: titulo,
        calcularRetencionesAuto: false,
      })
      return NextResponse.json({
        ok: true,
        reciboId: recibo.reciboId,
        reciboNumero: recibo.reciboNumero,
      })
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Error al cobrar" },
        { status: 400 },
      )
    }
  }

  const linkPago = await resolverLinkPagoDeudor({
    empresaId: auth.auth.empresaId,
    clienteId: cc.clienteId,
    clienteNombre: cc.cliente.nombre,
    monto,
    titulo,
    facturaId: cc.facturaId,
    cuentaCobrarId: cc.id,
    emailPagador: cc.cliente.email,
  })

  if (action === "link_pago") {
    if (!linkPago) {
      return NextResponse.json(
        { error: "Mercado Pago no configurado o ClavPay inactivo" },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: true, linkPago })
  }

  if (action === "avisar") {
    if (!cc.cliente.telefono) {
      return NextResponse.json({ error: "Inquilino sin teléfono" }, { status: 400 })
    }
    const montoFmt = monto.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    })
    const linkLinea = linkPago
      ? ` Pagá online: ${linkPago}`
      : " Ante cualquier duda, respondanos por este medio."
    const ok = await encolarWhatsAppNiche({
      empresaId: auth.auth.empresaId,
      appSku: "niche.inmo_garantia",
      clienteNombre: cc.cliente.nombre,
      telefono: cc.cliente.telefono,
      concepto: titulo,
      monto,
      mensajeCustom: `Hola ${cc.cliente.nombre}, le recordamos que tiene un alquiler pendiente por ${montoFmt}.${linkLinea}`,
    })
    if (!ok) {
      return NextResponse.json(
        { error: "WhatsApp no configurado", linkPago: linkPago ?? null },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: true, linkPago: linkPago ?? null })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}

/** GET — CxC de alquileres pendientes de la empresa */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  if (!(await tieneAccesoInmobiliaria(auth.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const rows = await prisma.cuentaCobrar.findMany({
    where: {
      cliente: { empresaId: auth.auth.empresaId },
      estado: { in: ["pendiente", "vencida", "parcial"] },
      saldo: { gt: 0 },
      observaciones: { contains: "Alquiler" },
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
    take: 50,
  })

  return NextResponse.json(
    rows.map((r) => ({
      cuentaCobrarId: r.id,
      facturaId: r.facturaId,
      monto: Number(r.saldo),
      vencimiento: r.fechaVencimiento?.toISOString().slice(0, 10) ?? null,
      concepto: r.observaciones,
      clienteId: r.cliente.id,
      clienteNombre: r.cliente.nombre,
      telefono: r.cliente.telefono,
    })),
  )
}

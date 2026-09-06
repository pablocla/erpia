import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { packsPublicos } from "@/lib/servicios-especialista/especialista-catalog"
import {
  crearCheckoutEspecialista,
  findOrdenEspecialista,
  linkWhatsAppPostPago,
  listOrdenesEspecialista,
  marcarOrdenPagada,
  parseEspecialistaMeta,
  slotsEspecialista,
} from "@/lib/servicios-especialista/especialista-service"
import { getPackEspecialista } from "@/lib/servicios-especialista/especialista-catalog"
import { isMpMockMode } from "@/lib/config/env"

async function authContacto(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth
  let nombre = auth.auth.email.split("@")[0] ?? auth.auth.email
  let empresaNombre: string | null = null
  try {
    const [empresa, usuario] = await Promise.all([
      prisma.empresa.findUnique({
        where: { id: auth.auth.empresaId },
        select: { nombre: true },
      }),
      prisma.usuario.findUnique({
        where: { id: auth.auth.userId },
        select: { nombre: true },
      }),
    ])
    empresaNombre = empresa?.nombre ?? null
    if (usuario?.nombre) nombre = usuario.nombre
  } catch {
    /* JWT mínimo */
  }
  return {
    ok: true as const,
    auth: auth.auth,
    nombre,
    empresaNombre,
  }
}

export async function GET(request: NextRequest) {
  const ctx = await authContacto(request)
  if (!ctx.ok) return ctx.response

  const mockConfirm = request.nextUrl.searchParams.get("confirmar_mock")
  const ordenId = Number(request.nextUrl.searchParams.get("orden") ?? "")
  if (mockConfirm === "1" && process.env.NODE_ENV !== "production" && isMpMockMode() && Number.isFinite(ordenId)) {
    const orden = await marcarOrdenPagada(ordenId)
    return NextResponse.json({
      ok: true,
      mock: true,
      orden,
      packs: packsPublicos(),
      slots: slotsEspecialista(),
    })
  }

  const ordenes = await listOrdenesEspecialista(ctx.auth.empresaId)
  const pendienteLead = await findOrdenEspecialista({
    empresaId: ctx.auth.empresaId,
    email: ctx.auth.email,
  })
  const meta = pendienteLead ? parseEspecialistaMeta(pendienteLead.notas) : null
  const packPendiente = getPackEspecialista(meta?.packId ?? "")

  return NextResponse.json({
    ok: true,
    packs: packsPublicos(),
    slots: slotsEspecialista(),
    ordenes,
    pendiente: pendienteLead && packPendiente && meta
      ? {
          id: pendienteLead.id,
          packId: packPendiente.id,
          estadoPago: meta.estadoPago,
          slotIso: meta.slotIso ?? null,
        }
      : null,
    mock: isMpMockMode(),
  })
}

export async function POST(request: NextRequest) {
  const ctx = await authContacto(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json()
    const { packId, telefonoContacto, observaciones, slotIso, confirmarMock } = body as {
      packId?: string
      telefonoContacto?: string
      observaciones?: string
      slotIso?: string
      confirmarMock?: boolean
    }

    if (confirmarMock && process.env.NODE_ENV !== "production" && isMpMockMode()) {
      const leadId = Number(body?.ordenId)
      if (!Number.isFinite(leadId)) {
        return NextResponse.json({ error: "Orden inválida" }, { status: 400 })
      }
      const orden = await marcarOrdenPagada(leadId)
      return NextResponse.json({ ok: true, mock: true, orden })
    }

    if (!packId) {
      return NextResponse.json({ error: "Elegí un pack" }, { status: 400 })
    }

    const result = await crearCheckoutEspecialista({
      empresaId: ctx.auth.empresaId,
      email: ctx.auth.email,
      nombre: ctx.nombre,
      empresaNombre: ctx.empresaNombre,
      packId,
      telefono: String(telefonoContacto ?? ""),
      slotIso,
      observaciones,
    })

    return NextResponse.json({
      ok: true,
      orden: result.orden,
      checkoutUrl: result.checkoutUrl,
      mock: result.mock,
      linkWhatsApp: result.orden.estadoPago === "pagado" ? linkWhatsAppPostPago(result.orden) : null,
    })
  } catch (error) {
    console.error("[POST /api/servicios/especialista] Error:", error)
    const msg = error instanceof Error ? error.message : "Error procesando solicitud"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import {
  findPendingUpgradeArca,
  generarSlotsImplementacion,
  pactarImplementacionArca,
  type PactarImplementacionAuth,
} from "@/lib/comercial/implementacion-arca"

async function authOpcional(request: NextRequest): Promise<PactarImplementacionAuth | null> {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return null
  let empresaNombre: string | null = null
  let nombre = ctx.auth.email.split("@")[0] ?? ctx.auth.email
  try {
    const [empresa, usuario] = await Promise.all([
      (prisma as any).empresa.findUnique({
        where: { id: ctx.auth.empresaId },
        select: { nombre: true },
      }),
      (prisma as any).usuario.findUnique({
        where: { id: ctx.auth.userId },
        select: { nombre: true },
      }),
    ])
    empresaNombre = empresa?.nombre ?? null
    if (usuario?.nombre) nombre = usuario.nombre
  } catch {
    /* contacto mínimo con el JWT */
  }
  return {
    email: ctx.auth.email,
    nombre,
    empresaId: ctx.auth.empresaId,
    empresaNombre,
  }
}

export async function GET(request: NextRequest) {
  try {
    const slots = generarSlotsImplementacion()
    const auth = await authOpcional(request)
    const pendiente = auth
      ? await findPendingUpgradeArca({ empresaId: auth.empresaId, email: auth.email })
      : null
    return NextResponse.json({
      ok: true,
      slots,
      pendiente,
      mensaje:
        "Podés vender y emitir ticket interno ahora. El certificado ARCA y WhatsApp se pactan en un turno.",
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al listar turnos"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const auth = await authOpcional(request)
    const result = await pactarImplementacionArca(body, auth)
    return NextResponse.json({
      ok: true,
      creado: result.creado,
      slot: result.slot,
      leadId: result.lead.id,
      mensaje: result.creado
        ? `Turno pactado para ${result.slot.label}. En Claver Cloud queda pendiente el upgrade y el certificado ARCA. Mientras tanto podés vender con ticket interno.`
        : `Turno actualizado a ${result.slot.label}. Sigue pendiente en Claver Cloud.`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al pactar el turno"
    const status = msg.includes("rechazada") ? 400 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

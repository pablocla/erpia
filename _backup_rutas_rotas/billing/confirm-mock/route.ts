import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { activarSuscripcionPagada } from "@/lib/billing/mercadopago-subscription"

/**
 * Dev/staging: confirma pago simulado cuando MP_ACCESS_TOKEN es mock.
 * En prod este endpoint responde 403.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const mpToken = process.env.MP_ACCESS_TOKEN ?? ""
  const isMock = !mpToken || mpToken.startsWith("TEST-mock")
  if (!isMock && process.env.FORCE_MOCK_MP_PROD !== "true") {
    return NextResponse.json({ error: "Solo disponible en entorno mock" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const ref = typeof body.ref === "string" ? body.ref : undefined

  await prisma.empresa.update({
    where: { id: ctx.auth.empresaId },
    data: {
      mpSubscriptionStatus: "authorized",
      mpSubscriptionId: ref ?? `mp_sub_mock_${Date.now()}`,
    },
  })

  await activarSuscripcionPagada(ctx.auth.empresaId)

  return NextResponse.json({ success: true, status: "authorized" })
}
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { createStripeCheckoutSession } from "@/lib/stripe/stripe-service"
import { resolvePaymentProvider } from "@/lib/stripe/stripe-config"
import { getStripePriceId, isStripeConfigured } from "@/lib/config/env"
import { marketFromCountry } from "@/lib/comercial/markets"

/**
 * POST /api/stripe/checkout
 * Body: {
 *   amount?: number
 *   title?: string
 *   externalReference?: string
 *   customerEmail?: string
 *   mode?: "payment" | "subscription"
 *   priceId?: string
 *   sku?: string
 *   cuentaCobrarId?: number
 *   clienteId?: number
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  if (!isStripeConfigured() && process.env.FORCE_MOCK_STRIPE_PROD !== "true") {
    // Allow mock in non-prod
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error: "Stripe no configurado",
          hint: "Definí STRIPE_SECRET_KEY en .env / Vercel",
        },
        { status: 503 },
      )
    }
  }

  const empresaId = auth.auth.empresaId
  const body = (await request.json().catch(() => ({}))) as {
    amount?: number
    title?: string
    externalReference?: string
    customerEmail?: string
    mode?: "payment" | "subscription"
    priceId?: string
    sku?: string
    cuentaCobrarId?: number
    clienteId?: number
  }

  const empresa = await prisma.empresa.findFirst({
    where: whereEmpresa(empresaId),
    select: { paisFiscal: true, email: true, nombre: true },
  })
  const marketId = marketFromCountry(empresa?.paisFiscal)
  const provider = resolvePaymentProvider({
    paisFiscal: empresa?.paisFiscal,
    marketId,
  })

  if (provider !== "stripe" && process.env.PAYMENTS_PROVIDER !== "stripe") {
    // Still allow explicit stripe checkout if keys exist (US trial tenant may still be AR fiscal)
    if (!isStripeConfigured() && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Provider de pagos de esta empresa no es Stripe", provider },
        { status: 400 },
      )
    }
  }

  let externalReference = body.externalReference?.trim()
  let amount = Number(body.amount ?? 0)
  let title = body.title?.trim() || "Claver payment"
  let email = body.customerEmail ?? empresa?.email ?? undefined

  if (body.cuentaCobrarId) {
    const cc = await prisma.cuentaCobrar.findFirst({
      where: {
        id: body.cuentaCobrarId,
        cliente: { empresaId },
      },
      select: {
        id: true,
        saldo: true,
        cliente: { select: { id: true, email: true, nombre: true } },
      },
    })
    if (!cc) {
      return NextResponse.json({ error: "Cuenta por cobrar no encontrada" }, { status: 404 })
    }
    externalReference = `cxc-${cc.id}`
    amount = amount > 0 ? amount : Number(cc.saldo)
    title = title === "Claver payment" ? `Payment ${cc.cliente.nombre}` : title
    email = email ?? cc.cliente.email ?? undefined
  }

  if (!externalReference) {
    externalReference = `claver-empresa-${empresaId}-sku-${body.sku ?? "plan"}`
  }

  const mode = body.mode ?? (body.priceId || body.sku ? "subscription" : "payment")
  const priceId = body.priceId || (mode === "subscription" ? getStripePriceId(body.sku) : undefined)

  if (mode === "payment" && amount <= 0) {
    return NextResponse.json({ error: "amount requerido para payment" }, { status: 400 })
  }
  if (mode === "subscription" && !priceId) {
    return NextResponse.json(
      {
        error: "priceId o STRIPE_PRICE_DEFAULT requerido para subscription",
        hint: "Creá un Price en Stripe Dashboard y poné STRIPE_PRICE_DEFAULT=price_...",
      },
      { status: 400 },
    )
  }

  try {
    const session = await createStripeCheckoutSession({
      empresaId,
      amount: amount > 0 ? amount : 1,
      title,
      customerEmail: email,
      externalReference,
      marketId,
      mode: mode === "subscription" ? "subscription" : "payment",
      priceId: priceId || undefined,
      currency: marketId === "us" ? "usd" : "usd",
    })
    return NextResponse.json({
      id: session.id,
      url: session.url,
      mock: session.mock ?? false,
      provider: "stripe",
      externalReference,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured(),
    publishableKeyPresent: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  })
}

import { NextRequest, NextResponse } from "next/server"
import { confirmarSenaOficioPorPaymentId } from "@/lib/oficios/aplicar-sena-mp"

/**
 * Callback público post-checkout MP.
 * Requiere payment_id real; no marca seña con solo ?pago=exitoso.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params
  try {
    const body = await request.json().catch(() => ({}))
    const mpPaymentId = String(
      body.paymentId ?? body.payment_id ?? body.collection_id ?? "",
    ).trim()

    if (!mpPaymentId || mpPaymentId === "null" || mpPaymentId === "undefined") {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta payment_id de Mercado Pago. No se marca seña sin cobro verificado.",
        },
        { status: 400 },
      )
    }

    const result = await confirmarSenaOficioPorPaymentId({
      tokenPublico: params.token,
      mpPaymentId,
    })

    if (!result.ok) {
      const status = result.error.includes("no está configurado") ? 503 : 400
      return NextResponse.json({ ok: false, error: result.error }, { status })
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

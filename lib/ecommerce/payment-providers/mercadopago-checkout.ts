import { crearPreferenciaPago, obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"

function baseAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

export async function crearPreferenciaPedidoEcommerce(input: {
  empresaId: number
  pedidoId: number
  numeroPedido: string
  monto: number
  emailPagador?: string | null
  slug?: string | null
}): Promise<string> {
  const config = await obtenerConfigMP(input.empresaId)
  if (!config?.activo || !config.checkoutHabilitado) {
    throw new Error("MercadoPago no está configurado para checkout en tienda")
  }

  const returnPath = input.slug
    ? `/tienda/${input.slug}`
    : `/tienda?empresaId=${input.empresaId}`
  const base = baseAppUrl()

  const pref = await crearPreferenciaPago({
    empresaId: input.empresaId,
    titulo: `Pedido ${input.numeroPedido}`,
    monto: input.monto,
    emailPagador: input.emailPagador ?? undefined,
    externalReference: `pedido-${input.pedidoId}`,
    backUrls: {
      success: `${base}${returnPath}?pago=ok&pedido=${input.numeroPedido}`,
      failure: `${base}${returnPath}?pago=error`,
      pending: `${base}${returnPath}?pago=pendiente&pedido=${input.numeroPedido}`,
    },
  })

  return (pref.init_point as string) ?? (pref.sandbox_init_point as string) ?? ""
}
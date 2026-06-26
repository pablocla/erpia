import { prisma } from "@/lib/prisma"
import { crearPreferenciaPago, obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"

/** Genera link MercadoPago si MP está activo y/o SKU fiscal.clavpay_link */
export async function resolverLinkPagoFiado(input: {
  empresaId: number
  clienteId: number
  clienteNombre: string
  monto: number
  facturaId: number
  cuentaCobrarId?: number
  emailPagador?: string | null
}): Promise<string | null> {
  const [mpConfig, suscripcionClavpay] = await Promise.all([
    obtenerConfigMP(input.empresaId),
    prisma.suscripcionModulo.findFirst({
      where: { empresaId: input.empresaId, sku: "fiscal.clavpay_link", activo: true },
    }),
  ])

  if (!mpConfig?.activo || !mpConfig.checkoutHabilitado) {
    if (!suscripcionClavpay) return null
  }

  try {
    const pref = await crearPreferenciaPago({
      empresaId: input.empresaId,
      titulo: `Fiado ${input.clienteNombre}`,
      monto: input.monto,
      facturaId: input.facturaId,
      cuentaCobrarId: input.cuentaCobrarId,
      emailPagador: input.emailPagador ?? undefined,
      externalReference: `fiado-${input.facturaId}-${input.clienteId}`,
    })
    return (pref.init_point as string) ?? (pref.sandbox_init_point as string) ?? null
  } catch (err) {
    console.warn("[Fiado] Link MP no disponible:", err)
    return null
  }
}
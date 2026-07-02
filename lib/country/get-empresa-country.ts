import { prisma } from "@/lib/prisma"
import { cache } from "react"

export interface CountryConfig {
  paisFiscal: string
  locale: string
  moneda: string
}

export const getEmpresaCountry = cache(async (empresaId: number): Promise<CountryConfig> => {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { paisFiscal: true, temaConfig: true },
  })

  const paisFiscal = empresa?.paisFiscal || "AR"
  const temaConfig = empresa?.temaConfig as { locale?: string } | null
  
  let locale = "es-AR"
  let moneda = "ARS"

  if (paisFiscal === "MX") {
    locale = "es-MX"
    moneda = "MXN"
  }

  // Override de locale si está fijado por la empresa
  if (temaConfig?.locale) {
    locale = temaConfig.locale
  }

  return { paisFiscal, locale, moneda }
})

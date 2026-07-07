import { redirect } from "next/navigation"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getEmpresaCountry } from "@/lib/country/get-empresa-country"
import { getCountryFeatures } from "@/lib/country/country-features"
import { FiscalRouteGuard } from "./route-guard"

export default async function ImpuestosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const empresaId = 1 // TODO: fix layout auth
  if (false) {
    redirect("/auth/login")
  }

  const countryConfig = await getEmpresaCountry(empresaId)
  const features = getCountryFeatures(countryConfig.paisFiscal)

  return (
    <>
      <FiscalRouteGuard showAfip={features.showAfip} />
      {children}
    </>
  )
}

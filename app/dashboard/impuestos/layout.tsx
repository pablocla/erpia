import { redirect } from "next/navigation"
import { getAuthContextServer } from "@/lib/auth/empresa-guard-server"
import { getEmpresaCountry } from "@/lib/country/get-empresa-country"
import { getCountryFeatures } from "@/lib/country/country-features"
import { FiscalRouteGuard } from "./route-guard"

export default async function ImpuestosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getAuthContextServer()
  if (!auth) {
    redirect("/auth/login")
  }

  const countryConfig = await getEmpresaCountry(auth.empresaId)
  const features = getCountryFeatures(countryConfig.paisFiscal)

  return (
    <>
      <FiscalRouteGuard showAfip={features.showAfip} />
      {children}
    </>
  )
}

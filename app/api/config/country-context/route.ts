import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getEmpresaCountry } from "@/lib/country/get-empresa-country"
import { getCountryFeatures } from "@/lib/country/country-features"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const config = await getEmpresaCountry(auth.auth.empresaId)
    const features = getCountryFeatures(config.paisFiscal)

    return NextResponse.json({
      ...config,
      features
    })
  } catch (error) {
    console.error("[GET /api/config/country-context] Error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

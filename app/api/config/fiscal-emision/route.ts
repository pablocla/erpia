import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  getFiscalEmissionConfig,
  saveFiscalEmissionConfig,
  type FiscalEmissionConfig,
} from "@/lib/fiscal/emission-config"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const config = await getFiscalEmissionConfig(auth.auth.empresaId)
  return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = (await request.json()) as Partial<FiscalEmissionConfig>
  const config = await saveFiscalEmissionConfig(auth.auth.empresaId, body)
  return NextResponse.json(config)
}
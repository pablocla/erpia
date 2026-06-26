import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  getAlmacenRosarioConfig,
  saveAlmacenRosarioConfig,
  type AlmacenRosarioConfig,
} from "@/lib/almacen-rosario/config"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  const config = await getAlmacenRosarioConfig(ctx.auth.empresaId)
  return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  const body = (await request.json()) as Partial<AlmacenRosarioConfig>
  const config = await saveAlmacenRosarioConfig(ctx.auth.empresaId, body)
  return NextResponse.json(config)
}
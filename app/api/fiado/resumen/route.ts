import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { resumenFiado } from "@/lib/fiado/fiado-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const resumen = await resumenFiado(ctx.auth.empresaId)
  return NextResponse.json(resumen)
}
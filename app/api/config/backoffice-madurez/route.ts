import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getBackofficeMadurez } from "@/lib/ops/backoffice-madurez-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  return NextResponse.json(getBackofficeMadurez())
}
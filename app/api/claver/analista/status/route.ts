import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isClaverAnalyst } from "@/lib/auth/claver-analyst"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  return NextResponse.json({
    isAnalyst: isClaverAnalyst(ctx.auth.email, ctx.auth.rol),
    email: ctx.auth.email,
  })
}
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { authenticateProtheusSubuser } from "@/lib/auth/protheus-oauth-service"

export async function POST(request: NextRequest) {
  const blocked = checkRateLimit(request, "auth-protheus", 20, 15 * 60 * 1000)
  if (blocked) return blocked

  const body = (await request.json()) as {
    slug?: string
    username?: string
    password?: string
    accessToken?: string
  }
  if (!body.slug?.trim() || !body.username?.trim()) {
    return NextResponse.json({ success: false, error: "slug y usuario Protheus requeridos" }, { status: 400 })
  }

  const result = await authenticateProtheusSubuser({
    slug: body.slug,
    username: body.username,
    password: body.password,
    accessToken: body.accessToken,
  })
  return NextResponse.json(result, { status: result.success ? 200 : result.status })
}

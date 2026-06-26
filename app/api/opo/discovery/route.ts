import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getOpoDiscovery } from "@/lib/opo/opo-query-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const origin = request.nextUrl.origin
  const manifest = await getOpoDiscovery(auth.auth.empresaId, origin)

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "X-OPO-Version": "0.1.0",
    },
  })
}
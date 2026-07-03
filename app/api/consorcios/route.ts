import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { crearConsorcio, listarConsorcios } from "@/lib/niche/consorcios-api-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const data = await listarConsorcios(auth.auth.empresaId)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const row = await crearConsorcio(auth.auth.empresaId, body)
  return NextResponse.json(row, { status: 201 })
}
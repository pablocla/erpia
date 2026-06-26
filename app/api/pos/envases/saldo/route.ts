import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { saldoEnvasesCliente } from "@/lib/almacen-rosario/envase-pos-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const acceso = await canUseSku(ctx.auth.empresaId, "pos.envases_gaseosas")
  if (!acceso.ok) {
    return NextResponse.json({ error: "Envases de gaseosas no activo" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const clienteId = Number(searchParams.get("clienteId"))
  if (!clienteId || Number.isNaN(clienteId)) {
    return NextResponse.json({ error: "clienteId es obligatorio" }, { status: 400 })
  }

  const saldo = await saldoEnvasesCliente(ctx.auth.empresaId, clienteId)
  return NextResponse.json(saldo)
}
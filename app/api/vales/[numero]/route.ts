import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { anularVale, buscarValeActivo } from "@/lib/almacen-rosario/vale-dinero-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const acceso = await canUseSku(ctx.auth.empresaId, "pos.vale_dinero")
    if (!acceso.ok) {
      return NextResponse.json({ error: "Vale de dinero no activo" }, { status: 403 })
    }

    const { numero } = await params
    const vale = await buscarValeActivo(ctx.auth.empresaId, decodeURIComponent(numero))
    if (!vale) {
      return NextResponse.json({ error: "Vale no encontrado" }, { status: 404 })
    }

    return NextResponse.json(vale)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const acceso = await canUseSku(ctx.auth.empresaId, "pos.vale_dinero")
    if (!acceso.ok) {
      return NextResponse.json({ error: "Vale de dinero no activo" }, { status: 403 })
    }

    const { numero } = await params
    await anularVale(ctx.auth.empresaId, decodeURIComponent(numero))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al anular" },
      { status: 400 },
    )
  }
}
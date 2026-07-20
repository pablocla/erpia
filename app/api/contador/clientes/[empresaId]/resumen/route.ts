import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  assertContadorPuedeLeer,
  resumenFiscalCliente,
} from "@/lib/contador/multi-empresa-service"

/** GET resumen fiscal de un cliente (solo si el estudio tiene link activo) */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ empresaId: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { empresaId: raw } = await ctx.params
  const clienteEmpresaId = Number(raw)
  if (!clienteEmpresaId) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const access = await assertContadorPuedeLeer(auth.auth.empresaId, clienteEmpresaId)
  if (!access.ok) {
    return NextResponse.json({ error: "Sin acceso a esta empresa" }, { status: 403 })
  }

  try {
    const resumen = await resumenFiscalCliente(clienteEmpresaId)
    return NextResponse.json({
      clienteEmpresaId,
      permisos: access.permisos,
      resumen,
      links: {
        impuestos: `/dashboard/impuestos`,
        reportes: `/dashboard/reportes`,
        nota: "Para editar datos del cliente, pedí acceso al administrador de esa empresa o impersonación Cloud.",
      },
    })
  } catch (err) {
    console.error("[contador/resumen]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}

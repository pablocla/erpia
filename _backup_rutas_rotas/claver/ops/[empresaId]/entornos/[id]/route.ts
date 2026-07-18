import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { cambiarEstadoEntorno } from "@/lib/ops/ops-service"

const schema = z.object({
  estado: z.enum(["activo", "mantenimiento", "detenido", "error", "desplegando"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string; id: string }> },
) {
  try {
    const { empresaId: rawEmpresa, id } = await params
    const empresaId = Number(rawEmpresa)
    const entornoId = Number(id)

    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    const entorno = await cambiarEstadoEntorno(
      empresaId,
      entornoId,
      parsed.data.estado,
      ctx.auth.email,
    )

    return NextResponse.json(entorno)
  } catch (error) {
    console.error("Error entorno analista:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
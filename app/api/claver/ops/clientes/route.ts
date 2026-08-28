import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext, getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const scope = await getAnalystEmpresaScope(ctx.auth.email)
    const scopeWhere = scope.mode === "assigned" ? { id: { in: scope.empresaIds } } : {}

    const empresas = await (prisma as any).empresa.findMany({
      where: { ...scopeWhere, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        cuit: true,
        email: true,
        telefono: true,
        rubro: true,
        modoLite: true,
        createdAt: true,
        activo: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ clientes: empresas, empresas, total: empresas.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error obteniendo clientes" }, { status: 500 })
  }
}

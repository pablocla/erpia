import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"

/**
 * GET /api/config/usuarios — List all users for the current empresa
 * Only admins can list users.
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  if (ctx.auth.rol !== "administrador") {
    return NextResponse.json({ error: "Solo administradores pueden ver usuarios" }, { status: 403 })
  }

  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: ctx.auth.empresaId },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json({ usuarios })
}

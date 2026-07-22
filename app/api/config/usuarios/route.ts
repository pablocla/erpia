import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers } from "@/lib/auth/admin-roles"

/**
 * GET /api/config/usuarios — List all users for the current empresa
 * User managers (dueno, administrador, admin, propietario).
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  if (!canManageUsers(ctx.auth.rol)) {
    return NextResponse.json(
      { error: "Solo administradores pueden ver usuarios" },
      { status: 403 },
    )
  }

  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: ctx.auth.empresaId, deletedAt: null },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      authProvider: true,
      avatarUrl: true,
      googleId: true,
    },
    orderBy: { nombre: "asc" },
  })

  return NextResponse.json({
    usuarios: usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      authProvider: u.authProvider,
      avatarUrl: u.avatarUrl,
      hasGoogle: !!u.googleId,
    })),
  })
}

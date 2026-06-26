import { type NextRequest, NextResponse } from "next/server"
import { DEMO_ADMIN_EMAIL } from "@/lib/brand"
import { getAuthContext, type AuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

const ANALYST_ROLE = "analista_claver"

function parseAnalystEmails(): Set<string> {
  const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  // Cuenta demo pública: acceso Cloud si no hay lista explícita de analistas
  if (emails.length === 0) {
    emails.push(DEMO_ADMIN_EMAIL.toLowerCase())
  }

  return new Set(emails)
}

export function isClaverAnalyst(email: string, rol?: string): boolean {
  if (rol === ANALYST_ROLE) return true
  return parseAnalystEmails().has(email.trim().toLowerCase())
}

export async function getAnalystEmpresaScope(
  email: string,
): Promise<{ mode: "all" } | { mode: "assigned"; empresaIds: number[] }> {
  const db = prisma as any
  const asignaciones = await db.analistaAsignacion.findMany({
    where: { analistaEmail: email.trim().toLowerCase(), activo: true },
    select: { empresaId: true },
  })

  if (asignaciones.length === 0) return { mode: "all" }
  return { mode: "assigned", empresaIds: asignaciones.map((a: { empresaId: number }) => a.empresaId) }
}

export async function canAnalystAccessEmpresa(email: string, empresaId: number): Promise<boolean> {
  const scope = await getAnalystEmpresaScope(email)
  if (scope.mode === "all") return true
  return scope.empresaIds.includes(empresaId)
}

export async function getClaverAnalystContext(
  request: NextRequest,
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: NextResponse }> {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx

  if (!isClaverAnalyst(ctx.auth.email, ctx.auth.rol)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso restringido a analistas CLAVER" },
        { status: 403 },
      ),
    }
  }

  return ctx
}

export async function getClaverAnalystEmpresaContext(
  request: NextRequest,
  empresaId: number,
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: NextResponse }> {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx

  const allowed = await canAnalystAccessEmpresa(ctx.auth.email, empresaId)
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No tenés asignado este cliente" },
        { status: 403 },
      ),
    }
  }

  return ctx
}

const CLIENT_OPS_ROLES = new Set(["administrador", "admin", "dueno", "gerente"])

export function canAccessClientOps(rol: string): boolean {
  return CLIENT_OPS_ROLES.has(rol)
}
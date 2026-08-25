import { type NextRequest, NextResponse } from "next/server"
import { CLAVER_OWNER_EMAIL } from "@/lib/brand"
import { getAuthContext, type AuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

const ANALYST_ROLE = "analista_claver"

function parseAnalystEmails(): Set<string> {
  return new Set(getClaverAnalystEmails())
}

/** Emails con acceso a Claver Cloud y alertas comerciales. El owner siempre entra. */
export function getClaverAnalystEmails(): string[] {
  const raw = process.env.CLAVER_ANALYST_EMAILS ?? ""
  const emails = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
  emails.add(CLAVER_OWNER_EMAIL.toLowerCase())
  return [...emails]
}

export function isClaverAnalyst(email?: string | null, rol?: string): boolean {
  if (rol === ANALYST_ROLE) return true
  if (!email) return false
  return parseAnalystEmails().has(email.trim().toLowerCase())
}

export async function getAnalystEmpresaScope(
  email: string,
): Promise<{ mode: "all" } | { mode: "assigned"; empresaIds: number[] } | { mode: "none" }> {
  const asignaciones = await prisma.analistaAsignacion.findMany({
    where: { analistaEmail: email.trim().toLowerCase(), activo: true },
    select: { empresaId: true },
  })

  if (asignaciones.length === 0) {
    if (process.env.CLAVER_ANALYST_GLOBAL === "1" || email.trim().toLowerCase() === CLAVER_OWNER_EMAIL.toLowerCase()) {
      return { mode: "all" }
    }
    return { mode: "none" }
  }
  return { mode: "assigned", empresaIds: asignaciones.map((a) => a.empresaId) }
}

export async function canAnalystAccessEmpresa(email: string, empresaId: number): Promise<boolean> {
  const scope = await getAnalystEmpresaScope(email)
  if (scope.mode === "all") return true
  if (scope.mode === "none") return false
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
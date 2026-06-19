import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAutomationEntitlement } from "@/lib/platform/entitlements"
import {
  acknowledgePollEvents,
  fetchPendingPollEvents,
} from "@/lib/automation/poll-buffer"

async function verifyPollAuth(request: NextRequest): Promise<
  | { ok: true; empresaId: number }
  | { ok: false; error: string; status: number }
> {
  const empresaIdHeader = request.headers.get("x-nop-empresa-id")
  const apiKey = request.headers.get("x-nop-api-key")

  if (!apiKey || !empresaIdHeader) {
    return {
      ok: false,
      error: "Headers X-NOP-Api-Key y X-NOP-Empresa-Id requeridos",
      status: 401,
    }
  }

  const empresaId = parseInt(empresaIdHeader, 10)
  if (Number.isNaN(empresaId)) {
    return { ok: false, error: "empresaId inválido", status: 400 }
  }

  const config = await prisma.automationConfig.findUnique({
    where: { empresaId },
  })
  if (!config) {
    return { ok: false, error: "Automation no configurado", status: 404 }
  }

  const storedKey = config.n8nApiKeyEnc
    ? Buffer.from(config.n8nApiKeyEnc, "base64").toString("utf8")
    : null
  if (!storedKey || storedKey !== apiKey) {
    return { ok: false, error: "API key inválida", status: 401 }
  }

  const access = await requireAutomationEntitlement(empresaId)
  if (!access.ok) {
    return {
      ok: false,
      error: "Módulo no contratado",
      status: 402,
    }
  }

  return { ok: true, empresaId }
}

/**
 * GET /api/automation/poll?limit=50
 * Modo C — n8n consulta eventos pendientes (firewalls estrictos).
 */
export async function GET(request: NextRequest) {
  const auth = await verifyPollAuth(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const limitParam = request.nextUrl.searchParams.get("limit")
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 100)

  const { events, hasMore } = await fetchPendingPollEvents(auth.empresaId, limit)

  return NextResponse.json({
    ok: true,
    empresaId: auth.empresaId,
    count: events.length,
    hasMore,
    events,
  })
}

/**
 * POST /api/automation/poll
 * Body: { ids: string[] } — confirma recepción y libera la cola.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyPollAuth(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown) => typeof id === "string")
    : []

  const acked = await acknowledgePollEvents(auth.empresaId, ids)

  return NextResponse.json({
    ok: true,
    acknowledged: acked,
  })
}
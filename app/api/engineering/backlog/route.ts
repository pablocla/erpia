import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers } from "@/lib/auth/admin-roles"
import {
  assigneeSummary,
  cascadeEdges,
  formatBacklogForAgent,
  lifecycleSummary,
  listBacklogViews,
  nextActionableTickets,
  setTicketStatus,
  waveSummary,
} from "@/lib/engineering/product-backlog-service"
import type { BacklogAssignee } from "@/lib/engineering/product-backlog-types"

const patchSchema = z.object({
  id: z.string().min(2).max(32),
  status: z.enum(["todo", "doing", "blocked", "done", "cancelled"]),
  note: z.string().max(500).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const assigneeParam = searchParams.get("assignee") as BacklogAssignee | null
  const views = await listBacklogViews({
    status: (searchParams.get("status") as any) || undefined,
    priority: searchParams.get("priority") || undefined,
    epic: searchParams.get("epic") || undefined,
    wave: searchParams.get("wave") || undefined,
    assignee: assigneeParam || undefined,
    lifecycle: searchParams.get("lifecycle") || undefined,
    q: searchParams.get("q") || undefined,
    onlyCritical: searchParams.get("critical") === "1",
  })

  if (searchParams.get("format") === "agent") {
    const forWho = (searchParams.get("for") as BacklogAssignee | null) || assigneeParam || undefined
    return new NextResponse(formatBacklogForAgent(await listBacklogViews(), 25, forWho || undefined), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  const all = await listBacklogViews()
  const counts = {
    todo: all.filter((v) => v.status === "todo").length,
    doing: all.filter((v) => v.status === "doing").length,
    blocked: all.filter((v) => v.status === "blocked" || v.cascadeBlocked).length,
    done: all.filter((v) => v.status === "done").length,
    cancelled: all.filter((v) => v.status === "cancelled").length,
    criticalOpen: all.filter(
      (v) => v.onCriticalPath && v.status !== "done" && v.status !== "cancelled",
    ).length,
    total: all.length,
    grokOpen: all.filter(
      (v) => v.assignee === "grok" && v.status !== "done" && v.status !== "cancelled",
    ).length,
    geminiOpen: all.filter(
      (v) => v.assignee === "gemini" && v.status !== "done" && v.status !== "cancelled",
    ).length,
    pairOpen: all.filter(
      (v) => v.assignee === "pair" && v.status !== "done" && v.status !== "cancelled",
    ).length,
  }

  return NextResponse.json({
    source: "repo",
    note: "catalog.ts + backlog-status.json · assignee: grok|gemini|pair|human · lifecycle comercial→postventa",
    counts,
    waves: waveSummary(all),
    assignees: assigneeSummary(all),
    lifecycles: lifecycleSummary(all),
    edges: cascadeEdges(all),
    next: nextActionableTickets(all, 8),
    nextGrok: nextActionableTickets(
      all.filter((v) => v.assignee === "grok" || v.assignee === "pair"),
      6,
    ),
    nextGemini: nextActionableTickets(
      all.filter((v) => v.assignee === "gemini" || v.assignee === "pair"),
      6,
    ),
    tickets: views,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  if (!canManageUsers(auth.auth.rol)) {
    return NextResponse.json(
      { error: "Solo admin/dueño puede cambiar estados del backlog de ingeniería" },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const updated = await setTicketStatus({
      id: parsed.data.id,
      status: parsed.data.status,
      note: parsed.data.note,
      updatedBy: auth.auth.email,
    })
    if (!updated) {
      return NextResponse.json({ error: "Ticket no encontrado en catálogo" }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      ticket: updated,
      reminder:
        "Commiteá docs/engineering/backlog-status.json para que Grok Build vea el cambio en la próxima sesión.",
    })
  } catch (err) {
    console.error("[engineering/backlog] PATCH", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo escribir backlog-status.json (¿filesystem read-only?)",
      },
      { status: 500 },
    )
  }
}

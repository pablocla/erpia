/**
 * Servicio de backlog de ingeniería.
 * Definiciones: catalog · Estados: backlog-status.json · Cascada: DAG blockedBy
 */

import { promises as fs } from "fs"
import path from "path"
import { PRODUCT_BACKLOG_CATALOG } from "./product-backlog-catalog"
import {
  ASSIGNEE_META,
  BACKLOG_WAVES,
  LIFECYCLE_META,
  type BacklogAssignee,
  type BacklogStatus,
  type BacklogStatusEntry,
  type BacklogStatusFile,
  type BacklogTicketView,
  type BacklogWave,
} from "./product-backlog-types"

const STATUS_REL = path.join("docs", "engineering", "backlog-status.json")

function statusFilePath(): string {
  return path.join(process.cwd(), STATUS_REL)
}

function emptyStatusFile(): BacklogStatusFile {
  return { version: 1, statuses: {}, updatedAt: new Date().toISOString() }
}

export async function loadStatusFile(): Promise<BacklogStatusFile> {
  try {
    const raw = await fs.readFile(statusFilePath(), "utf8")
    const parsed = JSON.parse(raw) as BacklogStatusFile
    if (!parsed || parsed.version !== 1 || typeof parsed.statuses !== "object") {
      return emptyStatusFile()
    }
    return parsed
  } catch {
    return emptyStatusFile()
  }
}

export async function saveStatusFile(data: BacklogStatusFile): Promise<void> {
  const dir = path.dirname(statusFilePath())
  await fs.mkdir(dir, { recursive: true })
  const payload: BacklogStatusFile = {
    ...data,
    version: 1,
    updatedAt: new Date().toISOString(),
  }
  await fs.writeFile(statusFilePath(), JSON.stringify(payload, null, 2) + "\n", "utf8")
}

function resolveStatus(
  id: string,
  defaultStatus: BacklogStatus | undefined,
  file: BacklogStatusFile,
): { status: BacklogStatus; entry?: BacklogStatusEntry } {
  const entry = file.statuses[id]
  return {
    status: entry?.status ?? defaultStatus ?? "todo",
    entry,
  }
}

/** Profundidad en el DAG (memo) */
function computeDepths(): Map<string, number> {
  const byId = new Map(PRODUCT_BACKLOG_CATALOG.map((t) => [t.id, t]))
  const memo = new Map<string, number>()
  const visiting = new Set<string>()

  function depth(id: string): number {
    if (memo.has(id)) return memo.get(id)!
    if (visiting.has(id)) return 0 // ciclo
    visiting.add(id)
    const t = byId.get(id)
    if (!t?.blockedBy?.length) {
      memo.set(id, 0)
      visiting.delete(id)
      return 0
    }
    const d = 1 + Math.max(...t.blockedBy.map((p) => depth(p)))
    memo.set(id, d)
    visiting.delete(id)
    return d
  }

  for (const t of PRODUCT_BACKLOG_CATALOG) depth(t.id)
  return memo
}

/** Critical path: tickets en cadena hacia ED-13 o ED-04 (valor pesos) */
function computeCriticalPath(doneIds: Set<string>): Set<string> {
  const targets = ["ED-13", "ED-04", "ED-09"]
  const byId = new Map(PRODUCT_BACKLOG_CATALOG.map((t) => [t.id, t]))
  const path = new Set<string>()

  function walk(id: string) {
    if (path.has(id)) return
    path.add(id)
    const t = byId.get(id)
    for (const p of t?.blockedBy ?? []) walk(p)
  }

  for (const target of targets) {
    if (byId.has(target)) walk(target)
  }

  // Si target done, aún mostrar path histórico
  void doneIds
  return path
}

export async function listBacklogViews(filters?: {
  status?: BacklogStatus
  priority?: string
  epic?: string
  wave?: string
  assignee?: string
  lifecycle?: string
  q?: string
  onlyCritical?: boolean
}): Promise<BacklogTicketView[]> {
  const statusFile = await loadStatusFile()
  const depths = computeDepths()

  const statusById = new Map<string, BacklogStatus>()
  for (const t of PRODUCT_BACKLOG_CATALOG) {
    statusById.set(t.id, resolveStatus(t.id, t.defaultStatus, statusFile).status)
  }
  const doneIds = new Set(
    [...statusById.entries()].filter(([, s]) => s === "done").map(([id]) => id),
  )
  const critical = computeCriticalPath(doneIds)

  const orderStatus: Record<BacklogStatus, number> = {
    doing: 0,
    blocked: 1,
    todo: 2,
    done: 3,
    cancelled: 4,
  }
  const orderP: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
  const orderWave: Record<string, number> = { W0: 0, W1: 1, W2: 2, W3: 3, W4: 4 }

  let views: BacklogTicketView[] = PRODUCT_BACKLOG_CATALOG.map((t) => {
    const { status, entry } = resolveStatus(t.id, t.defaultStatus, statusFile)
    const missing = (t.blockedBy ?? []).filter((id) => !doneIds.has(id))
    const prereqTotal = t.blockedBy?.length ?? 0
    const prereqDone = prereqTotal - missing.length
    return {
      ...t,
      status,
      statusNote: entry?.note,
      statusUpdatedAt: entry?.updatedAt,
      statusUpdatedBy: entry?.updatedBy,
      cascadeBlocked: missing.length > 0 && status !== "done" && status !== "cancelled",
      cascadeBlockedBy: missing,
      cascadeDepth: depths.get(t.id) ?? 0,
      onCriticalPath: critical.has(t.id),
      prereqProgress: prereqTotal === 0 ? 1 : prereqDone / prereqTotal,
    }
  })

  if (filters?.status) views = views.filter((v) => v.status === filters.status)
  if (filters?.priority) views = views.filter((v) => v.priority === filters.priority)
  if (filters?.epic) views = views.filter((v) => v.epic === filters.epic)
  if (filters?.wave) views = views.filter((v) => v.wave === filters.wave)
  if (filters?.assignee) views = views.filter((v) => v.assignee === filters.assignee)
  if (filters?.lifecycle) views = views.filter((v) => v.lifecycle === filters.lifecycle)
  if (filters?.onlyCritical) views = views.filter((v) => v.onCriticalPath)
  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase()
    views = views.filter(
      (v) =>
        v.id.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.assignee.includes(q) ||
        v.lifecycle.includes(q) ||
        v.tags?.some((tag) => tag.includes(q)),
    )
  }

  return views.sort((a, b) => {
    const dw = orderWave[a.wave] - orderWave[b.wave]
    if (dw !== 0) return dw
    const ds = orderStatus[a.status] - orderStatus[b.status]
    if (ds !== 0) return ds
    const dp = orderP[a.priority] - orderP[b.priority]
    if (dp !== 0) return dp
    return a.cascadeDepth - b.cascadeDepth || a.id.localeCompare(b.id)
  })
}

export async function setTicketStatus(input: {
  id: string
  status: BacklogStatus
  note?: string
  updatedBy?: string
}): Promise<BacklogTicketView | null> {
  const ticket = PRODUCT_BACKLOG_CATALOG.find(
    (t) => t.id.toUpperCase() === input.id.toUpperCase(),
  )
  if (!ticket) return null

  const file = await loadStatusFile()
  const entry: BacklogStatusEntry = {
    status: input.status,
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy,
    note: input.note,
  }
  file.statuses[ticket.id] = entry
  await saveStatusFile(file)

  const views = await listBacklogViews()
  return views.find((v) => v.id === ticket.id) ?? null
}

export function nextActionableTickets(views: BacklogTicketView[], limit = 5): BacklogTicketView[] {
  return views
    .filter((v) => v.status === "todo" || v.status === "doing")
    .filter((v) => !v.cascadeBlocked)
    .filter((v) => v.priority === "P0" || v.priority === "P1" || v.status === "doing")
    .slice(0, limit)
}

export function waveSummary(views: BacklogTicketView[]) {
  return BACKLOG_WAVES.map((w) => {
    const items = views.filter((v) => v.wave === w.id)
    const done = items.filter((v) => v.status === "done").length
    const open = items.filter((v) => v.status !== "done" && v.status !== "cancelled").length
    const total = items.length
    return {
      ...w,
      total,
      done,
      open,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      criticalOpen: items.filter(
        (v) => v.onCriticalPath && v.status !== "done" && v.status !== "cancelled",
      ).length,
    }
  })
}

export function cascadeEdges(views: BacklogTicketView[]) {
  const ids = new Set(views.map((v) => v.id))
  const edges: Array<{ from: string; to: string; satisfied: boolean }> = []
  for (const v of views) {
    for (const from of v.blockedBy ?? []) {
      if (!ids.has(from) && !PRODUCT_BACKLOG_CATALOG.some((t) => t.id === from)) continue
      edges.push({
        from,
        to: v.id,
        satisfied: v.status === "done" || !v.cascadeBlockedBy.includes(from),
      })
    }
  }
  return edges
}

export function assigneeSummary(views: BacklogTicketView[]) {
  const keys: BacklogAssignee[] = ["grok", "gemini", "pair", "human"]
  return keys.map((a) => {
    const items = views.filter((v) => v.assignee === a)
    const open = items.filter((v) => v.status !== "done" && v.status !== "cancelled")
    const actionable = open.filter((v) => !v.cascadeBlocked)
    return {
      assignee: a,
      ...ASSIGNEE_META[a],
      total: items.length,
      open: open.length,
      done: items.filter((v) => v.status === "done").length,
      actionable: actionable.length,
      next: actionable
        .filter((v) => v.priority === "P0" || v.priority === "P1")
        .slice(0, 5)
        .map((t) => ({ id: t.id, title: t.title, priority: t.priority, wave: t.wave })),
    }
  })
}

export function lifecycleSummary(views: BacklogTicketView[]) {
  return Object.entries(LIFECYCLE_META)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id, meta]) => {
      const items = views.filter((v) => v.lifecycle === id)
      const done = items.filter((v) => v.status === "done").length
      return {
        id,
        label: meta.label,
        total: items.length,
        done,
        open: items.filter((v) => v.status !== "done" && v.status !== "cancelled").length,
        percent: items.length ? Math.round((done / items.length) * 100) : 0,
      }
    })
    .filter((r) => r.total > 0)
}

export function formatBacklogForAgent(
  views: BacklogTicketView[],
  limit = 20,
  forAssignee?: BacklogAssignee,
): string {
  const scoped = forAssignee ? views.filter((v) => v.assignee === forAssignee || v.assignee === "pair") : views
  const open = scoped.filter((v) => v.status !== "done" && v.status !== "cancelled")
  const waves = waveSummary(views)
  const who = forAssignee ? ASSIGNEE_META[forAssignee].label : "ALL"
  const lines = [
    `# Product Engineering Backlog — ${who}`,
    `Repo source · no DB · Abiertos: ${open.length}`,
    "",
    "## Criterio assignee",
    "- GROK: código monorepo, APIs, tests, runtime",
    "- GEMINI: docs, copy, auditorías, playbooks, matrices QA",
    "- PAIR: Gemini spec → Grok code",
    "- HUMAN: precio, piloto, legal",
    "",
    "## Cascada olas",
    ...waves.map((w) => `- ${w.id}: ${w.done}/${w.total} (${w.percent}%)`),
    "",
    `## Cola ${who} desbloqueada`,
    ...nextActionableTickets(
      scoped.filter((v) => !forAssignee || v.assignee === forAssignee || (forAssignee === "grok" && v.assignee === "pair")),
      12,
    ).map(
      (t) =>
        `- [${t.assignee}] ${t.id} ${t.priority} ${t.wave} ${t.lifecycle} — ${t.title}`,
    ),
    "",
    "## Tabla abiertos",
    "| ID | Who | Life | Wave | Pri | Status | Title |",
    "|----|-----|------|------|-----|--------|-------|",
    ...open.slice(0, limit).map(
      (t) =>
        `| ${t.id} | ${t.assignee} | ${t.lifecycle} | ${t.wave} | ${t.priority} | ${t.status}${t.cascadeBlocked ? " 🔒" : ""} | ${t.title} |`,
    ),
  ]
  return lines.join("\n")
}

export { BACKLOG_WAVES, ASSIGNEE_META, LIFECYCLE_META }
export type { BacklogWave, BacklogAssignee }

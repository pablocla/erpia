import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  leavePresence,
  listPresence,
  upsertPresence,
} from "@/lib/presence/presence-store"

const bodySchema = z.object({
  action: z.enum(["heartbeat", "leave"]).default("heartbeat"),
  resourceType: z.string().min(1).max(64),
  resourceId: z.string().min(1).max(128),
  isEditing: z.boolean().optional(),
  nombre: z.string().max(120).optional(),
  avatarUrl: z.string().max(500).optional().nullable(),
})

/**
 * GET /api/presence?resourceType=caja&resourceId=1
 * Lista peers activos en el recurso (multi-terminal).
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const resourceType = searchParams.get("resourceType") ?? ""
  const resourceId = searchParams.get("resourceId") ?? ""

  if (!resourceType || !resourceId) {
    return NextResponse.json(
      { error: "resourceType y resourceId requeridos" },
      { status: 400 },
    )
  }

  const peers = listPresence({
    empresaId: auth.auth.empresaId,
    resourceType,
    resourceId,
    excludeUserId: String(auth.auth.userId),
  })

  return NextResponse.json({
    peers: peers.map((p) => ({
      userId: p.userId,
      nombre: p.nombre,
      avatarUrl: p.avatarUrl,
      lastActive: p.lastActive,
      isEditing: p.isEditing,
    })),
  })
}

/**
 * POST /api/presence — heartbeat o leave
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { action, resourceType, resourceId, isEditing, nombre, avatarUrl } = parsed.data
  const userId = String(auth.auth.userId)

  if (action === "leave") {
    leavePresence({
      empresaId: auth.auth.empresaId,
      resourceType,
      resourceId,
      userId,
    })
    return NextResponse.json({ ok: true })
  }

  upsertPresence({
    empresaId: auth.auth.empresaId,
    resourceType,
    resourceId,
    userId,
    nombre: nombre?.trim() || auth.auth.email || "Usuario",
    avatarUrl: avatarUrl ?? undefined,
    lastActive: new Date().toISOString(),
    isEditing: Boolean(isEditing),
  })

  const peers = listPresence({
    empresaId: auth.auth.empresaId,
    resourceType,
    resourceId,
    excludeUserId: userId,
  })

  return NextResponse.json({
    ok: true,
    peers: peers.map((p) => ({
      userId: p.userId,
      nombre: p.nombre,
      avatarUrl: p.avatarUrl,
      lastActive: p.lastActive,
      isEditing: p.isEditing,
    })),
  })
}

import { NextRequest, NextResponse } from "next/server"
import { trackPageView, trackFunnelStep, type FunnelId } from "@/lib/analytics/tracking-service"

/**
 * POST /api/analytics/track
 * Receives pageview and funnel events from the client-side tracker.
 * No auth required — anonymous visitors must be tracked too.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, sessionId } = body

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId requerido" }, { status: 400 })
    }

    if (type === "pageview") {
      await trackPageView({
        sessionId,
        empresaId: body.empresaId ?? null,
        usuarioId: body.usuarioId ?? null,
        path: body.path ?? "/",
        referrer: body.referrer ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
        evento: "pageview",
        metadata: body.metadata ?? null,
      })
      return NextResponse.json({ ok: true })
    }

    if (type === "duration") {
      await trackPageView({
        sessionId,
        path: body.path ?? "/",
        duracionMs: body.duracionMs ?? null,
        evento: "duration",
      })
      return NextResponse.json({ ok: true })
    }

    if (type === "funnel") {
      await trackFunnelStep({
        sessionId,
        empresaId: body.empresaId ?? null,
        usuarioId: body.usuarioId ?? null,
        funnelId: body.funnelId as FunnelId,
        stepName: body.stepName,
      })
      return NextResponse.json({ ok: true })
    }

    if (type === "event") {
      await trackPageView({
        sessionId,
        empresaId: body.empresaId ?? null,
        usuarioId: body.usuarioId ?? null,
        path: body.path ?? "/",
        evento: body.evento ?? "custom",
        metadata: body.metadata ?? null,
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Tipo de evento no soportado" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Error procesando evento" }, { status: 500 })
  }
}

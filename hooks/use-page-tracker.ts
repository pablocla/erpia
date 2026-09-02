"use client"

/**
 * Client-side hook para trackear pageviews automáticamente.
 * Registra cada navegación y envía duración al salir de la página.
 */

import { useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"

function getSessionId(): string {
  if (typeof window === "undefined") return ""
  let sid = sessionStorage.getItem("clv_sid")
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem("clv_sid", sid)
  }
  return sid
}

function getAuthContext() {
  if (typeof window === "undefined") return { empresaId: null, usuarioId: null }
  try {
    const token = localStorage.getItem("token")
    if (!token) return { empresaId: null, usuarioId: null }
    const payload = JSON.parse(atob(token.split(".")[1]))
    return {
      empresaId: payload.empresaId ?? null,
      usuarioId: payload.usuarioId ?? payload.sub ?? null,
    }
  } catch {
    return { empresaId: null, usuarioId: null }
  }
}

async function sendTrackEvent(data: Record<string, unknown>) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true, // Important for beforeunload
    })
  } catch {
    // Non-blocking
  }
}

export function usePageTracker() {
  const pathname = usePathname()
  const enterTime = useRef<number>(Date.now())
  const lastPath = useRef<string>("")

  const trackPageview = useCallback((path: string) => {
    const sessionId = getSessionId()
    if (!sessionId) return
    const { empresaId, usuarioId } = getAuthContext()

    sendTrackEvent({
      type: "pageview",
      sessionId,
      empresaId,
      usuarioId,
      path,
      referrer: document.referrer || null,
      metadata: {
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        language: navigator.language,
        utmSource: new URLSearchParams(window.location.search).get("utm_source"),
        utmMedium: new URLSearchParams(window.location.search).get("utm_medium"),
        utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign"),
      },
    })
  }, [])

  const sendDuration = useCallback(() => {
    if (!lastPath.current) return
    const dur = Date.now() - enterTime.current
    if (dur < 500) return // Skip too-fast navigations
    const sessionId = getSessionId()

    sendTrackEvent({
      type: "duration",
      sessionId,
      path: lastPath.current,
      duracionMs: dur,
    })
  }, [])

  useEffect(() => {
    // Send duration for previous page
    if (lastPath.current && lastPath.current !== pathname) {
      sendDuration()
    }

    // Track new pageview
    enterTime.current = Date.now()
    lastPath.current = pathname
    trackPageview(pathname)
  }, [pathname, trackPageview, sendDuration])

  // Send duration on tab close
  useEffect(() => {
    const handleBeforeUnload = () => sendDuration()
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [sendDuration])
}

/**
 * Track a custom funnel step from client code.
 * Usage: trackFunnel("adquisicion", "click_register")
 */
export function trackFunnel(funnelId: string, stepName: string) {
  const sessionId = getSessionId()
  if (!sessionId) return
  const { empresaId, usuarioId } = getAuthContext()

  sendTrackEvent({
    type: "funnel",
    sessionId,
    empresaId,
    usuarioId,
    funnelId,
    stepName,
  })
}

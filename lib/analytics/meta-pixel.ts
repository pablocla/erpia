export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "CompleteRegistration"
  | "StartTrial"

type MetaFbq = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    fbq?: MetaFbq
    __claverMetaPixelInitialized?: boolean
  }
}

export function trackMetaEvent(
  eventName: Exclude<MetaEventName, "PageView" | "ViewContent">,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.fbq) return
  const method = eventName === "StartTrial" ? "trackCustom" : "track"
  window.fbq(method, eventName, params)
}

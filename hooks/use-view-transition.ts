import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useUIStore } from "@/lib/stores/ui-store"

/* ═══════════════════════════════════════════════════════════════════════════
   useViewTransitionRouter — Navigate with View Transitions API
   Falls back to normal navigation when API is not available.
   Also tracks navigation in the UI store's recentPages.
   ═══════════════════════════════════════════════════════════════════════════ */

export function useViewTransitionRouter() {
  const router = useRouter()
  const addRecentPage = useUIStore((s) => s.addRecentPage)

  const push = useCallback(
    (href: string, label?: string) => {
      if (label) addRecentPage(href, label)

      if (typeof document !== "undefined" && "startViewTransition" in document) {
        ;(document as any).startViewTransition(() => {
          router.push(href)
        })
      } else {
        router.push(href)
      }
    },
    [router, addRecentPage],
  )

  return { push, back: router.back, refresh: router.refresh }
}

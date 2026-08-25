"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Drama } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasPreviewHome, peekPreviewMeta, restorePreviewHome } from "@/lib/auth/preview-session-client"
import { PREVIEW_OPEN_EVENT } from "@/lib/auth/preview-experience-catalog"
import { useAuthStore } from "@/lib/stores/auth-store"

export function PreviewExperienceBanner() {
  const token = useAuthStore((s) => s.token)
  const [visible, setVisible] = useState(false)
  const [label, setLabel] = useState<string>("otra experiencia")

  useEffect(() => {
    if (!hasPreviewHome()) {
      setVisible(false)
      return
    }
    setVisible(true)
    const meta = peekPreviewMeta(token)
    if (meta?.label) setLabel(meta.label)
    else if (typeof window !== "undefined") {
      const path = window.location.pathname
      if (path.startsWith("/dashboard")) setLabel("el ERP (demo / actor)")
    }
  }, [token])

  if (!visible) return null

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-violet-400/40 bg-violet-500/15 px-4 py-2 text-sm">
      <div className="flex items-center gap-2 text-violet-950 dark:text-violet-100">
        <Drama className="h-4 w-4 shrink-0" />
        <span>
          Estás viviendo la experiencia de <strong>{label}</strong>
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => window.dispatchEvent(new Event(PREVIEW_OPEN_EVENT))}
        >
          Cambiar actor / rubro
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
          onClick={() => {
            if (!restorePreviewHome()) window.location.href = "/claver-cloud"
          }}
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          Volver al admin
        </Button>
      </div>
    </div>
  )
}

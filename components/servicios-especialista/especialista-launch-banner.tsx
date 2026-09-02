"use client"

import { useEffect, useState } from "react"
import { Headphones, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SolicitarEspecialistaModal } from "@/components/servicios-especialista/solicitar-especialista-modal"

const DISMISS_KEY = "claver_especialista_banner_dismissed"

export function EspecialistaLaunchBanner({ forceOpen = false }: { forceOpen?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (forceOpen) {
      setVisible(true)
      return
    }
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return
      const fresh = localStorage.getItem("claver_fresh_signup") === "1"
      const seen = sessionStorage.getItem("claver_especialista_seen") === "1"
      if (fresh || !seen) setVisible(true)
      sessionStorage.setItem("claver_especialista_seen", "1")
    } catch {
      setVisible(true)
    }
  }, [forceOpen])

  if (!visible) return null

  return (
    <>
      <div className="mb-3 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-background to-transparent px-3 py-2.5 flex items-start gap-3">
        <Headphones className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">¿Querés que te lo dejemos listo?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            1 hora de puesta a punto: $35.000. Alcance cerrado, pago por Mercado Pago. El resto del sistema sigue gratis.
          </p>
          <Button
            size="sm"
            className="mt-2 h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={() => setModalOpen(true)}
          >
            Ver packs 1 a 1
          </Button>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Cerrar"
          onClick={() => {
            setVisible(false)
            try {
              localStorage.setItem(DISMISS_KEY, "1")
            } catch {
              /* ignore */
            }
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <SolicitarEspecialistaModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}

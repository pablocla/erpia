"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileEdit, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { contarVentasSuspendidas, POS_SUSPENDIDAS_KEY } from "@/lib/pos/ventas-suspendidas"

const POS_DRAFT_KEY = "erp:pos:draft:v1"
const ROLES_DRAFT = new Set(["cajero", "vendedor", "vendedor_ruta", "gerente", "dueno", "admin"])

export function DraftAlert() {
  const rol = useAuthStore((s) => s.user?.rol ?? "")
  const [suspendidas, setSuspendidas] = useState(0)
  const [posDraft, setPosDraft] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!ROLES_DRAFT.has(rol)) return

    const refresh = () => {
      setSuspendidas(contarVentasSuspendidas())
      try {
        const raw = localStorage.getItem(POS_DRAFT_KEY)
        setPosDraft(!!raw && raw !== "{}")
      } catch {
        setPosDraft(false)
      }
    }

    refresh()
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === POS_SUSPENDIDAS_KEY || e.key === POS_DRAFT_KEY) refresh()
    }
    window.addEventListener("storage", onStorage)
    const interval = setInterval(refresh, 30_000)
    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [rol])

  if (!ROLES_DRAFT.has(rol) || dismissed) return null

  const total = suspendidas + (posDraft ? 1 : 0)
  if (total === 0) return null

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <FileEdit className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm">Borradores pendientes ({total})</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          {suspendidas > 0 && `${suspendidas} venta(s) suspendida(s) en POS`}
          {suspendidas > 0 && posDraft && " · "}
          {posDraft && "carrito POS sin finalizar"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link href="/dashboard/pos">Continuar en POS</Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setDismissed(true)}
            aria-label="Ocultar alerta"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
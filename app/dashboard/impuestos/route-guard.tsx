"use client"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

const BLOCKED_PATHS_NO_AFIP = [
  "/dashboard/impuestos/padron",
  "/dashboard/impuestos/iibb",
  "/dashboard/impuestos/presentacion",
  "/dashboard/impuestos/citi",
  "/dashboard/impuestos/sicore"
]

export function FiscalRouteGuard({ showAfip }: { showAfip: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!showAfip) {
      if (BLOCKED_PATHS_NO_AFIP.some(p => pathname.startsWith(p))) {
        toast({ title: "Acceso denegado", description: "Módulo fiscal no habilitado para este país", variant: "destructive" })
        router.replace("/dashboard/impuestos")
      }
    }
  }, [pathname, showAfip, router, toast])

  return null
}

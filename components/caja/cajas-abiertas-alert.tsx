"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"

interface CajaAbierta {
  id: number
  fecha: string
  turno?: string | null
}

const ROLES_ALERTA = new Set(["gerente", "dueno", "admin"])
const HORAS_LIMITE = 12

export function CajasAbiertasAlert() {
  const rol = useAuthStore((s) => s.user?.rol ?? "")
  const token = useAuthStore((s) => s.token)
  const [cajasViejas, setCajasViejas] = useState<CajaAbierta[]>([])

  useEffect(() => {
    if (!token || !ROLES_ALERTA.has(rol)) return

    const cargar = async () => {
      try {
        const res = await fetch("/api/caja?estado=abierta", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as CajaAbierta[]
        const limite = Date.now() - HORAS_LIMITE * 60 * 60 * 1000
        const viejas = (Array.isArray(data) ? data : []).filter(
          (c) => new Date(c.fecha).getTime() < limite
        )
        setCajasViejas(viejas)
      } catch {
        /* silencioso */
      }
    }

    void cargar()
    const interval = setInterval(() => void cargar(), 5 * 60_000)
    return () => clearInterval(interval)
  }, [token, rol])

  if (!ROLES_ALERTA.has(rol) || cajasViejas.length === 0) return null

  return (
    <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="flex items-center gap-2 text-sm">
        <Clock className="h-3.5 w-3.5" />
        {cajasViejas.length} caja(s) abierta(s) hace más de {HORAS_LIMITE} h
      </AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>Cerrá o arqueá los turnos vencidos para evitar diferencias de caja.</span>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs shrink-0">
          <Link href="/dashboard/caja">Ver cajas</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
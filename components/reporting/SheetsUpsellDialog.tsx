"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type SheetsPlan = {
  sku: string
  nombre: string
  descripcion: string
  precioArs: number
  tier: "lite" | "pro"
}

type UpsellReason =
  | "module_not_entitled"
  | "usage_execute_exceeded"
  | "usage_export_exceeded"
  | "saved_reports_exceeded"

function reasonMessage(reason?: UpsellReason): string {
  switch (reason) {
    case "usage_execute_exceeded":
      return "Alcanzaste el límite de consultas de tu plan este mes."
    case "usage_export_exceeded":
      return "Alcanzaste el límite de exports Excel de tu plan este mes."
    case "saved_reports_exceeded":
      return "Tu plan permite un máximo de reportes guardados."
    default:
      return "Clav Sheets es un add-on de reporting pivot y Excel profesional."
  }
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

export function SheetsUpsellDialog({
  open,
  onOpenChange,
  reason,
  plans,
  isAdmin,
  onActivated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: UpsellReason
  plans: SheetsPlan[]
  isAdmin?: boolean
  onActivated?: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function activate(action: "trial" | "activate", sku: string, tier: "lite" | "pro") {
    setLoading(sku)
    setError(null)
    try {
      const res = await fetch("/api/reporting/entitlement", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action, sku, tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo activar")
      onOpenChange(false)
      onActivated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Activá Clav Sheets
          </DialogTitle>
          <DialogDescription>{reasonMessage(reason)}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {plans.map((plan) => (
            <div
              key={plan.sku}
              className={cn(
                "rounded-lg border p-4 space-y-2",
                plan.tier === "pro" && "border-primary/40 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {plan.nombre}
                    {plan.tier === "pro" && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Sparkles className="h-3 w-3 mr-0.5" />
                        Recomendado
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.descripcion}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums shrink-0">
                  ${plan.precioArs.toLocaleString("es-AR")}
                  <span className="text-[10px] font-normal text-muted-foreground">/mes</span>
                </p>
              </div>
              {isAdmin ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={plan.tier === "pro" ? "default" : "outline"}
                    disabled={!!loading}
                    onClick={() => activate("trial", plan.sku, plan.tier)}
                  >
                    {loading === plan.sku ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : null}
                    Trial 14 días
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!!loading}
                    onClick={() => activate("activate", plan.sku, plan.tier)}
                  >
                    Activar plan
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Pedile a un administrador que active el add-on desde Configuración.
                </p>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}

export function SheetsLockedState({
  reason,
  plans,
  isAdmin,
  onActivated,
}: {
  reason?: UpsellReason
  plans: SheetsPlan[]
  isAdmin?: boolean
  onActivated?: () => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1 max-w-md">
        <h2 className="text-lg font-semibold">Clav Sheets no está activo</h2>
        <p className="text-sm text-muted-foreground">{reasonMessage(reason)}</p>
      </div>
      {isAdmin && (
        <Button onClick={() => setOpen(true)}>Ver planes y activar trial</Button>
      )}
      <SheetsUpsellDialog
        open={open}
        onOpenChange={setOpen}
        reason={reason}
        plans={plans}
        isAdmin={isAdmin}
        onActivated={onActivated}
      />
    </div>
  )
}
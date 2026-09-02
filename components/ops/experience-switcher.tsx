"use client"

import { useCallback, useEffect, useState } from "react"
import { Drama, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/lib/stores/auth-store"
import { authFetch } from "@/lib/stores/auth-store"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import {
  canSeeActoresButton,
  listPreviewActors,
  listPreviewRubros,
  PREVIEW_OPEN_EVENT,
} from "@/lib/auth/preview-experience-catalog"
import {
  applySessionAndGo,
  stashPreviewHomeIfNeeded,
} from "@/lib/auth/preview-session-client"
import { launchIndustryDemo } from "@/components/onboarding/launch-industry-demo"
import { cn } from "@/lib/utils"

type ExperienceSwitcherProps = {
  /** Always show (Cloud). If false, only admin/analista. */
  forceShow?: boolean
  className?: string
}

export function ExperienceSwitcher({ forceShow = false, className }: ExperienceSwitcherProps) {
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const { data: analystData } = useAuthFetch<{ isAnalyst?: boolean }>("/api/claver/analista/status")
  const isAnalyst = Boolean(analystData?.isAnalyst)
  const canRoles = canSeeActoresButton({
    forceShow,
    isAnalyst,
    rol: isHydrated ? user?.rol : null,
  })
  const canRubros = Boolean(forceShow || isAnalyst)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!canRoles) {
      setOpen(false)
      return
    }
    const onOpen = () => setOpen(true)
    window.addEventListener(PREVIEW_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(PREVIEW_OPEN_EVENT, onOpen)
  }, [canRoles])

  const enterRol = useCallback(async (rol: string) => {
    setError("")
    setLoading(`rol:${rol}`)
    try {
      stashPreviewHomeIfNeeded()
      const res = await authFetch("/api/auth/preview-experience", {
        method: "POST",
        body: JSON.stringify({ kind: "rol", rol }),
      })
      const data = await res.json()
      if (!res.ok || !data.success || !data.token || !data.usuario) {
        throw new Error(data.error ?? "No se pudo abrir esa experiencia")
      }
      applySessionAndGo(data.token, data.usuario, data.redirectUrl || "/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar de actor")
      setLoading(null)
    }
  }, [])

  const enterRubro = useCallback(async (industryId: string) => {
    setError("")
    setLoading(`rubro:${industryId}`)
    try {
      stashPreviewHomeIfNeeded()
      const dest = await launchIndustryDemo(industryId, (token, usuario) => {
        useAuthStore.getState().login(token, {
          id: String(usuario.id),
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          empresaId: usuario.empresaId,
        })
      })
      window.location.assign(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al armar la demo del rubro")
      setLoading(null)
    }
  }, [])

  if (!canRoles) return null

  const actors = listPreviewActors()
  const rubros = listPreviewRubros()
  const busy = !!loading

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1.5 text-xs border-violet-300/60 text-violet-700 hover:bg-violet-500/10 hover:text-violet-800 dark:text-violet-300",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Drama className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Probar como</span>
        <span className="sm:hidden">Actores</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vivir la experiencia</DialogTitle>
            <DialogDescription>
              Entrá como un rol del local o como un rubro. Cuando quieras, volvé al admin con el
              banner violeta.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="actores">
            <TabsList>
              <TabsTrigger value="actores">Actores (roles)</TabsTrigger>
              {canRubros && <TabsTrigger value="rubros">Rubros</TabsTrigger>}
            </TabsList>

            <TabsContent value="actores">
              <ScrollArea className="h-[min(24rem,55vh)] pr-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {actors.map((actor) => {
                    const key = `rol:${actor.codigo}`
                    return (
                      <button
                        key={actor.codigo}
                        type="button"
                        disabled={busy}
                        onClick={() => void enterRol(actor.codigo)}
                        className={cn(
                          "rounded-lg border bg-card p-3 text-left transition hover:border-violet-400/70 hover:bg-violet-500/5 disabled:opacity-60",
                          loading === key && "ring-1 ring-violet-400",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{actor.nombre}</p>
                          {loading === key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{actor.tagline}</p>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {canRubros && (
              <TabsContent value="rubros">
                <p className="text-xs text-muted-foreground mb-2">
                  Arma una empresa demo del rubro (puede tardar unos segundos). Tu sesión de admin
                  queda guardada para volver.
                </p>
                <ScrollArea className="h-[min(24rem,55vh)] pr-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {rubros.map((rubro) => {
                      const key = `rubro:${rubro.id}`
                      return (
                        <button
                          key={rubro.id}
                          type="button"
                          disabled={busy}
                          onClick={() => void enterRubro(rubro.id)}
                          className={cn(
                            "rounded-lg border bg-card p-3 text-left transition hover:border-violet-400/70 hover:bg-violet-500/5 disabled:opacity-60",
                            loading === key && "ring-1 ring-violet-400",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              <span className="mr-1">{rubro.emoji}</span>
                              {rubro.label}
                            </p>
                            {loading === key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{rubro.tagline}</p>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  )
}

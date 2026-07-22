"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authFetch } from "@/lib/stores"
import { Bot, Loader2, Play } from "lucide-react"

type CatalogItem = {
  code: string
  nombre: string
  lema: string
  descripcion: string
  sku: string
  precioArs: number
  dashboardPath: string
}

type Instancia = {
  id: number
  code: string
  nombre: string
  lema?: string | null
  estado: string
  sku: string
  lastRunAt?: string | null
  runsTotal: number
  tokensMes: number
  accionesMes: number
  dashboardPath: string
}

export default function EmpleadosDigitalesPage() {
  const [catalogo, setCatalogo] = useState<CatalogItem[]>([])
  const [instancias, setInstancias] = useState<Instancia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activating, setActivating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/empleados-digitales")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al cargar")
        return
      }
      setCatalogo(data.catalogo || [])
      setInstancias(data.instancias || [])
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activar = async (code: string) => {
    setActivating(code)
    setError("")
    try {
      const res = await authFetch("/api/empleados-digitales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo activar")
        return
      }
      await load()
    } finally {
      setActivating(null)
    }
  }

  const byCode = new Map(instancias.map((i) => [i.code, i]))

  return (
    <PageShell>
      <PageHeader
        title="Empleados digitales"
        description="Equipos híbridos: reglas deterministas + LLM solo cuando hace falta. Menos tokens, más cobranza."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {catalogo.map((t) => {
            const inst = byCode.get(t.code)
            return (
              <Card key={t.code}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{t.nombre}</CardTitle>
                        <CardDescription>{t.lema}</CardDescription>
                      </div>
                    </div>
                    {inst ? (
                      <Badge variant={inst.estado === "activo" || inst.estado === "trial" ? "default" : "secondary"}>
                        {inst.estado}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No activado</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t.descripcion}</p>
                  <p className="text-sm font-medium">
                    Desde ${t.precioArs.toLocaleString("es-AR")} / mes · SKU {t.sku}
                  </p>
                  {inst && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted p-2">
                        <div className="font-semibold">{inst.runsTotal}</div>
                        <div className="text-muted-foreground">corridas</div>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <div className="font-semibold">{inst.accionesMes}</div>
                        <div className="text-muted-foreground">acciones/mes</div>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <div className="font-semibold">{inst.tokensMes}</div>
                        <div className="text-muted-foreground">tokens/mes</div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {inst ? (
                      <Button asChild>
                        <Link href={inst.dashboardPath}>
                          <Play className="h-4 w-4 mr-2" />
                          Abrir panel
                        </Link>
                      </Button>
                    ) : (
                      <Button onClick={() => activar(t.code)} disabled={activating === t.code}>
                        {activating === t.code ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activando…
                          </>
                        ) : (
                          "Activar Leo"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}

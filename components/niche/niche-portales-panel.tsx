"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Globe, KeyRound, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { useToast } from "@/components/ui/use-toast"

type PortalRow = {
  integracionId: string
  nombre: string
  emoji: string
  descripcion: string
  estado: "disponible" | "beta" | "proximamente"
  conectado: boolean
  cuentaExterna: string | null
  syncEntidades: string[]
}

export function NichePortalesPanel() {
  const { toast } = useToast()
  const [portales, setPortales] = useState<PortalRow[]>([])
  const [conectados, setConectados] = useState(0)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inmobiliaria/portales", { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPortales(data.portales ?? [])
        setConectados(data.conectados ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Claver Propiedad</p>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            Portales inmobiliarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conectá API keys de Zonaprop, Argenprop, Properati o Mercado Libre Inmuebles.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-4 text-sm">
          <strong>{conectados}</strong> de {portales.length} portales conectados · Configurá credenciales en{" "}
          <Link href="/dashboard/configuracion" className="text-primary underline">
            Integraciones
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {portales.map((p) => (
          <Card key={p.integracionId}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{p.emoji}</span>
                {p.nombre}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={p.conectado ? "default" : "secondary"}>
                  {p.conectado ? "Conectado" : "Sin configurar"}
                </Badge>
                {p.estado === "beta" && <Badge variant="outline">Beta</Badge>}
                {p.estado === "proximamente" && <Badge variant="outline">Próximamente</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{p.descripcion}</p>
              {p.cuentaExterna && (
                <p className="text-xs text-muted-foreground">Cuenta: {p.cuentaExterna}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Sync: {p.syncEntidades.join(" · ")}
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={p.estado === "proximamente"}
                onClick={() => {
                  toast({
                    title: "Configurar en Integraciones",
                    description: `Buscá «${p.nombre}» en Configuración → Integraciones y cargá tu API key.`,
                  })
                }}
              >
                <KeyRound className="h-4 w-4 mr-1" />
                {p.conectado ? "Actualizar credenciales" : "Conectar API key"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
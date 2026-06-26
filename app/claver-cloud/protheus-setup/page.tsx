"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  Server,
  Shield,
  Wifi,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CheckItem = {
  id: string
  titulo: string
  descripcion: string
  href: string
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ProtheusSetupPage() {
  const [checklist, setChecklist] = useState<CheckItem[]>([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/claver-cloud/protheus-api/introspect", {
          headers: authHeaders(),
        })
        if (res.ok) {
          const data = await res.json()
          setChecklist(data.checklist ?? [])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const completed = Object.values(done).filter(Boolean).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          Preparar ambiente Protheus
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Checklist para analistas: de la red VPN hasta el bridge OPO activo en el tenant.
        </p>
        {!loading && (
          <Badge variant="outline" className="mt-2">
            {completed}/{checklist.length} pasos marcados
          </Badge>
        )}
      </div>

      <Card id="red">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Tu Protheus de referencia
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 font-mono text-xs">
          <p>REST: http://10.12.35.70:8073/rest</p>
          <p>Discovery: /tlpp/rest/list/service</p>
          <p>Auth: Basic admin / (password en OPO Console)</p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando checklist…
        </div>
      ) : (
        <div className="space-y-3">
          {checklist.map((item, idx) => (
            <Card key={item.id}>
              <CardContent className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDone((d) => ({ ...d, [item.id]: !d[item.id] }))}
                  className="shrink-0 mt-0.5 text-primary"
                  aria-label={`Marcar paso ${item.titulo}`}
                >
                  {done[item.id] ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {idx + 1}. {item.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.descripcion}</p>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 mt-2 text-xs">
                    <Link href={item.href}>
                      Ir al paso
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Orden recomendado (diagrama)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs font-mono text-muted-foreground space-y-1">
          <p>1. VPN/red → 2. REST discovery OK</p>
          <p>3. OPO Console (SX2/SX3) → 4. Catálogo REST</p>
          <p>5. Tenant + SKU bridge.opo_studio</p>
          <p>6. Legacy Bridge + prueba ida/vuelta → 7. Mini front legacy</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/claver-cloud/opo-console">Abrir OPO Console</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/claver-cloud/protheus-api">Ver catálogo REST</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/claver-cloud/organizations">Elegir tenant</Link>
        </Button>
      </div>
    </div>
  )
}
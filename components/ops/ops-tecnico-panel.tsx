"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Copy, Check, Key, RefreshCw } from "lucide-react"

type TecnicoData = {
  empresa: { nombre: string; cuit: string; rubro: string; planHosting: string }
  afip: { entorno: string }
  runtime: { version: string; vercelEnv: string; region: string }
  entornos: {
    codigo: string
    estado: string
    version: string | null
    urlBase: string | null
    dbProveedor: string | null
    webhookSecret: string | null
  }[]
  integraciones: { id: string; estado: string; cuenta: string | null; ultimaSync: string | null }[]
}

export function OpsTecnicoPanel() {
  const [data, setData] = useState<TecnicoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [rotatingEnv, setRotatingEnv] = useState<string | null>(null)
  const [newSecret, setNewSecret] = useState<{ codigo: string; secret: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const cargarDatos = () => {
    const token = localStorage.getItem("token")
    fetch("/api/ops/tecnico", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleRotateSecret = async (codigo: string) => {
    if (!confirm(`¿Estás seguro de que deseas rotar el Webhook Secret del entorno ${codigo.toUpperCase()}? Se invalidará el anterior.`)) {
      return
    }
    setRotatingEnv(codigo)
    setNewSecret(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/ops/tecnico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "rotate-webhook", codigo }),
      })
      if (res.ok) {
        const body = await res.json()
        setNewSecret({ codigo, secret: body.webhookSecret })
        cargarDatos()
      } else {
        alert("Error al rotar el secreto.")
      }
    } catch (err) {
      console.error(err)
      alert("Error de conexión.")
    } finally {
      setRotatingEnv(null)
    }
  };

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Cargando datos técnicos…</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {newSecret && (
        <Card className="md:col-span-2 border-amber-500 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 dark:text-amber-300 text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              ¡Webhook Secret Rotado Exitosamente! ({newSecret.codigo.toUpperCase()})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Copia este secreto ahora. Por razones de seguridad, <strong>no se volverá a mostrar completo</strong>.
            </p>
            <div className="flex items-center gap-2 bg-background border rounded-md p-2 max-w-xl">
              <code className="text-xs font-mono select-all flex-1 break-all p-1">{newSecret.secret}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copiarAlPortapapeles(newSecret.secret)}
                className="h-8 w-8 p-0"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => setNewSecret(null)}>
              Entendido
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Empresa y AFIP</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="text-muted-foreground">CUIT:</span> {data.empresa.cuit}</p>
          <p><span className="text-muted-foreground">Rubro:</span> {data.empresa.rubro}</p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">AFIP:</span>
            <Badge variant="outline">{data.afip.entorno}</Badge>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Hosting:</span>
            <Badge variant="outline">{data.empresa.planHosting}</Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Runtime</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="text-muted-foreground">Versión:</span> {data.runtime.version}</p>
          <p><span className="text-muted-foreground">Vercel:</span> {data.runtime.vercelEnv}</p>
          <p><span className="text-muted-foreground">Región:</span> {data.runtime.region}</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Webhooks por Entorno</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.entornos.map((e) => (
            <div key={e.codigo} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-md p-3 gap-3">
              <div>
                <span className="font-semibold uppercase text-sm flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  {e.codigo}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Secret: <span className="font-mono">{e.webhookSecret ?? "No generado"}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRotateSecret(e.codigo)}
                disabled={rotatingEnv === e.codigo}
              >
                {rotatingEnv === e.codigo ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Rotar Secret
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Integraciones (enmascaradas)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.integraciones.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin integraciones activas.</p>
          )}
          {data.integraciones.map((i) => (
            <div key={i.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <span className="font-medium">{i.id}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{i.estado}</Badge>
                {i.cuenta && <span>{i.cuenta}</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
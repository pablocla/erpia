"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ModuleMeta = {
  id: string
  nombre: string
  siglaProtheus: string
  descripcion: string
  paraQueSirve: string
  opoEntities: string[]
  clavisApps: { sku: string; nombre: string; comoComplementa: string }[]
  monetizacion: string
}

type ServiceItem = {
  endpoint: string
  type: string
  moduleId: string
  methods: { method: string; proposito: string }[]
  fullUrl: string
  propositoResumen: string
  module: ModuleMeta
}

type CatalogResponse = {
  meta: {
    source: string
    generatedAt: string
    totalServices: number
    baseUrlExample: string
    discoveryPath: string
    liveRefreshedAt?: string
  }
  moduleCounts: Record<string, number>
  modules: ModuleMeta[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
  items: ServiceItem[]
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-700",
  POST: "bg-blue-500/10 text-blue-700",
  PUT: "bg-amber-500/10 text-amber-800",
  PATCH: "bg-violet-500/10 text-violet-700",
  DELETE: "bg-red-500/10 text-red-700",
}

export default function ProtheusApiCatalogPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<CatalogResponse | null>(null)
  const [q, setQ] = useState("")
  const [module, setModule] = useState("all")
  const [method, setMethod] = useState("all")
  const [page, setPage] = useState(1)
  const [showRefresh, setShowRefresh] = useState(false)
  const [creds, setCreds] = useState({
    baseUrl: "http://10.12.35.70:8073/rest",
    user: "admin",
    password: "",
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "40",
      })
      if (q) params.set("q", q)
      if (module !== "all") params.set("module", module)
      if (method !== "all") params.set("method", method)

      const res = await fetch(`/api/claver-cloud/protheus-api/catalog?${params}`, {
        headers: authHeaders(),
      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [q, module, method, page])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function refrescarLive() {
    setRefreshing(true)
    try {
      const res = await fetch("/api/claver-cloud/protheus-api/catalog", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(creds),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      setShowRefresh(false)
      setPage(1)
      await cargar()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error")
    } finally {
      setRefreshing(false)
    }
  }

  const modules = data?.modules ?? []
  const topModules = Object.entries(data?.moduleCounts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Catálogo REST Protheus
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documentación precargada desde{" "}
            <code className="text-xs">/rest/tlpp/rest/list/service</code> — sin introspección manual
            desde el ERP.
          </p>
          {data?.meta && (
            <p className="text-xs text-muted-foreground mt-2">
              {data.meta.totalServices} servicios · generado{" "}
              {new Date(data.meta.generatedAt).toLocaleString("es-AR")}
              {data.meta.liveRefreshedAt
                ? ` · refresh live ${new Date(data.meta.liveRefreshedAt).toLocaleString("es-AR")}`
                : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Recargar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowRefresh((v) => !v)}>
            <Database className="h-4 w-4 mr-1" />
            Refresh live
          </Button>
          <Button size="sm" asChild>
            <Link href="/claver-cloud/organizations">
              <Sparkles className="h-4 w-4 mr-1" />
              Ir a Legacy Bridge
            </Link>
          </Button>
        </div>
      </div>

      {showRefresh && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actualizar catálogo desde Protheus live</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-3">
              <Label className="text-xs">Base URL</Label>
              <Input
                value={creds.baseUrl}
                onChange={(e) => setCreds((c) => ({ ...c, baseUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Usuario</Label>
              <Input
                value={creds.user}
                onChange={(e) => setCreds((c) => ({ ...c, user: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contraseña</Label>
              <Input
                type="password"
                value={creds.password}
                onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
                placeholder="cwsarg"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void refrescarLive()} disabled={refreshing} className="w-full">
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Descargar discovery"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Módulos TOTVS — para qué sirven y cómo monetizar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topModules.map(([modId, count]) => {
              const meta = modules.find((m) => m.id === modId)
              if (!meta) return null
              return (
                <button
                  key={modId}
                  type="button"
                  onClick={() => {
                    setModule(modId)
                    setPage(1)
                  }}
                  className={cn(
                    "text-left rounded-lg border p-3 hover:border-primary/50 transition-colors",
                    module === modId && "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{meta.nombre}</p>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{meta.paraQueSirve}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {meta.clavisApps.slice(0, 2).map((a) => (
                      <Badge key={a.sku} variant="secondary" className="text-[10px]">
                        {a.nombre}
                      </Badge>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar endpoint, customer, stock, fiscal…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={module}
          onValueChange={(v) => {
            setModule(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los módulos</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={method}
          onValueChange={(v) => {
            setMethod(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {module !== "all" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 text-sm space-y-2">
            {(() => {
              const meta = modules.find((m) => m.id === module)
              if (!meta) return null
              return (
                <>
                  <p>
                    <strong>{meta.nombre}</strong> ({meta.siglaProtheus}) — {meta.descripcion}
                  </p>
                  <p className="text-muted-foreground">{meta.paraQueSirve}</p>
                  {meta.opoEntities.length > 0 && (
                    <p>
                      <strong>Entidades OPO:</strong> {meta.opoEntities.join(", ")}
                    </p>
                  )}
                  <p>
                    <strong>Monetización:</strong> {meta.monetizacion}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {meta.clavisApps.map((a) => (
                      <div key={a.sku} className="rounded border bg-background px-2 py-1 text-xs">
                        <span className="font-medium">{a.nombre}</span>
                        <span className="text-muted-foreground"> ({a.sku})</span>
                        <p className="text-muted-foreground">{a.comoComplementa}</p>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando catálogo…
        </div>
      ) : (
        <div className="space-y-2">
          {data?.items.map((s) => (
            <div
              key={s.endpoint}
              className="border rounded-lg p-3 text-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <code className="text-xs font-mono break-all">{s.endpoint}</code>
                  <p className="text-xs text-muted-foreground mt-1">{s.propositoResumen}</p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {s.module.nombre}
                  </Badge>
                  {s.methods.map((m) => (
                    <Badge
                      key={m.method}
                      variant="outline"
                      className={cn("text-[10px]", METHOD_COLORS[m.method] ?? "")}
                    >
                      {m.method}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                GET {data?.meta.baseUrlExample}
                {s.endpoint}
              </p>
            </div>
          ))}

          {data && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Página {data.pagination.page} de {data.pagination.pages} ({data.pagination.total}{" "}
                resultados)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="pt-4 text-xs text-muted-foreground space-y-2">
          <p className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <strong className="text-foreground">Uso en Legacy Bridge:</strong> buscá el endpoint acá,
            copiá el path al wizard del tenant (pestaña Legacy Bridge), y probá ida/vuelta sin entrar al
            ERP.
          </p>
          <p>
            Discovery original:{" "}
            <code>http://10.12.35.70:8073/rest/tlpp/rest/list/service</code> (Basic admin)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
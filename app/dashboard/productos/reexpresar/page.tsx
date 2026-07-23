"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { TrendingUp, Loader2, ArrowLeft, Calculator, AlertTriangle } from "lucide-react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MetaResponse {
  totalProductos: number
  categorias: { id: number; nombre: string; productos: number }[]
}

interface PreviewRow {
  id: number
  codigo: string
  nombre: string
  precioVentaAnterior: number
  precioVentaNuevo: number
  factor: number
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n)
}

export default function ReexpresarPreciosPage() {
  const { toast } = useToast()
  const { data: meta } = useAuthFetch<MetaResponse>("/api/productos/reexpresar-precios")

  const [modo, setModo] = useState<"porcentaje" | "ipc">("porcentaje")
  const [porcentaje, setPorcentaje] = useState("10")
  const [categoriaId, setCategoriaId] = useState<string>("all")
  const [ajustarCosto, setAjustarCosto] = useState(false)
  const [decimales, setDecimales] = useState("0")
  const [tope, setTope] = useState("")
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{
    factor: number
    afectados: number
    productos: PreviewRow[]
    disclaimer?: string
  } | null>(null)

  const pctNum = useMemo(() => Number(porcentaje.replace(",", ".")), [porcentaje])

  async function run(dryRun: boolean) {
    if (modo === "porcentaje" && !Number.isFinite(pctNum)) {
      toast({ title: "Porcentaje inválido", variant: "destructive" })
      return
    }

    setBusy(true)
    try {
      const res = await authFetch("/api/productos/reexpresar-precios", {
        method: "POST",
        body: JSON.stringify({
          modo,
          porcentaje: modo === "porcentaje" ? pctNum : undefined,
          categoriaId: categoriaId !== "all" ? Number(categoriaId) : undefined,
          ajustarCosto,
          decimales: Number(decimales) || 0,
          topeVariacion: tope ? Number(tope.replace(",", ".")) / 100 : undefined,
          dryRun,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")

      setPreview({
        factor: json.factor,
        afectados: json.afectados,
        productos: json.productos ?? [],
        disclaimer: json.disclaimer,
      })

      toast({
        title: dryRun ? "Vista previa lista" : "Precios actualizados",
        description: dryRun
          ? `${json.afectados} productos · factor ×${json.factor}`
          : `Se actualizaron ${json.afectados} productos (×${json.factor})`,
      })
    } catch (e) {
      toast({
        title: "No se pudo reexpresar",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Reexpresión de Precios"
        description="Actualizá listas enteras por inflación (%) o índice IPC en segundos. Ideal para proteger márgenes en Argentina."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/listas-precio">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Listas de precio
            </Link>
          </Button>
        }
      />

      <Alert className="border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Recomendación</AlertTitle>
        <AlertDescription className="text-sm">
          Siempre generá una vista previa antes de aplicar. El Guardián de Margen del POS avisará si un
          precio queda por debajo del costo de reposición.
          {meta ? ` · ${meta.totalProductos} productos activos en tu catálogo.` : null}
        </AlertDescription>
      </Alert>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-primary" />
              Parámetros de ajuste
            </CardTitle>
            <CardDescription>
              Elegí un porcentaje manual (ej. +12%) o reexpresión por IPC oficial cargado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modo</Label>
              <Select value={modo} onValueChange={(v) => setModo(v as "porcentaje" | "ipc")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje manual</SelectItem>
                  <SelectItem value="ipc">Índice IPC / UVA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modo === "porcentaje" && (
              <div className="space-y-2">
                <Label>Porcentaje de ajuste</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    placeholder="10"
                    className="max-w-[140px]"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Badge variant="secondary">
                    Factor ×{Number.isFinite(pctNum) ? (1 + pctNum / 100).toFixed(4) : "—"}
                  </Badge>
                </div>
              </div>
            )}

            {modo === "ipc" && (
              <p className="text-sm text-muted-foreground">
                Usa el catálogo de índices en Contabilidad → Inflación. Si no hay IPC cargado, el sistema
                pedirá modo porcentaje.
              </p>
            )}

            <div className="space-y-2">
              <Label>Categoría (opcional)</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {(meta?.categorias ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre} ({c.productos})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Decimales</Label>
                <Select value={decimales} onValueChange={setDecimales}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Enteros ($1)</SelectItem>
                    <SelectItem value="2">Centavos ($0,01)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tope variación %</Label>
                <Input
                  value={tope}
                  onChange={(e) => setTope(e.target.value)}
                  placeholder="sin tope"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Ajustar también costo (precio compra)</p>
                <p className="text-xs text-muted-foreground">Útil si reexpresás lista de reposición</p>
              </div>
              <Switch checked={ajustarCosto} onCheckedChange={setAjustarCosto} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button disabled={busy} variant="outline" onClick={() => void run(true)}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                Vista previa
              </Button>
              <Button
                disabled={busy || !preview}
                onClick={() => {
                  if (
                    !window.confirm(
                      `¿Aplicar reexpresión a ${preview?.afectados ?? 0} productos (×${preview?.factor})? Esta acción no se puede deshacer fácilmente.`,
                    )
                  ) {
                    return
                  }
                  void run(false)
                }}
              >
                Aplicar a catálogo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
            <CardDescription>
              {preview
                ? `${preview.afectados} productos · factor ×${preview.factor}`
                : "Generá una vista previa para ver el impacto."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview?.disclaimer && (
              <p className="mb-3 text-xs text-muted-foreground">{preview.disclaimer}</p>
            )}
            {!preview && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Sin datos todavía
              </p>
            )}
            {preview && preview.productos.length > 0 && (
              <div className="max-h-[420px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Antes</TableHead>
                      <TableHead className="text-right">Después</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.productos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium leading-tight">{p.nombre}</div>
                          <div className="text-[10px] text-muted-foreground">{p.codigo}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatARS(p.precioVentaAnterior)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-emerald-600">
                          {formatARS(p.precioVentaNuevo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

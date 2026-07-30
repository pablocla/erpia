"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Warehouse,
  MapPin,
  Package,
  ScanLine,
  Layers,
  Box,
  ClipboardList,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { authFetch } from "@/lib/stores"

interface Deposito {
  id: number
  codigo: string
  nombre: string
}

export default function WmsDashboardPage() {
  const [depositos, setDepositos] = useState<Deposito[]>([])
  const [depositoId, setDepositoId] = useState<number | "">("")
  const [ubicaciones, setUbicaciones] = useState<Array<Record<string, unknown>>>([])
  const [stock, setStock] = useState<Array<Record<string, unknown>>>([])
  const [tareas, setTareas] = useState<Array<Record<string, unknown>>>([])
  const [olas, setOlas] = useState<Array<Record<string, unknown>>>([])
  const [asn, setAsn] = useState<Array<Record<string, unknown>>>([])
  const [packing, setPacking] = useState<Array<Record<string, unknown>>>([])
  const [hus, setHus] = useState<Array<Record<string, unknown>>>([])
  const [conteos, setConteos] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [seedPasillos, setSeedPasillos] = useState("2")

  const loadDepositos = useCallback(async () => {
    const res = await authFetch("/api/stock/depositos").catch(() => null)
    if (res?.ok) {
      const d = await res.json()
      const list = Array.isArray(d) ? d : d.depositos ?? d.data ?? []
      setDepositos(list)
      if (list[0]?.id) setDepositoId(list[0].id)
      return
    }
    const r2 = await authFetch("/api/maestros/depositos").catch(() => null)
    if (r2?.ok) {
      const d = await r2.json()
      const list = Array.isArray(d) ? d : d.data ?? d.depositos ?? []
      setDepositos(list)
      if (list[0]?.id) setDepositoId(list[0].id)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!depositoId) return
    setLoading(true)
    setMsg(null)
    try {
      const q = `depositoId=${depositoId}`
      const [u, s, t, o, a, p, h, c] = await Promise.all([
        authFetch(`/api/wms/ubicaciones?${q}`),
        authFetch(`/api/wms/stock?${q}`),
        authFetch(`/api/wms/tareas?${q}`),
        authFetch("/api/wms/waves"),
        authFetch("/api/wms/asn"),
        authFetch("/api/wms/packing"),
        authFetch(`/api/wms/hu?${q}`),
        authFetch("/api/wms/conteo"),
      ])
      if (u.ok) setUbicaciones(await u.json())
      if (s.ok) setStock(await s.json())
      if (t.ok) setTareas(await t.json())
      if (o.ok) setOlas(await o.json())
      if (a.ok) setAsn(await a.json())
      if (p.ok) setPacking(await p.json())
      if (h.ok) setHus(await h.json())
      if (c.ok) setConteos(await c.json())
    } catch {
      setMsg("Error al cargar datos WMS (¿migraste el schema?)")
    } finally {
      setLoading(false)
    }
  }, [depositoId])

  useEffect(() => {
    void loadDepositos()
  }, [loadDepositos])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function seedGrid() {
    if (!depositoId) return
    setLoading(true)
    try {
      const res = await authFetch("/api/wms/ubicaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed",
          depositoId,
          pasillos: Number(seedPasillos) || 2,
          racks: 3,
          niveles: 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error seed")
      setMsg(`Creadas ${data.created} ubicaciones`)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  async function recalcularAbc() {
    setLoading(true)
    try {
      const res = await authFetch("/api/wms/slotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recalcular_abc", dias: 90 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error ABC")
      setMsg(`ABC actualizado: ${data.productosClasificados} productos`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  async function crearConteo() {
    if (!depositoId) return
    setLoading(true)
    try {
      const res = await authFetch("/api/wms/conteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crear", depositoId, claseAbc: "todas" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error conteo")
      setMsg(`Conteo ${data.numero} creado con ${data.lineas?.length ?? 0} líneas`)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Warehouse className="h-7 w-7 text-amber-600" />
            WMS Light
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ubicaciones, putaway, picking FEFO, olas, packing, HU, ASN y conteo cíclico.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/wms/rf">
            <Button variant="default" className="gap-2">
              <ScanLine className="h-4 w-4" /> Modo RF
            </Button>
          </Link>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Depósito activo</CardTitle>
          <CardDescription>Todas las operaciones se filtran por este depósito.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 min-w-[200px]">
            <Label>Depósito</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={depositoId}
              onChange={(e) => setDepositoId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Seleccionar…</option>
              {depositos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.codigo} — {d.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 w-24">
            <Label>Pasillos seed</Label>
            <Input value={seedPasillos} onChange={(e) => setSeedPasillos(e.target.value)} />
          </div>
          <Button onClick={() => void seedGrid()} disabled={!depositoId || loading}>
            <MapPin className="h-4 w-4 mr-2" />
            Generar grilla de bins
          </Button>
          <Button variant="secondary" onClick={() => void recalcularAbc()} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-2" />
            Recalcular ABC
          </Button>
          <Button variant="secondary" onClick={() => void crearConteo()} disabled={!depositoId || loading}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Conteo cíclico
          </Button>
        </CardContent>
      </Card>

      {msg && (
        <div className="rounded-md border bg-muted/40 px-4 py-2 text-sm">{msg}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ubicaciones", value: ubicaciones.length, icon: MapPin },
          { label: "Stock en bins", value: stock.length, icon: Package },
          { label: "Tareas abiertas", value: tareas.filter((t) => t.estado !== "completada").length, icon: Layers },
          { label: "Olas", value: olas.length, icon: Box },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <k.icon className="h-8 w-8 text-amber-600/80" />
              <div>
                <div className="text-2xl font-semibold">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="ubicaciones">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
          <TabsTrigger value="stock">Stock bin</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="olas">Olas</TabsTrigger>
          <TabsTrigger value="asn">ASN</TabsTrigger>
          <TabsTrigger value="packing">Packing</TabsTrigger>
          <TabsTrigger value="hu">HU / LPN</TabsTrigger>
          <TabsTrigger value="conteo">Conteos</TabsTrigger>
        </TabsList>

        <TabsContent value="ubicaciones" className="mt-4">
          <DataBlock
            rows={ubicaciones}
            columns={[
              ["codigo", "Código"],
              ["tipo", "Tipo"],
              ["pasillo", "Pasillo"],
              ["ordenPath", "Path"],
            ]}
          />
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((s) => {
                const prod = s.producto as { codigo?: string; nombre?: string } | undefined
                const ubi = s.ubicacion as { codigo?: string } | undefined
                const lote = s.lote as { numeroLote?: string } | undefined
                return (
                  <TableRow key={String(s.id)}>
                    <TableCell>
                      {prod?.codigo} — {prod?.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ubi?.codigo}</Badge>
                    </TableCell>
                    <TableCell>{lote?.numeroLote ?? "—"}</TableCell>
                    <TableCell className="text-right">{String(s.cantidad)}</TableCell>
                  </TableRow>
                )
              })}
              {!stock.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin stock por ubicación. Generá bins y hacé putaway/ajuste.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="tareas" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tareas.map((t) => {
                const prod = t.producto as { codigo?: string } | undefined
                const from = t.fromUbicacion as { codigo?: string } | undefined
                const to = t.toUbicacion as { codigo?: string } | undefined
                return (
                  <TableRow key={String(t.id)}>
                    <TableCell className="font-mono text-xs">{String(t.numero)}</TableCell>
                    <TableCell>{String(t.tipo)}</TableCell>
                    <TableCell>
                      <Badge>{String(t.estado)}</Badge>
                    </TableCell>
                    <TableCell>{prod?.codigo ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {from?.codigo ?? "—"} → {to?.codigo ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {String(t.cantidadHecha)}/{String(t.cantidadPedida)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="olas" className="mt-4">
          <DataBlock
            rows={olas}
            columns={[
              ["numero", "Nº"],
              ["estado", "Estado"],
              ["carrier", "Carrier"],
              ["criterio", "Criterio"],
            ]}
          />
        </TabsContent>

        <TabsContent value="asn" className="mt-4">
          <DataBlock
            rows={asn}
            columns={[
              ["numero", "Nº"],
              ["estado", "Estado"],
              ["recepcionCiega", "Ciega"],
            ]}
          />
        </TabsContent>

        <TabsContent value="packing" className="mt-4">
          <DataBlock
            rows={packing}
            columns={[
              ["numero", "Nº"],
              ["estado", "Estado"],
              ["bultos", "Bultos"],
              ["tracking", "Tracking"],
            ]}
          />
        </TabsContent>

        <TabsContent value="hu" className="mt-4">
          <DataBlock
            rows={hus}
            columns={[
              ["codigo", "LPN"],
              ["tipo", "Tipo"],
              ["estado", "Estado"],
            ]}
          />
        </TabsContent>

        <TabsContent value="conteo" className="mt-4">
          <DataBlock
            rows={conteos}
            columns={[
              ["numero", "Nº"],
              ["claseAbc", "ABC"],
              ["estado", "Estado"],
            ]}
          />
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">API rápida</CardTitle>
          <CardDescription>
            POST /api/wms/pick · putaway · waves · packing · asn · rf · slotting · conteo · hu · stock
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            Doc de gaps: <code>docs/funcional/wms-gap-analysis-claver-vs-sap-totvs-meli.md</code>
          </p>
          <p>
            Tras deploy: <code>npx prisma db push</code> o migración para crear tablas WMS.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function DataBlock({
  rows,
  columns,
}: {
  rows: Array<Record<string, unknown>>
  columns: Array<[string, string]>
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(([, label]) => (
            <TableHead key={label}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={String(r.id ?? i)}>
            {columns.map(([key]) => (
              <TableCell key={key}>{String(r[key] ?? "—")}</TableCell>
            ))}
          </TableRow>
        ))}
        {!rows.length && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
              Sin datos
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

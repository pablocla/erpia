"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  FileSpreadsheet,
  Package,
  Percent,
  Printer,
  RefreshCw,
  Shield,
  Ticket,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import {
  AlmacenModulosGrid,
  type ModuloConEstado,
} from "@/components/almacen/almacen-modulos-grid"
import { AlmacenModuloPanel } from "@/components/almacen/almacen-modulo-panel"
import { VISIBILIDAD_MENSAJE, ALMACEN_ROSARIO_BUNDLE_ID } from "@/lib/almacen-rosario/comercial"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace"

type ValeActivo = {
  id: number
  numero: string
  montoOriginal: number
  saldoRestante: number
  titularNombre?: string | null
  fechaEmision: string
}

type Resumen = {
  ofertasZeroWaste: Array<{ nombre: string; descuentoPct: number; motivo?: string; vence?: string }>
  stockCeroHoy: { totalEventos: number; productos: Array<{ nombre: string; unidades: number }> }
  promocionesHoy: Array<{ titulo: string; mensajeCajero: string }>
  productosMargenNegativo: number
  valesActivos?: ValeActivo[]
  envases?: { clientesConSaldo: number; unidadesPrestadas: number }
}

type Propuesta = {
  productoId: number
  codigo: string
  nombre: string
  precioCompraAnterior: number
  precioCompraNuevo: number
  precioVentaAnterior: number
  precioVentaSugerido: number
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

function activo(modulos: ModuloConEstado[], sku: string) {
  return modulos.find((m) => m.sku === sku)?.activo ?? false
}

export default function AlmacenRosarioPage() {
  const { toast } = useToast()
  const [modulos, setModulos] = useState<ModuloConEstado[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [csv, setCsv] = useState("")
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [importando, setImportando] = useState(false)
  const [valeMonto, setValeMonto] = useState("")
  const [valeTitular, setValeTitular] = useState("")
  const [emitiendoVale, setEmitiendoVale] = useState(false)
  const [ultimoTicketVale, setUltimoTicketVale] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resMod, resSum] = await Promise.all([
        fetch("/api/almacen-rosario/modulos", { headers: getAuthHeaders() }),
        fetch("/api/almacen-rosario/resumen", { headers: getAuthHeaders() }),
      ])
      if (resMod.ok) {
        const data = await resMod.json()
        setModulos(data.modulos ?? [])
      }
      if (resSum.ok) setResumen(await resSum.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function previewLista() {
    if (!activo(modulos, "pos.lista_distribuidora")) return
    setImportando(true)
    try {
      const res = await fetch("/api/almacen-rosario/importar-lista", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "preview", contenido: csv }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      setPropuestas(json.propuestas ?? [])
      toast({
        title: "Lista analizada",
        description: `${json.coincidencias} coincidencias · ${json.sinMatch} sin match`,
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Importación",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setImportando(false)
    }
  }

  async function emitirVale() {
    if (!activo(modulos, "pos.vale_dinero")) return
    const monto = parseFloat(valeMonto)
    if (!monto || monto <= 0) {
      toast({ variant: "destructive", title: "Vale", description: "Ingresá un monto válido" })
      return
    }
    setEmitiendoVale(true)
    try {
      const res = await fetch("/api/vales", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          monto,
          titularNombre: valeTitular.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      setUltimoTicketVale(json.ticket ?? null)
      setValeMonto("")
      setValeTitular("")
      toast({ title: "Vale emitido", description: json.numero })
      await cargar()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Vale",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setEmitiendoVale(false)
    }
  }

  async function anularVale(numero: string) {
    try {
      const res = await fetch(`/api/vales/${encodeURIComponent(numero)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      toast({ title: "Vale anulado", description: numero })
      await cargar()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Anular vale",
        description: e instanceof Error ? e.message : "Error",
      })
    }
  }

  async function aplicarLista() {
    if (!propuestas.length || !activo(modulos, "pos.lista_distribuidora")) return
    setImportando(true)
    try {
      const res = await fetch("/api/almacen-rosario/importar-lista", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "aplicar",
          propuestas: propuestas.map((p) => ({
            productoId: p.productoId,
            precioCompraNuevo: p.precioCompraNuevo,
            precioVentaSugerido: p.precioVentaSugerido,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      toast({ title: "Precios actualizados", description: `${json.aplicados} productos` })
      setPropuestas([])
      setCsv("")
      await cargar()
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Aplicar",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setImportando(false)
    }
  }

  const activosCount = modulos.filter((m) => m.activo).length
  const pack = MARKETPLACE_BUNDLES.find((b) => b.id === ALMACEN_ROSARIO_BUNDLE_ID)

  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/pos"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            POS
          </Link>
          <h1 className="text-2xl font-semibold">Almacén Rosario</h1>
          <p className="text-sm text-muted-foreground">
            {modulos.length} módulos visibles · {activosCount} activos
          </p>
          <p className="text-xs text-muted-foreground mt-1">{VISIBILIDAD_MENSAJE}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pack && activosCount < modulos.length && (
            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-500">
              <Link href="/dashboard/apps?bundle=pool-almacen-rosario">
                Pack {fmt(pack.precioPackArs)}/mes
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/almacen/guia">
              <BookOpen className="h-4 w-4 mr-1" />
              Guía completa
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos los módulos del pack</CardTitle>
        </CardHeader>
        <CardContent>
          <AlmacenModulosGrid
            modulos={modulos}
            onAccion={(m) => {
              if (m.superficie === "pos") {
                window.location.href = "/dashboard/pos"
              }
            }}
          />
        </CardContent>
      </Card>

      {resumen && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                Margen negativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{resumen.productosMargenNegativo}</p>
              <p className="text-xs text-muted-foreground">requiere pos.margen_guard activo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-orange-500" />
                Zero Waste hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{resumen.ofertasZeroWaste.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-red-500" />
                Stock cero hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{resumen.stockCeroHoy.totalEventos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Percent className="h-4 w-4 text-emerald-500" />
                Promos hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{resumen.promocionesHoy.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <AlmacenModuloPanel
        titulo="Vale de dinero"
        icon={<Ticket className="h-4 w-4 text-amber-500" />}
        activo={activo(modulos, "pos.vale_dinero")}
        sku="pos.vale_dinero"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Monto</Label>
              <Input type="number" placeholder="5000" value={valeMonto} onChange={(e) => setValeMonto(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Titular (opcional)</Label>
              <Input placeholder="Nombre" value={valeTitular} onChange={(e) => setValeTitular(e.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={() => void emitirVale()} disabled={emitiendoVale}>
            Emitir vale
          </Button>
          {ultimoTicketVale && (
            <pre className="text-[10px] font-mono bg-muted p-3 rounded-md whitespace-pre-wrap">{ultimoTicketVale}</pre>
          )}
          {(resumen?.valesActivos?.length ?? 0) > 0 && (
            <div className="divide-y border rounded-md text-sm">
              {resumen!.valesActivos!.map((v) => (
                <div key={v.id} className="flex justify-between px-3 py-2 gap-2">
                  <span className="font-mono text-xs">{v.numero}</span>
                  <span className="font-medium">{fmt(v.saldoRestante)}</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void anularVale(v.numero)}>
                    Anular
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </AlmacenModuloPanel>

      <AlmacenModuloPanel
        titulo="Envases de gaseosas"
        icon={<Package className="h-4 w-4 text-sky-500" />}
        activo={activo(modulos, "pos.envases_gaseosas")}
        sku="pos.envases_gaseosas"
      >
        <div className="text-sm space-y-2">
          {resumen?.envases ? (
            <>
              <p>
                <strong>{resumen.envases.clientesConSaldo}</strong> clientes con envases ·{" "}
                <strong>{resumen.envases.unidadesPrestadas}</strong> unidades afuera
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Sin movimientos registrados aún.</p>
          )}
          <Link href="/dashboard/pos">
            <Button size="sm" variant="outline">
              Prestar / devolver en POS
            </Button>
          </Link>
        </div>
      </AlmacenModuloPanel>

      <AlmacenModuloPanel
        titulo="Importar lista distribuidora"
        icon={<FileSpreadsheet className="h-4 w-4" />}
        activo={activo(modulos, "pos.lista_distribuidora")}
        sku="pos.lista_distribuidora"
      >
        <div className="space-y-3">
          <Textarea
            placeholder={"codigo;nombre;precio_costo\n1234;Yerba 1kg;4500"}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void previewLista()} disabled={importando || !csv.trim()}>
              Analizar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void aplicarLista()} disabled={importando || !propuestas.length}>
              Aplicar {propuestas.length} precios
            </Button>
          </div>
        </div>
      </AlmacenModuloPanel>

      {resumen && resumen.ofertasZeroWaste.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Ofertas Zero Waste
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {resumen.ofertasZeroWaste.map((o, i) => (
              <div key={i} className="flex justify-between py-2">
                <span>{o.nombre}</span>
                <Badge variant="secondary">-{o.descuentoPct}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
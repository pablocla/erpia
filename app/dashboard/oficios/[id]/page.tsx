"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Camera,
  MapPin,
  Phone,
  CheckCircle2,
  DollarSign,
  Share2,
  ExternalLink,
  Plus,
  Receipt,
  Navigation,
  UserCheck,
  Star,
  ShieldAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authFetch } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import { PaywallModal } from "@/components/billing/paywall-modal"
import { DISPAROS_CONFIG, type DisparoKey, tieneDisparoHabilitado } from "@/lib/comercial/paywall-disparo"
import { useProductEntitlements } from "@/hooks/use-product-entitlements"

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

export default function TrabajoFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { toast } = useToast()
  const { mapa } = useProductEntitlements()
  const skusActivos = Object.entries(mapa)
    .filter(([, on]) => on)
    .map(([sku]) => sku)

  const [trabajo, setTrabajo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState("")
  const [nuevoGastoProveedor, setNuevoGastoProveedor] = useState("")
  const [cargandoGasto, setCargandoGasto] = useState(false)
  const [disparoModal, setDisparoModal] = useState<DisparoKey | null>(null)

  async function cargarFicha() {
    setLoading(true)
    try {
      const res = await authFetch(`/api/oficios/trabajos/${resolvedParams.id}`)
      if (res.ok) {
        const json = await res.json()
        setTrabajo(json.data)
      }
    } catch (e) {
      toast({ title: "Error al cargar la ficha", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarFicha()
  }, [resolvedParams.id])

  async function cambiarEstado(nuevoEstado: string) {
    try {
      const res = await authFetch(`/api/oficios/trabajos/${resolvedParams.id}`, {
        method: "PUT",
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        toast({ title: `Estado actualizado a ${nuevoEstado}` })
        cargarFicha()
      }
    } catch (e) {
      toast({ title: "Error al actualizar estado", variant: "destructive" })
    }
  }

  async function registrarGasto() {
    if (!nuevoGastoMonto) return
    setCargandoGasto(true)
    try {
      const res = await authFetch(`/api/oficios/trabajos/${resolvedParams.id}`, {
        method: "PUT",
        body: JSON.stringify({
          gastosMateriales: [
            ...(trabajo?.gastosMateriales || []),
            {
              proveedor: nuevoGastoProveedor || "Ferretería / Corralón",
              monto: Number(nuevoGastoMonto),
            },
          ],
        }),
      })
      if (res.ok) {
        toast({ title: "Gasto de material registrado" })
        setNuevoGastoMonto("")
        setNuevoGastoProveedor("")
        cargarFicha()
      }
    } catch (e) {
      toast({ title: "Error al registrar gasto", variant: "destructive" })
    } finally {
      setCargandoGasto(false)
    }
  }

  function handleFotoUpload(tipo: "antes" | "despues", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      const fotos = tipo === "antes" ? [...(trabajo.fotosAntes || []), base64] : [...(trabajo.fotosDespues || []), base64]

      await authFetch(`/api/oficios/trabajos/${resolvedParams.id}`, {
        method: "PUT",
        body: JSON.stringify(tipo === "antes" ? { fotosAntes: fotos } : { fotosDespues: fotos }),
      })
      toast({ title: `Foto ${tipo} capturada y guardada` })
      cargarFicha()
    }
    reader.readAsDataURL(file)
  }

  function abrirGPS() {
    if (!trabajo?.direccion) return
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trabajo.direccion)}`
    window.open(url, "_blank")
  }

  function copiarLinkWhatsApp() {
    const url = `${window.location.origin}/p/trabajo/${trabajo.tokenPublico}`
    navigator.clipboard.writeText(url)
    toast({ title: "Link de cliente copiado" })
  }

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Cargando ficha de trabajo...</div>
  }

  if (!trabajo) {
    return <div className="p-12 text-center text-muted-foreground">Trabajo no encontrado.</div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/oficios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">#{trabajo.numero}</span>
              <Badge variant="outline" className="text-xs uppercase">
                {trabajo.estado}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{trabajo.titulo}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!tieneDisparoHabilitado("whatsapp_outbound", skusActivos)) {
                setDisparoModal("whatsapp_outbound")
                return
              }
              const tel = String(trabajo.clienteTelefono ?? "").replace(/\D/g, "")
              const texto = `Presupuesto ${trabajo.titulo}: ${window.location.origin}/p/trabajo/${trabajo.tokenPublico}`
              window.open(
                tel
                  ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
                  : `https://wa.me/?text=${encodeURIComponent(texto)}`,
                "_blank",
              )
            }}
            className="gap-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <Share2 className="h-4 w-4" />
            Enviar WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!tieneDisparoHabilitado("sena_link_mp", skusActivos)) {
                setDisparoModal("sena_link_mp")
                return
              }
              window.location.href = DISPAROS_CONFIG.sena_link_mp.checkoutHref
            }}
            className="gap-2 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
          >
            <DollarSign className="h-4 w-4" />
            Link Seña MP
          </Button>

          <Link href={`/p/trabajo/${trabajo.tokenPublico}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Vista Cliente
            </Button>
          </Link>

          {trabajo.estado === "PRESUPUESTADO" && (
            <Button
              size="sm"
              onClick={() => cambiarEstado("CONFIRMADO")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Marcar Señado (Manual)
            </Button>
          )}

          {trabajo.estado === "CONFIRMADO" && (
            <Button
              size="sm"
              onClick={() => cambiarEstado("EN_CURSO")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Iniciar Obra
            </Button>
          )}

          {trabajo.estado === "EN_CURSO" && (
            <Button
              size="sm"
              onClick={() => cambiarEstado("FINALIZADO")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Finalizar Trabajo
            </Button>
          )}
        </div>
      </div>

      <PaywallModal
        open={Boolean(disparoModal)}
        onOpenChange={(open) => {
          if (!open) setDisparoModal(null)
        }}
        disparoKey={disparoModal ?? undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1 y 2: Información técnica, fotos y gastos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ubicación y Datos de Obra */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Ubicación y Hoja de Ruta</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{trabajo.direccion || "Sin dirección especificada"}</span>
                </div>
                {trabajo.direccion && (
                  <Button size="sm" variant="outline" onClick={abrirGPS} className="gap-1.5 text-xs">
                    <Navigation className="h-3.5 w-3.5" />
                    Abrir GPS
                  </Button>
                )}
              </div>

              {trabajo.descripcion && (
                <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{trabajo.descripcion}</p>
              )}
            </CardContent>
          </Card>

          {/* Fotos Antes y Después */}
          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Fotos de Obra (Antes y Después)</CardTitle>
                <CardDescription className="text-xs">Evidencia fotográfica para garantía y cliente.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Antes de iniciar</span>
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <Camera className="h-3.5 w-3.5 mr-1" /> Sacar Foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFotoUpload("antes", e)}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(trabajo.fotosAntes || []).length === 0 ? (
                    <div className="text-xs text-muted-foreground p-4 border border-dashed rounded-lg w-full text-center">
                      Sin fotos previas registradas
                    </div>
                  ) : (
                    trabajo.fotosAntes.map((url: string, i: number) => (
                      <img key={i} src={url} alt="Antes" className="h-20 w-20 object-cover rounded-lg border" />
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Trabajo Terminado</span>
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium h-7 px-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <Camera className="h-3.5 w-3.5 mr-1" /> Sacar Foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFotoUpload("despues", e)}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(trabajo.fotosDespues || []).length === 0 ? (
                    <div className="text-xs text-muted-foreground p-4 border border-dashed rounded-lg w-full text-center">
                      Sin fotos finales registradas
                    </div>
                  ) : (
                    trabajo.fotosDespues.map((url: string, i: number) => (
                      <img key={i} src={url} alt="Después" className="h-20 w-20 object-cover rounded-lg border" />
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gastos de Ferretería y Materiales */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Gastos de Materiales & Ferretería</span>
                <Receipt className="h-4 w-4 text-slate-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Proveedor / Ferretería"
                  value={nuevoGastoProveedor}
                  onChange={(e) => setNuevoGastoProveedor(e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="number"
                  placeholder="Monto $"
                  value={nuevoGastoMonto}
                  onChange={(e) => setNuevoGastoMonto(e.target.value)}
                  className="text-xs w-32"
                />
                <Button size="sm" onClick={registrarGasto} disabled={cargandoGasto} className="text-xs">
                  Cargar
                </Button>
              </div>

              <div className="space-y-1.5 pt-2">
                {(trabajo.gastosMateriales || []).map((g: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b pb-1">
                    <span className="text-muted-foreground">{g.proveedor || "Ferretería"}</span>
                    <span className="font-mono font-semibold">{fmt(Number(g.monto))}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna 3: Finanzas, Cliente y Calificación */}
        <div className="space-y-6">
          {/* Balance Financiero */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Estado Financiero</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total Acordado:</span>
                  <span className="font-bold text-sm">{fmt(Number(trabajo.montoAcordado || 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seña ({trabajo.porcentajeSena}%):</span>
                  <Badge variant="outline" className={trabajo.senaPagada ? "bg-emerald-500/10 text-emerald-600" : ""}>
                    {trabajo.senaPagada ? "Cobrada" : "Pendiente"}
                  </Badge>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-muted-foreground">Saldo Final:</span>
                  <Badge variant="outline" className={trabajo.saldoPagado ? "bg-emerald-500/10 text-emerald-600" : ""}>
                    {trabajo.saldoPagado ? "Cobrado" : "A cobrar al terminar"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-xs">
              <div className="font-semibold text-sm">{trabajo.cliente?.nombre || "Consumidor Final"}</div>
              {trabajo.cliente?.telefono && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{trabajo.cliente.telefono}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calificación del Cliente */}
          {trabajo.calificacionEstrellas && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1 text-amber-600">
                  <Star className="h-4 w-4 fill-amber-500" />
                  Calificación del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-1 text-xs">
                <div className="font-bold text-amber-700 dark:text-amber-400">
                  {trabajo.calificacionEstrellas} de 5 Estrellas
                </div>
                {trabajo.resenaComentario && (
                  <p className="italic text-muted-foreground">"{trabajo.resenaComentario}"</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Cpu, Plus, Wifi, WifiOff, AlertTriangle, Activity, Thermometer, Droplets, CheckCircle2, Settings2, Gauge, Shield, Wrench } from "lucide-react"

interface LecturaIoT {
  id: number
  valor: number
  unidad: string
  calidad: string
  timestamp: string
  dispositivo: { id: number; nombre: string; codigo: string; tipo: string }
}

interface AlertaIoT {
  id: number
  tipo: string
  mensaje: string
  valorLeido?: number
  nivel: string
  resuelta: boolean
  createdAt: string
  dispositivo: { id: number; nombre: string; codigo: string; tipo: string }
}

interface DispositivoIoT {
  id: number
  codigo: string
  nombre: string
  tipo: string
  ubicacion?: string
  activo: boolean
  ipAddress?: string
  mac?: string
  firmware?: string
  ultimaConexion?: string
  protocolo?: string
  intervaloMuestreo?: number
  unidadMedida?: string
  rangoMin?: number
  rangoMax?: number
  umbralAlertaMin?: number
  umbralAlertaMax?: number
  umbralCriticoMin?: number
  umbralCriticoMax?: number
  precision?: number
  ultimaCalibracion?: string
  proximaCalibracion?: string
  normaIndustrial?: string
  claseProteccion?: string
  zonaInstalacion?: string
  marca?: string
  modelo?: string
  numeroSerie?: string
  alimentacion?: string
  timeoutDesconexion?: number
  offsetCalibracion?: number
  notasTecnicas?: string
  lecturas: LecturaIoT[]
  alertas: AlertaIoT[]
}

const TIPO_ICONS: Record<string, React.ElementType> = {
  temperatura: Thermometer,
  humedad: Droplets,
  presion: Activity,
  contador: Activity,
  scanner: Cpu,
  gps: Activity,
}

const NIVEL_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
}

const TIPO_OPTIONS = [
  { value: "temperatura", label: "Temperatura" },
  { value: "humedad", label: "Humedad" },
  { value: "presion", label: "Presión" },
  { value: "energia", label: "Energía" },
  { value: "vibracion", label: "Vibración" },
  { value: "flujo", label: "Flujo" },
  { value: "peso", label: "Peso" },
  { value: "nivel", label: "Nivel" },
  { value: "contador", label: "Contador" },
  { value: "scanner", label: "Scanner" },
  { value: "gps", label: "GPS" },
]

const PROTOCOLO_OPTIONS = [
  { value: "mqtt", label: "MQTT" },
  { value: "modbus_tcp", label: "Modbus TCP" },
  { value: "modbus_rtu", label: "Modbus RTU" },
  { value: "opcua", label: "OPC-UA" },
  { value: "http", label: "HTTP / REST" },
  { value: "coap", label: "CoAP" },
  { value: "lorawan", label: "LoRaWAN" },
  { value: "zigbee", label: "Zigbee" },
  { value: "ble", label: "Bluetooth LE" },
]

const NORMA_OPTIONS = [
  { value: "IEC_61131", label: "IEC 61131 — PLC" },
  { value: "ISA_95", label: "ISA-95 — Integración empresa" },
  { value: "ISO_22000", label: "ISO 22000 — Seguridad alim." },
  { value: "HACCP", label: "HACCP — Puntos críticos" },
  { value: "GMP", label: "GMP — Buenas prácticas" },
  { value: "ISO_14644", label: "ISO 14644 — Salas limpias" },
  { value: "ATEX", label: "ATEX — Atmósferas explosivas" },
  { value: "SIL", label: "SIL — Integridad funcional" },
  { value: "IEEE_802_15_4", label: "IEEE 802.15.4 — WPAN" },
]

const PROTECCION_OPTIONS = [
  { value: "IP20", label: "IP20 — Interior básico" },
  { value: "IP44", label: "IP44 — Salpicaduras" },
  { value: "IP54", label: "IP54 — Polvo limitado" },
  { value: "IP65", label: "IP65 — Polvo total, chorros" },
  { value: "IP66", label: "IP66 — Chorros potentes" },
  { value: "IP67", label: "IP67 — Inmersión temporal" },
  { value: "IP68", label: "IP68 — Inmersión continua" },
]

const ALIMENTACION_OPTIONS = [
  { value: "24vdc", label: "24V DC" },
  { value: "220vac", label: "220V AC" },
  { value: "bateria", label: "Batería" },
  { value: "poe", label: "PoE" },
  { value: "solar", label: "Solar" },
  { value: "4-20ma_loop", label: "Loop 4-20mA" },
]

const initialForm = {
  codigo: "", nombre: "", tipo: "temperatura", ubicacion: "", ipAddress: "", mac: "", firmware: "",
  protocolo: "", endpointConfig: "", intervaloMuestreo: "", unidadMedida: "",
  rangoMin: "", rangoMax: "", umbralAlertaMin: "", umbralAlertaMax: "",
  umbralCriticoMin: "", umbralCriticoMax: "", precision: "",
  normaIndustrial: "", claseProteccion: "", zonaInstalacion: "",
  marca: "", modelo: "", numeroSerie: "", alimentacion: "",
  timeoutDesconexion: "", offsetCalibracion: "", notasTecnicas: "",
}

const initialLecturaForm = {
  dispositivoId: "", valor: "", unidad: "", calidad: "ok",
}

export default function IoTPage() {
  const [dispositivos, setDispositivos] = useState<DispositivoIoT[]>([])
  const [lecturas, setLecturas] = useState<LecturaIoT[]>([])
  const [alertas, setAlertas] = useState<AlertaIoT[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogDisp, setDialogDisp] = useState(false)
  const [dialogLectura, setDialogLectura] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [lecturaForm, setLecturaForm] = useState(initialLecturaForm)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const fetchDispositivos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/iot/dispositivos", { headers: authHeaders() })
      if (res.ok) setDispositivos(await res.json())
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  const fetchLecturas = useCallback(async () => {
    const res = await fetch("/api/iot/lecturas?limit=20", { headers: authHeaders() })
    if (res.ok) setLecturas(await res.json())
  }, [authHeaders])

  const fetchAlertas = useCallback(async () => {
    const res = await fetch("/api/iot/alertas", { headers: authHeaders() })
    if (res.ok) setAlertas(await res.json())
  }, [authHeaders])

  useEffect(() => {
    fetchDispositivos()
    fetchLecturas()
    fetchAlertas()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => { fetchLecturas(); fetchAlertas() }, 30_000)
    return () => clearInterval(interval)
  }, [fetchDispositivos, fetchLecturas, fetchAlertas])

  const guardarDispositivo = async () => {
    if (!form.codigo || !form.nombre || !form.tipo) { setError("Código, nombre y tipo son obligatorios"); return }
    setGuardando(true); setError("")
    try {
      const payload: Record<string, unknown> = {
        codigo: form.codigo,
        nombre: form.nombre,
        tipo: form.tipo,
        ubicacion: form.ubicacion || undefined,
        ipAddress: form.ipAddress || undefined,
        mac: form.mac || undefined,
        firmware: form.firmware || undefined,
        protocolo: form.protocolo || undefined,
        endpointConfig: form.endpointConfig || undefined,
        intervaloMuestreo: form.intervaloMuestreo ? parseInt(form.intervaloMuestreo) : undefined,
        unidadMedida: form.unidadMedida || undefined,
        rangoMin: form.rangoMin ? parseFloat(form.rangoMin) : undefined,
        rangoMax: form.rangoMax ? parseFloat(form.rangoMax) : undefined,
        umbralAlertaMin: form.umbralAlertaMin ? parseFloat(form.umbralAlertaMin) : undefined,
        umbralAlertaMax: form.umbralAlertaMax ? parseFloat(form.umbralAlertaMax) : undefined,
        umbralCriticoMin: form.umbralCriticoMin ? parseFloat(form.umbralCriticoMin) : undefined,
        umbralCriticoMax: form.umbralCriticoMax ? parseFloat(form.umbralCriticoMax) : undefined,
        precision: form.precision ? parseFloat(form.precision) : undefined,
        normaIndustrial: form.normaIndustrial || undefined,
        claseProteccion: form.claseProteccion || undefined,
        zonaInstalacion: form.zonaInstalacion || undefined,
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        numeroSerie: form.numeroSerie || undefined,
        alimentacion: form.alimentacion || undefined,
        timeoutDesconexion: form.timeoutDesconexion ? parseInt(form.timeoutDesconexion) : undefined,
        offsetCalibracion: form.offsetCalibracion ? parseFloat(form.offsetCalibracion) : undefined,
        notasTecnicas: form.notasTecnicas || undefined,
      }
      const res = await fetch("/api/iot/dispositivos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return }
      setDialogDisp(false)
      fetchDispositivos()
    } finally {
      setGuardando(false)
    }
  }

  const registrarLectura = async () => {
    if (!lecturaForm.dispositivoId || !lecturaForm.valor || !lecturaForm.unidad) {
      setError("Dispositivo, valor y unidad son obligatorios"); return
    }
    setGuardando(true); setError("")
    try {
      const res = await fetch("/api/iot/lecturas", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          dispositivoId: parseInt(lecturaForm.dispositivoId),
          valor: parseFloat(lecturaForm.valor),
          unidad: lecturaForm.unidad,
          calidad: lecturaForm.calidad,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || "Error al guardar"); return }
      setDialogLectura(false)
      setLecturaForm(initialLecturaForm)
      fetchLecturas()
      fetchDispositivos()
    } finally {
      setGuardando(false)
    }
  }

  const resolverAlerta = async (id: number) => {
    await fetch("/api/iot/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id }),
    })
    fetchAlertas()
  }

  const ahora = new Date()
  const dispConectados = dispositivos.filter((d) => {
    if (!d.ultimaConexion) return false
    const diff = ahora.getTime() - new Date(d.ultimaConexion).getTime()
    return diff < 5 * 60 * 1000 // 5 minutos
  }).length

  const alertasCriticas = alertas.filter((a) => a.nivel === "critical" && !a.resuelta).length
  const alertasWarning = alertas.filter((a) => a.nivel === "warning" && !a.resuelta).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6 text-sky-500" />
            IoT — Internet de las Cosas
          </h1>
          <p className="text-muted-foreground text-sm">Dispositivos conectados, telemetría y alertas en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setLecturaForm(initialLecturaForm); setError(""); setDialogLectura(true) }} className="gap-2">
            <Activity className="h-4 w-4" /> Registrar Lectura
          </Button>
          <Button onClick={() => { setForm(initialForm); setError(""); setDialogDisp(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Dispositivo
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Dispositivos activos</p>
            <p className="text-2xl font-bold">{dispositivos.filter((d) => d.activo).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Conectados ahora</p>
              <p className="text-2xl font-bold text-green-600">{dispConectados}</p>
            </div>
            <Wifi className="h-5 w-5 text-green-500 mt-1" />
          </CardContent>
        </Card>
        <Card className={alertasCriticas > 0 ? "border-red-300" : ""}>
          <CardContent className="pt-4 flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Alertas críticas</p>
              <p className={`text-2xl font-bold ${alertasCriticas > 0 ? "text-red-600" : ""}`}>{alertasCriticas}</p>
            </div>
            <AlertTriangle className={`h-5 w-5 mt-1 ${alertasCriticas > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Alertas warning</p>
            <p className={`text-2xl font-bold ${alertasWarning > 0 ? "text-yellow-600" : ""}`}>{alertasWarning}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas críticas destacadas */}
      {alertasCriticas > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hay {alertasCriticas} alerta{alertasCriticas > 1 ? "s" : ""} crítica{alertasCriticas > 1 ? "s" : ""} sin resolver. Revisá la pestaña de Alertas.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="dispositivos">
        <TabsList>
          <TabsTrigger value="dispositivos" className="gap-2"><Cpu className="h-4 w-4" />Dispositivos ({dispositivos.length})</TabsTrigger>
          <TabsTrigger value="lecturas" className="gap-2"><Activity className="h-4 w-4" />Lecturas recientes</TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {alertas.filter((a) => !a.resuelta).length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {alertas.filter((a) => !a.resuelta).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Dispositivos */}
        <TabsContent value="dispositivos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loading ? (
              <p className="text-muted-foreground col-span-3 text-center py-8">Cargando...</p>
            ) : dispositivos.length === 0 ? (
              <p className="text-muted-foreground col-span-3 text-center py-8">No hay dispositivos registrados</p>
            ) : dispositivos.map((disp) => {
              const Icon = TIPO_ICONS[disp.tipo] || Cpu
              const ultimaLectura = disp.lecturas[0]
              const alertasActivas = disp.alertas.filter((a) => !a.resuelta).length
              const estaConectado = disp.ultimaConexion && (ahora.getTime() - new Date(disp.ultimaConexion).getTime()) < 5 * 60 * 1000

              return (
                <Card key={disp.id} className={estaConectado ? "border-green-200" : "border-muted"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${estaConectado ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{disp.nombre}</CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">{disp.codigo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {alertasActivas > 0 && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{alertasActivas}</span>
                        )}
                        {estaConectado
                          ? <Wifi className="h-3.5 w-3.5 text-green-500" />
                          : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{disp.tipo}</span>
                      {disp.ubicacion && <span className="text-xs text-muted-foreground">{disp.ubicacion}</span>}
                    </div>
                    {/* Protocol & standard badges */}
                    <div className="flex flex-wrap gap-1">
                      {disp.protocolo && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {PROTOCOLO_OPTIONS.find(p => p.value === disp.protocolo)?.label || disp.protocolo}
                        </Badge>
                      )}
                      {disp.normaIndustrial && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {NORMA_OPTIONS.find(n => n.value === disp.normaIndustrial)?.label?.split("—")[0]?.trim() || disp.normaIndustrial}
                        </Badge>
                      )}
                      {disp.claseProteccion && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {disp.claseProteccion}
                        </Badge>
                      )}
                    </div>
                    {ultimaLectura ? (
                      <div className="bg-muted/50 rounded-md p-2 text-center">
                        <p className="text-2xl font-bold">
                          {ultimaLectura.valor}
                          <span className="text-sm font-normal text-muted-foreground ml-1">{ultimaLectura.unidad}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ultimaLectura.timestamp).toLocaleTimeString("es-AR")}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-md p-2 text-center">
                        <p className="text-xs text-muted-foreground">Sin lecturas registradas</p>
                      </div>
                    )}
                    {disp.ipAddress && <p className="text-xs text-muted-foreground">IP: {disp.ipAddress}</p>}
                    {disp.marca && disp.modelo && (
                      <p className="text-xs text-muted-foreground">{disp.marca} {disp.modelo}{disp.numeroSerie ? ` — S/N: ${disp.numeroSerie}` : ""}</p>
                    )}
                    {(disp.rangoMin != null || disp.rangoMax != null) && (
                      <p className="text-xs text-muted-foreground">
                        Rango: {disp.rangoMin ?? "—"} a {disp.rangoMax ?? "—"} {disp.unidadMedida || ""}
                      </p>
                    )}
                    {disp.ultimaConexion && (
                      <p className="text-xs text-muted-foreground">
                        Última conexión: {new Date(disp.ultimaConexion).toLocaleString("es-AR")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab Lecturas */}
        <TabsContent value="lecturas">
          <Card className="mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Calidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay lecturas registradas</TableCell></TableRow>
                  ) : lecturas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-sm">{new Date(l.timestamp).toLocaleString("es-AR")}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{l.dispositivo.nombre}</p>
                        <p className="text-xs text-muted-foreground">{l.dispositivo.codigo}</p>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{l.dispositivo.tipo}</TableCell>
                      <TableCell className="font-bold">
                        {l.valor} <span className="font-normal text-sm text-muted-foreground">{l.unidad}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          l.calidad === "ok" ? "bg-green-100 text-green-700" :
                          l.calidad === "alerta" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{l.calidad}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Alertas */}
        <TabsContent value="alertas">
          <Card className="mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay alertas activas</TableCell></TableRow>
                  ) : alertas.map((a) => (
                    <TableRow key={a.id} className={!a.resuelta && a.nivel === "critical" ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <TableCell className="font-mono text-sm">{new Date(a.createdAt).toLocaleString("es-AR")}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{a.dispositivo.nombre}</p>
                        <p className="text-xs text-muted-foreground">{a.dispositivo.codigo}</p>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{a.tipo}</TableCell>
                      <TableCell className="text-sm">{a.mensaje}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${NIVEL_BADGE[a.nivel] || "bg-gray-100 text-gray-700"}`}>
                          {a.nivel}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!a.resuelta ? (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => resolverAlerta(a.id)}>
                            <CheckCircle2 className="h-3 w-3" /> Resolver
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Resuelta</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nuevo Dispositivo */}
      <Dialog open={dialogDisp} onOpenChange={setDialogDisp}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Dispositivo IoT</DialogTitle>
          </DialogHeader>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basico" className="text-xs gap-1"><Cpu className="h-3 w-3" />Básico</TabsTrigger>
              <TabsTrigger value="comunicacion" className="text-xs gap-1"><Wifi className="h-3 w-3" />Comunicación</TabsTrigger>
              <TabsTrigger value="medicion" className="text-xs gap-1"><Gauge className="h-3 w-3" />Medición</TabsTrigger>
              <TabsTrigger value="normas" className="text-xs gap-1"><Shield className="h-3 w-3" />Normas</TabsTrigger>
              <TabsTrigger value="hardware" className="text-xs gap-1"><Wrench className="h-3 w-3" />Hardware</TabsTrigger>
            </TabsList>

            {/* Tab Básico */}
            <TabsContent value="basico" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Código *</Label>
                  <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="SENSOR-001" />
                </div>
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPO_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Sensor temperatura Depósito A" />
              </div>
              <div className="space-y-1">
                <Label>Ubicación</Label>
                <Input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Depósito A — Sector frío" />
              </div>
              <div className="space-y-1">
                <Label>Zona de Instalación</Label>
                <Input value={form.zonaInstalacion} onChange={(e) => setForm({ ...form, zonaInstalacion: e.target.value })} placeholder="Zona 1 — Área clasificada" />
              </div>
            </TabsContent>

            {/* Tab Comunicación */}
            <TabsContent value="comunicacion" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Protocolo</Label>
                  <Select value={form.protocolo} onValueChange={(v) => setForm({ ...form, protocolo: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {PROTOCOLO_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Timeout desconexión (seg)</Label>
                  <Input type="number" value={form.timeoutDesconexion} onChange={(e) => setForm({ ...form, timeoutDesconexion: e.target.value })} placeholder="300" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Endpoint / Configuración conexión</Label>
                <Input value={form.endpointConfig} onChange={(e) => setForm({ ...form, endpointConfig: e.target.value })} placeholder="mqtt://broker:1883/topic/sensor01 o modbus://192.168.1.10:502/1/40001" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Dirección IP</Label>
                  <Input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} placeholder="192.168.1.100" />
                </div>
                <div className="space-y-1">
                  <Label>MAC Address</Label>
                  <Input value={form.mac} onChange={(e) => setForm({ ...form, mac: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Intervalo de muestreo (seg)</Label>
                <Input type="number" value={form.intervaloMuestreo} onChange={(e) => setForm({ ...form, intervaloMuestreo: e.target.value })} placeholder="60" />
              </div>
            </TabsContent>

            {/* Tab Medición y Umbrales */}
            <TabsContent value="medicion" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Unidad de medida</Label>
                  <Input value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })} placeholder="°C, %, kPa, m³/h..." />
                </div>
                <div className="space-y-1">
                  <Label>Precisión (±)</Label>
                  <Input type="number" step="0.01" value={form.precision} onChange={(e) => setForm({ ...form, precision: e.target.value })} placeholder="0.5" />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground pt-1">Rango operativo</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Rango mínimo</Label>
                  <Input type="number" step="0.01" value={form.rangoMin} onChange={(e) => setForm({ ...form, rangoMin: e.target.value })} placeholder="-40" />
                </div>
                <div className="space-y-1">
                  <Label>Rango máximo</Label>
                  <Input type="number" step="0.01" value={form.rangoMax} onChange={(e) => setForm({ ...form, rangoMax: e.target.value })} placeholder="125" />
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground pt-1">Umbrales de alerta</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Alerta mínimo</Label>
                  <Input type="number" step="0.01" value={form.umbralAlertaMin} onChange={(e) => setForm({ ...form, umbralAlertaMin: e.target.value })} placeholder="2" />
                </div>
                <div className="space-y-1">
                  <Label>Alerta máximo</Label>
                  <Input type="number" step="0.01" value={form.umbralAlertaMax} onChange={(e) => setForm({ ...form, umbralAlertaMax: e.target.value })} placeholder="8" />
                </div>
              </div>
              <p className="text-xs font-medium text-red-500 pt-1">Umbrales críticos</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Crítico mínimo</Label>
                  <Input type="number" step="0.01" value={form.umbralCriticoMin} onChange={(e) => setForm({ ...form, umbralCriticoMin: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label>Crítico máximo</Label>
                  <Input type="number" step="0.01" value={form.umbralCriticoMax} onChange={(e) => setForm({ ...form, umbralCriticoMax: e.target.value })} placeholder="10" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Offset de calibración</Label>
                <Input type="number" step="0.001" value={form.offsetCalibracion} onChange={(e) => setForm({ ...form, offsetCalibracion: e.target.value })} placeholder="0.0" />
              </div>
            </TabsContent>

            {/* Tab Normas Industriales */}
            <TabsContent value="normas" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label>Norma industrial aplicable</Label>
                <Select value={form.normaIndustrial} onValueChange={(v) => setForm({ ...form, normaIndustrial: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar norma..." /></SelectTrigger>
                  <SelectContent>
                    {NORMA_OPTIONS.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Clase de protección (IP)</Label>
                <Select value={form.claseProteccion} onValueChange={(v) => setForm({ ...form, claseProteccion: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar IP..." /></SelectTrigger>
                  <SelectContent>
                    {PROTECCION_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/50 rounded-md p-3 space-y-2 text-sm">
                <p className="font-medium text-xs">Referencia rápida de normas</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><strong>IEC 61131</strong> — Programación de PLCs industriales</li>
                  <li><strong>ISA-95</strong> — Integración empresa-planta (MES/ERP)</li>
                  <li><strong>ISO 22000 / HACCP</strong> — Seguridad alimentaria y puntos críticos de control</li>
                  <li><strong>GMP</strong> — Buenas prácticas de manufactura (farmacéutica, alimentos)</li>
                  <li><strong>ISO 14644</strong> — Salas limpias y ambientes controlados</li>
                  <li><strong>ATEX</strong> — Equipos para atmósferas potencialmente explosivas</li>
                  <li><strong>SIL</strong> — Nivel de integridad de seguridad funcional (IEC 61508)</li>
                  <li><strong>IEEE 802.15.4</strong> — Redes inalámbricas de bajo consumo (WSN)</li>
                </ul>
              </div>
              <div className="space-y-1">
                <Label>Notas técnicas</Label>
                <Textarea
                  rows={3}
                  value={form.notasTecnicas}
                  onChange={(e) => setForm({ ...form, notasTecnicas: e.target.value })}
                  placeholder="Observaciones de ingeniería, condiciones de instalación, requisitos especiales..."
                />
              </div>
            </TabsContent>

            {/* Tab Hardware */}
            <TabsContent value="hardware" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Marca</Label>
                  <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Siemens, ABB, Schneider..." />
                </div>
                <div className="space-y-1">
                  <Label>Modelo</Label>
                  <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="SITRANS TH400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Número de serie</Label>
                  <Input value={form.numeroSerie} onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })} placeholder="SN-2024-001234" />
                </div>
                <div className="space-y-1">
                  <Label>Versión firmware</Label>
                  <Input value={form.firmware} onChange={(e) => setForm({ ...form, firmware: e.target.value })} placeholder="v1.2.3" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Alimentación</Label>
                <Select value={form.alimentacion} onValueChange={(v) => setForm({ ...form, alimentacion: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {ALIMENTACION_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDisp(false)}>Cancelar</Button>
            <Button onClick={guardarDispositivo} disabled={guardando}>{guardando ? "Guardando..." : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Lectura */}
      <Dialog open={dialogLectura} onOpenChange={setDialogLectura}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Lectura Manual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-1">
              <Label>Dispositivo *</Label>
              <Select value={lecturaForm.dispositivoId} onValueChange={(v) => setLecturaForm({ ...lecturaForm, dispositivoId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {dispositivos.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre} ({d.codigo})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={lecturaForm.valor} onChange={(e) => setLecturaForm({ ...lecturaForm, valor: e.target.value })} placeholder="23.5" />
              </div>
              <div className="space-y-1">
                <Label>Unidad *</Label>
                <Input value={lecturaForm.unidad} onChange={(e) => setLecturaForm({ ...lecturaForm, unidad: e.target.value })} placeholder="°C, %, kPa..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Calidad</Label>
              <Select value={lecturaForm.calidad} onValueChange={(v) => setLecturaForm({ ...lecturaForm, calidad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogLectura(false)}>Cancelar</Button>
            <Button onClick={registrarLectura} disabled={guardando}>{guardando ? "Guardando..." : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

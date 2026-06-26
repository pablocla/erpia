"use client"

import type React from "react"
import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Building2,
  Shield,
  Bell,
  Printer,
  CreditCard,
  Package,
  Receipt,
  Globe,
  Key,
  Check,
  Upload,
  ToggleLeft,
  ToggleRight,
  Palette,
  Smartphone,
  Database,
  HardDrive,
  Zap,
  Store,
  ChevronRight,
  ChevronLeft,
  Info,
  Save,
  ArrowRight,
  Sparkles,
  UserPlus,
  Users,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAuthStore } from "@/lib/stores"
import { ROLES_SISTEMA, type RolSistema, tienePermiso } from "@/lib/auth/roles"
import { MipymeFceConfig } from "@/components/fiscal/mipyme-fce-config"
import { AfipConnectionTest } from "@/components/fiscal/afip-connection-test"
import { CaeaPanel } from "@/components/fiscal/caea-panel"
import { CaeaConfigPanel } from "@/components/fiscal/caea-config-panel"
import { FiscalEmisionConfigPanel } from "@/components/fiscal/fiscal-emision-config-panel"

type SectionKey =
  | "empresa"
  | "afip"
  | "modulos"
  | "usuarios"
  | "fiscal"
  | "stock"
  | "ventas"
  | "impresion"
  | "notificaciones"
  | "apariencia"
  | "integraciones"
  | "backup"
  | "avanzado"

const SECCIONES: { key: SectionKey; label: string; icon: React.ElementType; descripcion: string; color: string; bgColor: string; grupo: "negocio" | "operacion" | "sistema" }[] = [
  { key: "empresa", label: "Datos de la Empresa", icon: Building2, descripcion: "Razón social, CUIT, domicilio fiscal", color: "text-blue-500", bgColor: "bg-blue-500/10", grupo: "negocio" },
  { key: "afip", label: "AFIP / ARCA", icon: Shield, descripcion: "Certificados digitales, punto de venta, entorno", color: "text-red-500", bgColor: "bg-red-500/10", grupo: "negocio" },
  { key: "modulos", label: "Módulos activos", icon: Zap, descripcion: "Habilitar/deshabilitar módulos del sistema", color: "text-amber-500", bgColor: "bg-amber-500/10", grupo: "negocio" },
  { key: "usuarios", label: "Usuarios", icon: Users, descripcion: "Crear, editar y gestionar usuarios del ERP", color: "text-emerald-500", bgColor: "bg-emerald-500/10", grupo: "negocio" },
  { key: "fiscal", label: "Parámetros Fiscales", icon: Receipt, descripcion: "Condición IVA, alícuotas, retenciones", color: "text-orange-500", bgColor: "bg-orange-500/10", grupo: "negocio" },
  { key: "stock", label: "Stock y Costos", icon: Package, descripcion: "Método de costeo, alertas de stock", color: "text-green-500", bgColor: "bg-green-500/10", grupo: "operacion" },
  { key: "ventas", label: "Ventas y Caja", icon: CreditCard, descripcion: "Formas de pago, descuentos, apertura automática", color: "text-violet-500", bgColor: "bg-violet-500/10", grupo: "operacion" },
  { key: "impresion", label: "Impresión", icon: Printer, descripcion: "Impresora fiscal, tickets, PDF", color: "text-cyan-500", bgColor: "bg-cyan-500/10", grupo: "operacion" },
  { key: "notificaciones", label: "Notificaciones", icon: Bell, descripcion: "WhatsApp, email, alertas automáticas", color: "text-pink-500", bgColor: "bg-pink-500/10", grupo: "operacion" },
  { key: "apariencia", label: "Apariencia", icon: Palette, descripcion: "Tema, logo, personalización", color: "text-indigo-500", bgColor: "bg-indigo-500/10", grupo: "sistema" },
  { key: "integraciones", label: "Integraciones", icon: Globe, descripcion: "Shopify, MercadoLibre, WhatsApp, bancos", color: "text-teal-500", bgColor: "bg-teal-500/10", grupo: "sistema" },
  { key: "backup", label: "Backup y Datos", icon: HardDrive, descripcion: "Exportar datos, restaurar, limpieza", color: "text-slate-500", bgColor: "bg-slate-500/10", grupo: "sistema" },
  { key: "avanzado", label: "Avanzado", icon: Database, descripcion: "Variables de entorno, logs, performance", color: "text-slate-400", bgColor: "bg-slate-400/10", grupo: "sistema" },
]

type ToggleParam = { label: string; key: string; descripcion: string; value: boolean }
type AfipEntorno = "homologacion" | "produccion"

const defaultModulos: ToggleParam[] = [
  { label: "Compras", key: "compras", descripcion: "Facturas de compra y proveedores", value: true },
  { label: "Ventas / Facturación", key: "ventas", descripcion: "Emisión de facturas electrónicas AFIP", value: true },
  { label: "Stock", key: "stock", descripcion: "Gestión de inventario y productos", value: true },
  { label: "Caja / Financiero", key: "caja", descripcion: "Movimientos de caja y banco", value: true },
  { label: "Contabilidad", key: "contabilidad", descripcion: "Asientos, plan de cuentas, balances", value: false },
  { label: "Hospitalidad (Mesas)", key: "hospitalidad", descripcion: "Sistema de mesas, comandas y KDS", value: false },
  { label: "Agenda de Turnos", key: "agenda", descripcion: "Gestión de citas para profesionales", value: false },
  { label: "Historia Clínica", key: "historia_clinica", descripcion: "Veterinarias y clínicas médicas", value: false },
  { label: "Membresías", key: "membresias", descripcion: "Abonos y control de acceso (gimnasios)", value: false },
  { label: "Onboarding IA", key: "onboarding", descripcion: "Asistente de configuración con IA", value: true },
  { label: "Asistente IA", key: "ia", descripcion: "Chat IA, alertas inteligentes, proyecciones y mensajes WhatsApp automáticos", value: false },
]

const defaultNotificaciones: ToggleParam[] = [
  { label: "Alertas de stock bajo", key: "alerta_stock", descripcion: "Notificar cuando un producto baja del mínimo", value: true },
  { label: "Facturas vencidas", key: "facturas_vencidas", descripcion: "Recordatorio de cuentas por cobrar vencidas", value: true },
  { label: "Vencimiento membresías", key: "membresias_vencer", descripcion: "Avisar 3 días antes del vencimiento", value: false },
  { label: "CAE próximo a vencer", key: "cae_vencer", descripcion: "Alerta cuando el CAE vence en 48hs", value: true },
  { label: "Resumen diario por email", key: "resumen_email", descripcion: "Enviar resumen de ventas al cierre del día", value: false },
  { label: "WhatsApp confirmación turno", key: "wp_turno", descripcion: "Enviar confirmación automática de turnos", value: false },
]

const ROLE_ALIASES: Record<string, RolSistema> = {
  admin: "dueno",
  administrador: "dueno",
  owner: "dueno",
  vendedor: "cajero",
  vendedora: "cajero",
}

function normalizeRol(rol?: string | null): RolSistema | null {
  if (!rol) return null
  const lower = rol.toLowerCase()
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower]
  return (ROLES_SISTEMA.find((r) => r.codigo === lower)?.codigo as RolSistema | undefined) ?? null
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => {
        if (disabled) return
        onChange(!value)
      }}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        value ? "bg-primary" : "bg-muted-foreground/30",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform",
        value ? "translate-x-4" : "translate-x-0.5"
      )} />
    </button>
  )
}

function ConfiguracionPageContent() {
  const { toast } = useToast()
  const [seccionActiva, setSeccionActiva] = useState<SectionKey | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [modulos, setModulos] = useState(defaultModulos)
  const [notificaciones, setNotificaciones] = useState(defaultNotificaciones)
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false)
  const [empresaCuit, setEmpresaCuit] = useState("")
  const [empresaForm, setEmpresaForm] = useState({
    nombre: "",
    razonSocial: "",
    cuit: "",
    direccion: "",
    telefono: "",
    email: "",
    condicionIva: "",
    rubro: "otro",
  })
  const [afipConfig, setAfipConfig] = useState({ puntoVenta: "1", entorno: "homologacion" as AfipEntorno })
  const [tieneCertificado, setTieneCertificado] = useState(false)
  const [crtFile, setCrtFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [subiendoCert, setSubiendoCert] = useState(false)

  // ─── Fiscal config state ──────────────────────────────────────────
  const [umbralMipyme, setUmbralMipyme] = useState("5468127")
  const [arbaCotPesoMinimo, setArbaCotPesoMinimo] = useState("4500")
  const [arbaCotValorMinimo, setArbaCotValorMinimo] = useState("45000")
  const [cargandoFiscal, setCargandoFiscal] = useState(false)

  // ─── Usuarios state ────────────────────────────────────────────────
  interface UsuarioRow { id: number; nombre: string; email: string; rol: string; activo: boolean }
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", password: "", rol: "cajero" })
  const user = useAuthStore((s) => s.user)
  const rolNormalizado = normalizeRol(user?.rol)
  const puedeEditarConfig = rolNormalizado ? tienePermiso(rolNormalizado, "configuracion", "editar") : false
  const puedeVerUsuarios = rolNormalizado ? tienePermiso(rolNormalizado, "usuarios", "ver") : false
  const puedeCrearUsuarios = rolNormalizado ? tienePermiso(rolNormalizado, "usuarios", "crear") : false

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const searchParams = useSearchParams()
  useEffect(() => {
    if (seccionActiva) return
    const sec = searchParams.get("section") || searchParams.get("seccion")
    if (!sec) return
    const normalized = sec.toLowerCase() as SectionKey
    if (SECCIONES.some((s) => s.key === normalized)) {
      setSeccionActiva(normalized)
    }
  }, [searchParams, seccionActiva])

  const cargarEmpresaConfig = useCallback(async () => {
    setCargandoEmpresa(true)
    try {
      const res = await fetch("/api/config/empresa", { headers: authHeaders() })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Error al cargar empresa", description: data.error || `Error ${res.status}`, variant: "destructive" })
        return
      }
      const data = await res.json()
      const cuit = data.cuit ?? ""
      setEmpresaCuit(cuit)
      setEmpresaForm({
        nombre: data.nombre ?? "",
        razonSocial: data.razonSocial ?? "",
        cuit,
        direccion: data.direccion ?? "",
        telefono: data.telefono ?? "",
        email: data.email ?? "",
        condicionIva: data.condicionIva ?? "",
        rubro: data.rubro ?? "otro",
      })
      setAfipConfig({
        puntoVenta: String(data.puntoVenta ?? 1),
        entorno: (data.entorno ?? "homologacion") as AfipEntorno,
      })
      const hasCert = Boolean(data.certificadoCRT && data.certificadoKEY)
      setTieneCertificado(hasCert)
    } catch {
      toast({ title: "Error de conexión", description: "No se pudo cargar la empresa", variant: "destructive" })
    } finally {
      setCargandoEmpresa(false)
    }
  }, [authHeaders, toast])

  useEffect(() => {
    if (seccionActiva === "afip" || seccionActiva === "empresa") {
      cargarEmpresaConfig()
    }
  }, [seccionActiva, cargarEmpresaConfig])

  // Load module config from API on mount
  useEffect(() => {
    async function cargarModulos() {
      try {
        const res = await fetch("/api/config/modulos", { headers: authHeaders() })
        if (!res.ok) return
        const data: Record<string, boolean> = await res.json()
        setModulos(prev => prev.map(m => ({
          ...m,
          value: data[m.key] !== undefined ? data[m.key] : m.value,
        })))
      } catch { /* use defaults */ }
    }
    cargarModulos()
  }, [authHeaders])

  // ─── Cargar usuarios ────────────────────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    if (!puedeVerUsuarios) {
      setUsuarios([])
      return
    }
    setCargandoUsuarios(true)
    try {
      const resUsuarios = await fetch("/api/usuarios", { headers: authHeaders() })
      if (resUsuarios.ok) {
        const data = await resUsuarios.json()
        setUsuarios(data.usuarios || [])
      } else {
        setUsuarios([])
      }
    } catch {} finally { setCargandoUsuarios(false) }
  }, [authHeaders, puedeVerUsuarios])

  useEffect(() => {
    if (seccionActiva === "usuarios") cargarUsuarios()
  }, [seccionActiva, cargarUsuarios])

  const cargarFiscalConfig = useCallback(async () => {
    setCargandoFiscal(true)
    try {
      const res = await fetch("/api/config/parametros-fiscales", { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          const mipyme = data.find((p: any) => p.clave === "umbral_mipyme")
          const peso = data.find((p: any) => p.clave === "arba_cot_peso_minimo")
          const valor = data.find((p: any) => p.clave === "arba_cot_valor_minimo")
          if (mipyme) setUmbralMipyme(String(Number(mipyme.valor)))
          if (peso) setArbaCotPesoMinimo(String(Number(peso.valor)))
          if (valor) setArbaCotValorMinimo(String(Number(valor.valor)))
        }
      }
    } catch (e) {
      console.error("Error al cargar config fiscal:", e)
    } finally {
      setCargandoFiscal(false)
    }
  }, [authHeaders])

  useEffect(() => {
    if (seccionActiva === "fiscal") {
      cargarFiscalConfig()
    }
  }, [seccionActiva, cargarFiscalConfig])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: () => {
      if (seccionActiva === "usuarios") cargarUsuarios()
      if (seccionActiva === "fiscal") cargarFiscalConfig()
    },
  }))

  const updateCuit = (value: string) => {
    setEmpresaCuit(value)
    setEmpresaForm((prev) => ({ ...prev, cuit: value }))
  }

  async function crearUsuario() {
    if (!puedeCrearUsuarios) {
      toast({ title: "No autorizado", description: "No tenés permisos para crear usuarios", variant: "destructive" })
      return
    }
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) {
      toast({ title: "Completá todos los campos", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(nuevoUsuario),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ title: "Usuario creado", description: `${data.usuario?.nombre || nuevoUsuario.nombre} registrado` })
        setNuevoUsuario({ nombre: "", email: "", password: "", rol: "cajero" })
        cargarUsuarios()
      } else {
        toast({ title: "Error al crear usuario", description: data.error || "Error desconocido", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" })
    }
  }

  function toggleParam(list: ToggleParam[], setList: React.Dispatch<React.SetStateAction<ToggleParam[]>>, key: string) {
    if (!puedeEditarConfig) return
    setList(list.map(p => p.key === key ? { ...p, value: !p.value } : p))
  }

  async function guardarModulos() {
    // Persist active modules config
    const modulosMap: Record<string, boolean> = {}
    for (const m of modulos) {
      modulosMap[m.key] = m.value
    }
    const res = await fetch("/api/config/modulos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ modulos: modulosMap }),
    })
    if (res.ok) {
      setGuardado(true)
      // Dispatch storage event so sidebar picks up the change
      window.dispatchEvent(new Event("modulos-updated"))
      toast({ title: "Configuración guardada", description: "Los módulos se actualizaron correctamente" })
      setTimeout(() => setGuardado(false), 2000)
      return true
    }
    const data = await res.json().catch(() => ({}))
    toast({ title: "Error al guardar", description: data.error || `Error ${res.status}`, variant: "destructive" })
    return false
  }

  async function guardarEmpresaConfig() {
    const cuit = empresaForm.cuit.trim()
    if (cuit && (cuit.length < 11 || cuit.length > 13)) {
      toast({ title: "CUIT inválido", description: "Usá un CUIT válido (11 a 13 caracteres)", variant: "destructive" })
      return false
    }

    const payload = {
      nombre: empresaForm.nombre.trim() || undefined,
      razonSocial: empresaForm.razonSocial.trim() || undefined,
      cuit: cuit || undefined,
      direccion: empresaForm.direccion.trim() || undefined,
      telefono: empresaForm.telefono.trim() || undefined,
      email: empresaForm.email.trim() || undefined,
      condicionIva: empresaForm.condicionIva || undefined,
      rubro: empresaForm.rubro || undefined,
    }

    const res = await fetch("/api/config/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setGuardado(true)
      toast({ title: "Empresa actualizada", description: "Los datos de la empresa se guardaron" })
      setTimeout(() => setGuardado(false), 2000)
      return true
    }
    const data = await res.json().catch(() => ({}))
    toast({ title: "Error al guardar", description: data.error || `Error ${res.status}`, variant: "destructive" })
    return false
  }

  async function guardarAfipConfig() {
    const puntoVenta = parseInt(afipConfig.puntoVenta, 10)
    if (!puntoVenta || puntoVenta < 1 || puntoVenta > 9999) {
      toast({ title: "Punto de venta inválido", description: "Usá un valor entre 1 y 9999", variant: "destructive" })
      return false
    }
    const res = await fetch("/api/config/empresa", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ puntoVenta, entorno: afipConfig.entorno, cuit: empresaCuit || undefined }),
    })
    if (res.ok) {
      setGuardado(true)
      toast({ title: "Configuración AFIP guardada", description: "Entorno y punto de venta actualizados" })
      setTimeout(() => setGuardado(false), 2000)
      return true
    }
    const data = await res.json().catch(() => ({}))
    toast({ title: "Error al guardar", description: data.error || `Error ${res.status}`, variant: "destructive" })
    return false
  }

  async function guardarFiscalConfig() {
    const payload = [
      { clave: "umbral_mipyme", valor: Number(umbralMipyme), descripcion: "Monto umbral para Factura de Crédito Electrónica MiPyMEs" },
      { clave: "arba_cot_peso_minimo", valor: Number(arbaCotPesoMinimo), descripcion: "Peso mínimo en kg para requerir COT ARBA" },
      { clave: "arba_cot_valor_minimo", valor: Number(arbaCotValorMinimo), descripcion: "Valor mínimo en pesos para requerir COT ARBA" },
    ]

    const res = await fetch("/api/config/parametros-fiscales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setGuardado(true)
      toast({ title: "Parámetros fiscales guardados", description: "Umbrales impositivos actualizados correctamente" })
      setTimeout(() => setGuardado(false), 2000)
      return true
    }
    const data = await res.json().catch(() => ({}))
    toast({ title: "Error al guardar", description: data.error || `Error ${res.status}`, variant: "destructive" })
    return false
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
      reader.readAsText(file)
    })
  }

  async function subirCertificados() {
    if (!puedeEditarConfig) {
      toast({ title: "Solo lectura", description: "No tenés permisos para subir certificados", variant: "destructive" })
      return
    }
    if (!empresaCuit) {
      toast({ title: "CUIT faltante", description: "Configurá el CUIT de la empresa primero", variant: "destructive" })
      return
    }
    if (!crtFile || !keyFile) {
      toast({ title: "Archivos incompletos", description: "Seleccioná el .crt y el .key", variant: "destructive" })
      return
    }
    setSubiendoCert(true)
    try {
      const [crtText, keyText] = await Promise.all([
        readFileAsText(crtFile),
        readFileAsText(keyFile),
      ])
      const formData = new FormData()
      formData.append("cuit", empresaCuit)
      formData.append("certificadoCRT", crtText)
      formData.append("certificadoKEY", keyText)
      const res = await fetch("/api/afip/subir-certificados", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: "Error al subir", description: data.error || `Error ${res.status}`, variant: "destructive" })
        return
      }
      setTieneCertificado(true)
      toast({ title: "Certificados cargados", description: "AFIP quedó habilitado para emitir" })
      setCrtFile(null)
      setKeyFile(null)
      await cargarEmpresaConfig()
    } catch (err) {
      toast({ title: "Error", description: "No se pudieron subir los certificados", variant: "destructive" })
    } finally {
      setSubiendoCert(false)
    }
  }

  async function handleGuardar() {
    if (!puedeEditarConfig) {
      toast({ title: "Solo lectura", description: "No tenés permisos para modificar configuración", variant: "destructive" })
      return
    }
    setGuardando(true)
    try {
      if (seccionActiva === "modulos") {
        await guardarModulos()
        return
      }
      if (seccionActiva === "empresa") {
        await guardarEmpresaConfig()
        return
      }
      if (seccionActiva === "afip") {
        await guardarAfipConfig()
        return
      }
      if (seccionActiva === "fiscal") {
        await guardarFiscalConfig()
        return
      }
      toast({ title: "Sin cambios", description: "Esta sección aún no tiene guardado automático" })
    } catch (err) {
      toast({ title: "Error de conexión", description: "No se pudo guardar la configuración", variant: "destructive" })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="dashboard-surface rounded-xl p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-2">
            <Settings className="h-3.5 w-3.5" />
            Centro de control
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controlá todos los parámetros del ERP desde un solo lugar
          </p>
        </div>
        {seccionActiva && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSeccionActiva(null)}>
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver al panel
            </Button>
            <Button onClick={handleGuardar} disabled={guardando || !puedeEditarConfig} className="gap-2">
              {guardado ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {guardando ? "Guardando..." : guardado ? "¡Guardado!" : "Guardar cambios"}
            </Button>
          </div>
        )}
      </div>

      {/* CARD GRID LANDING (when no section is selected) */}
      {!seccionActiva && (
        <div className="space-y-6">
          {/* Priority CTA — AFIP + Empresa */}
          <div className="grid gap-4 sm:grid-cols-2">
            {SECCIONES.filter(s => s.key === "empresa" || s.key === "afip").map((sec) => {
              const Icon = sec.icon
              return (
                <button
                  key={sec.key}
                  onClick={() => setSeccionActiva(sec.key)}
                  className="config-card-priority group text-left p-5 rounded-xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/40 hover:from-primary/8 hover:to-primary/15 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", sec.bgColor)}>
                      <Icon className={cn("h-6 w-6", sec.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{sec.label}</h3>
                        <Badge variant="outline" className="text-[9px] h-4 border-primary/30 text-primary">Prioritario</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{sec.descripcion}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Grouped sections */}
          <Tabs defaultValue="negocio" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 h-9">
              <TabsTrigger value="negocio" className="text-xs gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Negocio
              </TabsTrigger>
              <TabsTrigger value="operacion" className="text-xs gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Operación
              </TabsTrigger>
              <TabsTrigger value="sistema" className="text-xs gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Sistema
              </TabsTrigger>
            </TabsList>

            {(["negocio", "operacion", "sistema"] as const).map((grupo) => (
              <TabsContent key={grupo} value={grupo} className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {SECCIONES
                    .filter((s) => s.grupo === grupo && s.key !== "empresa" && s.key !== "afip")
                    .map((sec) => {
                      const Icon = sec.icon
                      return (
                        <button
                          key={sec.key}
                          onClick={() => setSeccionActiva(sec.key)}
                          className="config-card group text-left p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", sec.bgColor)}>
                              <Icon className={cn("h-5 w-5", sec.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm mb-0.5">{sec.label}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">{sec.descripcion}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                          </div>
                        </button>
                      )
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs gap-1" onClick={() => setSeccionActiva("modulos")}>
              <Sparkles className="h-3 w-3" /> Módulos activos
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs gap-1" onClick={() => setSeccionActiva("notificaciones")}>
              <Bell className="h-3 w-3" /> Notificaciones
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs gap-1" onClick={() => setSeccionActiva("integraciones")}>
              <Globe className="h-3 w-3" /> Integraciones
            </Badge>
          </div>
        </div>
      )}

      {/* DETAIL VIEW (when a section is selected) */}
      {seccionActiva && (
        <div className="space-y-4">
          {/* Section header */}
          {(() => {
            const sec = SECCIONES.find(s => s.key === seccionActiva)!
            const Icon = sec.icon
            return (
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", sec.bgColor)}>
                  <Icon className={cn("h-5 w-5", sec.color)} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{sec.label}</h2>
                  <p className="text-sm text-muted-foreground">{sec.descripcion}</p>
                </div>
              </div>
            )
          })()}

        {/* ── EMPRESA ── */}
        {seccionActiva === "empresa" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Datos principales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Razón Social</Label>
                  <Input
                    value={empresaForm.razonSocial}
                    onChange={(e) => setEmpresaForm((prev) => ({ ...prev, razonSocial: e.target.value }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CUIT</Label>
                  <Input
                    value={empresaForm.cuit}
                    onChange={(e) => updateCuit(e.target.value)}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                    placeholder="20-12345678-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Condición IVA</Label>
                  <Select
                    value={empresaForm.condicionIva || "Consumidor Final"}
                    onValueChange={(v) => setEmpresaForm((prev) => ({ ...prev, condicionIva: v }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Responsable Inscripto">Responsable Inscripto</SelectItem>
                      <SelectItem value="Monotributista">Monotributista</SelectItem>
                      <SelectItem value="Exento">Exento</SelectItem>
                      <SelectItem value="Consumidor Final">Consumidor Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Domicilio Fiscal</Label>
                  <Input
                    value={empresaForm.direccion}
                    onChange={(e) => setEmpresaForm((prev) => ({ ...prev, direccion: e.target.value }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email de contacto</Label>
                  <Input
                    type="email"
                    value={empresaForm.email}
                    onChange={(e) => setEmpresaForm((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={empresaForm.telefono}
                    onChange={(e) => setEmpresaForm((prev) => ({ ...prev, telefono: e.target.value }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ingresos Brutos</Label>
                  <Input placeholder="123-456789-0" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Inicio de actividades</Label>
                  <Input type="date" disabled />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rubro del negocio</CardTitle>
                <CardDescription>Afecta qué módulos y configuraciones se muestran por defecto</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={empresaForm.rubro || "otro"}
                  onValueChange={(v) => setEmpresaForm((prev) => ({ ...prev, rubro: v }))}
                  disabled={!puedeEditarConfig || cargandoEmpresa}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferreteria">🔧 Ferretería</SelectItem>
                    <SelectItem value="kiosco">🏪 Kiosco / Almacén</SelectItem>
                    <SelectItem value="bar_restaurant">🍽️ Bar / Restaurant</SelectItem>
                    <SelectItem value="veterinaria">🐾 Veterinaria</SelectItem>
                    <SelectItem value="clinica">🏥 Clínica / Consultorio</SelectItem>
                    <SelectItem value="farmacia">💊 Farmacia</SelectItem>
                    <SelectItem value="ropa">👕 Indumentaria</SelectItem>
                    <SelectItem value="supermercado">🛒 Supermercado / Autoservicio</SelectItem>
                    <SelectItem value="estacion_servicio">⛽ Estación de Servicio</SelectItem>
                    <SelectItem value="distribuidora">🚛 Distribuidora</SelectItem>
                    <SelectItem value="salon_belleza">💅 Salón de Belleza</SelectItem>
                    <SelectItem value="gimnasio">🏋️ Gimnasio / Fitness</SelectItem>
                    <SelectItem value="otro">🏢 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AFIP ── */}
        {seccionActiva === "afip" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Punto de Venta y Entorno</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Punto de venta N°</Label>
                  <Input
                    type="number"
                    value={afipConfig.puntoVenta}
                    onChange={(e) => setAfipConfig((prev) => ({ ...prev, puntoVenta: e.target.value }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Entorno</Label>
                  <Select
                    value={afipConfig.entorno}
                    onValueChange={(v) => setAfipConfig((prev) => ({ ...prev, entorno: v as AfipEntorno }))}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacion">🧪 Homologación (pruebas)</SelectItem>
                      <SelectItem value="produccion">✅ Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Usá <strong>Homologación</strong> para hacer pruebas sin generar CAEs reales. Cambiá a <strong>Producción</strong> solo cuando estés listo para facturar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Certificados Digitales</CardTitle>
                <CardDescription>Certificado .crt y clave privada .key generados en el portal AFIP</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>CUIT empresa</Label>
                  <Input
                    value={empresaCuit}
                    onChange={(e) => updateCuit(e.target.value)}
                    disabled={!puedeEditarConfig || cargandoEmpresa}
                    placeholder="20-12345678-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Certificado (.crt)</Label>
                    <Input type="file" accept=".crt" onChange={(e) => setCrtFile(e.target.files?.[0] ?? null)} disabled={!puedeEditarConfig} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Clave privada (.key)</Label>
                    <Input type="file" accept=".key" onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)} disabled={!puedeEditarConfig} />
                  </div>
                </div>
                <Button
                  onClick={subirCertificados}
                  className="gap-2"
                  disabled={!puedeEditarConfig || subiendoCert}
                >
                  <Upload className="h-4 w-4" />
                  {subiendoCert ? "Subiendo..." : "Subir certificados"}
                </Button>
                {tieneCertificado && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Check className="h-4 w-4" />
                    Certificados cargados correctamente
                  </div>
                )}
                <AfipConnectionTest
                  cuit={empresaCuit}
                  disabled={!puedeEditarConfig || !tieneCertificado}
                />
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium mb-1">Estado actual</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", tieneCertificado ? "bg-green-500" : "bg-red-500")} />
                    <p className="text-xs text-muted-foreground">
                      {tieneCertificado ? "Certificados activos" : "Sin certificados — facturación deshabilitada"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <CaeaConfigPanel puedeEditar={puedeEditarConfig} />
            <CaeaPanel
              puedeEditar={puedeEditarConfig}
              puntoVentaDefault={Number(afipConfig.puntoVenta) || 1}
            />
          </div>
        )}

        {/* ── MÓDULOS ── */}
        {seccionActiva === "modulos" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Módulos del sistema</CardTitle>
              <CardDescription>Activá solo los módulos que tu negocio necesita para simplificar el menú</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {modulos.map(mod => (
                <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{mod.label}</p>
                    <p className="text-xs text-muted-foreground">{mod.descripcion}</p>
                  </div>
                  <Toggle value={mod.value} onChange={() => toggleParam(modulos, setModulos, mod.key)} disabled={!puedeEditarConfig} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── USUARIOS ── */}
        {seccionActiva === "usuarios" && (
          <div className="space-y-4">
            {!puedeVerUsuarios ? (
              <Card>
                <CardContent className="py-6">
                  <p className="text-sm text-muted-foreground text-center">No tenés permisos para ver usuarios.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Crear nuevo usuario */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Crear nuevo usuario
                    </CardTitle>
                    <CardDescription>Registrá empleados, vendedores o contadores en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nombre completo</Label>
                        <Input placeholder="Juan Pérez" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario(p => ({ ...p, nombre: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" placeholder="juan@empresa.com" value={nuevoUsuario.email} onChange={e => setNuevoUsuario(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Contraseña</Label>
                        <Input type="password" placeholder="Mínimo 8 caracteres" value={nuevoUsuario.password} onChange={e => setNuevoUsuario(p => ({ ...p, password: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Rol</Label>
                        <Select value={nuevoUsuario.rol} onValueChange={v => setNuevoUsuario(p => ({ ...p, rol: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES_SISTEMA.map((rol) => (
                              <SelectItem key={rol.codigo} value={rol.codigo}>
                                {rol.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={crearUsuario} className="gap-2" disabled={!puedeCrearUsuarios}>
                      <UserPlus className="h-4 w-4" />
                      Crear usuario
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de usuarios */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Usuarios registrados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cargandoUsuarios ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
                    ) : usuarios.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No se encontraron usuarios. Creá el primero arriba.</p>
                    ) : (
                      <div className="space-y-2">
                        {usuarios.map(u => (
                          <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {u.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{u.nombre}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={u.activo ? "default" : "secondary"} className="text-xs">
                                {u.rol}
                              </Badge>
                              <Badge variant={u.activo ? "outline" : "destructive"} className="text-xs">
                                {u.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ── FISCAL ── */}
        {seccionActiva === "fiscal" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Umbrales y Límites Especiales</CardTitle>
                <CardDescription>Configure los valores oficiales para el ruteo de comprobantes FCE y la tramitación del COT ARBA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="umbralMipyme">Umbral FCE MiPyME ($)</Label>
                    <Input
                      id="umbralMipyme"
                      type="number"
                      value={umbralMipyme}
                      disabled={cargandoFiscal || !puedeEditarConfig}
                      onChange={(e) => setUmbralMipyme(e.target.value)}
                      placeholder="5468127"
                    />
                    <p className="text-[10px] text-muted-foreground">Facturas mayores a este valor para Grandes Empresas se emitirán como FCE.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="arbaCotPesoMinimo">Peso Mínimo COT ARBA (kg)</Label>
                    <Input
                      id="arbaCotPesoMinimo"
                      type="number"
                      value={arbaCotPesoMinimo}
                      disabled={cargandoFiscal || !puedeEditarConfig}
                      onChange={(e) => setArbaCotPesoMinimo(e.target.value)}
                      placeholder="4500"
                    />
                    <p className="text-[10px] text-muted-foreground">Umbral de peso del remito para solicitar el COT electrónico.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="arbaCotValorMinimo">Valor Mínimo COT ARBA ($)</Label>
                    <Input
                      id="arbaCotValorMinimo"
                      type="number"
                      value={arbaCotValorMinimo}
                      disabled={cargandoFiscal || !puedeEditarConfig}
                      onChange={(e) => setArbaCotValorMinimo(e.target.value)}
                      placeholder="45000"
                    />
                    <p className="text-[10px] text-muted-foreground">Umbral de valor de la mercadería para solicitar el COT electrónico.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Alícuotas de IVA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "IVA 21%", key: "iva21", activo: true, cuenta: "2.1.03" },
                  { label: "IVA 10.5%", key: "iva105", activo: true, cuenta: "2.1.04" },
                  { label: "IVA 27%", key: "iva27", activo: false, cuenta: "2.1.05" },
                  { label: "IVA 2.5%", key: "iva25", activo: false, cuenta: "2.1.06" },
                  { label: "Exento / No gravado", key: "exento", activo: true, cuenta: "" },
                ].map(al => (
                  <div key={al.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant={al.activo ? "default" : "secondary"} className="text-xs w-16 justify-center">{al.activo ? "Activo" : "Inactivo"}</Badge>
                      <span className="text-sm font-medium">{al.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {al.cuenta && <span className="text-xs text-muted-foreground font-mono">Cta: {al.cuenta}</span>}
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Editar</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Retenciones y Percepciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Retención IIBB CABA", activo: false, alicuota: "3.5%" },
                  { label: "Retención IIBB PBA", activo: false, alicuota: "3%" },
                  { label: "Percepción IVA RG 2854", activo: false, alicuota: "3%" },
                  { label: "Ganancias art. 39", activo: false, alicuota: "2%" },
                ].map((ret, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{ret.label}</p>
                      <p className="text-xs text-muted-foreground">Alícuota: {ret.alicuota}</p>
                    </div>
                    <Toggle value={ret.activo} onChange={() => {}} disabled={!puedeEditarConfig} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <MipymeFceConfig puedeEditar={puedeEditarConfig} />
          </div>
        )}

        {/* ── STOCK ── */}
        {seccionActiva === "stock" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Método de costeo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { value: "pmp", label: "PMP — Precio Medio Ponderado", desc: "Promedia el costo de todas las compras. Recomendado para la mayoría.", recomendado: true },
                  { value: "fifo", label: "FIFO — Primero en Entrar, Primero en Salir", desc: "Los primeros productos comprados son los primeros en venderse.", recomendado: false },
                  { value: "ultimo_costo", label: "Último costo", desc: "Usa el precio de la última compra para valuar el stock.", recomendado: false },
                ].map(op => (
                  <div key={op.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:border-primary transition-colors">
                    <input type="radio" name="costeo" defaultChecked={op.recomendado} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{op.label} {op.recomendado && <Badge className="ml-1 text-[10px] h-4">Recomendado</Badge>}</p>
                      <p className="text-xs text-muted-foreground">{op.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Alertas de stock</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Stock mínimo por defecto</Label>
                  <Input type="number" defaultValue="5" />
                  <p className="text-xs text-muted-foreground">Se aplica a productos sin stock mínimo definido</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Alertar cuando queden (días de stock)</Label>
                  <Input type="number" defaultValue="7" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── VENTAS ── */}
        {seccionActiva === "ventas" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Formas de pago habilitadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Efectivo", key: "efectivo", activo: true },
                  { label: "Débito", key: "debito", activo: true },
                  { label: "Crédito", key: "credito", activo: true },
                  { label: "Transferencia / QR", key: "transferencia", activo: true },
                  { label: "Cheque", key: "cheque", activo: false },
                  { label: "Cuenta corriente", key: "cta_cte", activo: false },
                  { label: "Cripto (USDT, etc.)", key: "cripto", activo: false },
                ].map(fp => (
                  <div key={fp.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <span className="text-sm">{fp.label}</span>
                    <Toggle value={fp.activo} onChange={() => {}} disabled={!puedeEditarConfig} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Parámetros de descuentos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Descuento máximo sin autorización (%)</Label>
                  <Input type="number" defaultValue="10" max="100" />
                </div>
                <div className="space-y-1.5">
                  <Label>Descuento máximo con autorización (%)</Label>
                  <Input type="number" defaultValue="30" max="100" />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Notificar al gerente para aprobar descuentos</p>
                      <p className="text-xs text-muted-foreground">Envía push notification para descuentos mayores al máximo</p>
                    </div>
                    <Toggle value={true} onChange={() => {}} disabled={!puedeEditarConfig} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── NOTIFICACIONES ── */}
        {seccionActiva === "notificaciones" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Alertas automáticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notificaciones.map(not => (
                  <div key={not.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{not.label}</p>
                      <p className="text-xs text-muted-foreground">{not.descripcion}</p>
                    </div>
                    <Toggle value={not.value} onChange={() => toggleParam(notificaciones, setNotificaciones, not.key)} disabled={!puedeEditarConfig} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">WhatsApp Business</CardTitle>
                <CardDescription>Integración con WhatsApp para envío de comprobantes y alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>API Token WhatsApp Business</Label>
                  <Input type="password" placeholder="whatsapp-api-token..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Número de teléfono (con código de país)</Label>
                  <Input placeholder="+54 9 11 1234-5678" />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Smartphone className="h-3.5 w-3.5" />
                  Probar conexión
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── IMPRESIÓN ── */}
        {seccionActiva === "impresion" && (
          <div className="space-y-4">
            <FiscalEmisionConfigPanel puedeEditar={puedeEditarConfig} />
            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground">
                Configurá la impresora activa (IP/puerto USB) desde{" "}
                <Link href="/api/impresion/configurar-impresora" className="text-primary underline">
                  API de impresión
                </Link>{" "}
                o el módulo de conexiones. Hasar y Epson usan ESC/POS con QR fiscal RG 4291.
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── INTEGRACIONES ── */}
        {seccionActiva === "integraciones" && (
          <div className="space-y-4">
            <Card className="border-teal-500/20 bg-teal-500/5">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">Centro de Conexiones Nativas</p>
                  <p className="text-xs text-muted-foreground">
                    30+ integraciones: Shopify, Tienda Nube, ML, Stripe, WhatsApp, logística y más.
                  </p>
                </div>
                <Button size="sm" asChild>
                  <a href="/dashboard/conexiones">Abrir Centro de Conexiones</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── APARIENCIA ── */}
        {seccionActiva === "apariencia" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tema y colores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Tema</Label>
                  <Select defaultValue="system">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Claro</SelectItem>
                      <SelectItem value="dark">🌙 Oscuro</SelectItem>
                      <SelectItem value="system">💻 Seguir sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Color primario</Label>
                  <div className="flex gap-2">
                    {["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map(color => (
                      <div
                        key={color}
                        className="h-8 w-8 rounded-full cursor-pointer border-2 border-white shadow hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Logo de la empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary">
                  <div className="text-center">
                    <Store className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">Subir logo</p>
                  </div>
                </div>
                <Input type="file" accept="image/*" className="w-auto" />
                <p className="text-xs text-muted-foreground">Recomendado: PNG transparente, mínimo 200×200px</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── BACKUP ── */}
        {seccionActiva === "backup" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Exportar datos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[
                  { label: "Exportar facturas (CSV)", desc: "Todas las facturas emitidas" },
                  { label: "Exportar compras (CSV)", desc: "Facturas de proveedores" },
                  { label: "Exportar clientes (CSV)", desc: "Base de clientes completa" },
                  { label: "Exportar inventario (CSV)", desc: "Productos y stock actual" },
                  { label: "Libro IVA Ventas (AFIP)", desc: "Formato SIAP" },
                  { label: "Libro IVA Compras (AFIP)", desc: "Formato SIAP" },
                ].map((exp, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">{exp.label}</p>
                    <p className="text-xs text-muted-foreground mb-2">{exp.desc}</p>
                    <Button size="sm" variant="outline" className="h-7 text-xs w-full">Descargar</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Backup automático</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Backup diario automático</p>
                    <p className="text-xs text-muted-foreground">Cada noche a las 02:00 AM</p>
                  </div>
                  <Toggle value={true} onChange={() => {}} disabled={!puedeEditarConfig} />
                </div>
                <div className="space-y-1.5">
                  <Label>Destino del backup</Label>
                  <Select defaultValue="local">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Servidor local</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gdrive">Google Drive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AVANZADO ── */}
        {seccionActiva === "avanzado" && (
          <div className="space-y-4">
            <Card className="border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                  <Info className="h-4 w-4" />
                  Configuración avanzada
                </CardTitle>
                <CardDescription>Modificar estas opciones puede afectar el funcionamiento del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Timeout de sesión (minutos)</Label>
                    <Input type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Registros por página (tablas)</Label>
                    <Input type="number" defaultValue="25" />
                  </div>
                </div>
                {[
                  { label: "Modo debug / logs detallados", value: false },
                  { label: "Permitir acceso multi-dispositivo simultáneo", value: true },
                  { label: "Auditoría de todas las acciones de usuario", value: true },
                  { label: "Modo mantenimiento (bloquea el sistema)", value: false },
                ].map((op, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <span className="text-sm">{op.label}</span>
                    <Toggle value={op.value} onChange={() => {}} disabled={!puedeEditarConfig} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      )}
    </div>
  )
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Cargando...</div>}>
      <ConfiguracionPageContent />
    </Suspense>
  )
}

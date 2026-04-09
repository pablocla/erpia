"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, Sparkles, Zap, Building2, Loader2, Wrench, SlidersHorizontal, UserRound } from "lucide-react"
import { generarConfiguracionOnboarding, type Rubro, type RespuestasOnboarding } from "@/lib/onboarding/onboarding-ia"

const RUBROS: { value: Rubro; emoji: string; label: string }[] = [
  { value: "ferreteria", emoji: "🔧", label: "Ferretería" },
  { value: "kiosco", emoji: "🛒", label: "Kiosco" },
  { value: "bar_restaurant", emoji: "🍕", label: "Bar / Restaurant" },
  { value: "veterinaria", emoji: "🐾", label: "Veterinaria" },
  { value: "clinica", emoji: "🏥", label: "Clínica / Salud" },
  { value: "farmacia", emoji: "💊", label: "Farmacia" },
  { value: "libreria", emoji: "📚", label: "Librería" },
  { value: "ropa", emoji: "👕", label: "Indumentaria" },
  { value: "supermercado", emoji: "🛍️", label: "Supermercado" },
  { value: "distribuidora", emoji: "🚚", label: "Distribuidora" },
  { value: "salon_belleza", emoji: "💅", label: "Salón de Belleza" },
  { value: "gimnasio", emoji: "🏋️", label: "Gimnasio" },
  { value: "otro", emoji: "🏪", label: "Otro comercio" },
]

const PASOS = [
  { id: "perfil", titulo: "¿Quién está implementando el sistema?" },
  { id: "rubro", titulo: "¿Qué tipo de negocio tenés?" },
  { id: "tamano", titulo: "¿Cuántas personas trabajan?" },
  { id: "caracteristicas", titulo: "¿Qué necesitás gestionar?" },
  { id: "afip", titulo: "¿Cómo estás inscripto en AFIP?" },
  { id: "resultado", titulo: "¡Tu sistema está configurado!" },
]

type Paso = "perfil" | "rubro" | "tamano" | "caracteristicas" | "afip" | "resultado"
const ONBOARDING_STORAGE_KEY = "onboarding:draft:v1"

export default function OnboardingPage() {
  const [paso, setPaso] = useState<Paso>("perfil")
  const [respuestas, setRespuestas] = useState<Partial<RespuestasOnboarding>>({})
  const [configuracion, setConfiguracion] = useState<ReturnType<typeof generarConfiguracionOnboarding> | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [aplicado, setAplicado] = useState(false)
  const [aplicandoError, setAplicandoError] = useState("")
  const [perfilImplementacion, setPerfilImplementacion] = useState<"instalador" | "parametrizador" | "dueno">("instalador")

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const pasoIndex = PASOS.findIndex(p => p.id === paso)

  const volverPaso = () => {
    if (paso === "rubro") setPaso("perfil")
    if (paso === "tamano") setPaso("rubro")
    if (paso === "caracteristicas") setPaso("tamano")
    if (paso === "afip") setPaso("caracteristicas")
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as {
        paso?: Paso
        respuestas?: Partial<RespuestasOnboarding>
        perfilImplementacion?: "instalador" | "parametrizador" | "dueno"
      }

      if (draft.respuestas) setRespuestas(draft.respuestas)
      if (draft.perfilImplementacion) setPerfilImplementacion(draft.perfilImplementacion)
      if (draft.paso && draft.paso !== "resultado") setPaso(draft.paso)
    } catch {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (paso === "resultado") return
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ paso, respuestas, perfilImplementacion }),
    )
  }, [paso, respuestas, perfilImplementacion])

  const procesarOnboarding = () => {
    setProcesando(true)
    setTimeout(async () => {
      const config = generarConfiguracionOnboarding(respuestas as RespuestasOnboarding)
      setConfiguracion(config)
      setPaso("resultado")
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
      setProcesando(false)

      // Persist to database
      try {
        const res = await fetch("/api/config/onboarding/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            empresaId: 1,
            rubro: respuestas.rubro,
            condicionAfip: respuestas.condicionAfip,
            modulosActivos: config.modulosActivos,
            modulosDetalle: config.modulosDetalle,
            planCuentasSugerido: config.planCuentasSugerido,
            tesSugeridos: config.tesSugeridos,
            productosEjemplo: config.productosEjemplo,
            rolesSugeridos: config.rolesSugeridos,
          }),
        })
        if (res.ok) {
          setAplicado(true)
        } else {
          const data = await res.json()
          setAplicandoError(data.error ?? "Error al aplicar configuración")
        }
      } catch {
        setAplicandoError("Error de conexión al aplicar configuración")
      }
    }, 1800)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Configuración Inteligente</h1>
        </div>
        <p className="text-muted-foreground">
          Respondé {PASOS.length - 1} preguntas y tu sistema se configura solo en menos de 10 minutos.
        </p>

        {/* Progress bar */}
        <div className="flex gap-1.5 justify-center mt-4">
          {PASOS.map((p, i) => (
            <div
              key={p.id}
              className={`h-1.5 rounded-full transition-all ${
                i <= pasoIndex ? "bg-primary" : "bg-muted"
              } ${i === pasoIndex ? "w-8" : "w-4"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Paso {Math.min(pasoIndex + 1, PASOS.length - 1)} de {PASOS.length - 1}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{PASOS[pasoIndex]?.titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          {paso !== "perfil" && paso !== "resultado" && (
            <Button variant="ghost" size="sm" className="mb-4" onClick={volverPaso}>
              Volver
            </Button>
          )}

          {/* Paso 1: Rubro */}
          {paso === "perfil" && (
            <div className="space-y-3">
              {[
                {
                  value: "instalador" as const,
                  icon: Wrench,
                  label: "Instalador",
                  desc: "Puesta en marcha técnica: periféricos, AFIP y validación operativa",
                },
                {
                  value: "parametrizador" as const,
                  icon: SlidersHorizontal,
                  label: "Parametrizador",
                  desc: "Configura rubro, impuestos, listas, permisos y dashboards",
                },
                {
                  value: "dueno" as const,
                  icon: UserRound,
                  label: "Dueño / Encargado",
                  desc: "Carga inicial asistida para comenzar a vender en el día",
                },
              ].map((p) => (
                <button
                  key={p.value}
                  className={`w-full p-4 border-2 rounded-xl text-left hover:border-primary transition-all flex items-center gap-4 ${
                    perfilImplementacion === p.value ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                  onClick={() => {
                    setPerfilImplementacion(p.value)
                    setPaso("rubro")
                  }}
                >
                  <p.icon className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Paso 2: Rubro */}
          {paso === "rubro" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RUBROS.map(r => (
                <button
                  key={r.value}
                  className={`p-4 border-2 rounded-xl text-center hover:border-primary transition-all ${
                    respuestas.rubro === r.value ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                  onClick={() => {
                    setRespuestas(prev => ({ ...prev, rubro: r.value }))
                    setPaso("tamano")
                  }}
                >
                  <div className="text-3xl mb-2">{r.emoji}</div>
                  <p className="text-sm font-medium">{r.label}</p>
                </button>
              ))}
            </div>
          )}

          {/* Paso 3: Tamaño */}
          {paso === "tamano" && (
            <div className="space-y-3">
              {[
                { value: "micro", label: "Trabajo solo o con 1 persona", desc: "Microemprendimiento personal" },
                { value: "pequeno", label: "Somos 2 a 5 personas", desc: "Pequeño comercio" },
                { value: "mediano", label: "Somos más de 5", desc: "Comercio mediano o sucursales" },
              ].map(t => (
                <button
                  key={t.value}
                  className={`w-full p-4 border-2 rounded-xl text-left hover:border-primary transition-all flex items-center gap-4 ${
                    respuestas.tamano === t.value ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                  onClick={() => {
                    setRespuestas(prev => ({ ...prev, tamano: t.value as "micro" | "pequeno" | "mediano" }))
                    setPaso("caracteristicas")
                  }}
                >
                  <Building2 className="h-6 w-6 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Paso 4: Características */}
          {paso === "caracteristicas" && (
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { key: "tieneStock", label: "Gestionar inventario / stock", desc: "Productos, cantidades, alertas de stock bajo" },
                  { key: "necesitaFacturacion", label: "Facturación electrónica AFIP", desc: "Facturas A, B, C con CAE automático" },
                  { key: "necesitaContabilidad", label: "Contabilidad y libros contables", desc: "Asientos, balance, libros IVA" },
                  { key: "tieneLocal", label: "Tengo caja o punto de venta físico", desc: "Control de efectivo, aperturas y cierres" },
                  { key: "tieneDelivery", label: "Hago delivery o pedidos a domicilio", desc: "Integración con apps o entrega propia" },
                ].map(c => (
                  <label
                    key={c.key}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer hover:border-primary/50 transition-all ${
                      respuestas[c.key as keyof RespuestasOnboarding] ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      respuestas[c.key as keyof RespuestasOnboarding] ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {respuestas[c.key as keyof RespuestasOnboarding] && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={!!respuestas[c.key as keyof RespuestasOnboarding]}
                      onChange={e => setRespuestas(prev => ({ ...prev, [c.key]: e.target.checked }))}
                    />
                  </label>
                ))}
              </div>
              <Button className="w-full" onClick={() => setPaso("afip")}>
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Paso 5: AFIP */}
          {paso === "afip" && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <button
                  className={`p-5 border-2 rounded-xl text-left hover:border-primary transition-all ${
                    respuestas.condicionAfip === "responsable_inscripto" ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                  onClick={() => {
                    setRespuestas(prev => ({ ...prev, condicionAfip: "responsable_inscripto" }))
                    procesarOnboarding()
                  }}
                >
                  <p className="font-bold text-base">Responsable Inscripto</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Emitís facturas A, B y C. Discriminás IVA. Presentás declaraciones juradas.
                  </p>
                </button>
                <button
                  className={`p-5 border-2 rounded-xl text-left hover:border-primary transition-all ${
                    respuestas.condicionAfip === "monotributista" ? "border-primary bg-primary/5" : "border-muted"
                  }`}
                  onClick={() => {
                    setRespuestas(prev => ({ ...prev, condicionAfip: "monotributista" }))
                    procesarOnboarding()
                  }}
                >
                  <p className="font-bold text-base">Monotributista</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Emitís solo facturas C. Cuota mensual fija. Sin discriminación de IVA.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Procesando */}
          {procesando && (
            <div className="flex flex-col items-center py-12 gap-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-semibold">Configurando tu sistema...</p>
                <p className="text-sm text-muted-foreground mt-1">Activando módulos, TES y plan de cuentas</p>
              </div>
            </div>
          )}

          {/* Resultado */}
          {paso === "resultado" && configuracion && (
            <div className="space-y-6">
              <div className={`p-4 border rounded-xl ${aplicado ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : aplicandoError ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${aplicado ? "text-green-600" : "text-blue-600"}`} />
                  <div>
                    <p className={`font-semibold ${aplicado ? "text-green-800 dark:text-green-300" : "text-blue-800"}`}>
                      {configuracion.mensajeBienvenida}
                    </p>
                    {aplicado && (
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        ✓ Configuración aplicada a la base de datos correctamente.
                      </p>
                    )}
                    {aplicandoError && (
                      <p className="text-sm text-red-600 mt-1">{aplicandoError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Módulos activados ({configuracion.modulosActivos.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {configuracion.modulosActivos.map(m => (
                    <Badge key={m} className="capitalize">{m.replace("_", " ")}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">TES configurados</p>
                <div className="flex flex-wrap gap-2">
                  {configuracion.tesSugeridos.map(t => (
                    <Badge key={t} variant="outline" className="font-mono">{t}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Productos de ejemplo cargados</p>
                <div className="space-y-1">
                  {configuracion.productosEjemplo.map(p => (
                    <div key={p.codigo} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{p.nombre}</span>
                      <span className="font-medium">${p.precio.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Maestros críticos por rubro</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {configuracion.maestrosCriticos.map((maestro) => (
                    <div key={maestro.tabla} className="rounded-lg border p-3 bg-background/60">
                      <p className="text-sm font-medium">{maestro.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{maestro.descripcion}</p>
                      <Badge variant="secondary" className="mt-2 text-[10px] font-mono">{maestro.tabla}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Flujos operativos críticos</p>
                <div className="space-y-2">
                  {configuracion.flujosCriticos.map((flujo, i) => (
                    <div key={flujo} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      {flujo}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Particularidades del rubro</p>
                <div className="space-y-2">
                  {configuracion.particularidadesRubro.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Próximos pasos</p>
                <div className="space-y-2">
                  {configuracion.proximosPasos.map((paso, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      {paso}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Checklist Go-Live ({perfilImplementacion})</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Certificados AFIP cargados",
                    "Punto de venta validado",
                    "Caja inicial configurada",
                    "Usuarios y permisos revisados",
                    "Lista de precios activa",
                    "Prueba de factura exitosa",
                  ].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 text-sm rounded-md border p-2 bg-background/60">
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => window.location.href = "/dashboard"}>
                Ir al Dashboard
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

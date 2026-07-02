"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Store,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Plus,
  Trash2,
  Check,
  Percent,
  Coins,
  Settings2,
} from "lucide-react"

type Rubro = "almacen" | "kiosco" | "carniceria" | "panaderia" | "ferreteria" | "otro"
type ModoLite = "fiado" | "cobranza" | "pos" | "completo"

interface ManualProduct {
  nombre: string
  precioVenta: string
  codigoBarras: string
}

export default function OnboardingRetailPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Rubro
  const [rubro, setRubro] = useState<Rubro>("kiosco")

  // Step 2: Products Mode (csv vs manual)
  const [productMethod, setProductMethod] = useState<"manual" | "csv">("manual")
  const [csvText, setCsvText] = useState("")
  const [manualProducts, setManualProducts] = useState<ManualProduct[]>([
    { nombre: "", precioVenta: "", codigoBarras: "" },
  ])

  // Step 3: Modo Lite
  const [modoLite, setModoLite] = useState<ModoLite>("fiado")

  const authHeaders = useCallback((): HeadersInit => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : ""
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [])

  const addManualProductRow = () => {
    if (manualProducts.length >= 30) {
      toast({
        title: "Límite alcanzado",
        description: "Podés precargar un máximo de 30 productos en el onboarding.",
        variant: "destructive",
      })
      return
    }
    setManualProducts([...manualProducts, { nombre: "", precioVenta: "", codigoBarras: "" }])
  }

  const removeManualProductRow = (index: number) => {
    const next = [...manualProducts]
    next.splice(index, 1)
    setManualProducts(next.length > 0 ? next : [{ nombre: "", precioVenta: "", codigoBarras: "" }])
  }

  const handleManualProductChange = (index: number, field: keyof ManualProduct, value: string) => {
    const next = [...manualProducts]
    next[index][field] = value
    setManualProducts(next)
  }

  const parseCsvProducts = (): { nombre: string; precioVenta: number; codigoBarras?: string }[] => {
    if (!csvText.trim()) return []
    const lines = csvText.split("\n")
    const parsed: { nombre: string; precioVenta: number; codigoBarras?: string }[] = []

    for (const line of lines) {
      if (!line.trim()) continue
      const parts = line.split(/[;,]/)
      if (parts.length === 1) {
        // Just name
        parsed.push({ nombre: parts[0].trim(), precioVenta: 100 })
      } else if (parts.length === 2) {
        // Name, Price or Barcode, Name
        const secondPartNum = parseFloat(parts[1].trim())
        if (!isNaN(secondPartNum)) {
          parsed.push({ nombre: parts[0].trim(), precioVenta: secondPartNum })
        } else {
          parsed.push({ nombre: parts[1].trim(), precioVenta: 100, codigoBarras: parts[0].trim() })
        }
      } else if (parts.length >= 3) {
        // Barcode, Name, Price
        const price = parseFloat(parts[2].trim())
        parsed.push({
          codigoBarras: parts[0].trim() || undefined,
          nombre: parts[1].trim(),
          precioVenta: !isNaN(price) ? price : 100,
        })
      }
    }
    return parsed.slice(0, 30) // Cap to 30
  }

  const handleSubmit = async () => {
    setLoading(true)
    let processedProducts: { nombre: string; precioVenta: number; codigoBarras?: string }[] = []

    if (productMethod === "csv") {
      processedProducts = parseCsvProducts()
    } else {
      processedProducts = manualProducts
        .filter((p) => p.nombre.trim() !== "")
        .map((p) => ({
          nombre: p.nombre,
          precioVenta: parseFloat(p.precioVenta) || 0,
          codigoBarras: p.codigoBarras || undefined,
        }))
    }

    try {
      const res = await fetch("/api/config/onboarding-retail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          rubro,
          modoLite,
          productos: processedProducts,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast({
          title: "Error en el onboarding",
          description: json.error ?? "No se pudieron guardar las configuraciones.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "¡Configuración Exitosa!",
        description: `Tu cuenta está configurada en modo ${modoLite.toUpperCase()}.`,
      })

      router.push(json.landingPath ?? "/dashboard")
      router.refresh()
    } catch {
      toast({
        title: "Error de conexión",
        description: "Ocurrió un problema de red. Reintentá.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const rubroDetails = {
    almacen: { label: "Almacén / Autoservicio", icon: Store, desc: "Alimentos, bebidas, fiambre por peso y limpieza." },
    kiosco: { label: "Kiosco / Maxikiosco", icon: ShoppingBag, desc: "Gaseosas, cigarrillos, golosinas y carga SUBE." },
    carniceria: { label: "Carnicería / Pollería", icon: Store, desc: "Cortes por kilo, balanza y venta al mostrador." },
    panaderia: { label: "Panadería / Confitería", icon: Store, desc: "Facturas, criollos, pan francés y producción propia." },
    ferreteria: { label: "Ferretería / Electricidad", icon: Settings2, desc: "Herramientas, tornillería a granel y unidades." },
    otro: { label: "Otro Comercio / Rubro Mixto", icon: Store, desc: "Comercio minorista genérico de cercanía." },
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="text-center pb-4 border-b">
          <div className="flex justify-center mb-2">
            <span className="p-3 bg-primary/10 rounded-full text-primary animate-bounce">
              <Sparkles className="h-6 w-6" />
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Arrancá con Claver en 10 minutos</CardTitle>
          <CardDescription>
            Sin ERP gigante: empezá con lo que necesitás hoy — fiado, cobranza o mostrador.
          </CardDescription>

          {/* Stepper bar */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold">
            <span className={`px-2.5 py-1 rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              1. Rubro
            </span>
            <div className="w-8 h-0.5 bg-muted" />
            <span className={`px-2.5 py-1 rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2. Productos
            </span>
            <div className="w-8 h-0.5 bg-muted" />
            <span className={`px-2.5 py-1 rounded-full ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              3. Modo de Uso
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-6 min-h-[350px] flex flex-col justify-center">
          {/* STEP 1: RUBRO SELECT */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-center mb-2">¿Cuál es el rubro de tu comercio?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(rubroDetails).map(([key, info]) => {
                  const Icon = info.icon
                  const isSelected = rubro === key
                  return (
                    <button
                      key={key}
                      onClick={() => setRubro(key as Rubro)}
                      className={`p-4 rounded-xl border text-left transition-all flex gap-3 items-start ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                          : "border-muted hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <span className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-bold text-sm text-foreground">{info.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCTS SEEDING */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h2 className="text-lg font-bold">Carga tus productos</h2>
                  <p className="text-xs text-muted-foreground">
                    Podés agregar hasta 30 productos iniciales. Cargaremos 20 típicos de {rubroDetails[rubro].label} automáticamente.
                  </p>
                </div>
                <div className="flex gap-1 border p-1 rounded-lg text-xs bg-muted/30 shrink-0">
                  <button
                    onClick={() => setProductMethod("manual")}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      productMethod === "manual" ? "bg-background text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Carga Rápida
                  </button>
                  <button
                    onClick={() => setProductMethod("csv")}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      productMethod === "csv" ? "bg-background text-primary shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Pegar Excel/CSV
                  </button>
                </div>
              </div>

              {productMethod === "manual" ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 border rounded-lg p-3 bg-muted/10">
                  {manualProducts.map((p, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <Input
                          placeholder="Nombre producto (ej. Alfajor Oreo)"
                          className="h-9 text-sm"
                          value={p.nombre}
                          onChange={(e) => handleManualProductChange(idx, "nombre", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Precio venta (ej. 350)"
                          className="h-9 text-sm"
                          value={p.precioVenta}
                          onChange={(e) => handleManualProductChange(idx, "precioVenta", e.target.value)}
                        />
                        <Input
                          placeholder="Código de barras (opcional)"
                          className="h-9 text-sm"
                          value={p.codigoBarras}
                          onChange={(e) => handleManualProductChange(idx, "codigoBarras", e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => removeManualProductRow(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 h-9 border-dashed text-primary font-bold hover:bg-primary/5"
                    onClick={addManualProductRow}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Agregar producto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Pegá tus filas separadas por comas o punto y coma</Label>
                  <Textarea
                    placeholder="7790895000451, Coca-Cola 500ml, 1200&#10;7791234560012, Alfajor Oreo, 500&#10;Pan lactal, 2500"
                    rows={8}
                    className="font-mono text-xs"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Formato sugerido: <code className="bg-muted px-1 py-0.5 rounded">Código de Barras, Nombre, Precio de Venta</code>. Máximo 30 filas.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: MODO LITE */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-center mb-1">¿Con qué querés arrancar?</h2>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Empezá chico. Solo ves lo que necesitás hoy — el resto lo sumás cuando quieras.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    key: "fiado",
                    title: "Libreta Fiado — $4.990/mes",
                    icon: Coins,
                    desc: "Sabés quién te debe. Ideal para almacén y barrio. Trial 14 días incluido.",
                  },
                  {
                    key: "cobranza",
                    title: "Cobranzas WhatsApp",
                    icon: Percent,
                    desc: "Recordatorios automáticos a deudores. Vos seguís atendiendo el mostrador.",
                  },
                  {
                    key: "pos",
                    title: "Mostrador + Caja",
                    icon: ShoppingBag,
                    desc: "Vendé rápido, cerrá caja y controlá stock básico. Sin pantallas de más.",
                  },
                  {
                    key: "completo",
                    title: "Pack Almacén completo",
                    icon: Store,
                    desc: "Fiado + cobranza + POS + stock. Para cuando ya venís creciendo.",
                  },
                ].map((m) => {
                  const Icon = m.icon
                  const isSelected = modoLite === m.key
                  return (
                    <button
                      key={m.key}
                      onClick={() => setModoLite(m.key as ModoLite)}
                      className={`p-4 rounded-xl border text-left transition-all flex gap-3 items-center ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                          : "border-muted hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <span className={`p-2.5 rounded-lg shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {m.title}
                          {m.key === "fiado" && (
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">
                              14 días Trial
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      </div>
                      {isSelected && (
                        <span className="p-1 bg-primary text-primary-foreground rounded-full shrink-0">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Siguiente <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold">
              {loading ? "Configurando..." : "Completar Onboarding ✨"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

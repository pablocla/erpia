"use client"

import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileUp, CheckCircle2, ChevronRight, ShieldCheck, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { useRouter } from "next/navigation"

export function AfipOnboardingWizard() {
  const [step, setStep] = useState(1)
  const [cuit, setCuit] = useState("")
  const [puntoVenta, setPuntoVenta] = useState("1")
  const [crtFile, setCrtFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "crt" | "key") => {
    const file = e.target.files?.[0]
    if (!file) return
    if (type === "crt") setCrtFile(file)
    if (type === "key") setKeyFile(file)
  }

  const handleSubmit = async () => {
    if (!crtFile || !keyFile || !puntoVenta) {
      setError("Completá todos los campos y subí ambos archivos.")
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("crt", crtFile)
    formData.append("key", keyFile)
    formData.append("puntoVenta", puntoVenta)
    if (cuit) formData.append("cuit", cuit)

    try {
      const res = await authFetch("/api/config/afip-cert", {
        method: "POST",
        body: formData, // No JSON, envíamos multipart/form-data
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Error al configurar AFIP")

      toast({
        title: "¡AFIP Configurado!",
        description: "Tus certificados fueron vinculados exitosamente.",
      })
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Vincular con AFIP
        </CardTitle>
        <CardDescription>
          Configurá la facturación electrónica subiendo tus certificados (CRT y KEY).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stepper Header */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500"}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${step >= 2 ? "bg-primary" : "bg-slate-100"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500"}`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 rounded ${step >= 3 ? "bg-primary" : "bg-slate-100"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Datos */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="grid gap-2">
              <Label htmlFor="cuit">CUIT de la Empresa (Opcional si ya está cargado)</Label>
              <Input
                id="cuit"
                placeholder="20123456789"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pv">Número de Punto de Venta (Web Service)</Label>
              <Input
                id="pv"
                type="number"
                placeholder="Ej: 1, 2, 3..."
                value={puntoVenta}
                onChange={(e) => setPuntoVenta(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Debe ser un punto de venta tipo "Factura Electrónica - Web Service" creado en la página de AFIP.
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => setStep(2)}>
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Archivos */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-4">
              <div className="p-4 border border-dashed rounded-lg bg-slate-50/50">
                <Label className="cursor-pointer flex flex-col items-center gap-2">
                  <FileUp className="w-6 h-6 text-slate-400" />
                  <span className="font-medium text-slate-700">Subir Certificado (.crt)</span>
                  <span className="text-xs text-slate-500">{crtFile?.name || "No seleccionado"}</span>
                  <input type="file" accept=".crt" className="hidden" onChange={(e) => handleFileChange(e, "crt")} />
                </Label>
              </div>

              <div className="p-4 border border-dashed rounded-lg bg-slate-50/50">
                <Label className="cursor-pointer flex flex-col items-center gap-2">
                  <FileUp className="w-6 h-6 text-slate-400" />
                  <span className="font-medium text-slate-700">Subir Clave Privada (.key)</span>
                  <span className="text-xs text-slate-500">{keyFile?.name || "No seleccionado"}</span>
                  <input type="file" accept=".key" className="hidden" onChange={(e) => handleFileChange(e, "key")} />
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading || !crtFile || !keyFile}>
                {loading ? "Vinculando..." : "Finalizar Configuración"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-4 py-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">¡Todo listo!</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                Tus certificados están vinculados. Ya podés emitir facturas electrónicas válidas ante AFIP.
              </p>
            </div>
            <Button className="mt-4" onClick={() => router.push("/dashboard/ventas")}>
              Ir a emitir mi primer comprobante
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

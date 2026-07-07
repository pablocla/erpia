"use client"

import { useState } from "react"
import { QrCode, FileText, UploadCloud, LogOut, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseAfipQR, type FacturaAfipQR } from "@/lib/qr-afip/scanner"
import { BrandLogo } from "@/components/marketing/brand-logo"

export default function PortalProveedores() {
  const [cuit, setCuit] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  const [qrText, setQrText] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  
  const empresaId = 1 // Default para la demo

  const handleLogin = () => {
    if (cuit.trim().length > 10) setIsLoggedIn(true)
  }

  const handleCargarFactura = async () => {
    if (!qrText) return
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const facturaData = parseAfipQR(qrText)
      if (!facturaData) {
        throw new Error("El código QR no es válido o no pertenece a AFIP.")
      }

      const res = await fetch("/api/proveedores/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          cuitProveedor: cuit,
          facturaData
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error de servidor")
      }

      setSuccess(`Factura ${facturaData.ptoVta}-${facturaData.nroCmp} procesada con éxito y enviada al ERP.`)
      setQrText("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <BrandLogo size="md" variant="group-full" />
            </div>
            <CardTitle className="text-2xl mt-4">Portal Proveedores</CardTitle>
            <CardDescription>Autogestión de Pagos y Carga de Facturas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">CUIT Proveedor</label>
              <Input
                placeholder="30-12345678-9"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button className="w-full" size="lg" onClick={handleLogin}>
              Ingresar al Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo size="sm" variant="group-full" showByClaver={false} />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-mono">CUIT: {cuit}</span>
            <Button variant="ghost" size="sm" onClick={() => setIsLoggedIn(false)}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-500" />
                Cargar Factura vía QR
              </CardTitle>
              <CardDescription>
                Pegá la URL del QR de tu factura AFIP para enviarla directo a Cuentas por Pagar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <Textarea 
                placeholder="https://www.afip.gob.ar/fe/qr/?p=..." 
                value={qrText}
                onChange={(e: any) => setQrText(e.target.value)}
                className="font-mono text-xs"
                rows={4}
              />
              <Button onClick={handleCargarFactura} disabled={loading || !qrText} className="w-full">
                {loading ? "Procesando..." : "Subir Factura al ERP"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Facturas Pendientes
              </CardTitle>
              <CardDescription>
                Tus comprobantes que están siendo procesados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                No hay facturas pendientes.
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

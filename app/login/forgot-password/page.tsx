"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [googleOnly, setGoogleOnly] = useState(false)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCargando(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setGoogleOnly(data.googleOnly === true)
        setMensaje(
          data.mensaje ||
            "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.",
        )
        setEnviado(true)
      } else {
        setError(data.error || "Error al procesar solicitud")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{googleOnly ? "Cuenta con Google" : "Revisa tu email"}</CardTitle>
            <CardDescription>{mensaje}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {googleOnly && (
              <Link href="/login">
                <Button className="w-full">Ir al login con Google</Button>
              </Link>
            )}
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Volver al inicio de sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresá tu email. Si la cuenta usa solo Google, te lo indicaremos (no se puede
            restablecer contraseña).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? "Enviando..." : "Enviar instrucciones"}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

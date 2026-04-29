"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const { login, loginConToken } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rubro, setRubro] = useState("salon_belleza")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const [cargandoDemo, setCargandoDemo] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCargando(true)

    let resultado = await login(email, password)

    // Si falla con credenciales demo, auto-provisionar la cuenta admin
    if (!resultado.success && email === "admin@erp-argentina.com" && password === "admin1234") {
      try {
        const res = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rubro }),
        })
        const data = await res.json()
        if (data.success && data.token) {
          loginConToken(data.token, data.usuario)
          router.push("/dashboard")
          return
        }
      } catch {
        // fall through to show original error
      }
    }

    if (resultado.success) {
      router.push("/dashboard")
    } else {
      setError(resultado.error || "Error al iniciar sesión")
      setCargando(false)
    }
  }

  const handleDemo = async () => {
    setError("")
    setCargandoDemo(true)
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubro }),
      })
      const data = await res.json()
      if (data.success && data.token) {
        loginConToken(data.token, data.usuario)
        router.push("/dashboard")
      } else {
        setError(data.error || "Error al iniciar sesión demo")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setCargandoDemo(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubro">Rubro de la demo</Label>
              <Select value={rubro} onValueChange={(value) => setRubro(value)}>
                <SelectTrigger id="rubro">
                  <SelectValue placeholder="Elegí un rubro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salon_belleza">Salón de Belleza / Barbería</SelectItem>
                  <SelectItem value="bar_restaurant">Bar / Restaurante</SelectItem>
                  <SelectItem value="farmacia">Farmacia</SelectItem>
                  <SelectItem value="veterinaria">Veterinaria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={cargando || cargandoDemo}>
              {cargando ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <a href="/login/register" className="text-primary hover:underline">
                Crear cuenta
              </a>
              <a href="/login/forgot-password" className="text-muted-foreground hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">o</span>
              <Separator className="flex-1" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemo}
              disabled={cargando || cargandoDemo}
            >
              {cargandoDemo ? "Preparando demo..." : "Acceder con cuenta Demo"}
            </Button>
            <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Credenciales de prueba:</p>
              <p>Email: <span className="font-mono select-all">admin@erp-argentina.com</span></p>
              <p>Contraseña: <span className="font-mono select-all">admin1234</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

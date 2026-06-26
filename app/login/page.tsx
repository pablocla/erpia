"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { BRAND_NAME, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, CLAVER_GROUP } from "@/lib/brand"
import { getHomePathForRol } from "@/lib/auth/home-redirect"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next")
  const { login, loginConToken } = useAuth()

  function redirectAfterLogin(rol: string) {
    if (nextPath && nextPath.startsWith("/")) {
      router.push(nextPath)
      return
    }
    router.push(getHomePathForRol(rol))
  }
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
    if (!resultado.success && email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
      try {
        const res = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rubro }),
        })
        const data = await res.json()
        if (data.success && data.token) {
          loginConToken(data.token, data.usuario)
          redirectAfterLogin(data.usuario.rol)
          return
        }
      } catch {
        // fall through to show original error
      }
    }

    if (resultado.success && resultado.usuario) {
      redirectAfterLogin(resultado.usuario.rol)
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
        redirectAfterLogin(data.usuario.rol)
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{BRAND_NAME}</CardTitle>
          <CardDescription>
            by {CLAVER_GROUP.name} — Ingresá tus credenciales para acceder
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
                  <SelectItem value="estacion_servicio">Estación de Servicio</SelectItem>
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
              <p>Email: <span className="font-mono select-all">{DEMO_ADMIN_EMAIL}</span></p>
              <p>Contraseña: <span className="font-mono select-all">{DEMO_ADMIN_PASSWORD}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground space-x-3">
        <Link href="/claver" className="text-primary hover:underline">
          Grupo Claver
        </Link>
        <span>·</span>
        <Link href="/claver/claverp" className="text-primary hover:underline">
          Clavis
        </Link>
      </p>
    </div>
  )
}

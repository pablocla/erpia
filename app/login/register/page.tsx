"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth/hooks"
import { mensajeActivarTrial, resolveActivarIntent } from "@/lib/comercial/activar-intent"
import { activarProductoDesdeIntent } from "@/lib/comercial/activar-intent-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activarParam = searchParams.get("activar")
  const activarIntent = resolveActivarIntent(activarParam)
  const { loginConToken } = useAuth()

  const [form, setForm] = useState({
    empresa: "",
    nombre: "",
    email: "",
    password: "",
    confirmar: "",
  })
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setCargando(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: form.empresa,
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          activar: activarParam || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta")
        return
      }

      loginConToken(data.token, data.usuario)

      let dest = data.onboarding?.landingPath ?? "/dashboard"

      if (activarIntent && activarParam && !data.onboarding?.landingPath) {
        const r = await activarProductoDesdeIntent(data.token, activarParam)
        if (!r.success) {
          setError(r.error ?? "Cuenta creada pero no se pudo activar el producto. Iniciá sesión e intentá de nuevo.")
          return
        }
        dest = r.landingPath ?? activarIntent.landingPath
      }

      try {
        localStorage.setItem("claver_fresh_signup", "1")
        if (activarIntent) {
          localStorage.setItem("claver_product_marca", activarIntent.marca)
        }
      } catch {
        /* ignore */
      }

      router.push(dest)
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  const loginHref = activarParam
    ? `/login?activar=${encodeURIComponent(activarParam)}`
    : "/login"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {activarIntent ? `Probar ${activarIntent.marca}` : "Crear cuenta"}
          </CardTitle>
          <CardDescription>
            {activarIntent
              ? `${activarIntent.lema ?? activarIntent.productName} — ${mensajeActivarTrial(activarParam)}`
              : "Registrá tu empresa para empezar a usar el sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {activarIntent && (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <AlertDescription className="text-sm text-muted-foreground">
                  Al crear la cuenta activamos solo{" "}
                  <span className="font-medium text-foreground">{activarIntent.productName}</span>.
                  No vas a ver el ERP completo.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="empresa">Nombre de la empresa</Label>
              <Input
                id="empresa"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                required
                placeholder="Mi Empresa SRL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="juan@miempresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar contraseña</Label>
              <Input
                id="confirmar"
                name="confirmar"
                type="password"
                value={form.confirmar}
                onChange={handleChange}
                required
                placeholder="Repetí la contraseña"
              />
            </div>

            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando
                ? "Creando cuenta..."
                : activarIntent
                  ? `Empezar con ${activarIntent.marca}`
                  : "Crear cuenta"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link href={loginHref} className="text-primary hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardDescription>Cargando…</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
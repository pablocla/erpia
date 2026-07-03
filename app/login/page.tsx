"use client"

import type React from "react"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { BRAND_NAME, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, CLAVER_GROUP } from "@/lib/brand"
import { resolvePostLoginPathAsync } from "@/lib/auth/home-redirect"
import { LocaleFlagToggle } from "@/components/locale-flag-toggle"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next")
  const { login, loginConToken, cargando, autenticado, token, usuario } = useAuth()

  useEffect(() => {
    if (cargando || !autenticado || !token || !usuario) return
    void resolvePostLoginPathAsync(token, usuario.rol, nextPath).then((dest) => {
      router.replace(dest)
    })
  }, [cargando, autenticado, token, usuario, nextPath, router])

  if (cargando || (autenticado && token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <BrandLogo size="md" variant="group-full" className="mb-4" />
            <CardDescription>Redirigiendo…</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  async function redirectAfterLogin(token: string, rol: string, goldenPath?: string) {
    const dest = await resolvePostLoginPathAsync(token, rol, goldenPath ?? nextPath)
    router.push(dest)
  }

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rubro] = useState("veterinaria")
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
          body: JSON.stringify({ industryId: rubro }),
        })
        const data = await res.json()
        if (data.success && data.token) {
          loginConToken(data.token, data.usuario)
          await redirectAfterLogin(data.token, data.usuario.rol, data.goldenPath)
          return
        }
      } catch {
        // fall through to show original error
      }
    }

    if (resultado.success && resultado.usuario && resultado.token) {
      await redirectAfterLogin(resultado.token, resultado.usuario.rol)
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
        body: JSON.stringify({ industryId: rubro }),
      })
      const data = await res.json()
      if (data.success && data.token) {
        loginConToken(data.token, data.usuario)
        await redirectAfterLogin(data.token, data.usuario.rol, data.goldenPath)
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <LocaleFlagToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <BrandLogo size="md" variant="group-full" className="mb-2" />
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

            <div className="rounded-md border border-dashed p-3 text-center text-sm">
              <p className="text-muted-foreground">¿Primera vez? Elegí tu rubro y entrá directo a tu demo.</p>
              <Link href="/demo" className="mt-2 inline-block font-medium text-primary hover:underline">
                Abrir sensor de rubro →
              </Link>
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
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/" className="text-primary hover:underline">
            Grupo Claver
          </Link>
          <span aria-hidden>·</span>
          <Link href="/claver/claverp" className="text-primary hover:underline">
            Claver
          </Link>
          <span aria-hidden>·</span>
          <Link href="/claver/clavergrow" className="text-primary hover:underline">
            Clavergrow
          </Link>
          <span aria-hidden>·</span>
          <Link href="/claver-cloud" className="text-primary hover:underline">
            Claver Cloud
          </Link>
        </span>
        <span className="mt-2 block text-xs text-muted-foreground/80">
          Claver Cloud es acceso analistas — iniciá sesión con tu cuenta Claver
        </span>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <BrandLogo size="md" variant="group-full" className="mb-4" />
              <CardDescription>Cargando…</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}

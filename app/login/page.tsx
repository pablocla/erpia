"use client"

import type React from "react"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, PlayCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, CLAVER_GROUP } from "@/lib/brand"
import { resolvePostLoginPathAsync } from "@/lib/auth/home-redirect"
import { activarRegisterHref, mensajeActivarTrial, resolveActivarIntent } from "@/lib/comercial/activar-intent"
import { activarProductoDesdeIntent } from "@/lib/comercial/activar-intent-client"
import { LocaleFlagToggle } from "@/components/locale-flag-toggle"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activarParam = searchParams.get("activar")
  const activarIntent = resolveActivarIntent(activarParam)
  const nextPath = activarIntent?.landingPath ?? searchParams.get("next")
  const { login, loginConToken, cargando: cargandoSesion, autenticado, token, usuario } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [enviandoLogin, setEnviandoLogin] = useState(false)

  useEffect(() => {
    if (cargandoSesion || !autenticado || !token || !usuario) return
    void (async () => {
      let dest = nextPath
      if (activarParam && activarIntent) {
        const r = await activarProductoDesdeIntent(token, activarParam)
        if (r.landingPath) dest = r.landingPath
      }
      const final = await resolvePostLoginPathAsync(token, usuario.rol, dest)
      router.replace(final)
    })()
  }, [cargandoSesion, autenticado, token, usuario, nextPath, router, activarParam, activarIntent])

  if (cargandoSesion || (autenticado && token)) {
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
    let dest = goldenPath ?? nextPath
    if (activarParam && activarIntent) {
      const r = await activarProductoDesdeIntent(token, activarParam)
      if (r.landingPath) dest = r.landingPath
    }
    const final = await resolvePostLoginPathAsync(token, rol, dest)
    router.push(final)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setEnviandoLogin(true)

    let resultado = await login(email, password)

    if (!resultado.success && email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
      try {
        const res = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ industryId: "veterinaria" }),
        })
        const data = await res.json()
        if (data.success && data.token) {
          loginConToken(data.token, data.usuario)
          await redirectAfterLogin(data.token, data.usuario.rol, data.goldenPath)
          return
        }
      } catch {
        /* fall through */
      }
    }

    if (resultado.success && resultado.usuario && resultado.token) {
      await redirectAfterLogin(resultado.token, resultado.usuario.rol)
    } else {
      setError(resultado.error || "Error al iniciar sesión")
      setEnviandoLogin(false)
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
            {activarIntent
              ? mensajeActivarTrial(activarParam)
              : `by ${CLAVER_GROUP.name} — Ingresá tus credenciales para acceder`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activarIntent && (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <AlertDescription className="text-sm">
                <span className="font-medium text-foreground">{activarIntent.productName}</span>
                {activarIntent.lema ? (
                  <span className="block text-muted-foreground mt-1">{activarIntent.lema}</span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          <Button asChild variant="outline" className="w-full h-11 gap-2">
            <Link href={activarParam ? `/demo?activar=${activarParam}` : "/demo"}>
              <PlayCircle className="h-4 w-4" />
              Probar demo interactiva por rubro
            </Link>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o con tu cuenta</span>
            </div>
          </div>

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
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={enviandoLogin}>
              {enviandoLogin ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link
                href={activarRegisterHref(activarParam)}
                className="text-primary hover:underline"
              >
                Crear cuenta
              </Link>
              <a href="/login/forgot-password" className="text-muted-foreground hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
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
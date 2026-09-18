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
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { setAuthTokenCookie } from "@/lib/auth/token-cookie"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activarParam = searchParams.get("activar")
  const activarIntent = resolveActivarIntent(activarParam)
  const nextPath = activarIntent?.landingPath ?? searchParams.get("next")
  const { login, loginConToken, loginConGoogle, logout, cargando: cargandoSesion, autenticado, token, usuario } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [enviandoLogin, setEnviandoLogin] = useState(false)
  const [enviandoGoogle, setEnviandoGoogle] = useState(false)
  const [sesionColgada, setSesionColgada] = useState(false)

  async function goAfterAuth(sessionToken: string, rol: string, email?: string | null, goldenPath?: string) {
    setAuthTokenCookie(sessionToken)
    let dest = goldenPath ?? nextPath
    if (activarParam && activarIntent) {
      const r = await activarProductoDesdeIntent(sessionToken, activarParam)
      if (r.landingPath) dest = r.landingPath
    }
    const final = await resolvePostLoginPathAsync(sessionToken, rol, dest, email)
    router.replace(final)
  }

  useEffect(() => {
    if (cargandoSesion || !autenticado || !token || !usuario) return
    void (async () => {
      try {
        await goAfterAuth(token, usuario.rol, usuario.email)
      } catch {
        logout()
      }
    })()
    // goAfterAuth cierra sobre next/activar; el efecto solo dispara al hidratar sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoSesion, autenticado, token, usuario, nextPath, router, activarParam, activarIntent, logout])

  useEffect(() => {
    if (!(cargandoSesion || (autenticado && token))) {
      setSesionColgada(false)
      return
    }
    const t = window.setTimeout(() => setSesionColgada(true), 12000)
    return () => window.clearTimeout(t)
  }, [cargandoSesion, autenticado, token])

  if (cargandoSesion || (autenticado && token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/80 shadow-sm">
          <CardHeader className="space-y-3">
            <BrandLogo size="md" variant="group-full" className="mb-1" />
            <CardDescription className="text-sm">
              {sesionColgada
                ? "La sesión tardó demasiado. Podés reintentar o entrar de nuevo."
                : "Validando sesión y abriendo tu panel…"}
            </CardDescription>
            {!sesionColgada && (
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" aria-hidden>
                <div className="h-full w-1/3 rounded-full bg-primary/70 animate-pulse" />
              </div>
            )}
            {sesionColgada && (
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={() => {
                  logout()
                  setSesionColgada(false)
                }}
              >
                Volver al inicio de sesión
              </Button>
            )}
          </CardHeader>
        </Card>
      </div>
    )
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
          await goAfterAuth(data.token, data.usuario.rol, data.usuario.email, data.goldenPath)
          return
        }
      } catch {
        /* fall through */
      }
    }

    if (resultado.success && resultado.usuario && resultado.token) {
      await goAfterAuth(resultado.token, resultado.usuario.rol, resultado.usuario.email)
    } else {
      setError(resultado.error || "Error al iniciar sesión")
      setEnviandoLogin(false)
    }
  }

  const handleGoogleLogin = async (idToken: string) => {
    setError("")
    setEnviandoGoogle(true)
    try {
      const result = await loginConGoogle(idToken)
      if (result.success && result.usuario && result.token) {
        await goAfterAuth(result.token, result.usuario.rol, result.usuario.email)
      } else if (result.needsEmpresa) {
        // Solo alta de dueño (empresa nueva). Subusuarios deben estar invitados.
        const params = new URLSearchParams()
        params.set("google", idToken)
        if (activarParam) params.set("activar", activarParam)
        router.push(`/login/register?${params.toString()}`)
      } else {
        setError(
          result.error ||
            "Error al iniciar sesión con Google. Si te invitaron, usá el mismo email de la invitación.",
        )
      }
    } finally {
      setEnviandoGoogle(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <LocaleFlagToggle />
      </div>
      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-2 pb-2">
          <BrandLogo size="md" variant="group-full" className="mb-1" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Ingresá a Claver
          </h1>
          <CardDescription className="text-sm leading-relaxed">
            {activarIntent
              ? mensajeActivarTrial(activarParam)
              : `ERP y POS para PyMEs argentinas · ${CLAVER_GROUP.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activarIntent && (
            <Alert className="border-[var(--status-success-border)] bg-[var(--status-success-muted)]">
              <AlertDescription className="text-sm">
                <span className="font-medium text-foreground">{activarIntent.productName}</span>
                {activarIntent.lema ? (
                  <span className="block text-muted-foreground mt-1">{activarIntent.lema}</span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          <Button asChild variant="outline" className="w-full h-11 min-h-[44px] gap-2">
            <Link href={activarParam ? `/demo?activar=${encodeURIComponent(activarParam)}` : "/demo"}>
              <PlayCircle className="h-4 w-4" />
              Probar demo por rubro
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground -mt-1">
            Elegís el rubro, se crea una empresa de prueba y entrás al panel.
          </p>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o con Google</span>
                </div>
              </div>

              <GoogleSignInButton
                onCredential={handleGoogleLogin}
                onError={setError}
                disabled={enviandoGoogle}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o con tu cuenta</span>
                </div>
              </div>
            </>
          )}

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

            <Button type="submit" className="w-full min-h-[44px]" disabled={enviandoLogin || enviandoGoogle}>
              {enviandoLogin ? "Ingresando…" : "Iniciar sesión"}
            </Button>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center justify-between text-sm gap-3">
                <Link
                  href={activarRegisterHref(activarParam)}
                  className="text-primary hover:underline font-medium"
                >
                  Crear cuenta
                </Link>
                <Link href="/login/forgot-password" className="text-muted-foreground hover:underline">
                  ¿Olvidaste la contraseña?
                </Link>
              </div>
              <div className="text-center mt-2">
                <Link href="/tenant" className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
                  ¿Tenés un entorno Protheus? Ingresá acá
                </Link>
              </div>
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
"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
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
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { RUBROS_SIGNUP } from "@/lib/comercial/rubro-signup"
import { trackMetaEvent } from "@/lib/analytics/meta-pixel"

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activarParam = searchParams.get("activar")
  const refParam = searchParams.get("ref")
  const googleIdToken = searchParams.get("google")
  const activarIntent = resolveActivarIntent(activarParam)
  const { loginConToken, loginConGoogle } = useAuth()

  const [form, setForm] = useState({
    empresa: "",
    nombre: "",
    email: "",
    password: "",
    confirmar: "",
  })
  const [googleUser, setGoogleUser] = useState<{
    email: string
    nombre: string
    avatarUrl?: string
    idToken: string
  } | null>(null)
  const [selectedRubro, setSelectedRubro] = useState<string>("kiosco")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordMinLength = 8
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const passwordCorta = !googleUser && form.password.length > 0 && form.password.length < passwordMinLength
  const passwordNoCoincide = !googleUser && form.confirmar.length > 0 && form.password !== form.confirmar

  const trackSignupEvents = (activarKey: string | null | undefined) => {
    trackMetaEvent("CompleteRegistration", { content_name: "Claver Fiado", status: true })
    if (resolveActivarIntent(activarKey)?.engancheId === "pos.fiado_barrio") {
      trackMetaEvent("StartTrial", { currency: "ARS" })
    }
  }

  const submitDisabledReason = cargando
    ? "Creando tu cuenta..."
    : !form.empresa.trim()
      ? "Completa el nombre de tu negocio"
      : !form.nombre.trim()
        ? "Completa tu nombre"
        : !emailValido
          ? "Ingresa un email valido"
          : !googleUser && form.password.length < passwordMinLength
            ? "La contrasena debe tener al menos 8 caracteres"
            : !googleUser && form.password !== form.confirmar
              ? "Las contrasenas no coinciden"
              : !acceptTerms
                ? "Acepta los Terminos y la Politica de privacidad"
                : ""

  // Si viene de Google auth sin empresa, pre-cargar datos
  useEffect(() => {
    if (googleIdToken && !googleUser) {
      // Llamar al endpoint para obtener datos del Google token sin crear usuario
      void (async () => {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: googleIdToken }),
        })
        const data = await res.json()
        if (data.error === "EMPRESA_REQUIRED" && data.googleUser) {
          setGoogleUser({ ...data.googleUser, idToken: googleIdToken })
          setForm((prev) => ({
            ...prev,
            nombre: data.googleUser.nombre ?? prev.nombre,
            email: data.googleUser.email ?? prev.email,
          }))
        } else if (data.success) {
          // El usuario ya fue creado (tenía empresa), redirigir
          loginConToken(data.token, data.usuario)
          router.push("/dashboard")
        }
      })()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleIdToken])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!googleUser) {
      if (form.password !== form.confirmar) {
        setError("Las contraseñas no coinciden")
        return
      }
      if (form.password.length < passwordMinLength) {
        setError("La contraseña debe tener al menos 8 caracteres")
        return
      }
    }
    if (!acceptTerms) {
      setError("Debés aceptar los Términos y la Política de privacidad")
      return
    }

    setCargando(true)
    try {
      // ── Flujo Google: crear empresa y usuario vía /api/auth/google ──────
      if (googleUser) {
        const activarKey = activarParam || selectedRubro
        const result = await loginConGoogle(googleUser.idToken, {
          empresaNombre: form.empresa,
          activar: activarKey,
        })
        if (!result.success) {
          setError(result.error ?? "Error al crear la cuenta con Google")
          return
        }

        trackSignupEvents(activarKey)

        let dest =
          result.onboarding?.landingPath ??
          resolveActivarIntent(activarKey)?.landingPath ??
          "/dashboard"
        if (activarIntent && activarParam && result.token && !result.onboarding?.landingPath) {
          const r = await activarProductoDesdeIntent(result.token, activarParam)
          if (r.landingPath) dest = r.landingPath
        }

        try {
          localStorage.setItem("claver_fresh_signup", "1")
          if (activarIntent) {
            localStorage.setItem("claver_product_marca", activarIntent.marca)
          }
        } catch { /* ignore */ }

        router.push(dest)
        return
      }

      // ── Flujo credenciales estándar ──────────────────────────────────────
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: form.empresa,
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          activar: activarParam || selectedRubro || undefined,
          ref: refParam || undefined,
          acceptTerms: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta")
        return
      }

      loginConToken(data.token, data.usuario)
      trackSignupEvents(activarParam || selectedRubro || null)

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
    <div className="min-h-screen overflow-x-hidden flex items-center justify-center bg-background p-4">
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
          <form onSubmit={handleSubmit} className="space-y-4 [&_input]:min-h-12">
            {activarIntent && (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <AlertDescription className="text-sm text-muted-foreground">
                  {activarIntent.engancheId === "pos.fiado_barrio"
                    ? "Vas a activar la libreta de fiados. Caja, stock y factura oficial los podés sumar después."
                    : <>Al crear la cuenta activamos solo <span className="font-medium text-foreground">{activarIntent.productName}</span>.</>}
                </AlertDescription>
              </Alert>
            )}
            {refParam && (
              <Alert className="border-blue-500/30 bg-blue-500/5">
                <AlertDescription className="text-sm text-muted-foreground">
                  Registro con código partner{" "}
                  <span className="font-medium text-foreground">{refParam.toUpperCase()}</span>.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="empresa">Nombre de tu Negocio / Empresa</Label>
              <Input
                id="empresa"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                required
                aria-invalid={form.empresa.length > 0 && !form.empresa.trim()}
                placeholder="Ej: Kiosco Central / Taller San Martín"
                autoComplete="organization"
              />
            </div>

            {!activarParam && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Rubro principal (para personalizar tu pantalla inicial)</Label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {RUBROS_SIGNUP.map((rubro) => (
                    <button
                      key={rubro.id}
                      type="button"
                      onClick={() => setSelectedRubro(rubro.id)}
                      className={`p-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                        selectedRubro === rubro.id
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                          : "border-border hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {rubro.emoji} {rubro.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                aria-invalid={form.nombre.length > 0 && !form.nombre.trim()}
                placeholder="Juan Pérez"
                readOnly={!!googleUser}
                className={googleUser ? "bg-muted" : ""}
                autoComplete="name"
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
                aria-invalid={form.email.length > 0 && !emailValido}
                placeholder="juan@miempresa.com"
                readOnly={!!googleUser}
                className={googleUser ? "bg-muted" : ""}
                autoComplete="email"
              />
            </div>

            {!googleUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrase?a <span className="text-xs text-muted-foreground">(8+ caracteres)</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={passwordMinLength}
                      aria-invalid={passwordCorta}
                      placeholder="M?nimo 8 caracteres"
                      autoComplete="new-password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Ocultar contrase?a" : "Mostrar contrase?a"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmar">Confirmar contraseña</Label>
                  <Input
                    id="confirmar"
                    name="confirmar"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmar}
                    onChange={handleChange}
                    required
                    minLength={passwordMinLength}
                    aria-invalid={passwordNoCoincide}
                    placeholder="Repetí la contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border"
                checked={acceptTerms}
                aria-invalid={!acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                Acepto los{" "}
                <Link href="/legal/terminos" className="text-primary hover:underline" target="_blank">
                  Términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/legal/privacidad" className="text-primary hover:underline" target="_blank">
                  Política de privacidad
                </Link>
                .
              </span>
            </label>

            <Button type="submit" className="min-h-12 w-full" disabled={Boolean(submitDisabledReason)}>
              {cargando
                ? "Creando cuenta..."
                : activarIntent
                  ? `Empezar con ${activarIntent.marca}`
                  : "Crear cuenta"}
            </Button>
            {submitDisabledReason && !cargando && (
              <p className="text-center text-xs text-muted-foreground" role="status" aria-live="polite">
                {submitDisabledReason}
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link href={loginHref} className="text-primary hover:underline">
                Iniciá sesión
              </Link>
            </p>

            {!googleUser && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">o registrate con Google</span>
                  </div>
                </div>
                <GoogleSignInButton
                  className="w-full max-w-full overflow-hidden"
                  onError={setError}
                  onCredential={async (idToken) => {
                    setError("")
                    setCargando(true)
                    try {
                      const activarKey = activarParam || selectedRubro
                      const result = await loginConGoogle(idToken, {
                        empresaNombre: form.empresa || undefined,
                        activar: activarKey,
                      })
                      if (result.success && result.usuario) {
                        try {
                          localStorage.setItem("claver_fresh_signup", "1")
                        } catch { /* ignore */ }
                        const dest =
                          result.onboarding?.landingPath ??
                          resolveActivarIntent(activarKey)?.landingPath ??
                          "/dashboard"
                        router.push(dest)
                      } else if (result.needsEmpresa) {
                        setGoogleUser({ ...result.googleUser!, idToken })
                        setForm((prev) => ({
                          ...prev,
                          nombre: result.googleUser?.nombre ?? prev.nombre,
                          email: result.googleUser?.email ?? prev.email,
                        }))
                      } else {
                        setError(result.error || "Error con Google")
                      }
                    } finally {
                      setCargando(false)
                    }
                  }}
                  text="signup_with"
                />
              </>
            )}
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
        <div className="min-h-screen overflow-x-hidden flex items-center justify-center bg-background p-4">
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
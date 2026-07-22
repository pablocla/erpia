"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
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
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

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
      if (form.password.length < 8) {
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
        const result = await loginConGoogle(googleUser.idToken, {
          empresaNombre: form.empresa,
        })
        if (!result.success) {
          setError(result.error ?? "Error al crear la cuenta con Google")
          return
        }

        let dest = "/dashboard"
        if (activarIntent && activarParam && result.token) {
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
          activar: activarParam || undefined,
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
                readOnly={!!googleUser}
                className={googleUser ? "bg-muted" : ""}
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
                readOnly={!!googleUser}
                className={googleUser ? "bg-muted" : ""}
              />
            </div>

            {!googleUser && (
              <>
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
              </>
            )}

            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border"
                checked={acceptTerms}
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

            <Button type="submit" className="w-full" disabled={cargando || !acceptTerms}>
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
                  onCredential={async (idToken) => {
                    setError("")
                    setCargando(true)
                    try {
                      const result = await loginConGoogle(idToken, {
                        empresaNombre: form.empresa || undefined,
                      })
                      if (result.success && result.usuario) {
                        router.push("/dashboard")
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
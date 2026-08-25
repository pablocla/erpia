"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { useAuth } from "@/lib/auth/hooks"

export default function ClaverClienteLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { loginConGoogle } = useAuth()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Credenciales inválidas")
        return
      }
      if (data.usuario?.rol !== "stakeholder") {
        setError("Esta cuenta no tiene acceso al portal de seguimiento")
        return
      }
      localStorage.setItem("token", data.token)
      localStorage.setItem("usuario", JSON.stringify(data.usuario))
      router.push("/claver-cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Portal de seguimiento</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acceso para decisores y referentes del proyecto Claver.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o con Google</span>
              </div>
            </div>

            <GoogleSignInButton
              onError={setError}
              onCredential={async (idToken) => {
                setError("")
                setLoading(true)
                try {
                  const result = await loginConGoogle(idToken)
                  if (result.success && result.usuario) {
                    if (result.usuario.rol !== "stakeholder") {
                      setError("Esta cuenta no tiene acceso al portal de seguimiento")
                      return
                    }
                    localStorage.setItem("token", result.token!)
                    localStorage.setItem("usuario", JSON.stringify(result.usuario))
                    router.push("/claver-cliente")
                  } else if (result.needsEmpresa) {
                    setError(
                      "No hay una invitación de stakeholder para este Google. Pedile al administrador del proyecto que te invite.",
                    )
                  } else {
                    setError(result.error || "Error al iniciar sesión con Google")
                  }
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
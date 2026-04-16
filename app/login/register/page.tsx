"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const router = useRouter()
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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta")
        return
      }

      loginConToken(data.token, data.usuario)
      router.push("/dashboard")
    } catch {
      setError("Error de conexión")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Registrá tu empresa para empezar a usar el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <a href="/login" className="text-primary hover:underline">
                Iniciá sesión
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

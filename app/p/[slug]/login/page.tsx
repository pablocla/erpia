"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function ProtheusTenantLoginPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [nombre, setNombre] = useState<string | null>(null)
  const [restReady, setRestReady] = useState(true)
  const [missing, setMissing] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/public/protheus-tenant?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setMissing(true)
          return
        }
        setNombre(data.nombre)
        setRestReady(Boolean(data.restReady))
      })
      .catch(() => setMissing(true))
  }, [slug])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/protheus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, username, password }),
    })
    const data = await res.json()
    setBusy(false)
    if (!data.success) {
      setError(data.error ?? "No se pudo entrar")
      return
    }
    login(data.token, data.usuario)
    router.replace("/dashboard/protheus")
  }

  if (missing) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#070c12] p-6 text-slate-100">
        <p className="text-sm text-slate-400">Tenant no encontrado. Pedí la URL al analista Claver.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070c12] p-6 text-slate-100">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#0e1620] p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-400">Subusuario Protheus</p>
        <h1 className="font-[var(--font-fraunces)] text-2xl">{nombre ?? "Cargando…"}</h1>
        <p className="text-sm text-slate-400">
          Solo usuarios del AppServer de este tenant (OAuth2 / token). No es el login de Claver ERP.
        </p>
        {!restReady && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            El analista todavía no expuso el REST. El login Protheus no puede validar hasta que esté la URL.
          </p>
        )}
        <div>
          <Label htmlFor="u">Usuario Protheus</Label>
          <Input
            id="u"
            className="mt-1 bg-[#182430]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <Label htmlFor="p">Contraseña</Label>
          <Input
            id="p"
            type="password"
            className="mt-1 bg-[#182430]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !restReady}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          Entrar con Protheus
        </Button>
      </form>
    </main>
  )
}

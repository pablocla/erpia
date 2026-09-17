"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cable, Download, Loader2, Unplug } from "lucide-react"
import { PRW_FILES, type ProtheusRestConfig } from "@/lib/protheus-invest/rest-config"
import {
  fetchTenantConnection,
  pingProtheus,
  pullProtheusSnapshot,
  type TenantConnection,
} from "@/lib/protheus-invest/rest-client"
import { authFetch, getToken, useAuthStore } from "@/lib/stores/auth-store"
import { useCaja } from "@/lib/protheus-invest/store"
import { PiBadge, PiButton, PiCard, PiInput } from "./ui"

export function RestConfigPanel() {
  const hydrate = useCaja((s) => s.hydrateFromProtheus)
  const reset = useCaja((s) => s.reset)
  const source = useCaja((s) => s.source)
  const pushToast = useCaja((s) => s.pushToast)
  const token = useAuthStore((s) => s.token)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  const [tenant, setTenant] = useState<TenantConnection | null>(null)
  const [baseUrl, setBaseUrl] = useState("")
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState<"ping" | "pull" | "save" | "boot" | null>(null)
  const [last, setLast] = useState<string | null>(null)

  const loggedIn = Boolean(token || (typeof window !== "undefined" && getToken()))

  useEffect(() => {
    if (!isHydrated) return
    let cancelled = false
    async function boot() {
      if (!loggedIn) return
      setBusy("boot")
      const conn = await fetchTenantConnection()
      if (cancelled) return
      setTenant(conn)
      if (conn?.baseUrl) setBaseUrl(conn.baseUrl)
      if (conn?.user) setUser(conn.user)
      if (conn?.configured) {
        try {
          const snap = await pullProtheusSnapshot()
          if (cancelled) return
          hydrate(snap)
          setLast(`Tenant ${conn.empresaNombre} · ${snap.invests.length} tenencias Z02`)
          pushToast(`Apuntando al Protheus de ${conn.empresaNombre}.`)
        } catch (err) {
          setLast(err instanceof Error ? err.message : "REST del tenant no respondió")
          pushToast("El REST precargado no respondió. Revisá Legacy Bridge.")
        }
      } else if (conn) {
        setLast("Este tenant aún no tiene REST Protheus precargado.")
      }
      setBusy(null)
    }
    void boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, loggedIn])

  function demoCfg(): ProtheusRestConfig {
    return { baseUrl, user, password, consumeLive: true }
  }

  async function onPing() {
    setBusy("ping")
    const r = await pingProtheus(loggedIn ? null : demoCfg())
    setBusy(null)
    setLast(r.ok ? `OK ${r.status} · ${r.ms} ms` : r.error ?? `HTTP ${r.status}`)
    pushToast(r.ok ? `Protheus respondió en ${r.ms} ms` : `No conecta: ${r.error ?? r.status}`)
  }

  async function onConsume() {
    setBusy("pull")
    try {
      const snap = await pullProtheusSnapshot(loggedIn ? null : demoCfg())
      hydrate(snap)
      setLast(`Live · ${snap.invests.length} tenencias Z02`)
      pushToast(`Página apuntada a este Protheus. ${snap.invests.length} holdings.`)
    } catch (err) {
      setLast(err instanceof Error ? err.message : "Error al leer holdings")
      pushToast("No se pudo hidratar desde Protheus. Seguí en demo.")
    }
    setBusy(null)
  }

  async function onSaveTenant() {
    if (!tenant?.canEdit) return
    setBusy("save")
    const res = await authFetch("/api/protheus-invest/connection", {
      method: "PATCH",
      body: JSON.stringify({ restDirectUrl: baseUrl, restAuthUser: user, restAuthPassword: password }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) {
      pushToast(typeof json.error === "string" ? json.error : "No se pudo guardar")
      return
    }
    pushToast("REST guardado en este tenant (OpoTenantConfig).")
    setTenant((t) =>
      t
        ? { ...t, configured: Boolean(json.configured), baseUrl: json.baseUrl ?? baseUrl, user: json.user ?? user, hasPassword: Boolean(json.hasPassword) }
        : t,
    )
    await onConsume()
  }

  function onDemo() {
    reset()
    setLast("Demo local (seed Claver)")
    pushToast("Dataset demo. El REST del tenant no se tocó.")
  }

  return (
    <PiCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-[#e8eef2]">
            {tenant ? `Protheus de ${tenant.empresaNombre}` : "Protheus que consume esta página"}
          </h2>
          <p className="mt-1 text-xs text-[#8fa3b3]">
            {loggedIn
              ? "Cada cliente TOTVS tiene su REST en el puente OPO / Legacy Bridge. Al entrar, esta app usa el de su empresa — las claves no salen del servidor. En claver.com.ar la URL tiene que ser HTTPS pública (TOTVS Cloud)."
              : "Vitrina demo. Entrá con un tenant para apuntar al AppServer precargado."}
          </p>
        </div>
        <PiBadge tone={source === "protheus" ? "ok" : "info"}>
          {source === "protheus" ? (tenant ? `Live · ${tenant.empresaNombre}` : "Live SIGAFIN") : "Demo"}
        </PiBadge>
      </div>
      {tenant?.loginPath && (
        <p className="mt-3 text-xs text-[#8fa3b3]">
          Login subusuarios Protheus:{" "}
          <a href={tenant.loginPath} className="text-[#3d9b8f] underline">
            {tenant.loginPath}
          </a>
        </p>
      )}

      {loggedIn && tenant && !tenant.configured && !tenant.canEdit && (
        <p className="mt-3 text-sm text-[#d4a45a]">
          Pedile al implementador que cargue el REST en{" "}
          <Link href="/dashboard/apps/opo" className="text-[#3d9b8f] underline">
            OPO Studio
          </Link>{" "}
          o en Claver Cloud → Legacy Bridge.
        </p>
      )}

      {(!loggedIn || tenant?.canEdit) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#8fa3b3]">Base REST</span>
            <PiInput
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://10.12.35.70:8404/rest"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#8fa3b3]">Usuario REST</span>
            <PiInput value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#8fa3b3]">
              Contraseña {tenant?.hasPassword ? "(guardada)" : ""}
            </span>
            <PiInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tenant?.hasPassword ? "••••••••" : ""}
              autoComplete="off"
            />
          </label>
        </div>
      )}

      {loggedIn && tenant && !tenant.canEdit && tenant.configured && (
        <p className="mt-3 text-xs text-[#8fa3b3]">
          REST {tenant.baseUrl} · usuario {tenant.user} · canal {tenant.accesoCanal ?? "rest_directo"}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PiButton onClick={onPing} disabled={!!busy}>
          {busy === "ping" || busy === "boot" ? <Loader2 className="size-3.5 animate-spin" /> : <Cable className="size-3.5" />}
          Probar health
        </PiButton>
        <PiButton onClick={onConsume} disabled={!!busy}>
          {busy === "pull" ? <Loader2 className="size-3.5 animate-spin" /> : <Cable className="size-3.5" />}
          Recargar tenencias
        </PiButton>
        {tenant?.canEdit && (
          <PiButton onClick={onSaveTenant} disabled={!!busy} variant="secondary">
            {busy === "save" ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Guardar en este tenant
          </PiButton>
        )}
        <PiButton variant="secondary" onClick={onDemo} disabled={!!busy}>
          <Unplug className="size-3.5" />
          Ver demo
        </PiButton>
        {last && <span className="text-xs text-[#8fa3b3]">{last}</span>}
      </div>

      <div className="mt-4 border-t border-[rgb(232_238_242/0.1)] pt-4">
        <p className="text-[11px] uppercase tracking-wider text-[#8fa3b3]">Compilar en TDS (orden)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRW_FILES.map((f) => (
            <a
              key={f.file}
              href={`/api/public/protheus-invest?file=${f.file}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(232_238_242/0.1)] bg-[#182430] px-2.5 py-1.5 text-xs text-[#e8eef2] hover:border-[#3d9b8f]"
            >
              <Download className="size-3" />
              {f.file}
            </a>
          ))}
        </div>
      </div>
    </PiCard>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Download, Landmark, Loader2, Server, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authFetch } from "@/lib/stores/auth-store"
import { PRW_FILES } from "@/lib/protheus-invest/rest-config"
import { pingProtheus, pullProtheusSnapshot } from "@/lib/protheus-invest/rest-client"
import { ANALISTA_STEPS, TESORERO_STEPS, type OnboardingState, type ProtheusPerfil } from "@/lib/protheus-invest/onboarding"
import { useCaja } from "@/lib/protheus-invest/store"
import { cn } from "@/lib/utils"

type Payload = OnboardingState & { restReady?: boolean; maxStep?: number }

export function ProtheusOnboardingGate({ onDone }: { onDone: (perfil: ProtheusPerfil) => void }) {
  const router = useRouter()
  const hydrate = useCaja((s) => s.hydrateFromProtheus)
  const [state, setState] = useState<Payload | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState("")
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    let cancelled = false
    authFetch("/api/protheus-invest/onboarding")
      .then((r) => r.json())
      .then((data: Payload) => {
        if (!cancelled) setState(data)
      })
      .catch(() => {
        if (!cancelled) setState({ perfil: null, step: 0, completed: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function save(patch: Partial<OnboardingState>) {
    setBusy(true)
    setError(null)
    const res = await authFetch("/api/protheus-invest/onboarding", {
      method: "PATCH",
      body: JSON.stringify(patch),
    })
    const data = (await res.json()) as Payload
    setState((s) => ({ ...s, ...data }))
    setBusy(false)
    return data
  }

  async function choose(perfil: ProtheusPerfil) {
    const next = await save({ perfil, step: 1, completed: false })
    setState(next)
  }

  async function nextStep() {
    if (!state?.perfil) return
    const max = state.perfil === "analista" ? ANALISTA_STEPS.length : TESORERO_STEPS.length
    const step = Math.min((state.step || 1) + 1, max)
    const completed = step >= max
    const next = await save({ step, completed })
    if (next.completed && next.perfil) {
      onDone(next.perfil)
      router.replace("/dashboard/protheus")
    }
  }

  async function finishAnalista() {
    setBusy(true)
    setError(null)
    const res = await authFetch("/api/protheus-invest/connection", {
      method: "PATCH",
      body: JSON.stringify({ restDirectUrl: baseUrl, restAuthUser: user, restAuthPassword: password }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "No se pudo guardar el REST")
      setBusy(false)
      return
    }
    const ping = await pingProtheus()
    if (!ping.ok) {
      setError(ping.error ?? "Health no respondió. Revisá HTTPREST y la URL.")
      setBusy(false)
      return
    }
    try {
      const snap = await pullProtheusSnapshot()
      hydrate(snap)
    } catch {
      /* health ok alcanza */
    }
    await save({ step: 5, completed: true })
    setBusy(false)
    onDone("analista")
    router.replace("/dashboard/protheus")
  }

  if (!state) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Preparando primer ingreso…
      </div>
    )
  }

  if (!state.perfil || state.step === 0) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col justify-center gap-6 p-6">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Claver Inversiones</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">¿Qué vas a hacer en este tenant?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El analista de Protheus expone los servicios. El tesorero usa la cartera. No se mezclan.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void choose("analista")}
            className="rounded-xl border bg-card p-5 text-left hover:border-primary"
          >
            <Server className="mb-3 size-6 text-primary" />
            <p className="font-medium">Analista Protheus</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bajo los .PRW, compilo, prendo el REST y apunto este tenant.
            </p>
          </button>
          <button
            type="button"
            onClick={() => void choose("tesorero")}
            className="rounded-xl border bg-card p-5 text-left hover:border-primary"
          >
            <User className="mb-3 size-6 text-primary" />
            <p className="font-medium">Tesorero / usuario</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Uso la app: cartera, constitución y rescate. El ERP ya está conectado.
            </p>
          </button>
        </div>
      </div>
    )
  }

  if (state.perfil === "analista") {
    const step = Math.min(Math.max(state.step, 1), ANALISTA_STEPS.length)
    return (
      <WizardFrame
        title="Implementación lineal"
        subtitle="Un paso detrás del otro. Cuando termina, el tesorero entra a Cartera."
        steps={ANALISTA_STEPS.map((s) => s.title)}
        current={step}
      >
        {step === 1 && (
          <StepBody
            title="1. Descargá las fuentes"
            body="Compilá estos cuatro archivos en el TDS del AppServer que atiende REST. Orden en el paso 3."
          >
            <div className="flex flex-col gap-2">
              {PRW_FILES.map((f) => (
                <a
                  key={f.file}
                  href={`/api/public/protheus-invest?file=${f.file}`}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  <Download className="size-4" />
                  {f.file}
                  <span className="text-muted-foreground">— {f.label}</span>
                </a>
              ))}
            </div>
            <Button className="mt-4" onClick={() => void nextStep()} disabled={busy}>
              Ya los descargué
            </Button>
          </StepBody>
        )}
        {step === 2 && (
          <StepBody
            title="2. Diccionario"
            body="En Configurador: Z01 tipos, Z02 operación, Z03 valuación. Reusá SA6, SED y FINA100 de localización Argentina. No toques SIGAFIN nativo."
          >
            <Button onClick={() => void nextStep()} disabled={busy}>
              Tablas publicadas
            </Button>
          </StepBody>
        )}
        {step === 3 && (
          <StepBody
            title="3. Compilar en TDS"
            body="FINZINV.PRW → FINZRES.PRW → CLVINV01.PRW → JOBFINZ03.PRW. Actualizá RPO y reiniciá el servicio REST."
          >
            <Button onClick={() => void nextStep()} disabled={busy}>
              Ya compilé
            </Button>
          </StepBody>
        )}
        {step === 4 && (
          <StepBody
            title="4. Exponer REST"
            body="appserver.ini: [HTTPREST] Enable, URL=/rest. En TOTVS Cloud pedí la URL HTTPS pública. Health: GET {base}/api/claver/v1/investments/health"
          >
            <Button onClick={() => void nextStep()} disabled={busy}>
              REST en el aire
            </Button>
          </StepBody>
        )}
        {step === 5 && (
          <StepBody
            title="5. Apuntar este tenant"
            body="La URL queda en el tenant Claver. El tesorero no carga claves."
          >
            <div className="grid max-w-lg gap-3">
              <div>
                <Label>Base REST</Label>
                <Input
                  className="mt-1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://rest-xxx.totvscloud.com.br/rest"
                />
              </div>
              <div>
                <Label>Usuario REST</Label>
                <Input className="mt-1" value={user} onChange={(e) => setUser(e.target.value)} />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  className="mt-1"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={() => void finishAnalista()} disabled={busy || !baseUrl}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Landmark className="size-4" />}
                Probar health y dejar listo
              </Button>
            </div>
          </StepBody>
        )}
      </WizardFrame>
    )
  }

  const tStep = Math.min(Math.max(state.step, 1), TESORERO_STEPS.length)
  return (
    <WizardFrame
      title="Uso de la app"
      subtitle="Cuando el analista dejó el REST, ves la cartera de tu empresa."
      steps={TESORERO_STEPS.map((s) => s.title)}
      current={tStep}
    >
      {tStep === 1 && (
        <StepBody
          title="1. Conexión"
          body={
            state.restReady
              ? "El ERP de este tenant ya está apuntado. Seguí a la cartera."
              : "Todavía no hay REST. Pedile al analista que compile y cargue la URL, o entrá en demo."
          }
        >
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void nextStep()} disabled={busy}>
              {state.restReady ? "Seguir a la cartera" : "Entrar en demo"}
            </Button>
          </div>
        </StepBody>
      )}
      {tStep === 2 && (
        <StepBody
          title="2. Cartera"
          body="Constitución saca plata del banco. Rescate la devuelve (capital e interés). No hay que tocar Protheus a mano."
        >
          <Button
            onClick={async () => {
              await save({ step: 2, completed: true })
              onDone("tesorero")
              router.replace("/dashboard/protheus")
            }}
            disabled={busy}
          >
            Abrir cartera
          </Button>
        </StepBody>
      )}
    </WizardFrame>
  )
}

function WizardFrame({
  title,
  subtitle,
  steps,
  current,
  children,
}: {
  title: string
  subtitle: string
  steps: readonly string[]
  current: number
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-8 p-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Primer ingreso</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((label, i) => {
          const n = i + 1
          const done = n < current
          const active = n === current
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-xs font-medium",
                  done && "bg-primary text-primary-foreground",
                  active && "border border-primary text-primary",
                  !done && !active && "border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : n}
              </span>
              <span className={cn(active ? "font-medium" : "text-muted-foreground")}>{label}</span>
            </li>
          )
        })}
      </ol>
      {children}
    </div>
  )
}

function StepBody({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

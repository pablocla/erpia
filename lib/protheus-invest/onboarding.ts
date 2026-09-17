import { getFeatureConfig, setFeature } from "@/lib/config/rubro-config-service"

export const PROTHEUS_ONBOARDING_FEATURE = "protheus_onboarding"

export type ProtheusPerfil = "analista" | "tesorero"

export type OnboardingState = {
  perfil: ProtheusPerfil | null
  /** 0 = elegir perfil. Analista 1–5. Tesorero 1–2. */
  step: number
  completed: boolean
}

const DEFAULT: OnboardingState = { perfil: null, step: 0, completed: false }

export const ANALISTA_STEPS = [
  { id: 1, title: "Bajar fuentes", hint: "Descargá los 4 .PRW. Van al TDS del AppServer." },
  { id: 2, title: "Diccionario", hint: "Creá Z01, Z02 y Z03. Reusá SA6, SED y FINA100." },
  { id: 3, title: "Compilar", hint: "Orden: FINZINV → FINZRES → CLVINV01 → JOBFINZ03. Restart REST." },
  { id: 4, title: "Exponer REST", hint: "HTTPREST en appserver.ini. Health tiene que responder." },
  { id: 5, title: "Apuntar Claver", hint: "URL HTTPS del tenant + usuario REST. El tesorero ya puede entrar." },
] as const

export const TESORERO_STEPS = [
  { id: 1, title: "Esperar conexión", hint: "El analista compiló y cargó la URL. Si no, ves demo." },
  { id: 2, title: "Usar la cartera", hint: "Constitución y rescate mueven el banco del ERP." },
] as const

export async function getUserOnboarding(empresaId: number, userId: number): Promise<OnboardingState> {
  const cfg = await getFeatureConfig(empresaId, PROTHEUS_ONBOARDING_FEATURE)
  const byUser = (cfg.parametros.byUser as Record<string, OnboardingState> | undefined) ?? {}
  const row = byUser[String(userId)]
  if (!row) return { ...DEFAULT }
  return {
    perfil: row.perfil === "analista" || row.perfil === "tesorero" ? row.perfil : null,
    step: Number(row.step) || 0,
    completed: Boolean(row.completed),
  }
}

export async function patchUserOnboarding(
  empresaId: number,
  userId: number,
  patch: Partial<OnboardingState>,
): Promise<OnboardingState> {
  const cfg = await getFeatureConfig(empresaId, PROTHEUS_ONBOARDING_FEATURE)
  const byUser = { ...((cfg.parametros.byUser as Record<string, OnboardingState> | undefined) ?? {}) }
  const prev = byUser[String(userId)] ?? { ...DEFAULT }
  const next: OnboardingState = {
    perfil: patch.perfil !== undefined ? patch.perfil : prev.perfil,
    step: patch.step !== undefined ? patch.step : prev.step,
    completed: patch.completed !== undefined ? patch.completed : prev.completed,
  }
  byUser[String(userId)] = next
  await setFeature(empresaId, PROTHEUS_ONBOARDING_FEATURE, {
    activado: true,
    parametros: { ...cfg.parametros, byUser },
  })
  return next
}

export function maxStepForPerfil(perfil: ProtheusPerfil | null): number {
  if (perfil === "analista") return ANALISTA_STEPS.length
  if (perfil === "tesorero") return TESORERO_STEPS.length
  return 0
}

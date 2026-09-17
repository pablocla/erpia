export type ProtheusRestConfig = {
  baseUrl: string
  user: string
  password: string
  consumeLive: boolean
}

export const REST_STORAGE_KEY = "claver.protheus.invest.rest"

export const PRW_FILES = [
  { file: "FINZINV.PRW", label: "MVC Z02/Z03 + FINA100 alta" },
  { file: "FINZRES.PRW", label: "Rescate NC/ND" },
  { file: "CLVINV01.PRW", label: "REST que consume esta página" },
  { file: "JOBFINZ03.PRW", label: "Job valuación Z03" },
] as const

/** Paths the public proxy may forward to a customer Protheus. */
export const ALLOWED_PROTHEUS_PATH =
  /^\/(api\/claver\/v1\/investments(\/[\w.{}\-]+)*|tlpp\/rest\/list\/service)\/?$/i

export function isAllowedProtheusPath(path: string): boolean {
  const clean = path.split("?")[0] ?? path
  return ALLOWED_PROTHEUS_PATH.test(clean)
}

export function loadRestConfig(): ProtheusRestConfig | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(REST_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ProtheusRestConfig>
    if (!parsed.baseUrl) return null
    return {
      baseUrl: String(parsed.baseUrl),
      user: String(parsed.user ?? ""),
      password: String(parsed.password ?? ""),
      consumeLive: Boolean(parsed.consumeLive),
    }
  } catch {
    return null
  }
}

export function saveRestConfig(cfg: ProtheusRestConfig) {
  sessionStorage.setItem(REST_STORAGE_KEY, JSON.stringify(cfg))
}

export function clearRestConfig() {
  sessionStorage.removeItem(REST_STORAGE_KEY)
}

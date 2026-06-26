export const OPO_CONSOLE_STORAGE_KEY = "claver_opo_console_creds"

export interface OpoConsoleStoredCreds {
  canal: "rest" | "sql" | "hybrid"
  rest: {
    baseUrl: string
    user: string
    password: string
  }
  sql: {
    sqlServer: string
    sqlPort: string
    sqlDatabase: string
    sqlUser: string
    sqlPassword: string
    tableSuffix: string
  }
}

export const OPO_CONSOLE_DEFAULTS: OpoConsoleStoredCreds = {
  canal: "hybrid",
  rest: {
    baseUrl: "http://10.12.35.70:8073/rest",
    user: "admin",
    password: "",
  },
  sql: {
    sqlServer: "10.12.35.70",
    sqlPort: "1433",
    sqlDatabase: "PROTHEUS",
    sqlUser: "",
    sqlPassword: "",
    tableSuffix: "010",
  },
}

export function loadOpoConsoleCreds(): OpoConsoleStoredCreds {
  if (typeof window === "undefined") return OPO_CONSOLE_DEFAULTS
  try {
    const raw = localStorage.getItem(OPO_CONSOLE_STORAGE_KEY)
    if (!raw) return OPO_CONSOLE_DEFAULTS
    const parsed = JSON.parse(raw) as Partial<OpoConsoleStoredCreds>
    return {
      canal: parsed.canal ?? OPO_CONSOLE_DEFAULTS.canal,
      rest: { ...OPO_CONSOLE_DEFAULTS.rest, ...parsed.rest },
      sql: { ...OPO_CONSOLE_DEFAULTS.sql, ...parsed.sql },
    }
  } catch {
    return OPO_CONSOLE_DEFAULTS
  }
}

export function saveOpoConsoleCreds(creds: OpoConsoleStoredCreds) {
  if (typeof window === "undefined") return
  localStorage.setItem(OPO_CONSOLE_STORAGE_KEY, JSON.stringify(creds))
}
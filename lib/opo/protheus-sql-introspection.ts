import type { IntrospectionStepResult } from "./types"

export interface ProtheusSqlCredentials {
  server: string
  port?: number
  database: string
  user: string
  password: string
  tableSuffix?: string
  encrypt?: boolean
  trustServerCertificate?: boolean
}

function suffix(creds: ProtheusSqlCredentials): string {
  return creds.tableSuffix?.trim() || "010"
}

async function getPool(creds: ProtheusSqlCredentials) {
  const mssql = await import("mssql")
  return mssql.default.connect({
    server: creds.server,
    port: creds.port ?? 1433,
    database: creds.database,
    user: creds.user,
    password: creds.password,
    options: {
      encrypt: creds.encrypt ?? false,
      trustServerCertificate: creds.trustServerCertificate ?? true,
    },
    connectionTimeout: 15_000,
    requestTimeout: 30_000,
  })
}

export function getDefaultProtheusSqlCreds(): ProtheusSqlCredentials | null {
  const server = process.env.PROTHEUS_SQL_SERVER?.trim()
  const database = process.env.PROTHEUS_SQL_DATABASE?.trim()
  const user = process.env.PROTHEUS_SQL_USER?.trim()
  const password = process.env.PROTHEUS_SQL_PASSWORD?.trim()
  if (!server || !database || !user || !password) return null
  return {
    server,
    port: Number(process.env.PROTHEUS_SQL_PORT ?? "1433"),
    database,
    user,
    password,
    tableSuffix: process.env.PROTHEUS_TABLE_SUFFIX?.trim() || "010",
  }
}

export async function runProtheusSqlIntrospection(
  creds: ProtheusSqlCredentials,
): Promise<{ steps: IntrospectionStepResult[]; ok: boolean; tables: string[] }> {
  const suf = suffix(creds)
  const steps: IntrospectionStepResult[] = []
  const tables: string[] = []

  const queries: { id: string; label: string; sql: string }[] = [
    {
      id: "sql_sx2",
      label: `SX2 — Diccionario tablas (SX2${suf})`,
      sql: `SELECT TOP 80 RTRIM(X2_CHAVE) AS tabla, RTRIM(X2_NOME) AS titulo, RTRIM(X2_MODO) AS modo
            FROM SX2${suf} WHERE D_E_L_E_T_ <> '*' ORDER BY X2_CHAVE`,
    },
    {
      id: "sql_sx3_sa1",
      label: `SX3 — Campos SA1 (SX3${suf})`,
      sql: `SELECT TOP 60 RTRIM(X3_CAMPO) AS campo, RTRIM(X3_TIPO) AS tipo, X3_TAMANHO AS tamano, RTRIM(X3_TITULO) AS titulo
            FROM SX3${suf} WHERE D_E_L_E_T_ <> '*' AND X3_ARQUIVO = 'SA1' ORDER BY X3_ORDEM`,
    },
    {
      id: "sql_sx3_sb1",
      label: `SX3 — Campos SB1 (SX3${suf})`,
      sql: `SELECT TOP 60 RTRIM(X3_CAMPO) AS campo, RTRIM(X3_TIPO) AS tipo, X3_TAMANHO AS tamano, RTRIM(X3_TITULO) AS titulo
            FROM SX3${suf} WHERE D_E_L_E_T_ <> '*' AND X3_ARQUIVO = 'SB1' ORDER BY X3_ORDEM`,
    },
    {
      id: "sql_sa1_sample",
      label: `Muestra SA1${suf} (clientes)`,
      sql: `SELECT TOP 5 RTRIM(A1_COD) AS cod, RTRIM(A1_LOJA) AS loja, RTRIM(A1_NOME) AS nombre FROM SA1${suf} WHERE D_E_L_E_T_ <> '*'`,
    },
    {
      id: "sql_sb1_sample",
      label: `Muestra SB1${suf} (productos)`,
      sql: `SELECT TOP 5 RTRIM(B1_COD) AS cod, RTRIM(B1_DESC) AS descripcion FROM SB1${suf} WHERE D_E_L_E_T_ <> '*'`,
    },
  ]

  let pool: Awaited<ReturnType<typeof getPool>> | null = null
  try {
    const t0 = Date.now()
    pool = await getPool(creds)
    steps.push({
      id: "sql_connect",
      label: "Conexión SQL Server",
      path: `${creds.server}:${creds.port ?? 1433}/${creds.database}`,
      method: "SQL",
      ok: true,
      status: 200,
      ms: Date.now() - t0,
      sample: { suffix: suf, database: creds.database },
    })
  } catch (err) {
    steps.push({
      id: "sql_connect",
      label: "Conexión SQL Server",
      path: `${creds.server}/${creds.database}`,
      method: "SQL",
      ok: false,
      status: 0,
      ms: 0,
      error: err instanceof Error ? err.message : "Sin conexión SQL",
    })
    return { steps, ok: false, tables }
  }

  for (const q of queries) {
    const t0 = Date.now()
    try {
      const result = await pool!.request().query(q.sql)
      const rows = result.recordset ?? []
      if (q.id === "sql_sx2") {
        for (const row of rows as { tabla?: string }[]) {
          if (row.tabla) tables.push(row.tabla.trim())
        }
      }
      steps.push({
        id: q.id,
        label: q.label,
        path: q.sql.slice(0, 80) + "…",
        method: "SQL",
        ok: true,
        status: 200,
        ms: Date.now() - t0,
        sample: rows,
      })
    } catch (err) {
      steps.push({
        id: q.id,
        label: q.label,
        path: q.id,
        method: "SQL",
        ok: false,
        status: 0,
        ms: Date.now() - t0,
        error: err instanceof Error ? err.message : "Error SQL",
      })
    }
  }

  try {
    await pool!.close()
  } catch {
    // ignore
  }

  return { steps, ok: steps.some((s) => s.ok && s.id !== "sql_connect"), tables }
}
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  getDefaultProtheusCreds,
  getDefaultProtheusSqlCreds,
  runFullProtheusIntrospection,
} from "@/lib/opo/protheus-introspection-service"
import { PROTHEUS_SX_TABLES, PROTHEUS_SETUP_CHECKLIST } from "@/lib/opo/protheus-sx-meta"

const bodySchema = z.object({
  canal: z.enum(["rest", "sql", "hybrid"]).optional(),
  baseUrl: z.string().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  sqlServer: z.string().optional(),
  sqlPort: z.number().optional(),
  sqlDatabase: z.string().optional(),
  sqlUser: z.string().optional(),
  sqlPassword: z.string().optional(),
  tableSuffix: z.string().optional(),
  endpointIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const restDefaults = getDefaultProtheusCreds()
  const sqlDefaults = getDefaultProtheusSqlCreds()

  return NextResponse.json({
    sxTables: PROTHEUS_SX_TABLES,
    checklist: PROTHEUS_SETUP_CHECKLIST,
    canales: [
      { id: "rest", label: "REST API", descripcion: "Framework Dictionary vía /rest" },
      { id: "sql", label: "SQL Server", descripcion: "SX2/SX3/SA1 directo en BD Protheus" },
      { id: "hybrid", label: "Híbrido", descripcion: "REST + SQL (recomendado si tenés ambos)" },
    ],
    restDefaults: restDefaults
      ? { baseUrl: restDefaults.baseUrl, user: restDefaults.user, hasPassword: true }
      : null,
    sqlDefaults: sqlDefaults
      ? {
          server: sqlDefaults.server,
          port: sqlDefaults.port,
          database: sqlDefaults.database,
          user: sqlDefaults.user,
          tableSuffix: sqlDefaults.tableSuffix,
          hasPassword: true,
        }
      : null,
  })
}

export async function POST(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const canal = parsed.data.canal ?? "rest"
  const restEnv = getDefaultProtheusCreds()
  const sqlEnv = getDefaultProtheusSqlCreds()

  const pick = (formVal: string | undefined, envVal: string | undefined) =>
    formVal !== undefined && formVal !== "" ? formVal : (envVal ?? "")

  const rest =
    canal === "rest" || canal === "hybrid"
      ? {
          baseUrl: pick(parsed.data.baseUrl, restEnv?.baseUrl),
          user: pick(parsed.data.user, restEnv?.user),
          password: pick(parsed.data.password, restEnv?.password),
        }
      : undefined

  const sql =
    canal === "sql" || canal === "hybrid"
      ? {
          server: pick(parsed.data.sqlServer, sqlEnv?.server),
          port: parsed.data.sqlPort ?? sqlEnv?.port ?? 1433,
          database: pick(parsed.data.sqlDatabase, sqlEnv?.database),
          user: pick(parsed.data.sqlUser, sqlEnv?.user),
          password: pick(parsed.data.sqlPassword, sqlEnv?.password),
          tableSuffix: pick(parsed.data.tableSuffix, sqlEnv?.tableSuffix) || "010",
        }
      : undefined

  if ((canal === "rest" || canal === "hybrid") && rest) {
    const missingRest = [
      !rest.baseUrl && "URL REST",
      !rest.user && "usuario REST",
      !rest.password && "contraseña REST",
    ].filter(Boolean)
    if (missingRest.length > 0) {
      return NextResponse.json(
        { error: `Completá en la consola OPO: ${missingRest.join(", ")}.` },
        { status: 400 },
      )
    }
  }

  if ((canal === "sql" || canal === "hybrid") && sql) {
    const missing = [
      !sql.server && "servidor SQL",
      !sql.database && "base de datos",
      !sql.user && "usuario SQL",
      !sql.password && "contraseña SQL",
    ].filter(Boolean)
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Completá en la consola OPO: ${missing.join(", ")}. El .env es opcional.`,
        },
        { status: 400 },
      )
    }
  }

  const result = await runFullProtheusIntrospection({
    canal,
    rest,
    sql,
    endpointIds: parsed.data.endpointIds,
  })

  return NextResponse.json({
    ...result,
    credsUsed: {
      canal,
      rest: rest ? { baseUrl: rest.baseUrl, user: rest.user } : null,
      sql: sql
        ? {
            server: sql.server,
            database: sql.database,
            user: sql.user,
            tableSuffix: sql.tableSuffix,
          }
        : null,
    },
  })
}
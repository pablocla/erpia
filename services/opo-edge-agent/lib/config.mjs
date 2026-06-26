import fs from "node:fs"
import path from "node:path"

export function loadConfig(argv = process.argv) {
  const flagIdx = argv.indexOf("--config")
  const configPath =
    flagIdx >= 0 && argv[flagIdx + 1]
      ? path.resolve(argv[flagIdx + 1])
      : path.resolve(process.cwd(), "config.json")

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `No se encontró ${configPath}. Copiá config.example.json → config.json y editá credenciales.`,
    )
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"))
  return {
    host: raw.host ?? "0.0.0.0",
    port: Number(raw.port ?? 4077),
    apiKey: raw.apiKey ?? "",
    organizationName: raw.organizationName ?? "Protheus Edge",
    erpName: raw.erpName ?? "TOTVS Protheus",
    erpVersion: raw.erpVersion ?? "12.1",
    routing: raw.routing ?? "hybrid",
    tableSuffix: raw.tableSuffix ?? "010",
    sql: {
      enabled: Boolean(raw.sql?.enabled),
      server: raw.sql?.server ?? "",
      port: Number(raw.sql?.port ?? 1433),
      database: raw.sql?.database ?? "",
      user: raw.sql?.user ?? "",
      password: raw.sql?.password ?? "",
      encrypt: Boolean(raw.sql?.encrypt ?? false),
      trustServerCertificate: Boolean(raw.sql?.trustServerCertificate ?? true),
    },
    rest: {
      enabled: Boolean(raw.rest?.enabled),
      baseUrl: (raw.rest?.baseUrl ?? "").replace(/\/$/, ""),
      authHeader: raw.rest?.authHeader ?? "Authorization",
      authToken: raw.rest?.authToken ?? "",
    },
    entities: raw.entities ?? {},
  }
}
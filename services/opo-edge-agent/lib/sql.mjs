let pool = null

export async function getSqlPool(config) {
  if (!config.sql.enabled) return null
  if (pool) return pool

  const mssql = await import("mssql")
  pool = await mssql.default.connect({
    server: config.sql.server,
    port: config.sql.port,
    database: config.sql.database,
    user: config.sql.user,
    password: config.sql.password,
    options: {
      encrypt: config.sql.encrypt,
      trustServerCertificate: config.sql.trustServerCertificate,
    },
  })
  return pool
}

export async function querySql(config, entityConfig, { limit = 10, search = "" }) {
  const sqlPool = await getSqlPool(config)
  if (!sqlPool) throw new Error("SQL no habilitado en el agente")

  const template = entityConfig.sql
  if (!template) throw new Error(`Sin query SQL para entidad`)

  const queryText = template.replaceAll("{{SUFFIX}}", config.tableSuffix)
  const request = sqlPool.request()
  request.input("limit", limit)
  request.input("search", search ?? "")

  const result = await request.query(queryText)
  return result.recordset ?? []
}
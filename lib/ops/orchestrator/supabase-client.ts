/**
 * Supabase API Client for Ops Orchestrator.
 * 
 * Env vars requeridas:
 * - SUPABASE_ACCESS_TOKEN
 * - SUPABASE_PROJECT_REF
 * - OPS_ORCHESTRATOR_ENABLED=false (safe mode por defecto)
 */

import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
const SUPABASE_API = "https://api.supabase.com/v1"

function getHeaders() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN no configurado")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }
}

/**
 * Trigger backup vía pg_dump
 * Nota: Como Supabase no tiene endpoint público de "Trigger Backup" en su v1 API,
 * se documenta el uso de pg_dump para backups tenant-level.
 */
export async function backupDatabase(empresaId: number, connectionString?: string) {
  if (!connectionString) {
    // Si no es dedicated DB, podríamos hacer un pg_dump parcial o logico.
    // Para simplificar, devolvemos un mock si es shared.
    return { ok: true, file: `backup_${empresaId}_${Date.now()}.sql`, message: "Simulado (Shared DB)" }
  }

  // Ojo: en serverless (Vercel) no suele haber pg_dump instalado. 
  // Esto debe correr idealmente en un worker / container con tools de postgres.
  try {
    const filename = `/tmp/backup_${empresaId}_${Date.now()}.sql`
    await execAsync(`pg_dump "${connectionString}" -F c -f ${filename}`)
    return { ok: true, file: filename, message: "Backup completado" }
  } catch (error) {
    throw new Error(`Error en pg_dump: ${error}`)
  }
}

/**
 * Ejecutar prisma migrate deploy
 * Idealmente vía child_process si estamos en un entorno con node.
 */
export async function runPrismaMigrate(connectionString?: string) {
  try {
    const env = { ...process.env }
    if (connectionString) {
      env.DATABASE_URL = connectionString
    }
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy", { env })
    return { ok: true, stdout, stderr }
  } catch (error) {
    throw new Error(`Error en prisma migrate: ${error}`)
  }
}

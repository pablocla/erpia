/**
 * Structured Error Logger — Sprint 15
 * Centralized JSON logging for API errors with request correlation.
 * Optional Sentry forwarding via SENTRY_DSN (no SDK required).
 */
import { type NextRequest } from "next/server"

type Severity = "info" | "warn" | "error" | "fatal"

interface LogEntry {
  timestamp: string
  requestId: string
  severity: Severity
  context: string
  message: string
  stack?: string
  userId?: string
  empresaId?: string
  path?: string
  method?: string
}

/**
 * Extract request ID from headers (set by middleware)
 */
function getRequestId(request?: NextRequest): string {
  return request?.headers.get("x-request-id") || crypto.randomUUID()
}

/**
 * Classify error severity based on error type
 */
function classifySeverity(error: unknown): Severity {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    // Client/validation errors are warnings
    if (
      msg.includes("validat") ||
      msg.includes("requerido") ||
      msg.includes("inválid") ||
      msg.includes("not found") ||
      msg.includes("no encontrad")
    ) {
      return "warn"
    }
    // Database connection errors are fatal
    if (
      msg.includes("prisma") && msg.includes("connect") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout")
    ) {
      return "fatal"
    }
  }
  return "error"
}

function parseSentryDsn(dsn: string): { host: string; projectId: string; publicKey: string } | null {
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace(/^\//, "")
    const publicKey = url.username
    if (!url.host || !projectId || !publicKey) return null
    return { host: url.host, projectId, publicKey }
  } catch {
    return null
  }
}

function forwardToSentry(entry: LogEntry): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn || entry.severity === "info") return

  const parsed = parseSentryDsn(dsn)
  if (!parsed) return

  const level = entry.severity === "warn" ? "warning" : entry.severity
  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: entry.timestamp,
    platform: "node",
    level,
    logger: entry.context,
    message: { formatted: entry.message },
    exception: entry.stack
      ? { values: [{ type: "Error", value: entry.message, stacktrace: { frames: [{ filename: entry.context }] } }] }
      : undefined,
    tags: {
      request_id: entry.requestId,
      ...(entry.empresaId ? { empresa_id: entry.empresaId } : {}),
      ...(entry.userId ? { user_id: entry.userId } : {}),
    },
    request: entry.path
      ? { url: entry.path, method: entry.method }
      : undefined,
  }

  const endpoint = `https://${parsed.host}/api/${parsed.projectId}/store/`
  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=claverp-logger/1.0, sentry_key=${parsed.publicKey}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* fire-and-forget */
  })
}

/**
 * Log a structured error entry
 * @param context - Module/route identifier (e.g., "api/clientes:GET")
 * @param error - The caught error
 * @param request - Optional NextRequest for correlation
 */
export function logError(context: string, error: unknown, request?: NextRequest): void {
  const severity = classifySeverity(error)
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    requestId: getRequestId(request),
    severity,
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId: request?.headers.get("x-user-id") || undefined,
    empresaId: request?.headers.get("x-empresa-id") || undefined,
    path: request?.nextUrl?.pathname,
    method: request?.method,
  }

  const logFn = severity === "fatal" || severity === "error" ? console.error : console.warn
  logFn(JSON.stringify(entry))
  forwardToSentry(entry)

  void import("@/lib/ops/sistema-log")
    .then(({ persistSistemaLog }) =>
      persistSistemaLog({
        empresaId: entry.empresaId ? Number(entry.empresaId) : undefined,
        severidad: severity,
        categoria: "api",
        contexto: context,
        mensaje: entry.message,
        stack: entry.stack,
        requestId: entry.requestId,
        metadata: { path: entry.path, method: entry.method, userId: entry.userId },
      }),
    )
    .catch(() => {
      /* fire-and-forget */
    })
}

/**
 * Log an informational audit entry
 */
export function logInfo(context: string, message: string, request?: NextRequest): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    requestId: getRequestId(request),
    severity: "info",
    context,
    message,
    userId: request?.headers.get("x-user-id") || undefined,
    empresaId: request?.headers.get("x-empresa-id") || undefined,
    path: request?.nextUrl?.pathname,
    method: request?.method,
  }
  console.log(JSON.stringify(entry))
}

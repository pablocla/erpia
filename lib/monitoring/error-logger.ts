/**
 * Structured Error Logger — Sprint 15
 * Centralized JSON logging for API errors with request correlation.
 * Ready for Sentry/Datadog/CloudWatch integration via structured JSON output.
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

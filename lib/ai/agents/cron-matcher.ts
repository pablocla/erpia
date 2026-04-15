/**
 * Cron Matcher — Lightweight cron expression evaluator
 *
 * Supports standard 5-field cron: minute hour day-of-month month day-of-week
 * No external dependencies.
 *
 * Examples:
 *   "0 6 * * *"     → every day at 6:00
 *   "0 8 * * 1-5"   → weekdays at 8:00
 *   "0 10 * * 1,3,5" → Mon/Wed/Fri at 10:00
 */

export function shouldRunNow(cronExpression: string, now = new Date()): boolean {
  const [minField, hourField, domField, monthField, dowField] = cronExpression.split(" ")
  if (!minField || !hourField || !domField || !monthField || !dowField) return false

  return (
    matchField(minField, now.getMinutes()) &&
    matchField(hourField, now.getHours()) &&
    matchField(domField, now.getDate()) &&
    matchField(monthField, now.getMonth() + 1) &&
    matchField(dowField, now.getDay()) // 0=Sunday
  )
}

/**
 * Check if the given cron expression should have run within the last N minutes
 * Useful for hourly cron jobs that need to catch agents scheduled within that window
 */
export function shouldRunInWindow(cronExpression: string, windowMinutes: number, now = new Date()): boolean {
  for (let offset = 0; offset < windowMinutes; offset++) {
    const check = new Date(now.getTime() - offset * 60_000)
    if (shouldRunNow(cronExpression, check)) return true
  }
  return false
}

function matchField(field: string, value: number): boolean {
  if (field === "*") return true

  // Handle comma-separated values: "1,3,5"
  if (field.includes(",")) {
    return field.split(",").some((part) => matchField(part.trim(), value))
  }

  // Handle ranges: "1-5"
  if (field.includes("-")) {
    const [lo, hi] = field.split("-").map(Number)
    return value >= lo && value <= hi
  }

  // Handle step: "*/5"
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2))
    return step > 0 && value % step === 0
  }

  // Exact match
  return parseInt(field) === value
}

export type SchedulerProvider = "github-actions" | "vercel" | "supabase" | "railway"
export type SchedulerTier = "free" | "premium"

/** Ventana de tolerancia del dispatcher gratuito (GitHub Actions = 5 min). */
export function getSchedulerWindowMinutes(): number {
  const raw = parseInt(process.env.SCHEDULER_WINDOW_MINUTES ?? "5", 10)
  return Number.isFinite(raw) && raw > 0 ? raw : 5
}

export function getSchedulerProvider(): SchedulerProvider {
  const value = process.env.SCHEDULER_PROVIDER
  if (
    value === "vercel" ||
    value === "supabase" ||
    value === "railway" ||
    value === "github-actions"
  ) {
    return value
  }
  return "github-actions"
}

export function getSchedulerTier(): SchedulerTier {
  return process.env.SCHEDULER_TIER === "premium" ? "premium" : "free"
}

export function isPremiumSchedulerEnabled(): boolean {
  return getSchedulerTier() === "premium"
}
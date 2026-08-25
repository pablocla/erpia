/** Decisiones puras del gate Claver Cloud (testeable, sin DOM de React). */

export const CLAVER_CLOUD_VERIFIED_KEY = "claver-cloud-verified"

export function cloudVerifiedFingerprint(token: string): string {
  return token.slice(-24)
}

export function isCloudSessionVerified(token: string | null | undefined): boolean {
  if (typeof window === "undefined" || !token) return false
  return sessionStorage.getItem(CLAVER_CLOUD_VERIFIED_KEY) === cloudVerifiedFingerprint(token)
}

export function markCloudSessionVerified(token: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(CLAVER_CLOUD_VERIFIED_KEY, cloudVerifiedFingerprint(token))
}

export function clearCloudSessionVerified(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(CLAVER_CLOUD_VERIFIED_KEY)
}

export type ClaverCloudAccessDecision =
  | { action: "ok" }
  | { action: "login" }
  | { action: "denied"; email?: string }
  | { action: "unavailable" }

export function decideClaverCloudAccess(input: {
  hasToken: boolean
  networkError?: boolean
  httpStatus?: number
  authenticated?: boolean
  isAnalyst?: boolean
  email?: string
}): ClaverCloudAccessDecision {
  if (!input.hasToken) return { action: "login" }
  if (input.networkError) return { action: "unavailable" }

  const status = input.httpStatus ?? 0
  if (status === 401) return { action: "login" }
  if (status === 403) return { action: "denied", email: input.email }
  if (status > 0 && status !== 200) return { action: "unavailable" }

  if (input.authenticated === false) return { action: "login" }
  if (input.isAnalyst) return { action: "ok" }
  return { action: "denied", email: input.email }
}

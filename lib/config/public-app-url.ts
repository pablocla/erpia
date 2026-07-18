/**
 * URL pública canónica de la app (webhooks MP, back_urls, links).
 * Preferir NEXT_PUBLIC_BASE_URL; fallback APP_URL / VERCEL_URL.
 */
export function getPublicAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    ""

  if (!raw) return "http://localhost:3000"
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "")
  }
  return `https://${raw.replace(/\/$/, "")}`
}

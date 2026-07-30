/** Reserved for market-specific client helpers (keep edge-safe). */

export function usLandingPath(slug: string): string {
  return `/claver/apps/${slug}`
}

export function parseMeta(metadata: unknown): any {
  if (!metadata) return {}
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata)
    } catch {
      return {}
    }
  }
  if (typeof metadata === "object") return metadata
  return {}
}

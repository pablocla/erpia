/** Normaliza respuestas API paginadas `{ data: T[] }` o array plano. */
export function parseApiList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data
    return Array.isArray(data) ? (data as T[]) : []
  }
  return []
}
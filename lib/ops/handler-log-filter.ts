/** HandlerLog no tiene empresaId; filtra por payload.empresaId cuando el evento lo incluye. */
export function filterHandlerLogsByEmpresa<T extends { payload: string | null }>(
  logs: T[],
  empresaId: number,
  take = 10,
): T[] {
  const matched: T[] = []
  for (const log of logs) {
    if (matched.length >= take) break
    try {
      const payload = JSON.parse(log.payload ?? "{}") as { empresaId?: number }
      if (payload.empresaId === empresaId) matched.push(log)
    } catch {
      // payload inválido — omitir (no exponer logs globales al tenant)
    }
  }
  return matched
}
/** Feedback háptico suave al agregar ítem (móvil) */
export function vibrarAgregarProducto() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(12)
    } catch {
      /* ignorar */
    }
  }
}

export function ordenarClientesPos<T extends { nombre: string; fiadoHabilitado?: boolean }>(
  clientes: T[],
): T[] {
  return [...clientes].sort((a, b) => {
    if (a.fiadoHabilitado && !b.fiadoHabilitado) return -1
    if (!a.fiadoHabilitado && b.fiadoHabilitado) return 1
    return a.nombre.localeCompare(b.nombre, "es")
  })
}

export type CajaMotivo = "cerrada" | "auth" | "red"

export function labelCajaBadge(cajaOk: boolean | null, motivo: CajaMotivo | null): string {
  if (cajaOk === null) return "Caja..."
  if (cajaOk) return "Caja OK"
  if (motivo === "auth") return "Sin sesión"
  if (motivo === "red") return "Sin conexión"
  return "Caja cerrada"
}

export function mensajeCajaBloqueada(motivo: CajaMotivo | null): string {
  if (motivo === "auth") return "Sesión expirada — volvé a iniciar sesión"
  if (motivo === "red") return "Sin conexión — no se pudo verificar la caja"
  return "Abrí la caja para vender"
}
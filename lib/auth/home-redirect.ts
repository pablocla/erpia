/**
 * Home por rol — redirect post-login
 */
export function getHomePathForRol(rol: string): string {
  const map: Record<string, string> = {
    cajero: "/dashboard/pos",
    vendedor: "/dashboard/ventas",
    mozo: "/dashboard/hospitalidad",
    deposito: "/dashboard/picking",
    contador: "/dashboard/impuestos",
    administrador: "/dashboard",
    vendedor_ruta: "/vendedor",
    personal_servicio: "/dashboard/agenda",
    profesional: "/dashboard/agenda",
    gerente: "/dashboard",
    dueno: "/dashboard",
    admin: "/dashboard",
  }
  return map[rol] ?? "/dashboard"
}
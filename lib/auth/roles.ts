/**
 * Sistema de Roles y Permisos
 *
 * 9 roles preconfigurados, adaptados automáticamente por rubro en el onboarding.
 * El dueño puede personalizar permisos individuales dentro de cada rol base.
 * Toda acción queda registrada en el log de auditoría.
 */

export type RolSistema =
  | "dueno"
  | "gerente"
  | "cajero"
  | "mozo"
  | "profesional"
  | "deposito"
  | "contador"
  | "vendedor_ruta"
  | "personal_servicio"

export type ModuloSistema =
  | "dashboard"
  | "ventas"
  | "pos"
  | "clientes"
  | "compras"
  | "proveedores"
  | "stock"
  | "productos"
  | "caja"
  | "banco"
  | "cuentas_cobrar"
  | "cuentas_pagar"
  | "contabilidad"
  | "impuestos"
  | "tes"
  | "hospitalidad"
  | "kds"
  | "agenda"
  | "historia_clinica"
  | "usuarios"
  | "configuracion"
  | "reportes"
  | "auditoria"
  | "rrhh"
  | "membresías"
  | "onboarding"

export type Permiso =
  | "ver"
  | "crear"
  | "editar"
  | "eliminar"
  | "exportar"
  | "anular"
  | "aprobar"
  | "ver_costos"
  | "ver_sueldos"
  | "ver_margenes"
  | "dar_descuentos"
  | "cobrar"
  | "abrir_caja"
  | "cerrar_caja"
  | "recibir_mercaderia"
  | "transferir_stock"

export interface PermisoModulo {
  modulo: ModuloSistema
  permisos: Permiso[]
  limites?: {
    descuentoMaxPct?: number        // % máximo de descuento
    montoAnulacionMax?: number      // monto máximo para anular sin autorización
    soloSusPropiaVentas?: boolean   // solo ve sus propias operaciones
    soloSuAgenda?: boolean          // solo ve su propia agenda
  }
}

export interface RolDefinicion {
  codigo: RolSistema
  nombre: string
  descripcion: string
  tagline: string           // Frase para el dueño del comercio
  color: string
  icono: string
  rubrosSugeridos: string[] // En qué rubros se activa automáticamente este rol
  modulosAcceso: PermisoModulo[]
  puedeVerCostos: boolean
  puedeVerSueldos: boolean
  puedeCrearUsuarios: boolean
  accesoMovil: boolean
  accesoWeb: boolean
  cantidadSugerida: string
}

export const ROLES_SISTEMA: RolDefinicion[] = [
  // ─── ROL 1: DUEÑO ──────────────────────────────────────────────────────────
  {
    codigo: "dueno",
    nombre: "Dueño / Administrador",
    descripcion: "Acceso total. Ve costos, márgenes, sueldos. Puede hacer cualquier operación.",
    tagline: "Control total del negocio desde el celular",
    color: "bg-red-100 text-red-900 border-red-300",
    icono: "Crown",
    rubrosSugeridos: ["todos"],
    puedeVerCostos: true,
    puedeVerSueldos: true,
    puedeCrearUsuarios: true,
    accesoMovil: true,
    accesoWeb: true,
    cantidadSugerida: "1 (o más si hay socios)",
    modulosAcceso: [
      { modulo: "dashboard", permisos: ["ver", "exportar"] },
      { modulo: "ventas", permisos: ["ver", "crear", "editar", "anular", "exportar"] },
      { modulo: "pos", permisos: ["ver", "crear", "cobrar", "dar_descuentos"], limites: {} },
      { modulo: "clientes", permisos: ["ver", "crear", "editar", "eliminar", "exportar"] },
      { modulo: "compras", permisos: ["ver", "crear", "editar", "anular", "aprobar", "exportar"] },
      { modulo: "proveedores", permisos: ["ver", "crear", "editar", "eliminar"] },
      { modulo: "stock", permisos: ["ver", "editar", "transferir_stock", "ver_costos"] },
      { modulo: "productos", permisos: ["ver", "crear", "editar", "eliminar", "ver_costos"] },
      { modulo: "caja", permisos: ["ver", "abrir_caja", "cerrar_caja", "exportar"] },
      { modulo: "contabilidad", permisos: ["ver", "crear", "editar", "exportar"] },
      { modulo: "impuestos", permisos: ["ver", "exportar"] },
      { modulo: "usuarios", permisos: ["ver", "crear", "editar", "eliminar"] },
      { modulo: "configuracion", permisos: ["ver", "editar"] },
      { modulo: "reportes", permisos: ["ver", "exportar"] },
      { modulo: "auditoria", permisos: ["ver", "exportar"] },
      { modulo: "rrhh", permisos: ["ver", "crear", "editar", "ver_sueldos"] },
    ],
  },

  // ─── ROL 2: GERENTE ─────────────────────────────────────────────────────────
  {
    codigo: "gerente",
    nombre: "Gerente / Encargado",
    descripcion: "Operativo completo. No ve sueldos ni configuración. Aprueba descuentos y devoluciones.",
    tagline: "Opera el negocio, no ve los números sensibles",
    color: "bg-orange-100 text-orange-900 border-orange-300",
    icono: "UserCog",
    rubrosSugeridos: ["todos"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: true,
    cantidadSugerida: "1 por sucursal",
    modulosAcceso: [
      { modulo: "dashboard", permisos: ["ver"] },
      { modulo: "ventas", permisos: ["ver", "crear", "anular"], limites: { montoAnulacionMax: 50000 } },
      { modulo: "pos", permisos: ["ver", "crear", "cobrar", "dar_descuentos"], limites: { descuentoMaxPct: 20 } },
      { modulo: "clientes", permisos: ["ver", "crear", "editar"] },
      { modulo: "compras", permisos: ["ver", "crear", "aprobar", "recibir_mercaderia"] },
      { modulo: "proveedores", permisos: ["ver", "crear", "editar"] },
      { modulo: "stock", permisos: ["ver", "editar", "recibir_mercaderia", "transferir_stock"] },
      { modulo: "productos", permisos: ["ver", "editar"] },
      { modulo: "caja", permisos: ["ver", "abrir_caja", "cerrar_caja"] },
      { modulo: "reportes", permisos: ["ver", "exportar"] },
    ],
  },

  // ─── ROL 3: CAJERO / VENDEDOR ───────────────────────────────────────────────
  {
    codigo: "cajero",
    nombre: "Cajero / Vendedor",
    descripcion: "Solo POS y consulta de stock. No ve costos. Descuentos hasta el límite configurado.",
    tagline: "Vende, cobra, sin acceso a lo que no necesita",
    color: "bg-green-100 text-green-900 border-green-300",
    icono: "ShoppingCart",
    rubrosSugeridos: ["ferreteria", "kiosco", "libreria", "ropa", "supermercado", "farmacia"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: true,
    cantidadSugerida: "1 por caja",
    modulosAcceso: [
      { modulo: "pos", permisos: ["ver", "crear", "cobrar", "dar_descuentos"], limites: { descuentoMaxPct: 10, soloSusPropiaVentas: true } },
      { modulo: "ventas", permisos: ["ver"], limites: { soloSusPropiaVentas: true } },
      { modulo: "clientes", permisos: ["ver", "crear"] },
      { modulo: "stock", permisos: ["ver"] },
      { modulo: "caja", permisos: ["ver", "abrir_caja", "cerrar_caja"] },
    ],
  },

  // ─── ROL 4: MOZO ────────────────────────────────────────────────────────────
  {
    codigo: "mozo",
    nombre: "Mozo / Atención al Cliente",
    descripcion: "Solo módulo hospitalidad. Toma comandas, no cobra. El cobro lo hace el cajero.",
    tagline: "La tablet del mozo: comandas sin papel, directo a cocina",
    color: "bg-blue-100 text-blue-900 border-blue-300",
    icono: "UtensilsCrossed",
    rubrosSugeridos: ["bar_restaurant"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: false,
    cantidadSugerida: "1 por mozo",
    modulosAcceso: [
      { modulo: "hospitalidad", permisos: ["ver", "crear", "editar"] },
      { modulo: "kds", permisos: ["ver"] },
      { modulo: "stock", permisos: ["ver"] },
    ],
  },

  // ─── ROL 5: PROFESIONAL ─────────────────────────────────────────────────────
  {
    codigo: "profesional",
    nombre: "Profesional (Médico / Vet / Odontólogo)",
    descripcion: "Solo historia clínica y su agenda. No ve finanzas. Emite recetas.",
    tagline: "El profesional ve sus pacientes, nada más",
    color: "bg-cyan-100 text-cyan-900 border-cyan-300",
    icono: "Stethoscope",
    rubrosSugeridos: ["veterinaria", "clinica"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: true,
    cantidadSugerida: "1 por profesional",
    modulosAcceso: [
      { modulo: "historia_clinica", permisos: ["ver", "crear", "editar", "exportar"], limites: { soloSuAgenda: true } },
      { modulo: "agenda", permisos: ["ver", "crear", "editar"], limites: { soloSuAgenda: true } },
      { modulo: "stock", permisos: ["ver"] },
    ],
  },

  // ─── ROL 6: DEPÓSITO ────────────────────────────────────────────────────────
  {
    codigo: "deposito",
    nombre: "Depósito / Almacén",
    descripcion: "Stock y recepción de mercadería. No ve precios de venta ni caja.",
    tagline: "El depósito sabe qué hay, no qué cuesta",
    color: "bg-yellow-100 text-yellow-900 border-yellow-300",
    icono: "Warehouse",
    rubrosSugeridos: ["ferreteria", "supermercado", "distribuidora"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: true,
    cantidadSugerida: "1 por turno",
    modulosAcceso: [
      { modulo: "stock", permisos: ["ver", "editar", "recibir_mercaderia", "transferir_stock"] },
      { modulo: "productos", permisos: ["ver"] },
      { modulo: "compras", permisos: ["ver", "recibir_mercaderia"] },
      { modulo: "proveedores", permisos: ["ver"] },
    ],
  },

  // ─── ROL 7: CONTADOR ────────────────────────────────────────────────────────
  {
    codigo: "contador",
    nombre: "Contador (acceso externo)",
    descripcion: "Solo lectura contable. Exporta libros IVA, balances, asientos. No modifica nada.",
    tagline: "El contador accede desde su estudio, sin estar en el local",
    color: "bg-purple-100 text-purple-900 border-purple-300",
    icono: "BookOpen",
    rubrosSugeridos: ["todos"],
    puedeVerCostos: true,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: false,
    accesoWeb: true,
    cantidadSugerida: "1 (contador externo)",
    modulosAcceso: [
      { modulo: "contabilidad", permisos: ["ver", "exportar"] },
      { modulo: "impuestos", permisos: ["ver", "exportar"] },
      { modulo: "ventas", permisos: ["ver", "exportar"] },
      { modulo: "compras", permisos: ["ver", "exportar"] },
      { modulo: "reportes", permisos: ["ver", "exportar"] },
    ],
  },

  // ─── ROL 8: VENDEDOR EN RUTA ─────────────────────────────────────────────
  {
    codigo: "vendedor_ruta",
    nombre: "Vendedor en Ruta",
    descripcion: "App móvil exclusiva. Toma pedidos, registra cobros. Sin acceso al backend web.",
    tagline: "El pedido queda cargado en el momento, sin papel",
    color: "bg-teal-100 text-teal-900 border-teal-300",
    icono: "Truck",
    rubrosSugeridos: ["distribuidora"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: false,
    cantidadSugerida: "1 por vendedor",
    modulosAcceso: [
      { modulo: "ventas", permisos: ["ver", "crear"], limites: { soloSusPropiaVentas: true, descuentoMaxPct: 15 } },
      { modulo: "clientes", permisos: ["ver"], limites: { soloSusPropiaVentas: true } },
      { modulo: "stock", permisos: ["ver"] },
    ],
  },

  // ─── ROL 9: PERSONAL DE SERVICIO ─────────────────────────────────────────
  {
    codigo: "personal_servicio",
    nombre: "Personal de Servicio (Peluquería / Spa)",
    descripcion: "Solo su agenda y servicios asignados. Ve sus comisiones. No cobra.",
    tagline: "El peluquero ve sus turnos, el sistema calcula sus comisiones",
    color: "bg-pink-100 text-pink-900 border-pink-300",
    icono: "Scissors",
    rubrosSugeridos: ["salon_belleza"],
    puedeVerCostos: false,
    puedeVerSueldos: false,
    puedeCrearUsuarios: false,
    accesoMovil: true,
    accesoWeb: false,
    cantidadSugerida: "1 por profesional",
    modulosAcceso: [
      { modulo: "agenda", permisos: ["ver", "editar"], limites: { soloSuAgenda: true } },
      { modulo: "stock", permisos: ["ver"] },
    ],
  },
]

/**
 * Retorna los roles sugeridos para un rubro específico.
 */
export function getRolesSugeridos(rubro: string): RolDefinicion[] {
  return ROLES_SISTEMA.filter(
    r => r.rubrosSugeridos.includes("todos") || r.rubrosSugeridos.includes(rubro)
  )
}

/**
 * Verifica si un rol tiene un permiso específico en un módulo.
 */
export function tienePermiso(rol: RolSistema, modulo: ModuloSistema, permiso: Permiso): boolean {
  const rolDef = ROLES_SISTEMA.find(r => r.codigo === rol)
  if (!rolDef) return false
  const moduloAcceso = rolDef.modulosAcceso.find(m => m.modulo === modulo)
  if (!moduloAcceso) return false
  return moduloAcceso.permisos.includes(permiso)
}

/**
 * Obtiene los límites de un rol en un módulo (descuento máximo, etc.)
 */
export function getLimitesRol(rol: RolSistema, modulo: ModuloSistema) {
  const rolDef = ROLES_SISTEMA.find(r => r.codigo === rol)
  if (!rolDef) return null
  return rolDef.modulosAcceso.find(m => m.modulo === modulo)?.limites ?? null
}

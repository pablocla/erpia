/**
 * Audit Service — Trazabilidad de cambios en configuración fiscal/contable
 *
 * Registra quién cambió qué y cuándo en:
 *   - ParametroFiscal (umbrales, claves, alícuotas)
 *   - ConfiguracionFuncional (handlers on/off)
 *   - ConfiguracionModulo (módulos activos/inactivos)
 *   - ConfigAsientoCuenta (mapeo de cuentas contables)
 *   - CuentaContable (alta/baja/modificación)
 *   - PuntoVentaConfig (punto de venta fiscal)
 *
 * Usa LogActividad como store unificado con modulo="config" y detalle structured.
 */

import { prisma } from "@/lib/prisma"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  accion: "crear" | "editar" | "eliminar" | "activar" | "desactivar"
  modulo: string
  entidad: string
  entidadId?: number
  detalle: string
  usuarioId?: number
  ip?: string
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export class AuditService {

  /**
   * Registra un cambio en el log de auditoría.
   */
  async registrar(entry: AuditEntry): Promise<void> {
    await prisma.logActividad.create({
      data: {
        accion: entry.accion,
        modulo: entry.modulo,
        entidad: entry.entidad,
        entidadId: entry.entidadId,
        detalle: entry.detalle,
        usuarioId: entry.usuarioId,
        ip: entry.ip,
      },
    })
  }

  /**
   * Helper: log a config parameter change with before/after values.
   */
  async logParametroCambio(data: {
    parametroId: number
    clave: string
    valorAnterior: string | null
    valorNuevo: string
    usuarioId?: number
    ip?: string
  }): Promise<void> {
    const detalle = data.valorAnterior
      ? `Parámetro "${data.clave}": "${data.valorAnterior}" → "${data.valorNuevo}"`
      : `Parámetro "${data.clave}" creado con valor "${data.valorNuevo}"`

    await this.registrar({
      accion: data.valorAnterior ? "editar" : "crear",
      modulo: "config",
      entidad: "ParametroFiscal",
      entidadId: data.parametroId,
      detalle,
      usuarioId: data.usuarioId,
      ip: data.ip,
    })
  }

  /**
   * Helper: log handler activation/deactivation.
   */
  async logHandlerToggle(data: {
    handlerNombre: string
    activo: boolean
    usuarioId?: number
    ip?: string
  }): Promise<void> {
    await this.registrar({
      accion: data.activo ? "activar" : "desactivar",
      modulo: "config",
      entidad: "ConfiguracionFuncional",
      detalle: `Handler "${data.handlerNombre}" ${data.activo ? "activado" : "desactivado"}`,
      usuarioId: data.usuarioId,
      ip: data.ip,
    })
  }

  /**
   * Helper: log module activation/deactivation.
   */
  async logModuloToggle(data: {
    moduloNombre: string
    activo: boolean
    usuarioId?: number
    ip?: string
  }): Promise<void> {
    await this.registrar({
      accion: data.activo ? "activar" : "desactivar",
      modulo: "config",
      entidad: "ConfiguracionModulo",
      detalle: `Módulo "${data.moduloNombre}" ${data.activo ? "activado" : "desactivado"}`,
      usuarioId: data.usuarioId,
      ip: data.ip,
    })
  }

  /**
   * Helper: log accounting account change.
   */
  async logCuentaContable(data: {
    accion: "crear" | "editar" | "eliminar"
    cuentaId: number
    codigo: string
    nombre: string
    cambio?: string
    usuarioId?: number
    ip?: string
  }): Promise<void> {
    const detalle = data.cambio
      ? `Cuenta ${data.codigo} "${data.nombre}": ${data.cambio}`
      : `Cuenta ${data.codigo} "${data.nombre}" ${data.accion === "crear" ? "creada" : data.accion === "eliminar" ? "eliminada" : "editada"}`

    await this.registrar({
      accion: data.accion,
      modulo: "contabilidad",
      entidad: "CuentaContable",
      entidadId: data.cuentaId,
      detalle,
      usuarioId: data.usuarioId,
      ip: data.ip,
    })
  }

  /**
   * Query audit trail for config changes — returns entries with filters.
   */
  async consultarCambiosConfig(filtros: {
    entidad?: string
    desde?: Date
    hasta?: Date
    usuarioId?: number
    skip?: number
    take?: number
  } = {}) {
    const where: Record<string, unknown> = {
      modulo: { in: ["config", "contabilidad"] },
    }
    if (filtros.entidad) where.entidad = filtros.entidad
    if (filtros.usuarioId) where.usuarioId = filtros.usuarioId
    if (filtros.desde || filtros.hasta) {
      where.createdAt = {
        ...(filtros.desde ? { gte: filtros.desde } : {}),
        ...(filtros.hasta ? { lte: filtros.hasta } : {}),
      }
    }

    const [data, total] = await Promise.all([
      prisma.logActividad.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true, email: true, rol: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: filtros.skip ?? 0,
        take: filtros.take ?? 50,
      }),
      prisma.logActividad.count({ where }),
    ])

    return { data, total }
  }

  /**
   * Summary: count of config changes by entity in last N days.
   */
  async resumenCambios(dias: number = 30) {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)

    const porEntidad = await prisma.logActividad.groupBy({
      by: ["entidad"],
      where: {
        modulo: { in: ["config", "contabilidad"] },
        createdAt: { gte: desde },
      },
      _count: true,
      orderBy: { _count: { entidad: "desc" } },
    })

    const porAccion = await prisma.logActividad.groupBy({
      by: ["accion"],
      where: {
        modulo: { in: ["config", "contabilidad"] },
        createdAt: { gte: desde },
      },
      _count: true,
    })

    return {
      dias,
      porEntidad: porEntidad.map((g) => ({ entidad: g.entidad, count: g._count })),
      porAccion: porAccion.map((g) => ({ accion: g.accion, count: g._count })),
    }
  }
}

export const auditService = new AuditService()

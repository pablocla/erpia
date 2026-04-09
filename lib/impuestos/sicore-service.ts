/**
 * SICORE Service — Retenciones y Constancias
 *
 * Manages SICORE (Sistema de Control de Retenciones AFIP) withholdings.
 * Applies to companies that are designated SICORE agents (grandes contribuyentes).
 *
 * Supported withholding codes:
 *   217 — Retención IVA 10.5% (base: IVA amount 10.5% × 50%)
 *   219 — Retención IVA 21%   (base: IVA amount 21% × 50%)
 *   305 — Retención Ganancias bienes (RG 830) — 2% over base ≥ $400,000
 *   767 — Retención Ganancias servicios       — 6% over base ≥ $150,000
 *   779 — Retención Ganancias locaciones obra — 6% over base ≥ $150,000
 *
 * References:
 *   RG 2854/2010 — SICORE IVA
 *   RG 830/2000  — SICORE Ganancias
 */

import { prisma } from "@/lib/prisma"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CrearRetencionInput {
  tipo: "IVA" | "ganancias"
  codigoSicore: "217" | "219" | "305" | "767" | "779"
  base: number
  alicuota: number
  monto: number
  compraId?: number
  proveedorId?: number
  fechaRetencion?: Date
}

export interface FiltrosRetencion {
  mes?: number
  anio?: number
  tipo?: "IVA" | "ganancias"
  estado?: "pendiente" | "acreditada" | "compensada"
  proveedorId?: number
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export class SICOREService {

  /**
   * Registers a new SICORE withholding.
   * Called when processing a supplier payment where the company is a designated agent.
   */
  async registrarRetencion(data: CrearRetencionInput) {
    return prisma.retencionSICORE.create({
      data: {
        tipo:           data.tipo,
        codigoSicore:   data.codigoSicore,
        base:           data.base,
        alicuota:       data.alicuota,
        monto:          data.monto,
        fechaRetencion: data.fechaRetencion ?? new Date(),
        estado:         "pendiente",
        compraId:       data.compraId,
        proveedorId:    data.proveedorId,
      },
      include: { proveedor: true, compra: true },
    })
  }

  /**
   * Lists retenciones with optional filters.
   */
  async listarRetenciones(filtros: FiltrosRetencion = {}) {
    const where: any = {}

    if (filtros.tipo)        where.tipo    = filtros.tipo
    if (filtros.estado)      where.estado  = filtros.estado
    if (filtros.proveedorId) where.proveedorId = filtros.proveedorId

    if (filtros.mes && filtros.anio) {
      const desde = new Date(filtros.anio, filtros.mes - 1, 1)
      const hasta = new Date(filtros.anio, filtros.mes, 0, 23, 59, 59)
      where.fechaRetencion = { gte: desde, lte: hasta }
    } else if (filtros.anio) {
      const desde = new Date(filtros.anio, 0, 1)
      const hasta = new Date(filtros.anio, 11, 31, 23, 59, 59)
      where.fechaRetencion = { gte: desde, lte: hasta }
    }

    return prisma.retencionSICORE.findMany({
      where,
      include: { proveedor: { select: { nombre: true, cuit: true } }, compra: true },
      orderBy: { fechaRetencion: "desc" },
    })
  }

  /**
   * Returns totals by code for a given period.
   */
  async totalesPorPeriodo(mes: number, anio: number) {
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes, 0, 23, 59, 59)

    const retenciones = await prisma.retencionSICORE.findMany({
      where: { fechaRetencion: { gte: desde, lte: hasta } },
    })

    const agrupado: Record<string, { codigo: string; tipo: string; cantidad: number; totalBase: number; totalMonto: number }> = {}
    for (const r of retenciones) {
      if (!agrupado[r.codigoSicore]) {
        agrupado[r.codigoSicore] = { codigo: r.codigoSicore, tipo: r.tipo, cantidad: 0, totalBase: 0, totalMonto: 0 }
      }
      agrupado[r.codigoSicore].cantidad++
      agrupado[r.codigoSicore].totalBase  += r.base
      agrupado[r.codigoSicore].totalMonto += r.monto
    }

    return {
      periodo: `${String(mes).padStart(2, "0")}/${anio}`,
      resumen: Object.values(agrupado),
      totalRetenciones: retenciones.reduce((s, r) => s + r.monto, 0),
    }
  }

  /**
   * Marks a retention as credited (acreditada) after the supplier applies it.
   */
  async acreditarRetencion(id: number) {
    return prisma.retencionSICORE.update({
      where: { id },
      data: { estado: "acreditada", updatedAt: new Date() },
    })
  }

  /**
   * Generates a SIAP-compatible text file for SICORE presentation.
   * Format: fixed-width per RG 2854/2010 Anexo IV.
   *
   * Each line = 100 chars:
   *   01-02  código retención (2)
   *   03-16  CUIT retenido    (14)
   *   17-24  fecha            (AAAAMMDD)
   *   25-38  monto base       (14, 2 dec, right-aligned)
   *   39-52  monto retenido   (14, 2 dec, right-aligned)
   *   53-53  tipo operación   (1) "V"=venta "C"=compra
   *   54-100 reserved spaces  (47)
   */
  async generarArchivoSICORE(mes: number, anio: number): Promise<string> {
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes, 0, 23, 59, 59)

    const retenciones = await prisma.retencionSICORE.findMany({
      where: { fechaRetencion: { gte: desde, lte: hasta } },
      include: { proveedor: true },
      orderBy: { fechaRetencion: "asc" },
    })

    const lines: string[] = []
    for (const r of retenciones) {
      const cuit   = (r.proveedor?.cuit ?? "00000000000").replace(/-/g, "").padStart(14, "0")
      const fecha  = this.formatFecha(r.fechaRetencion)
      const base   = this.formatMonto(r.base)
      const monto  = this.formatMonto(r.monto)
      const cod    = r.codigoSicore.padStart(2, "0")
      const line   = `${cod}${cuit}${fecha}${base}${monto}C${" ".repeat(47)}`
      lines.push(line)
    }

    return lines.join("\r\n")
  }

  /**
   * Generates a human-readable constancia de retención for RG 2854.
   */
  async generarConstanciaRetencion(id: number): Promise<string> {
    const r = await prisma.retencionSICORE.findUnique({
      where: { id },
      include: { proveedor: true, compra: true },
    })
    if (!r) throw new Error(`Retención SICORE #${id} no encontrada`)

    const nombreCodigo: Record<string, string> = {
      "217": "Retención IVA — Cód. 217 (10.5%)",
      "219": "Retención IVA — Cód. 219 (21%)",
      "305": "Retención Ganancias — Cód. 305 (Bienes 2%)",
      "767": "Retención Ganancias — Cód. 767 (Servicios 6%)",
      "779": "Retención Ganancias — Cód. 779 (Locaciones 6%)",
    }

    const lines = [
      "═══════════════════════════════════════════════════════════",
      "         CONSTANCIA DE RETENCIÓN SICORE — RG 2854",
      "═══════════════════════════════════════════════════════════",
      `Concepto:        ${nombreCodigo[r.codigoSicore] ?? r.codigoSicore}`,
      `Fecha retención: ${r.fechaRetencion.toLocaleDateString("es-AR")}`,
      `Proveedor:       ${r.proveedor?.nombre ?? "N/A"}`,
      `CUIT proveedor:  ${r.proveedor?.cuit ?? "N/A"}`,
      ``,
      `Base imponible:  $ ${r.base.toFixed(2)}`,
      `Alícuota:        ${r.alicuota}%`,
      `Monto retenido:  $ ${r.monto.toFixed(2)}`,
      `Estado:          ${r.estado.toUpperCase()}`,
      ``,
      `Referencia compra: ${r.compra ? `#${r.compra.id} — ${r.compra.tipo} ${r.compra.numero}` : "N/A"}`,
      "═══════════════════════════════════════════════════════════",
      "Este comprobante acredita la retención practicada en el",
      "marco del RG AFIP Nro. 2854/2010 (IVA) / 830/2000 (Ganancias).",
    ]

    return lines.join("\n")
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private formatFecha(d: Date): string {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  }

  private formatMonto(n: number): string {
    return n.toFixed(2).replace(".", "").padStart(14, "0")
  }
}

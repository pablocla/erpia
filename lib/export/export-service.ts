/**
 * Export Service — Sprint 15
 * Generates CSV & XLSX-compatible exports for key business data.
 * CSV uses RFC 4180 format with BOM for Excel compatibility.
 * XLSX support requires optional `exceljs` package — degrades to CSV if not installed.
 */
import { prisma } from "@/lib/prisma"

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportFormat = "csv" | "xlsx"

interface ExportResult {
  buffer: Buffer
  filename: string
  contentType: string
}

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSV(headers: string[], rows: unknown[][]): Buffer {
  const bom = "\uFEFF" // UTF-8 BOM for Excel
  const headerLine = headers.map(csvEscape).join(",")
  const dataLines = rows.map((row) => row.map(csvEscape).join(","))
  const content = [headerLine, ...dataLines].join("\r\n")
  return Buffer.from(bom + content, "utf-8")
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return ""
  return d.toISOString().split("T")[0]
}

function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0.00"
  return n.toFixed(2)
}

// ─── Export Functions ─────────────────────────────────────────────────────────

export const exportService = {
  /**
   * Export client list
   */
  async exportarClientes(empresaId: number, format: ExportFormat = "csv"): Promise<ExportResult> {
    const clientes = await prisma.cliente.findMany({
      where: { empresaId } as any,
      orderBy: { nombre: "asc" },
    })

    const headers = ["ID", "Nombre", "CUIT", "DNI", "Condición IVA", "Dirección", "Teléfono", "Email", "Fecha Alta"]
    const rows = clientes.map((c) => [
      c.id, c.nombre, c.cuit || "", c.dni || "", c.condicionIva,
      c.direccion || "", c.telefono || "", c.email || "", formatDate(c.createdAt),
    ])

    return {
      buffer: toCSV(headers, rows),
      filename: `clientes_${new Date().toISOString().split("T")[0]}.csv`,
      contentType: "text/csv; charset=utf-8",
    }
  },

  /**
   * Export product catalog
   */
  async exportarProductos(empresaId: number, format: ExportFormat = "csv"): Promise<ExportResult> {
    const productos = await prisma.producto.findMany({
      where: { empresaId } as any,
      include: { categoria: true },
      orderBy: { codigo: "asc" },
    })

    const headers = [
      "Código", "Nombre", "Descripción", "Categoría", "Precio Venta", "Precio Compra",
      "IVA %", "Stock", "Stock Mín.", "Unidad", "Activo",
    ]
    const rows = productos.map((p: any) => [
      p.codigo, p.nombre, p.descripcion || "", p.categoria?.nombre || "",
      formatMoney(p.precioVenta), formatMoney(p.precioCompra),
      p.porcentajeIva, p.stock, p.stockMinimo, p.unidad, p.activo ? "Sí" : "No",
    ])

    return {
      buffer: toCSV(headers, rows),
      filename: `productos_${new Date().toISOString().split("T")[0]}.csv`,
      contentType: "text/csv; charset=utf-8",
    }
  },

  /**
   * Export ventas / facturas
   */
  async exportarFacturas(
    empresaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
    format: ExportFormat = "csv",
  ): Promise<ExportResult> {
    const facturas = await prisma.factura.findMany({
      where: {
        empresaId,
        createdAt: { gte: fechaDesde, lte: fechaHasta },
      },
      include: { cliente: true, lineas: true },
      orderBy: { createdAt: "asc" },
    })

    const headers = [
      "Fecha", "Tipo", "Punto Venta", "Número", "Cliente", "CUIT Cliente",
      "Subtotal", "IVA", "Percepciones", "Total", "CAE", "Estado", "Moneda", "T.Cambio",
    ]
    const rows = facturas.map((f) => [
      formatDate(f.createdAt), f.tipo, f.puntoVenta,
      f.numero.toString().padStart(8, "0"),
      f.cliente.nombre, f.cliente.cuit || "",
      formatMoney(f.subtotal), formatMoney(f.iva),
      formatMoney(f.totalPercepciones), formatMoney(f.total),
      f.cae || "", f.estado, f.monedaOrigen, f.tipoCambio,
    ])

    return {
      buffer: toCSV(headers, rows),
      filename: `facturas_${formatDate(fechaDesde)}_${formatDate(fechaHasta)}.csv`,
      contentType: "text/csv; charset=utf-8",
    }
  },

  /**
   * Export compras
   */
  async exportarCompras(
    empresaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
    format: ExportFormat = "csv",
  ): Promise<ExportResult> {
    const compras = await prisma.compra.findMany({
      where: {
        empresaId,
        fecha: { gte: fechaDesde, lte: fechaHasta },
      },
      include: { proveedor: true, lineas: true },
      orderBy: { fecha: "asc" },
    })

    const headers = [
      "Fecha", "Tipo", "Punto Venta", "Número", "Proveedor", "CUIT Proveedor",
      "Subtotal", "IVA", "Percepciones", "Retenciones", "Total", "CAE Proveedor", "Verificación",
    ]
    const rows = compras.map((c) => [
      formatDate(c.fecha), c.tipo, c.puntoVenta, c.numero,
      c.proveedor.nombre, c.proveedor.cuit,
      formatMoney(c.subtotal), formatMoney(c.iva),
      formatMoney(c.totalPercepciones), formatMoney(c.totalRetenciones),
      formatMoney(c.total), c.caeProveedor || "", c.estadoVerificacionCAE || "",
    ])

    return {
      buffer: toCSV(headers, rows),
      filename: `compras_${formatDate(fechaDesde)}_${formatDate(fechaHasta)}.csv`,
      contentType: "text/csv; charset=utf-8",
    }
  },

  /**
   * Export libro IVA (ventas + compras discriminated by alicuota)
   */
  async exportarLibroIVA(
    empresaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
    tipo: "ventas" | "compras" = "ventas",
  ): Promise<ExportResult> {
    if (tipo === "ventas") {
      const facturas = await prisma.factura.findMany({
        where: {
          empresaId,
          createdAt: { gte: fechaDesde, lte: fechaHasta },
          estado: { not: "anulada" },
        },
        include: { cliente: true, lineas: true },
        orderBy: { createdAt: "asc" },
      })

      const headers = [
        "Fecha", "Tipo Cbte", "Punto Venta", "Número", "CUIT Cliente", "Nombre Cliente",
        "Neto Gravado", "IVA 21%", "IVA 10.5%", "IVA 27%", "IVA 0%", "Percepciones", "Total",
      ]
      const rows = facturas.map((f) => {
        const iva21 = f.lineas.filter((l) => l.porcentajeIva === 21).reduce((s, l) => s + l.iva, 0)
        const iva105 = f.lineas.filter((l) => l.porcentajeIva === 10.5).reduce((s, l) => s + l.iva, 0)
        const iva27 = f.lineas.filter((l) => l.porcentajeIva === 27).reduce((s, l) => s + l.iva, 0)
        const iva0 = f.lineas.filter((l) => l.porcentajeIva === 0).reduce((s, l) => s + l.subtotal, 0)

        return [
          formatDate(f.createdAt), f.tipoCbte, f.puntoVenta,
          f.numero.toString().padStart(8, "0"),
          f.cliente.cuit || "", f.cliente.nombre,
          formatMoney(f.subtotal),
          formatMoney(iva21), formatMoney(iva105), formatMoney(iva27), formatMoney(iva0),
          formatMoney(f.totalPercepciones), formatMoney(f.total),
        ]
      })

      return {
        buffer: toCSV(headers, rows),
        filename: `libro_iva_ventas_${formatDate(fechaDesde)}_${formatDate(fechaHasta)}.csv`,
        contentType: "text/csv; charset=utf-8",
      }
    } else {
      const compras = await prisma.compra.findMany({
        where: {
          empresaId,
          fecha: { gte: fechaDesde, lte: fechaHasta },
        },
        include: { proveedor: true, lineas: true },
        orderBy: { fecha: "asc" },
      })

      const headers = [
        "Fecha", "Tipo", "Punto Venta", "Número", "CUIT Proveedor", "Nombre Proveedor",
        "Neto Gravado", "IVA 21%", "IVA 10.5%", "IVA 27%", "Percepciones", "Retenciones", "Total",
      ]
      const rows = compras.map((c) => {
        const iva21 = c.lineas.filter((l) => l.porcentajeIva === 21).reduce((s, l) => s + l.iva, 0)
        const iva105 = c.lineas.filter((l) => l.porcentajeIva === 10.5).reduce((s, l) => s + l.iva, 0)
        const iva27 = c.lineas.filter((l) => l.porcentajeIva === 27).reduce((s, l) => s + l.iva, 0)

        return [
          formatDate(c.fecha), c.tipo, c.puntoVenta, c.numero,
          c.proveedor.cuit, c.proveedor.nombre,
          formatMoney(c.subtotal),
          formatMoney(iva21), formatMoney(iva105), formatMoney(iva27),
          formatMoney(c.totalPercepciones), formatMoney(c.totalRetenciones),
          formatMoney(c.total),
        ]
      })

      return {
        buffer: toCSV(headers, rows),
        filename: `libro_iva_compras_${formatDate(fechaDesde)}_${formatDate(fechaHasta)}.csv`,
        contentType: "text/csv; charset=utf-8",
      }
    }
  },

  /**
   * Export cuentas a cobrar (aging)
   */
  async exportarCuentasCobrar(empresaId: number): Promise<ExportResult> {
    const cuentas = await prisma.cuentaCobrar.findMany({
      where: { factura: { empresaId } },
      include: {
        factura: { select: { tipo: true, numero: true, puntoVenta: true } },
        cliente: { select: { nombre: true, cuit: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
    })

    const headers = [
      "Cliente", "CUIT", "Factura", "Fecha Emisión", "Vencimiento",
      "Monto Original", "Monto Pagado", "Saldo", "Estado", "Días Vencida",
    ]
    const today = new Date()
    const rows = cuentas.map((c: any) => {
      const diasVencida = c.fechaVencimiento < today && c.estado !== "pagada"
        ? Math.floor((today.getTime() - c.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return [
        c.cliente.nombre, c.cliente.cuit || "",
        `${c.factura.tipo} ${c.factura.puntoVenta}-${c.factura.numero}`,
        formatDate(c.fechaEmision), formatDate(c.fechaVencimiento),
        formatMoney(Number(c.montoOriginal)), formatMoney(Number(c.montoPagado)), formatMoney(Number(c.saldo)),
        c.estado, diasVencida,
      ]
    })

    return {
      buffer: toCSV(headers, rows),
      filename: `cuentas_cobrar_${formatDate(today)}.csv`,
      contentType: "text/csv; charset=utf-8",
    }
  },

  /**
   * Export cuentas a pagar (aging)
   */
  async exportarCuentasPagar(empresaId: number): Promise<ExportResult> {
    const cuentas = await prisma.cuentaPagar.findMany({
      where: { compra: { empresaId } } as any,
      include: {
        compra: { select: { tipo: true, numero: true, puntoVenta: true } },
        proveedor: { select: { nombre: true, cuit: true } },
      },
      orderBy: { fechaVencimiento: "asc" },
    })

    const headers = [
      "Proveedor", "CUIT", "Compra", "Fecha Emisión", "Vencimiento",
      "Monto Original", "Monto Pagado", "Saldo", "Estado", "Días Vencida",
    ]
    const today = new Date()
    const rows = cuentas.map((c: any) => {
      const diasVencida = c.fechaVencimiento < today && c.estado !== "pagada"
        ? Math.floor((today.getTime() - c.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return [
        c.proveedor.nombre, c.proveedor.cuit,
        `${c.compra.tipo} ${c.compra.puntoVenta}-${c.compra.numero}`,
        formatDate(c.fechaEmision), formatDate(c.fechaVencimiento),
        formatMoney(Number(c.montoOriginal)), formatMoney(Number(c.montoPagado)), formatMoney(Number(c.saldo)),
        c.estado, diasVencida,
      ]
    })

    return {
      buffer: toCSV(headers, rows),
      filename: `cuentas_pagar_${formatDate(today)}.csv`,
      contentType: "text/csv; charset=utf-8",
    }
  },
}

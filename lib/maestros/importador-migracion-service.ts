/**
 * Importador Universal de Migración — Onboarding Industrializado desde Excel / Tango / Bejerman
 *
 * Provee:
 *   1. Validación previa en modo Dry-Run (detección exhaustiva de errores antes de impactar la base)
 *   2. Normalización de CUIT con validación de dígito verificador argentino (Módulo 11)
 *   3. Creación atómica en lote con inicialización de stock y movimiento de apertura
 */

import { prisma } from "@/lib/prisma"

export interface FilaProductoImport {
  codigo: string
  nombre: string
  precioUnitario: number | string
  costoUnitario?: number | string
  porcentajeIva?: number | string
  stockInicial?: number | string
  stockMinimo?: number | string
  categoria?: string
  codigoBarras?: string
}

export interface FilaClienteImport {
  nombre: string
  cuit?: string
  dni?: string
  condicionIva?: string
  email?: string
  telefono?: string
  direccion?: string
  limiteCredito?: number | string
}

export interface ErrorValidacionFila {
  fila: number
  codigoOIdentificador: string
  campo: string
  mensaje: string
}

export interface ResultadoDryRun<T> {
  valido: boolean
  totalFilas: number
  filasValidas: number
  filasConError: number
  errores: ErrorValidacionFila[]
  datosNormalizados: T[]
}

/**
 * Valida un CUIT/CUIL argentino mediante el algoritmo Módulo 11 oficial de AFIP.
 */
export function validarCuitAfip(cuitStr: string): boolean {
  const clean = cuitStr.replace(/\D/g, "")
  if (clean.length !== 11) return false

  const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let acumulado = 0

  for (let i = 0; i < 10; i++) {
    acumulado += Number(clean[i]) * factores[i]
  }

  const resto = acumulado % 11
  let verificadorCalculado = 11 - resto
  if (verificadorCalculado === 11) verificadorCalculado = 0
  if (verificadorCalculado === 10) verificadorCalculado = 9

  return Number(clean[10]) === verificadorCalculado
}

export class ImportadorMigracionService {
  /**
   * Valida en modo Dry-Run un lote de productos sin escribir en la base de datos.
   */
  async dryRunProductos(filas: FilaProductoImport[], empresaId: number): Promise<ResultadoDryRun<FilaProductoImport>> {
    const errores: ErrorValidacionFila[] = []
    const codigosVistos = new Set<string>()
    const datosNormalizados: FilaProductoImport[] = []

    // Obtener códigos existentes en la empresa
    const existentes = await prisma.producto.findMany({
      where: { empresaId },
      select: { codigo: true },
    })
    const codigosExistentes = new Set(existentes.map((p) => p.codigo.trim().toUpperCase()))

    filas.forEach((fila, index) => {
      const numFila = index + 1
      const codigo = (fila.codigo ?? "").trim().toUpperCase()
      const nombre = (fila.nombre ?? "").trim()
      const precio = Number(fila.precioUnitario)

      if (!codigo) {
        errores.push({ fila: numFila, codigoOIdentificador: "VACÍO", campo: "codigo", mensaje: "El código de producto es obligatorio." })
      } else if (codigosVistos.has(codigo)) {
        errores.push({ fila: numFila, codigoOIdentificador: codigo, campo: "codigo", mensaje: `Código duplicado en el archivo: ${codigo}.` })
      } else {
        codigosVistos.add(codigo)
      }

      if (!nombre) {
        errores.push({ fila: numFila, codigoOIdentificador: codigo, campo: "nombre", mensaje: "La descripción o nombre del producto es obligatoria." })
      }

      if (isNaN(precio) || precio < 0) {
        errores.push({ fila: numFila, codigoOIdentificador: codigo, campo: "precioUnitario", mensaje: "El precio unitario debe ser un número mayor o igual a 0." })
      }

      const iva = fila.porcentajeIva !== undefined ? Number(fila.porcentajeIva) : 21
      if (isNaN(iva) || ![0, 2.5, 5, 10.5, 21, 27].includes(iva)) {
        errores.push({ fila: numFila, codigoOIdentificador: codigo, campo: "porcentajeIva", mensaje: `Alícuota de IVA inválida (${fila.porcentajeIva}). Valores permitidos: 0, 2.5, 5, 10.5, 21, 27.` })
      }

      datosNormalizados.push({
        codigo,
        nombre,
        precioUnitario: precio,
        costoUnitario: fila.costoUnitario !== undefined ? Number(fila.costoUnitario) : 0,
        porcentajeIva: iva,
        stockInicial: fila.stockInicial !== undefined ? Number(fila.stockInicial) : 0,
        stockMinimo: fila.stockMinimo !== undefined ? Number(fila.stockMinimo) : 0,
        categoria: fila.categoria?.trim(),
        codigoBarras: fila.codigoBarras?.trim(),
      })
    })

    return {
      valido: errores.length === 0,
      totalFilas: filas.length,
      filasValidas: filas.length - new Set(errores.map((e) => e.fila)).size,
      filasConError: new Set(errores.map((e) => e.fila)).size,
      errores,
      datosNormalizados,
    }
  }

  /**
   * Importa de forma atómica un catálogo de productos validado.
   */
  async importarProductos(filas: FilaProductoImport[], empresaId: number): Promise<{ creados: number; actualizados: number }> {
    const dryRun = await this.dryRunProductos(filas, empresaId)
    if (!dryRun.valido) {
      throw new Error(`No se puede importar el catálogo: se detectaron ${dryRun.errores.length} errores de validación.`)
    }

    let creados = 0
    let actualizados = 0

    await prisma.$transaction(async (tx) => {
      for (const p of dryRun.datosNormalizados) {
        const existente = await tx.producto.findFirst({
          where: { empresaId, codigo: p.codigo },
        })

        if (existente) {
          await tx.producto.update({
            where: { id: existente.id },
            data: {
              nombre: p.nombre,
              precioVenta: Number(p.precioUnitario),
              precioCompra: Number(p.costoUnitario ?? 0),
              porcentajeIva: Number(p.porcentajeIva ?? 21),
              stockMinimo: Number(p.stockMinimo ?? 0),
            },
          })
          actualizados++
        } else {
          const nuevo = await tx.producto.create({
            data: {
              empresaId,
              codigo: p.codigo,
              nombre: p.nombre,
              precioVenta: Number(p.precioUnitario),
              precioCompra: Number(p.costoUnitario ?? 0),
              porcentajeIva: Number(p.porcentajeIva ?? 21),
              stock: Number(p.stockInicial ?? 0),
              stockMinimo: Number(p.stockMinimo ?? 0),
              codigoBarras: p.codigoBarras,
            },
          })

          if (Number(p.stockInicial ?? 0) > 0) {
            await tx.movimientoStock.create({
              data: {
                productoId: nuevo.id,
                tipo: "entrada",
                cantidad: Number(p.stockInicial),
                motivo: "Inventario Inicial / Migración",
                empresaId,
              },
            })
          }
          creados++
        }
      }
    })

    return { creados, actualizados }
  }

  /**
   * Valida en modo Dry-Run un padrón de clientes.
   */
  dryRunClientes(filas: FilaClienteImport[]): ResultadoDryRun<FilaClienteImport> {
    const errores: ErrorValidacionFila[] = []
    const cuitsVistos = new Set<string>()
    const datosNormalizados: FilaClienteImport[] = []

    filas.forEach((fila, index) => {
      const numFila = index + 1
      const nombre = (fila.nombre ?? "").trim()
      const cuitLimpio = (fila.cuit ?? "").replace(/\D/g, "")

      if (!nombre) {
        errores.push({ fila: numFila, codigoOIdentificador: cuitLimpio || "SIN DATO", campo: "nombre", mensaje: "La razón social o nombre del cliente es obligatoria." })
      }

      if (cuitLimpio) {
        if (!validarCuitAfip(cuitLimpio)) {
          errores.push({ fila: numFila, codigoOIdentificador: cuitLimpio, campo: "cuit", mensaje: `El CUIT ${fila.cuit} no es válido según algoritmo Módulo 11 de AFIP.` })
        } else if (cuitsVistos.has(cuitLimpio)) {
          errores.push({ fila: numFila, codigoOIdentificador: cuitLimpio, campo: "cuit", mensaje: `CUIT duplicado en el archivo: ${cuitLimpio}.` })
        } else {
          cuitsVistos.add(cuitLimpio)
        }
      }

      datosNormalizados.push({
        nombre,
        cuit: cuitLimpio ? `${cuitLimpio.substring(0, 2)}-${cuitLimpio.substring(2, 10)}-${cuitLimpio.substring(10)}` : undefined,
        dni: fila.dni?.trim(),
        condicionIva: fila.condicionIva?.trim() ?? "Consumidor Final",
        email: fila.email?.trim(),
        telefono: fila.telefono?.trim(),
        direccion: fila.direccion?.trim(),
        limiteCredito: fila.limiteCredito !== undefined ? Number(fila.limiteCredito) : 0,
      })
    })

    return {
      valido: errores.length === 0,
      totalFilas: filas.length,
      filasValidas: filas.length - new Set(errores.map((e) => e.fila)).size,
      filasConError: new Set(errores.map((e) => e.fila)).size,
      errores,
      datosNormalizados,
    }
  }
}

export const importadorMigracionService = new ImportadorMigracionService()

/**
 * CITI Ventas/Compras Service (RG 3685)
 *
 * Genera archivos CITI en formato AFIP con campos fijos.
 * Complementa el Libro IVA Digital (RG 4597) con formato legacy.
 */

import { prisma } from "@/lib/prisma"

// ─── CITI Ventas ────────────────────────────────────────────────────────────

export async function generarCITIVentas(empresaId: number, periodo: string) {
  // periodo = "2026-01"
  const [anio, mes] = periodo.split("-").map(Number)
  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 0, 23, 59, 59)

  const facturas = await prisma.factura.findMany({
    where: {
      empresaId,
      createdAt: { gte: desde, lte: hasta },
      estado: { not: "anulada" },
    },
    include: {
      cliente: { select: { cuit: true, nombre: true, condicionIva: true, dni: true } },
      lineas: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const lineas: string[] = []

  for (const fac of facturas) {
    const fecha = formatFechaCITI(fac.createdAt)
    const tipoDoc = fac.cliente.cuit ? "80" : "96" // 80=CUIT, 96=DNI
    const nroDoc = (fac.cliente.cuit ?? fac.cliente.dni ?? "0").replace(/-/g, "").padStart(11, "0")
    const puntoVenta = String(fac.puntoVenta).padStart(5, "0")
    const numero = String(fac.numero).padStart(20, "0")
    const tipoCbte = String(fac.tipoCbte).padStart(3, "0")
    // Decimal → number para formateo
    const netoGravado = formatImporteCITI(Number(fac.subtotal))
    const noGravado = formatImporteCITI(Number(fac.netoNoGravado))
    const exento = formatImporteCITI(Number(fac.netoExento))
    const iva = formatImporteCITI(Number(fac.iva))
    const total = formatImporteCITI(Number(fac.total))
    const percepciones = formatImporteCITI(Number(fac.totalPercepciones))

    // Formato: TipoCbte|PtoVta|Nro|Fecha|TipoDoc|NroDoc|Nombre|Total|NetoNoGravado|Exento|Percepciones|IVA|NetoGravado
    const linea = [
      tipoCbte,
      puntoVenta,
      numero,
      fecha,
      tipoDoc,
      nroDoc,
      fac.cliente.nombre.substring(0, 30).padEnd(30, " "),
      total,
      noGravado,
      exento,
      percepciones,
      iva,
      netoGravado,
    ].join("|")

    lineas.push(linea)
  }

  const contenido = lineas.join("\r\n")

  // Registrar generación
  await prisma.generacionCITI.upsert({
    where: { empresaId_tipo_periodo: { empresaId, tipo: "ventas", periodo } },
    create: {
      tipo: "ventas",
      periodo,
      cantidadRegistros: lineas.length,
      nombreArchivo: `CITI_VENTAS_${periodo.replace("-", "")}.txt`,
      estado: "generado",
      empresaId,
    },
    update: {
      cantidadRegistros: lineas.length,
      estado: "generado",
    },
  })

  return {
    contenido,
    nombreArchivo: `CITI_VENTAS_${periodo.replace("-", "")}.txt`,
    cantidadRegistros: lineas.length,
  }
}

// ─── CITI Compras ───────────────────────────────────────────────────────────

export async function generarCITICompras(empresaId: number, periodo: string) {
  const [anio, mes] = periodo.split("-").map(Number)
  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 0, 23, 59, 59)

  const compras = await prisma.compra.findMany({
    where: {
      empresaId,
      fecha: { gte: desde, lte: hasta },
      estado: { not: "anulada" },
    },
    include: {
      proveedor: { select: { cuit: true, nombre: true } },
      lineas: true,
    },
    orderBy: { fecha: "asc" },
  })

  const lineas: string[] = []

  for (const comp of compras) {
    const fecha = formatFechaCITI(comp.fecha)
    const tipoDoc = "80" // Compras siempre CUIT
    const nroDoc = (comp.proveedor.cuit ?? "0").replace(/-/g, "").padStart(11, "0")
    // Mapear tipo "A"/"B"/"C" a código AFIP (1=FC-A, 6=FC-B, 11=FC-C)
    const tipoCbteMap: Record<string, string> = { A: "001", B: "006", C: "011" }
    const tipoCbte = tipoCbteMap[comp.tipo] ?? "006"
    const puntoVenta = String(comp.puntoVenta ?? "1").padStart(5, "0")
    const numero = String(comp.numero ?? "0").padStart(20, "0")
    const netoGravado = formatImporteCITI(Number(comp.subtotal))
    const iva = formatImporteCITI(Number(comp.iva ?? 0))
    const total = formatImporteCITI(Number(comp.total))

    const linea = [
      tipoCbte,
      puntoVenta,
      numero,
      fecha,
      tipoDoc,
      nroDoc,
      comp.proveedor.nombre.substring(0, 30).padEnd(30, " "),
      total,
      netoGravado,
      iva,
    ].join("|")

    lineas.push(linea)
  }

  const contenido = lineas.join("\r\n")

  await prisma.generacionCITI.upsert({
    where: { empresaId_tipo_periodo: { empresaId, tipo: "compras", periodo } },
    create: {
      tipo: "compras",
      periodo,
      cantidadRegistros: lineas.length,
      nombreArchivo: `CITI_COMPRAS_${periodo.replace("-", "")}.txt`,
      estado: "generado",
      empresaId,
    },
    update: {
      cantidadRegistros: lineas.length,
      estado: "generado",
    },
  })

  return {
    contenido,
    nombreArchivo: `CITI_COMPRAS_${periodo.replace("-", "")}.txt`,
    cantidadRegistros: lineas.length,
  }
}

// ─── Listar generaciones ───────────────────────────────────────────────────

export async function listarGeneracionesCITI(empresaId: number) {
  return prisma.generacionCITI.findMany({
    where: { empresaId },
    orderBy: { periodo: "desc" },
  })
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFechaCITI(fecha: Date): string {
  const d = new Date(fecha)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}

function formatImporteCITI(importe: number): string {
  // AFIP: 15 posiciones, 2 decimales, sin punto, con signo
  const abs = Math.abs(importe)
  const entero = Math.floor(abs)
  const decimal = Math.round((abs - entero) * 100)
  const str = String(entero).padStart(13, "0") + String(decimal).padStart(2, "0")
  return importe < 0 ? `-${str}` : str
}

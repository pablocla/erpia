import { prisma } from "@/lib/prisma"

export interface SifereJurisdiccionRecord {
  codigoJurisdiccion: string // Ej: "901" (CABA), "902" (PBA), "904" (Córdoba), "921" (Santa Fe)
  nombreJurisdiccion: string
  coeficienteUnificado: number
  baseImponible: number
  alicuota: number
  impuestoDeterminado: number
  retencionesSufridas: number
  percepcionesSufridas: number
  saldoAFavorAnterior: number
  saldoFinal: number
}

export const JURISDICCIONES_CONVENIO = [
  { codigo: "901", nombre: "CABA" },
  { codigo: "902", nombre: "Buenos Aires (ARBA)" },
  { codigo: "903", nombre: "Catamarca" },
  { codigo: "904", nombre: "Córdoba" },
  { codigo: "905", nombre: "Corrientes" },
  { codigo: "906", nombre: "Chaco" },
  { codigo: "907", nombre: "Chubut" },
  { codigo: "908", nombre: "Entre Ríos" },
  { codigo: "909", nombre: "Formosa" },
  { codigo: "910", nombre: "Jujuy" },
  { codigo: "911", nombre: "La Pampa" },
  { codigo: "912", nombre: "La Rioja" },
  { codigo: "913", nombre: "Mendoza" },
  { codigo: "914", nombre: "Misiones" },
  { codigo: "915", nombre: "Neuquén" },
  { codigo: "916", nombre: "Río Negro" },
  { codigo: "917", nombre: "Salta" },
  { codigo: "918", nombre: "San Juan" },
  { codigo: "919", nombre: "San Luis" },
  { codigo: "920", nombre: "Santa Cruz" },
  { codigo: "921", nombre: "Santa Fe" },
  { codigo: "922", nombre: "Santiago del Estero" },
  { codigo: "923", nombre: "Tierra del Fuego" },
  { codigo: "924", nombre: "Tucumán" },
]

export function generarArchivoPlanoSIFERE_CM03(
  cuitEmpresa: string,
  periodo: string, // "YYYYMM"
  registros: SifereJurisdiccionRecord[],
): string {
  // Formato oficial Comarb SIFERE Web CM03:
  // CUIT (11) + Periodo (6) + CodJurisdiccion (3) + BaseImponible (12 con 2 decimales) + Alicuota (5 con 2 dec) + Impuesto (12 con 2 dec)
  const cuitClean = cuitEmpresa.replace(/\D/g, "").padStart(11, "0")
  const lines: string[] = []

  for (const reg of registros) {
    const codJur = reg.codigoJurisdiccion.padStart(3, "0")
    const baseImpStr = Math.round(reg.baseImponible * 100).toString().padStart(12, "0")
    const aliStr = Math.round(reg.alicuota * 100).toString().padStart(5, "0")
    const impStr = Math.round(reg.impuestoDeterminado * 100).toString().padStart(12, "0")
    const retStr = Math.round(reg.retencionesSufridas * 100).toString().padStart(12, "0")
    const perStr = Math.round(reg.percepcionesSufridas * 100).toString().padStart(12, "0")

    // Línea de declaración mensual por jurisdicción
    lines.push(`${cuitClean}${periodo}${codJur}${baseImpStr}${aliStr}${impStr}${retStr}${perStr}`)
  }

  return lines.join("\r\n")
}

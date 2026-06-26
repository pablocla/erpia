/**
 * Arqueo ciego — el cajero declara sin ver totales del sistema.
 */
import { prisma } from "@/lib/prisma"
import { ArqueoCajaService } from "@/lib/caja/arqueo-service"

const arqueoService = new ArqueoCajaService()

export async function obtenerMediosParaArqueoCiego(empresaId: number) {
  const caja = await prisma.caja.findFirst({
    where: { empresaId, estado: "abierta" },
  })
  if (!caja) throw new Error("No hay caja abierta")

  return {
    cajaId: caja.id,
    medios: ["efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia", "cheque", "qr"] as const,
    instruccion: "Contá cada medio sin mirar el saldo del sistema",
  }
}

export async function registrarArqueoCiego(
  empresaId: number,
  input: {
    cajaId: number
    efectivoDeclarado: number
    tarjetaDeclarado: number
    transferenciaDeclarado: number
    chequeDeclarado: number
    qrDeclarado: number
    justificacion?: string
  },
) {
  const caja = await prisma.caja.findFirst({
    where: { id: input.cajaId, empresaId, estado: "abierta" },
  })
  if (!caja) throw new Error("Caja no encontrada o cerrada")

  const resultado = await arqueoService.realizarArqueo(input.cajaId, empresaId, {
    efectivoDeclarado: input.efectivoDeclarado,
    tarjetaDeclarado: input.tarjetaDeclarado,
    transferenciaDeclarado: input.transferenciaDeclarado,
    chequeDeclarado: input.chequeDeclarado,
    qrDeclarado: input.qrDeclarado,
    justificacion: input.justificacion,
  })

  const diff = Number(resultado.diferencia ?? 0)
  const semaforo = Math.abs(diff) < 1 ? "ok" : Math.abs(diff) < 500 ? "atencion" : "alerta"

  return {
    arqueoId: resultado.id,
    diferencia: diff,
    semaforo,
    estado: resultado.estado,
    revelarSistema: true,
  }
}
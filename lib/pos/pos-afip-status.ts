/**
 * Estado AFIP / fiscal para semáforos del POS.
 */
import { prisma } from "@/lib/prisma"

export type AfipSemaforo = "ok" | "atencion" | "error"

export interface PosAfipStatus {
  semaforo: AfipSemaforo
  label: string
  certificadosConfigurados: boolean
  comprobantesSinCae: number
  impresoraConfigurada: boolean
}

export async function obtenerEstadoAfipPos(empresaId: number): Promise<PosAfipStatus> {
  const [empresa, comprobantesSinCae, impresora] = await Promise.all([
    prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { certificadoCRT: true, certificadoKEY: true },
    }),
    prisma.factura.count({
      where: { empresaId, estado: "pendiente_cae" },
    }),
    prisma.configuracionImpresora.findFirst({
      where: { empresaId, activa: true },
      select: { id: true },
    }),
  ])

  const certificadosConfigurados = Boolean(
    empresa?.certificadoCRT && empresa?.certificadoKEY
  )
  const impresoraConfigurada = Boolean(impresora)

  let semaforo: AfipSemaforo = "ok"
  let label = "AFIP OK"

  if (!certificadosConfigurados) {
    semaforo = "error"
    label = "Sin certificado"
  } else if (comprobantesSinCae > 0) {
    semaforo = "atencion"
    label = `${comprobantesSinCae} sin CAE`
  }

  return {
    semaforo,
    label,
    certificadosConfigurados,
    comprobantesSinCae,
    impresoraConfigurada,
  }
}
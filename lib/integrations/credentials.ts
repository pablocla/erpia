import { prisma } from "@/lib/prisma"
import { decryptCredentials, encryptCredentials } from "./core/credential-vault"

export async function obtenerCredencialesIntegracion(empresaId: number, integracionId: string) {
  const row = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId, integracionId } },
  })
  return {
    row,
    credenciales: decryptCredentials(row?.credencialesEnc),
  }
}

export async function guardarCredencialesIntegracion(
  empresaId: number,
  integracionId: string,
  credenciales: Record<string, string>,
  extra?: {
    cuentaExterna?: string
    estado?: string
    tokenExpiresAt?: Date
  },
) {
  const existing = await prisma.conexionIntegracion.findUnique({
    where: { empresaId_integracionId: { empresaId, integracionId } },
  })
  const prev = decryptCredentials(existing?.credencialesEnc)
  const merged = { ...prev, ...credenciales }

  return prisma.conexionIntegracion.upsert({
    where: { empresaId_integracionId: { empresaId, integracionId } },
    create: {
      empresaId,
      integracionId,
      estado: extra?.estado ?? "conectado",
      cuentaExterna: extra?.cuentaExterna,
      credencialesEnc: encryptCredentials(merged),
      tokenExpiresAt: extra?.tokenExpiresAt,
      activo: true,
    },
    update: {
      estado: extra?.estado ?? "conectado",
      cuentaExterna: extra?.cuentaExterna ?? undefined,
      credencialesEnc: encryptCredentials(merged),
      tokenExpiresAt: extra?.tokenExpiresAt,
      ultimoError: null,
      activo: true,
    },
  })
}
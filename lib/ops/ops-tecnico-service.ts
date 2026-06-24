import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.length <= 4) return "****"
  return `****${value.slice(-4)}`
}

export async function getDatosTecnicosTenant(empresaId: number) {
  const db = prisma as any
  const empresa = await db.empresa.findUnique({
    where: { id: empresaId },
    select: {
      id: true,
      nombre: true,
      cuit: true,
      rubro: true,
      entorno: true,
      entornoAfip: true,
      planHosting: true,
      conexionesIntegracion: {
        where: { activo: true },
        select: {
          integracionId: true,
          estado: true,
          cuentaExterna: true,
          ultimaSyncAt: true,
          ultimoError: true,
        },
      },
      tenantEntornos: {
        select: { codigo: true, estado: true, version: true, urlBase: true, dbProveedor: true, metadata: true },
      },
    },
  })

  if (!empresa) throw new Error("Empresa no encontrada")

  return {
    empresa: {
      id: empresa.id,
      nombre: empresa.nombre,
      cuit: empresa.cuit,
      rubro: empresa.rubro,
      planHosting: empresa.planHosting ?? "shared",
    },
    afip: {
      entorno: empresa.entornoAfip ?? empresa.entorno,
    },
    runtime: {
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      vercelEnv: process.env.VERCEL_ENV ?? "local",
      region: process.env.VERCEL_REGION ?? "sa-east-1",
    },
    entornos: empresa.tenantEntornos.map((e: any) => {
      const meta = (e.metadata as Record<string, any>) || {}
      return {
        codigo: e.codigo,
        estado: e.estado,
        version: e.version,
        urlBase: e.urlBase,
        dbProveedor: e.dbProveedor,
        webhookSecret: maskSecret(meta.webhookSecret),
      }
    }),
    integraciones: empresa.conexionesIntegracion.map(
      (c: {
        integracionId: string
        estado: string
        cuentaExterna: string | null
        ultimaSyncAt: Date | null
        ultimoError: string | null
      }) => ({
        id: c.integracionId,
        estado: c.estado,
        cuenta: maskSecret(c.cuentaExterna),
        ultimaSync: c.ultimaSyncAt,
        ultimoError: c.ultimoError ? c.ultimoError.slice(0, 120) : null,
      }),
    ),
  }
}

export async function rotateWebhookSecret(empresaId: number, codigo: string) {
  const db = prisma as any
  const entorno = await db.tenantEntorno.findFirst({
    where: { empresaId, codigo },
  })
  if (!entorno) throw new Error(`Entorno ${codigo} no encontrado`)

  const newSecret = "whsec_" + crypto.randomBytes(16).toString("hex")
  const currentMeta = (entorno.metadata as Record<string, any>) || {}
  const updatedMeta = { ...currentMeta, webhookSecret: newSecret }

  await db.tenantEntorno.update({
    where: { id: entorno.id },
    data: {
      metadata: updatedMeta,
      updatedAt: new Date(),
    },
  })

  return {
    success: true,
    codigo,
    webhookSecret: newSecret,
  }
}
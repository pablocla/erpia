import { prisma } from "@/lib/prisma"
import { getAllFeatures, setFeature } from "@/lib/config/rubro-config-service"
import { getAfipProdPending } from "@/lib/ops/afip-produccion-approval-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { ERP_PARAMETROS_CATALOG } from "@/lib/ops/erp-parametros-catalog"

function db() {
  return prisma as any
}

export async function getTenantConfigCloud(empresaId: number) {
  const [empresa, features, afipPending] = await Promise.all([
    db().empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nombre: true,
        razonSocial: true,
        cuit: true,
        puntoVenta: true,
        entornoAfip: true,
        rubro: true,
        condicionIva: true,
        email: true,
        telefono: true,
        certificadoCRT: true,
      },
    }),
    getAllFeatures(empresaId),
    getAfipProdPending(empresaId),
  ])

  if (!empresa) throw new Error("Empresa no encontrada")

  return {
    empresa: {
      ...empresa,
      tieneCertificado: Boolean(empresa.certificadoCRT),
      certificadoCRT: undefined,
    },
    features: features.slice(0, 40),
    afipProdPending: afipPending,
    parametrosCatalogo: ERP_PARAMETROS_CATALOG,
  }
}

export async function patchTenantConfigCloud(
  empresaId: number,
  patch: {
    empresa?: Partial<{
      nombre: string
      razonSocial: string
      cuit: string
      puntoVenta: number
      rubro: string
      condicionIva: string
      email: string
      telefono: string
    }>
    feature?: { featureKey: string; activado: boolean }
  },
  actorEmail: string,
) {
  if (patch.empresa) {
    const data = { ...patch.empresa }
    if ("entornoAfip" in data) delete (data as { entornoAfip?: string }).entornoAfip
    await db().empresa.update({ where: { id: empresaId }, data })
  }

  if (patch.feature) {
    await setFeature(empresaId, patch.feature.featureKey, { activado: patch.feature.activado })
  }

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "config",
    contexto: "cloud:parametrizacion",
    mensaje: `Config actualizada desde Cloud por ${actorEmail}`,
    metadata: { keys: Object.keys(patch) },
  })

  return getTenantConfigCloud(empresaId)
}
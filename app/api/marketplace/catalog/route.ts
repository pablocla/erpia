import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/marketplace-catalog"
import { AUTOPOOL_ENTRIES } from "@/lib/marketplace/autopool-manifest"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { getRunbook } from "@/lib/marketplace/product-runbooks"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const suscripciones = await prisma.suscripcionModulo.findMany({
    where: { empresaId: auth.auth.empresaId, activo: true },
    select: { sku: true, limiteEventosMes: true },
  })

  const jobsPendientes = await prisma.marketplaceProvisionJob.findMany({
    where: {
      empresaId: auth.auth.empresaId,
      estado: { in: ["pending", "running"] },
    },
    select: { sku: true, estado: true, id: true },
  })

  const suscripcionesMap = new Map(suscripciones.map((s) => [s.sku, s]))
  const jobsMap = new Map(jobsPendientes.map((j) => [j.sku, j]))

  const catalogWithStatus = MARKETPLACE_CATALOG.map((item) => {
    const instalada = suscripcionesMap.has(item.sku)
    const sub = suscripcionesMap.get(item.sku)
    const job = jobsMap.get(item.sku)
    const runbook = getRunbook(item.sku)
    return {
      ...item,
      instalada,
      limiteActual: sub?.limiteEventosMes ?? null,
      provisionEstado: job?.estado ?? null,
      provisionJobId: job?.id ?? null,
      activacionCliente: runbook?.activacionCliente ?? `Marketplace → Activar ${item.nombre}`,
    }
  })

  const autopool = AUTOPOOL_ENTRIES.map((entry) => {
    const instalada = suscripcionesMap.has(entry.sku)
    const job = jobsMap.get(entry.sku)
    return {
      ...entry,
      instalada,
      provisionEstado: job?.estado ?? null,
      provisionJobId: job?.id ?? null,
    }
  })

  return NextResponse.json({
    catalog: catalogWithStatus,
    autopool,
    bundles: MARKETPLACE_BUNDLES,
  })
}

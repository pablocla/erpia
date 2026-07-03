import { prisma } from "@/lib/prisma"
import { setFeature } from "@/lib/config/rubro-config-service"
import { getActiveSubscription, upsertSuscripcion } from "@/lib/platform/commercial-service"
import { activarLibretaFiado } from "@/lib/fiado/fiado-provision"
import { getNicheAppBySku } from "./niche-apps-catalog"
import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"

export const NICHE_FEATURE_KEY = "niche_apps"

/** Ejecutar antes de validar dependencias en product-lifecycle (prestamista → fiado) */
export async function prepararDependenciasNicho(empresaId: number, sku: string) {
  const app = getNicheAppBySku(sku)
  if (app?.engine === "libreta") {
    await asegurarFiadoParaPrestamista(empresaId)
  }
}

async function asegurarFiadoParaPrestamista(empresaId: number) {
  const fiado = await getActiveSubscription(empresaId, "pos.fiado_barrio")
  if (fiado) return

  await upsertSuscripcion(empresaId, {
    sku: "pos.fiado_barrio",
    activo: true,
    metadata: { origen: "niche_prestamista_auto", activadoAt: new Date().toISOString() },
  })
  await activarLibretaFiado(empresaId)
}

function modoLiteParaApp(engine: string): ModoLite {
  if (engine === "libreta") return "fiado"
  return "niche"
}

export async function activarNicheApp(empresaId: number, sku: string) {
  const app = getNicheAppBySku(sku)
  if (!app) return

  await prepararDependenciasNicho(empresaId, sku)

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { modoLite: modoLiteParaApp(app.engine) },
  })

  const current = await prisma.featureEmpresa.findFirst({
    where: { empresaId, featureKey: NICHE_FEATURE_KEY },
  })
  const prev = (current?.parametros as { apps?: string[] } | null) ?? {}
  const apps = [...(prev.apps ?? [])]
  if (!apps.includes(sku)) apps.push(sku)

  await setFeature(empresaId, NICHE_FEATURE_KEY, {
    activado: true,
    parametros: {
      apps,
      primarySku: sku,
      appId: app.appId,
      goldenPath: app.goldenPath,
      landingPath: app.redirectPath ?? app.goldenPath,
    },
  })

  if (app.engine === "cuotas") {
    const plan = await prisma.planMembresia.findFirst({ where: { empresaId } })
    if (!plan) {
      await prisma.planMembresia.create({
        data: {
          empresaId,
          nombre: app.nombre,
          precio: app.precioArs,
          duracionDias: 30,
          activo: true,
        },
      })
    }
  }
}
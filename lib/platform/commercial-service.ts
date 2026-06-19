import { prisma } from "@/lib/prisma"
import { AUTOMATION_SKU } from "./sku-catalog"

export function currentUsageMonth(date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export async function seedCommercialCatalog() {
  const products = [
    {
      sku: AUTOMATION_SKU,
      nombre: "NOP Automation Hub",
      descripcion: "Integración n8n, empleados virtuales y playbooks",
      precioArs: 29900,
      limiteEventosMes: 10_000,
    },
    {
      sku: "channel.mercadopago",
      nombre: "Canal Mercado Pago",
      descripcion: "Cobros y conciliación MP",
      precioArs: 9900,
      limiteEventosMes: null,
    },
    {
      sku: "channel.mercadolibre",
      nombre: "Canal Mercado Libre",
      descripcion: "Sincronización pedidos ML",
      precioArs: 14900,
      limiteEventosMes: null,
    },
    {
      sku: "channel.whatsapp",
      nombre: "Canal WhatsApp Business",
      descripcion: "Mensajería automatizada",
      precioArs: 7900,
      limiteEventosMes: 5000,
    },
    {
      sku: "ops.morning_commander",
      nombre: "Morning Commander IA",
      descripcion: "Agentes IA de operaciones",
      precioArs: 19900,
      limiteEventosMes: 2000,
    },
  ]

  for (const p of products) {
    await prisma.productoComercial.upsert({
      where: { sku: p.sku },
      create: {
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precioArs: p.precioArs,
        limiteEventosMes: p.limiteEventosMes,
        activo: true,
      },
      update: {
        nombre: p.nombre,
        descripcion: p.descripcion,
        precioArs: p.precioArs,
        limiteEventosMes: p.limiteEventosMes,
        activo: true,
      },
    })
  }
}

export async function ensureDemoAutomationSubscription(empresaId: number) {
  await seedCommercialCatalog()
  return prisma.suscripcionModulo.upsert({
    where: { empresaId_sku: { empresaId, sku: AUTOMATION_SKU } },
    create: {
      empresaId,
      sku: AUTOMATION_SKU,
      activo: true,
      limiteEventosMes: 50_000,
      metadata: { origen: "demo" },
    },
    update: {
      activo: true,
      vigenciaHasta: null,
    },
  })
}

export async function getActiveSubscription(empresaId: number, sku: string) {
  const now = new Date()
  return prisma.suscripcionModulo.findFirst({
    where: {
      empresaId,
      sku,
      activo: true,
      vigenciaDesde: { lte: now },
      OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: now } }],
    },
    include: { producto: true },
  })
}

export async function getMonthlyUsageTotal(
  empresaId: number,
  sku: string,
  mes = currentUsageMonth()
): Promise<number> {
  const rows = await prisma.usageEvent.findMany({
    where: { empresaId, sku, mes },
    select: { contador: true },
  })
  return rows.reduce((sum, r) => sum + r.contador, 0)
}

export async function recordUsageEvent(
  empresaId: number,
  sku: string,
  eventKey: string,
  mes = currentUsageMonth()
): Promise<void> {
  await prisma.usageEvent.upsert({
    where: {
      empresaId_sku_eventKey_mes: {
        empresaId,
        sku,
        eventKey: "*",
        mes,
      },
    },
    create: {
      empresaId,
      sku,
      eventKey: "*",
      mes,
      contador: 1,
    },
    update: {
      contador: { increment: 1 },
    },
  })
}

export async function resolveEventLimit(
  empresaId: number,
  sku: string
): Promise<number | null> {
  const sub = await getActiveSubscription(empresaId, sku)
  if (sub?.limiteEventosMes != null) return sub.limiteEventosMes
  if (sub?.producto.limiteEventosMes != null) return sub.producto.limiteEventosMes
  return null
}

export async function listSuscripciones(empresaId: number) {
  return prisma.suscripcionModulo.findMany({
    where: { empresaId },
    include: { producto: true },
    orderBy: { sku: "asc" },
  })
}

export async function upsertSuscripcion(
  empresaId: number,
  data: {
    sku: string
    activo?: boolean
    vigenciaHasta?: Date | null
    limiteEventosMes?: number | null
  }
) {
  await seedCommercialCatalog()
  return prisma.suscripcionModulo.upsert({
    where: { empresaId_sku: { empresaId, sku: data.sku } },
    create: {
      empresaId,
      sku: data.sku,
      activo: data.activo ?? true,
      vigenciaHasta: data.vigenciaHasta ?? null,
      limiteEventosMes: data.limiteEventosMes ?? null,
    },
    update: {
      activo: data.activo,
      vigenciaHasta: data.vigenciaHasta,
      limiteEventosMes: data.limiteEventosMes,
    },
    include: { producto: true },
  })
}
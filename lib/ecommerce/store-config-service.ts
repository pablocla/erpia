import { prisma } from "@/lib/prisma"
import {
  MEDIOS_PAGO_DEFAULT,
  type MediosPagoConfig,
  type TiendaPublicConfig,
} from "./types"

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "tienda"
}

function parseMediosPago(raw: unknown): MediosPagoConfig {
  if (!raw || typeof raw !== "object") return { ...MEDIOS_PAGO_DEFAULT }
  const o = raw as Partial<MediosPagoConfig>
  return {
    mercadopago: o.mercadopago ?? MEDIOS_PAGO_DEFAULT.mercadopago,
    transferencia: o.transferencia ?? MEDIOS_PAGO_DEFAULT.transferencia,
    confirmarSinPago: o.confirmarSinPago ?? MEDIOS_PAGO_DEFAULT.confirmarSinPago,
  }
}

function toPublicConfig(row: {
  empresaId: number
  slug: string
  nombreTienda: string | null
  logoUrl: string | null
  colorPrimario: string | null
  mediosPago: unknown
  textoEnvio: string | null
  textoFooter: string | null
  empresa?: { nombre: string } | null
}): TiendaPublicConfig {
  return {
    empresaId: row.empresaId,
    slug: row.slug,
    nombreTienda: row.nombreTienda ?? row.empresa?.nombre ?? "Tienda",
    logoUrl: row.logoUrl,
    colorPrimario: row.colorPrimario,
    mediosPago: parseMediosPago(row.mediosPago),
    textoEnvio: row.textoEnvio,
    textoFooter: row.textoFooter,
  }
}

export async function getTiendaConfigByEmpresaId(empresaId: number): Promise<TiendaPublicConfig | null> {
  const row = await prisma.tiendaConfig.findFirst({
    where: { empresaId, activa: true },
    include: { empresa: { select: { nombre: true } } },
  })
  if (!row) return null
  return toPublicConfig(row)
}

export async function getTiendaConfigBySlug(slug: string): Promise<TiendaPublicConfig | null> {
  const row = await prisma.tiendaConfig.findFirst({
    where: { slug, activa: true },
    include: { empresa: { select: { nombre: true } } },
  })
  if (!row) return null
  return toPublicConfig(row)
}

export async function resolveEmpresaIdFromSlug(slug: string): Promise<number | null> {
  const row = await prisma.tiendaConfig.findFirst({
    where: { slug, activa: true },
    select: { empresaId: true },
  })
  return row?.empresaId ?? null
}

async function uniqueSlug(base: string, empresaId: number): Promise<string> {
  let candidate = slugify(base)
  let suffix = 0
  while (true) {
    const slug = suffix === 0 ? candidate : `${candidate}-${suffix}`
    const existing = await prisma.tiendaConfig.findUnique({ where: { slug } })
    if (!existing || existing.empresaId === empresaId) return slug
    suffix += 1
  }
}

/** Crea o actualiza config por defecto al activar SKU ECOM-B2C-01 */
export async function provisionTiendaDefaults(empresaId: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { nombre: true },
  })
  if (!empresa) throw new Error("Empresa no encontrada")

  const slug = await uniqueSlug(empresa.nombre, empresaId)

  return prisma.tiendaConfig.upsert({
    where: { empresaId },
    create: {
      empresaId,
      slug,
      nombreTienda: empresa.nombre,
      mediosPago: MEDIOS_PAGO_DEFAULT,
      activa: true,
    },
    update: {
      activa: true,
      nombreTienda: empresa.nombre,
    },
  })
}

export async function updateTiendaConfigAdmin(
  empresaId: number,
  data: Partial<{
    slug: string
    nombreTienda: string
    logoUrl: string | null
    colorPrimario: string | null
    mediosPago: MediosPagoConfig
    transferenciaCbu: string | null
    transferenciaAlias: string | null
    transferenciaTitular: string | null
    textoEnvio: string | null
    textoFooter: string | null
    activa: boolean
  }>,
) {
  const existing = await prisma.tiendaConfig.findUnique({ where: { empresaId } })
  if (!existing) {
    await provisionTiendaDefaults(empresaId)
  }

  if (data.slug) {
    const taken = await prisma.tiendaConfig.findFirst({
      where: { slug: data.slug, NOT: { empresaId } },
    })
    if (taken) throw new Error("El slug ya está en uso por otra tienda")
  }

  return prisma.tiendaConfig.update({
    where: { empresaId },
    data: {
      ...(data.slug ? { slug: slugify(data.slug) } : {}),
      ...(data.nombreTienda !== undefined ? { nombreTienda: data.nombreTienda } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      ...(data.colorPrimario !== undefined ? { colorPrimario: data.colorPrimario } : {}),
      ...(data.mediosPago !== undefined ? { mediosPago: data.mediosPago } : {}),
      ...(data.transferenciaCbu !== undefined ? { transferenciaCbu: data.transferenciaCbu } : {}),
      ...(data.transferenciaAlias !== undefined ? { transferenciaAlias: data.transferenciaAlias } : {}),
      ...(data.transferenciaTitular !== undefined ? { transferenciaTitular: data.transferenciaTitular } : {}),
      ...(data.textoEnvio !== undefined ? { textoEnvio: data.textoEnvio } : {}),
      ...(data.textoFooter !== undefined ? { textoFooter: data.textoFooter } : {}),
      ...(data.activa !== undefined ? { activa: data.activa } : {}),
    },
    include: { empresa: { select: { nombre: true } } },
  })
}

export async function getTiendaConfigAdmin(empresaId: number) {
  const row = await prisma.tiendaConfig.findUnique({
    where: { empresaId },
    include: { empresa: { select: { nombre: true } } },
  })
  if (!row) return null
  return {
    ...toPublicConfig(row),
    transferenciaCbu: row.transferenciaCbu,
    transferenciaAlias: row.transferenciaAlias,
    transferenciaTitular: row.transferenciaTitular,
    activa: row.activa,
  }
}

export function isMedioPagoHabilitado(medios: MediosPagoConfig, medio: keyof MediosPagoConfig): boolean {
  return medios[medio] === true
}
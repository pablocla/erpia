import { prisma } from "@/lib/prisma"
import { getOpoConfig, patchOpoConfig } from "@/lib/opo/opo-config-service"

export function cuitDigits(cuit: string): string {
  return cuit.replace(/\D/g, "")
}

export function slugifyTenantName(nombre: string): string {
  const s = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return s || "tenant"
}

export function tenantLoginPath(slug: string): string {
  return `/p/${slug}/login`
}

export function tenantPublicUrl(slug: string, origin?: string): string {
  const base = (origin ?? "").replace(/\/$/, "")
  return `${base}${tenantLoginPath(slug)}`
}

export async function findEmpresaByProtheusSlug(slug: string) {
  const raw = slug.trim().toLowerCase()
  if (!raw) return null
  const digits = cuitDigits(raw)

  const byCuit = digits.length >= 10
    ? await prisma.empresa.findFirst({
        where: { OR: [{ cuit: raw }, { cuit: { contains: digits.slice(0, 11) } }] },
        select: { id: true, nombre: true, razonSocial: true, cuit: true, modoLite: true, temaConfig: true },
      })
    : null
  if (byCuit && (cuitDigits(byCuit.cuit) === digits || byCuit.cuit === raw)) return byCuit

  const all = await prisma.empresa.findMany({
    where: { OR: [{ modoLite: "protheus" }, { temaConfig: { not: null } }] },
    select: { id: true, nombre: true, razonSocial: true, cuit: true, modoLite: true, temaConfig: true },
    take: 2000,
  })
  return (
    all.find((e) => {
      const tema = (e.temaConfig ?? {}) as Record<string, unknown>
      return typeof tema.protheusSlug === "string" && tema.protheusSlug.toLowerCase() === raw
    }) ?? null
  )
}

export async function ensureProtheusTenantSlug(empresaId: number): Promise<string> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, razonSocial: true, cuit: true, temaConfig: true },
  })
  if (!empresa) throw new Error("Empresa no encontrada")

  const tema = ((empresa.temaConfig ?? {}) as Record<string, unknown>) || {}
  const existing = typeof tema.protheusSlug === "string" ? tema.protheusSlug.trim() : ""
  if (existing) {
    const cfg = await getOpoConfig(empresaId)
    if (cfg.protheusSlug !== existing) await patchOpoConfig(empresaId, { protheusSlug: existing })
    return existing
  }

  let base = slugifyTenantName(empresa.razonSocial || empresa.nombre)
  let slug = base
  let n = 2
  while (await slugTaken(slug, empresaId)) {
    slug = `${base}-${n++}`
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { temaConfig: { ...tema, protheusSlug: slug } },
  })
  await patchOpoConfig(empresaId, { protheusSlug: slug, origen: "protheus", activo: true })
  return slug
}

async function slugTaken(slug: string, exceptId: number): Promise<boolean> {
  const hit = await findEmpresaByProtheusSlug(slug)
  return Boolean(hit && hit.id !== exceptId)
}

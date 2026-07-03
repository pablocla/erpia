import { provisionTiendaDefaults } from "./store-config-service"
import { setFeature, FEATURES } from "@/lib/config/rubro-config-service"

/** Hook al activar SKU ECOM-B2C-01 desde marketplace / product-lifecycle */
export async function activarTiendaOnline(empresaId: number) {
  const config = await provisionTiendaDefaults(empresaId)

  await setFeature(empresaId, FEATURES.TIENDA_ONLINE, { activado: true })

  return {
    ok: true,
    slug: config.slug,
    url: `/tienda/${config.slug}`,
  }
}
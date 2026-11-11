/**
 * Provisioning idempotente del tenant Velde (sin AFIP, 2 cajas Corriente/Ahorro).
 *
 *   npx tsx scripts/provision-velde.ts
 *
 * Usa DATABASE_URL del entorno. No crea usuarios.
 *
 * Cómo se entra a Velde (sin usuario propio):
 *   1. Login normal en claver.com.ar con la cuenta owner Claver (CLAVER_OWNER_EMAIL).
 *   2. Claver Cloud → cliente "Velde" → "Ingresar ERP"
 *      (lib/ops/impersonation-service.ts: token impersonado rol administrador, 2 h).
 *   3. Requiere plan con impersonacionErp → este script deja plan "Pro".
 *   No se crea AnalistaAsignacion: con asignaciones el owner pasaría de ver
 *   todos los tenants a ver solo los asignados (lib/auth/claver-analyst.ts).
 */
import { provisionVelde } from "@/lib/provisioning/provision-velde"
import { prisma } from "@/lib/prisma"

async function main() {
  const r = await provisionVelde()
  console.log(`Velde empresaId=${r.empresaId} (${r.empresaCreada ? "creada" : "ya existía"})`)
  console.log(`Cajas: ${r.cajaTipos.map((c) => `${c.codigo}#${c.id}`).join(", ")}`)
  console.log(`Consumidor Final #${r.consumidorFinalId} · SKU multi-caja ${r.skuMultiCaja}`)
  console.log("AFIP: OFF (ticket_solo + facturacion_afip=false)")
  console.log(`Plan ${r.plan} (impersonacionErp) · acceso: Claver Cloud → Ingresar ERP (sin usuario propio)`)
}

main()
  .catch((err) => {
    console.error("provision-velde falló:", err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

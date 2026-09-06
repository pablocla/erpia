/**
 * Seed de demos por rubro — auditoría F0-5.
 * Uso: npx tsx prisma/seed-demo.ts [industryId...]
 * Sin args: almacen, kiosco, veterinaria, consorcios
 */

import { prisma } from "@/lib/prisma"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"
import { DEMO_INDUSTRY_IDS } from "@/lib/comercial/industry-templates"
import { DEMO_ADMIN_EMAIL } from "@/lib/brand"

const DEFAULT_INDUSTRIES = ["almacen", "kiosco", "veterinaria", "consorcios_admin"] as const

async function ensureDemoEmpresa() {
  let empresa = await prisma.empresa.findFirst({
    where: { cuit: "20-00000000-0" },
  })

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nombre: "Empresa Demo",
        razonSocial: "Empresa Demostración SRL",
        cuit: "20-00000000-0",
        direccion: "Av. Corrientes 1234, CABA",
        telefono: "011-4567-8900",
        email: DEMO_ADMIN_EMAIL,
        puntoVenta: 1,
        entorno: "homologacion",
        rubro: "otro",
      },
    })
    console.log("✓ Empresa demo creada:", empresa.id)
  }

  return empresa
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El seed de demos está deshabilitado en producción")
  }
  const args = process.argv.slice(2).filter(Boolean)
  const industries =
    args.length > 0
      ? args.filter((id) => DEMO_INDUSTRY_IDS.includes(id))
      : [...DEFAULT_INDUSTRIES]

  const empresa = await ensureDemoEmpresa()

  for (const industryId of industries) {
    try {
      const result = await provisionIndustryDemo(empresa.id, industryId)
      console.log(
        `✓ ${industryId}: ${result.productosCreados} productos, ${result.clientesCreados} clientes → ${result.goldenPath}`,
      )
    } catch (err) {
      console.error(`✗ ${industryId}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log("\nListo. Login demo:", DEMO_ADMIN_EMAIL)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
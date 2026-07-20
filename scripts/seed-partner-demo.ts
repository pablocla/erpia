/**
 * Seed partner demo CONTADOR_PEREZ para probar ?ref=
 *
 * Uso: npx tsx scripts/seed-partner-demo.ts
 * Requiere DATABASE_URL y usuario admin existente (primer usuario o por email).
 */

import { prisma } from "../lib/prisma"
import { normalizeReferralCode } from "../lib/partners/affiliate-config"

async function main() {
  const email = process.env.PARTNER_SEED_EMAIL || process.env.DEMO_ADMIN_EMAIL
  let user = email
    ? await prisma.usuario.findUnique({ where: { email } })
    : null

  if (!user) {
    user = await prisma.usuario.findFirst({
      where: { rol: "administrador", activo: true },
      orderBy: { id: "asc" },
    })
  }

  if (!user) {
    console.error("No hay usuario para adjuntar PartnerProfile. Creá una cuenta primero.")
    process.exit(1)
  }

  const code = normalizeReferralCode("CONTADOR_PEREZ")
  const existing = await prisma.partnerProfile.findUnique({
    where: { usuarioId: user.id },
  })

  if (existing) {
    await prisma.partnerProfile.update({
      where: { id: existing.id },
      data: {
        referralCode: code,
        tipo: existing.tipo || "seller",
        nombreFantasia: existing.nombreFantasia || "Contador Pérez Demo",
        activo: true,
        nivel: "pro",
      },
    })
    console.log(`Updated partner #${existing.id} code=${code} user=${user.email}`)
  } else {
    const p = await prisma.partnerProfile.create({
      data: {
        usuarioId: user.id,
        tipo: "seller",
        nombreFantasia: "Contador Pérez Demo",
        referralCode: code,
        nivel: "pro",
        activo: true,
      },
    })
    console.log(`Created partner #${p.id} code=${code} user=${user.email}`)
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  console.log(`Link: ${base}/login/register?ref=${code}`)
  console.log(`Portal: ${base}/dashboard/partner-portal`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

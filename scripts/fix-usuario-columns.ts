import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "esVirtual" BOOLEAN NOT NULL DEFAULT false'
  )
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "automationApiKeyHash" TEXT'
  )
  console.log("✓ Columnas usuarios.esVirtual y automationApiKeyHash sincronizadas")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Buscar o crear empresa usando SQL crudo (evita problemas de columnas nuevas)
  const empresaRows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM empresas WHERE cuit = '20-00000000-0' LIMIT 1
  `

  let empresaId: number
  if (empresaRows.length > 0) {
    empresaId = empresaRows[0].id
    console.log(`✓ Empresa existente (id: ${empresaId})`)
  } else {
    const created = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO empresas ("nombre", "razonSocial", "cuit", "direccion", "telefono", "email", "createdAt", "updatedAt")
      VALUES ('Empresa Demo', 'Empresa Demostración SRL', '20-00000000-0',
              'Av. Corrientes 1234, CABA', '011-4567-8900', 'admin@erp-argentina.com',
              NOW(), NOW())
      RETURNING id
    `
    empresaId = created[0].id
    console.log(`✓ Empresa creada (id: ${empresaId})`)
  }

  // Crear o actualizar usuario admin
  const hashedPassword = await bcrypt.hash("admin1234", 10)
  await prisma.$executeRaw`
    INSERT INTO usuarios ("nombre", "email", "password", "rol", "activo", "empresaId", "createdAt", "updatedAt")
    VALUES ('Administrador', 'admin@erp-argentina.com', ${hashedPassword},
            'administrador', true, ${empresaId}, NOW(), NOW())
    ON CONFLICT ("email") DO UPDATE
      SET "password" = ${hashedPassword}, "activo" = true, "updatedAt" = NOW()
  `

  console.log(`✓ Usuario listo: admin@erp-argentina.com`)
  console.log("\n✅ Podés iniciar sesión con:")
  console.log("   Email:    admin@erp-argentina.com")
  console.log("   Password: admin1234")
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())

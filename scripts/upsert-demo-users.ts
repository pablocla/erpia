import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { CLAVER_OWNER_EMAIL, DEMO_ADMIN_EMAIL } from "../lib/brand"

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash("admin1234", 10)
  const empresa = await prisma.empresa.upsert({
    where: { cuit: "20-00000000-0" },
    update: { email: DEMO_ADMIN_EMAIL },
    create: {
      nombre: "Empresa Demo",
      razonSocial: "Empresa Demostración SRL",
      cuit: "20-00000000-0",
      direccion: "Av. Corrientes 1234, CABA",
      telefono: "011-4567-8900",
      email: DEMO_ADMIN_EMAIL,
      puntoVenta: 1,
      entorno: "homologacion",
    },
  })

  for (const u of [
    { nombre: "Administrador Demo", email: DEMO_ADMIN_EMAIL },
    { nombre: "Pablo Clavero", email: CLAVER_OWNER_EMAIL },
  ]) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { password: hash, activo: true, empresaId: empresa.id },
      create: {
        nombre: u.nombre,
        email: u.email,
        password: hash,
        rol: "administrador",
        empresaId: empresa.id,
        activo: true,
      },
    })
    console.log(`✓ ${u.email}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
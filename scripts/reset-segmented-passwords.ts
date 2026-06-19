import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const dryRun = process.argv.includes("--dry-run")

const usuariosObjetivo = [
  { id: 1, nombre: "Administrador", email: "admin@erp-argentina.com", empresaId: 1 },
  { id: 2, nombre: "Administrador", email: "admin@claver.app", empresaId: 3 },
  { id: 3, nombre: "Admin Gimnasio", email: "gym@demo.com", empresaId: 4 },
  { id: 4, nombre: "Admin Veterinaria", email: "vet@demo.com", empresaId: 5 },
  { id: 5, nombre: "Admin Odontología", email: "salud@demo.com", empresaId: 6 },
  { id: 6, nombre: "Admin Spa", email: "spa@demo.com", empresaId: 7 },
  { id: 11, nombre: "Admin Ferretería El Tornillo", email: "ferreteria@demo.com", empresaId: 12 },
  { id: 12, nombre: "Admin Kiosco 24hs Open", email: "kiosco@demo.com", empresaId: 13 },
  { id: 13, nombre: "Admin Bar & Cervecería La Pinta", email: "bar@demo.com", empresaId: 14 },
] as const

function generarPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let password = ""

  for (let index = 0; index < 12; index += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
    if (index === 3 || index === 7) password += "-"
  }

  return password
}

async function main() {
  const resultados = await Promise.all(
    usuariosObjetivo.map(async (usuario) => {
      const passwordPlano = generarPassword()
      const hash = await bcrypt.hash(passwordPlano, 10)

      return {
        ...usuario,
        passwordPlano,
        hash,
      }
    })
  )

  if (!dryRun) {
    for (const usuario of resultados) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          password: usuario.hash,
          activo: true,
        },
      })
    }
  }

  console.log(dryRun ? "MODO: dry-run" : "MODO: actualización real")
  console.table(
    resultados.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      empresaId: usuario.empresaId,
      password: usuario.passwordPlano,
      hash: usuario.hash,
    }))
  )

  console.log("\nSQL de referencia:")
  for (const usuario of resultados) {
    console.log(
      `UPDATE \"usuarios\" SET \"password\" = '${usuario.hash}', \"activo\" = true, \"updatedAt\" = NOW() WHERE \"id\" = ${usuario.id} AND \"email\" = '${usuario.email}';`
    )
  }
}

main()
  .catch((error) => {
    console.error("Error al refrescar contraseñas segmentadas:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
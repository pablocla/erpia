import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs"

async function seedLazaroPrestamos() {
  console.log("🚀 Configurando cuenta de Google para Marcos (marcosxd501@gmail.com)...")

  const emailMarcos = "marcosxd501@gmail.com"
  const emailRoleplay = "roleplay.lazaro@claver.com.ar"
  const passwordPlana = "Password123!"
  const hashedPassword = await bcrypt.hash(passwordPlana, 10)

  // 1. Buscar o crear la Empresa REAL Lázaro Préstamos
  let empresa = await prisma.empresa.findFirst({
    where: {
      OR: [
        { nombre: { contains: "Lazaro", mode: "insensitive" } },
        { email: emailMarcos }
      ]
    }
  })

  const realCuit = "30-71994820-9"

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nombre: "Lázaro Préstamos",
        razonSocial: "Lázaro Préstamos S.A.",
        cuit: realCuit,
        email: emailMarcos,
        rubro: "prestamista",
        modoLite: "completo",
        isPrewarmedDemo: false,
        prewarmedIndustryId: null,
        planHosting: "Enterprise",
        trialExpiresAt: null,
      }
    })
    console.log(`✅ Empresa REAL creada con ID ${empresa.id}: ${empresa.nombre}`)
  } else {
    empresa = await prisma.empresa.update({
      where: { id: empresa.id },
      data: {
        nombre: "Lázaro Préstamos",
        cuit: realCuit,
        rubro: "prestamista",
        modoLite: "completo",
        isPrewarmedDemo: false,
        prewarmedIndustryId: null,
        planHosting: "Enterprise",
        trialExpiresAt: null,
      }
    })
    console.log(`🔄 Empresa ${empresa.id} actualizada como Organización REAL Permanente`)
  }

  // 2. Crear o actualizar Usuario Marcos (Habilitado para Botón de Google OAuth)
  let userMarcos = await prisma.usuario.findUnique({
    where: { email: emailMarcos }
  })

  if (!userMarcos) {
    userMarcos = await prisma.usuario.create({
      data: {
        nombre: "Marcos (Lázaro Préstamos)",
        email: emailMarcos,
        password: hashedPassword,
        rol: "dueno",
        activo: true,
        authProvider: "google", // Habilitado para Google Auth
        empresaId: empresa.id
      }
    })
    console.log(`✅ Usuario Marcos (Google Auth) creado con ID ${userMarcos.id}`)
  } else {
    userMarcos = await prisma.usuario.update({
      where: { id: userMarcos.id },
      data: {
        nombre: "Marcos (Lázaro Préstamos)",
        empresaId: empresa.id,
        rol: "dueno",
        password: hashedPassword,
        authProvider: "google",
        activo: true
      }
    })
    console.log(`🔄 Usuario Marcos actualizado y vinculado a Google Auth para la empresa ${empresa.id}`)
  }

  // 3. Crear o actualizar Usuario Roleplay (Pablo / Socio Operador)
  let userRoleplay = await prisma.usuario.findUnique({
    where: { email: emailRoleplay }
  })

  if (!userRoleplay) {
    userRoleplay = await prisma.usuario.create({
      data: {
        nombre: "Pablo Clavero (Socio Operador)",
        email: emailRoleplay,
        password: hashedPassword,
        rol: "administrador",
        activo: true,
        authProvider: "credentials",
        empresaId: empresa.id
      }
    })
    console.log(`✅ Usuario Pablo (Socio Roleplay) creado con ID ${userRoleplay.id}`)
  } else {
    userRoleplay = await prisma.usuario.update({
      where: { id: userRoleplay.id },
      data: {
        nombre: "Pablo Clavero (Socio Operador)",
        empresaId: empresa.id,
        rol: "administrador",
        password: hashedPassword,
        activo: true
      }
    })
    console.log(`🔄 Usuario Pablo actualizado correctamente en la empresa ${empresa.id}`)
  }

  console.log("\n==================================================")
  console.log("🎉 CONFIGURACIÓN DE GOOGLE AUTH COMPLETADA EXITOSAMENTE")
  console.log("==================================================")
  console.log(`Empresa: Lázaro Préstamos (ID: ${empresa.id})`)
  console.log(`\n🔴 Marcos (Google Login):`)
  console.log(`   - Email: ${emailMarcos}`)
  console.log(`   - Método: Ingresa directamente con el BOTÓN DE GOOGLE ("Iniciar sesión con Google")`)
  console.log(`\n🔵 Pablo (Socio / Roleplay):`)
  console.log(`   - Email: ${emailRoleplay}`)
  console.log(`   - Clave: ${passwordPlana}`)
  console.log("==================================================\n")
}

seedLazaroPrestamos()
  .catch((err) => {
    console.error("❌ Error asociando Google Auth:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

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
        modoLite: "prestamista",
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
        modoLite: "prestamista",
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

  // 4. Sembrar los 16 Deudores Reales en la base de datos de Lázaro Préstamos
  const deudoresMarcos = [
    { nombre: "Madera", saldo: 65000, obs: "Capital $50.000 + Interés $15.000 (30%)" },
    { nombre: "Aldo", saldo: 393000, obs: "Capital $318.500 + Interés $74.500 (30%)" },
    { nombre: "Máquina #1", saldo: 130000, obs: "Capital $100.000 + Interés $30.000 (30%)" },
    { nombre: "Máquina #2", saldo: 260000, obs: "Capital $200.000 + Interés $60.000 (30%)" },
    { nombre: "Farana", saldo: 325000, obs: "Capital $250.000 + Interés $75.000 (30%)" },
    { nombre: "Máquina #3", saldo: 130000, obs: "Capital $100.000 + Interés $30.000 (30%)" },
    { nombre: "Máquina #4", saldo: 260000, obs: "Capital $200.000 + Interés $60.000 (30%)" },
    { nombre: "Máquina #5", saldo: 520000, obs: "Capital $400.000 + Interés $120.000 (30%)" },
    { nombre: "Máquina #6", saldo: 78000, obs: "Capital $60.000 + Interés $18.000 (30%)" },
    { nombre: "Máquina #7", saldo: 65000, obs: "Capital $50.000 + Interés $15.000 (30%)" },
    { nombre: "Máquina #8", saldo: 260000, obs: "Capital $200.000 + Interés $60.000 (30%)" },
    { nombre: "Máquina #9", saldo: 65000, obs: "Capital $50.000 + Interés $15.000 (30%)" },
    { nombre: "Máquina #10", saldo: 130000, obs: "Capital $100.000 + Interés $30.000 (30%)" },
    { nombre: "Máquina (Septiembre)", saldo: 500000, obs: "Capital $350.000 + Interés $150.000. Vence Septiembre" },
    { nombre: "Padre máquina", saldo: 520000, obs: "Capital $400.000 + Interés $120.000 (30%)" },
    { nombre: "Enano", saldo: 520000, obs: "Capital $400.000 + Interés $120.000 (30%)" },
  ]

  for (const d of deudoresMarcos) {
    const existing = await prisma.cliente.findFirst({
      where: { empresaId: empresa.id, nombre: d.nombre }
    })
    if (!existing) {
      await prisma.cliente.create({
        data: {
          empresaId: empresa.id,
          nombre: d.nombre,
          saldoCuentaCorriente: d.saldo,
          observaciones: d.obs,
          condicionIva: "Consumidor Final",
          tipoPersona: "persona_fisica",
        }
      })
    } else {
      await prisma.cliente.update({
        where: { id: existing.id },
        data: {
          saldoCuentaCorriente: d.saldo,
          observaciones: d.obs
        }
      })
    }
  }

  console.log(`✅ 16 Deudores reales sembrados en la base de datos de Lázaro Préstamos (Total Cartera: $4.316.000 ARS)`)

  console.log("\n==================================================")
  console.log("🎉 CONFIGURACIÓN DE GOOGLE AUTH & MAESTRO DE DEUDORES COMPLETADA")
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

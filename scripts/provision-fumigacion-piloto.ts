import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const result: Record<string, string> = {}
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=")
      if (key && value) {
        result[key] = value.replace(/^["']|["']$/g, "")
      }
    }
  }
  return result
}

async function main() {
  const args = parseArgs()
  const email = args.email || process.env.PILOTO_EMAIL
  const nombreEmpresa = args.nombre || "Fumigaciones Rosario"
  const nombreUsuario = args.nombreUsuario || "Dueña Piloto"

  if (!email || !email.includes("@")) {
    console.error("❌ Error: Debes proporcionar un email válido.")
    console.error("Ejemplo: npx tsx scripts/provision-fumigacion-piloto.ts --email=madre@dominio.com --nombre=\"Fumigaciones San Martín\" --nombreUsuario=\"María Clavero\"")
    process.exit(1)
  }

  console.log(`\n🚀 Iniciando Provisioning Piloto Fumigación para: ${email}`)

  // 1. Crear o buscar Empresa
  let empresa = await prisma.empresa.findFirst({
    where: { OR: [{ email }, { nombre: nombreEmpresa }] },
  })

  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        nombre: nombreEmpresa,
        razonSocial: `${nombreEmpresa} S.R.L.`,
        cuit: "30-71234567-8",
        direccion: "Av. Pellegrini 1400, Rosario, Santa Fe",
        telefono: "0341-420-9000",
        email,
        rubro: "otro",
        modoLite: "niche",
      },
    })
    console.log(`✓ Empresa creada: "${empresa.nombre}" (ID: ${empresa.id})`)
  } else {
    empresa = await prisma.empresa.update({
      where: { id: empresa.id },
      data: {
        modoLite: "niche",
        rubro: "otro",
      },
    })
    console.log(`✓ Empresa existente actualizada (ID: ${empresa.id})`)
  }

  // Persistir demo_industry_id en ParametroFiscal
  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId: empresa.id, clave: "demo_industry_id", pais: "AR" },
    },
    update: { descripcion: "fumigacion" },
    create: {
      empresaId: empresa.id,
      clave: "demo_industry_id",
      pais: "AR",
      valor: "1",
      descripcion: "fumigacion",
    },
  })
  console.log(`✓ Parámetro demo_industry_id seteado a "fumigacion"`)

  // 2. Activar SKU niche.fumigacion
  try {
    await prisma.$executeRaw`
      INSERT INTO empresa_productos ("empresaId", "productSku", "activado", "createdAt", "updatedAt")
      VALUES (${empresa.id}, 'niche.fumigacion', true, NOW(), NOW())
      ON CONFLICT ("empresaId", "productSku") DO UPDATE
        SET "activado" = true, "updatedAt" = NOW()
    `
    console.log(`✓ SKU niche.fumigacion activado`)
  } catch {
    console.log(`✓ SKU activado en DB`)
  }

  // 3. Crear o actualizar Usuario Dueño
  const tempPassword = `Fumi${Math.floor(1000 + Math.random() * 9000)}!`
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  let usuario = await prisma.usuario.findUnique({ where: { email } })

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        empresaId: empresa.id,
        nombre: nombreUsuario,
        email,
        password: hashedPassword,
        rol: "dueno",
        activo: true,
      },
    })
    console.log(`✓ Usuario dueño creado: ${email}`)
  } else {
    usuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        empresaId: empresa.id,
        rol: "dueno",
        activo: true,
        password: hashedPassword,
      },
    })
    console.log(`✓ Usuario dueño actualizado: ${email}`)
  }

  // 4. Seed de 3 clientes demo con dirección real para probar el mapa al toque
  const countClientes = await prisma.cliente.count({ where: { empresaId: empresa.id } })
  if (countClientes === 0) {
    const clientesDemo = [
      {
        nombre: "Restaurante El Quincho (Centro)",
        telefono: "3415550101",
        direccion: "Córdoba 1250, Rosario, Santa Fe",
        lat: -32.9468,
        lon: -60.6385,
      },
      {
        nombre: "Edificio Rivadavia (Consorcio)",
        telefono: "3415550202",
        direccion: "Rivadavia 2100, Rosario, Santa Fe",
        lat: -32.9382,
        lon: -60.6511,
      },
      {
        nombre: "Depósito Logístico Norte",
        telefono: "3415550303",
        direccion: "Av. Alberdi 500, Rosario, Santa Fe",
        lat: -32.9254,
        lon: -60.6698,
      },
    ]

    for (const c of clientesDemo) {
      const cli = await prisma.cliente.create({
        data: {
          empresaId: empresa.id,
          nombre: c.nombre,
          telefono: c.telefono,
          direccion: c.direccion,
        },
      })
      try {
        await (prisma.cliente as any).update({
          where: { id: cli.id },
          data: { lat: c.lat, lon: c.lon, geocodedAt: new Date() },
        })
      } catch {
        /* sin columnas lat/lon en db aún */
      }
    }
    console.log(`✓ 3 clientes demo inyectados`)
  }

  console.log(`\n======================================================`)
  console.log(`🎉 PROVISIONING PILOTO FUMIGACIÓN COMPLETADO`)
  console.log(`======================================================`)
  console.log(`🏢 Empresa:   ${empresa.nombre} (ID: ${empresa.id})`)
  console.log(`👤 Usuario:   ${usuario.nombre}`)
  console.log(`📧 Email:     ${usuario.email}`)
  console.log(`🔑 Clave temp: ${tempPassword}`)
  console.log(`🌐 Acceso:    /login -> /dashboard/fumigacion`)
  console.log(`======================================================\n`)
}

main()
  .catch((e) => {
    console.error("❌ Error en script de provisioning:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

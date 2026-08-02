const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Backfill client codes for ALL companies
  const clientesSinCodigo = await prisma.cliente.findMany({
    where: {
      codigo: null
    },
    orderBy: {
      id: 'asc'
    }
  });

  console.log(`Encontrados ${clientesSinCodigo.length} clientes sin código.`);

  let updatedCount = 0;
  for (const c of clientesSinCodigo) {
    // Para no chocar con posibles códigos existentes y mantenerlo secuencial
    // generaremos un código a partir de su ID
    const codigo = `CLI-${String(c.id).padStart(4, "0")}`;
    await prisma.cliente.update({
      where: { id: c.id },
      data: { codigo }
    });
    updatedCount++;
  }
  console.log(`Se actualizaron ${updatedCount} clientes con códigos nuevos.`);

  // 2. Fix addresses to include Rosario for the Fumigacion company (id: 93 usually)
  // To be safe, let's find the company with "Fumigaciones" in the name or we just update for company 93.
  const empresasFumigacion = await prisma.empresa.findMany({
    where: {
      nombre: {
        contains: 'Fumigacion',
        mode: 'insensitive'
      }
    }
  });

  for (const emp of empresasFumigacion) {
    const clientes = await prisma.cliente.findMany({
      where: {
        empresaId: emp.id,
        direccion: { not: null }
      }
    });

    let addressUpdatedCount = 0;
    for (const c of clientes) {
      if (!c.direccion.toLowerCase().includes('rosario')) {
        const newDireccion = c.direccion.trim() + ", Rosario, Santa Fe, Argentina";
        await prisma.cliente.update({
          where: { id: c.id },
          data: { direccion: newDireccion }
        });
        addressUpdatedCount++;
      }
    }
    console.log(`Empresa ${emp.nombre} (ID: ${emp.id}): se agregaron ', Rosario...' a ${addressUpdatedCount} clientes.`);
  }

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

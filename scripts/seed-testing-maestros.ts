/**
 * Seed de datos de testing — maestros operativos + transacciones demo
 *
 * Uso: npm run db:seed-testing
 * Idempotente: re-ejecutable sin duplicar por códigos/emails.
 */

import { config } from "dotenv"
import { PrismaClient, Prisma } from "@prisma/client"

config({ path: ".env.local" })
config({ path: ".env" })
// Preferir pooler Prisma (puerto 6543) para no saturar sesiones Supabase
if (process.env.POSTGRES_PRISMA_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL
}

const prisma = new PrismaClient()
const DEMO_CUIT = "20-00000000-0"
const d = (n: number) => new Prisma.Decimal(n)

function daysAgo(n: number) {
  const dt = new Date()
  dt.setDate(dt.getDate() - n)
  dt.setHours(12, 0, 0, 0)
  return dt
}

function dateOnly(dt: Date) {
  return new Date(dt.toISOString().slice(0, 10))
}

async function resolveEmpresa() {
  const empresa = await prisma.empresa.findFirst({ where: { cuit: DEMO_CUIT } })
  if (!empresa) throw new Error(`No se encontró empresa demo (CUIT ${DEMO_CUIT}). Ejecutá login demo primero.`)
  return empresa
}

async function ensureEmpresaMaestros(empresaId: number) {
  const sucursal = await prisma.sucursal.upsert({
    where: { empresaId_codigo: { empresaId, codigo: "CASA_CENTRAL" } },
    update: {},
    create: { empresaId, codigo: "CASA_CENTRAL", nombre: "Casa Central", esMatriz: true },
  })

  await prisma.cajaTipo.upsert({
    where: { empresaId_codigo: { empresaId, codigo: "PRINCIPAL" } },
    update: {},
    create: { empresaId, codigo: "PRINCIPAL", nombre: "Caja Principal", tipo: "principal", requiereArqueo: true },
  })

  const tiposOp = [
    { codigo: "VENTA_MOSTRADOR", nombre: "Venta de Mostrador", tipo: "venta", afectaStock: true, afectaCuentaCorriente: false, requiereAprobacion: false },
    { codigo: "VENTA_CC", nombre: "Venta en Cuenta Corriente", tipo: "venta", afectaStock: true, afectaCuentaCorriente: true, requiereAprobacion: false },
    { codigo: "COMPRA_CC", nombre: "Compra en Cuenta Corriente", tipo: "compra", afectaStock: true, afectaCuentaCorriente: true, requiereAprobacion: false },
  ]
  for (const t of tiposOp) {
    await prisma.tipoOperacionComercial.upsert({
      where: { empresaId_codigo: { empresaId, codigo: t.codigo } },
      update: {},
      create: { ...t, empresaId },
    })
  }

  return sucursal
}

async function upsertCategoria(empresaId: number, nombre: string, parentId?: number) {
  const existing = await prisma.categoria.findFirst({ where: { empresaId, nombre, parentId: parentId ?? null } })
  if (existing) return existing
  return prisma.categoria.create({ data: { empresaId, nombre, parentId, activo: true } })
}

async function upsertMarca(empresaId: number, codigo: string, nombre: string) {
  return prisma.marca.upsert({
    where: { empresaId_codigo: { empresaId, codigo } },
    update: { nombre, activo: true },
    create: { empresaId, codigo, nombre, activo: true },
  })
}

async function upsertProducto(
  empresaId: number,
  data: {
    codigo: string
    nombre: string
    categoriaId?: number
    marcaId?: number
    precioVenta: number
    precioCompra: number
    stock: number
    stockMinimo: number
    porcentajeIva?: number
    codigoBarras?: string
    unidad?: string
  }
) {
  return prisma.producto.upsert({
    where: { empresaId_codigo: { empresaId, codigo: data.codigo } },
    update: {
      nombre: data.nombre,
      precioVenta: d(data.precioVenta),
      precioCompra: d(data.precioCompra),
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      porcentajeIva: data.porcentajeIva ?? 21,
      categoriaId: data.categoriaId,
      marcaId: data.marcaId,
      codigoBarras: data.codigoBarras,
      unidad: data.unidad ?? "unidad",
      activo: true,
    },
    create: {
      empresaId,
      codigo: data.codigo,
      nombre: data.nombre,
      precioVenta: d(data.precioVenta),
      precioCompra: d(data.precioCompra),
      stock: data.stock,
      stockMinimo: data.stockMinimo,
      porcentajeIva: data.porcentajeIva ?? 21,
      categoriaId: data.categoriaId,
      marcaId: data.marcaId,
      codigoBarras: data.codigoBarras,
      unidad: data.unidad ?? "unidad",
      activo: true,
    },
  })
}

async function upsertCliente(
  empresaId: number,
  data: {
    codigo: string
    nombre: string
    email: string
    cuit?: string
    condicionIva?: string
    telefono?: string
    limiteCredito?: number
    saldoCuentaCorriente?: number
  }
) {
  const existing = await prisma.cliente.findFirst({ where: { empresaId, email: data.email } })
  if (existing) {
    return prisma.cliente.update({
      where: { id: existing.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        cuit: data.cuit,
        condicionIva: data.condicionIva ?? "Consumidor Final",
        telefono: data.telefono,
        limiteCredito: d(data.limiteCredito ?? 0),
        saldoCuentaCorriente: d(data.saldoCuentaCorriente ?? 0),
        activo: true,
      },
    })
  }
  return prisma.cliente.create({
    data: {
      empresaId,
      codigo: data.codigo,
      nombre: data.nombre,
      email: data.email,
      cuit: data.cuit,
      condicionIva: data.condicionIva ?? "Consumidor Final",
      telefono: data.telefono,
      limiteCredito: d(data.limiteCredito ?? 0),
      saldoCuentaCorriente: d(data.saldoCuentaCorriente ?? 0),
      activo: true,
    },
  })
}

async function upsertProveedor(
  empresaId: number,
  data: { codigo: string; nombre: string; cuit: string; email: string; telefono?: string }
) {
  const existing = await prisma.proveedor.findFirst({ where: { empresaId, cuit: data.cuit } })
  if (existing) {
    return prisma.proveedor.update({
      where: { id: existing.id },
      data: { nombre: data.nombre, codigo: data.codigo, email: data.email, telefono: data.telefono, activo: true },
    })
  }
  return prisma.proveedor.create({
    data: {
      empresaId,
      codigo: data.codigo,
      nombre: data.nombre,
      cuit: data.cuit,
      email: data.email,
      telefono: data.telefono,
      activo: true,
    },
  })
}

async function seedMaestrosOperativos(empresaId: number, sucursalId: number) {
  const catBelleza = await upsertCategoria(empresaId, "Belleza")
  const catCabello = await upsertCategoria(empresaId, "Cabello", catBelleza.id)
  const catUnas = await upsertCategoria(empresaId, "Uñas", catBelleza.id)
  const catInsumos = await upsertCategoria(empresaId, "Insumos")
  const catEquipamiento = await upsertCategoria(empresaId, "Equipamiento")

  const marcaLoreal = await upsertMarca(empresaId, "LOREAL", "L'Oréal Professionnel")
  const marcaWella = await upsertMarca(empresaId, "WELLA", "Wella Professionals")
  const marcaGenerico = await upsertMarca(empresaId, "GEN", "Genérico")

  const productos = await Promise.all([
    upsertProducto(empresaId, { codigo: "SH-001", nombre: "Shampoo Hidratante 500ml", categoriaId: catCabello.id, marcaId: marcaLoreal.id, precioVenta: 8500, precioCompra: 4200, stock: 45, stockMinimo: 10, codigoBarras: "7790001001001" }),
    upsertProducto(empresaId, { codigo: "AC-002", nombre: "Acondicionador Reparador 500ml", categoriaId: catCabello.id, marcaId: marcaLoreal.id, precioVenta: 9200, precioCompra: 4600, stock: 8, stockMinimo: 15, codigoBarras: "7790001001002" }),
    upsertProducto(empresaId, { codigo: "TI-003", nombre: "Tintura Permanente 60ml", categoriaId: catCabello.id, marcaId: marcaWella.id, precioVenta: 4500, precioCompra: 2100, stock: 120, stockMinimo: 30 }),
    upsertProducto(empresaId, { codigo: "ES-004", nombre: "Esmalte Semipermanente", categoriaId: catUnas.id, marcaId: marcaGenerico.id, precioVenta: 3200, precioCompra: 1400, stock: 3, stockMinimo: 20 }),
    upsertProducto(empresaId, { codigo: "AL-005", nombre: "Algodón Estéril 500g", categoriaId: catInsumos.id, marcaId: marcaGenerico.id, precioVenta: 2800, precioCompra: 1200, stock: 2, stockMinimo: 10 }),
    upsertProducto(empresaId, { codigo: "GU-006", nombre: "Guantes Descartables x100", categoriaId: catInsumos.id, marcaId: marcaGenerico.id, precioVenta: 5500, precioCompra: 2800, stock: 0, stockMinimo: 5 }),
    upsertProducto(empresaId, { codigo: "SE-007", nombre: "Secador Profesional 2200W", categoriaId: catEquipamiento.id, marcaId: marcaWella.id, precioVenta: 89000, precioCompra: 52000, stock: 6, stockMinimo: 2 }),
    upsertProducto(empresaId, { codigo: "TIJ-008", nombre: "Tijera Corte 6.5\"", categoriaId: catEquipamiento.id, marcaId: marcaGenerico.id, precioVenta: 45000, precioCompra: 22000, stock: 4, stockMinimo: 2 }),
    upsertProducto(empresaId, { codigo: "CR-009", nombre: "Crema Facial Hidratante", categoriaId: catBelleza.id, marcaId: marcaLoreal.id, precioVenta: 12500, precioCompra: 6000, stock: 18, stockMinimo: 8 }),
    upsertProducto(empresaId, { codigo: "WA-010", nombre: "Cera Modeladora 100ml", categoriaId: catCabello.id, marcaId: marcaWella.id, precioVenta: 6800, precioCompra: 3100, stock: 25, stockMinimo: 10 }),
    upsertProducto(empresaId, { codigo: "SV-011", nombre: "Servicio Corte Dama", categoriaId: catCabello.id, precioVenta: 15000, precioCompra: 0, stock: 999, stockMinimo: 0, porcentajeIva: 21, unidad: "servicio" }),
    upsertProducto(empresaId, { codigo: "SV-012", nombre: "Servicio Coloración", categoriaId: catCabello.id, precioVenta: 28000, precioCompra: 0, stock: 999, stockMinimo: 0, porcentajeIva: 21, unidad: "servicio" }),
  ])

  const clientes = await Promise.all([
    upsertCliente(empresaId, { codigo: "CLI-001", nombre: "María González", email: "maria.gonzalez@test.demo", cuit: "27-12345678-9", condicionIva: "Consumidor Final", telefono: "011-4444-1111" }),
    upsertCliente(empresaId, { codigo: "CLI-002", nombre: "Peluquería Estilo SRL", email: "estilo@cliente.demo", cuit: "30-71234567-8", condicionIva: "Responsable Inscripto", telefono: "011-4444-2222", limiteCredito: 500000, saldoCuentaCorriente: 185000 }),
    upsertCliente(empresaId, { codigo: "CLI-003", nombre: "Carlos Pérez", email: "carlos.perez@test.demo", condicionIva: "Monotributista", telefono: "011-4444-3333" }),
    upsertCliente(empresaId, { codigo: "CLI-004", nombre: "Spa Relax SA", email: "spa@cliente.demo", cuit: "30-70987654-3", condicionIva: "Responsable Inscripto", limiteCredito: 800000, saldoCuentaCorriente: 420000 }),
    upsertCliente(empresaId, { codigo: "CLI-005", nombre: "Ana Martínez", email: "ana.martinez@test.demo", condicionIva: "Consumidor Final" }),
    upsertCliente(empresaId, { codigo: "CLI-006", nombre: "Barbería El Clásico", email: "barberia@cliente.demo", cuit: "20-25678901-4", condicionIva: "Responsable Inscripto", saldoCuentaCorriente: 95000 }),
  ])

  const proveedores = await Promise.all([
    upsertProveedor(empresaId, { codigo: "PROV-001", nombre: "Distribuidora Capilar SA", cuit: "30-70111222-3", email: "ventas@capilar.demo", telefono: "011-5555-1111" }),
    upsertProveedor(empresaId, { codigo: "PROV-002", nombre: "Beauty Supply Argentina", cuit: "30-70222333-4", email: "pedidos@beauty.demo", telefono: "011-5555-2222" }),
    upsertProveedor(empresaId, { codigo: "PROV-003", nombre: "Insumos Médicos del Sur", cuit: "30-70333444-5", email: "compras@insumos.demo" }),
    upsertProveedor(empresaId, { codigo: "PROV-004", nombre: "Equipamiento Profesional SRL", cuit: "30-70444555-6", email: "info@equipo.demo" }),
  ])

  const depositoPrincipal = await prisma.deposito.upsert({
    where: { codigo: `DEP-${empresaId}-PRINCIPAL` },
    update: { activo: true },
    create: {
      codigo: `DEP-${empresaId}-PRINCIPAL`,
      nombre: "Depósito Principal",
      tipo: "principal",
      empresaId,
      sucursalId,
      direccion: "Av. Corrientes 1234, CABA",
      activo: true,
    },
  })

  await prisma.deposito.upsert({
    where: { codigo: `DEP-${empresaId}-SEC` },
    update: { activo: true },
    create: {
      codigo: `DEP-${empresaId}-SEC`,
      nombre: "Depósito Secundario",
      tipo: "secundario",
      empresaId,
      sucursalId,
      activo: true,
    },
  })

  const centros = [
    { codigo: "CC-VENTAS", nombre: "Ventas" },
    { codigo: "CC-ADMIN", nombre: "Administración" },
    { codigo: "CC-MKT", nombre: "Marketing" },
    { codigo: "CC-DEP", nombre: "Depósito" },
  ]
  for (const cc of centros) {
    await prisma.centroCosto.upsert({
      where: { empresaId_codigo: { empresaId, codigo: cc.codigo } },
      update: { nombre: cc.nombre, activo: true },
      create: { empresaId, codigo: cc.codigo, nombre: cc.nombre, activo: true },
    })
  }

  await prisma.cobrador.upsert({
    where: { empresaId_codigo: { empresaId, codigo: "COB-01" } },
    update: { activo: true },
    create: { empresaId, codigo: "COB-01", nombre: "Cobrador Demo", email: "cobrador@demo.local", comisionPct: d(2) },
  })

  const listaMayorista = await prisma.listaPrecio.upsert({
    where: { empresaId_nombre: { empresaId, nombre: "Lista Mayorista" } },
    update: { descripcion: "Precios para salones y revendedores", activo: true },
    create: {
      empresaId,
      nombre: "Lista Mayorista",
      descripcion: "Precios para salones y revendedores",
      activo: true,
    },
  })

  for (const p of productos.slice(0, 8)) {
    const precio = Number(p.precioVenta) * 0.85
    await prisma.itemListaPrecio.upsert({
      where: { listaPrecioId_productoId: { listaPrecioId: listaMayorista.id, productoId: p.id } },
      update: { precio: d(precio) },
      create: { listaPrecioId: listaMayorista.id, productoId: p.id, precio: d(precio) },
    })
  }

  console.log(`✓ Categorías, ${productos.length} productos, ${clientes.length} clientes, ${proveedores.length} proveedores`)
  console.log(`✓ Depósitos, centros de costo, cobrador, lista mayorista`)

  return { productos, clientes, proveedores, depositoPrincipal }
}

async function seedTransacciones(
  empresaId: number,
  clientes: { id: number }[],
  proveedores: { id: number }[],
  productos: { id: number; precioVenta: Prisma.Decimal; nombre: string; porcentajeIva: number }[]
) {
  const existingFacturas = await prisma.factura.count({ where: { empresaId } })
  if (existingFacturas >= 8) {
    console.log(`✓ Transacciones ya presentes (${existingFacturas} facturas) — omitiendo`)
    return
  }

  const maxNum = await prisma.factura.aggregate({
    where: { empresaId, puntoVenta: 1 },
    _max: { numero: true },
  })
  let numero = (maxNum._max.numero ?? 0) + 1

  const ventasConfig = [
    { clienteIdx: 0, daysAgo: 2, items: [0, 1], estado: "emitida" as const },
    { clienteIdx: 1, daysAgo: 5, items: [2, 3, 4], estado: "emitida" as const, cc: true },
    { clienteIdx: 2, daysAgo: 8, items: [5, 6], estado: "emitida" as const },
    { clienteIdx: 3, daysAgo: 15, items: [7, 8], estado: "emitida" as const, cc: true },
    { clienteIdx: 4, daysAgo: 22, items: [9], estado: "emitida" as const },
    { clienteIdx: 5, daysAgo: 35, items: [0, 10], estado: "emitida" as const, cc: true },
    { clienteIdx: 0, daysAgo: 45, items: [11], estado: "emitida" as const },
    { clienteIdx: 1, daysAgo: 60, items: [2, 9], estado: "emitida" as const, cc: true },
  ]

  for (const v of ventasConfig) {
    const cliente = clientes[v.clienteIdx]
    const fecha = daysAgo(v.daysAgo)
    const lineas = v.items.map((idx) => {
      const p = productos[idx]
      const cantidad = idx >= 10 ? 1 : Math.floor(Math.random() * 3) + 1
      const precioUnitario = Number(p.precioVenta)
      const subtotal = precioUnitario * cantidad
      const iva = subtotal * (p.porcentajeIva / 100)
      return {
        productoId: p.id,
        descripcion: p.nombre,
        cantidad,
        precioUnitario: d(precioUnitario),
        porcentajeIva: p.porcentajeIva,
        subtotal: d(subtotal),
        iva: d(iva),
        total: d(subtotal + iva),
      }
    })
    const subtotal = lineas.reduce((s, l) => s + Number(l.subtotal), 0)
    const iva = lineas.reduce((s, l) => s + Number(l.iva), 0)
    const total = subtotal + iva

    const factura = await prisma.factura.create({
      data: {
        empresaId,
        clienteId: cliente.id,
        tipo: "B",
        tipoCbte: 6,
        numero: numero++,
        puntoVenta: 1,
        subtotal: d(subtotal),
        iva: d(iva),
        total: d(total),
        estado: v.estado,
        cae: `TEST${numero}${Date.now().toString().slice(-6)}`,
        fechaCAE: fecha,
        vencimientoCAE: daysAgo(v.daysAgo - 10),
        createdAt: fecha,
        lineas: { create: lineas },
      },
    })

    if (v.cc) {
      const vencimiento = new Date(fecha)
      vencimiento.setDate(vencimiento.getDate() + (v.daysAgo > 30 ? -5 : 30))
      await prisma.cuentaCobrar.create({
        data: {
          facturaId: factura.id,
          clienteId: cliente.id,
          montoOriginal: d(total),
          montoPagado: d(v.daysAgo > 30 ? total * 0.3 : 0),
          saldo: d(v.daysAgo > 30 ? total * 0.7 : total),
          fechaEmision: dateOnly(fecha),
          fechaVencimiento: dateOnly(vencimiento),
          estado: v.daysAgo > 30 ? "vencida" : "pendiente",
        },
      })
    }
  }

  const maxCompra = await prisma.compra.count({ where: { empresaId } })
  if (maxCompra < 3) {
    for (let i = 0; i < 3; i++) {
      const proveedor = proveedores[i % proveedores.length]
      const fecha = daysAgo(10 + i * 12)
      const p = productos[i]
      const cantidad = 20
      const precioUnitario = Number(p.precioVenta) * 0.5
      const subtotal = precioUnitario * cantidad
      const iva = subtotal * 0.21
      const total = subtotal + iva

      const compra = await prisma.compra.create({
        data: {
          empresaId,
          proveedorId: proveedor.id,
          tipo: "A",
          numero: `0001-${String(100 + i).padStart(8, "0")}`,
          puntoVenta: "0001",
          fecha,
          subtotal: d(subtotal),
          iva: d(iva),
          total: d(total),
          lineas: {
            create: [{
              productoId: p.id,
              descripcion: p.nombre,
              cantidad,
              precioUnitario: d(precioUnitario),
              porcentajeIva: 21,
              subtotal: d(subtotal),
              iva: d(iva),
              total: d(total),
            }],
          },
        },
      })

      const venc = new Date(fecha)
      venc.setDate(venc.getDate() + 30)
      await prisma.cuentaPagar.create({
        data: {
          compraId: compra.id,
          proveedorId: proveedor.id,
          montoOriginal: d(total),
          montoPagado: d(0),
          saldo: d(total),
          fechaEmision: dateOnly(fecha),
          fechaVencimiento: dateOnly(venc),
          estado: i === 0 ? "vencida" : "pendiente",
        },
      })
    }
  }

  console.log(`✓ ${ventasConfig.length} facturas + compras con CC/CP`)
}

async function seedCaja(empresaId: number, usuarioId: number, sucursalId: number) {
  const cajaTipo = await prisma.cajaTipo.findFirst({ where: { empresaId, codigo: "PRINCIPAL" } })
  const abierta = await prisma.caja.findFirst({ where: { empresaId, estado: "abierta" } })
  if (abierta) {
    console.log(`✓ Caja ya abierta (id ${abierta.id})`)
    return
  }

  const caja = await prisma.caja.create({
    data: {
      empresaId,
      sucursalId,
      cajaTipoId: cajaTipo?.id,
      estado: "abierta",
      saldoInicial: d(50000),
      abiertoPor: usuarioId,
      turno: "mañana",
      movimientos: {
        create: [
          { tipo: "ingreso", monto: d(25000), concepto: "Apertura + fondo chico", medioPago: "efectivo" },
          { tipo: "ingreso", monto: d(18500), concepto: "Cobro mostrador", medioPago: "efectivo" },
          { tipo: "ingreso", monto: d(12000), concepto: "Cobro tarjeta", medioPago: "tarjeta_debito" },
          { tipo: "egreso", monto: d(3500), concepto: "Gastos varios", medioPago: "efectivo" },
        ],
      },
    },
  })
  console.log(`✓ Caja abierta (id ${caja.id}) con movimientos`)
}

async function habilitarModulos(empresaId: number) {
  const modulos = ["ia", "stock", "ventas", "compras", "contabilidad", "caja", "reportes"]
  for (const modulo of modulos) {
    await prisma.configuracionModulo.upsert({
      where: { empresaId_modulo: { empresaId, modulo } },
      update: { habilitado: true },
      create: { empresaId, modulo, habilitado: true },
    })
  }
  console.log(`✓ Módulos habilitados: ${modulos.join(", ")}`)
}

async function main() {
  console.log("═══════════════════════════════════════════")
  console.log(" SEED TESTING — Maestros + transacciones demo")
  console.log("═══════════════════════════════════════════\n")

  const empresa = await resolveEmpresa()
  console.log(`→ Empresa: ${empresa.nombre} (id ${empresa.id}, rubro: ${empresa.rubro})`)

  const usuario = await prisma.usuario.findFirst({
    where: { empresaId: empresa.id, rol: "administrador", activo: true },
  })

  const sucursal = await ensureEmpresaMaestros(empresa.id)
  const { productos, clientes, proveedores } = await seedMaestrosOperativos(empresa.id, sucursal.id)
  await seedTransacciones(empresa.id, clientes, proveedores, productos)

  if (usuario) {
    await seedCaja(empresa.id, usuario.id, sucursal.id)
  }

  await habilitarModulos(empresa.id)

  const resumen = await Promise.all([
    prisma.producto.count({ where: { empresaId: empresa.id, activo: true } }),
    prisma.cliente.count({ where: { empresaId: empresa.id, activo: true } }),
    prisma.proveedor.count({ where: { empresaId: empresa.id, activo: true } }),
    prisma.factura.count({ where: { empresaId: empresa.id } }),
  ])

  const criticos = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM productos
    WHERE "empresaId" = ${empresa.id} AND activo = true AND stock <= "stockMinimo" AND "stockMinimo" > 0
  `

  console.log("\n═══════════════════════════════════════════")
  console.log(" RESUMEN")
  console.log(`  Productos:  ${resumen[0]}`)
  console.log(`  Clientes:   ${resumen[1]}`)
  console.log(`  Proveedores:${resumen[2]}`)
  console.log(`  Facturas:   ${resumen[3]}`)
  console.log(`  Stock crítico: ${criticos[0]?.count ?? 0} productos`)
  console.log("═══════════════════════════════════════════")
  console.log("\n✅ Listo. Iniciá sesión demo y explorá dashboard, POS, reportes e IA.")
}

main()
  .catch((e) => {
    console.error("Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
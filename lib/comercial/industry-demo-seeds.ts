/**
 * Seeds de demo por industria — datos con nombre real, no "Cliente Test 1".
 */

import { prisma } from "@/lib/prisma"
import type { IndustryTemplate } from "@/lib/comercial/industry-templates"
import { getProductosSeed } from "@/lib/comercial/retail-onboarding-service"
import {
  generarConfiguracionOnboarding,
  type Rubro,
  type RespuestasOnboarding,
} from "@/lib/onboarding/onboarding-ia"

interface ClienteSeed {
  nombre: string
  telefono?: string
  email?: string
  /** Deuda fiado (valor positivo → se persiste como saldo negativo) */
  deudaFiado?: number
  saldoCuentaCorriente?: number
  observaciones?: string
  fiadoHabilitado?: boolean
  limiteCredito?: number
}

export interface IndustryDemoSeedResult {
  clientes: number
  productos: number
  mesas?: number
  comandas?: number
  planes?: number
  membresias?: number
  cannabis?: boolean
}

function defaultAnswers(rubro: Rubro): RespuestasOnboarding {
  return {
    rubro,
    tamano: "pequeno",
    tieneStock: true,
    tienePersonal: true,
    necesitaFacturacion: true,
    necesitaContabilidad: false,
    condicionAfip: "monotributista",
    tieneLocal: true,
    tieneDelivery: rubro === "bar_restaurant",
    tieneMozos: rubro === "bar_restaurant",
  }
}

const CLIENTES_POR_RUBRO: Partial<Record<Rubro, ClienteSeed[]>> = {
  kiosco: [
    { nombre: "Juan Pérez — Fiado barrio", telefono: "11-4567-8901", deudaFiado: 8500, fiadoHabilitado: true, limiteCredito: 20000 },
    { nombre: "María del Valle", telefono: "11-2233-4455", deudaFiado: 3200, fiadoHabilitado: true, limiteCredito: 15000 },
    { nombre: "Don Carlos (almacén)", deudaFiado: 12000, fiadoHabilitado: true, limiteCredito: 25000 },
  ],
  veterinaria: [
    { nombre: "María González — Tutora de Bobby", telefono: "11-5555-1234", email: "maria.gonzalez@email.com" },
    { nombre: "Lucas Fernández — Max (Labrador)", telefono: "11-4444-5678" },
  ],
  gimnasio: [
    { nombre: "Ana Martínez — Cuota Pilates", telefono: "11-3333-2211", saldoCuentaCorriente: -18500, observaciones: "Morosa — vence 15/03" },
    { nombre: "Diego López — Plan mensual", saldoCuentaCorriente: 0 },
    { nombre: "Sofía Ruiz — Trimestral", saldoCuentaCorriente: -9200, observaciones: "Débito fallido" },
    { nombre: "Carlos Pintos — Funcional", saldoCuentaCorriente: 0 },
    { nombre: "Valentina Soto — Pilates reformer", saldoCuentaCorriente: -14200, observaciones: "2 meses atrasada" },
  ],
  estacion_servicio: [
    { nombre: "Transportes Río SA — Flota", telefono: "0341-422-8899", saldoCuentaCorriente: 485000, observaciones: "CC mensual — 12 camiones/semana" },
    { nombre: "Logística del Sur SRL", saldoCuentaCorriente: 128000 },
    { nombre: "Camionero suelto — García", saldoCuentaCorriente: 45000 },
  ],
  bar_restaurant: [
    { nombre: "Mesa habitual — Grupo Martínez" },
    { nombre: "Delivery — Barrio Norte" },
  ],
  agro_acopio: [
    { nombre: "Estancia La Aurora — Productor", telefono: "03462-55-1234", observaciones: "RENSPA activo" },
    { nombre: "Cooperativa del Sur", saldoCuentaCorriente: 320000 },
  ],
  distribuidora: [
    { nombre: "Autoservicio Don Pedro", saldoCuentaCorriente: 95000 },
    { nombre: "Kiosco Central — Cuenta B2B", saldoCuentaCorriente: 42000 },
  ],
  farmacia: [
    { nombre: "OSDE — Obra social", observaciones: "Convenio activo" },
    { nombre: "Cliente mostrador — López" },
  ],
  salon_belleza: [
    { nombre: "Lucía Torres — Coloración", telefono: "11-6677-8899" },
    { nombre: "Cliente frecuente — Barbería" },
  ],
  prestamista: [
    {
      nombre: "Roberto Díaz — Cuota diaria",
      telefono: "11-5544-3322",
      deudaFiado: 28000,
      fiadoHabilitado: true,
      limiteCredito: 80000,
      observaciones: "Cuota diaria — vence hoy",
    },
    {
      nombre: "Comercio San Martín — Préstamo B2B",
      telefono: "0341-422-1100",
      deudaFiado: 150000,
      fiadoHabilitado: true,
      limiteCredito: 250000,
      observaciones: "Préstamo comercial — 12 cuotas",
    },
  ],
}

function resolveSaldo(c: ClienteSeed): number {
  if (c.deudaFiado != null && c.deudaFiado > 0) return -c.deudaFiado
  return c.saldoCuentaCorriente ?? 0
}

async function seedBarDemo(empresaId: number): Promise<{ mesas: number; comandas: number }> {
  let salon = await prisma.salon.findFirst({ where: { empresaId, nombre: "Salón principal" } })
  if (!salon) {
    salon = await prisma.salon.create({ data: { empresaId, nombre: "Salón principal" } })
  }

  let mesasCreadas = 0
  const mesas: { id: number; numero: number }[] = []
  for (let n = 1; n <= 6; n++) {
    let mesa = await prisma.mesa.findFirst({ where: { salonId: salon.id, numero: n } })
    if (!mesa) {
      mesa = await prisma.mesa.create({
        data: { salonId: salon.id, numero: n, capacidad: n <= 2 ? 2 : 4, estado: n === 3 ? "ocupada" : "libre" },
      })
      mesasCreadas++
    }
    mesas.push({ id: mesa.id, numero: mesa.numero })
  }

  const mesaOcupada = mesas.find((m) => m.numero === 3)!
  const comandaExistente = await prisma.comanda.findFirst({
    where: { mesaId: mesaOcupada.id, estado: { notIn: ["cerrada", "cancelada"] } },
  })

  let comandasCreadas = 0
  if (!comandaExistente) {
    const empanada = await prisma.producto.findFirst({
      where: { empresaId, nombre: { contains: "Empanada", mode: "insensitive" } },
    })
    const cerveza = await prisma.producto.findFirst({
      where: { empresaId, nombre: { contains: "Cerveza", mode: "insensitive" } },
    })

    await prisma.comanda.create({
      data: {
        mesaId: mesaOcupada.id,
        estado: "enviada_cocina",
        comensales: 3,
        mozo: "Lucas",
        notas: "Mesa 3 — demo salón",
        lineas: {
          create: [
            {
              nombre: empanada?.nombre ?? "Empanada carne",
              cantidad: 6,
              precio: empanada?.precioVenta ?? 450,
              estado: "en_preparacion",
              productoId: empanada?.id,
            },
            {
              nombre: cerveza?.nombre ?? "Cerveza 1L",
              cantidad: 2,
              precio: cerveza?.precioVenta ?? 1500,
              estado: "pendiente",
              productoId: cerveza?.id,
            },
          ],
        },
      },
    })
    comandasCreadas++
  }

  return { mesas: mesasCreadas, comandas: comandasCreadas }
}

async function seedGymDemo(empresaId: number): Promise<{ planes: number; membresias: number }> {
  const planDefs = [
    { nombre: "Plan mensual", precio: 28000, periodicidad: "mensual", duracionDias: 30 },
    { nombre: "Trimestral", precio: 75000, periodicidad: "trimestral", duracionDias: 90 },
    { nombre: "Pilates reformer", precio: 35000, periodicidad: "mensual", duracionDias: 30 },
  ]

  let planesCreados = 0
  const planes: { id: number; nombre: string; duracionDias: number }[] = []
  for (const p of planDefs) {
    let plan = await prisma.planMembresia.findFirst({ where: { empresaId, nombre: p.nombre } })
    if (!plan) {
      plan = await prisma.planMembresia.create({
        data: { empresaId, nombre: p.nombre, precio: p.precio, periodicidad: p.periodicidad, duracionDias: p.duracionDias },
      })
      planesCreados++
    }
    planes.push({ id: plan.id, nombre: plan.nombre, duracionDias: plan.duracionDias })
  }

  const socios = [
    { clienteNombre: "Ana Martínez — Cuota Pilates", planNombre: "Pilates reformer", estado: "suspendida", diasAtras: 45 },
    { clienteNombre: "Diego López — Plan mensual", planNombre: "Plan mensual", estado: "activa", diasAtras: 0 },
    { clienteNombre: "Sofía Ruiz — Trimestral", planNombre: "Trimestral", estado: "vencida", diasAtras: 12 },
    { clienteNombre: "Valentina Soto — Pilates reformer", planNombre: "Pilates reformer", estado: "vencida", diasAtras: 60 },
  ]

  let membresiasCreadas = 0
  const hoy = new Date()
  for (const s of socios) {
    const cliente = await prisma.cliente.findFirst({ where: { empresaId, nombre: s.clienteNombre } })
    const plan = planes.find((p) => p.nombre === s.planNombre)
    if (!cliente || !plan) continue

    const existe = await prisma.membresia.findFirst({ where: { clienteId: cliente.id, planId: plan.id } })
    if (existe) continue

    const inicio = new Date(hoy)
    inicio.setDate(inicio.getDate() - (plan.duracionDias ?? 30) - s.diasAtras)
    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + (plan.duracionDias ?? 30))

    await prisma.membresia.create({
      data: {
        clienteId: cliente.id,
        planId: plan.id,
        fechaInicio: inicio,
        fechaFin: fin,
        estado: s.estado,
        notas: s.estado !== "activa" ? "Demo — moroso" : null,
      },
    })
    membresiasCreadas++
  }

  return { planes: planesCreados, membresias: membresiasCreadas }
}

async function seedCannabisDemo(empresaId: number): Promise<boolean> {
  const perfilExiste = await prisma.agroCannabisPerfil.findUnique({ where: { empresaId } })
  if (!perfilExiste) {
    await prisma.agroCannabisPerfil.create({
      data: {
        empresaId,
        nombreOng: "Asociación Demo Rosario",
        reprocannNumero: "REPROCANN-DEMO-2026",
        reprocannVencimiento: new Date("2027-06-30"),
        cupoPlantas: 120,
        cupoSuperficieM2: 85,
        responsableTecnico: "Ing. Agr. Martín Reyes",
        observaciones: "Perfil demo — cultivo regulado",
      },
    })
  }

  let sala = await prisma.agroCannabisSala.findFirst({ where: { empresaId, nombre: "Sala Floración A" } })
  if (!sala) {
    sala = await prisma.agroCannabisSala.create({
      data: { empresaId, nombre: "Sala Floración A", tipo: "INDOOR", superficieM2: 42, capacidadPlantas: 48 },
    })
  }

  let genetica = await prisma.agroCannabisGenetica.findFirst({
    where: { empresaId, nombre: "CBD Rosario #3" },
  })
  if (!genetica) {
    genetica = await prisma.agroCannabisGenetica.create({
      data: { empresaId, nombre: "CBD Rosario #3", tipo: "CBD", thcMaxPct: 0.3, cbdMaxPct: 12, reprocannAutorizada: true },
    })
  }

  const cicloExiste = await prisma.agroCannabisCiclo.findFirst({ where: { empresaId, numero: "CIC-2026-0001" } })
  if (!cicloExiste) {
    await prisma.agroCannabisCiclo.create({
      data: {
        empresaId,
        numero: "CIC-2026-0001",
        salaId: sala.id,
        geneticaId: genetica.id,
        etapa: "FLORACION",
        plantasIniciales: 36,
        plantasActuales: 34,
        costoAcumulado: 185000,
        observaciones: "Ciclo activo — semana 6 floración",
      },
    })
  }

  const insumos = [
    { codigo: "NUT-A", nombre: "Nutriente Floración A", categoria: "NUTRIENTE", stockActual: 12, costoUnitario: 8500 },
    { codigo: "SUB-COCO", nombre: "Sustrato coco 50L", categoria: "SUSTRATO", unidad: "bolsa", stockActual: 24, costoUnitario: 4200 },
    { codigo: "FERT-CAL", nombre: "Calcio-Magnesio", categoria: "FERTILIZANTE", stockActual: 8, costoUnitario: 6200 },
  ]

  for (const ins of insumos) {
    const existe = await prisma.agroCannabisInsumo.findFirst({ where: { empresaId, codigo: ins.codigo } })
    if (!existe) {
      await prisma.agroCannabisInsumo.create({
        data: {
          empresaId,
          codigo: ins.codigo,
          nombre: ins.nombre,
          categoria: ins.categoria,
          unidad: ins.unidad ?? "L",
          stockActual: ins.stockActual,
          stockMinimo: 2,
          costoUnitario: ins.costoUnitario,
        },
      })
    }
  }

  return true
}

function templateUsaLibretaFiado(template: IndustryTemplate): boolean {
  if (template.isRetail) return true
  return (
    template.engancheId === "pos.fiado_barrio" ||
    template.engancheId === "niche.prestamo_barrio" ||
    template.id === "prestamista"
  )
}

async function seedConsorciosDemo(empresaId: number): Promise<void> {
  const periodo = new Date().toISOString().slice(0, 7)
  let consorcio = await prisma.consorcio.findFirst({
    where: { empresaId, nombre: "Edificio Demo — Rivadavia 1200" },
  })
  if (!consorcio) {
    consorcio = await prisma.consorcio.create({
      data: {
        empresaId,
        nombre: "Edificio Demo — Rivadavia 1200",
        direccion: "Av. Rivadavia 1200, CABA",
      },
    })
  }

  const unidades = [
    { numero: "1° A", porceps: 12, residenteNombre: "María López — Inquilina" },
    { numero: "2° B", porceps: 15, residenteNombre: "Carlos Pérez — Propietario" },
    { numero: "PB Local", porceps: 8, residenteNombre: "Kiosco Rivadavia SA" },
  ]

  for (const u of unidades) {
    let residente = await prisma.cliente.findFirst({
      where: { empresaId, nombre: u.residenteNombre },
    })
    if (!residente) {
      residente = await prisma.cliente.create({
        data: {
          empresaId,
          nombre: u.residenteNombre,
          telefono: "11-4000-0000",
          condicionIva: "Consumidor Final",
          activo: true,
        },
      })
    }

    const existe = await prisma.unidadFuncional.findFirst({
      where: { consorcioId: consorcio.id, numero: u.numero },
    })
    if (!existe) {
      await prisma.unidadFuncional.create({
        data: {
          consorcioId: consorcio.id,
          numero: u.numero,
          porceps: u.porceps,
          residenteId: residente.id,
        },
      })
    }
  }

  const gastos = [
    { descripcion: "Limpieza edificio", monto: 85000 },
    { descripcion: "Luz ascensor", monto: 42000 },
  ]
  for (const g of gastos) {
    const existe = await prisma.consorcioGasto.findFirst({
      where: { consorcioId: consorcio.id, periodo, descripcion: g.descripcion },
    })
    if (!existe) {
      await prisma.consorcioGasto.create({
        data: {
          consorcioId: consorcio.id,
          descripcion: g.descripcion,
          monto: g.monto,
          fecha: new Date(),
          periodo,
        },
      })
    }
  }
}

const NICHE_MOVIMIENTO_SEEDS: Record<
  string,
  { titulo: string; categoria: string; monto: number; estado?: string }[]
> = {
  "niche.obra_changas": [
    { titulo: "Jornal — Juan P.", categoria: "jornal", monto: 45000, estado: "pendiente" },
    { titulo: "Adelanto — Martín L.", categoria: "adelanto", monto: 15000, estado: "pendiente" },
    { titulo: "Jornal — Rosa G.", categoria: "jornal", monto: 38000, estado: "pagado" },
  ],
  "niche.gimnasio_barrio": [
    { titulo: "Cuota marzo — Ana M.", categoria: "cuota", monto: 18500, estado: "pendiente" },
    { titulo: "Cuota marzo — Diego L.", categoria: "cuota", monto: 12000, estado: "pagado" },
    { titulo: "Cuota marzo — Sofía R.", categoria: "cuota", monto: 9200, estado: "pendiente" },
  ],
  "niche.feria_puesto": [
    { titulo: "Venta turno mañana", categoria: "venta", monto: 125000, estado: "pagado" },
    { titulo: "Cuota feria semana", categoria: "cuota_feria", monto: 8500, estado: "pendiente" },
  ],
  "niche.base_remis": [
    { titulo: "Viajes chofer García", categoria: "viaje", monto: 67000, estado: "pendiente" },
    { titulo: "Gasto combustible", categoria: "gasto", monto: 12000, estado: "pagado" },
  ],
  "niche.acopio_grano": [
    { titulo: "Entrega soja — Estancia Norte", categoria: "entrega", monto: 890000, estado: "pendiente" },
    { titulo: "Liquidación parcial marzo", categoria: "liquidacion", monto: 420000, estado: "pagado" },
  ],
}

const NICHE_CUOTA_CLIENTES: Record<string, { nombre: string; telefono?: string }[]> = {
  "niche.gimnasio_barrio": [
    { nombre: "Ana Martínez — Cuota Pilates", telefono: "11-3333-2211" },
    { nombre: "Diego López — Plan mensual" },
    { nombre: "Sofía Ruiz — Trimestral", telefono: "11-2222-3344" },
  ],
}

async function seedNicheMovimientosDemo(empresaId: number, appSku: string): Promise<void> {
  const samples = NICHE_MOVIMIENTO_SEEDS[appSku]
  if (!samples?.length) return

  const existentes = await prisma.nicheMovimiento.count({
    where: { empresaId, appSku },
  })
  if (existentes > 0) return

  const periodo = new Date().toISOString().slice(0, 7)
  const clienteDefs = NICHE_CUOTA_CLIENTES[appSku] ?? []

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]
    let clienteId: number | undefined

    const def = clienteDefs[i]
    if (def) {
      let cliente = await prisma.cliente.findFirst({
        where: { empresaId, nombre: def.nombre },
      })
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            empresaId,
            nombre: def.nombre,
            telefono: def.telefono,
            condicionIva: "Consumidor Final",
            activo: true,
          },
        })
      }
      clienteId = cliente.id
    }

    await prisma.nicheMovimiento.create({
      data: {
        empresaId,
        appSku,
        titulo: s.titulo,
        categoria: s.categoria,
        monto: s.monto,
        estado: s.estado ?? "pendiente",
        periodo,
        clienteId,
      },
    })
  }
}

async function seedAgendaDemo(empresaId: number, template: IndustryTemplate): Promise<void> {
  const pros = [
    {
      nombre: template.id === "salon_belleza" ? "Valentina — Colorista" : "Dr. Martín Reyes",
      especialidad: template.id === "salon_belleza" ? "Coloración" : "Clínica general",
      color: "#8b5cf6",
    },
    {
      nombre: template.id === "salon_belleza" ? "Lucas — Barbería" : "Dra. Ana Soto",
      especialidad: template.id === "salon_belleza" ? "Corte y barba" : "Pediatría",
      color: "#0ea5e9",
    },
  ]

  for (const p of pros) {
    const existe = await prisma.profesional.findFirst({
      where: { empresaId, nombre: p.nombre },
    })
    if (!existe) {
      await prisma.profesional.create({
        data: { empresaId, nombre: p.nombre, especialidad: p.especialidad, color: p.color, activo: true },
      })
    }
  }

  const servicios =
    template.id === "salon_belleza"
      ? [
          { nombre: "Corte dama", duracionMinutos: 45 },
          { nombre: "Barba", duracionMinutos: 30 },
          { nombre: "Coloración", duracionMinutos: 90 },
        ]
      : [
          { nombre: "Consulta general", duracionMinutos: 30 },
          { nombre: "Control", duracionMinutos: 20 },
        ]

  for (const s of servicios) {
    const existe = await prisma.servicio.findFirst({
      where: { empresaId, nombre: s.nombre },
    })
    if (!existe) {
      await prisma.servicio.create({
        data: { empresaId, nombre: s.nombre, duracionMinutos: s.duracionMinutos, activo: true },
      })
    }
  }
}

async function enableFiadoDemo(empresaId: number, template: IndustryTemplate): Promise<void> {
  if (!templateUsaLibretaFiado(template)) return

  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      fiadoRequiereLimite: false,
      fiadoNotificarWhatsApp: true,
      emailDuenoAlmacen: "demo@claver.com.ar",
    },
  })
}

export async function seedIndustryDemoData(
  empresaId: number,
  template: IndustryTemplate,
): Promise<IndustryDemoSeedResult> {
  const rubro = template.rubro
  let productosCreados = 0
  let clientesCreados = 0

  const retailSeedKey = ["almacen", "kiosco", "ferreteria", "carniceria", "panaderia"].includes(template.id)
    ? template.id === "carniceria" || template.id === "panaderia"
      ? template.id
      : template.id === "almacen"
        ? "almacen"
        : "kiosco"
    : "almacen"

  const productos = template.isRetail
    ? getProductosSeed(retailSeedKey)
    : generarConfiguracionOnboarding(defaultAnswers(rubro)).productosEjemplo

  for (const [index, p] of productos.entries()) {
    const codigo = "codigo" in p ? p.codigo : `DEMO-${rubro.toUpperCase().slice(0, 4)}-${index + 1}`
    const nombre = p.nombre
    const precio = "precioVenta" in p ? p.precioVenta : p.precio
    const iva = "porcentajeIva" in p ? (p.porcentajeIva ?? 21) : p.iva

    const existe = await prisma.producto.findFirst({
      where: { empresaId, codigo },
    })
    if (!existe) {
      await prisma.producto.create({
        data: {
          empresaId,
          codigo,
          nombre,
          precioVenta: precio,
          porcentajeIva: iva,
          activo: true,
          stock: 100,
          unidad: "unidad",
        },
      })
      productosCreados++
    }
  }

  if (rubro === "veterinaria") {
    const vacuna = await prisma.producto.findFirst({
      where: { empresaId, nombre: { contains: "Vacuna", mode: "insensitive" } },
    })
    if (!vacuna) {
      await prisma.producto.create({
        data: {
          empresaId,
          codigo: "VET-VAC-001",
          nombre: "Vacuna antirrábica — Bobby",
          precioVenta: 12500,
          porcentajeIva: 21,
          activo: true,
          stock: 24,
          unidad: "unidad",
        },
      })
      productosCreados++
    }
  }

  const clientes = CLIENTES_POR_RUBRO[rubro] ?? []
  for (const c of clientes) {
    const existe = await prisma.cliente.findFirst({
      where: { empresaId, nombre: c.nombre },
    })
    if (!existe) {
      await prisma.cliente.create({
        data: {
          empresaId,
          nombre: c.nombre,
          telefono: c.telefono ?? null,
          email: c.email ?? null,
          saldoCuentaCorriente: resolveSaldo(c),
          condicionIva: "Consumidor Final",
          activo: true,
          observaciones: c.observaciones ?? null,
          fiadoHabilitado: c.fiadoHabilitado ?? false,
          limiteCredito: c.limiteCredito ?? 0,
        },
      })
      clientesCreados++
    }
  }

  const cf = await prisma.cliente.findFirst({
    where: { empresaId, nombre: { contains: "Consumidor Final", mode: "insensitive" } },
  })
  if (!cf) {
    await prisma.cliente.create({
      data: {
        empresaId,
        nombre: "Consumidor Final",
        condicionIva: "Consumidor Final",
        activo: true,
      },
    })
    clientesCreados++
  }

  await enableFiadoDemo(empresaId, template)

  const result: IndustryDemoSeedResult = { clientes: clientesCreados, productos: productosCreados }

  if (template.id === "bar_restaurant" || rubro === "bar_restaurant") {
    const bar = await seedBarDemo(empresaId)
    result.mesas = bar.mesas
    result.comandas = bar.comandas
  }

  if (template.id === "gimnasio" || rubro === "gimnasio") {
    const gym = await seedGymDemo(empresaId)
    result.planes = gym.planes
    result.membresias = gym.membresias
  }

  if (template.id === "agro_cannabis" || rubro === "agro_cannabis") {
    result.cannabis = await seedCannabisDemo(empresaId)
  }

  if (template.id === "consorcios_admin") {
    await seedConsorciosDemo(empresaId)
  }

  if (
    template.id === "salon_belleza" ||
    template.id === "clinica" ||
    template.goldenPath === "/dashboard/agenda"
  ) {
    await seedAgendaDemo(empresaId, template)
  }

  if (template.engancheId?.startsWith("niche.")) {
    await seedNicheMovimientosDemo(empresaId, template.engancheId)
  }

  return result
}
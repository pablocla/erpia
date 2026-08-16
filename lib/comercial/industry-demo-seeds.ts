/**
 * Seeds de demo por industria — datos con nombre real, no "Cliente Test 1".
 */

import { prisma } from "@/lib/prisma"
import type { IndustryTemplate } from "@/lib/comercial/industry-templates"
import { getProductosSeed } from "@/lib/comercial/retail-onboarding-service"
import { OTService } from "@/lib/ot/ot-service"
import {
  generarConfiguracionOnboarding,
  type Rubro,
  type RespuestasOnboarding,
} from "@/lib/onboarding/onboarding-ia"

interface ClienteSeed {
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
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

const CLIENTES_POR_RUBRO: Partial<Record<string, ClienteSeed[]>> = {
  kiosco: [
    { nombre: "Juan Pérez — Fiado barrio", telefono: "11-4567-8901", deudaFiado: 8500, fiadoHabilitado: true, limiteCredito: 20000 },
    { nombre: "María del Valle", telefono: "11-2233-4455", deudaFiado: 3200, fiadoHabilitado: true, limiteCredito: 15000 },
    { nombre: "Don Carlos (almacén)", deudaFiado: 12000, fiadoHabilitado: true, limiteCredito: 25000 },
  ],
  carniceria: [
    { nombre: "Restaurante El Fuego — B2B", telefono: "11-3322-1100", deudaFiado: 45000, fiadoHabilitado: true, limiteCredito: 150000 },
    { nombre: "Doña Marta (vecina)", deudaFiado: 3500, fiadoHabilitado: true, limiteCredito: 10000 },
  ],
  panaderia: [
    { nombre: "Escuela San José (desayunos)", deudaFiado: 12500, fiadoHabilitado: true, limiteCredito: 50000 },
    { nombre: "Familia González", deudaFiado: 2100, fiadoHabilitado: true, limiteCredito: 5000 },
  ],
  veterinaria: [
    // Guion ASCII "-" (mismo string que seedVetDemo). No usar em-dash "—".
    { nombre: "María González - Tutora de Bobby", telefono: "11-5555-1234", email: "maria.gonzalez@email.com" },
    { nombre: "Lucas Fernández - Max (Labrador)", telefono: "11-4444-5678" },
  ],
  gimnasio: [
    { nombre: "Ana Martínez — Cuota Pilates", telefono: "11-3333-2211", saldoCuentaCorriente: -18500, observaciones: "Morosa — vence 15/03" },
    { nombre: "Diego López — Plan mensual", saldoCuentaCorriente: 0 },
    { nombre: "Sofía Ruiz — Trimestral", saldoCuentaCorriente: -9200, observaciones: "Débito fallido" },
    { nombre: "Carlos Pintos — Funcional", saldoCuentaCorriente: 0 },
    { nombre: "Valentina Soto — Pilates reformer", saldoCuentaCorriente: -14200, observaciones: "2 meses atrasada" },
  ],
  club_barrio: [
    { nombre: "Juan Pérez - Socio Activo", telefono: "11-5555-1234" },
    { nombre: "Familia Gómez - Grupo Familiar", telefono: "11-5555-9999" },
    { nombre: "Equipo Los Pumas - Torneo Amateur", telefono: "11-4000-1000", saldoCuentaCorriente: -35000, observaciones: "Suspendido — debe cancha" },
    { nombre: "Roberto Díaz - Moroso", telefono: "11-4222-3344", saldoCuentaCorriente: -12000, observaciones: "Cuota social vencida" },
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
  inmobiliaria: [
    { nombre: "Juan Inquilino", telefono: "11-2233-4455", observaciones: "Inquilino - depto Belgrano" },
    { nombre: "María Propietaria", telefono: "11-9988-7766", observaciones: "Dueña local comercial" },
  ],
  consorcios: [
    { nombre: "Consorcio Rivadavia 1200", observaciones: "Administración externa" },
    { nombre: "Residente 4B", telefono: "11-5566-7788", observaciones: "Expensas al día" },
  ],
  fumigacion: [
    {
      nombre: "Panadería La Espiga",
      telefono: "11-4788-2200",
      direccion: "Av. Cabildo 2100, CABA",
      observaciones: "Abono mensual cucarachas · acceso por lateral",
      saldoCuentaCorriente: -28000,
    },
    {
      nombre: "Edificio Rivadavia 4500 — Admin",
      telefono: "11-4900-1122",
      direccion: "Av. Rivadavia 4500, CABA",
      observaciones: "Contrato trimestral sótanos + basural",
    },
    {
      nombre: "Depósito Logística Sur SRL",
      telefono: "11-4001-8899",
      direccion: "Av. San Martín 3200, CABA",
      observaciones: "Roedores · visita quincenal",
      saldoCuentaCorriente: -65000,
    },
    {
      nombre: "Restaurant El Fogón",
      telefono: "11-4555-7788",
      direccion: "Av. Corrientes 1800, CABA",
      observaciones: "Cocina + depósito — preferencia 6–8 hs",
    },
    {
      nombre: "Colegio San Martín",
      telefono: "11-4666-3344",
      direccion: "Av. Santa Fe 2800, CABA",
      observaciones: "Certificado para inspección municipal",
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

async function ensureClienteDemo(
  empresaId: number,
  nombre: string,
  extra?: { telefono?: string; observaciones?: string; saldoCuentaCorriente?: number },
) {
  let cliente = await findClienteBySeedNombre(empresaId, nombre)
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        empresaId,
        nombre,
        telefono: extra?.telefono ?? null,
        observaciones: extra?.observaciones ?? null,
        saldoCuentaCorriente: extra?.saldoCuentaCorriente ?? 0,
        condicionIva: "Consumidor Final",
        activo: true,
      },
    })
  }
  return cliente
}

async function seedGymDemo(empresaId: number): Promise<{ planes: number; membresias: number }> {
  // Limpiar posible plan espurio inyectado por niche-provision (engine cuotas)
  await prisma.planMembresia.deleteMany({
    where: { empresaId, nombre: { in: ["Claver Gimnasio", "Claver Club", "Gimnasio"] } },
  })

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
        data: {
          empresaId,
          nombre: p.nombre,
          precio: p.precio,
          periodicidad: p.periodicidad,
          duracionDias: p.duracionDias,
        },
      })
      planesCreados++
    }
    planes.push({ id: plan.id, nombre: plan.nombre, duracionDias: plan.duracionDias })
  }

  // Nombres alineados a CLIENTES_POR_RUBRO.gimnasio (match resiliente a guiones)
  const socios = [
    {
      clienteNombre: "Ana Martínez — Cuota Pilates",
      planNombre: "Pilates reformer",
      estado: "suspendida",
      diasAtras: 45,
      telefono: "11-3333-2211",
    },
    {
      clienteNombre: "Diego López — Plan mensual",
      planNombre: "Plan mensual",
      estado: "activa",
      diasAtras: 0,
    },
    {
      clienteNombre: "Sofía Ruiz — Trimestral",
      planNombre: "Trimestral",
      estado: "vencida",
      diasAtras: 12,
    },
    {
      clienteNombre: "Valentina Soto — Pilates reformer",
      planNombre: "Pilates reformer",
      estado: "vencida",
      diasAtras: 60,
    },
    // Antes quedaba sin membresía (auditoría wow roto)
    {
      clienteNombre: "Carlos Pintos — Funcional",
      planNombre: "Plan mensual",
      estado: "activa",
      diasAtras: 5,
    },
  ]

  let membresiasCreadas = 0
  const hoy = new Date()
  for (const s of socios) {
    const cliente = await ensureClienteDemo(empresaId, s.clienteNombre, {
      telefono: s.telefono,
      observaciones: s.estado !== "activa" ? "Demo gym — moroso / reclamable" : undefined,
      saldoCuentaCorriente: s.estado === "vencida" || s.estado === "suspendida" ? -15000 : 0,
    })
    const plan = planes.find((p) => p.nombre === s.planNombre)
    if (!plan) continue

    const existe = await prisma.membresia.findFirst({
      where: { clienteId: cliente.id, planId: plan.id },
    })
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
        notas: s.estado !== "activa" ? "Demo — moroso (wow: reclamá por WA)" : "Demo — al día",
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

async function seedInmobiliariaDemo(empresaId: number): Promise<void> {
  let propietario = await prisma.cliente.findFirst({
    where: { empresaId, nombre: "Propietario Demo — García" },
  })
  if (!propietario) {
    propietario = await prisma.cliente.create({
      data: {
        empresaId,
        nombre: "Propietario Demo — García",
        telefono: "11-5555-1000",
        condicionIva: "Responsable Inscripto",
        activo: true,
      },
    })
  }

  let inquilino = await prisma.cliente.findFirst({
    where: { empresaId, nombre: "Inquilino Demo — Martínez" },
  })
  if (!inquilino) {
    inquilino = await prisma.cliente.create({
      data: {
        empresaId,
        nombre: "Inquilino Demo — Martínez",
        telefono: "11-5555-2000",
        condicionIva: "Consumidor Final",
        activo: true,
      },
    })
  }

  let prop = await prisma.propiedad.findFirst({
    where: { empresaId, titulo: "Depto 2 amb. — Corrientes 2500" },
  })
  if (!prop) {
    prop = await prisma.propiedad.create({
      data: {
        empresaId,
        titulo: "Depto 2 amb. — Corrientes 2500",
        direccion: "Av. Corrientes 2500 4° B, CABA",
        tipo: "depto",
        ambientes: 2,
        m2: 48,
        precioAlquiler: 450000,
        estado: "disponible",
        propietarioId: propietario.id,
      },
    })
  }

  const libre = await prisma.propiedad.findFirst({
    where: { empresaId, titulo: "Monoambiente — Scalabrini 800" },
  })
  if (!libre) {
    await prisma.propiedad.create({
      data: {
        empresaId,
        titulo: "Monoambiente — Scalabrini 800",
        direccion: "Scalabrini Ortiz 800 1° A, CABA",
        tipo: "depto",
        ambientes: 1,
        m2: 32,
        precioAlquiler: 320000,
        estado: "disponible",
        propietarioId: propietario.id,
      },
    })
  }

  const contratoActivo = await prisma.contratoAlquiler.findFirst({
    where: { empresaId, propiedadId: prop.id, estado: "activo" },
  })
  if (!contratoActivo && prop.estado !== "alquilada") {
    const inicio = new Date()
    inicio.setMonth(inicio.getMonth() - 2)
    const fin = new Date()
    fin.setMonth(fin.getMonth() + 10)
    await prisma.$transaction(async (tx) => {
      await tx.contratoAlquiler.create({
        data: {
          empresaId,
          propiedadId: prop!.id,
          inquilinoId: inquilino!.id,
          propietarioId: propietario!.id,
          montoMensual: 450000,
          diaVencimiento: 10,
          fechaInicio: inicio,
          fechaFin: fin,
          estado: "activo",
        },
      })
      await tx.propiedad.update({
        where: { id: prop!.id },
        data: { estado: "alquilada" },
      })
    })
  }
}

/** Unifica em-dash/en-dash/guion para match de seeds (Gemini + legacy). */
function normalizeSeedNombre(s: string): string {
  return s
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

async function findClienteBySeedNombre(empresaId: number, nombre: string) {
  const exact = await prisma.cliente.findFirst({
    where: { empresaId, nombre },
  })
  if (exact) return exact

  const target = normalizeSeedNombre(nombre)
  const candidatos = await prisma.cliente.findMany({
    where: { empresaId, activo: true },
    select: { id: true, nombre: true, empresaId: true },
    take: 80,
  })
  const hit = candidatos.find((c) => normalizeSeedNombre(c.nombre) === target)
  if (!hit) return null
  return prisma.cliente.findUnique({ where: { id: hit.id } })
}

async function seedVetDemo(empresaId: number): Promise<void> {
  const tutores = [
    {
      nombreCliente: "María González - Tutora de Bobby",
      nombrePaciente: "Bobby",
      especie: "Canino",
      raza: "Mestizo",
      sexo: "M",
      peso: 15.5,
    },
    {
      nombreCliente: "Lucas Fernández - Max (Labrador)",
      nombrePaciente: "Max",
      especie: "Canino",
      raza: "Labrador Retriever",
      sexo: "M",
      peso: 28,
    },
  ]

  for (const t of tutores) {
    let cliente = await findClienteBySeedNombre(empresaId, t.nombreCliente)
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          empresaId,
          nombre: t.nombreCliente,
          condicionIva: "Consumidor Final",
          activo: true,
        },
      })
    }

    const pacienteExiste = await prisma.paciente.findFirst({
      where: { clienteId: cliente.id, nombre: t.nombrePaciente },
    })

    if (!pacienteExiste) {
      const paciente = await prisma.paciente.create({
        data: {
          clienteId: cliente.id,
          nombre: t.nombrePaciente,
          especie: t.especie,
          raza: t.raza,
          sexo: t.sexo,
          peso: t.peso,
          fechaNac: new Date("2020-01-01"),
          activo: true,
        },
      })

      await prisma.consulta.create({
        data: {
          pacienteId: paciente.id,
          motivo: "Control anual y vacunación",
          diagnostico: "Paciente sano. Se aplica vacuna séxtuple.",
          tratamiento: "Vacuna séxtuple + desparasitación",
          peso: t.peso,
          temperatura: 38.5,
          fecha: new Date(),
          proximaVisita: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
  "niche.taller_mecanico": [
    { titulo: "Reparación motor - Ford Ranger", categoria: "reparacion", monto: 450000, estado: "pendiente" },
    { titulo: "Cambio de aceite y filtros - Gol Trend", categoria: "mantenimiento", monto: 85000, estado: "pagado" },
  ],
  "niche.club_barrio": [
    { titulo: "Cuota Social - Juan Pérez", categoria: "cuota", monto: 12000, estado: "pagado" },
    { titulo: "Alquiler Cancha 1 - Turno Noche", categoria: "alquiler", monto: 35000, estado: "pendiente" },
    { titulo: "Cuota impaga - Roberto Díaz", categoria: "cuota", monto: 12000, estado: "pendiente" },
    { titulo: "Consumo cantina - Los Pumas", categoria: "consumo", monto: 18500, estado: "pendiente" },
  ],
}

/** Clientes demo por SKU de nicho (una sola clave por app — no duplicar keys JS). */
const NICHE_CUOTA_CLIENTES: Record<string, { nombre: string; telefono?: string }[]> = {
  "niche.taller_mecanico": [
    { nombre: "Carlos Silva - Ford Ranger", telefono: "11-5555-4444" },
    { nombre: "María Gómez - Gol Trend", telefono: "11-4444-3333" },
    { nombre: "Empresa Logística Sur (Flota Ford)", telefono: "11-9988-7766" },
  ],
  "niche.gimnasio_barrio": [
    { nombre: "Ana Martínez — Cuota Pilates", telefono: "11-3333-2211" },
    { nombre: "Diego López — Plan mensual" },
    { nombre: "Sofía Ruiz — Trimestral", telefono: "11-2222-3344" },
  ],
  "niche.club_barrio": [
    { nombre: "Juan Pérez - Socio Activo", telefono: "11-5555-1234" },
    { nombre: "Equipo Los Pumas - Torneo Amateur", telefono: "11-4000-1000" },
    { nombre: "Roberto Díaz - Moroso", telefono: "11-4222-3344" },
    { nombre: "Familia Gómez - Grupo Familiar", telefono: "11-5555-9999" },
  ],
}

/**
 * Club de barrio — demo con socios, planes, morosos y consumo cantina.
 * (Fase 3: fuera del alcance Gemini vet/taller.)
 */
async function seedClubDemo(empresaId: number): Promise<{ planes: number; membresias: number }> {
  // Limpiar posible plan espurio inyectado por niche-provision (engine cuotas)
  await prisma.planMembresia.deleteMany({
    where: { empresaId, nombre: { in: ["Claver Gimnasio", "Claver Club", "Gimnasio"] } },
  })

  const planDefs = [
    { nombre: "Socio Activo Mensual", precio: 12000, periodicidad: "mensual", duracionDias: 30 },
    { nombre: "Grupo Familiar", precio: 35000, periodicidad: "mensual", duracionDias: 30 },
    { nombre: "Vitalicio honorario", precio: 0, periodicidad: "anual", duracionDias: 365 },
  ]

  let planesCreados = 0
  const planes: { id: number; nombre: string; duracionDias: number }[] = []
  for (const p of planDefs) {
    let plan = await prisma.planMembresia.findFirst({ where: { empresaId, nombre: p.nombre } })
    if (!plan) {
      plan = await prisma.planMembresia.create({
        data: {
          empresaId,
          nombre: p.nombre,
          precio: p.precio,
          periodicidad: p.periodicidad,
          duracionDias: p.duracionDias,
          descripcion: "Demo club de barrio",
        },
      })
      planesCreados++
    }
    planes.push({ id: plan.id, nombre: plan.nombre, duracionDias: plan.duracionDias })
  }

  const socios = [
    {
      nombre: "Juan Pérez - Socio Activo",
      plan: "Socio Activo Mensual",
      estado: "activa",
      diasAtras: 0,
      telefono: "11-5555-1234",
    },
    {
      nombre: "Familia Gómez - Grupo Familiar",
      plan: "Grupo Familiar",
      estado: "activa",
      diasAtras: 3,
      telefono: "11-5555-9999",
    },
    {
      nombre: "Equipo Los Pumas - Torneo Amateur",
      plan: "Grupo Familiar",
      estado: "suspendida",
      diasAtras: 40,
      telefono: "11-4000-1000",
    },
    {
      nombre: "Roberto Díaz - Moroso",
      plan: "Socio Activo Mensual",
      estado: "vencida",
      diasAtras: 25,
      telefono: "11-4222-3344",
    },
  ]

  let membresiasCreadas = 0
  const hoy = new Date()
  for (const s of socios) {
    const cliente = await ensureClienteDemo(empresaId, s.nombre, {
      telefono: s.telefono,
      observaciones:
        s.estado === "vencida" || s.estado === "suspendida"
          ? "Demo club — moroso (avisar por WA antes del partido)"
          : "Demo club — al día",
      saldoCuentaCorriente: s.estado === "vencida" ? -12000 : s.estado === "suspendida" ? -35000 : 0,
    })
    const plan = planes.find((p) => p.nombre === s.plan)
    if (!plan) continue

    const existe = await prisma.membresia.findFirst({
      where: { clienteId: cliente.id, planId: plan.id },
    })
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
        notas: s.estado !== "activa" ? "Demo — cuota impaga" : null,
      },
    })
    membresiasCreadas++
  }

  // Productos “cantina del club” (no PRD001)
  const cantina = [
    { codigo: "CLUB-CERV", nombre: "Cerveza cantina", precio: 2500 },
    { codigo: "CLUB-EMPE", nombre: "Empanada cantina", precio: 800 },
    { codigo: "CLUB-ALQ", nombre: "Alquiler cancha 1h", precio: 15000 },
  ]
  for (const p of cantina) {
    const ex = await prisma.producto.findFirst({ where: { empresaId, codigo: p.codigo } })
    if (!ex) {
      await prisma.producto.create({
        data: {
          empresaId,
          codigo: p.codigo,
          nombre: p.nombre,
          precioVenta: p.precio,
          porcentajeIva: 21,
          stock: 50,
          activo: true,
          unidad: "unidad",
        },
      })
    }
  }

  return { planes: planesCreados, membresias: membresiasCreadas }
}

async function seedPresupuestoDemo(empresaId: number): Promise<void> {
  const existe = await prisma.presupuesto.findFirst({
    where: { empresaId, numero: "PRES-DEMO-001" },
  })
  if (existe) return

  let cliente = await prisma.cliente.findFirst({
    where: { empresaId, nombre: "Cliente Demo — Servicios" },
  })
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        empresaId,
        nombre: "Cliente Demo — Servicios",
        telefono: "11-5555-0100",
        condicionIva: "Consumidor Final",
        activo: true,
      },
    })
  }

  const subtotal = 185000
  await prisma.presupuesto.create({
    data: {
      empresaId,
      clienteId: cliente.id,
      numero: "PRES-DEMO-001",
      fechaEmision: new Date(),
      subtotal,
      total: subtotal,
      estado: "enviado",
      observaciones: "Demo monotributo / servicios — instalación y mano de obra",
    },
  })
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
  opts?: { skipProductos?: boolean },
): Promise<IndustryDemoSeedResult> {
  const rubro = template.rubro
  let productosCreados = 0
  let clientesCreados = 0

  if (!opts?.skipProductos) {
    const hasRetailSeed = ["almacen", "kiosco", "ferreteria", "carniceria", "panaderia"].includes(
      template.id,
    )
    const retailSeedKey = hasRetailSeed ? template.id : "almacen"

    // Catálogo por template.id (taller usa rubro "otro" → sin esto cae en PRD001/SRV001).
    // No pasar template.id a defaultAnswers: no es Rubro y rompe CONFIG_POR_RUBRO.
    const PRODUCTOS_POR_TEMPLATE: Record<
      string,
      { nombre: string; codigo: string; precio: number; iva: number }[]
    > = {
      taller_mecanico: [
        { nombre: "Aceite Sintético 5W40 4L", codigo: "TM-ACT01", precio: 45000, iva: 21 },
        { nombre: "Filtro de Aceite", codigo: "TM-FLT01", precio: 8500, iva: 21 },
        { nombre: "Juego Pastillas de Freno", codigo: "TM-FRN01", precio: 28000, iva: 21 },
        { nombre: "Service Básico 10.000 km (Mano de Obra)", codigo: "TM-SRV01", precio: 35000, iva: 21 },
        { nombre: "Bujías iridium (juego x4)", codigo: "TM-BUJ01", precio: 22000, iva: 21 },
      ],
      club_barrio: [
        { nombre: "Cuota social mensual", codigo: "CLUB-CUO", precio: 12000, iva: 21 },
        { nombre: "Alquiler cancha 1 hora", codigo: "CLUB-ALQ", precio: 15000, iva: 21 },
        { nombre: "Cerveza cantina", codigo: "CLUB-CERV", precio: 2500, iva: 21 },
        { nombre: "Empanada cantina", codigo: "CLUB-EMPE", precio: 800, iva: 21 },
      ],
    }

    const productos =
      template.isRetail && hasRetailSeed
        ? getProductosSeed(retailSeedKey)
        : PRODUCTOS_POR_TEMPLATE[template.id] ??
          generarConfiguracionOnboarding(defaultAnswers(rubro)).productosEjemplo

    for (const [index, p] of productos.entries()) {
      const codigo =
        "codigo" in p && p.codigo
          ? String(p.codigo)
          : `DEMO-${template.id.toUpperCase().slice(0, 6)}-${index + 1}`
      const nombre = p.nombre
      const precio = "precioVenta" in p ? (p as { precioVenta: number }).precioVenta : p.precio
      const iva =
        "porcentajeIva" in p
          ? ((p as { porcentajeIva?: number }).porcentajeIva ?? 21)
          : "iva" in p
            ? ((p as { iva?: number }).iva ?? 21)
            : 21

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
  }

  const clientes = CLIENTES_POR_RUBRO[template.id] ?? CLIENTES_POR_RUBRO[rubro] ?? []
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
          direccion: c.direccion ?? null,
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

  try {
    await enableFiadoDemo(empresaId, template)
  } catch (err) {
    console.warn(`[industry-demo-seeds] enableFiadoDemo:`, err)
  }

  const result: IndustryDemoSeedResult = { clientes: clientesCreados, productos: productosCreados }

  async function safe(label: string, fn: () => Promise<void>) {
    try {
      await fn()
    } catch (err) {
      console.warn(`[industry-demo-seeds] ${label}:`, err)
    }
  }

  if (template.id === "bar_restaurant" || rubro === "bar_restaurant") {
    await safe("bar", async () => {
      const bar = await seedBarDemo(empresaId)
      result.mesas = bar.mesas
      result.comandas = bar.comandas
    })
  }

  if (template.id === "veterinaria" || rubro === "veterinaria") {
    await safe("vet", () => seedVetDemo(empresaId))
  }

  if (
    template.id === "gimnasio" ||
    template.id === "gimnasio_barrio" ||
    rubro === "gimnasio"
  ) {
    await safe("gym", async () => {
      const gym = await seedGymDemo(empresaId)
      result.planes = gym.planes
      result.membresias = gym.membresias
    })
  }

  if (template.id === "agro_cannabis" || rubro === "agro_cannabis") {
    await safe("cannabis", async () => {
      result.cannabis = await seedCannabisDemo(empresaId)
    })
  }

  if (template.id === "consorcios_admin" || template.id === "inmobiliaria") {
    await safe("consorcios", () => seedConsorciosDemo(empresaId))
  }

  if (template.id === "inmobiliaria") {
    await safe("inmobiliaria", async () => {
      await seedInmobiliariaDemo(empresaId)
      await seedNicheMovimientosDemo(empresaId, "niche.inmo_garantia")
    })
  }

  if (template.id === "freelance_mt" || template.id === "servicios_pro") {
    await safe("presupuesto", () => seedPresupuestoDemo(empresaId))
  }

  if (template.id === "contratista_obra") {
    await safe("obra", () => seedNicheMovimientosDemo(empresaId, "niche.obra_changas"))
  }

  if (
    template.id === "salon_belleza" ||
    template.id === "clinica" ||
    template.id === "servicios_pro" ||
    template.goldenPath === "/dashboard/agenda"
  ) {
    await safe("agenda", () => seedAgendaDemo(empresaId, template))
  }

  if (template.id === "club_barrio") {
    await safe("club", async () => {
      const club = await seedClubDemo(empresaId)
      result.planes = (result.planes ?? 0) + club.planes
      result.membresias = (result.membresias ?? 0) + club.membresias
    })
  }

  // Movimientos de nicho DESPUÉS de socios/clientes para poder linkear clienteId
  if (template.id === "oficios" || template.engancheId === "niche.oficios") {
    await safe("oficios:obras", () => seedOficiosDemo(empresaId))
  } else if (template.engancheId === "niche.taller_mecanico") {
    await safe("ot:taller_mecanico", () => seedTallerMecanicoOTDemo(empresaId))
  } else if (template.engancheId === "niche.fumigacion" || template.id === "fumigacion") {
    await safe("ot:fumigacion", () => seedFumigacionOTDemo(empresaId))
  } else if (template.engancheId?.startsWith("niche.")) {
    await safe(`niche:${template.engancheId}`, () =>
      seedNicheMovimientosDemo(empresaId, template.engancheId!),
    )
  }

  if (template.id === "fumigacion" && template.engancheId !== "niche.fumigacion") {
    await safe("ot:fumigacion", () => seedFumigacionOTDemo(empresaId))
  }

  return result
}

async function seedFumigacionOTDemo(empresaId: number) {
  const service = new OTService()
  const hoy = new Date()
  hoy.setHours(12, 0, 0, 0)

  const clientes = await prisma.cliente.findMany({
    where: { empresaId, activo: true, nombre: { not: { contains: "Consumidor Final" } } },
    take: 5,
    orderBy: { id: "asc" },
  })
  if (!clientes.length) return

  const planes: Array<{
    cliente: (typeof clientes)[0]
    titulo: string
    plaga: string
    tipoServicio: string
    sitio: string
    precio: number
    tecnico: string
  }> = [
    {
      cliente: clientes[0],
      titulo: "Cocina + depósito — abono mensual",
      plaga: "cucarachas",
      tipoServicio: "mantenimiento",
      sitio: "Cocina y depósito",
      precio: 42000,
      tecnico: "Diego Ruta Norte",
    },
    {
      cliente: clientes[1] ?? clientes[0],
      titulo: "Sótanos y basural — contrato",
      plaga: "roedores",
      tipoServicio: "tratamiento",
      sitio: "Sótanos A/B",
      precio: 85000,
      tecnico: "Diego Ruta Norte",
    },
    {
      cliente: clientes[2] ?? clientes[0],
      titulo: "Depósito logístico — quincenal",
      plaga: "roedores",
      tipoServicio: "mantenimiento",
      sitio: "Nave 2",
      precio: 65000,
      tecnico: "Laura Zona Oeste",
    },
    {
      cliente: clientes[3] ?? clientes[0],
      titulo: "Cocina restaurante — urgencia",
      plaga: "cucarachas",
      tipoServicio: "urgencia",
      sitio: "Cocina",
      precio: 55000,
      tecnico: "Diego Ruta Norte",
    },
  ]

  for (let i = 0; i < planes.length; i++) {
    const p = planes[i]
    const existe = await prisma.ordenServicio.findFirst({
      where: { empresaId, titulo: p.titulo, clienteId: p.cliente.id },
    })
    if (existe) continue

    await service.crearOrden(empresaId, {
      clienteId: p.cliente.id,
      titulo: p.titulo,
      descripcion: p.cliente.observaciones ?? undefined,
      fechaPrometida: hoy,
      tecnicoAsignado: p.tecnico,
      metadata: {
        vertical: "fumigacion",
        plaga: p.plaga,
        tipoServicio: p.tipoServicio,
        sitio: p.sitio,
        direccionSitio: p.cliente.direccion ?? undefined,
      },
      items: [
        {
          descripcion: `Tratamiento ${p.plaga} · ${p.sitio}`,
          cantidad: 1,
          precioUnitario: p.precio,
          tipo: "MANO_OBRA",
        },
      ],
    })
  }

  // Insumos tipicos
  const insumos = [
    { codigo: "FUM-GEL-01", nombre: "Gel cucarachicida 30g", precio: 12500 },
    { codigo: "FUM-CEBO-01", nombre: "Cebo roedores bloque", precio: 8900 },
    { codigo: "FUM-VIS-01", nombre: "Visita mantenimiento plagas", precio: 45000 },
  ]
  for (const ins of insumos) {
    const ex = await prisma.producto.findFirst({ where: { empresaId, codigo: ins.codigo } })
    if (ex) continue
    await prisma.producto.create({
      data: {
        empresaId,
        codigo: ins.codigo,
        nombre: ins.nombre,
        precioVenta: ins.precio,
        porcentajeIva: 21,
        activo: true,
        stock: 40,
        unidad: "unidad",
        tipoProducto: ins.codigo.startsWith("FUM-VIS") ? "servicio" : "bien",
      },
    })
  }
}

async function seedTallerMecanicoOTDemo(empresaId: number) {
  const service = new OTService()
  
  // Buscar clientes creados por los seeds
  const c1 = await prisma.cliente.findFirst({ where: { empresaId, nombre: { contains: "Carlos Silva" } } })
  const c2 = await prisma.cliente.findFirst({ where: { empresaId, nombre: { contains: "Gómez" } } })
  const c3 = await prisma.cliente.findFirst({ where: { empresaId, nombre: { contains: "Logística" } } })

  // Buscar repuestos creados por los seeds
  const aceite = await prisma.producto.findFirst({ where: { empresaId, codigo: "TM-ACT01" } })
  const filtro = await prisma.producto.findFirst({ where: { empresaId, codigo: "TM-FLT01" } })
  
  if (c1) {
    await service.crearOrden(empresaId, {
      clienteId: c1.id,
      numero: "OT-0001",
      titulo: "Reparación motor - Ford Ranger",
      estado: "PENDIENTE",
      metadata: { patente: "AD123ZZ", vehiculo: "Ford Ranger 2022", km: 45000 },
      items: [
        { descripcion: "Mano de obra diagnóstico", cantidad: 1, precioUnitario: 35000, tipo: "MANO_OBRA" }
      ]
    })
  }

  if (c2) {
    await service.crearOrden(empresaId, {
      clienteId: c2.id,
      numero: "OT-0002",
      titulo: "Cambio de aceite y filtros - Gol Trend",
      estado: "LISTO",
      metadata: { patente: "AA999BB", vehiculo: "VW Gol Trend 2018", km: 80000 },
      items: [
        { productoId: aceite?.id, descripcion: "Aceite Sintético 5W40", cantidad: 1, precioUnitario: 45000, tipo: "REPUESTO" },
        { productoId: filtro?.id, descripcion: "Filtro de Aceite", cantidad: 1, precioUnitario: 8500, tipo: "REPUESTO" },
        { descripcion: "Mano de obra service", cantidad: 1, precioUnitario: 15000, tipo: "MANO_OBRA" }
      ]
    })
  }
}

async function seedOficiosDemo(empresaId: number) {
  // 1. Crear operarios de cuadrilla
  const op1 = await prisma.oficioOperario.upsert({
    where: { id: 1 },
    update: {},
    create: {
      empresaId,
      nombre: "Carlos Gómez",
      telefono: "11-4567-8901",
      especialidad: "Oficial Gasista Matriculado",
      costoJornal: 45000,
      activo: true,
    },
  }).catch(() => null)

  const op2 = await prisma.oficioOperario.upsert({
    where: { id: 2 },
    update: {},
    create: {
      empresaId,
      nombre: "Mateo Rossi",
      telefono: "11-9876-5432",
      especialidad: "Ayudante Albañil",
      costoJornal: 30000,
      activo: true,
    },
  }).catch(() => null)

  // 2. Crear clientes de obras
  const c1 = await prisma.cliente.create({
    data: {
      empresaId,
      nombre: "Arq. Valentina Rossi",
      telefono: "11-5555-8899",
      email: "valentina.rossi@estudio.com.ar",
      direccion: "Av. Libertador 4500, Belgrano, CABA",
      activo: true,
    },
  }).catch(() => null)

  const c2 = await prisma.cliente.create({
    data: {
      empresaId,
      nombre: "Dr. Esteban Benítez",
      telefono: "11-4433-2211",
      email: "drbenitez@gmail.com",
      direccion: "Calle 14 Nro 650, La Plata",
      activo: true,
    },
  }).catch(() => null)

  // 3. Crear Trabajos
  if (c1) {
    await prisma.oficioTrabajo.create({
      data: {
        empresaId,
        clienteId: c1.id,
        titulo: "Instalación Completa Cañería Termofusión y Griferías",
        descripcion: "Tendido de 25m caño IPS termofusión, colocación de griferías FV monocomando en baño principal y cocina.",
        direccion: c1.direccion,
        estado: "PRESUPUESTADO",
        tokenPublico: "demo-obra-plomeria",
        porcentajeSena: 30,
        montoEstimado: 450000,
        opcionesPresupuesto: [
          {
            nombre: "Opción Básica (Económica)",
            descripcion: "Cañería estándar + griferías nacionales línea básica.",
            total: 380000,
            items: [
              { concepto: "Mano de obra termofusión", subtotal: 250000 },
              { concepto: "Materiales estándar", subtotal: 130000 },
            ],
          },
          {
            nombre: "Opción Recomendada (IPS Fusión + FV)",
            descripcion: "Caños IPS con barrera antibacteriana y griferías FV con cierre cerámico.",
            total: 450000,
            recomendada: true,
            items: [
              { concepto: "Mano de obra termofusión", subtotal: 250000 },
              { concepto: "Cañerías IPS & Accesorios", subtotal: 200000 },
            ],
          },
          {
            nombre: "Opción Premium (Garantía Extendida 2 Años)",
            descripcion: "IPS Máxima Presión, pruebas hidráulicas con manómetro digital y garantía extendida.",
            total: 580000,
            items: [
              { concepto: "Mano de obra especializada", subtotal: 300000 },
              { concepto: "Materiales reforzados y válvulas", subtotal: 280000 },
            ],
          },
        ],
      },
    }).catch(() => null)
  }

  if (c2) {
    await prisma.oficioTrabajo.create({
      data: {
        empresaId,
        clienteId: c2.id,
        titulo: "Renovación Tablero Trifásico y Disyuntores Schneider",
        descripcion: "Montaje de caja tablero DIN 24 módulos, disyuntores bipolares y jabalina de puesta a tierra reglamentaria.",
        direccion: c2.direccion,
        estado: "EN_CURSO",
        tokenPublico: "demo-obra-electricidad",
        montoAcordado: 380000,
        porcentajeSena: 40,
        senaPagada: true,
        gastosMateriales: [
          { proveedor: "Electricidad Central", monto: 85000, comprobante: "FAC-B-0004-9876" },
          { proveedor: "Ferretería La Tuerca", monto: 14500, comprobante: "TICKET-4521" },
        ],
        fotosAntes: [
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80",
        ],
      },
    }).catch(() => null)
  }
}
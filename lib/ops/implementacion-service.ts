import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/email/email-service"
import { emailLayout } from "@/lib/email/email-templates"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import {
  buildFasesIniciales,
  calcularPorcentajeAvance,
  CCA_FASES,
  type CcaFaseCodigo,
  type FaseEstado,
  type FasesMap,
  generarCodigoProyecto,
  resolverFaseActual,
} from "@/lib/ops/implementacion-types"

function parseFases(raw: unknown): FasesMap {
  const base = buildFasesIniciales()
  if (!raw || typeof raw !== "object") return base
  const input = raw as Record<string, FaseEstado>
  for (const f of CCA_FASES) {
    if (input[f.codigo]) {
      base[f.codigo] = {
        completado: Boolean(input[f.codigo].completado),
        fecha: input[f.codigo].fecha ?? null,
        notas: input[f.codigo].notas ?? null,
        auto: input[f.codigo].auto,
      }
    }
  }
  return base
}

async function detectarSenalesAutomaticas(empresaId: number): Promise<Partial<FasesMap>> {
  const db = prisma as any
  const [entornos, onboardingParam, empresa] = await Promise.all([
    db.tenantEntorno.count({ where: { empresaId } }),
    db.parametroFiscal.findFirst({
      where: { empresaId, clave: "onboarding_completado" },
    }),
    db.empresa.findUnique({
      where: { id: empresaId },
      select: { entornoAfip: true },
    }),
  ])

  const senales: Partial<FasesMap> = {}

  if (entornos >= 3) {
    senales["CCA-030"] = {
      completado: true,
      fecha: new Date().toISOString(),
      notas: "Entornos dev/val/prd detectados",
      auto: true,
    }
  }

  if (onboardingParam && Number(onboardingParam.valor) === 1) {
    senales["CCA-040"] = {
      completado: true,
      fecha: new Date().toISOString(),
      notas: "Wizard onboarding aplicado en tenant",
      auto: true,
    }
  }

  if (empresa?.entornoAfip === "produccion") {
    senales["CCA-070"] = {
      completado: true,
      fecha: new Date().toISOString(),
      notas: "Entorno AFIP en producción",
      auto: true,
    }
  }

  return senales
}

function mergeFasesConSenales(fases: FasesMap, senales: Partial<FasesMap>): FasesMap {
  const merged = { ...fases }
  for (const [codigo, estado] of Object.entries(senales)) {
    const key = codigo as CcaFaseCodigo
    if (!merged[key]?.completado && estado) {
      merged[key] = { ...merged[key], ...estado, completado: true }
    }
  }
  return merged
}

function enrichProyecto<T extends { fases: unknown; empresaId: number }>(
  row: T,
  senales: Partial<FasesMap>,
) {
  const fases = mergeFasesConSenales(parseFases(row.fases), senales)
  const porcentajeAvance = calcularPorcentajeAvance(fases)
  const faseActual = resolverFaseActual(fases)
  return { ...row, fases, porcentajeAvance, faseActual }
}

export async function listProyectosImplementacion(opts: {
  empresaIds?: number[]
  estado?: string
  fase?: string
}) {
  const db = prisma as any
  const where: Record<string, unknown> = {}
  if (opts.empresaIds?.length) where.empresaId = { in: opts.empresaIds }
  if (opts.estado) where.estado = opts.estado
  if (opts.fase) where.faseActual = opts.fase

  const rows = await db.proyectoImplementacion.findMany({
    where,
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          rubro: true,
          entornoAfip: true,
          planHosting: true,
        },
      },
    },
    orderBy: [{ fechaObjetivoGoLive: "asc" }, { updatedAt: "desc" }],
  })

  return Promise.all(
    rows.map(async (row: { empresaId: number; fases: unknown; [key: string]: any }) => {
      const senales = await detectarSenalesAutomaticas(row.empresaId)
      return enrichProyecto(row, senales)
    }),
  )
}

export async function getProyectoImplementacion(id: number) {
  const db = prisma as any
  const row = await db.proyectoImplementacion.findUnique({
    where: { id },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          rubro: true,
          cuit: true,
          entornoAfip: true,
          planHosting: true,
        },
      },
    },
  })
  if (!row) return null
  const senales = await detectarSenalesAutomaticas(row.empresaId)
  return enrichProyecto(row, senales)
}

export async function getProyectoPorEmpresa(empresaId: number) {
  const db = prisma as any
  const row = await db.proyectoImplementacion.findUnique({
    where: { empresaId },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          razonSocial: true,
          rubro: true,
          cuit: true,
          entornoAfip: true,
          planHosting: true,
        },
      },
    },
  })
  if (!row) return null
  const senales = await detectarSenalesAutomaticas(empresaId)
  return enrichProyecto(row, senales)
}

export async function crearProyectoImplementacion(input: {
  empresaId: number
  analistaEmail: string
  planComercial?: string
  fechaVenta?: Date
  fechaKickoff?: Date
  fechaObjetivoGoLive?: Date
  urlAcceso?: string
  notas?: string
}) {
  const db = prisma as any

  const existente = await db.proyectoImplementacion.findUnique({
    where: { empresaId: input.empresaId },
  })
  if (existente && existente.estado === "activo") {
    throw new Error("Ya existe un proyecto de implementación activo para este cliente")
  }

  const entornos = await ensureTenantEntornos(input.empresaId)
  const prd = entornos.find((e: { codigo: string }) => e.codigo === "prd")
  const urlAcceso =
    input.urlAcceso ??
    prd?.urlBase ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"

  const fases = buildFasesIniciales()
  fases["CCA-010"] = {
    completado: true,
    fecha: (input.fechaVenta ?? new Date()).toISOString(),
    notas: "Proyecto creado desde Claver Cloud",
  }

  const proyecto = await db.proyectoImplementacion.create({
    data: {
      codigo: generarCodigoProyecto(input.empresaId),
      empresaId: input.empresaId,
      analistaEmail: input.analistaEmail.toLowerCase(),
      planComercial: input.planComercial,
      fechaVenta: input.fechaVenta ?? new Date(),
      fechaKickoff: input.fechaKickoff,
      fechaObjetivoGoLive: input.fechaObjetivoGoLive,
      urlAcceso,
      notas: input.notas,
      faseActual: "CCA-020",
      porcentajeAvance: calcularPorcentajeAvance(fases),
      fases,
      packOnboardEntregado: false,
    },
    include: {
      empresa: { select: { id: true, nombre: true, razonSocial: true, rubro: true } },
    },
  })

  await persistSistemaLog({
    empresaId: input.empresaId,
    categoria: "implementacion",
    contexto: "cca-onboarding",
    severidad: "info",
    mensaje: `Proyecto ${proyecto.codigo} iniciado — fase CCA-020`,
    metadata: { proyectoId: proyecto.id, analista: input.analistaEmail },
  })

  return proyecto
}

export async function actualizarProyectoImplementacion(
  id: number,
  data: {
    planComercial?: string
    analistaEmail?: string
    fechaKickoff?: Date | null
    fechaObjetivoGoLive?: Date | null
    fechaGoLiveReal?: Date | null
    urlAcceso?: string
    packOnboardEntregado?: boolean
    notas?: string
    estado?: string
  },
) {
  const db = prisma as any
  return db.proyectoImplementacion.update({
    where: { id },
    data: {
      ...data,
      ...(data.analistaEmail && { analistaEmail: data.analistaEmail.toLowerCase() }),
    },
  })
}

export async function marcarFaseImplementacion(
  id: number,
  faseCodigo: CcaFaseCodigo,
  input: { completado: boolean; notas?: string },
  actorEmail: string,
) {
  const db = prisma as any
  const proyecto = await db.proyectoImplementacion.findUnique({ where: { id } })
  if (!proyecto) throw new Error("Proyecto no encontrado")

  const fases = parseFases(proyecto.fases)
  fases[faseCodigo] = {
    completado: input.completado,
    fecha: input.completado ? new Date().toISOString() : null,
    notas: input.notas ?? fases[faseCodigo]?.notas ?? null,
    auto: false,
  }

  const porcentajeAvance = calcularPorcentajeAvance(fases)
  const faseActual = resolverFaseActual(fases)

  const update: Record<string, unknown> = {
    fases,
    porcentajeAvance,
    faseActual,
  }

  if (faseCodigo === "CCA-030" && input.completado) {
    update.packOnboardEntregado = true
    void enviarEmailPackOnboard(proyecto.empresaId, id).catch(() => {})
  }
  if (faseCodigo === "CCA-070" && input.completado) {
    update.fechaGoLiveReal = new Date()
  }
  if (faseCodigo === "CCA-080" && input.completado) {
    update.estado = "completado"
  }

  const updated = await db.proyectoImplementacion.update({
    where: { id },
    data: update,
    include: {
      empresa: { select: { id: true, nombre: true, razonSocial: true, rubro: true } },
    },
  })

  await persistSistemaLog({
    empresaId: proyecto.empresaId,
    categoria: "implementacion",
    contexto: "cca-onboarding",
    severidad: "info",
    mensaje: `Fase ${faseCodigo} ${input.completado ? "completada" : "reabierta"}`,
    metadata: { proyectoId: id, actor: actorEmail, notas: input.notas },
  })

  return enrichProyecto(updated, await detectarSenalesAutomaticas(proyecto.empresaId))
}

export async function getMetricasTorreImplementacion(empresaIds?: number[]) {
  const db = prisma as any
  const where: Record<string, unknown> = { estado: "activo" }
  if (empresaIds?.length) where.empresaId = { in: empresaIds }

  const [activos, atrasados, sinOnboard, porFase] = await Promise.all([
    db.proyectoImplementacion.count({ where }),
    db.proyectoImplementacion.count({
      where: {
        ...where,
        fechaObjetivoGoLive: { lt: new Date() },
        faseActual: { not: "CCA-080" },
      },
    }),
    db.proyectoImplementacion.count({
      where: { ...where, packOnboardEntregado: false },
    }),
    db.proyectoImplementacion.groupBy({
      by: ["faseActual"],
      where,
      _count: { id: true },
    }),
  ])

  const promedioAvance = await db.proyectoImplementacion.aggregate({
    where,
    _avg: { porcentajeAvance: true },
  })

  return {
    activos,
    atrasados,
    sinPackOnboard: sinOnboard,
    avancePromedio: Math.round(promedioAvance._avg.porcentajeAvance ?? 0),
    porFase: Object.fromEntries(
      porFase.map((p: { faseActual: string; _count: { id: number } }) => [
        p.faseActual,
        p._count.id,
      ]),
    ),
  }
}

export async function ensureProyectoImplementacion(input: {
  empresaId: number
  analistaEmail?: string
  planComercial?: string
}) {
  const db = prisma as any
  const existente = await db.proyectoImplementacion.findUnique({
    where: { empresaId: input.empresaId },
  })
  if (existente) return existente

  const email =
    input.analistaEmail ??
    process.env.CLAVER_ANALYST_EMAILS?.split(",")[0]?.trim() ??
    "sistema@claver.cloud"

  return crearProyectoImplementacion({
    empresaId: input.empresaId,
    analistaEmail: email,
    planComercial: input.planComercial ?? "Pro",
    notas: "Proyecto auto-creado al alta del tenant",
  })
}

async function enviarEmailPackOnboard(empresaId: number, proyectoId: number) {
  const db = prisma as any
  const [proyecto, admin] = await Promise.all([
    db.proyectoImplementacion.findUnique({
      where: { id: proyectoId },
      include: { empresa: { select: { nombre: true, email: true } } },
    }),
    db.usuario.findFirst({
      where: { empresaId, rol: { in: ["administrador", "admin", "dueno"] }, activo: true },
      select: { email: true, nombre: true },
      orderBy: { id: "asc" },
    }),
  ])
  if (!proyecto || !admin?.email) return

  const base = proyecto.urlAcceso ?? process.env.NEXT_PUBLIC_APP_URL ?? ""
  const html = emailLayout(`
    <h2 style="margin:0 0 12px;font-size:18px;">Tu entorno ${proyecto.empresa.nombre} está listo</h2>
    <p>Pack ONBOARD Claver Cloud — accedé al ERP con estos datos:</p>
    <ul>
      <li><strong>URL:</strong> <a href="${base}">${base}</a></li>
      <li><strong>Usuario:</strong> ${admin.email}</li>
      <li><strong>Proyecto:</strong> ${proyecto.codigo}</li>
    </ul>
    <p>Centro de capacitación: <a href="${base}/dashboard/capacitacion">${base}/dashboard/capacitacion</a></p>
  `, { preheader: "Pack ONBOARD Claver Cloud" })

  await emailService.enviar({
    to: admin.email,
    subject: `[Claver Cloud] Pack ONBOARD — ${proyecto.empresa.nombre}`,
    html,
    text: `URL: ${base}\nUsuario: ${admin.email}\nProyecto: ${proyecto.codigo}`,
  })
}

export async function listActasImplementacion(proyectoId: number) {
  const db = prisma as any
  return db.actaImplementacion.findMany({
    where: { proyectoId },
    orderBy: { createdAt: "desc" },
  })
}

export async function crearActaImplementacion(input: {
  proyectoId: number
  tipo: string
  titulo: string
  contenido?: string
  firmadoPor?: string
  firmadoCliente?: boolean
}) {
  const db = prisma as any
  const acta = await db.actaImplementacion.create({
    data: {
      proyectoId: input.proyectoId,
      tipo: input.tipo,
      titulo: input.titulo,
      contenido: input.contenido,
      firmadoPor: input.firmadoPor,
      firmadoCliente: input.firmadoCliente ?? false,
    },
  })

  const proyecto = await db.proyectoImplementacion.findUnique({
    where: { id: input.proyectoId },
    select: { empresaId: true },
  })
  if (proyecto) {
    await persistSistemaLog({
      empresaId: proyecto.empresaId,
      categoria: "implementacion",
      contexto: "cca-acta",
      severidad: "info",
      mensaje: `Acta registrada: ${input.tipo} — ${input.titulo}`,
      metadata: { actaId: acta.id, proyectoId: input.proyectoId },
    })
  }

  return acta
}

export async function getResumenImplementacionFlota(empresaId: number) {
  const db = prisma as any
  const proyecto = await db.proyectoImplementacion.findUnique({
    where: { empresaId },
    select: {
      id: true,
      codigo: true,
      faseActual: true,
      porcentajeAvance: true,
      packOnboardEntregado: true,
      fechaObjetivoGoLive: true,
      estado: true,
      fases: true,
    },
  })
  if (!proyecto) return null

  const senales = await detectarSenalesAutomaticas(empresaId)
  const fases = mergeFasesConSenales(parseFases(proyecto.fases), senales)
  const atrasado =
    proyecto.fechaObjetivoGoLive &&
    new Date(proyecto.fechaObjetivoGoLive) < new Date() &&
    proyecto.estado === "activo" &&
    proyecto.faseActual !== "CCA-080"

  return {
    ...proyecto,
    porcentajeAvance: calcularPorcentajeAvance(fases),
    atrasado: Boolean(atrasado),
  }
}
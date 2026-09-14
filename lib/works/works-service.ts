import { prisma } from "@/lib/prisma"
import type {
  WorksLeadFuente,
  WorksMilestoneEstado,
  WorksPartnerRubro,
  WorksProjectStatus,
  WorksSegment,
} from "@prisma/client"
import { Prisma } from "@prisma/client"
import { canTransition, type TransitionContext } from "@/lib/works/fsm"

const SEGMENTS = new Set<string>([
  "software",
  "energy",
  "infra",
  "blockchain",
  "petrol",
  "industry",
])

export function parseSegment(raw: unknown): WorksSegment {
  const s = String(raw ?? "").toLowerCase()
  if (!SEGMENTS.has(s)) throw new Error(`Segmento inválido: ${raw}`)
  return s as WorksSegment
}

export type CreateLeadInput = {
  segmento: WorksSegment | string
  fuente?: WorksLeadFuente | string
  nombre: string
  email?: string | null
  telefono?: string | null
  zona?: string | null
  payload?: Record<string, unknown> | null
  ownerAgent?: string
  titulo?: string
}

const DEFAULT_ENERGY_CHECKLIST = {
  alcanceKwZona: false,
  presupuestoSoftLink: false,
  senaRegistrada: false,
  partnerAsignado: false,
  clienteInformadoEpc: false,
  matriculaACargoEpc: false,
}

function defaultTitulo(segmento: WorksSegment, nombre: string, zona?: string | null) {
  const z = zona ? ` · ${zona}` : ""
  return `[${segmento}] ${nombre}${z}`
}

function defaultMilestones(
  montoPresupuesto?: number | null,
  montoSena?: number | null,
): Array<{ nombre: string; pct?: number; monto?: number }> {
  const sena = montoSena ?? (montoPresupuesto != null ? montoPresupuesto * 0.3 : null)
  return [
    { nombre: "Seña", pct: 30, monto: sena ?? undefined },
    { nombre: "Hito obra / entrega", pct: 70, monto: montoPresupuesto != null && sena != null ? montoPresupuesto - sena : undefined },
  ]
}

/** Server-side required fields (mirrors WorksLeadForm client gates). */
function assertCreateLeadRequired(input: CreateLeadInput, segmento: WorksSegment) {
  const email = String(input.email ?? "").trim()
  const telefono = String(input.telefono ?? "").trim()
  if (!email && !telefono) {
    throw new Error("email o teléfono es obligatorio")
  }

  const zona = String(input.zona ?? "").trim()
  const payload = (input.payload ?? {}) as Record<string, unknown>
  const kWpRaw = payload.kWp
  const kWp = typeof kWpRaw === "number" ? kWpRaw : Number(kWpRaw)

  // Energy/Infra: zona; Energy: kWp — harden beyond client-only
  const requireZona = segmento === "energy" || segmento === "infra"
  const requireKwp = segmento === "energy"

  if (requireZona && !zona) {
    throw new Error("zona es obligatoria")
  }
  if (requireKwp && (!Number.isFinite(kWp) || kWp < 0.1)) {
    throw new Error("kWp es obligatorio (mínimo 0.1)")
  }
}

/** Public + Cloud: create WorksLead + WorksProject(status=Lead) + default milestones */
export async function createWorksLead(input: CreateLeadInput) {
  const segmento = parseSegment(input.segmento)
  const nombre = String(input.nombre ?? "").trim()
  if (!nombre) throw new Error("nombre es obligatorio")

  assertCreateLeadRequired(input, segmento)

  const fuente = (input.fuente ?? "form") as WorksLeadFuente
  const titulo = input.titulo?.trim() || defaultTitulo(segmento, nombre, input.zona)
  const checklist =
    segmento === "energy"
      ? { ...DEFAULT_ENERGY_CHECKLIST, ...(input.payload?.kWp || input.payload?.zona || input.zona ? { alcanceKwZona: true } : {}) }
      : { ...DEFAULT_ENERGY_CHECKLIST }

  if (input.zona || (input.payload && (input.payload as any).kWp)) {
    ;(checklist as any).alcanceKwZona = true
  }

  return prisma.$transaction(async (tx) => {
    const project = await tx.worksProject.create({
      data: {
        segmento,
        status: "Lead",
        titulo,
        moneda: "USD",
        comisionPct: 20,
        checklist,
        notas: null,
      },
    })

    const lead = await tx.worksLead.create({
      data: {
        segmento,
        fuente,
        nombre,
        email: input.email?.trim() || null,
        telefono: input.telefono?.trim() || null,
        zona: input.zona?.trim() || null,
        payload: (input.payload as Prisma.InputJsonValue) ?? undefined,
        ownerAgent: input.ownerAgent ?? "comercial",
        proyectoId: project.id,
      },
    })

    const miles = defaultMilestones(null, null)
    await tx.worksMilestone.createMany({
      data: miles.map((m) => ({
        projectId: project.id,
        nombre: m.nombre,
        pct: m.pct != null ? new Prisma.Decimal(m.pct) : undefined,
        monto: m.monto != null ? new Prisma.Decimal(m.monto) : undefined,
        estado: "pendiente" as WorksMilestoneEstado,
      })),
    })

    // Stub Soft presupuesto/seña link (does not touch Soft CxC/MP)
    const presupuestoSoftUrl = `/dashboard/presupuestos?worksProjectId=${project.id}&segmento=${segmento}`
    const updated = await tx.worksProject.update({
      where: { id: project.id },
      data: { presupuestoSoftUrl },
      include: { milestones: true, partner: true },
    })

    return { lead, project: updated }
  })
}

export async function listWorksProjects(filters: {
  segmento?: string
  status?: string
  take?: number
}) {
  const where: Prisma.WorksProjectWhereInput = {}
  if (filters.segmento) where.segmento = parseSegment(filters.segmento)
  if (filters.status) where.status = filters.status as WorksProjectStatus

  return prisma.worksProject.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: filters.take ?? 100,
    include: {
      lead: true,
      partner: true,
      milestones: { orderBy: { createdAt: "asc" } },
    },
  })
}

export async function getWorksProject(id: string) {
  return prisma.worksProject.findUnique({
    where: { id },
    include: {
      lead: true,
      partner: true,
      milestones: { orderBy: { createdAt: "asc" } },
    },
  })
}

export async function updateWorksProject(
  id: string,
  data: {
    titulo?: string
    moneda?: string
    montoPresupuesto?: number | null
    montoSena?: number | null
    comisionPct?: number
    presupuestoSoftId?: number | null
    presupuestoSoftUrl?: string | null
    softTenantId?: number | null
    notas?: string | null
    checklist?: Record<string, unknown>
  },
) {
  const patch: Prisma.WorksProjectUpdateInput = {}
  if (data.titulo != null) patch.titulo = data.titulo
  if (data.moneda != null) patch.moneda = data.moneda
  if (data.montoPresupuesto !== undefined) {
    patch.montoPresupuesto =
      data.montoPresupuesto == null ? null : new Prisma.Decimal(data.montoPresupuesto)
  }
  if (data.montoSena !== undefined) {
    patch.montoSena = data.montoSena == null ? null : new Prisma.Decimal(data.montoSena)
  }
  if (data.comisionPct != null) patch.comisionPct = new Prisma.Decimal(data.comisionPct)
  if (data.presupuestoSoftId !== undefined) patch.presupuestoSoftId = data.presupuestoSoftId
  if (data.presupuestoSoftUrl !== undefined) patch.presupuestoSoftUrl = data.presupuestoSoftUrl
  if (data.softTenantId !== undefined) patch.softTenantId = data.softTenantId
  if (data.notas !== undefined) patch.notas = data.notas
  if (data.checklist) patch.checklist = data.checklist as Prisma.InputJsonValue

  if (data.presupuestoSoftUrl || data.presupuestoSoftId) {
    const current = await prisma.worksProject.findUnique({ where: { id } })
    const cl = { ...((current?.checklist as object) ?? {}), presupuestoSoftLink: true }
    patch.checklist = cl as Prisma.InputJsonValue
  }

  return prisma.worksProject.update({
    where: { id },
    data: patch,
    include: { lead: true, partner: true, milestones: true },
  })
}

export async function transitionProject(
  id: string,
  to: WorksProjectStatus,
  opts: { adminOverride?: boolean; cancelReason?: string; actorEmail?: string } = {},
) {
  const project = await prisma.worksProject.findUnique({ where: { id } })
  if (!project) throw new Error("Proyecto no encontrado")

  const ctx: TransitionContext = {
    senaPagada: project.senaPagada,
    hasPresupuesto: Boolean(project.presupuestoSoftUrl || project.presupuestoSoftId || project.montoPresupuesto),
    partnerId: project.partnerId,
    adminOverride: opts.adminOverride === true,
  }

  const gate = canTransition(project.status, to, ctx)
  if (!gate.ok) throw new Error(gate.error)

  return prisma.worksProject.update({
    where: { id },
    data: {
      status: to,
      cancelReason: to === "Cancelado" ? opts.cancelReason ?? "cancelado" : project.cancelReason,
    },
    include: { lead: true, partner: true, milestones: true },
  })
}

export async function markSenaPaid(
  id: string,
  input: { monto?: number; nota?: string | null },
) {
  const project = await prisma.worksProject.findUnique({
    where: { id },
    include: { milestones: true },
  })
  if (!project) throw new Error("Proyecto no encontrado")

  const monto = input.monto ?? (project.montoSena ? Number(project.montoSena) : undefined)
  const checklist = {
    ...((project.checklist as object) ?? {}),
    senaRegistrada: true,
  }

  const senaMilestone = project.milestones.find((m) => /seña|sena/i.test(m.nombre))

  return prisma.$transaction(async (tx) => {
    if (senaMilestone) {
      await tx.worksMilestone.update({
        where: { id: senaMilestone.id },
        data: {
          estado: "cobrado",
          paidAt: new Date(),
          monto: monto != null ? new Prisma.Decimal(monto) : senaMilestone.monto,
          notas: input.nota ?? senaMilestone.notas,
        },
      })
    }

    const updated = await tx.worksProject.update({
      where: { id },
      data: {
        senaPagada: true,
        senaPagadaAt: new Date(),
        senaMontoManual: monto != null ? new Prisma.Decimal(monto) : project.senaMontoManual,
        senaNota: input.nota ?? project.senaNota,
        montoSena: monto != null ? new Prisma.Decimal(monto) : project.montoSena,
        checklist: checklist as Prisma.InputJsonValue,
        // auto-advance to Sena if still earlier
        status:
          project.status === "Lead" ||
          project.status === "Calificado" ||
          project.status === "Presupuesto"
            ? "Sena"
            : project.status,
      },
      include: { lead: true, partner: true, milestones: true },
    })
    return updated
  })
}

export async function assignPartner(
  projectId: string,
  partnerId: string,
  actorEmail?: string,
) {
  const partner = await prisma.worksPartner.findUnique({ where: { id: partnerId } })
  if (!partner || !partner.activo) throw new Error("Partner inexistente o inactivo")

  const project = await prisma.worksProject.findUnique({ where: { id: projectId } })
  if (!project) throw new Error("Proyecto no encontrado")

  const checklist = {
    ...((project.checklist as object) ?? {}),
    partnerAsignado: true,
  }

  return prisma.worksProject.update({
    where: { id: projectId },
    data: {
      partnerId,
      partnerAssignedAt: new Date(),
      partnerAssignedBy: actorEmail ?? "system",
      checklist: checklist as Prisma.InputJsonValue,
      status:
        project.status === "Sena" || project.status === "Presupuesto"
          ? "MatchPartner"
          : project.status,
    },
    include: { lead: true, partner: true, milestones: true },
  })
}

export async function updateMilestoneEstado(
  milestoneId: string,
  estado: WorksMilestoneEstado,
) {
  return prisma.worksMilestone.update({
    where: { id: milestoneId },
    data: {
      estado,
      paidAt: estado === "cobrado" || estado === "pagado_partner" ? new Date() : undefined,
    },
  })
}

export async function listPartners(filters: { activo?: boolean; rubro?: string } = {}) {
  return prisma.worksPartner.findMany({
    where: {
      ...(filters.activo != null ? { activo: filters.activo } : {}),
      ...(filters.rubro ? { rubro: filters.rubro as WorksPartnerRubro } : {}),
    },
    orderBy: { empresa: "asc" },
  })
}

export async function createPartner(input: {
  empresa: string
  rubro?: WorksPartnerRubro | string
  zona?: string | null
  matricula?: string | null
  tarifaNetaNotas?: string | null
  rcVigente?: boolean
  rcVigenteHasta?: string | null
  contactoNombre?: string | null
  contactoEmail?: string | null
  contactoTel?: string | null
  segmentoAllowlist?: WorksSegment[] | string[]
  activo?: boolean
}) {
  const empresa = String(input.empresa ?? "").trim()
  if (!empresa) throw new Error("empresa es obligatoria")

  return prisma.worksPartner.create({
    data: {
      empresa,
      rubro: (input.rubro as WorksPartnerRubro) || "other",
      zona: input.zona ?? null,
      matricula: input.matricula ?? null,
      tarifaNetaNotas: input.tarifaNetaNotas ?? null,
      rcVigente: input.rcVigente ?? false,
      rcVigenteHasta: input.rcVigenteHasta ? new Date(input.rcVigenteHasta) : null,
      contactoNombre: input.contactoNombre ?? null,
      contactoEmail: input.contactoEmail ?? null,
      contactoTel: input.contactoTel ?? null,
      segmentoAllowlist: (input.segmentoAllowlist as WorksSegment[]) ?? ["energy"],
      activo: input.activo ?? true,
    },
  })
}

export async function updatePartner(
  id: string,
  input: Partial<{
    empresa: string
    rubro: WorksPartnerRubro
    zona: string | null
    matricula: string | null
    tarifaNetaNotas: string | null
    rcVigente: boolean
    rcVigenteHasta: string | null
    contactoNombre: string | null
    contactoEmail: string | null
    contactoTel: string | null
    segmentoAllowlist: WorksSegment[]
    activo: boolean
  }>,
) {
  return prisma.worksPartner.update({
    where: { id },
    data: {
      ...input,
      rcVigenteHasta:
        input.rcVigenteHasta === undefined
          ? undefined
          : input.rcVigenteHasta
            ? new Date(input.rcVigenteHasta)
            : null,
    },
  })
}

/** Partner net = cobrado - comisión% */
export function partnerNetFromCobrado(cobrado: number, comisionPct: number) {
  const pct = Math.min(100, Math.max(0, comisionPct))
  return Math.round((cobrado * (1 - pct / 100)) * 100) / 100
}

/** Seed a mock EPC for Energy smoke if none exists */
export async function ensureMockEnergyPartner() {
  const existing = await prisma.worksPartner.findFirst({
    where: { empresa: "GenSolar Mock EPC", rubro: "epc_solar" },
  })
  if (existing) return existing
  return createPartner({
    empresa: "GenSolar Mock EPC",
    rubro: "epc_solar",
    zona: "AMBA / CABA",
    matricula: "MOCK-EPC-001",
    rcVigente: true,
    rcVigenteHasta: new Date(Date.now() + 365 * 86400000).toISOString(),
    contactoNombre: "Operaciones GenSolar",
    contactoEmail: "ops@gensolar.mock",
    contactoTel: "+54 11 5555-0101",
    segmentoAllowlist: ["energy"],
    tarifaNetaNotas: "Mock partner para smoke Energy — no producción",
  })
}

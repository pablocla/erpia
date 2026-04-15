import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   APROBACIONES MULTI-NIVEL — Cadena de aprobación configurable
   Equivalente a SAP Approval Procedures + Tango Autorizaciones
   ═══════════════════════════════════════════════════════════════════════════ */

type Entidad = "orden_compra" | "orden_pago" | "nota_credito" | "gasto" | "ajuste_stock"

// ─── Buscar cadena de aprobación aplicable ───────────────────────────────────

export async function buscarCadenaAplicable(empresaId: number, entidad: Entidad, monto: number) {
  return prisma.cadenaAprobacion.findFirst({
    where: {
      empresaId,
      entidad,
      activa: true,
      montoMinimo: { lte: monto },
      OR: [
        { montoMaximo: null },
        { montoMaximo: { gte: monto } },
      ],
    },
    include: { niveles: { orderBy: { orden: "asc" } } },
  })
}

// ─── Crear solicitud de aprobación ──────────────────────────────────────────

export async function crearSolicitudAprobacion(params: {
  empresaId: number
  entidad: Entidad
  entidadId: number
  monto: number
  solicitanteId: number
  descripcion?: string
}) {
  const cadena = await buscarCadenaAplicable(params.empresaId, params.entidad, params.monto)

  if (!cadena || cadena.niveles.length === 0) {
    // Sin cadena configurada → aprobación automática
    return { autoAprobado: true, solicitud: null }
  }

  const solicitud = await prisma.solicitudAprobacion.create({
    data: {
      cadenaId: cadena.id,
      entidad: params.entidad,
      entidadId: params.entidadId,
      estado: "pendiente",
      nivelActual: 1,
      solicitanteId: params.solicitanteId,
      monto: params.monto,
      descripcion: params.descripcion,
      empresaId: params.empresaId,
    },
  })

  return { autoAprobado: false, solicitud }
}

// ─── Aprobar / Rechazar paso ────────────────────────────────────────────────

export async function procesarAprobacion(params: {
  solicitudId: number
  aprobadorId: number
  accion: "aprobado" | "rechazado"
  comentario?: string
  empresaId: number
}) {
  const solicitud = await prisma.solicitudAprobacion.findFirst({
    where: { id: params.solicitudId, empresaId: params.empresaId, estado: "pendiente" },
    include: { pasos: true },
  })
  if (!solicitud) throw new Error("Solicitud no encontrada o ya procesada")

  const cadena = await prisma.cadenaAprobacion.findUnique({
    where: { id: solicitud.cadenaId },
    include: { niveles: { orderBy: { orden: "asc" } } },
  })
  if (!cadena) throw new Error("Cadena de aprobación no encontrada")

  // Registrar paso
  await prisma.pasoAprobacion.create({
    data: {
      solicitudId: solicitud.id,
      nivel: solicitud.nivelActual,
      aprobadorId: params.aprobadorId,
      accion: params.accion,
      comentario: params.comentario,
    },
  })

  if (params.accion === "rechazado") {
    await prisma.solicitudAprobacion.update({
      where: { id: solicitud.id },
      data: { estado: "rechazado", completadoAt: new Date() },
    })
    return { estado: "rechazado" as const }
  }

  // Chequear si hay siguiente nivel
  const siguienteNivel = cadena.niveles.find((n) => n.orden > solicitud.nivelActual)

  if (!siguienteNivel) {
    // Todos los niveles aprobados
    await prisma.solicitudAprobacion.update({
      where: { id: solicitud.id },
      data: { estado: "aprobado", completadoAt: new Date() },
    })
    return { estado: "aprobado" as const }
  }

  // Avanzar al siguiente nivel
  await prisma.solicitudAprobacion.update({
    where: { id: solicitud.id },
    data: { nivelActual: siguienteNivel.orden },
  })

  return { estado: "pendiente" as const, siguienteNivel: siguienteNivel.orden }
}

// ─── Listar solicitudes pendientes para un aprobador ────────────────────────

export async function listarPendientes(empresaId: number, rol?: string) {
  const where: Record<string, unknown> = { empresaId, estado: "pendiente" }

  const solicitudes = await prisma.solicitudAprobacion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { pasos: true },
  })

  // Si se especificó rol, filtrar por nivel actual que requiera ese rol
  if (rol) {
    const cadenas = await prisma.cadenaAprobacion.findMany({
      where: { empresaId },
      include: { niveles: true },
    })
    const cadenaMap = new Map(cadenas.map((c) => [c.id, c]))

    return solicitudes.filter((s) => {
      const cadena = cadenaMap.get(s.cadenaId)
      const nivelActual = cadena?.niveles.find((n) => n.orden === s.nivelActual)
      return nivelActual?.rol === rol
    })
  }

  return solicitudes
}

// ─── Estado de aprobación de una entidad ────────────────────────────────────

export async function estadoAprobacion(empresaId: number, entidad: string, entidadId: number) {
  const solicitud = await prisma.solicitudAprobacion.findFirst({
    where: { empresaId, entidad, entidadId },
    orderBy: { createdAt: "desc" },
    include: { pasos: { orderBy: { fechaAccion: "asc" } } },
  })

  if (!solicitud) return { requiereAprobacion: false, estado: "sin_cadena" }

  return {
    requiereAprobacion: true,
    estado: solicitud.estado,
    nivelActual: solicitud.nivelActual,
    pasos: solicitud.pasos,
    solicitudId: solicitud.id,
  }
}

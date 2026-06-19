import { prisma } from "@/lib/prisma"
import { listarPendientesPorRol } from "@/lib/pendientes/pendientes-service"
import { resolveAutomationApiUser } from "./automation-service"
import { emitAutomationEvent } from "./emit-event"

export interface PlaybookResult {
  ok: boolean
  actions: string[]
  error?: string
}

export async function runPlaybook(
  empresaId: number,
  playbookKey: string,
  parametros: Record<string, unknown> = {}
): Promise<PlaybookResult> {
  switch (playbookKey) {
    case "stock_bajo_tarea":
      return runStockBajoTarea(empresaId, parametros)
    case "morning_brief_tasks":
      return runMorningBriefTasks(empresaId, parametros)
    case "cierre_caja_alerta":
      return runCierreCajaAlerta(empresaId, parametros)
    case "cobranza_whatsapp":
      return runCobranzaWhatsapp(empresaId, parametros)
    case "nuevo_empleado_onboarding":
      return runNuevoEmpleadoOnboarding(empresaId, parametros)
    case "pedido_b2b_picking":
      return runPedidoB2bPicking(empresaId, parametros)
    case "cae_fallido_retry":
      return runCaeFallidoRetry(empresaId, parametros)
    case "slow_mover_promo":
      return runSlowMoverPromo(empresaId, parametros)
    case "iot_alert_dispatcher":
      return runIotAlertDispatcher(empresaId, parametros)
    case "purchase_approvals":
      return runPurchaseApprovals(empresaId, parametros)
    case "agenda_reminder":
      return runAgendaReminder(empresaId, parametros)
    default:
      return { ok: false, actions: [], error: `Playbook desconocido: ${playbookKey}` }
  }
}

async function resolveAssignee(empresaId: number, rol: string) {
  const usuario = await prisma.usuario.findFirst({
    where: { empresaId, rol, activo: true },
    orderBy: { id: "asc" },
  })
  return usuario ?? (await resolveAutomationApiUser(empresaId))
}

async function crearTarea(
  empresaId: number,
  rol: string,
  titulo: string,
  descripcion: string,
  prioridad: string
) {
  const assignee = await resolveAssignee(empresaId, rol)
  return prisma.tareaPendiente.create({
    data: {
      empresaId,
      usuarioId: assignee.id,
      titulo,
      descripcion,
      prioridad,
      origen: "automation",
      visibleJefe: true,
    },
  })
}

async function runStockBajoTarea(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const multiplier = Number(params.stockMinimoMultiplier ?? 1)
  const rolAsignar = String(params.rolAsignar ?? "deposito")

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    select: { id: true, nombre: true, stock: true, stockMinimo: true },
  })

  const bajos = productos.filter(
    (p) => Number(p.stock) <= Number(p.stockMinimo ?? 5) * multiplier
  )
  if (bajos.length === 0) {
    return { ok: true, actions: ["sin_stock_bajo"] }
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `${bajos.length} producto(s) con stock bajo`,
    bajos
      .slice(0, 10)
      .map((p) => `${p.nombre}: ${p.stock}`)
      .join("\n"),
    "alta"
  )

  return { ok: true, actions: [`tarea_creada_stock_bajo:${bajos.length}`] }
}

async function runMorningBriefTasks(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rol = String(params.rol ?? "gerente")
  const pendientes = await listarPendientesPorRol(empresaId, rol)
  const usuario = await prisma.usuario.findFirst({
    where: { empresaId, rol, activo: true },
  })
  if (!usuario) {
    return { ok: false, actions: [], error: "Sin usuario para rol" }
  }

  if (pendientes.length === 0) {
    return { ok: true, actions: ["sin_pendientes"] }
  }

  await crearTarea(
    empresaId,
    rol,
    `Brief operativo — ${pendientes.length} pendiente(s)`,
    pendientes
      .slice(0, 8)
      .map((p) => `• ${p.titulo}`)
      .join("\n"),
    "media"
  )

  return { ok: true, actions: ["brief_tarea_creada"] }
}

async function runCierreCajaAlerta(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const horasMax = Number(params.horasMaximas ?? 12)
  const rolAsignar = String(params.rolAsignar ?? "gerente")
  const limite = new Date(Date.now() - horasMax * 60 * 60 * 1000)

  const cajas = await prisma.caja.findMany({
    where: { empresaId, estado: "abierta", createdAt: { lt: limite } },
    select: { id: true, createdAt: true, turno: true },
  })

  if (cajas.length === 0) {
    return { ok: true, actions: ["sin_cajas_vencidas"] }
  }

  for (const caja of cajas) {
    void emitAutomationEvent(empresaId, "CAJA_ABIERTA_12H", {
      cajaId: caja.id,
      abiertaDesde: caja.createdAt.toISOString(),
      horasMaximas: horasMax,
    }, `caja-${caja.id}`)
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `${cajas.length} caja(s) abierta(s) hace más de ${horasMax}h`,
    cajas.map((c) => `Caja #${c.id} desde ${c.createdAt.toLocaleString("es-AR")}`).join("\n"),
    "urgente"
  )

  return { ok: true, actions: [`alerta_caja:${cajas.length}`] }
}

async function runCobranzaWhatsapp(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const dias = Number(params.diasVencida ?? 7)
  const rolAsignar = String(params.rolAsignar ?? "vendedor")
  const limite = new Date()
  limite.setDate(limite.getDate() - dias)

  const vencidas = await prisma.cuentaCobrar.findMany({
    where: {
      estado: "vencida",
      fechaVencimiento: { lte: limite },
      cliente: { empresaId },
    },
    take: 20,
    include: { cliente: { select: { nombre: true } } },
  })

  if (vencidas.length === 0) {
    return { ok: true, actions: ["sin_cxc_vencidas"] }
  }

  for (const cc of vencidas.slice(0, 5)) {
    void emitAutomationEvent(
      empresaId,
      "CUENTA_VENCIDA",
      {
        cuentaCobrarId: cc.id,
        cliente: cc.cliente?.nombre,
        saldo: cc.saldo,
        canal: "playbook",
      },
      `cc-${cc.id}`
    )
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `Cobranza: ${vencidas.length} cuenta(s) vencida(s)`,
    vencidas
      .slice(0, 8)
      .map((c) => `${c.cliente?.nombre ?? "Cliente"}: $${Number(c.saldo).toLocaleString("es-AR")}`)
      .join("\n"),
    "alta"
  )

  return { ok: true, actions: [`cobranza_tarea:${vencidas.length}`] }
}

async function runNuevoEmpleadoOnboarding(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const usuarioId = params.usuarioId as number | undefined
  const nombre = params.nombre as string | undefined
  if (!usuarioId && !nombre) {
    return { ok: true, actions: ["sin_usuario_nuevo"] }
  }

  const rolAsignar = String(params.rolAsignar ?? "administrador")
  const checklist = [
    "Asignar permisos y módulos",
    "Configurar impresora / POS si aplica",
    "Capacitación primer día (manual usuario)",
    "Verificar acceso AFIP si es contador",
    "Agregar a lista de contactos internos",
  ]

  await crearTarea(
    empresaId,
    rolAsignar,
    `Onboarding: ${nombre ?? `usuario #${usuarioId}`}`,
    checklist.map((s) => `☐ ${s}`).join("\n"),
    "media"
  )

  return { ok: true, actions: ["onboarding_tarea_creada"] }
}

async function runPedidoB2bPicking(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rolAsignar = String(params.rolAsignar ?? "deposito")

  const pedidos = await prisma.pedidoVenta.findMany({
    where: { empresaId, estado: "confirmado" },
    include: { listasPicking: { select: { id: true } }, cliente: { select: { nombre: true } } },
    take: 20,
  })

  const sinPicking = pedidos.filter((p) => p.listasPicking.length === 0)
  if (sinPicking.length === 0) {
    return { ok: true, actions: ["sin_pedidos_picking"] }
  }

  for (const pedido of sinPicking.slice(0, 5)) {
    void emitAutomationEvent(
      empresaId,
      "PEDIDO_CONFIRMADO",
      {
        pedidoId: pedido.id,
        numero: pedido.numero,
        cliente: pedido.cliente?.nombre,
        total: Number(pedido.total),
      },
      `ped-${pedido.id}`
    )
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `${sinPicking.length} pedido(s) sin picking`,
    sinPicking
      .slice(0, 8)
      .map((p) => `${p.numero} — ${p.cliente?.nombre ?? "Sin cliente"}`)
      .join("\n"),
    "alta"
  )

  return { ok: true, actions: [`picking_tarea:${sinPicking.length}`] }
}

async function runCaeFallidoRetry(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rolAsignar = String(params.rolAsignar ?? "contador")

  const [pendientes, errores] = await Promise.all([
    prisma.factura.count({ where: { empresaId, estado: "pendiente_cae" } }),
    prisma.factura.count({ where: { empresaId, estado: "error_cae" } }),
  ])

  if (pendientes + errores === 0) {
    return { ok: true, actions: ["sin_cae_pendiente"] }
  }

  const facturas = await prisma.factura.findMany({
    where: { empresaId, estado: { in: ["pendiente_cae", "error_cae"] } },
    take: 10,
    select: { id: true, numero: true, estado: true, tipoCbte: true },
  })

  for (const f of facturas) {
    void emitAutomationEvent(
      empresaId,
      "CAE_RECHAZADO",
      { facturaId: f.id, numero: f.numero, estado: f.estado, tipoCbte: f.tipoCbte },
      `fac-${f.id}`
    )
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `CAE: ${pendientes} pendiente(s), ${errores} con error`,
    facturas.map((f) => `#${f.numero} (${f.estado})`).join("\n"),
    "urgente"
  )

  return { ok: true, actions: [`cae_tarea:${pendientes + errores}`] }
}

async function runSlowMoverPromo(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rolAsignar = String(params.rolAsignar ?? "vendedor")
  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true, stock: { gt: 0 } },
    select: { id: true, nombre: true, stock: true, stockMinimo: true, precioVenta: true },
    take: 100,
  })

  const lentos = productos.filter((p) => Number(p.stock) > Number(p.stockMinimo ?? 5) * 3)
  if (lentos.length === 0) {
    return { ok: true, actions: ["sin_slow_movers"] }
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `${lentos.length} producto(s) candidatos a promoción`,
    lentos
      .slice(0, 8)
      .map((p) => `${p.nombre} — stock ${p.stock}`)
      .join("\n"),
    "media"
  )

  return { ok: true, actions: [`slow_mover:${lentos.length}`] }
}

async function runIotAlertDispatcher(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rolAsignar = String(params.rolAsignar ?? "deposito")

  const alertas = await prisma.alertaIoT.findMany({
    where: {
      resuelta: false,
      nivel: { in: ["warning", "critical"] },
      dispositivo: { empresaId },
    },
    include: { dispositivo: { select: { nombre: true } } },
    take: 15,
  })

  if (alertas.length === 0) {
    return { ok: true, actions: ["sin_alertas_iot"] }
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `${alertas.length} alerta(s) IoT activa(s)`,
    alertas
      .slice(0, 8)
      .map((a) => `[${a.nivel}] ${a.dispositivo.nombre}: ${a.mensaje}`)
      .join("\n"),
    "alta"
  )

  return { ok: true, actions: [`iot_alertas:${alertas.length}`] }
}

async function runPurchaseApprovals(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rolAsignar = String(params.rolAsignar ?? "administrador")

  const solicitudes = await prisma.solicitudAprobacion.findMany({
    where: { empresaId, estado: "pendiente" },
    take: 15,
    orderBy: { createdAt: "asc" },
  })

  if (solicitudes.length === 0) {
    return { ok: true, actions: ["sin_aprobaciones"] }
  }

  for (const s of solicitudes.slice(0, 5)) {
    void emitAutomationEvent(
      empresaId,
      "APROBACION_PENDIENTE",
      {
        solicitudId: s.id,
        entidad: s.entidad,
        entidadId: s.entidadId,
        monto: s.monto,
      },
      `apr-${s.id}`
    )
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `${solicitudes.length} aprobación(es) pendiente(s)`,
    solicitudes
      .slice(0, 8)
      .map((s) => `${s.entidad} #${s.entidadId} — $${s.monto.toLocaleString("es-AR")}`)
      .join("\n"),
    "alta"
  )

  return { ok: true, actions: [`aprobaciones:${solicitudes.length}`] }
}

async function runAgendaReminder(
  empresaId: number,
  params: Record<string, unknown>
): Promise<PlaybookResult> {
  const rolAsignar = String(params.rolAsignar ?? "vendedor")
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const fecha = manana.toISOString().slice(0, 10)

  const turnos = await prisma.turno.findMany({
    where: {
      fecha: new Date(fecha),
      estado: { in: ["pendiente", "confirmado"] },
      profesional: { empresaId },
    },
    include: {
      cliente: { select: { nombre: true, telefono: true } },
      profesional: { select: { nombre: true } },
    },
    take: 30,
  })

  if (turnos.length === 0) {
    return { ok: true, actions: ["sin_turnos_manana"] }
  }

  for (const t of turnos.slice(0, 5)) {
    void emitAutomationEvent(
      empresaId,
      "TURNO_AGENDA_CREADO",
      {
        turnoId: t.id,
        fecha,
        hora: t.horaInicio,
        cliente: t.cliente?.nombre,
        profesional: t.profesional.nombre,
      },
      `turno-${t.id}`
    )
  }

  await crearTarea(
    empresaId,
    rolAsignar,
    `Recordatorios: ${turnos.length} turno(s) mañana`,
    turnos
      .slice(0, 8)
      .map((t) => `${t.horaInicio} — ${t.cliente?.nombre ?? "Sin cliente"} (${t.profesional.nombre})`)
      .join("\n"),
    "media"
  )

  return { ok: true, actions: [`agenda:${turnos.length}`] }
}
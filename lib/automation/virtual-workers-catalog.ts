/** Catálogo de empleados virtuales y playbooks — alineado a VIRTUAL_WORKERS_PLAYBOOKS.md */

export interface VirtualWorkerTemplate {
  nombre: string
  rol: string
  playbooks: string[]
  cron: string
  activo: boolean
  descripcion: string
  entitlementSku: string
}

export interface PlaybookTemplate {
  playbookKey: string
  nombre: string
  parametros: Record<string, unknown>
  activo: boolean
}

export const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    playbookKey: "stock_bajo_tarea",
    nombre: "Stock bajo → tarea depósito",
    parametros: { stockMinimoMultiplier: 1, rolAsignar: "deposito" },
    activo: true,
  },
  {
    playbookKey: "morning_brief_tasks",
    nombre: "Brief matutino gerente",
    parametros: { rol: "gerente" },
    activo: true,
  },
  {
    playbookKey: "cierre_caja_alerta",
    nombre: "Cajas abiertas +12h → alerta",
    parametros: { horasMaximas: 12, rolAsignar: "gerente" },
    activo: true,
  },
  {
    playbookKey: "cobranza_whatsapp",
    nombre: "CxC vencidas → tareas cobranza",
    parametros: { diasVencida: 7, rolAsignar: "vendedor" },
    activo: true,
  },
  {
    playbookKey: "nuevo_empleado_onboarding",
    nombre: "Checklist onboarding empleado",
    parametros: { rolAsignar: "administrador" },
    activo: true,
  },
  {
    playbookKey: "pedido_b2b_picking",
    nombre: "Pedidos confirmados → picking",
    parametros: { rolAsignar: "deposito" },
    activo: true,
  },
  {
    playbookKey: "cae_fallido_retry",
    nombre: "CAE pendiente/error → tarea contador",
    parametros: { rolAsignar: "contador" },
    activo: true,
  },
  {
    playbookKey: "slow_mover_promo",
    nombre: "Stock inmovilizado → promo",
    parametros: { diasSinMovimiento: 60, rolAsignar: "vendedor" },
    activo: true,
  },
  {
    playbookKey: "iot_alert_dispatcher",
    nombre: "Alertas IoT críticas",
    parametros: { rolAsignar: "deposito" },
    activo: true,
  },
  {
    playbookKey: "purchase_approvals",
    nombre: "Aprobaciones de compra pendientes",
    parametros: { rolAsignar: "administrador" },
    activo: true,
  },
  {
    playbookKey: "agenda_reminder",
    nombre: "Recordatorio turnos mañana",
    parametros: { rolAsignar: "vendedor" },
    activo: true,
  },
]

export const VIRTUAL_WORKER_TEMPLATES: VirtualWorkerTemplate[] = [
  {
    nombre: "Ana Reposición",
    rol: "deposito",
    playbooks: ["stock_bajo_tarea"],
    cron: "0 8 * * 1-5",
    activo: true,
    descripcion: "Monitorea stock y genera tareas de reposición.",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Bot Caja Noche",
    rol: "cajero",
    playbooks: ["cierre_caja_alerta"],
    cron: "0 22 * * *",
    activo: true,
    descripcion: "Alerta cajas abiertas demasiado tiempo.",
    entitlementSku: "ops.cash_reconciliation",
  },
  {
    nombre: "Leo Cobranzas",
    rol: "vendedor",
    playbooks: ["cobranza_whatsapp"],
    cron: "0 10 * * 2,4",
    activo: true,
    descripcion: "Prioriza cuentas vencidas para cobranza.",
    entitlementSku: "channel.whatsapp",
  },
  {
    nombre: "Sofía Onboarding",
    rol: "administrador",
    playbooks: ["nuevo_empleado_onboarding"],
    cron: "0 9 * * 1-5",
    activo: false,
    descripcion: "Checklist para nuevos empleados (activar al alta).",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Pedro Picking",
    rol: "deposito",
    playbooks: ["pedido_b2b_picking"],
    cron: "0 6 * * 1-6",
    activo: true,
    descripcion: "Genera tareas de picking para pedidos B2B.",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Clara Facturación",
    rol: "contador",
    playbooks: ["cae_fallido_retry"],
    cron: "0 8 * * 1-5",
    activo: true,
    descripcion: "Revisa comprobantes con CAE pendiente o error.",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Max Promociones",
    rol: "vendedor",
    playbooks: ["slow_mover_promo"],
    cron: "0 7 * * 1",
    activo: true,
    descripcion: "Detecta productos de baja rotación.",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Tom IoT",
    rol: "deposito",
    playbooks: ["iot_alert_dispatcher"],
    cron: "0 * * * *",
    activo: false,
    descripcion: "Despacha alertas de sensores IoT (requiere módulo IoT).",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Hugo Compras",
    rol: "administrador",
    playbooks: ["purchase_approvals"],
    cron: "0 8 * * 1-5",
    activo: true,
    descripcion: "Encola aprobaciones de compras grandes.",
    entitlementSku: "automation.n8n_hub",
  },
  {
    nombre: "Eva Turnos",
    rol: "vendedor",
    playbooks: ["agenda_reminder"],
    cron: "0 18 * * *",
    activo: true,
    descripcion: "Recordatorios de turnos del día siguiente.",
    entitlementSku: "automation.n8n_hub",
  },
]
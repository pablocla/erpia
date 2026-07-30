import type { SubSaasSlug } from "./sub-saas-catalog"

export interface SetupStep {
  id: string
  title: string
  description: string
  href: string
  actionLabel: string
  completed: boolean
}

export interface ProductSetupChecklist {
  slug: SubSaasSlug
  title: string
  steps: SetupStep[]
  progressPct: number
  isComplete: boolean
}

export function getSetupChecklistForSlug(
  slug: SubSaasSlug,
  completedStepIds: string[] = [],
): ProductSetupChecklist {
  const stepsBySlug: Record<string, Omit<SetupStep, "completed">[]> = {
    fiado: [
      { id: "step_cliente", title: "1. Cargá tu primer cliente del barrio", description: "Registrá a los vecinos que compran a crédito en tu libreta.", href: "/dashboard/clientes", actionLabel: "Agregar Cliente" },
      { id: "step_fiado", title: "2. Anotá tu primer fiado", description: "Anotá una compra a crédito en 2 clics desde la libreta.", href: "/dashboard/fiado", actionLabel: "Anotar Fiado" },
      { id: "step_wa", title: "3. Enviá un aviso por WhatsApp", description: "Probá enviar un recordatorio automático por WhatsApp.", href: "/dashboard/fiado", actionLabel: "Probar Aviso" },
    ],
    cobra: [
      { id: "step_import", title: "1. Cargá tus cuentas a cobrar", description: "Importá tus clientes morosos o deudas pendientes.", href: "/dashboard/cuentas-cobrar", actionLabel: "Ver Deudas" },
      { id: "step_msg", title: "2. Enviá tu primera cobranza masiva", description: "Dispará la plantilla de cobranza amigable por WhatsApp.", href: "/dashboard/cuentas-cobrar", actionLabel: "Cobrar por WA" },
    ],
    turnos: [
      { id: "step_agenda", title: "1. Agendá tu primer turno", description: "Registrá un turno en tu calendario.", href: "/dashboard/agenda", actionLabel: "Nuevo Turno" },
      { id: "step_link", title: "2. Compartí tu link de agenda online", description: "Copiá tu link público para que tus clientes reserven 24/7.", href: "/dashboard/agenda", actionLabel: "Copiar Link" },
    ],
    pos: [
      { id: "step_prod", title: "1. Cargá tus primeros 5 productos", description: "Agregá los productos más vendidos a tu catálogo.", href: "/dashboard/productos", actionLabel: "Agregar Producto" },
      { id: "step_caja", title: "2. Abrí la caja del día", description: "Ingresá el saldo inicial para operar la registradora.", href: "/dashboard/caja", actionLabel: "Abrir Caja" },
      { id: "step_venta", title: "3. Emití tu primera venta en el POS", description: "Cobrá tu primer ticket desde la pantalla de mostrador.", href: "/dashboard/pos", actionLabel: "Abrir POS" },
    ],
  }

  const rawSteps = stepsBySlug[slug] || [
    { id: "step_generic_1", title: "1. Configurá los datos de tu empresa", description: "Ingresá el nombre comercial y el CUIT.", href: "/dashboard/configuracion", actionLabel: "Ajustes" },
    { id: "step_generic_2", title: "2. Realizá tu primera operación", description: "Empezá a operar en tu panel simplificado.", href: "/dashboard", actionLabel: "Inicio" },
  ]

  const steps: SetupStep[] = rawSteps.map((s) => ({
    ...s,
    completed: completedStepIds.includes(s.id),
  }))

  const completedCount = steps.filter((s) => s.completed).length
  const progressPct = Math.round((completedCount / steps.length) * 100)

  return {
    slug,
    title: `Primeros pasos en ${slug.toUpperCase()}`,
    steps,
    progressPct,
    isComplete: completedCount === steps.length,
  }
}

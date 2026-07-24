/**
 * Catálogo de Departamentos de la Empresa y Líderes Digitales — Claver Lab 2026
 * Cada departamento cuenta con un líder que expone el estado de su bloque, sus KPIs
 * y los requerimientos críticos que pide para alcanzar el éxito.
 */

export interface DepartmentLeader {
  id: string
  nombre: string
  rol: string
  avatarColor: string
  iconoNombre: string
  departamentoId: string
  departamentoNombre: string
  saludBloquePct: number // 0-100%
  estado: "excelente" | "en_progreso" | "bloqueado"
  requerimientoExito: {
    titulo: string
    descripcion: string
    impactoEsperado: string
    urgencia: "alta" | "media" | "critica"
    accionSugerida: string
    linkInterno?: string
  }
  kpis: {
    nombre: string
    valorActual: string
    meta: string
  }[]
  solicitudAprobada?: boolean
}

export const DEPARTMENT_LEADERS: DepartmentLeader[] = [
  {
    id: "lead-ventas-franco",
    nombre: "Franco Benítez",
    rol: "Director de Ventas & Calle",
    avatarColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    iconoNombre: "Target",
    departamentoId: "comercial",
    departamentoNombre: "Ventas & Operaciones de Calle",
    saludBloquePct: 82,
    estado: "en_progreso",
    requerimientoExito: {
      titulo: "Reclutar 2 Vendedores de Calle + Script de Objeciones AFIP",
      descripcion:
        "Para cubrir Echesortu, Pellegrini y Pichincha necesitamos 2 vendedores presenciales equipados con la app comercial y la matriz de objeciones resueltas para cerrar el trial en la primera visita.",
      impactoEsperado: "+30 clientes pagos por mes ($1.2M ARS MRR nuevo).",
      urgencia: "critica",
      accionSugerida: "Activar búsqueda en Claver Cloud y habilitar el Playbook 15 min a vendedores.",
      linkInterno: "/claver-cloud/comercial",
    },
    kpis: [
      { nombre: "Visitas Mensuales", valorActual: "80", meta: "120" },
      { nombre: "Tasa de Cierre Trial", valorActual: "35%", meta: "45%" },
      { nombre: "Nuevos Tenants/Mes", valorActual: "12", meta: "30" },
    ],
  },
  {
    id: "lead-ing-grok",
    nombre: "Grok Tech Leader",
    rol: "VP de Ingeniería y Arquitectura",
    avatarColor: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    iconoNombre: "Layers",
    departamentoId: "ingenieria",
    departamentoNombre: "Producto & Ingeniería de Software",
    saludBloquePct: 94,
    estado: "excelente",
    requerimientoExito: {
      titulo: "Homologación AFIP/ARCA Self-Serve + Mantener Tokens OKLCH",
      descripcion:
        "La base en Next.js 15 y Tailwind v4 vuela. Pido automatizar la subida de certificados AFIP para que el cliente pase de Trial a Go-Live en 1-click sin intervención manual de sistemas.",
      impactoEsperado: "Reducción del tiempo de puesta en marcha de 48hs a 15 minutos.",
      urgencia: "alta",
      accionSugerida: "Aprobar el pipeline de autenticación de certificados AFIP en producción.",
      linkInterno: "/claver-cloud/go-live",
    },
    kpis: [
      { nombre: "Uptime del Sistema", valorActual: "99.9%", meta: "99.9%" },
      { nombre: "Tiempo Respuesta POS", valorActual: "180ms", meta: "<200ms" },
      { nombre: "Tests Verdes Vitest", valorActual: "100%", meta: "100%" },
    ],
  },
  {
    id: "lead-ops-valeria",
    nombre: "Valeria Rossi",
    rol: "Head of Implementation & Go-Live",
    avatarColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    iconoNombre: "Rocket",
    departamentoId: "operaciones",
    departamentoNombre: "Operaciones & Puesta en Marcha",
    saludBloquePct: 88,
    estado: "excelente",
    requerimientoExito: {
      titulo: "Checklist Interactivo de 48hs + Asignación de Implementador",
      descripcion:
        "Pido que apenas se cree un tenant en trial se active un checklist interactivo de 5 pasos (Cargar primer producto, importar CSV, abrir caja, probrar fiado) con alerta si el cliente no opera en 48hs.",
      impactoEsperado: "Reducción del Churn mensual al 0.5%.",
      urgencia: "alta",
      accionSugerida: "Vincular el bot de bienvenida por WhatsApp al checklist de onboarding.",
      linkInterno: "/claver-cloud/implementation",
    },
    kpis: [
      { nombre: "Time-to-Go-Live", valorActual: "1.2 días", meta: "<1 día" },
      { nombre: "Churn Mensual", valorActual: "1.8%", meta: "<1.0%" },
      { nombre: "Checklists Completos", valorActual: "78%", meta: "90%" },
    ],
  },
  {
    id: "lead-mkt-sofia",
    nombre: "Sofía Martínez",
    rol: "Head of Growth & Digital Marketing",
    avatarColor: "bg-pink-500/10 text-pink-600 border-pink-500/30",
    iconoNombre: "Sparkles",
    departamentoId: "marketing",
    departamentoNombre: "Marketing Digital & Performance",
    saludBloquePct: 90,
    estado: "excelente",
    requerimientoExito: {
      titulo: "Presupuesto Publicitario de Meta Ads ($5.000 ARS/día por Rubro)",
      descripcion:
        "Tenemos las campañas empaquetadas en Claver Cloud por rubro (Kiosco, Ferretería, Gym, Taller). Pido activar presupuesto diario en Meta Ads e Instagram Reels para abastecer a los vendedores con leads tibios.",
      impactoEsperado: "Generación de 150 leads calificados por mes con CPL de $450 ARS.",
      urgencia: "critica",
      accionSugerida: "Encender las campañas del catálogo de Marketing Digital en Claver Cloud.",
      linkInterno: "/claver-cloud/marketing",
    },
    kpis: [
      { nombre: "Cost per Lead (CPL)", valorActual: "$480 ARS", meta: "<$500" },
      { nombre: "Leads Semanales", valorActual: "35", meta: "50" },
      { nombre: "Tasa Conversión Ads", valorActual: "8.5%", meta: "10%" },
    ],
  },
  {
    id: "lead-cobranza-leo",
    nombre: "Leo Cobranza AI",
    rol: "Empleado Digital de Cobranzas & Fiado",
    avatarColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    iconoNombre: "Bot",
    departamentoId: "finanzas",
    departamentoNombre: "Cobranzas & Tesorería Digital",
    saludBloquePct: 96,
    estado: "excelente",
    requerimientoExito: {
      titulo: "Botón Directo Mercado Pago en Mensaje Inicial de Fiado",
      descripcion:
        "El motor de detección de deudores y generación de mensajes por WhatsApp funciona perfecto. Pido incluir siempre el link directo de cobro MP en la primera plantilla de recordatorio para agilizar el pago.",
      impactoEsperado: "Aumento del 40% en el cobro de deudas en las primeras 24hs.",
      urgencia: "media",
      accionSugerida: "Integrar el generador de MP links en la plantilla por defecto de fiado.",
      linkInterno: "/dashboard/fiado",
    },
    kpis: [
      { nombre: "Recupero de Deudas", valorActual: "38%", meta: ">35%" },
      { nombre: "Mensajes Enviados", valorActual: "1.420", meta: "2.000" },
      { nombre: "Monto Recuperado/Mes", valorActual: "$3.8M ARS", meta: "$5.0M" },
    ],
  },
  {
    id: "lead-legal-mariano",
    nombre: "Dr. Mariano Castro",
    rol: "Head of Legal & Compliance Fiscal",
    avatarColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    iconoNombre: "Shield",
    departamentoId: "legal",
    departamentoNombre: "Legal, Fiscal & Contratos",
    saludBloquePct: 85,
    estado: "en_progreso",
    requerimientoExito: {
      titulo: "Orden de Servicio Digital de 1 Página + Términos de Servicio",
      descripcion:
        "Pido que la firma del contrato y la aceptación de Términos y Condiciones se realice directamente por SMS/WhatsApp al dar de alta el trial, para proteger la propiedad intelectual y formalizar el cobro.",
      impactoEsperado: "100% de respaldos jurídicos ante reclamos o morosidad de tenants.",
      urgencia: "alta",
      accionSugerida: "Activar el módulo de firma digital de contrato en la consola de Claver Cloud.",
      linkInterno: "/claver-cloud/settings",
    },
    kpis: [
      { nombre: "Contratos Digitales", valorActual: "85%", meta: "100%" },
      { nombre: "Cumplimiento AFIP", valorActual: "100%", meta: "100%" },
      { nombre: "Reclamos Abiertos", valorActual: "0", meta: "0" },
    ],
  },
]

/**
 * Catálogo de Campañas de Marketing Digital por Rubro / Nicho — ClavERP 2026
 * Módulo para Claver Cloud: Copys, Segmentación, Presupuestos y Kits de Redes Sociales.
 */

export interface MarketingCampaign {
  id: string
  rubroId: string
  rubroNombre: string
  titulo: string
  objetivo: "leads" | "trials" | "whatsapp_directo" | "branding"
  canal: "meta_ads" | "instagram_reels" | "google_search" | "tiktok" | "whatsapp_blast"
  canalLabel: string
  headline: string
  copyPrincipal: string
  callToAction: string
  linkDemo: string
  audienciaObjetivo: {
    segmento: string
    intereses: string[]
    ubicacion: string
    edadSugerida: string
  }
  presupuestoDiarioARS: number
  cplEstimadoARS: number
  promptImagenIA?: string
  guionVideoReels?: string
}

export const MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: "mkt-kiosco-fiado-wa",
    rubroId: "kiosco",
    rubroNombre: "Kiosco / Almacén de Barrio",
    titulo: "Ancla de Fiado por WhatsApp + POS Mostrador",
    objetivo: "whatsapp_directo",
    canal: "instagram_reels",
    canalLabel: "Instagram Reels & Stories",
    headline: "¡Dejá de anotar fiados en un cuaderno viejo! 📲 Caducan los papeles rotos.",
    copyPrincipal:
      "¿Tenés un kiosco o almacén y perdés plata con anotaciones en cuadernos? Con ClavERP anotás el fiado en 3 segundos desde la tablet o cel y enviás un recordatorio automático por WhatsApp con botón de Mercado Pago.\n\n✅ Venta rápida en mostrador con lector de barra\n✅ Control de stock de bultos y paquetes\n✅ Cobra tus fiados sin pasar vergüenza\n\nPrueba gratis 14 días sin ingresar tarjeta. ¡Empezá hoy!",
    callToAction: "Probá la demo interactiva gratis",
    linkDemo: "/demo?industryId=kiosco",
    audienciaObjetivo: {
      segmento: "Dueños de Kioscos, Almacenes, Pollerías, Minimarkets",
      intereses: ["Comercio minorista", "Kiosco", "Mercado Pago", "Pequeña empresa"],
      ubicacion: "Argentina (Grandes centros urbanos y provincias)",
      edadSugerida: "25 - 55 años",
    },
    presupuestoDiarioARS: 3_500,
    cplEstimadoARS: 450,
    promptImagenIA:
      "Un comerciante sonriente en un almacén moderno argentino sosteniendo un teléfono celular con la pantalla mostrando un saldo verde de WhatsApp y cobro exitoso, iluminación cálida de negocio, alta resolución.",
    guionVideoReels:
      "0-3s: [Gancho visual] Alguien tachando una libreta de papel grasosa. Texto: '¿Seguís anotando fiados así?'\n3-8s: Muestra la pantalla del cel enviando recordatorio WhatsApp en 1-click.\n8-15s: Muestra el POS vendiendo un alfajor y gaseosa volando. CTA: 'Tocá el link y probalo gratis en 1 min'.",
  },
  {
    id: "mkt-ferreteria-stock-afip",
    rubroId: "ferreteria",
    rubroNombre: "Ferretería / Corralón",
    titulo: "Control de Cómputo de Stock + Facturación Electrónica AFIP",
    objetivo: "leads",
    canal: "meta_ads",
    canalLabel: "Facebook & Instagram Ads",
    headline: "¿Buscás un código entre 5.000 tornillos y no sabés el precio con aumento?",
    copyPrincipal:
      "La inflación te desactualiza la lista de precios de la ferretería todos los días. Con ClavERP reexpresás precios por porcentaje en 1 click, emitís facturas A y B ante AFIP al instante y controlás tu stock sin volverte loco.\n\n🔧 Búsqueda ultra-rápida por código, medida o marca\n🔧 Ajuste masivo por lista de proveedores\n🔧 Facturación electrónica integrada sin ingresar a la web de AFIP\n\nSolicitá una demostración personalizada para tu negocio.",
    callToAction: "Ver demostración en vivo",
    linkDemo: "/demo?industryId=ferreteria",
    audienciaObjetivo: {
      segmento: "Dueños y Gerentes de Ferreterías, Corralones, Sanitarios",
      intereses: ["Ferretería", "Construcción", "Herramientas", "AFIP"],
      ubicacion: "Argentina",
      edadSugerida: "30 - 60 años",
    },
    presupuestoDiarioARS: 4_500,
    cplEstimadoARS: 650,
    promptImagenIA:
      "Mostrador de ferretería bien iluminado con estantes llenos de herramientas de marca, pantalla POS mostrando software de gestión limpio con factura AFIP verde aprobada.",
  },
  {
    id: "mkt-gimnasio-cobro-cuota",
    rubroId: "gimnasio",
    rubroNombre: "Gimnasio / Pilates / Club",
    titulo: "Recupero de Cuotas Vencidas & Control de Socios",
    objetivo: "trials",
    canal: "instagram_reels",
    canalLabel: "Instagram Reels",
    headline: "¿El 30% de tus alumnos se olvidad de pagar la cuota a fin de mes?",
    copyPrincipal:
      "Automatizá el cobro de tu gimnasio o estudio de pilates. ClavERP le avisa a tus alumnos por WhatsApp cuando se vence su pase y les manda el link de pago automático.\n\n💪 Control de morosos y pases activos\n💪 Cantina y venta de suplementos en mostrador\n💪 Reportes de ingresos mensuales en tiempo real\n\nSumá más socios sin gastar horas llamando por teléfono.",
    callToAction: "Probar módulo Gimnasios gratis",
    linkDemo: "/demo?industryId=gimnasio",
    audienciaObjetivo: {
      segmento: "Dueños de Gimnasios, Salones de Pilates, Personal Trainers, Clubes",
      intereses: ["Fitness", "Gimnasio", "CrossFit", "Pilates", "Gestión deportiva"],
      ubicacion: "Argentina",
      edadSugerida: "22 - 50 años",
    },
    presupuestoDiarioARS: 4_000,
    cplEstimadoARS: 520,
    promptImagenIA:
      "Gimnasio moderno tipo CrossFit con luz neón, teléfono en mano mostrando notificación de WhatsApp con pago recibido de cuota mensual.",
  },
  {
    id: "mkt-veterinaria-turnos-hc",
    rubroId: "veterinaria",
    rubroNombre: "Veterinaria / Pet Shop",
    titulo: "Historia Clínica Mascotas + Ventas Pet Shop",
    objetivo: "leads",
    canal: "google_search",
    canalLabel: "Google Search Ads",
    headline: "El ERP para Veterinarias que une Historia Clínica y Venta de Alimentos.",
    copyPrincipal:
      "Simplificá tu veterinaria o pet shop. Gestioná fichas médicas de pacientes, recordatorios de vacunas por WhatsApp y facturación de alimento alimento en un solo sistema.\n\n🐾 Ficha clínica y vacunación completa\n🐾 Agenda de turnos estética y consultorio\n🐾 Venta mostrador rápida con stock de alimento acumulado\n\nPedí tu prueba de 14 días gratis hoy mismo.",
    callToAction: "Solicitar prueba gratis",
    linkDemo: "/demo?industryId=veterinaria",
    audienciaObjetivo: {
      segmento: "Veterinarios, Administradores de Pet Shops y Clínicas Veterinarias",
      intereses: ["Veterinaria", "Mascotas", "Pet shop", "Medicina veterinaria"],
      ubicacion: "Argentina",
      edadSugerida: "25 - 55 años",
    },
    presupuestoDiarioARS: 5_000,
    cplEstimadoARS: 700,
  },
  {
    id: "mkt-taller-ordenes-servicio",
    rubroId: "taller",
    rubroNombre: "Taller Mecánico / Services",
    titulo: "Órdenes de Trabajo + WhatsApp 'Tu auto está listo'",
    objetivo: "whatsapp_directo",
    canal: "tiktok",
    canalLabel: "TikTok & Instagram Reels",
    headline: "Sorprendé a tus clientes avisándoles por WhatsApp cuando su vehículo esté listo.",
    copyPrincipal:
      "Profesionalizá tu taller mecánico o centro de lubricación. Creá órdenes de servicio (OT) con repuestos, mano de obra y estado en tiempo real.\n\n🚗 Envío de presupuesto por WhatsApp en 1 click\n🚗 Notificación de vehículo 'Listo para retirar'\n🚗 Control de repuestos y compras\n\nProbá el sistema líder para talleres mecánicos en Argentina.",
    callToAction: "Probar Demo Taller",
    linkDemo: "/demo?industryId=taller",
    audienciaObjetivo: {
      segmento: "Dueños de Talleres Mecánicos, Lubricentros, Inyección, Electrónica Automotriz",
      intereses: ["Mecánica automotriz", "Taller mecánico", "Autos", "Repuestos"],
      ubicacion: "Argentina",
      edadSugerida: "25 - 58 años",
    },
    presupuestoDiarioARS: 3_800,
    cplEstimadoARS: 480,
  },
  {
    id: "mkt-monotributo-freelance",
    rubroId: "monotributo",
    rubroNombre: "Monotributista / Prestador de Servicios",
    titulo: "Facturador Rápido C/Facturas C + Cobros Mercado Pago",
    objetivo: "trials",
    canal: "meta_ads",
    canalLabel: "Facebook & Instagram Ads",
    headline: "¿Hacés facturas C a mano en AFIP y perdés tiempo cargando clientes?",
    copyPrincipal:
      "Facturá en segundos desde tu celular o notebook sin entrar a la web lenta de AFIP. Enviá presupuestos profesionales y cobrá con Mercado Pago o transferencia.\n\n📄 Emisión de Facturas C automáticas en 2 clicks\n📄 Enlace directo a WhatsApp de tu cliente con la PDF adjunta\n📄 Control de tope de facturación anual Monotributo\n\nProbá 14 días gratis sin compromiso.",
    callToAction: "Comenzar gratis en 1 minuto",
    linkDemo: "/demo?industryId=servicios",
    audienciaObjetivo: {
      segmento: "Monotributistas, Freelancers, Consultores, Profesionales independientes",
      intereses: ["Monotributo", "Facturación electrónica", "AFIP", "Mercado Pago"],
      ubicacion: "Argentina",
      edadSugerida: "20 - 50 años",
    },
    presupuestoDiarioARS: 3_000,
    cplEstimadoARS: 380,
  },
]

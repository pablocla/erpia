/**
 * Genera docs/comercial/servicios-nuevos-paquetes-claver.docx
 * Servicios generables de forma recurrente — excluye catálogo marketplace existente.
 */
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
  TableOfContents,
} = require("docx");

const OUT = path.join(
  __dirname,
  "..",
  "docs",
  "comercial",
  "servicios-nuevos-paquetes-claver.docx"
);

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  });
}
function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  });
}
function pb() {
  return new Paragraph({ children: [new PageBreak()] });
}

function table(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
          }),
        ],
      })
    ),
  });
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((cell, i) =>
          new TableCell({
            borders,
            width: { size: colWidths[i], type: WidthType.DXA },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
          })
        ),
      })
  );
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function serviceBlock(s) {
  const blocks = [
    h2(`${s.id} — ${s.nombre}`),
    h3("Pitch comercial"),
    p(s.pitch),
    h3("Pricing sugerido"),
    p(`Setup (one-shot): ${s.setup}`),
    p(`MRR (mensual): ${s.mrr}`),
    p(`Justificación: ${s.pricingWhy}`),
    h3("Arquitectura técnica y APIs"),
    p(s.architecture),
    ...s.archBullets.map((b) => bullet("bullets-arch", b)),
    h3("Viabilidad de subcontratación"),
    p(`Frontend: ${s.feHours}h | Backend: ${s.beHours}h | Total: ${s.feHours + s.beHours}h (${s.level})`),
    p(s.subDetails),
    h3("Riesgos y cuellos de botella"),
    ...s.risks.map((r) => bullet("bullets-risk", r)),
    p(""),
  ];
  return blocks;
}

// ─── Servicios prioritarios (detalle TPM completo) ───────────────────────────
const PRIORITY = [
  {
    id: "gen.intel.briefing_semanal",
    nombre: "Briefing Ejecutivo Semanal",
    pitch:
      "Cada lunes el dueño recibe un informe de una página con ventas, márgenes, top productos, alertas de stock y comparativa vs. la semana anterior — sin abrir el ERP. Ahorra 2–3 horas de análisis manual y permite decidir promos o pedidos al distribuidor antes que la competencia. Es el 'café con los números' que el comerciante de barrio nunca tuvo.",
    setup: "USD 0 (automatizado) o USD 49 si requiere personalización de KPIs",
    mrr: "USD 19–29/mes",
    pricingWhy:
      "Costo marginal casi cero (cron + plantilla + datos propios). Precio accesible para PyME; escala por volumen de empresas. USD 29 si incluye benchmark sectorial anónimo.",
    architecture:
      "Cron Vercel (`/api/cron/briefing-semanal`) por `empresaId`. Lee ventas, stock y caja vía Prisma/Supabase. Genera PDF con `@react-pdf/renderer` o HTML→PDF (Puppeteer serverless limitado). Envío vía Resend. Feature flag `gen_intel_briefing` en tabla `EmpresaModulo`. Sin tocar core contable.",
    archBullets: [
      "Multi-tenant: `whereEmpresa(empresaId)` en todas las queries",
      "Plugin UI: widget en dashboard + email; micro-frontend `/dashboard/insights/briefing`",
      "Enterprise single-tenant: export cron job + bucket S3 dedicado por cliente",
      "Caché SWR 24h para no recalcular en cada vista",
    ],
    feHours: 16,
    beHours: 24,
    level: "Junior/Semi-Senior",
    subDetails:
      "Desarrollador puede trabajar aislado: solo consume APIs internas `/api/ventas/resumen`, `/api/stock/alertas`. No modifica facturación ni inventario core.",
    risks: [
      "Datos incompletos si el cliente no cierra caja → briefing con disclaimer",
      "Sobrecarga de emails si no hay opt-out por usuario",
      "Zona horaria AR/MX/US mal configurada en cron",
    ],
  },
  {
    id: "gen.intel.forecast_caja",
    nombre: "Proyección de Flujo de Caja 30/60/90",
    pitch:
      "El comerciante ve cuánta plata va a entrar y salir en los próximos 90 días según fiado pendiente, compras programadas y estacionalidad. Evita quedar sin efectivo para pagar proveedores o perder descuentos por pronto pago. Previene el clásico 'vendí mucho pero no tengo un peso'.",
    setup: "USD 79 (calibración inicial de categorías de egreso)",
    mrr: "USD 35–45/mes",
    pricingWhy:
      "Mayor valor percibido que un reporte estático; justifica USD 45 si integra cuentas por pagar/cobrar del ERP. Setup cubre parametrización de rubro.",
    architecture:
      "Servicio `lib/insights/cashflow-forecast.ts`. Inputs: ventas históricas, `CuentaCorriente`, órdenes de compra abiertas, calendario fiscal (solo lectura). Modelo simple: media móvil + estacionalidad por rubro. API `GET /api/insights/cashflow-forecast`. Gráfico Recharts en micro-frontend. Actualización semanal automática.",
    archBullets: [
      "No escribe en ledger contable — solo lectura",
      "Tabla `InsightForecast` con `empresaId`, `periodo`, `payloadJson`",
      "Opcional: webhook a n8n del cliente para exportar a Excel",
      "Flag módulo: `gen_intel_forecast`",
    ],
    feHours: 20,
    beHours: 32,
    level: "Semi-Senior",
    subDetails:
      "Backend requiere entender modelo fiado/CC del ERP existente. Frontend independiente. Tests Vitest con fixtures de flujo.",
    risks: [
      "Proyecciones erróneas si fiado no está actualizado",
      "Expectativa de 'predicción perfecta' → copy educativo obligatorio",
      "Inflación AR distorsiona forecast si no se indexa",
    ],
  },
  {
    id: "gen.bench.rubro_local",
    nombre: "Benchmark Anónimo por Rubro",
    pitch:
      "El dueño descubre si su margen, ticket promedio y rotación están por encima o debajo de comercios similares en su ciudad — sin revelar datos de nadie. Genera urgencia para activar mejoras ('estoy 12% abajo en margen vs. almacenes de Rosario'). Es inteligencia de mercado que antes solo tenían las cadenas grandes.",
    setup: "USD 0 (requiere pool mínimo de 15 empresas del rubro)",
    mrr: "USD 39–59/mes",
    pricingWhy:
      "USD 59 cuando el rubro es niche y el valor comparativo es alto (ej. ferretería). Requiere masa crítica; puede subsidiarse primeros 6 meses para captar datos.",
    architecture:
      "Pipeline ETL nocturno: agrega KPIs anonimizados por `rubroId` + `ciudad` en tabla `BenchmarkPool` (sin `empresaId` en output). Servicio `lib/insights/benchmark.ts` compara empresa vs. percentiles p25/p50/p75. UI: gauge + recomendaciones IA (Gemini API opcional). Cumple minimización de datos — solo métricas agregadas.",
    archBullets: [
      "Consentimiento explícito en onboarding (`optInBenchmark`)",
      "k-anonymity: no publicar si n < 15 comercios",
      "Micro-frontend `/dashboard/insights/benchmark`",
      "Informe PDF mensual auto-generado (gen recurrente)",
    ],
    feHours: 18,
    beHours: 40,
    level: "Semi-Senior",
    subDetails:
      "El desafío es el ETL agregado, no el core ERP. Puede dividirse: BE1 agregación, BE2 API comparación, FE dashboards.",
    risks: [
      "Pool insuficiente en ciudades chicas",
      "Riesgo de re-identificación si hay pocos players → umbrales estrictos",
      "Clientes paranoicos con 'compartir datos' — transparencia en UI",
    ],
  },
  {
    id: "gen.content.wa_semana",
    nombre: "Pack Semanal de Templates WhatsApp",
    pitch:
      "Cada semana llegan 5 mensajes listos para copiar/pegar o enviar masivo: promos, recordatorios de horario, pedido al distribuidor, encuesta rápida. El comerciante deja de quedar mal con clientes por 'no tener tiempo de escribir'. Aumenta recompra sin contratar community manager.",
    setup: "USD 29 (configuración de tono de marca y rubro)",
    mrr: "USD 15–25/mes",
    pricingWhy:
      "USD 15 es impulso de compra; USD 25 si incluye variaciones A/B y calendario de fechas patrias/eventos locales. Costo: generación IA + almacenamiento.",
    architecture:
      "Cron semanal + `lib/content/wa-template-generator.ts`. Prompt por `rubroId` + `locale` (es-AR, es-MX). Almacena en `ContentPack` (`empresaId`, `semana`, `templatesJson`). UI: galería en `/dashboard/contenido/whatsapp`. NO envía mensajes (diferente de `com.whatsapp` / `intang.cobranzas_wa`). Export TXT/clipboard. Opcional: integración futura con Twilio si el cliente ya tiene WhatsApp ON.",
    archBullets: [
      "Generación vía API IA (Gemini/OpenAI) con plantillas validadas",
      "Moderación: lista negra de claims falsos/precios",
      "Multi-tenant estricto por `empresaId`",
      "Enterprise: tono de voz custom en `EmpresaBrandProfile`",
    ],
    feHours: 12,
    beHours: 20,
    level: "Junior",
    subDetails:
      "Proyecto ideal para junior: CRUD + cron + UI galería. La IA es call externo encapsulado.",
    risks: [
      "Templates genéricos si el rubro es muy específico",
      "Cliente confunde pack con envío automático → UX debe aclarar",
      "Costo API IA si no se cachea por rubro",
    ],
  },
  {
    id: "gen.comply.calendario_fiscal",
    nombre: "Calendario Fiscal Personalizado",
    pitch:
      "Un calendario vivo con vencimientos de IVA, IIBB, SICORE, CIT, nómina y obligaciones según condición fiscal y provincia del cliente — con alertas 7/3/1 día antes. Evita multas de ARS 50.000+ por olvido y elimina la planilla Excel que nadie actualiza.",
    setup: "USD 49 (carga de condición fiscal y jurisdicciones)",
    mrr: "USD 22–35/mes",
    pricingWhy:
      "Diferente de `fiscal.recordatorios` (cobranza deudores): esto es compliance del propio negocio. USD 35 incluye actualización normativa mensual generada por equipo legal/IA.",
    architecture:
      "Motor de reglas `lib/compliance/fiscal-calendar.ts` por `paisFiscal` + `provincia` + `condicionIva`. Feed normativo versionado en JSON (`content/compliance/ar-2026.json`). Cron diario evalúa vencimientos → notificaciones Resend + push in-app. Tabla `ComplianceEvent` scoped `empresaId`. Micro-frontend `/dashboard/cumplimiento/calendario`. iCal export.",
    archBullets: [
      "Extensible a MX (SAT) y ES (AEAT) sin tocar core",
      "No reemplaza asesor — disclaimer legal en UI",
      "Feature flag `gen_comply_calendar`",
      "Actualización mensual del feed = entregable 'constante' de Claver",
    ],
    feHours: 14,
    beHours: 36,
    level: "Semi-Senior",
    subDetails:
      "Mantenimiento del feed normativo puede ser operación no-dev. Dev solo motor + UI + alertas.",
    risks: [
      "Cambios normativos imprevistos AFIP/ARBA",
      "Responsabilidad legal si el calendario falla — T&C claros",
      "Complejidad multi-provincia IIBB",
    ],
  },
];

// ─── 25 servicios adicionales (resumen) ───────────────────────────────────────
const ADDITIONAL = [
  ["gen.intel.pulse_diario", "Pulse Matutino KPI", "USD 0", "USD 12–18", "24h", "Cron + email Resend"],
  ["gen.intel.margen_sku", "Ranking Margen por SKU", "USD 0", "USD 18–25", "32h", "Prisma ventas + informe"],
  ["gen.intel.dead_stock", "Informe Stock Muerto", "USD 29", "USD 22–30", "40h", "Stock + aging analysis"],
  ["gen.intel.abc_clientes", "Segmentación ABC Clientes", "USD 0", "USD 20–28", "36h", "CRM + clustering simple"],
  ["gen.bench.precio_competencia", "Alertas Precio Sector", "USD 49", "USD 45–65", "56h", "Scraping/API terceros + alertas"],
  ["gen.bench.estacionalidad", "Calendario Estacional", "USD 0", "USD 18–25", "28h", "Histórico ventas por rubro"],
  ["gen.bench.ticket_promedio", "Comparativa Ticket vs Sector", "USD 0", "USD 25–35", "24h", "Benchmark pool"],
  ["gen.content.redes_rubro", "Posts Redes por Rubro", "USD 39", "USD 25–35", "30h", "IA + Canva API opcional"],
  ["gen.content.promo_flash", "Kit Promo Imprimible", "USD 19", "USD 15–22", "20h", "PDF generator + plantillas"],
  ["gen.content.menu_engineering", "Menu Engineering Report", "USD 59", "USD 35–45", "44h", "Hospitalidad + matriz BCG"],
  ["gen.content.ficha_producto", "Fichas Producto Auto", "USD 29", "USD 18–25", "32h", "Catálogo ERP + IA descripciones"],
  ["gen.comply.checklist_mensual", "Checklist Operativo Mensual", "USD 0", "USD 15–20", "18h", "Rubro templates + PDF"],
  ["gen.comply.auditoria_interna", "Mini-Auditoría Trimestral", "USD 79", "USD 40–55", "48h", "Checklist + scoring"],
  ["gen.comply.politicas_rrhh", "Plantillas Políticas RRHH", "USD 39", "USD 18–25", "22h", "Content gen + versionado"],
  ["gen.train.micro_leccion", "Micro-Lección Semanal", "USD 0", "USD 12–18", "26h", "IA + micro-frontend player"],
  ["gen.train.onboarding_cajero", "Playbook Nuevo Cajero", "USD 29", "USD 15–20", "20h", "PDF interactivo por rubro"],
  ["gen.train.sop_operativo", "SOPs Regenerables", "USD 49", "USD 25–35", "38h", "IA + diff versiones"],
  ["gen.train.simulacro_cierre", "Simulacro Cierre Caja", "USD 0", "USD 18–22", "30h", "Quiz + gamificación"],
  ["gen.optimize.pedido_sugerido", "Lista Pedido Sugerida", "USD 0", "USD 22–30", "36h", "Lectura stock + histórico"],
  ["gen.optimize.ruta_semanal", "Sugerencia Ruta Semanal", "USD 39", "USD 28–38", "42h", "Informe, no ruteador live"],
  ["gen.optimize.turnos_staff", "Plantilla Turnos por Demanda", "USD 29", "USD 20–28", "34h", "Histórico ventas por hora"],
  ["gen.optimize.combo_vendedor", "Combos para Ticket Alto", "USD 0", "USD 18–25", "28h", "Basket analysis simple"],
  ["gen.crm.cumpleanos", "Campaña Cumpleaños/Fidelidad", "USD 19", "USD 15–22", "24h", "Contenido, no reactivador auto"],
  ["gen.crm.encuesta_pulse", "Encuesta Pulse Trimestral", "USD 0", "USD 18–25", "30h", "3 preguntas, distinto de data.nps"],
  ["gen.crm.winback", "Secuencia Win-Back 90d", "USD 29", "USD 22–30", "32h", "Estrategia + copy, no cobranzas"],
];

// ─── Paquetes comerciales ─────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: "pack-pulso-dueno",
    nombre: "Pulso del Dueño",
    lema: "Los números en el desayuno, sin abrir el ERP.",
    servicios: ["gen.intel.briefing_semanal", "gen.intel.pulse_diario", "gen.intel.margen_sku"],
    mrr: "USD 49/mes",
    setup: "USD 0",
    ahorro: "18%",
  },
  {
    id: "pack-caja-futuro",
    nombre: "Caja del Futuro",
    lema: "Sabé si te alcanza la plata antes del viernes.",
    servicios: ["gen.intel.forecast_caja", "gen.intel.dead_stock", "gen.comply.calendario_fiscal"],
    mrr: "USD 89/mes",
    setup: "USD 79",
    ahorro: "22%",
  },
  {
    id: "pack-guerra-rubro",
    nombre: "Guerra de Rubro",
    lema: "Benchmark + estacionalidad + precios.",
    servicios: ["gen.bench.rubro_local", "gen.bench.estacionalidad", "gen.bench.ticket_promedio", "gen.bench.precio_competencia"],
    mrr: "USD 99/mes",
    setup: "USD 49",
    ahorro: "25%",
  },
  {
    id: "pack-vendé-más",
    nombre: "Vendé Más Sin Community Manager",
    lema: "Contenido listo cada semana.",
    servicios: ["gen.content.wa_semana", "gen.content.redes_rubro", "gen.content.promo_flash", "gen.optimize.combo_vendedor"],
    mrr: "USD 59/mes",
    setup: "USD 39",
    ahorro: "20%",
  },
  {
    id: "pack-cumplí-sin-multa",
    nombre: "Cumplí Sin Multa",
    lema: "Calendario fiscal + checklists + auditoría.",
    servicios: ["gen.comply.calendario_fiscal", "gen.comply.checklist_mensual", "gen.comply.auditoria_interna"],
    mrr: "USD 69/mes",
    setup: "USD 79",
    ahorro: "15%",
  },
  {
    id: "pack-equipo-listo",
    nombre: "Equipo Listo",
    lema: "Capacitación continua sin reunión.",
    servicios: ["gen.train.micro_leccion", "gen.train.onboarding_cajero", "gen.train.simulacro_cierre"],
    mrr: "USD 39/mes",
    setup: "USD 29",
    ahorro: "17%",
  },
  {
    id: "pack-distribuidor-pro",
    nombre: "Distribuidor Pro",
    lema: "Pedido, ruta y ABC de clientes.",
    servicios: ["gen.optimize.pedido_sugerido", "gen.optimize.ruta_semanal", "gen.intel.abc_clientes"],
    mrr: "USD 69/mes",
    setup: "USD 39",
    ahorro: "20%",
  },
  {
    id: "pack-fideliza",
    nombre: "Fidelizá en Automático",
    lema: "Cumpleaños, pulse y win-back.",
    servicios: ["gen.crm.cumpleanos", "gen.crm.encuesta_pulse", "gen.crm.winback"],
    mrr: "USD 49/mes",
    setup: "USD 29",
    ahorro: "18%",
  },
];

const EXCLUDED_SKUS = [
  "sec.*, infra.*, com.whatsapp, com.sms, com.email_tx, com.ivr, com.chat",
  "fiscal.* (firma, cert_afip, ocr, conciliacion, clavpay, recordatorios, scoring)",
  "ops.gps, ops.iot_kit, ops.qr_trace, ops.device_agent, ops.menu_qr, ops.agenda_web",
  "ops.claver_superadmin, ops.playbooks_auto, bridge.opo_studio, bridge.n8n_automations",
  "data.bi, data.reportes_prog, data.nps, data.helpdesk_ia, data.lms",
  "mkt.* (gbp, catalogo_pdf, pixel, giftcard, referidos, campanas, landing_rubro)",
  "pos.* (fiado, margen_guard, zero_waste, stock_cero, promos, almacen rosario, etc.)",
  "intang.* (cobranzas_wa, guardian_pos, reactivador, ocr_compras, ruteador, b2b_portal, delivery_hub, agenda_smart)",
  "integ.* (shopify, tienda_nube, mercado_libre, woocommerce, odoo)",
  "impl.*, releva.*, bundles existentes (Essentials, Conecta AR, Premium ERP 7, etc.)",
];

const children = [
  // Portada
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 3000, after: 400 },
    children: [new TextRun({ text: "GRUPO CLAVER", bold: true, size: 28, color: "1E3A5F" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Suite de Servicios Generables", bold: true, size: 56 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Marketplace — Entregables Recurrentes (Plug & Play)", size: 32 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: "Documento de Producto y Arquitectura", size: 28, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Versión 1.0 — Junio 2026", size: 24, color: "666666" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: "Confidencial — Uso interno comercial y técnico", size: 20, color: "999999" })],
  }),
  pb(),

  h1("Índice"),
  new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-3" }),
  pb(),

  h1("1. Resumen ejecutivo"),
  p(
    "Este documento define 30 servicios nuevos que Claver puede producir y entregar de forma constante (semanal, mensual o trimestral) para el Marketplace del ERP Claver. A diferencia de los microservicios operativos ya publicados (fiado, cobranzas WA, guardián POS, integraciones ecommerce, etc.), estos módulos son entregables de inteligencia, contenido, cumplimiento y optimización generados automáticamente a partir de los datos del tenant."
  ),
  p(
    "Modelo de negocio: suscripción base Claver + add-ons de USD 15–100/mes. Cada servicio se activa por feature flag en base de datos (`EmpresaModulo`) sin modificar el núcleo contable. Multi-tenant por `empresaId`; clientes Enterprise pueden exportarse a single-tenant premium."
  ),
  p(
    "Los primeros 5 servicios prioritarios incluyen documentación TPM exhaustiva (pitch, pricing, arquitectura, horas de subcontratación y riesgos). Los 25 restantes figuran en catálogo resumido. Se proponen 8 paquetes comerciales listos para vitrina."
  ),

  h1("2. Criterio de exclusión — catálogo existente"),
  p("NO se documentan ni duplican los siguientes SKUs/módulos ya presentes en `marketplace-catalog.ts`, `autopool-manifest.ts`, bundles y Premium ERP 7:"),
  ...EXCLUDED_SKUS.map((s) => bullet("bullets-excl", s)),
  p(
    "Nota: Los 5 módulos del brief inicial (Hub Delivery, Agenda Anti No-Shows, Portal B2B, Cobranzas IA, n8n Industrial) ya existen como `intang.delivery_hub`, `intang.agenda_smart`, `intang.b2b_portal`, `intang.cobranzas_wa` y `bridge.n8n_automations`. Este documento propone la capa de valor recurrente complementaria, no sustitutiva."
  ),

  h1("3. Arquitectura común de la suite"),
  h2("3.1 Patrón Plugin / Micro-frontend"),
  ...[
    "Tabla `EmpresaModulo` (empresaId, sku, activo, configJson, activatedAt)",
    "Layouts con `requiredModule(sku)` — no renderiza si inactivo",
    "Rutas bajo `/dashboard/insights/*`, `/dashboard/contenido/*`, `/dashboard/cumplimiento/*`",
    "API routes bajo `/api/gen/{sku}/` con `getAuthContext()` + `whereEmpresa()`",
    "Crons Vercel en `/api/cron/gen-*` con secreto `CRON_SECRET`",
  ].map((b) => bullet("bullets-arch2", b)),
  h2("3.2 Stack y proveedores"),
  table(
    ["Capa", "Tecnología", "Uso"],
    [
      ["Frontend", "Next.js 15 App Router + Tailwind + shadcn", "Micro-frontends aislados"],
      ["Estado", "SWR + Zustand (solo UI local)", "Sin tocar auth/caja core"],
      ["Datos", "Prisma → Supabase PostgreSQL", "Lectura predominante"],
      ["Email", "Resend API", "Entrega de informes y alertas"],
      ["SMS/WhatsApp envío", "Twilio (opcional, solo si cliente tiene canal)", "No incluido en packs contenido"],
      ["IA generación", "Gemini / OpenAI API", "Templates, SOPs, descripciones"],
      ["PDF", "@react-pdf/renderer o HTML→PDF", "Briefings, kits promo"],
      ["Automación externa", "n8n (instancia Claver Cloud)", "Exportaciones custom Enterprise"],
    ],
    [2200, 2800, 4360]
  ),
  p(""),
  h2("3.3 Convención de SKUs nuevos"),
  p("Prefijo `gen.` (generable) + familia + nombre: `gen.intel.*`, `gen.bench.*`, `gen.content.*`, `gen.comply.*`, `gen.train.*`, `gen.optimize.*`, `gen.crm.*`"),

  pb(),
  h1("4. Servicios prioritarios — documentación TPM completa"),
  p("Detalle exhaustivo de los 5 módulos de mayor ROI y menor dependencia de terceros."),
  ...PRIORITY.flatMap(serviceBlock),

  pb(),
  h1("5. Catálogo extendido — 25 servicios adicionales"),
  p("Resumen para planificación de roadmap. Cada uno recibirá ficha TPM en fase 2."),
  table(
    ["SKU", "Nombre", "Setup", "MRR", "Horas dev", "Stack principal"],
    ADDITIONAL,
    [2200, 1800, 900, 900, 800, 2660]
  ),
  p(""),

  pb(),
  h1("6. Paquetes comerciales (8 pools)"),
  p("Bundles de entregables recurrentes — publicables en Marketplace junto a pools existentes."),
  ...PACKAGES.flatMap((pack) => [
    h2(`${pack.nombre} (${pack.id})`),
    p(`"${pack.lema}"`),
    p(`Servicios incluidos: ${pack.servicios.join(", ")}`),
    p(`Setup pack: ${pack.setup} | MRR pack: ${pack.mrr} | Ahorro vs. individual: ${pack.ahorro}`),
    p(""),
  ]),

  pb(),
  h1("7. Roadmap de implementación sugerido"),
  table(
    ["Fase", "Duración", "Entregables", "Esfuerzo"],
    [
      ["Fase 1 — Quick wins", "4–6 semanas", "briefing_semanal, pulse_diario, wa_semana, calendario_fiscal", "~120h"],
      ["Fase 2 — Inteligencia", "6–8 semanas", "forecast_caja, benchmark, dead_stock, abc_clientes", "~150h"],
      ["Fase 3 — Contenido & CRM", "4–6 semanas", "redes_rubro, promo_flash, crm.*, train.*", "~130h"],
      ["Fase 4 — Optimización", "4 semanas", "pedido_sugerido, ruta_semanal, turnos, combos", "~110h"],
      ["Fase 5 — Marketplace", "2 semanas", "Seeds SKUs, bundles, provisioning, vitrina", "~40h"],
    ],
    [1800, 1400, 4160, 2000]
  ),
  p(""),

  h1("8. Métricas de éxito"),
  ...[
    "Activación: % empresas con ≥1 módulo `gen.*` activo a los 30 días",
    "Retención: churn mensual < 5% en packs recurrentes",
    "Margen bruto: > 75% (costo marginal bajo — crons + IA cacheada)",
    "NPS del add-on: encuesta `gen.crm.encuesta_pulse` post-entrega",
    "Tiempo a valor: primer informe entregado < 24h post-activación",
  ].map((b) => bullet("bullets-metrics", b)),

  h1("9. Próximos pasos"),
  ...[
    "Validar pricing con 10 clientes piloto (almacén, distribuidor, restaurante)",
    "Crear seeds en `marketplace-catalog.ts` con familia `gen.*`",
    "Implementar Fase 1 con desarrollador subcontratado (briefing + calendario)",
    "Definir feed normativo AR Q3 2026 para calendario fiscal",
    "Documentar TPM fase 2 para servicios 6–30 bajo demanda",
  ].map((b) => bullet("bullets-next", b)),
];

const doc = new Document({
  creator: "Claver TPM",
  title: "Servicios Nuevos Paquetes Claver",
  description: "Suite de 30 servicios generables recurrentes para Marketplace Claver",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2D4A6F" },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets-excl",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "bullets-arch",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "bullets-arch2",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "bullets-risk",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "bullets-metrics",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "bullets-next",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Claver — Servicios Generables v1.0", size: 18, color: "999999" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Página ", size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                new TextRun({ text: " de ", size: 18 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  console.log("OK:", OUT, buffer.length, "bytes");
});
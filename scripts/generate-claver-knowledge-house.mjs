import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
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
  TableOfContents,
  PageBreak,
} from "docx"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, "..", "docs", "CLAVER_KNOWLEDGE_HOUSE_SEGMENTOS.docx")

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
const borders = { top: border, bottom: border, left: border, right: border }
const TABLE_W = 9360

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] })
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] })
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] })
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })] })
}
function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun(text)],
  })
}
function spacer() {
  return new Paragraph({ children: [] })
}

function table(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: "0F172A", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
          }),
        ],
      })
    ),
  })
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, i) =>
            new TableCell({
              borders,
              width: { size: colWidths[i], type: WidthType.DXA },
              shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun(String(cell))] })],
            })
        ),
      })
  )
  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  })
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "0F172A" },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1D4ED8" },
        paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "334155" },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
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
                new TextRun({ text: "Grupo Claver — Knowledge House", italics: true, size: 18, color: "64748B" }),
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
                new TextRun({ text: "Confidencial — Uso interno y comercial | Página ", size: 18, color: "64748B" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "64748B" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Portada
        new Paragraph({
          spacing: { before: 2400 },
          children: [
            new TextRun({ text: "GRUPO CLAVER", bold: true, size: 56, color: "0F172A" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Knowledge House — Segmentos de Servicios",
              size: 36,
              color: "1D4ED8",
            }),
          ],
        }),
        spacer(),
        p("Documento maestro de líneas de negocio, verticales, módulos y servicios profesionales del conglomerado Claver.", {
          italics: true,
          color: "64748B",
        }),
        p("Versión 1.0 — Junio 2026 | claver.com.ar", { color: "64748B" }),
        spacer(),
        p("Nota de marca: Claver es la matriz (conglomerado). Clavis es el producto ERP flagship. Este documento describe el paraguas Claver, no solo Clavis.", {
          bold: true,
        }),

        new Paragraph({ children: [new PageBreak()] }),

        new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // 1. Visión
        h1("1. Visión del conglomerado"),
        p(
          "Grupo Claver es un conglomerado de tecnología argentina que ordena la operación de PyMEs y empresas medianas mediante sistemas SaaS, servicios de implementación y capas de inteligencia artificial. Su propuesta central: un ecosistema integrado donde cada línea resuelve un problema específico y, en conjunto, cubre el ciclo completo comercial-operativo-fiscal."
        ),
        spacer(),
        table(
          ["Concepto", "Definición"],
          [
            ["Claver (matriz)", "Paraguas corporativo: sistemas, servicios e implementación para Argentina"],
            ["Clavis (producto)", "ERP & POS flagship con facturación AFIP — 40+ módulos"],
            ["Claver Cloud", "Plataforma multi-tenant de aprovisionamiento, ops e implementación (metodología CCA)"],
            ["Clav Consult", "Brazo humano: parametrización, migración, capacitación y soporte"],
          ],
          [2800, 6560]
        ),
        spacer(),
        p("Tagline corporativo: «Tecnología que ordena tu negocio.»", { italics: true }),

        // 2. Líneas de negocio
        h1("2. Líneas de negocio del grupo"),
        p("Seis líneas estructuran la oferta comercial de Claver. Cada una puede operar de forma independiente o como add-on del ecosistema."),

        h2("2.1 Clavis — ERP & POS con AFIP"),
        p("Estado: Disponible | Producto flagship"),
        bullet("Sistema integral: ventas, stock, compras, caja, contabilidad, ecommerce, logística, industria y agro"),
        bullet("40+ módulos con onboarding inteligente por rubro"),
        bullet("POS táctil + factura electrónica CAE/CAEA"),
        bullet("Stock multi-depósito unificado entre canales"),
        bullet("Portal B2B y tienda online nativa"),
        bullet("Multi-tenant con aislamiento por empresaId"),

        h2("2.2 ClavPay — Cobros y conciliación"),
        p("Estado: Beta"),
        bullet("Mercado Pago, QR dinámico, links de pago y tarjetas"),
        bullet("Conciliación automática diaria con caja y ERP"),
        bullet("Add-on nativo de Clavis; roadmap como servicio standalone"),

        h2("2.3 ClavLog — Logística y distribución"),
        p("Estado: Próximamente"),
        bullet("Hojas de ruta con paradas ordenadas y ventanas horarias"),
        bullet("POD (Proof of Delivery) con firma, foto y geolocalización"),
        bullet("App vendedor en ruta con operación offline"),
        bullet("Circuito completo: pedido → picking → remito → entrega → cobro"),

        h2("2.4 ClavAI — Inteligencia operativa"),
        p("Estado: Beta"),
        bullet("Asistente conversacional embebido en el ERP"),
        bullet("Onboarding IA por rubro en ~5 minutos"),
        bullet("Morning Commander — agentes de operaciones automatizados"),
        bullet("Automation Hub + n8n: playbooks y empleados virtuales"),
        bullet("Alertas inteligentes configurables por rol"),

        h2("2.5 Clav Consult — Implementación y soporte"),
        p("Estado: Disponible"),
        bullet("Homologación y producción AFIP"),
        bullet("Migración de datos (CSV, legados, planillas)"),
        bullet("Capacitación por rubro y rol (cajero, dueño, contador)"),
        bullet("Metodología CCA (Claver Cloud Activation)"),
        bullet("Dossier por cliente, UAT, go-live e hipercare"),

        h2("2.6 Clav Analytics — BI y tableros ejecutivos"),
        p("Estado: Próximamente"),
        bullet("KPIs en tiempo real extraídos del ERP"),
        bullet("Alertas por umbral y dashboards por rol"),
        bullet("Export ejecutivo y reportes monetizables"),

        spacer(),
        table(
          ["Línea", "Estado", "Público objetivo"],
          [
            ["Clavis", "Disponible", "Comercios, distribuidoras, industria, agro"],
            ["ClavPay", "Beta", "Todo cliente que cobra con medios digitales"],
            ["ClavLog", "Próximamente", "Distribuidoras con flota y reparto"],
            ["ClavAI", "Beta", "Operaciones que buscan automatización"],
            ["Clav Consult", "Disponible", "Implementaciones y soporte dedicado"],
            ["Clav Analytics", "Próximamente", "Dueños, gerentes, contadores"],
          ],
          [2200, 1800, 5360]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // 3. Claver Cloud
        h1("3. Claver Cloud — Plataforma de servicios"),
        p(
          "Claver Cloud es la consola operativa multi-tenant que habilita el ciclo venta → aprovisionamiento → parametrización → UAT → go-live → hipercare. Equivalente funcional a TOTVS MIT + TCloud ONBOARD."
        ),
        h3("Servicios de plataforma"),
        bullet("Aprovisionamiento automático de tenants (empresaId, URL, admin, entornos)"),
        bullet("Flota multi-tenant: monitoreo, healthcheck y jobs ops"),
        bullet("Torre de implementaciones con trazabilidad CCA-001 a CCA-080"),
        bullet("Asignación de analistas por cliente"),
        bullet("Pack ONBOARD con credenciales y checklist go-live"),
        bullet("Notificaciones ops: jobs fallidos, SLA vencido, entornos caídos"),
        bullet("Reportes de métricas de flota y monetización BI"),

        h3("Planes de hosting"),
        table(
          ["Plan", "Descripción"],
          [
            ["Shared", "Multi-tenant en infraestructura compartida (Vercel + Supabase)"],
            ["Dedicated", "Entorno aislado para clientes Enterprise"],
          ],
          [2800, 6560]
        ),

        // 4. Segmentos verticales
        h1("4. Segmentos verticales (soluciones por industria)"),
        p("Clavis se comercializa con landings y onboarding específicos por vertical. Cada segmento activa módulos, maestros y flujos adaptados al rubro."),

        h2("4.1 Retail y comercio (POS & AFIP)"),
        p("ICP: Comercios minoristas, kioscos, ferreterías, farmacias — 1 a 5 puntos de venta."),
        bullet("POS táctil con atajos y modo foco"),
        bullet("AFIP nativo: CAE, CAEA contingencia, MiPyME FCE"),
        bullet("Motor de precios por cliente y canal"),
        bullet("Cierre X/Z y arqueo integrado"),

        h2("4.2 Ecommerce y omnicanal"),
        p("ICP: Distribuidoras, mayoristas, retailers con web, Instagram o Mercado Libre."),
        bullet("Tienda B2C con stock en tiempo real"),
        bullet("Portal B2B con login por CUIT"),
        bullet("Checkout → picking → remito → factura"),
        bullet("Integraciones: Mercado Libre, Mercado Pago, WhatsApp"),

        h2("4.3 Distribución y logística"),
        p("ICP: Distribuidoras de alimentos, bebidas, ferretería, repuestos."),
        bullet("App vendedor en ruta (preventa y cobranza)"),
        bullet("Hojas de ruta y POD"),
        bullet("Picking + remito antes del despacho"),
        bullet("Control de morosidad pre-despacho"),

        h2("4.4 Hospitalidad (restaurantes y bares)"),
        p("ICP: Bares, restaurants, cafeterías, dark kitchens."),
        bullet("Mesas, comandas y división de cuenta"),
        bullet("KDS (Kitchen Display System)"),
        bullet("Recetas BOM con food cost"),
        bullet("POS + AFIP al cerrar mesa"),

        h2("4.5 Industria y manufactura"),
        p("ICP: Fabricantes livianos, alimentos procesados, talleres con BOM."),
        bullet("BOM multi-nivel y órdenes de producción"),
        bullet("MRP — planificación de requerimientos"),
        bullet("Control de calidad e inspecciones"),
        bullet("Mantenimiento preventivo"),

        h2("4.6 Agro y acopio"),
        p("ICP: Acopios, corredores, productores medianos — cereales y oleaginosas."),
        bullet("Balanza digital de camiones"),
        bullet("Contratos, pizarra BCR/Chicago"),
        bullet("Liquidaciones con retenciones"),
        bullet("Carta de porte (CPE)"),
        bullet("IoT agrícola: sensores, riego, maquinaria, NDVI"),

        h2("4.7 Partners contadores"),
        p("ICP: Estudios contables, consultores impositivos PyME."),
        bullet("Programa de referidos con comisión 20% primer año"),
        bullet("Rol contador con dashboard fiscal"),
        bullet("Export CITI / Libro IVA"),
        bullet("Multi-cliente aislado por tenant"),
        bullet("White-label en plan Enterprise partner"),

        new Paragraph({ children: [new PageBreak()] }),

        // 5. Rubros con onboarding IA
        h1("5. Rubros con onboarding IA (14 segmentos)"),
        p("El motor de configuración por rubro activa automáticamente módulos, oculta irrelevantes y precarga maestros específicos."),
        table(
          ["Rubro", "Módulos clave"],
          [
            ["Salón de belleza / Spa", "Agenda, turnos, comisiones, membresías, POS"],
            ["Bar / Restaurant", "Mesas, KDS, recetas, POS, stock"],
            ["Kiosco / Almacén", "POS, stock básico, AFIP, caja"],
            ["Ferretería / Pinturería", "POS, CC constructores, listas de precio, fórmulas color"],
            ["Distribuidora", "Logística, app ruta, picking, portal B2B"],
            ["Farmacia", "Lotes, vencimientos, controlados, agenda entregas"],
            ["Veterinaria", "Historia clínica, agenda, stock, POS"],
            ["Clínica / Salud", "Historia clínica, agenda, facturación"],
            ["Gimnasio", "Membresías, cobros recurrentes, agenda"],
            ["Industria", "BOM, MRP, producción, calidad"],
            ["Acopio / Agro", "Balanza, contratos, liquidaciones, IoT"],
            ["Indumentaria", "Variantes, talles, ecommerce"],
            ["Librería", "ISBN, POS, stock categorizado"],
            ["Estación de servicio", "POS, turnos, stock combustibles"],
          ],
          [3200, 6160]
        ),

        h2("5.1 Servicios especializados por rubro"),
        bullet("Distribuidora de bebidas: rutas, devoluciones envase, listas por canal"),
        bullet("Veterinaria: fichas clínicas, vacunas, internación"),
        bullet("Carnicería: productos pesables, lotes, trazabilidad"),
        bullet("Peluquería: comisiones por profesional, paquetes prepagos"),

        // 6. Categorías de módulos
        h1("6. Catálogo funcional — 40+ módulos en 15 categorías"),
        table(
          ["Categoría", "Alcance"],
          [
            ["Ventas & POS", "Mostrador, facturación, cierre de turno, motor de precios"],
            ["Stock & Depósito", "Inventario, transferencias, picking, alertas"],
            ["Compras", "OC, recepción, proveedores, cuentas a pagar"],
            ["Financiero", "Caja, banco, tesorería, Mercado Pago"],
            ["Contabilidad", "Plan de cuentas, balances, centros de costo"],
            ["Fiscal / AFIP", "IVA, IIBB, CITI, CAEA, MiPyME FCE"],
            ["Ecommerce & Canales", "Tienda B2C, portal B2B, ML, WhatsApp"],
            ["Logística & Distribución", "Rutas, POD, app vendedor, envíos"],
            ["Industria & Producción", "BOM, MRP, calidad, mantenimiento"],
            ["Agro / Acopio", "Balanza, contratos, liquidaciones, CPE"],
            ["Servicios por Rubro", "Hospitalidad, salud, belleza, membresías"],
            ["Gestión Comercial", "CRM, KPIs, aprobaciones, alertas"],
            ["RRHH", "Legajos, liquidación sueldos, permisos"],
            ["IoT & Automatización", "Sensores, n8n, webhooks, playbooks"],
            ["IA", "Onboarding, asistente, Morning Commander"],
            ["Capacitación & Soporte", "Docs embebidas, tickets, diagnóstico gaps"],
          ],
          [3200, 6160]
        ),

        // 7. Add-ons y monetización
        h1("7. Modelo comercial y add-ons"),
        h2("7.1 Planes SaaS Clavis (ARS/mes)"),
        table(
          ["Plan", "Precio", "Incluye"],
          [
            ["Starter", "$29.900", "POS, AFIP, stock, 3 usuarios, soporte email"],
            ["Pro", "$49.900", "Starter + ecommerce, onboarding IA, KPIs, 10 usuarios"],
            ["Enterprise", "$89.900", "Multi-sucursal, agro/industria, SLA, usuarios ilimitados"],
          ],
          [1800, 1800, 5760]
        ),
        spacer(),
        h2("7.2 Add-ons opcionales"),
        table(
          ["Add-on", "Precio mensual"],
          [
            ["Mercado Pago", "$9.900"],
            ["Mercado Libre", "$14.900"],
            ["WhatsApp Business", "$7.900"],
            ["Automation Hub", "$29.900"],
            ["Morning Commander IA", "$19.900"],
          ],
          [4680, 4680]
        ),
        spacer(),
        h2("7.3 Servicios profesionales (Clav Consult)"),
        bullet("Implementación asistida (incluida Pro, extendida Enterprise)"),
        bullet("Migración de datos y homologación AFIP"),
        bullet("Capacitación por rubro y rol"),
        bullet("Reportes BI y dossier de readiness (monetización consultiva)"),
        bullet("Trial 14 días sin permanencia mínima"),

        // 8. Integraciones
        h1("8. Ecosistema de integraciones"),
        bullet("AFIP: factura electrónica, padrón, WSCDC, CAEA, CITI"),
        bullet("Mercado Pago: QR, links, webhooks de conciliación"),
        bullet("Mercado Libre: catálogo y pedidos sincronizados"),
        bullet("WhatsApp / Twilio: confirmación pedidos y comprobantes"),
        bullet("Resend: emails transaccionales"),
        bullet("n8n: automatizaciones sin código"),
        bullet("IoT: ingest de sensores, balanzas, maquinaria agrícola"),
        bullet("Supabase / PostgreSQL: base multi-tenant"),
        bullet("Partners contadores: export fiscal y rol dedicado"),

        // 9. Roadmap
        h1("9. Roadmap del conglomerado 2026"),
        table(
          ["Fase", "Trimestre", "Hitos"],
          [
            [
              "Fase 1 — Identidad Grupo",
              "Q2 2026",
              "Marca Claver + Clavis, hub /claver, kit partners contadores",
            ],
            [
              "Fase 2 — Clavis comercial",
              "Q2 2026",
              "Landings verticales, catálogo 40+ módulos, demo por rubro",
            ],
            [
              "Fase 3 — Nuevas líneas",
              "Q3 2026",
              "ClavPay / ClavLog públicos, referidos 20%, Google Ads vertical",
            ],
            [
              "Fase 4 — Conglomerado LATAM",
              "Q4 2026",
              "Clav Consult expandido, white-label partners, fiscal regional",
            ],
          ],
          [2400, 1200, 5760]
        ),

        // 10. Matriz resumen
        h1("10. Matriz resumen — ¿Qué línea cubre qué necesidad?"),
        table(
          ["Necesidad del cliente", "Línea Claver", "Producto / Servicio"],
          [
            ["Facturar y vender en mostrador", "Clavis", "POS + AFIP"],
            ["Vender online y mayorista", "Clavis", "Ecommerce + Portal B2B"],
            ["Repartir y cobrar en calle", "ClavLog + Clavis", "App ruta + distribución"],
            ["Cobrar con QR y tarjetas", "ClavPay", "Mercado Pago integrado"],
            ["Producir con BOM y MRP", "Clavis", "Módulo Industria"],
            ["Acopiar granos y liquidar", "Clavis", "Módulo Agro"],
            ["Automatizar operaciones", "ClavAI", "IA + n8n + agentes"],
            ["Implementar y capacitar", "Clav Consult", "CCA + soporte"],
            ["Ver KPIs ejecutivos", "Clav Analytics", "BI y tableros"],
            ["Alojar y operar el tenant", "Claver Cloud", "Plataforma ops multi-tenant"],
            ["Presentar IVA y CITI", "Clavis + Clav Consult", "Fiscal + partner contador"],
          ],
          [3200, 2200, 3960]
        ),

        spacer(),
        h2("Contacto y referencias"),
        p("Hub matriz: https://claver.com.ar/claver"),
        p("Producto ERP: https://claver.com.ar/claver/claverp"),
        p("Catálogo módulos: https://claver.com.ar/claver/claverp/modulos"),
        p("Claver Cloud: consola interna /claver-cloud"),
        spacer(),
        p("— Fin del documento Knowledge House — Grupo Claver", { italics: true, color: "64748B" }),
      ],
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, buffer)
console.log("Generado:", OUT)
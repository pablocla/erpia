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
const OUT = path.join(__dirname, "..", "docs", "GRUPO_CLAVER_PRESENTACION_INVERSIONISTAS.docx")

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

/** Fila problema → solución → producto (tabla inversores) */
function painTable(rows) {
  return table(["Problema del cliente", "Cómo lo resuelve Claver", "Producto"], rows, [2800, 4200, 2360])
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
                new TextRun({
                  text: "Grupo Claver — Confidencial — Inversionistas",
                  italics: true,
                  size: 18,
                  color: "64748B",
                }),
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
                new TextRun({
                  text: "Documento confidencial — No distribuir sin autorización | Página ",
                  size: 18,
                  color: "64748B",
                }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "64748B" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ── PORTADA ──
        new Paragraph({
          spacing: { before: 2200 },
          children: [new TextRun({ text: "GRUPO CLAVER", bold: true, size: 60, color: "0F172A" })],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Presentación para Inversionistas",
              size: 40,
              color: "1D4ED8",
            }),
          ],
        }),
        spacer(),
        p("Conglomerado de tecnología SaaS para PyMEs argentinas", { size: 28, color: "334155" }),
        p("Todos los problemas que resolvemos — productos, mercado y modelo de negocio", {
          italics: true,
          color: "64748B",
        }),
        spacer(),
        spacer(),
        table(
          ["", ""],
          [
            ["Versión", "1.0 — Junio 2026"],
            ["Clasificación", "Confidencial — Uso exclusivo inversionistas"],
            ["Contacto", "claver.com.ar"],
            ["Producto flagship", "Clavis — ERP & POS con AFIP"],
          ],
          [3200, 6160]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── 1. RESUMEN EJECUTIVO ──
        h1("1. Resumen ejecutivo"),
        p(
          "Grupo Claver es un conglomerado de tecnología argentina que unifica en un solo ecosistema lo que hoy las PyMEs resuelven con tres a cinco sistemas distintos: facturación fiscal, punto de venta, stock, e-commerce, logística, cobranzas y contabilidad. Nuestra tesis de inversión es simple: capturar la expansión de ARPU recurrente sobre una base ERP obligatoria, monetizando cada dolor operativo como add-on activable en minutos desde el marketplace propio."
        ),
        spacer(),
        table(
          ["Pilar", "Descripción"],
          [
            ["Problema", "Más de 600.000 comercios y PyMEs operan con software fragmentado, doble carga de datos y riesgo fiscal permanente"],
            ["Solución", "Ecosistema integrado: Clavis (ERP) + Claver Cloud (ops) + Marketplace (51 SKUs auto-provisionables)"],
            ["Modelo", "SaaS recurrente en ARS + add-ons + implementación one-shot + servicios intangibles de alto margen"],
            ["Diferenciador", "AFIP nativo, multi-tenant, activación automática en minutos, contexto Argentina (IVA, IIBB, CAEA, fiado)"],
            ["Expansión", "Land-and-expand: enganche de bajo ticket → ERP Core → bundles omnicanal → Premium ERP 7"],
          ],
          [2400, 6960]
        ),
        spacer(),
        p("Tagline: «Tecnología que ordena tu negocio.»", { italics: true, bold: true }),

        // ── 2. EL PROBLEMA MACRO ──
        h1("2. El problema que enfrentan nuestros clientes"),
        p(
          "Las PyMEs argentinas pierden margen, tiempo y tranquilidad fiscal por causas estructurales que ningún sistema aislado resuelve por completo. Claver ataca cada uno de estos dolores con un producto específico dentro del conglomerado."
        ),
        spacer(),
        painTable([
          [
            "Usan 3–5 sistemas que no se hablan (facturador, Excel, ML, WhatsApp)",
            "Un solo ERP con stock unificado y factura en el mismo evento de venta",
            "Clavis Core",
          ],
          [
            "Miedo constante a AFIP: CAE vencido, libros desactualizados, apócrifos",
            "Facturación electrónica nativa, CAE/CAEA, CITI y bloqueo de proveedores apócrifos",
            "Clavis + Fiscal",
          ],
          [
            "Venden en ML y mostrador pero el stock no coincide — quiebres y sobrestock",
            "Sincronización multicanal en tiempo real entre POS, web y marketplaces",
            "Clavis Omnicanal",
          ],
          [
            "No pueden pagar consultoras SAP/Odoo pero necesitan automatización enterprise",
            "7 servicios intangibles Premium (conciliación, OCR, guardián POS, JIT) activables en minutos",
            "Claver AutoPool",
          ],
          [
            "Implementación de ERP tarda meses y el negocio sigue operando en paralelo",
            "Metodología CCA: aprovisionamiento automático, UAT y go-live en 7–14 días",
            "Claver Cloud + Clav Consult",
          ],
          [
            "Almacenes de barrio operan con cuaderno, fiado sin límite y listas de distribuidora a mano",
            "18 módulos POS especializados + libreta fiado + cobranzas WhatsApp",
            "Pack Almacén Rosario",
          ],
          [
            "Dueños no ven KPIs — se enteran del problema cuando ya perdieron plata",
            "Alertas, dashboards y agentes IA con Morning Commander y playbooks automáticos",
            "ClavAI + Clav Analytics",
          ],
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        // ── 3. CONGLOMERADO ──
        h1("3. Arquitectura del conglomerado Grupo Claver"),
        p(
          "Claver es la matriz (conglomerado). Clavis es el producto ERP flagship. Alrededor orbitan líneas complementarias, la plataforma cloud de operaciones y un marketplace de 51 servicios auto-provisionables."
        ),
        spacer(),
        table(
          ["Entidad", "Rol", "Estado"],
          [
            ["Grupo Claver", "Paraguas corporativo — sistemas, servicios e implementación", "Activo"],
            ["Clavis", "ERP & POS con 40+ módulos y AFIP nativo", "Disponible"],
            ["Claver Cloud", "Multi-tenant: aprovisionamiento, ops, implementación CCA", "Disponible"],
            ["Claver Apps Marketplace", "51 SKUs, bundles, AutoPool — activación en minutos", "Disponible"],
            ["ClavPay", "Cobros QR, links, conciliación con caja", "Beta"],
            ["ClavLog", "Rutas, POD, app vendedor en ruta", "Próximamente"],
            ["ClavAI", "Asistente IA, n8n, onboarding inteligente, agentes", "Beta"],
            ["Clav Consult", "Homologación AFIP, migración, capacitación", "Disponible"],
            ["Clav Analytics", "BI, KPIs ejecutivos, alertas por umbral", "Próximamente"],
          ],
          [2200, 5160, 2000]
        ),

        h2("3.1 Las seis líneas de negocio"),
        h3("Clavis — ERP & POS con AFIP"),
        bullet("40+ módulos: ventas, stock, compras, caja, contabilidad, ecommerce, logística, industria, agro"),
        bullet("POS táctil con factura CAE en menos de 30 segundos"),
        bullet("Onboarding IA por rubro en 14 verticales (kiosco, distribuidora, industria, agro, etc.)"),

        h3("ClavPay — Cobros y conciliación"),
        bullet("Problema: plata retenida en procesadoras, comisiones fantasmas, caja desfasada"),
        bullet("Solución: QR Mercado Pago, links de pago y conciliación diaria automática con el ERP"),

        h3("ClavLog — Logística y distribución"),
        bullet("Problema: rutas ineficientes, clientes llamando por horario, sin trazabilidad de entrega"),
        bullet("Solución: hojas de ruta, POD con geo, app vendedor offline, circuito pedido→entrega→cobro"),

        h3("ClavAI — Inteligencia operativa"),
        bullet("Problema: decisiones reactivas, carga manual de datos, sin alertas proactivas"),
        bullet("Solución: asistente embebido, OCR de facturas, playbooks n8n, alertas por rol"),

        h3("Clav Consult — Implementación y soporte"),
        bullet("Problema: miedo a migrar, parametrización AFIP compleja, capacitación del equipo"),
        bullet("Solución: metodología CCA, homologación, migración CSV, capacitación por rubro"),

        h3("Clav Analytics — BI ejecutivo"),
        bullet("Problema: dueños y contadores sin visibilidad consolidada del negocio"),
        bullet("Solución: KPIs en tiempo real, alertas por umbral, export ejecutivo"),

        // ── 4. MAPA MAESTRO DE DOLORES ──
        new Paragraph({ children: [new PageBreak()] }),
        h1("4. Mapa maestro: cada problema y su producto"),
        p(
          "Esta sección es el núcleo de la propuesta de valor. Cada fila representa un dolor real de mercado, la solución Claver y el vehículo comercial que lo monetiza."
        ),

        h2("4.1 Operación diaria y punto de venta"),
        painTable([
          ["Cajero lento — pierde ventas en hora pico", "POS táctil con atajos F12, modo foco y catálogo por grupos", "Clavis POS"],
          ["Factura tarda y el cliente se va", "CAE AFIP en <30 seg integrado al cierre de venta", "Clavis + AFIP"],
          ["Sin internet no puedo facturar", "Contingencia CAEA offline con sync IndexedDB", "Clavis POS"],
          ["Robo hormiga: anulaciones y descuentos sospechosos", "Score diario ALTO/MEDIO/BAJO + alerta WhatsApp al dueño", "Guardián de Caja POS"],
          ["Arqueo donde el cajero ve el saldo antes de contar", "Arqueo ciego — solo el dueño ve diferencias", "Pack Almacén Rosario"],
          ["Vende debajo del costo cuando sube la lista", "Bloqueo automático bajo margen mínimo configurable", "Guardián de Margen"],
          ["Mercadería por vencer sin plan", "Alertas de vencimiento + motor de descuentos Zero Waste", "Zero Waste"],
          ["Vende con stock 0 y el dueño se entera tarde", "Bloqueo o alerta en POS al intentar vender sin stock", "Alerta Stock Cero"],
        ]),

        h2("4.2 Fiscal, contable y tributario"),
        painTable([
          [
            "Percepciones IVA/IIBB olvidadas — pierde crédito fiscal",
            "Bot fiscal con padrones diarios y pre-carga de crédito",
            "Recuperador Retenciones",
          ],
          [
            "Paga a proveedores apócrifos sin saberlo",
            "Bloqueo automático contra padrón AFIP actualizado",
            "Recuperador Retenciones",
          ],
          [
            "Libro IVA y CITI en Excel el día antes del vencimiento",
            "Exportadores listos para AFIP desde el ERP",
            "Clavis Fiscal",
          ],
          [
            "Contador pide datos en planillas cada mes",
            "Rol contador multi-cliente con export fiscal y dashboard",
            "Clavis + Partners",
          ],
          [
            "Horas cargando facturas de compra manualmente",
            "OCR con IA: mail compras@ → borrador OC automático",
            "OCR Compras Proveedores",
          ],
        ]),

        h2("4.3 Omnicanal, ecommerce y marketplaces"),
        painTable([
          [
            "Pedidos de ML/Tienda Nube se cargan a mano en el ERP",
            "Sync automática pedidos → stock → factura",
            "Clavis Omnicanal",
          ],
          [
            "Publicó en ML y se quedó sin stock en mostrador",
            "Stock único descontado en todos los canales al instante",
            "Marketplace Pro / Omnicanal",
          ],
          [
            "Mayorista consulta precios por teléfono",
            "Portal B2B con login CUIT, lista de precios y pedidos online",
            "Clavis Portal B2B",
          ],
          [
            "Cliente mayorista dejó de comprar — nadie lo notó",
            "IA sobre frecuencia histórica + alerta de retención WA/SMS",
            "Reactivador B2B",
          ],
          [
            "No sabe qué canal le deja más margen",
            "KPIs por canal y motor de precios por cliente/canal",
            "Clavis + Analytics",
          ],
        ]),

        h2("4.4 Cobranzas, fiado y tesorería"),
        painTable([
          [
            "Fiado en cuaderno sin límite — deuda incobrable",
            "Libreta digital con tope por cliente y alerta al vecino",
            "Libreta Fiado Barrio",
          ],
          [
            "Cobrar deudas lleva horas de llamadas",
            "Link de pago automático por WhatsApp — el link cobra solo",
            "Cobranzas WA",
          ],
          [
            "Comisiones fantasmas en liquidación MP/tarjetas",
            "Conciliador que cruza ventas POS vs liquidaciones reales",
            "Conciliador Liquidación",
          ],
          [
            "Cheques en cartera que vencen sin aviso",
            "Alertas de vencimiento y cartera trazable",
            "Cheques en Cartera",
          ],
          [
            "Vales en papel sin control de saldo",
            "Vale de dinero digital con saldo y trazabilidad en caja",
            "Vale de Dinero",
          ],
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        h2("4.5 Stock, compras y abastecimiento"),
        painTable([
          [
            "Quiebres de stock y capital muerto en depósito",
            "Reponedor JIT: velocidad de venta + lead time → OC sugerida",
            "Reponedor JIT",
          ],
          [
            "Actualiza precios a mano desde Excel de distribuidora",
            "Importador de listas con mapeo automático de SKUs",
            "Importador Listas",
          ],
          [
            "Inventario completo frena el mostrador un día entero",
            "Inventario express por sector sin cerrar la tienda",
            "Inventario Express",
          ],
          [
            "Roturas y mermas que no bajan stock",
            "Registro de mermas con impacto automático en inventario",
            "Mermas y Roturas",
          ],
          [
            "Pedido urgente al reparto de distribuidora a las corridas",
            "Pedido express con plantilla y envío al reparto",
            "Pedido Distribuidora",
          ],
        ]),

        h2("4.6 Logística, envíos y distribución"),
        painTable([
          [
            "Cotiza envíos en 3 portales distintos",
            "Andreani + OCA + Correo Argentino en un panel del ERP",
            "Clavis Envíos Pro",
          ],
          [
            "Cliente pregunta «¿dónde está mi pedido?» todo el día",
            "Tracking automático por WhatsApp al despachar",
            "Clavis Comunica",
          ],
          [
            "Chofer con rutas ineficientes — más combustible, menos entregas",
            "Ruteador con paradas ordenadas y notificador de ventanas horarias",
            "Ruteador de Entregas",
          ],
          [
            "Vendedor en calle sin sistema — preventa en papel",
            "App vendedor en ruta con operación offline y sync",
            "ClavLog + Clavis",
          ],
          [
            "Despacha sin picking — errores y devoluciones",
            "Lista de picking automática desde pedidos confirmados",
            "Clavis Picking",
          ],
        ]),

        h2("4.7 Industria, producción y agro"),
        painTable([
          [
            "Pedido de venta no se convierte en orden de fabricación",
            "BOM multi-nivel + órdenes de producción + MRP",
            "Clavis Industria",
          ],
          [
            "No sabe cuánto comprar para la próxima temporada",
            "MRP con inventario de seguridad y sugerencias de OC",
            "Clavis Industria",
          ],
          [
            "Pesada de camiones en planilla — errores en liquidación",
            "Balanza digital integrada + telemetría IoT de campo",
            "Clavis Agro"],
          [
            "Liquidaciones de granos con retenciones mal calculadas",
            "Motor de liquidaciones con retenciones AFIP automáticas",
            "Clavis Agro"],
          [
            "No ve estado del cultivo hasta recorrer el campo",
            "Mapas NDVI satelitales integrados al módulo de lotes",
            "Clavis Agro + IoT",
          ],
        ]),

        h2("4.8 Retail de barrio — Pack Almacén Rosario (18 módulos)"),
        p(
          "Segmento de alto volumen en Argentina: almacenes, kioscos, verdulerías. Pack completo $34.900/mes sobre Core. Principio comercial: todos los módulos siempre visibles — el cliente activa lo que usa."
        ),
        spacer(),
        table(
          ["#", "Módulo", "Dolor", "Precio/mes"],
          [
            ["1", "Guardián de Margen", "Vende debajo del costo", "$3.990"],
            ["2", "Zero Waste", "Mercadería por vencer", "$5.990"],
            ["3", "Alerta Stock Cero", "Vende sin stock", "$2.990"],
            ["4", "Promos Medios de Pago", "Cajero olvida reintegros MODO/MP", "$2.990"],
            ["5", "Importador Listas", "Precios a mano desde Excel", "$4.990"],
            ["6", "Pánico Vecinal", "Sin alerta discreta en el local", "$1.990"],
            ["7", "Envases de Gaseosas", "Cajones retornables en cuaderno", "$2.490"],
            ["8", "Vale de Dinero", "Vales en papel sin control", "$1.990"],
            ["9", "Recargas y Servicios", "SUBE/celular fuera de la caja", "$2.990"],
            ["10", "Venta por Peso", "Peso × precio en calculadora", "$2.490"],
            ["11", "Promos 2×1", "Descuentos aplicados a mano", "$1.990"],
            ["12", "Ticket Regalo", "Devoluciones sin crédito trazable", "$1.490"],
            ["13", "Pedido Distribuidora", "Pedido urgente al reparto", "$3.490"],
            ["14", "Mermas y Roturas", "Roturas no bajan stock", "$1.990"],
            ["15", "Arqueo Ciego", "Cajero ve saldo antes de contar", "$2.490"],
            ["16", "Lista Mayorista POS", "Precio bulto de memoria", "$2.990"],
            ["17", "Cheques en Cartera", "Cheques que vencen sin aviso", "$2.490"],
            ["18", "Inventario Express", "Inventario frena el mostrador", "$3.490"],
          ],
          [400, 2200, 4360, 2400]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        h2("4.9 Verticales especializadas (14 rubros con onboarding IA)"),
        table(
          ["Rubro", "Problemas típicos", "Módulos Clavis que resuelven"],
          [
            ["Kiosco / Almacén", "Fiado, envases, listas distribuidora, margen", "POS, Pack Almacén, Fiado, AFIP"],
            ["Distribuidora", "Rutas, morosidad, picking, B2B", "Logística, Portal B2B, App ruta, CxC"],
            ["Industria / Taller", "BOM, OF, MRP, trazabilidad", "Producción, Compras, Centros de costo"],
            ["Agro / Acopio", "Balanza, liquidaciones, CPE, IoT", "Agro, Balanza, Contratos, NDVI"],
            ["Bar / Restaurant", "Mesas, comandas, food cost", "Hospitalidad, KDS, Recetas, POS"],
            ["Farmacia", "Vencimientos, controlados, lotes", "Lotes, Agenda entregas, Stock"],
            ["Veterinaria / Clínica", "Historia clínica, turnos", "HC, Agenda, Membresías"],
            ["Ferretería", "Listas constructores, fórmulas color", "CC, Listas precio, POS"],
            ["Indumentaria", "Variantes, talles, multicanal", "Variantes, Ecommerce, Stock"],
            ["Gimnasio / Spa", "Membresías, cobros recurrentes", "Membresías, Agenda, Cobranza"],
            ["Estación de servicio", "Turnos, stock combustibles", "POS, Turnos, Inventario"],
            ["Partners contadores", "Multi-cliente, export fiscal", "Rol contador, CITI, Libro IVA"],
          ],
          [2200, 3600, 3560]
        ),

        // ── 5. PRODUCTOS Y PRECIOS ──
        h1("5. Portafolio comercial y precios (ARS/mes)"),
        p("Precios en pesos argentinos + IVA. Sin permanencia mínima. Descuento anual: 2 meses gratis."),

        h2("5.1 Plataforma base"),
        table(
          ["Producto", "Precio", "Problema que elimina"],
          [
            ["Clavis Core", "$39.900", "Tener 3 sistemas para compras, ventas, stock y AFIP"],
            ["Clavis Core Industria", "$49.900", "ERP genérico sin rubro metalúrgico preconfigurado"],
          ],
          [2800, 1800, 4760]
        ),

        h2("5.2 Bundles add-on (sobre Core)"),
        table(
          ["Bundle", "Precio add-on", "Total ref.", "Dolor principal"],
          [
            ["Tienda Conectada", "$22.900", "$62.800", "Pedidos web cargados a mano"],
            ["Marketplace Pro (ML)", "$16.900", "$56.800", "Quiebre de stock en Mercado Libre"],
            ["Omnicanal Argentina ★", "$44.900", "$84.800", "Multicanal sin stock único"],
            ["Envíos Pro", "$12.900", "$52.800", "3 portales de carriers distintos"],
            ["Comunica", "$7.900", "$47.800", "Llamadas de tracking y cobranza"],
            ["Industria", "$24.900", "$74.800", "Sin BOM ni MRP"],
            ["Almacén Rosario", "$34.900", "$74.800", "Retail barrio sin herramientas"],
            ["Operación Completa", "$79.900", "$129.800", "Distribuidora con fricción en cada eslabón"],
          ],
          [2200, 1600, 1400, 4160]
        ),

        h2("5.3 Pools del Marketplace"),
        table(
          ["Pool", "Precio", "Lema", "SKUs"],
          [
            ["Premium ERP 7", "$89.900/mes", "Lo que SAP cobra millones, en pesos", "7 intangibles enterprise"],
            ["Almacén Rosario", "$34.900/mes", "Margen, merma y caja para el barrio", "18 módulos POS"],
            ["Cobra y Recupera", "$39.900/mes", "Cobranza + retención B2B", "Cobranzas WA + Reactivador"],
            ["Conecta Argentina", "$34.900/mes", "Un stock, todos los canales", "TN + ML + WhatsApp"],
            ["Essentials", "$7.990/mes", "Protegé, enterate y arrancá", "Backup + MFA + Reportes"],
            ["Salí de Odoo", "$89.900 one-shot", "Migración sin trauma", "Migración + AFIP"],
          ],
          [2200, 1600, 2960, 2600]
        ),

        h2("5.4 Enganches comerciales (land-and-expand)"),
        p("Productos de entrada de bajo ticket que resuelven un dolor inmediato y abren el funnel al ERP completo."),
        table(
          ["Enganche", "Precio", "Dolor", "Upsell natural"],
          [
            ["Libreta Fiado Barrio", "$4.990/mes", "Fiado sin límite en cuaderno", "POS + Cobranzas WA"],
            ["Cobranzas WhatsApp", "$20.000/mes", "Horas llamando deudores", "ClavPay + Core"],
            ["Guardián POS", "$14.900/mes", "Robo hormiga en caja", "Pack Premium ERP 7"],
            ["FotoFactura OCR", "$9.900/mes", "Carga manual de compras", "Core + Compras"],
          ],
          [2200, 1400, 3360, 2400]
        ),

        // ── 6. MODELO DE NEGOCIO ──
        new Paragraph({ children: [new PageBreak()] }),
        h1("6. Modelo de negocio y expansión de ingresos"),
        p(
          "El modelo combina ingresos recurrentes predecibles (Core obligatorio) con expansión de ARPU vía marketplace. Cada problema resuelto es un SKU adicional que el cliente activa sin cambiar de proveedor."
        ),

        h2("6.1 Fuentes de ingreso"),
        bullet("Suscripción SaaS mensual: Core + bundles + pools (70% del revenue objetivo)"),
        bullet("Add-ons à la carte: integraciones por canal (ML, TN, carriers, WhatsApp)"),
        bullet("Servicios intangibles Premium: alto margen, retención extrema (conciliador, OCR, guardián)"),
        bullet("Implementación one-shot: migración Odoo, setup omnicanal ($60k–$180k)"),
        bullet("Microtransacciones: OCR por documento ($99/PDF), comisión por recupero fiscal"),
        bullet("Servicios profesionales: Clav Consult, capacitación, homologación AFIP"),
        bullet("Partners contadores: comisión 20% primer año + white-label Enterprise"),

        h2("6.2 Escalera de expansión (land-and-expand)"),
        table(
          ["Mes", "Acción", "Trigger de upsell", "ARPU acumulado ref."],
          [
            ["0", "Enganche Fiado o Cobranzas WA", "Dolor inmediato barrio", "$4.990–$20.000"],
            ["1", "Clavis Core", "Necesita stock + AFIP", "$39.900"],
            ["2", "+ 1 canal (ML o TN)", "Primer pedido web", "$56.800"],
            ["3", "Omnicanal", "Segundo canal / stock desfasado", "$84.800"],
            ["4", "Envíos Pro + Comunica", "Despacho manual / consultas", "$105.600"],
            ["6", "Premium ERP 7 o Operación Completa", "Automatización enterprise", "$129.800–$179.700"],
            ["12", "Automate / Analytics / LATAM", "Power user / multi-país", "$150.000+"],
          ],
          [800, 2800, 3360, 2400]
        ),

        h2("6.3 Métricas clave del marketplace"),
        table(
          ["Métrica", "Valor"],
          [
            ["SKUs en catálogo", "51"],
            ["Activación automática (cualquier país)", "28+ servicios en minutos"],
            ["Enganches comerciales definidos", "15"],
            ["Bundles (pools) comerciales", "10+"],
            ["Módulos ERP funcionales", "40+"],
            ["Verticales con onboarding IA", "14 rubros"],
          ],
          [4680, 4680]
        ),

        // ── 7. VENTAJA COMPETITIVA ──
        h1("7. Ventaja competitiva y moat"),
        table(
          ["Moat", "Por qué es defendible"],
          [
            ["AFIP nativo siempre incluido", "No es negociable ni add-on — barrera regulatoria y de confianza"],
            ["Contexto Argentina profundo", "IVA, IIBB, CAEA, fiado, envases, listas distribuidora — imposible replicar desde SaaS global genérico"],
            ["Auto-provisioning en minutos", "28+ SKUs sin analista humano — CAC bajo y time-to-value <1 hora"],
            ["Multi-tenant con Claver Cloud", "Escala operativa sin linealidad de headcount en implementación"],
            ["Marketplace modular", "Cada dolor = SKU = ARPU incremental sin migración de plataforma"],
            ["Metodología CCA", "Go-live 7–14 días vs. 3–6 meses de ERP tradicional"],
            ["IA embebida operativa", "OCR, reactivador, guardián, onboarding — no chatbot decorativo"],
          ],
          [3200, 6160]
        ),

        h2("7.1 vs. alternativas del mercado"),
        table(
          ["Alternativa", "Limitación", "Ventaja Claver"],
          [
            ["Facturador + Excel", "Sin stock ni omnicanal", "Un evento = venta + stock + factura"],
            ["Tango / Bejerman", "UX legacy, sin marketplace ni IA", "SaaS moderno + 51 add-ons activables"],
            ["Odoo / SAP", "Consultora cara, meses de implementación", "AutoPool enterprise a $89.900/mes"],
            ["Square / Toast", "Sin AFIP ni contexto AR", "Retail global adaptado a barrio argentino"],
            ["Mercado Libre solo", "No es ERP — sin compras ni contabilidad", "ML como canal dentro del ERP"],
          ],
          [2200, 3600, 3560]
        ),

        // ── 8. ESTADO Y TRACCIÓN ──
        h1("8. Estado actual del producto"),
        p("Clavis y Claver Cloud están operativos con pruebas automatizadas (Vitest) en módulos críticos."),
        table(
          ["Área", "Estado", "Evidencia"],
          [
            ["POS + AFIP + Caja", "Producción", "Tests ventas, arqueo, emisión fiscal"],
            ["Ecommerce B2C + Portal B2B", "Producción", "Sync stock multicanal"],
            ["Contabilidad + Centros de costo", "Producción", "Tests asientos, períodos"],
            ["Claver Cloud + CCA", "Producción", "Aprovisionamiento, scrum, stakeholders"],
            ["Marketplace + AutoPool", "Producción", "Checkout, provision jobs, 51 SKUs"],
            ["Pack Almacén Rosario", "Producción", "18 módulos + panel + guía in-app"],
            ["Premium ERP 7", "Beta / disponible", "Guardián POS y Reactivador activos"],
            ["ClavPay QR", "Beta", "Integración Mercado Pago en POS"],
            ["ClavLog / Analytics", "Roadmap Q3 2026", "Arquitectura definida"],
          ],
          [2800, 1800, 4760]
        ),

        // ── 9. ROADMAP ──
        h1("9. Roadmap 2026 — de producto a conglomerado LATAM"),
        table(
          ["Fase", "Período", "Hitos", "Problemas nuevos que abre"],
          [
            [
              "Fase 1 — Robustez fiscal",
              "Q2 2026",
              "CAEA offline completo, WhatsApp comprobantes, fiado + vales",
              "Operar sin internet, cobrar fiado digitalmente",
            ],
            [
              "Fase 2 — Pagos y autoservicio",
              "Q3 2026",
              "MP QR, portal PDF facturas, picking automático",
              "Cobro instantáneo, menos llamadas administrativas",
            ],
            [
              "Fase 3 — Manufactura e impuestos",
              "Q3–Q4 2026",
              "MRP compras, Libro IVA/CITI, NDVI agro",
              "Producción planificada, cierre fiscal sin Excel",
            ],
            [
              "Fase 4 — Conglomerado LATAM",
              "Q4 2026",
              "ClavPay/ClavLog públicos, fiscal regional, partners",
              "Expansión México/Chile con adaptadores fiscales",
            ],
          ],
          [1800, 1200, 3360, 3000]
        ),

        // ── 10. OPORTUNIDAD DE INVERSIÓN ──
        new Paragraph({ children: [new PageBreak()] }),
        h1("10. Oportunidad de inversión"),
        p(
          "Argentina concentra más de 600.000 establecimientos comerciales y un universo de PyMEs manufactureras y distribuidoras que aún operan con software fragmentado. Claver captura valor en cada eslabón de la cadena operativa-fiscal mediante un modelo de suscripción expandible."
        ),

        h2("10.1 Tesis de inversión"),
        bullet("Mercado grande y doloroso: cumplimiento fiscal obligatorio + omnicanal acelerado post-pandemia"),
        bullet("Modelo land-and-expand probado: enganche $4.990 → Core $39.900 → Omnicanal $84.800+"),
        bullet("Alta retención por switching cost: datos fiscales, stock histórico, integraciones vivas"),
        bullet("Margen creciente: intangibles Premium y AutoPool escalan sin consultores"),
        bullet("Plataforma multi-tenant lista para LATAM con adaptadores fiscales por país"),

        h2("10.2 Unit economics de referencia"),
        table(
          ["Concepto", "Valor de referencia"],
          [
            ["ARPU entrada (enganche)", "$4.990 – $20.000/mes"],
            ["ARPU Core", "$39.900/mes"],
            ["ARPU omnicanal maduro", "$84.800 – $129.800/mes"],
            ["ARPU enterprise + Premium 7", "$179.700/mes"],
            ["Setup fee (opcional)", "$60.000 – $180.000 one-shot"],
            ["Descuento anual", "17% (2 meses gratis)"],
            ["Usuario adicional", "$4.900/mes"],
            ["Sucursal adicional", "$9.900/mes"],
          ],
          [4680, 4680]
        ),

        h2("10.3 Uso de fondos (marco estratégico)"),
        bullet("40% — Go-to-market: verticales retail barrio, partners contadores, performance ads"),
        bullet("30% — Producto: ClavPay, ClavLog, Analytics, adaptadores LATAM"),
        bullet("20% — Operaciones: torre analista, soporte, infra multi-tenant"),
        bullet("10% — Capital de trabajo y contingencia fiscal/regulatoria"),

        h2("10.4 Resumen: por qué invertir en Claver ahora"),
        p(
          "No vendemos un ERP más. Vendemos la resolución sistemática de cada problema operativo-fiscal que frena a las PyMEs argentinas — empaquetado como conglomerado modular, activable en minutos, con ingresos recurrentes que crecen con el dolor que el cliente va descubriendo. La plataforma ya existe. El marketplace ya monetiza. El siguiente paso es escala comercial y expansión regional."
        ),

        spacer(),
        table(
          ["Contacto", "Recursos"],
          [
            ["Web matriz", "https://claver.com.ar/claver"],
            ["Producto ERP", "https://claver.com.ar/claver/claverp"],
            ["Almacén Rosario", "https://claver.com.ar/claver/almacen-rosario"],
            ["Catálogo módulos", "https://claver.com.ar/claver/claverp/modulos"],
          ],
          [2800, 6560]
        ),
        spacer(),
        p("— Fin del documento — Grupo Claver | Junio 2026", { italics: true, color: "64748B" }),
      ],
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, buffer)
console.log("Generado:", OUT)
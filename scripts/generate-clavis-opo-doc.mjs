/**
 * Genera documento estratégico: Clavis + OPO + Claver Cloud
 * Uso: node scripts/generate-clavis-opo-doc.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
} from "docx"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, "..", "docs", "Clavis-OPO-ClaverCloud-Estrategia.docx")

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
const borders = { top: border, bottom: border, left: border, right: border }
const CONTENT_W = 9360

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
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  })
}
function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  })
}

function table(headers, rows) {
  const colW = Math.floor(CONTENT_W / headers.length)
  const columnWidths = headers.map(() => colW)
  const hdrCells = headers.map(
    (h) =>
      new TableCell({
        borders,
        width: { size: colW, type: WidthType.DXA },
        shading: { fill: "2E75B6", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
          }),
        ],
      }),
  )
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              borders,
              width: { size: colW, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun(String(cell))] })],
            }),
        ),
      }),
  )
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths,
    rows: [new TableRow({ children: hdrCells }), ...dataRows],
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
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 },
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
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun("Clavis · OPO · Claver Cloud — Documento estratégico — Junio 2026 — Pág. "),
                new TextRun({ children: [PageNumber.CURRENT] }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          spacing: { after: 400 },
          children: [
            new TextRun({ text: "Clavis + OPO + Claver Cloud", bold: true, size: 40 }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Qué podés hacer hoy con REST y SQL · Cómo empaquetar · Cómo ordenar el ecosistema",
              size: 26,
              italics: true,
            }),
          ],
        }),
        p("Versión: Junio 2026 · Audiencia: fundador / analista / implementador (1 persona puede operar)"),
        p("Stack: Clavis (Next.js 15) · Claver Cloud · OPO · Protheus REST/SQL · Cursor · Grok Build"),

        h1("1. Resumen ejecutivo"),
        p(
          "Tenés dos vías de conexión al legacy Protheus ya operativas en Claver Cloud: API REST (3.432 servicios catalogados) e introspección SQL directa (tablas SX, maestros SA1/SB1). El problema no es falta de tecnología: es desorden. Hay tres catálogos de precios, cuatro UIs de OPO, credenciales en localStorage y un modo demo que oculta errores. Este documento ordena qué hace cada pieza, qué dolores resuelve, y cómo empaquetarlo para vender sin que una sola persona se ahogue.",
        ),

        h1("2. Mapa del ecosistema"),
        h2("2.1 Las cinco piezas y su rol"),
        table(
          ["Pieza", "Qué es", "Para quién", "Rol"],
          [
            ["Clavis", "ERP Next.js (POS, ventas, stock, AFIP)", "Cliente final", "Producto core — datos canónicos"],
            ["Claver Cloud", "Consola analista (/claver-cloud)", "Vos / equipo Claver", "Control plane: tenants, ops, bridge"],
            ["OPO", "Ontología + bridge legacy", "Analista + tenant", "Traduce Protheus ↔ entidades canónicas"],
            ["Cursor + Grok", "IDE + agente IA", "Desarrollo", "Implementación, no runtime"],
            ["Protheus", "ERP legacy TOTVS", "Cliente con histórico", "Fuente de verdad maestros / histórico"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h2("2.2 Flujo de datos simplificado"),
        p("Lectura hoy (lo que funciona):"),
        bullet("numbers", "Protheus REST → protheus-rest-client → Legacy Bridge → entidades OPO (Customer, Product, Invoice)"),
        bullet("numbers", "Protheus SQL → introspección SX2/SX3/SA1/SB1 → OPO Console (descubrimiento, no query runtime aún)"),
        bullet("numbers", "Clavis DB → clavis-adapter → modo full (sin bridge)"),
        bullet("numbers", "Edge Agent (VPN) → remote-agent → mismo protocolo OPO en PC del cliente"),
        p("Escritura: definida en tipos pero escritura=null en mapeos default — pendiente de productizar."),

        h1("3. Qué podés hacer HOY (una persona)"),
        h2("3.1 Con REST API"),
        table(
          ["Acción", "Dónde", "Resultado"],
          [
            ["Listar 3.432 servicios", "/claver-cloud/protheus-api", "Catálogo con módulos y monetización"],
            ["Refrescar catálogo live", "POST catalog + credenciales", "Snapshot actualizado del ambiente"],
            ["Introspección REST", "/claver-cloud/opo-console", "Prueba endpoints diccionario/framework"],
            ["Mapear entidades", "Legacy Bridge wizard (tenant)", "SA1→Customer, SB1→Product, etc."],
            ["Probar ida/vuelta", "Paso 5 del wizard", "bridge-test-service valida lectura"],
            ["Leer clientes/productos", "Tenant OPO / query API", "REST mapeado o demo si falla config"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h2("3.2 Con SQL directo"),
        table(
          ["Acción", "Dónde", "Resultado"],
          [
            ["Configurar SQL Server", "OPO Console (formulario)", "server, puerto, BD, user, suffix 010"],
            ["Introspección SQL", "Canal sql o hybrid", "Estructura SX2/SX3 + muestras SA1/SB1"],
            ["Descubrir tablas Protheus", "protheus-sql-introspection.ts", "Metadatos sin depender de REST"],
            ["Query runtime SQL", "—", "NO implementado aún en opo-query-service"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h2("3.3 Rutina recomendada para 1 analista"),
        bullet("numbers", "Setup Protheus: checklist VPN → REST → credenciales (.env o form OPO Console)"),
        bullet("numbers", "OPO Console: introspección hybrid (REST + SQL) — guardar conexión"),
        bullet("numbers", "Catálogo REST: identificar módulos del cliente (fin, stock, pcp…)"),
        bullet("numbers", "Organizations → elegir tenant → Legacy Bridge: modo legacy_front o híbrido"),
        bullet("numbers", "Activar SKU bridge.opo_studio en marketplace / billing"),
        bullet("numbers", "Probar bridge → documentar limitaciones por entidad"),
        p("Tiempo estimado primer cliente Protheus: 2–4 h si REST responde; +1 día si falta VPN/SQL."),

        h1("4. Dolores que esto resuelve"),
        h2("4.1 Para el cliente con Protheus"),
        bullet("bullets", "No reemplazar ERP de golpe — UI moderna Clavis leyendo maestros legacy"),
        bullet("bullets", "Facturación AFIP en Clavis sin migrar años de histórico Protheus"),
        bullet("bullets", "Omnicanal (ML, TN, WhatsApp) sin duplicar stock en Protheus manualmente"),
        bullet("bullets", "Visibilidad: 3.432 endpoints documentados vs. caja negra AdvPL"),
        bullet("bullets", "Implementación remota: analista opera desde Claver Cloud sin ir al sitio"),

        h2("4.2 Para Claver (vos)"),
        bullet("bullets", "Una consola para todos los tenants (ops, billing, bridge, marketplace)"),
        bullet("bullets", "Provisioning semi-automático de SKUs y packs"),
        bullet("bullets", "Readiness score y playbooks por tenant"),
        bullet("bullets", "Cursor/Grok aceleran parches; el runtime queda en Next.js estable"),

        h2("4.3 Dolores AÚN NO resueltos (honestos)"),
        bullet("bullets", "Escritura bidireccional Protheus ↔ Clavis (solo lectura hoy)"),
        bullet("bullets", "SQL en runtime de queries (solo introspección)"),
        bullet("bullets", "Demo fallback enmascara mala configuración"),
        bullet("bullets", "Credenciales Protheus en localStorage del navegador"),
        bullet("bullets", "Tres catálogos de precio desalineados (marketing / marketplace / planes tenant)"),
        bullet("bullets", "OPO Studio completo vive en repo separado (opo/Open-protocol-ontology)"),
        bullet("bullets", "~54% del catálogo REST sin clasificar (módulo 'otros')"),

        h1("5. Desorden actual — diagnóstico"),
        table(
          ["Síntoma", "Causa", "Impacto"],
          [
            ["4 pantallas OPO distintas", "Evolución paralela tenant/analista/studio", "Confusión de flujo"],
            ["3 catálogos de precio", "marketing + marketplace + tenant-plan", "Cotización inconsistente"],
            ["Demo data automático", "opo-query-service fallback", "Cliente cree que bridge funciona"],
            ["REST y SQL duplicados", "Dos caminos sin unificar", "Parece 'mucho' para 1 persona"],
            ["Cursor/Grok en docs", "Herramientas dev, no producto", "Expectativa de IA en runtime"],
            ["IPs hardcodeadas", "10.12.35.70 en defaults", "Rompe al cambiar ambiente"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h1("6. Propuesta de empaquetado unificado"),
        p("Objetivo: un solo escalón comercial que el analista active desde Claver Cloud."),

        h2("6.1 Escalera de productos (5 niveles)"),
        table(
          ["Nivel", "Nombre", "SKUs clave", "Precio ref.", "Target"],
          [
            ["0", "Clavis Nativo", "core.clavis", "$39.900/mes", "PyME sin legacy"],
            ["1", "Conecta", "pool-conecta-ar, integ.*", "$34.900/mes", "Primer canal digital"],
            ["2", "Vertical / Omnicanal", "pool-almacen-rosario, Omnicanal", "$49–89k/mes", "Retail, distribuidora"],
            ["3", "Legacy Bridge", "bridge.opo_studio + pool-digitalizacion-legacy", "$59.900/mes", "Protheus → Clavis UI"],
            ["4", "Claver Platform", "Plan Pro/Enterprise + ops.*", "$79–149k/mes", "MSP / implementador"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h2("6.2 SKU bridge.opo_studio — desglosar en sub-productos"),
        p("Hoy es un bloque SEMI_AUTO de $24.900/mes. Propuesta de despiece vendible:"),
        table(
          ["Sub-SKU", "Incluye", "Canal", "Precio sugerido"],
          [
            ["bridge.discovery", "Catálogo REST + introspección", "REST", "$9.900/mes"],
            ["bridge.read", "Lectura entidades mapeadas", "REST/SQL", "$14.900/mes"],
            ["bridge.write", "Escritura selectiva (futuro)", "REST", "+$19.900/mes"],
            ["bridge.agent", "Edge Agent VPN on-prem", "Agent", "+$9.900/mes"],
            ["bridge.mapping", "Mapeo custom por módulo", "Analista", "one-shot $29.900"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h2("6.3 Pack recomendado Protheus"),
        p("pool-digitalizacion-legacy ($59.900/mes):"),
        bullet("bullets", "bridge.opo_studio — bridge + consola OPO"),
        bullet("bullets", "impl.parametrizacion_remota — setup sin visita"),
        p("Mensaje comercial: 'Tu Protheus sigue; tu equipo usa Clavis. Stock unificado en 30 días.'"),

        h1("7. Cómo enlazar Clavis · Next.js · Cursor · Grok · OPO"),
        h2("7.1 División de responsabilidades"),
        table(
          ["Capa", "Tecnología", "Quién lo toca", "No mezclar con"],
          [
            ["Runtime producto", "Next.js 15 + Prisma", "Deploy / CI", "Prompts de Cursor"],
            ["Bridge legacy", "lib/opo/*", "Analista + dev", "UI marketing"],
            ["Consola ops", "Claver Cloud", "Analista Claver", "Cliente final"],
            ["Ontología avanzada", "opo/Open-protocol-ontology", "Proyecto aparte", "Flujo tenant diario"],
            ["Desarrollo", "Cursor + Grok Build", "Vos", "Producción directa"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h2("7.2 Flujo de trabajo con Cursor y Grok"),
        bullet("numbers", "Cursor: implementar features en erpia/ (PRs, fixes, APIs)"),
        bullet("numbers", "Grok Build: diseño, documentos, auditorías (GROK_AUDIT.md en OPO studio)"),
        bullet("numbers", "Claver Cloud: validar en ambiente real con credenciales Protheus"),
        bullet("numbers", "OPO Console: introspección → exportar hallazgos → Legacy Bridge del tenant"),
        bullet("numbers", "Nunca: Grok modificando prod sin pasar por build/test"),
        p("Regla de oro: Cursor escribe código; Grok escribe specs y docs; Claver Cloud opera tenants."),

        h2("7.3 Un solo camino para el analista (simplificar 4 UIs → 2)"),
        table(
          ["Antes (4 UIs)", "Después (2 UIs)", "Acción"],
          [
            ["opo-console", "Consola OPO (analista)", "Mantener — descubrimiento"],
            ["legacy-bridge-wizard", "Panel tenant → pestaña Bridge", "Mantener — configuración"],
            ["dashboard/apps/opo", "Tenant OPO Studio", "Simplificar — solo query/discovery"],
            ["opo/Open-protocol-ontology", "Lab ontología (opcional)", "No en nav principal"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h1("8. Roadmap de mejora (priorizado)"),
        h2("8.1 Corto plazo (1–2 sprints)"),
        bullet("numbers", "Unificar credenciales: server-side vault por tenant (sacar localStorage)"),
        bullet("numbers", "Quitar demo fallback silencioso — mostrar error explícito"),
        bullet("numbers", "Alinear 3 catálogos → una tabla maestra SKUs con flags marketing/marketplace/plan"),
        bullet("numbers", "Importar introspección OPO Console → Legacy Bridge (auto-mapeo SX)"),
        bullet("numbers", "Clasificar módulo 'otros' del catálogo REST (top 200 endpoints)"),

        h2("8.2 Mediano plazo (1–2 meses)"),
        bullet("numbers", "SQL read en opo-query-service (vistas vw_opo_*)"),
        bullet("numbers", "Escritura Customer/Product vía REST (1 entidad piloto)"),
        bullet("numbers", "Sub-SKUs bridge.discovery / bridge.read en marketplace"),
        bullet("numbers", "Auth en /api/claver-cloud/provisioning/orders"),
        bullet("numbers", "Sync jobs en cola (no inline en POST)"),

        h2("8.3 Largo plazo"),
        bullet("numbers", "OPO Studio integrado o embebido (iframe) desde tenant"),
        bullet("numbers", "Grok en runtime: sugerencia de mapeos desde introspección (no auto-write)"),
        bullet("numbers", "Marketplace auto-provision GLOBAL_AUTO para bridge.read"),

        h1("9. Matriz de capacidades"),
        table(
          ["Capacidad", "Estado", "Canal"],
          [
            ["Discovery REST 3432 svc", "Producción", "REST"],
            ["Catálogo con monetización", "Producción", "REST"],
            ["Introspección REST", "Producción", "REST"],
            ["Introspección SQL SX/SA/SB", "Producción", "SQL"],
            ["Introspección hybrid", "Producción", "REST+SQL"],
            ["Legacy Bridge wizard", "Producción", "UI"],
            ["Lectura entidades mapeadas", "Parcial", "REST"],
            ["Query SQL runtime", "No", "SQL"],
            ["Escritura legacy", "No", "REST"],
            ["Edge Agent", "Protocolo listo", "VPN"],
            ["Billing MRR por SKU", "Producción", "Claver Cloud"],
            ["Fleet ops / readiness", "Producción", "Claver Cloud"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h1("10. URLs y acceso rápido"),
        table(
          ["Pantalla", "URL", "Uso"],
          [
            ["Home Claver Cloud", "/claver-cloud", "KPIs flota"],
            ["Tenants", "/claver-cloud/organizations", "Lista clientes"],
            ["Panel tenant", "/claver-cloud/tenants/[id]", "Bridge, billing, playbooks"],
            ["OPO Console", "/claver-cloud/opo-console", "REST/SQL introspect"],
            ["Catálogo REST", "/claver-cloud/protheus-api", "3432 servicios"],
            ["Setup Protheus", "/claver-cloud/protheus-setup", "Checklist ambiente"],
            ["Marketplace", "/claver-cloud/marketplace", "Activar SKUs"],
            ["Tenant OPO", "/dashboard/apps/opo", "Query lado cliente"],
          ],
        ),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        h1("11. Conclusión"),
        p(
          "No te falta conexión: te sobra superficie. REST y SQL ya te permiten descubrir, catalogar y leer Protheus desde una sola consola. El siguiente paso no es conectar más cosas, sino empaquetar menos opciones, unificar precios, y cerrar el circuito introspección → bridge → facturación del SKU. Con Cursor y Grok construís rápido; con Claver Cloud operás sin ir a cada cliente. OPO es el pegamento semántico entre Clavis y Protheus — vendelo como pool-digitalizacion-legacy, no como 12 pantallas sueltas.",
        ),
        p("Próximo paso sugerido: activar pool-digitalizacion-legacy en un tenant piloto y documentar el caso en 1 página.", {
          bold: true,
        }),
      ],
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, buffer)
console.log("Documento generado:", OUT)
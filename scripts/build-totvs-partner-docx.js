const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents,
  ExternalHyperlink, LevelFormat, TabStopType, TabStopPosition,
} = require("docx");

const OUT = path.join(__dirname, "..", "docs", "partners", "CLAVER_TOTVS_PROTHEUS_APPS.docx");

const PAGE_W = 11906;
const PAGE_H = 16838;
const MARGIN = 1080;
const CONTENT = PAGE_W - MARGIN * 2; // 9746

const NAVY = "1B3A4B";
const TEAL = "2F6F7E";
const GOLD = "B0892E";
const HEADER_FILL = "1B3A4B";
const HEADER_TEXT = "FFFFFF";
const ALT_ROW = "F4F7F8";
const RULE = "2F6F7E";
const MUTED = "5C6B73";
const CODE = "1B3A4B";

const thin = { style: BorderStyle.SINGLE, size: 4, color: "D0D7DA" };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: 276 },
    alignment: opts.align,
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: opts.size ?? 22,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color ?? "222222",
      }),
    ],
  });
}

function rich(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: 276 },
    alignment: opts.align,
    children: runs.map((r) =>
      typeof r === "string"
        ? new TextRun({ text: r, font: "Arial", size: 22, color: "222222" })
        : new TextRun({ font: "Arial", size: 22, color: "222222", ...r })
    ),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: RULE, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: NAVY })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: TEAL })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: NAVY })],
  });
}

function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "222222" })],
  });
}

function numbered(text, ref) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "222222" })],
  });
}

function numberedRich(runs, ref) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: runs.map((r) =>
      typeof r === "string"
        ? new TextRun({ text: r, font: "Arial", size: 22, color: "222222" })
        : new TextRun({ font: "Arial", size: 22, color: "222222", ...r })
    ),
  });
}

function callout(title, body) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [CONTENT],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
              left: { style: BorderStyle.SINGLE, size: 24, color: GOLD },
              right: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
            },
            width: { size: CONTENT, type: WidthType.DXA },
            shading: { fill: "FBF6EA", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: title, font: "Arial", size: 20, bold: true, color: GOLD })],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [new TextRun({ text: body, font: "Arial", size: 21, color: "333333" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function codeBlock(lines) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [CONTENT],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "D0D7DA" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "D0D7DA" },
              left: { style: BorderStyle.SINGLE, size: 16, color: TEAL },
              right: { style: BorderStyle.SINGLE, size: 4, color: "D0D7DA" },
            },
            width: { size: CONTENT, type: WidthType.DXA },
            shading: { fill: "F3F6F7", type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: lines.map(
              (line, i) =>
                new Paragraph({
                  spacing: { after: i === lines.length - 1 ? 0 : 40 },
                  children: [new TextRun({ text: line, font: "Consolas", size: 18, color: CODE })],
                })
            ),
          }),
        ],
      }),
    ],
  });
}

function cell(text, width, opts = {}) {
  const isHeader = opts.header;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: isHeader ? HEADER_FILL : opts.fill || "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text ?? ""),
            font: "Arial",
            size: opts.size ?? (isHeader ? 16 : 17),
            bold: isHeader || opts.bold,
            color: isHeader ? HEADER_TEXT : opts.color || "222222",
            italics: opts.italics,
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows, colWidths) {
  const widths = colWidths || headers.map(() => Math.floor(CONTENT / headers.length));
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum !== CONTENT) widths[widths.length - 1] += CONTENT - sum;

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, widths[i], { header: true })),
  });

  const dataRows = rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map((c, i) => {
          const val = typeof c === "object" && c !== null ? c.text : c;
          const extra = typeof c === "object" && c !== null ? c : {};
          return cell(val, widths[i], { fill: ri % 2 === 1 ? ALT_ROW : "FFFFFF", ...extra });
        }),
      })
  );

  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...dataRows],
  });
}

function spacer(after = 200) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function numberingConfig() {
  const mkBullet = (ref) => ({
    reference: ref,
    levels: [
      {
        level: 0,
        format: LevelFormat.BULLET,
        text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 420, hanging: 220 } } },
      },
    ],
  });
  const mkNum = (ref) => ({
    reference: ref,
    levels: [
      {
        level: 0,
        format: LevelFormat.DECIMAL,
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 480, hanging: 280 } } },
      },
    ],
  });
  return [
    mkBullet("bullets"),
    mkBullet("check"),
    mkNum("n-contrato"),
    mkNum("n-flujo"),
    mkNum("n-s12"),
    mkNum("n-s36"),
    mkNum("n-s710"),
    mkNum("n-s12b"),
    mkNum("n-decision"),
  ];
}

const children = [];

// ── Cover ──────────────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    spacing: { after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: NAVY, space: 8 } },
    children: [new TextRun({ text: "GRUPO CLAVER  ·  ALIANZA TOTVS", font: "Arial", size: 18, bold: true, color: GOLD })],
  }),
  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [new TextRun({ text: "Claver × TOTVS Protheus", font: "Arial", size: 48, bold: true, color: NAVY })],
  }),
  new Paragraph({
    spacing: { after: 280 },
    children: [new TextRun({ text: "Apps de partner, integración y valor agregado", font: "Arial", size: 28, color: TEAL })],
  }),
  p("Brief técnico para canal e implementación. No es contrato ni lista de precios TOTVS.", { italics: true, color: MUTED, size: 20 }),
  spacer(80),
  makeTable(
    ["Campo", "Valor"],
    [
      ["Audiencia", "Compañero TOTVS (canal / implementación) + Claver Soft"],
      ["Fecha", "17 de septiembre de 2026"],
      ["Estado", "Brief técnico para alianza"],
      ["Regla comercial", "Claver no reemplaza Protheus. Protheus sigue siendo el system of record."],
    ],
    [2400, 7346]
  ),
  spacer(200),
  callout(
    "Tesis",
    "Claver es la capa de experiencia (móvil, WhatsApp, AFIP Argentina, POS, cotizaciones en vivo) que se enchufa al backoffice. El canal TOTVS vende y comisiona; Claver cobra SaaS; el implementador factura horas de ADVPL y parametrización."
  ),
  spacer(280),
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: RULE, space: 4 } },
    children: [new TextRun({ text: "Índice", font: "Arial", size: 32, bold: true, color: NAVY })],
  }),
  new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] })
);

// ── 1. Tesis ───────────────────────────────────────────────────────────────
children.push(
  h1("1. Tesis en una página"),
  p("Protheus (SIGAFIN / SIGAFAT / SIGAEST / SIGACTB) es fuerte en maestros, títulos, stock y contabilidad. Es débil —sobre todo en Argentina— en la última milla operativa."),
  spacer(80),
  makeTable(
    ["Hueco típico del cliente Protheus", "Qué pone Claver encima"],
    [
      ["UI de escritorio / AdvPL para el operador de piso", "Apps web y móvil modernas"],
      ["Tesorería operativa (FINA716) sin mark-to-market en vivo", { text: "Claver Inversiones (cuña del piloto)", bold: true }],
      ["Fiscal Brasil (NFe/SPED); AFIP / IVA / IIBB AR a medida", "Facturación electrónica AR + OCR"],
      ["Cobranzas por teléfono / Excel", "WhatsApp + links de pago"],
      ["POS / KDS / vendedor en ruta", "Front operativo que inyecta al ERP"],
      ["Portal B2B del cliente final", "Self-service sobre SA1 / SC5 / SF2 / SE1"],
    ],
    [4873, 4873]
  ),
  spacer(160),
  rich([
    { text: "Modelo de alianza. ", bold: true },
    "Claver entra como Parceiro de Solução (ideal) o, en el primer deal, como Solução com integração homologada / Recommended Partner. El canal TOTVS vende y comisiona; Claver cobra SaaS; el implementador TOTVS factura horas de ADVPL + parametrización.",
  ]),
  p("Código ya existente en el repo Claver (no hay que inventar el puente):", { before: 80 }),
  spacer(60),
  makeTable(
    ["Pieza", "Path"],
    [
      ["Legacy Bridge (adapters)", "lib/legacy-bridge/"],
      ["Contratos REST por app", "lib/legacy-bridge/api-contracts.ts"],
      ["Boletines técnicos (tablas, MV, PRW)", "lib/legacy-bridge/technical-bulletins.ts"],
      ["Fuentes AdvPL", "data/protheus/advpl/edge/"],
      ["Entidades canónicas OPO", "lib/opo/types.ts"],
      ["Catálogo SKU Claver", "lib/marketplace/marketplace-catalog.ts"],
    ],
    [4200, 5546]
  )
);

// ── 2. Arquitectura ────────────────────────────────────────────────────────
children.push(
  h1("2. Cómo se integra (arquitectura)"),
  h2("2.1 Principio"),
  p("La UI de Claver no sabe si atrás hay PostgreSQL nativo o Protheus. Consume ErpDataAdapter. El tenant elige uno de tres canales."),
  spacer(80),
  makeTable(
    ["Capa", "Qué es"],
    [
      ["Claver Edge Apps (SaaS)", "Next.js · JWT · PostgreSQL · UI móvil + WhatsApp + AFIP"],
      ["Transporte", "JSON / OAuth o Basic Auth hacia AppServer REST"],
      ["Protheus AppServer", "HTTPREST (p. ej. puerto 8404 /rest) · SIGA* + tablas Z CLV_*"],
    ],
    [3200, 6546]
  ),
  spacer(120),
  p("Tres canales de acceso (elige el tenant):", { bold: true, after: 80 }),
  makeTable(
    ["Canal", "Adapter", "Cuándo"],
    [
      ["REST directo", "protheus_rest_direct", "Cloud TOTVS o on-prem con HTTPREST expuesto"],
      ["Edge Agent VPN", "protheus_edge_agent", "Firewall; agente en la LAN del cliente"],
      ["SQL vistas / SQL directo", "tableSuffix = 010 (SA1010, SE1010…)", "Lectura masiva o sin REST maduro"],
    ],
    [2600, 2800, 4346]
  ),
  spacer(140),
  p("El tenant se configura en OpoTenantConfig (lib/opo/types.ts):"),
  bullet("origen: \"protheus\""),
  bullet("accesoCanal: rest_directo | edge_agent | sql_vistas | sql_directo"),
  bullet("entityMappings: Customer → SA1, Product → SB1, Invoice → SF2, Order → SC5, Supplier → SA2"),

  h2("2.2 Tres modos de implantación"),
  makeTable(
    ["Modo", "Cuándo", "Qué toca Protheus", "Riesgo"],
    [
      [
        { text: "A. REST estándar", bold: true },
        "Cloud TOTVS o on-prem con [HTTPREST]",
        "APIs TOTVS existentes (Customer, Product, Order) + 1 PRW por app",
        "Bajo. Licencia TOTVS I / Full si hay PrepareIn",
      ],
      [
        { text: "B. REST Claver (PRW)", bold: true },
        "El estándar no cubre el flujo (aprobaciones, POS, inversiones)",
        "Compilar CLV*.PRW en TDS, campos CLV_* en SX3, parámetros MV_CLV*",
        "Medio. GMUD + RPO",
      ],
      [
        { text: "C. Edge Agent", bold: true },
        "Firewall, sin exponer REST a internet",
        "Agente en la LAN habla con AppServer; Claver habla con el agente",
        "Medio-bajo. Típico enterprise",
      ],
    ],
    [2000, 2400, 3146, 2200]
  ),
  spacer(140),
  p("Fluig es opcional: los workflows de aprobación pueden vivir en Fluig y Claver Approvals ser el front móvil. No es requisito."),

  h2("2.3 Prerrequisitos de ambiente Protheus"),
  bullet("Protheus 12.1.2310+ (boletines actuales). REST desde 12.1.27 es usable."),
  bullet("[HTTPV11] + [HTTPREST] en appserver.ini, CORSEnable=1."),
  bullet("Usuario REST dedicado (MV_CLVAPU / USR) con privilegio mínimo a las tablas del flujo."),
  bullet("Cloud TOTVS: pedir al CST la URL REST del ambiente (no asumir host interno)."),
  bullet("Argentina: el CAE AFIP no sale de Protheus. Sale de Claver (o del módulo fiscal local) y se estampa en SF2/SD2."),

  h2("2.4 Contrato de una app (patrón)"),
  p("Cada app empaquetable tiene:"),
  numbered("SKU Claver (edge.* / totvs.*).", "n-contrato"),
  numbered("Contrato REST en CLAVER_APP_BRIDGE_CONTRACTS.", "n-contrato"),
  numbered("Boletín técnico: módulos SIGA, tablas nativas, campos custom, MV, PRW, checklist.", "n-contrato"),
  numbered("Fuente AdvPL en data/protheus/advpl/edge/<app>/.", "n-contrato"),
  numbered("Runbook CCA (Claver Cloud Activation), equivalente a MIT 001.", "n-contrato"),
  spacer(80),
  p("El equipo Protheus del partner implementa el PRW; Claver consume. No se customiza el core SIGA.")
);

// ── 3. Inversiones ─────────────────────────────────────────────────────────
children.push(
  h1("3. Cuña del piloto: Claver Inversiones"),
  p("El compañero TOTVS propuso un módulo de inversiones (API de cotizaciones + tenencias del cliente). Es el mejor primer producto de la alianza: Protheus ya tiene tesorería, pero no una experiencia de portafolio."),

  h2("3.1 Qué hace Protheus hoy (y qué no)"),
  makeTable(
    ["En Protheus", "Gap"],
    [
      ["SIGAFIN tesorería: bancos, naturalezas, flujo de caja", "Operativo, no mark-to-market"],
      ["FINA716: aplicaciones, apropiaciones, préstamos", "Backoffice. Sin UI de cartera, sin API de mercado, sin cliente final"],
      ["TOTVS Techfin (JV Itaú) + Boleto Híbrido", "Brasil-céntrico; no cubre instrumentos AR ni cotizaciones BYMA / MAE / BCRA"],
      ["SA1 clientes, SE1 títulos", "Hay quién debe, no qué tiene invertido a precio de mercado"],
    ],
    [4200, 5546]
  ),

  h2("3.2 Qué reutiliza Claver (ya hay código)"),
  makeTable(
    ["Capacidad Claver", "Dónde", "Reuso para Inversiones"],
    [
      ["Maestro Moneda + histórico Cotizacion (oficial / MEP / CCL / blue / tarjeta)", "prisma/schema.prisma", "FX ARS / USD / BRL"],
      ["Pizarra de granos (BCR)", "lib/agro/agro-service.ts · pizarraActual", "Mismo patrón: cron + última cotización"],
      ["Cuentas bancarias / BCRA", "Banco, CuentaBancaria", "Cuentas de custodia"],
      ["Préstamos / cuotas", "/dashboard/prestamos", "Pata pasivo del portafolio"],
      ["Cashflow", "/dashboard/cashflow", "Caja + inversiones en una vista"],
      ["Portal cliente", "/claver-cliente, /portal", "Tenencias visibles al cliente (banco / ALyC / tesorería)"],
      ["WhatsApp", "com.whatsapp", "Alerta de ON / vencimiento de plazo fijo"],
      ["Legacy Bridge", "adapters + boletines", "Mismo empaquetado que Approvals / POS"],
    ],
    [3200, 3346, 3200]
  ),
  spacer(140),
  callout(
    "Honestidad de producto",
    "No existe hoy un modelo Tenencia / Instrumento / Valuacion. El piloto lo agrega; no se finge que ya está."
  ),

  h2("3.3 Dominio del módulo"),
  makeTable(
    ["Entidad", "Campos clave"],
    [
      ["Instrumento", "código, ISIN · tipo PF | FCI | ON | CEDEAR | LECAP | USD | GRANO | CDB · mercado BYMA | MAE | BCRA | BCR | BCB"],
      ["Tenencia (cliente o empresa)", "clienteId ↔ SA1 (A1_COD) · cantidad / VN · precioCosto, moneda · custodia · empresaId"],
      ["CotizacionTick", "instrumentoId · fuente API · px · ts"],
      ["ValuacionDiaria", "tenenciaId · pxClose · mtmArs / mtmUsd · pnl / pnlPct"],
    ],
    [2800, 6946]
  ),
  spacer(140),
  p("Fuentes de cotización (conectar APIs, no scrapear UI):"),
  makeTable(
    ["Mercado", "API típica", "Uso"],
    [
      ["FX AR", "BCRA / DolarAPI / Ámbito", "MEP, CCL, oficial — ya modelado en Cotizacion"],
      ["Renta fija / CEDEAR AR", "BYMA (si hay contrato) o proveedor de mercado", "ON, LECAP, CEDEAR"],
      ["Brasil (si el tenant es BR)", "B3 / proveedor local", "CDB, fundos — alinea FINA716"],
      ["Granos", "BCR Rosario (patrón pizarra Claver)", "Acopio / tesorería agro"],
      ["Internacional", "Proveedor con licencia (no Yahoo en producción)", "ADR / overlay"],
    ],
    [2600, 3600, 3546]
  ),

  h2("3.4 Integración Protheus — Inversiones"),
  rich([
    { text: "SKU propuesto: ", bold: true },
    { text: "edge.investments", italics: true },
    "  ·  comercial: Claver Inversiones.",
  ]),
  makeTable(
    ["Dir.", "Origen", "Destino", "Método", "Hint Protheus"],
    [
      ["Salida", "SA1", "Claver (padrón clientes)", "GET /api/fin/v1/customers", "Suele existir REST Fin"],
      ["Salida", "FINA716 / aplicaciones", "Claver tenencias seed", "GET /api/claver/v1/investments/holdings", "Si no hay REST: PRW CLVINV01"],
      ["Salida", "SE8 / saldos bancarios", "Caja del portafolio", "REST Fin bancos", "SIGAFIN"],
      ["Entrada", "Claver valuación diaria", "Asiento / título", "POST /api/claver/v1/investments/valuation", "SIGACTB CT2 o naturaleza tesorería"],
      ["Entrada", "Alta / rescate en Claver", "Aplicación FINA716", "POST …/holdings", "No duplicar: UUID CLV_ID en ZCL030"],
    ],
    [1100, 2100, 2100, 2446, 2000]
  ),
  spacer(140),
  p("Campos custom (borrador de boletín técnico):"),
  makeTable(
    ["Tabla", "Campo", "Tipo", "Uso"],
    [
      ["ZCL030", "CLV_ID", "C 36", "UUID tenencia Claver"],
      ["ZCL030", "CLV_INS", "C 20", "Código instrumento"],
      ["ZCL030", "CLV_QTD", "N 18,6", "Cantidad"],
      ["ZCL030", "CLV_MTM", "N 14,2", "Mark-to-market última corrida"],
      ["SA1", "CLV_INV", "C 1", "Cliente con portafolio (S/N)"],
      ["MV_CLVINV", "—", "L .T.", "Activa integración"],
    ],
    [1800, 1800, 1600, 4546]
  ),
  spacer(140),
  p("Flujo feliz:", { bold: true }),
  numbered("Partner compila CLVINV01.PRW y crea ZCL030.", "n-flujo"),
  numbered("Claver Cloud: tenant origen=protheus, mapeo Customer → SA1.", "n-flujo"),
  numbered("Sync nocturno de tenencias (o on-demand).", "n-flujo"),
  numbered("Cron de cotizaciones (15–60 min en horario de mercado).", "n-flujo"),
  numbered("UI /dashboard/inversiones (tesorería) + /claver-cliente/inversiones (tenencias del cliente).", "n-flujo"),
  numbered("Alerta WhatsApp si MTM vs costo supera umbral.", "n-flujo"),
  numbered("Al cierre, asiento de valuación opcional en SIGACTB (parametrizable; default off en PyME).", "n-flujo"),

  h2("3.5 Qué no es este módulo"),
  bullet("No es ALyC / broker regulado CNV (no custodia títulos)."),
  bullet("No es home banking."),
  bullet("No compite con Techfin en boletos BR."),
  bullet("No pisa FINA716: lo lee y, si el cliente quiere, le escribe aplicaciones con idempotencia.")
);

// ── 4. Catálogo ────────────────────────────────────────────────────────────
children.push(
  h1("4. Catálogo de apps empaquetables para el canal TOTVS"),
  p("Criterio: se vende como app encima de Protheus, no como ERP Claver completo."),
  p("Madurez:", { bold: true, after: 60 }),
  bullet("P0 — puente o producto con código + contrato; piloto en 2–6 semanas."),
  bullet("P1 — producto Claver real; falta PRW / boletín o un gap de dominio."),
  bullet("P2 — empaquetable después; no prometer en el primer deal."),

  h2("Ola 0 — Ya hay contrato + PRW + boletín (edge.*)"),
  p("Estas cinco ya están en CLAVER_APP_BRIDGE_CONTRACTS y data/protheus/advpl/edge/. Los PRW son esqueleto (validan JSON; el MaFatura / MaAprov real se cierra con el analista TOTVS en el piloto)."),
  makeTable(
    ["#", "App", "SKU", "Protheus", "Valor en 30 s"],
    [
      ["1", "Claver Approvals", "edge.approvals", "SCR, SC1/SC7, MATA020", "Aprobar OC y pagos desde el celular"],
      ["2", "Claver Expenses", "edge.expenses", "SE1, CT1, SA1, ZCL010/011", "Viáticos con OCR → título a pagar"],
      ["3", "Claver B2B Portal", "edge.b2b", "SC5/SC6, SF2, SE1, SB1/SB2", "Cliente carga pedido y ve cuenta"],
      ["4", "Claver POS / Kiosk", "edge.pos", "MATA410, SF2/SD2, SB1/SB2", "Mostrador rápido; backoffice intacto"],
      ["5", "Claver Warehouse", "edge.warehouse", "MATA650, SC9, SB2, SD3", "Picking con escáner"],
    ],
    [500, 2000, 1800, 2546, 2900]
  ),

  h2("Ola 1 — Máximo diferencial Argentina / last-mile"),
  p("Vender junto con Inversiones. Es el pack que el canal TOTVS no tiene nativo en AR."),
  makeTable(
    ["#", "App", "SKU Claver", "Encaje Protheus", "PyME", "Grande"],
    [
      ["6", "Claver Inversiones", "edge.investments (nuevo)", "FINA716, SA1, CT2, SE8", "Tesorería dueño", "Tesorería + portal cliente"],
      ["7", "AFIP / factura AR", "fiscal.cert_afip", "SF2/SD2 (estampa CAE)", "Cumplir AR sin módulo BR", "Multi-CUIT / CAEA"],
      ["8", "Cobrá WhatsApp", "intang.cobranzas_wa + com.whatsapp", "SE1 aging", "Recupero sin llamar", "Secuencias D+1/D+7"],
      ["9", "OCR Compras", "intang.ocr_compras / fiscal.ocr", "SD1/SF1, SA2", "Cargar factura con foto", "Cola mail + matching"],
      ["10", "Conciliador MP / tarjetas", "intang.liquidacion_pagos", "SE5 / conciliación", "¿Dónde está la plata de MP?", "Multi-adquirente"],
      ["11", "Links de cobro", "fiscal.clavpay_link", "Baja SE1", "Cobrar por MP", "Recurrencia + seña"],
      ["12", "Recuperador retenciones", "intang.recuperador_fiscal", "SIGACTB / padrón", "Percepciones perdidas", "Apócrifos + IIBB"],
    ],
    [450, 1750, 2100, 1946, 1700, 1800]
  ),

  h2("Ola 2 — Verticales que el canal TOTVS no cubre bien en AR"),
  makeTable(
    ["#", "App", "SKU", "Encaje", "Nota de madurez"],
    [
      ["13", "Hospitalidad (KDS / mesas / mozo)", "hospitalidad dashboard", "SIGALOJA / SC5", "Overlay AR; POS TOTVS Food es otro stack"],
      ["14", "Agro (pizarra, liquidaciones, acopio)", "agro + niche.acopio_grano", "SIGAEST + tesorería", "Pizarra BCR reutilizable; IoT campo no es PRD"],
      ["15", "Consorcios / expensas", "niche.consorcios", "SA1 + SE1", "Mini-SaaS; Protheus no tiene PH"],
      ["16", "Alquileres / garantía", "micro.renta_dueno", "Contratos + SE1", "Dueño 1–10 dptos o inmobiliaria chica"],
      ["17", "Vendedor en ruta", "micro.claver_ruta / /vendedor", "SC5 + SB2 + GPS", "Fuerza de venta con stock del camión"],
      ["18", "Agenda / turnos", "ops.agenda_web / micro.confirma_turnos", "Sin par SIGA", "Salud, oficios, veterinaria"],
      ["19", "Membresías / club", "niche.club_barrio", "SE1 cuotas", "Gimnasio / club"],
      ["20", "Fiado barrio", "pos.fiado_barrio", "Cuenta corriente SA1", "Ancla $0 Claver: no comisiona TOTVS el $0"],
    ],
    [450, 2400, 2500, 1896, 2500]
  ),

  h2("Ola 3 — Enterprise overlay (pack Protheus + Claver Edge)"),
  makeTable(
    ["#", "App", "SKU", "Encaje"],
    [
      ["21", "Helpdesk IA", "data.helpdesk_ia", "Tickets sobre docs del ERP"],
      ["22", "Mañanero (KPI mail)", "data.reportes_prog", "Ventas / caja / stock del día"],
      ["23", "Automation Hub (n8n)", "bridge.n8n_automations", "Eventos: CAE retry, OC, WhatsApp"],
      ["24", "Guardián POS", "intang.guardian_pos", "Anulaciones / egresos raros"],
      ["25", "Reponedor JIT", "intang.reponedor_jit", "SB2 + lead time → OC"],
      ["26", "Ruteador entregas", "intang.ruteador_entregas", "Logística last-mile"],
      ["27", "MFA / Backup", "sec.mfa, sec.backup", "Complemento TCloud, no lo pisa"],
    ],
    [500, 2600, 2800, 3846]
  ),

  h2("Qué no empaquetar como app TOTVS (todavía)"),
  makeTable(
    ["Item", "Por qué"],
    [
      ["ERP Claver Core como “alternativa a Protheus”", "Canibaliza al canal; rompe la tesis"],
      ["IoT agro / AIoT como PRD", "En el repo hay stubs; no prometible"],
      ["VPN, DNS, EDR, email corporativo", "No es diferencial TOTVS; diluye"],
      ["Techfin / boletos BR", "Territorio TOTVS; no competir"],
      ["PRW con TODO: MaFatura sin piloto", "El boletín existe; la homologación no"],
    ],
    [4200, 5546]
  )
);

// ── 5. Mapa integración ────────────────────────────────────────────────────
children.push(
  h1("5. Mapa de integración por app (tablas y APIs)"),
  h2("5.1 Ola 0 (detalle ya en código)"),
  makeTable(
    ["SKU", "REST Claver", "Tablas", "Trigger AdvPL"],
    [
      ["edge.approvals", "GET pending · POST approve / reject", "SCR, SC1, SC7, SE1", "MaAprov / MATA020 · CLV_APROV, CLV_USR, CLV_DTA"],
      ["edge.expenses", "POST/GET /api/claver/v1/expenses", "ZCL010/011 → SE1 + CT1", "Inyección título a pagar al aprobar"],
      ["edge.b2b", "GET/POST orders · invoices · products", "SC5/SC6, SF2, SE1, SB1/SB2", "Pedido portal = SC5; stock SB2"],
      ["edge.pos", "POST /api/claver/v1/pos/tickets", "SF2/SD2, SB1/SB2", "MATA410 / MaFatura · CLV_POS, CLV_CAJ · fiscal AR fuera"],
      ["edge.warehouse", "GET picking-tasks · POST confirm", "SC9, SB2, SD3, ZCL020", "MATA650"],
    ],
    [1800, 2800, 2346, 2800]
  ),
  spacer(120),
  p("Fuentes AdvPL: CLVAPR01.PRW, CLVEXP01/02.PRW, CLVB2B01.PRW, CLVPOS01.PRW, CLVWMS01.PRW."),

  h2("5.2 Patrón fiscal Argentina (crítico)"),
  codeBlock([
    "Venta en Claver POS",
    "    → CAE AFIP (Claver, WSAA / WSFE)",
    "    → POST ticket a Protheus (SF2.F2_CHVNFE o campo CLV_CAE + número)",
    "    → stock SB2 y título SE1 nativos",
  ]),
  spacer(120),
  p("Protheus no emite CAE AR. Si el cliente ya factura con un add-on AR, Claver o el add-on es el emisor: no dos CAE. Decidirlo en el relevamiento."),

  h2("5.3 Cobranzas"),
  codeBlock([
    "SE1 (abiertos, vencidos)  --GET-->   Claver aging",
    "Claver secuencia WhatsApp D+1 / D+7",
    "Pago MP / link            --POST-->  baja / movimiento SE5 (o recibo)",
  ]),
  spacer(120),
  p("Idempotencia por externalId del pago. No duplicar bajas."),

  h2("5.4 Inversiones (nuevo, ver §3.4)"),
  p("Entidad canónica OPO a agregar cuando se implemente: Holding / Instrument. Hoy el enum OPO es solo Customer, Product, Invoice, Order, Supplier.")
);

// ── 6. Valor ───────────────────────────────────────────────────────────────
children.push(
  h1("6. Valor agregado"),
  h2("6.1 PyME (1–50 usuarios, 1–3 sucursales)"),
  p("Perfil: ya compró Protheus (o lo hereda) y opera el 40% del día en Excel / WhatsApp / mostrador."),
  makeTable(
    ["Dolor", "App", "Efecto medible"],
    [
      ["El dueño no abre Protheus para aprobar una OC de $800k", "Approvals", "Horas de ciclo SC7: de días a minutos"],
      ["Tesorería = saldo banco + dólares / plazo fijo en el colchón", "Inversiones", "Posición neta ARS/USD/MTM en una pantalla"],
      ["Cobranzas = llamar", "Cobrá WA", "1 factura cobrada a tiempo paga meses de SaaS"],
      ["Mostrador lento vs. backoffice", "POS Claver", "Ticket en segundos; stock y factura en SIGA"],
      ["Factura de compra a mano", "OCR", "Carga en 30 s"],
      ["Cliente mayorista pide por WhatsApp", "B2B Portal", "Pedido SC5 sin vendedor interno"],
      ["AFIP es un infierno al lado de NFe", "AFIP Claver", "CAE en el cierre de caja"],
    ],
    [3600, 2000, 4146]
  ),
  spacer(140),
  rich([{ text: "Pack PyME sugerido (SKU comercial): ", bold: true }, { text: "pool-totvs-pyme-ar", italics: true }]),
  bullet("Inversiones (si hay tesorería) o POS (si hay mostrador)"),
  bullet("Cobrá WhatsApp + links de cobro"),
  bullet("AFIP"),
  bullet("Approvals"),
  spacer(80),
  p("Precio de lista Claver (orientativo, ARS/mes, sujeto a decisión HUM): apps sueltas $10.000–$25.000; pack $49.000–$89.000. Setup partner TOTVS: 8–24 h ADVPL + CCA."),

  h2("6.2 Gran empresa (multi-filial, TOTVS Cloud, Fluig, shared services)"),
  p("Perfil: Protheus es intocable. Quieren overlay, no otro ERP. Compliance, SSO, ambientes VAL/PRD."),
  makeTable(
    ["Dolor", "App", "Efecto medible"],
    [
      ["Aprobadores en viaje / home office", "Approvals + Fluig", "Mismo workflow MATA020, canal móvil"],
      ["Aplicaciones FINA716 ciegas al mercado", "Inversiones", "MTM diario, PnL, alertas, asiento CT2"],
      ["Fuerza de venta / gastos", "Expenses + Ruta", "SE1 + GPS + OCR"],
      ["B2B con 200 clientes", "Portal", "Self-service; menos CS"],
      ["WMS de piso vs. MATA650 de escritorio", "Warehouse", "Confirmación RF → SB2"],
      ["Shared service de CxC", "Cobrá WA + Mañanero", "Cola, SLA, KPI mail al CFO"],
      ["Controllers quieren VAL → PRD", "Claver Cloud (CCA)", "Equivalente TCloud ONBOARD / MIT 001"],
      ["No exponer REST a internet", "Edge Agent", "Canal VPN"],
    ],
    [3400, 2400, 3946]
  ),
  spacer(140),
  rich([{ text: "Pack Enterprise: ", bold: true }, { text: "pool-totvs-edge", italics: true }]),
  bullet("Approvals + Expenses + B2B + Warehouse"),
  bullet("Inversiones (tesorería)"),
  bullet("Automation Hub"),
  bullet("Helpdesk IA sobre el propio runbook"),
  bullet("MFA"),
  spacer(80),
  p("Setup: proyecto 2–6 semanas, GMUD, usuario REST, boletines firmados. Precio: setup de proyecto + SaaS por app × sede."),

  h2("6.3 Mensaje al canal TOTVS (no al cliente final)"),
  callout(
    "Pitch de canal",
    "No les pedimos que dejen Protheus. Les damos apps que el cliente pide (móvil, WhatsApp, AFIP AR, portafolio) y que ustedes implementan y comisionan. El core SIGA no se toca."
  ),
  spacer(140),
  p("Eso desbloquea: más módulos SIGA licenciados (si el overlay usa FINA716 / MATA020 / MATA650), horas de AMS, y retención del cliente que se iba a un SaaS paralelo.")
);

// ── 7. Comercial ───────────────────────────────────────────────────────────
children.push(
  h1("7. Modelo comercial y comisiones"),
  h2("7.1 Figura TOTVS (oficial)"),
  new Paragraph({
    spacing: { after: 160 },
    children: [
      new TextRun({ text: "Fuente: ", font: "Arial", size: 22, color: "222222" }),
      new ExternalHyperlink({
        children: [new TextRun({ text: "Programa de Parceiros TOTVS", font: "Arial", size: 22, color: "2F6F7E", underline: {} })],
        link: "https://www.totvs.com/seja-um-parceiro/",
      }),
      new TextRun({ text: ". Elegir una figura y no mezclar en el primer contrato.", font: "Arial", size: 22, color: "222222" }),
    ],
  }),
  makeTable(
    ["Figura", "Qué implica", "Cuándo"],
    [
      ["Solução de Negócios", "La app entra al portafolio TOTVS; la venden franquicias", "Objetivo 12 meses, post-homologación"],
      ["Integración homologada", "TOTVS sella el puente Protheus ↔ Claver", "Primeros 1–3 clientes"],
      ["Software embarcado", "Claver inside un producto TOTVS", "Solo si Producto TOTVS lo pide"],
      ["Solución recomendada", "Indican Claver; menos GTM conjunto", "Arranque con el compañero"],
    ],
    [2600, 4146, 3000]
  ),
  spacer(140),
  p("Términos típicos TDN (Specialist / Recommended): TOTVS (o el canal) cobra al cliente y reparte según Quadro Resumo post-liquidez; o Claver factura al cliente e informa ventas de indicación. Los porcentajes no están en este documento: van al anexo comercial HUM."),

  h2("7.2 Tres bolsillos de plata (no mezclar)"),
  makeTable(
    ["Bolsillo", "Quién factura", "Quién cobra comisión"],
    [
      ["Licencia / cloud Protheus", "TOTVS / franquicia", "Canal TOTVS (su modelo)"],
      ["SaaS Claver (apps)", "Claver (Mercado Pago / factura AR)", "Canal TOTVS + compañero implementador"],
      ["Horas ADVPL + CCA", "Compañero / franquicia", "100% de quien implementa"],
    ],
    [3000, 3346, 3400]
  ),

  h2("7.3 Propuesta de split SaaS (borrador interno, no publicado)"),
  p("Alineado al partner Claver actual (seller 30% N1, implementer 20%, bounty 1er mes 100% del extra pago):"),
  makeTable(
    ["Rol", "SaaS mensual apps TOTVS-pack", "Setup"],
    [
      ["Franquicia / canal que cierra", "25–30% mientras el contrato viva", "0% (no lo factura)"],
      ["Compañero implementador", "20% si no es el closer; o 100% del setup", "100% horas"],
      ["Claver Soft", "Resto (hosting, AFIP, WhatsApp, producto)", "—"],
      ["TOTVS corporativo (si Solução de Negócios)", "% Quadro Resumo (suele 10–30% sobre caja TOTVS)", "Según contrato"],
    ],
    [3000, 4146, 2600]
  ),
  spacer(140),
  p("Reglas:", { bold: true, after: 60 }),
  bullet("Ancla Claver $0 (pos.fiado_barrio) no comisiona."),
  bullet("Comisión sobre neto cobrado; clawback 30 días si hay reembolso."),
  bullet("Si TOTVS factura el SaaS (Specialist), Claver emite a TOTVS según Relatório de Recebimento; no al cliente."),
  bullet("Si Claver factura (Recommended), reporte día 10 con CNPJ/CUIT, SKU y neto."),

  h2("7.4 Quién vende qué en la reunión"),
  makeTable(
    ["Persona", "Habla de", "No habla de"],
    [
      ["Compañero TOTVS", "Protheus, FINA716, GMUD, horas, confianza del cliente", "Precios Claver de calle / fiado $0"],
      ["Claver", "Apps, AFIP AR, WhatsApp, Inversiones UI, SLA SaaS", "“Nosotros reemplazamos SIGAFIN”"],
      ["Humano Claver (HUM)", "Split, lista, piloto, legal CNV si Inversiones se va de tesorería a oferta pública", "—"],
    ],
    [2400, 4000, 3346]
  )
);

// ── 8. 90 días ─────────────────────────────────────────────────────────────
children.push(
  h1("8. Plan de 90 días con el compañero"),
  h2("Semanas 1–2 — Alcance"),
  numbered("Elegir un cliente piloto (ideal: PyME AR con Protheus 12 + tesorería, o retail con mostrador).", "n-s12"),
  numbered("Elegir una app cuña: Inversiones o POS o Approvals (no las tres).", "n-s12"),
  numbered("Inventario: versión Protheus, Cloud vs on-prem, REST prendido, Fluig sí/no, emisor fiscal AR.", "n-s12"),
  numbered("Firmar figura de partner (Recommended alcanza para el piloto).", "n-s12"),

  h2("Semanas 3–6 — Puente"),
  numbered("Ambiente VAL: [HTTPREST] + usuario REST.", "n-s36"),
  numbered("Compilar PRW de la app cuña; campos CLV_*.", "n-s36"),
  numbered("Tenant Claver origen=protheus, test bridgeTestOk.", "n-s36"),
  numbered("Si Inversiones: 1 fuente de cotización (FX) + 1 instrumento + 3 tenencias de prueba SA1.", "n-s36"),
  numbered("Checklist del boletín técnico (plantilla en technical-bulletins.ts).", "n-s36"),

  h2("Semanas 7–10 — UAT / go-live"),
  numbered("UAT con el usuario real (tesorero / cajero / aprobador).", "n-s710"),
  numbered("VAL → PRD (CCA / equivalente TCloud).", "n-s710"),
  numbered("Runbook de soporte L1 en la franquicia + L2 Claver.", "n-s710"),
  numbered("Case de 1 página para el canal (antes/después, horas, ARR).", "n-s710"),

  h2("Semana 12 — Decisión de portafolio"),
  bullet("Homologar integración."),
  bullet("Armar pool-totvs-pyme-ar y lista para el canal."),
  bullet("Segunda app del mismo cliente (upsell típico: Inversiones → Cobrá, o POS → AFIP).")
);

// ── 9. Entregables ─────────────────────────────────────────────────────────
children.push(
  h1("9. Entregables técnicos por app (definición de “empaquetada”)"),
  p("Una app está lista para el canal TOTVS cuando existen:"),
  bullet("SKU en marketplace Claver + precio + autoCertLevel"),
  bullet("Contrato REST (api-contracts.ts)"),
  bullet("Boletín (technical-bulletins.ts) con tablas, MV, PRW y seguridad"),
  bullet("Fuente .PRW compilable (sin TODO de negocio en el camino feliz)"),
  bullet("UI golden path + portal si aplica"),
  bullet("Tests: adapter Protheus demo + 1 caso REST"),
  bullet("Runbook analista (Claver Cloud)"),
  bullet("One-pager canal (dolor, módulos SIGA que se usan, no se pisan)"),
  bullet("Matriz de soporte L1 / L2"),
  spacer(120),
  callout(
    "Estado actual",
    "Ola 0 cumple contrato + boletín + PRW esqueleto. Falta cerrar rutinas nativas (MaAprov, MaFatura) en el piloto. Inversiones parte de cero de dominio y reusa Bridge + Cotizacion + pizarra."
  )
);

// ── 10. Referencias ────────────────────────────────────────────────────────
children.push(
  h1("10. Referencias internas"),
  makeTable(
    ["Tema", "Path"],
    [
      ["Bridge y tipos", "lib/legacy-bridge/types.ts"],
      ["Contratos", "lib/legacy-bridge/api-contracts.ts"],
      ["Boletines", "lib/legacy-bridge/technical-bulletins.ts"],
      ["Adapters", "lib/legacy-bridge/adapters/protheus-rest.ts, protheus-agent.ts"],
      ["AdvPL", "data/protheus/advpl/edge/"],
      ["SKUs", "lib/marketplace/marketplace-catalog.ts"],
      ["Nichos", "lib/niche/niche-apps-catalog.ts"],
      ["Micro-SaaS", "lib/comercial/micro-saas-portfolio.ts"],
      ["Partner Claver (comisiones actuales)", "docs/comercial/PROGRAMA_PARTNER_CLAVER.md"],
      ["Qué se puede vender en PRD", "docs/GO_LIVE_PRD.md"],
      ["CCA / MIT 001", "docs/operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md"],
    ],
    [3800, 5946]
  )
);

// ── 11. Decisiones ─────────────────────────────────────────────────────────
children.push(
  h1("11. Decisiones de la próxima reunión"),
  numberedRich([{ text: "App cuña: ", bold: true }, "Inversiones vs Approvals vs POS. Recomendación: Inversiones si el cliente es tesorería/finanzas; POS+AFIP si es retail AR; Approvals si es industria con MATA020 ya vivo."], "n-decision"),
  numberedRich([{ text: "Figura legal TOTVS: ", bold: true }, "Recommended (rápido) vs Integración homologada (más peso de canal)."], "n-decision"),
  numberedRich([{ text: "Quién factura el SaaS ", bold: true }, "en el piloto: Claver directo (simple) vs caja TOTVS (escala)."], "n-decision"),
  numberedRich([{ text: "Cliente piloto ", bold: true }, "con REST o con permiso de GMUD en 30 días."], "n-decision"),
  spacer(160),
  callout(
    "Cierre",
    "Sin esos cuatro puntos no se escribe ADVPL de más ni se arma lista de precios pública."
  )
);

const doc = new Document({
  creator: "Grupo Claver",
  title: "Claver × TOTVS Protheus — Apps de partner, integración y valor",
  description: "Brief técnico para alianza Claver Soft y canal TOTVS Protheus.",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: { config: numberingConfig() },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
              border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 6 } },
              spacing: { after: 80 },
              children: [
                new TextRun({ text: "Grupo Claver  ·  Confidencial comercial", font: "Arial", size: 16, color: MUTED }),
                new TextRun({ text: "\t", font: "Arial", size: 16 }),
                new TextRun({ text: "Alianza TOTVS Protheus", font: "Arial", size: 16, color: TEAL }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
              border: { top: { style: BorderStyle.SINGLE, size: 8, color: "D0D7DA", space: 8 } },
              spacing: { before: 80 },
              children: [
                new TextRun({ text: "Brief técnico  ·  17/09/2026  ·  No es contrato", font: "Arial", size: 16, color: MUTED }),
                new TextRun({ text: "\t", font: "Arial", size: 16 }),
                new TextRun({ text: "Pág. ", font: "Arial", size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MUTED }),
                new TextRun({ text: " / ", font: "Arial", size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buffer);
  console.log("Wrote", OUT, buffer.length, "bytes");
});

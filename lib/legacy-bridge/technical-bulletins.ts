import path from "path"
import type { ClaverAppTechnicalBulletin } from "./types"

const PRW_ROOT = path.join("data", "protheus", "advpl", "edge")

function prw(app: string, file: string): string {
  return path.join(PRW_ROOT, app, file).replace(/\\/g, "/")
}

/** Boletines técnicos — uno por Claver App Edge */
export const CLAVER_APP_TECHNICAL_BULLETINS: ClaverAppTechnicalBulletin[] = [
  {
    sku: "edge.approvals",
    version: "1.0.0",
    protheusMinVersion: "12.1.2310",
    modulosProtheus: ["SIGACOM", "SIGAFIN", "MATA020"],
    tablasNativas: ["SC1", "SC7", "SE1", "SCR"],
    camposCustom: [
      {
        tabla: "SCR",
        campo: "CLV_APROV",
        tipo: "C",
        tamanho: 1,
        titulo: "Aprobado vía Claver",
        descricao: "S=aprobado desde Claver Approvals; N=pendiente",
        contexto: "R",
        valorDefault: "N",
      },
      {
        tabla: "SCR",
        campo: "CLV_USR",
        tipo: "C",
        tamanho: 50,
        titulo: "Usuario Claver",
        descricao: "Email o ID del aprobador en Claver Edge",
        contexto: "R",
      },
      {
        tabla: "SCR",
        campo: "CLV_DTA",
        tipo: "D",
        tamanho: 8,
        titulo: "Fecha aprobación Claver",
        descricao: "Timestamp de la acción en la app móvil",
        contexto: "R",
      },
    ],
    parametrosMV: [
      {
        mv: "MV_CLVAPR",
        tipo: "L",
        defaultValue: ".T.",
        descripcion: "Activa integración Claver Approvals",
      },
      {
        mv: "MV_CLVAPU",
        tipo: "C",
        defaultValue: "",
        descripcion: "Usuario REST dedicado para Claver (tabla USR)",
      },
    ],
    flujosDatos: [
      {
        id: "pending-out",
        direccion: "salida",
        origen: "SCR + SC1/SC7 (workflow MATA020)",
        destino: "Claver Approvals UI",
        metodo: "GET /api/claver/v1/approvals/pending",
        formato: "JSON",
        descripcion: "Lista documentos pendientes del usuario autenticado",
        validaciones: ["Filtrar por aprobador = usuario REST", "Excluir documentos ya aprobados"],
      },
      {
        id: "approve-in",
        direccion: "entrada",
        origen: "Claver Approvals (tap Aprobar)",
        destino: "Workflow nativo Protheus",
        metodo: "POST /api/claver/v1/approvals/{id}/approve",
        formato: "JSON",
        descripcion: "Dispara rutina de aprobación estándar (MaAprov / MATA020)",
        triggerProtheus: "MaAprov() o ExecBlock del workflow configurado",
        validaciones: ["Verificar que el doc sigue pendiente", "Registrar CLV_USR y CLV_DTA"],
      },
      {
        id: "reject-in",
        direccion: "entrada",
        origen: "Claver Approvals (tap Rechazar)",
        destino: "SCR + historial workflow",
        metodo: "POST /api/claver/v1/approvals/{id}/reject",
        formato: "JSON",
        descripcion: "Rechazo con motivo obligatorio",
        validaciones: ["motivo no vacío", "Notificar solicitante vía workflow"],
      },
    ],
    archivosPrw: [
      {
        archivo: "CLVAPR01.PRW",
        rutaRepo: prw("approvals", "CLVAPR01.PRW"),
        descripcion: "Servicio REST de aprobaciones pendientes, approve y reject",
        ordenCompilacion: 1,
        exponeEndpoints: [
          "GET /api/claver/v1/approvals/pending",
          "POST /api/claver/v1/approvals/{id}/approve",
          "POST /api/claver/v1/approvals/{id}/reject",
        ],
        compilacion: "TDS",
      },
    ],
    ordenCompilacion: ["CLVAPR01.PRW"],
    checklistImplementacion: [
      "Crear campos CLV_* en SCR vía Configurador (SX3) o importar SXB",
      "Registrar MV_CLVAPR y MV_CLVAPU",
      "Compilar CLVAPR01.PRW en TDS → actualizar RPO del ambiente",
      "Reiniciar AppServer y verificar en /tlpp/rest/list/service",
      "Probar GET pending con usuario de integración",
      "Probar approve/reject con documento de prueba SC1",
    ],
    notasSeguridad: [
      "Usuario REST con permiso solo a tablas del flujo de aprobación",
      "No exponer contraseñas de aprobadores — usar token Claver → mapeo USR",
      "Auditar cada approve/reject en log CLV (ZCL opcional)",
    ],
    prerequisitos: [
      "Workflow de aprobaciones activo (MATA020)",
      "[HTTPREST] habilitado en appserver.ini",
      "Usuario de integración con privilegios de lectura SCR y escritura workflow",
    ],
  },
  {
    sku: "edge.expenses",
    version: "1.0.0",
    protheusMinVersion: "12.1.2310",
    modulosProtheus: ["SIGAFIN", "SIGACTB", "CT1"],
    tablasNativas: ["SE1", "CT1", "SA1"],
    camposCustom: [
      {
        tabla: "ZCL010",
        campo: "CLV_ID",
        tipo: "C",
        tamanho: 36,
        titulo: "ID Claver Expenses",
        descricao: "UUID de la rendición en Claver Edge",
        contexto: "R",
        obrigatorio: true,
      },
      {
        tabla: "ZCL010",
        campo: "CLV_EMP",
        tipo: "C",
        tamanho: 6,
        titulo: "Código empleado",
        descricao: "RA_EMPLOYEE o SRA",
        contexto: "R",
        obrigatorio: true,
      },
      {
        tabla: "ZCL010",
        campo: "CLV_STS",
        tipo: "C",
        tamanho: 1,
        titulo: "Estado rendición",
        descricao: "P=pendiente, A=aprobada, R=rechazada, I=inyectada SE1",
        contexto: "R",
        valorDefault: "P",
      },
      {
        tabla: "ZCL010",
        campo: "CLV_TOT",
        tipo: "N",
        tamanho: 14,
        decimais: 2,
        titulo: "Total rendición",
        descricao: "Suma de ítems enviados desde Claver",
        contexto: "R",
      },
      {
        tabla: "ZCL011",
        campo: "CLV_LIN",
        tipo: "N",
        tamanho: 4,
        titulo: "Línea",
        descricao: "Secuencia del ítem de gasto",
        contexto: "R",
      },
      {
        tabla: "ZCL011",
        campo: "CLV_CON",
        tipo: "C",
        tamanho: 40,
        titulo: "Concepto",
        descricao: "Descripción del gasto (OCR Claver)",
        contexto: "R",
      },
      {
        tabla: "ZCL011",
        campo: "CLV_VAL",
        tipo: "N",
        tamanho: 14,
        decimais: 2,
        titulo: "Monto ítem",
        descricao: "Importe del ticket/gasto",
        contexto: "R",
      },
      {
        tabla: "ZCL011",
        campo: "CLV_URL",
        tipo: "C",
        tamanho: 250,
        titulo: "URL adjunto",
        descricao: "Link al ticket escaneado en Claver",
        contexto: "R",
      },
    ],
    parametrosMV: [
      {
        mv: "MV_CLVEXP",
        tipo: "L",
        defaultValue: ".T.",
        descripcion: "Activa integración Claver Expenses",
      },
      {
        mv: "MV_CLVCTA",
        tipo: "C",
        defaultValue: "",
        descripcion: "Cuenta contable default para gastos de rendición (CT1)",
      },
      {
        mv: "MV_CLVCC",
        tipo: "C",
        defaultValue: "",
        descripcion: "Centro de costo default para viáticos",
      },
    ],
    flujosDatos: [
      {
        id: "expense-create-in",
        direccion: "entrada",
        origen: "Claver Expenses (móvil, OCR ticket)",
        destino: "ZCL010 + ZCL011",
        metodo: "POST /api/claver/v1/expenses",
        formato: "JSON",
        descripcion: "Alta de rendición con ítems y adjuntos",
        validaciones: ["empleadoId existe en SRA", "monto > 0", "categoría válida"],
      },
      {
        id: "expense-read-out",
        direccion: "salida",
        origen: "ZCL010/ZCL011 + estado workflow",
        destino: "Claver Expenses UI",
        metodo: "GET /api/claver/v1/expenses/{id}",
        formato: "JSON",
        descripcion: "Consulta estado y detalle de rendición",
      },
      {
        id: "expense-inject-out",
        direccion: "salida",
        origen: "ZCL010 aprobada",
        destino: "SE1 (título a pagar) + asiento CT1",
        metodo: "ExecAuto Fin040 ou rotina custom",
        formato: "SQL",
        descripcion: "Al aprobar en Protheus, inyectar a módulo financiero",
        triggerProtheus: "Punto de entrada CLVEXPPE ou MaContabiliza",
        validaciones: ["CLV_STS = A antes de inyectar", "No duplicar en SE1"],
      },
      {
        id: "customer-read-out",
        direccion: "salida",
        origen: "SA1",
        destino: "Claver Expenses (asignación CC)",
        metodo: "GET /api/fin/v1/customers",
        formato: "JSON",
        descripcion: "Lectura de clientes/CC — puede reutilizar REST Fin estándar",
      },
    ],
    archivosPrw: [
      {
        archivo: "CLVEXP01.PRW",
        rutaRepo: prw("expenses", "CLVEXP01.PRW"),
        descripcion: "REST: alta y consulta de rendiciones (ZCL)",
        ordenCompilacion: 1,
        exponeEndpoints: [
          "POST /api/claver/v1/expenses",
          "GET /api/claver/v1/expenses/{id}",
        ],
        compilacion: "TDS",
      },
      {
        archivo: "CLVEXP02.PRW",
        rutaRepo: prw("expenses", "CLVEXP02.PRW"),
        descripcion: "Punto de entrada: inyección SE1 al aprobar rendición",
        ordenCompilacion: 2,
        dependencias: ["CLVEXP01.PRW"],
        exponeEndpoints: [],
        compilacion: "TDS",
      },
    ],
    ordenCompilacion: ["CLVEXP01.PRW", "CLVEXP02.PRW"],
    checklistImplementacion: [
      "Crear tablas ZCL010 (cabecera) y ZCL011 (ítems) en el diccionario",
      "Crear índices: ZCL010 por CLV_ID (único) y CLV_EMP+CLV_STS",
      "Registrar MV_CLVEXP, MV_CLVCTA, MV_CLVCC",
      "Compilar CLVEXP01.PRW y CLVEXP02.PRW",
      "Configurar punto de entrada CLVEXPPE en el workflow de aprobación",
      "Probar POST con JSON de ejemplo desde Postman/cURL",
      "Validar inyección SE1 con rendición de prueba",
    ],
    notasSeguridad: [
      "Tabla ZCL solo accesible por usuario REST de integración",
      "URLs de adjuntos: validar dominio Claver (no open redirect)",
      "No permitir modificar rendición con CLV_STS = I (ya inyectada)",
    ],
    prerequisitos: [
      "Tablas Z disponibles en el ambiente (SIGACFG)",
      "Módulo Finanzas activo para inyección SE1",
      "[HTTPREST] habilitado",
    ],
  },
  {
    sku: "edge.b2b",
    version: "1.0.0",
    protheusMinVersion: "12.1.2310",
    modulosProtheus: ["SIGAFAT", "SIGAFIN", "SB1"],
    tablasNativas: ["SC5", "SC6", "SF2", "SE1", "SA1", "SB1"],
    camposCustom: [
      {
        tabla: "SC5",
        campo: "CLV_B2B",
        tipo: "C",
        tamanho: 1,
        titulo: "Pedido portal B2B",
        descricao: "S=originado en Claver B2B Portal",
        contexto: "R",
        valorDefault: "N",
      },
      {
        tabla: "SC5",
        campo: "CLV_EXT",
        tipo: "C",
        tamanho: 36,
        titulo: "ID externo Claver",
        descricao: "UUID del pedido en el portal",
        contexto: "R",
      },
    ],
    parametrosMV: [
      { mv: "MV_CLVB2B", tipo: "L", defaultValue: ".T.", descripcion: "Activa portal B2B Claver" },
      { mv: "MV_CLVTP", tipo: "C", defaultValue: "01", descripcion: "Tipo de pedido default SC5" },
    ],
    flujosDatos: [
      {
        id: "orders-out",
        direccion: "salida",
        origen: "SC5/SC6 filtrado por cliente portal",
        destino: "Claver B2B Portal",
        metodo: "GET /api/claver/v1/b2b/orders",
        formato: "JSON",
        descripcion: "Historial de pedidos del cliente autenticado",
      },
      {
        id: "invoices-out",
        direccion: "salida",
        origen: "SF2 + SE1 saldo",
        destino: "Claver B2B Portal",
        metodo: "GET /api/claver/v1/b2b/invoices",
        formato: "JSON",
        descripcion: "Facturas y estado de cuenta",
      },
      {
        id: "products-out",
        direccion: "salida",
        origen: "SB1/SB2",
        destino: "Claver B2B Portal",
        metodo: "GET /api/acproduct/v1/products",
        formato: "JSON",
        descripcion: "Catálogo — preferir REST estándar AC Product si existe",
      },
      {
        id: "order-create-in",
        direccion: "entrada",
        origen: "Claver B2B Portal",
        destino: "SC5/SC6 vía MATA410 o ExecAuto",
        metodo: "POST /api/claver/v1/b2b/orders",
        formato: "JSON",
        descripcion: "Alta de pedido desde portal",
        triggerProtheus: "MaPedido() / rotina comercial estándar",
        validaciones: ["Cliente activo SA1", "Stock SB2", "Precio tabla vigente"],
      },
    ],
    archivosPrw: [
      {
        archivo: "CLVB2B01.PRW",
        rutaRepo: prw("b2b", "CLVB2B01.PRW"),
        descripcion: "REST pedidos, facturas y alta pedido portal",
        ordenCompilacion: 1,
        exponeEndpoints: [
          "GET /api/claver/v1/b2b/orders",
          "GET /api/claver/v1/b2b/invoices",
          "POST /api/claver/v1/b2b/orders",
        ],
        compilacion: "TDS",
      },
    ],
    ordenCompilacion: ["CLVB2B01.PRW"],
    checklistImplementacion: [
      "Campos CLV_B2B y CLV_EXT en SC5",
      "Compilar CLVB2B01.PRW",
      "Mapear autenticación portal → código cliente SA1",
      "Probar lectura pedidos/facturas con cliente de prueba",
      "Probar alta pedido y verificar SC5/SC6",
    ],
    notasSeguridad: [
      "Cada token de portal solo ve datos de SU cliente (SA1)",
      "Rate limit en POST pedidos",
    ],
    prerequisitos: ["Módulo Comercial activo", "REST AC Product o CLVB2B01 para catálogo"],
  },
  {
    sku: "edge.pos",
    version: "1.0.0",
    protheusMinVersion: "12.1.2310",
    modulosProtheus: ["SIGAFAT", "MATA410", "SB1"],
    tablasNativas: ["SF2", "SD2", "SB1", "SB2"],
    camposCustom: [
      {
        tabla: "SF2",
        campo: "CLV_POS",
        tipo: "C",
        tamanho: 1,
        titulo: "Ticket Claver POS",
        descricao: "S=venta originada en Claver POS/Kiosk",
        contexto: "R",
      },
      {
        tabla: "SF2",
        campo: "CLV_CAJ",
        tipo: "C",
        tamanho: 6,
        titulo: "Caja Claver",
        descricao: "Identificador de terminal POS",
        contexto: "R",
      },
    ],
    parametrosMV: [
      { mv: "MV_CLVPOS", tipo: "L", defaultValue: ".T.", descripcion: "Activa Claver POS" },
      { mv: "MV_CLVPV", tipo: "C", defaultValue: "0001", descripcion: "Punto de venta fiscal default" },
    ],
    flujosDatos: [
      {
        id: "catalog-out",
        direccion: "salida",
        origen: "SB1/SB2",
        destino: "Claver POS",
        metodo: "GET /api/acproduct/v1/products",
        formato: "JSON",
        descripcion: "Catálogo con precio y stock para mostrador",
      },
      {
        id: "ticket-in",
        direccion: "entrada",
        origen: "Claver POS (cierre venta)",
        destino: "SF2/SD2 vía MATA410",
        metodo: "POST /api/claver/v1/pos/tickets",
        formato: "JSON",
        descripcion: "Inyecta ticket fiscal al backoffice",
        triggerProtheus: "MATA410 / MaFatura",
        validaciones: ["Totales cuadran", "Medios de pago válidos", "Stock descontado"],
      },
    ],
    archivosPrw: [
      {
        archivo: "CLVPOS01.PRW",
        rutaRepo: prw("pos", "CLVPOS01.PRW"),
        descripcion: "REST inyección de tickets POS",
        ordenCompilacion: 1,
        exponeEndpoints: ["POST /api/claver/v1/pos/tickets"],
        compilacion: "TDS",
      },
    ],
    ordenCompilacion: ["CLVPOS01.PRW"],
    checklistImplementacion: [
      "Campos CLV_POS y CLV_CAJ en SF2",
      "Compilar CLVPOS01.PRW",
      "Configurar MV_CLVPV según punto de venta fiscal",
      "Probar ticket de prueba y verificar SF2/SD2",
      "Validar numeración fiscal con módulo local (AR: AFIP)",
    ],
    notasSeguridad: ["Idempotencia por ticketId — no duplicar SF2", "Caja autenticada por token"],
    prerequisitos: ["MATA410 activo", "Configuración fiscal del cliente"],
  },
  {
    sku: "edge.warehouse",
    version: "1.0.0",
    protheusMinVersion: "12.1.2310",
    modulosProtheus: ["SIGAEST", "MATA650"],
    tablasNativas: ["SC9", "SB1", "SB2", "SD3"],
    camposCustom: [
      {
        tabla: "ZCL020",
        campo: "CLV_TSK",
        tipo: "C",
        tamanho: 20,
        titulo: "ID tarea picking",
        descricao: "Identificador de tarea WMS Claver",
        contexto: "R",
        obrigatorio: true,
      },
      {
        tabla: "ZCL020",
        campo: "CLV_OPE",
        tipo: "C",
        tamanho: 6,
        titulo: "Operador",
        descricao: "Código operador depósito (SRA o custom)",
        contexto: "R",
      },
      {
        tabla: "ZCL020",
        campo: "CLV_STS",
        tipo: "C",
        tamanho: 1,
        titulo: "Estado tarea",
        descricao: "A=asignada, P=en proceso, C=confirmada",
        contexto: "R",
      },
    ],
    parametrosMV: [
      { mv: "MV_CLVWMS", tipo: "L", defaultValue: ".T.", descripcion: "Activa Claver Warehouse" },
    ],
    flujosDatos: [
      {
        id: "tasks-out",
        direccion: "salida",
        origen: "SC9/MATA650 + ZCL020",
        destino: "Claver Warehouse (escáner)",
        metodo: "GET /api/claver/v1/wms/picking-tasks",
        formato: "JSON",
        descripcion: "Tareas asignadas al operador logueado",
      },
      {
        id: "confirm-in",
        direccion: "entrada",
        origen: "Claver Warehouse (escaneo confirmación)",
        destino: "SD3 / MATA650 baixa estoque",
        metodo: "POST /api/claver/v1/wms/picking-tasks/{id}/confirm",
        formato: "JSON",
        descripcion: "Confirma picking y descuenta stock",
        triggerProtheus: "MATA650 / ExecAuto estoque",
        validaciones: ["qty <= pendiente", "Lote válido si aplica"],
      },
    ],
    archivosPrw: [
      {
        archivo: "CLVWMS01.PRW",
        rutaRepo: prw("warehouse", "CLVWMS01.PRW"),
        descripcion: "REST tareas picking y confirmación",
        ordenCompilacion: 1,
        exponeEndpoints: [
          "GET /api/claver/v1/wms/picking-tasks",
          "POST /api/claver/v1/wms/picking-tasks/{id}/confirm",
        ],
        compilacion: "TDS",
      },
    ],
    ordenCompilacion: ["CLVWMS01.PRW"],
    checklistImplementacion: [
      "Crear tabla ZCL020 para tareas WMS",
      "Compilar CLVWMS01.PRW",
      "Integrar con MATA650 o módulo WMS del cliente",
      "Probar flujo asignar → escanear → confirmar",
    ],
    notasSeguridad: ["Operador solo ve SUS tareas", "Confirmación atómica (no doble descuento)"],
    prerequisitos: ["Módulo Estoque activo", "Depósitos SBW configurados"],
  },
]

export function getTechnicalBulletinBySku(sku: string): ClaverAppTechnicalBulletin | undefined {
  return CLAVER_APP_TECHNICAL_BULLETINS.find((b) => b.sku === sku)
}

export function formatTechnicalBulletin(bulletin: ClaverAppTechnicalBulletin): string {
  const lines: string[] = [
    `# Boletín Técnico Protheus — ${bulletin.sku}`,
    "",
    `**Versión:** ${bulletin.version} | **Protheus mínimo:** ${bulletin.protheusMinVersion}`,
    "",
    "## Módulos y tablas",
    "",
    `- Módulos: ${bulletin.modulosProtheus.join(", ")}`,
    `- Tablas nativas: ${bulletin.tablasNativas.join(", ")}`,
    "",
    "## Prerrequisitos",
    "",
    ...bulletin.prerequisitos.map((p) => `- ${p}`),
    "",
    "## Campos a crear (SX3 / tablas Z)",
    "",
    "| Tabla | Campo | Tipo | Tamaño | Título | Descripción |",
    "|-------|-------|------|--------|--------|-------------|",
    ...bulletin.camposCustom.map(
      (f) =>
        `| ${f.tabla} | ${f.campo} | ${f.tipo} | ${f.tamanho} | ${f.titulo} | ${f.descricao} |`,
    ),
    "",
    "## Parámetros MV",
    "",
    ...bulletin.parametrosMV.map(
      (p) => `- **${p.mv}** (${p.tipo}, default \`${p.defaultValue}\`): ${p.descripcion}`,
    ),
    "",
    "## Flujos de ingreso / egreso de datos",
    "",
  ]

  for (const flow of bulletin.flujosDatos) {
    lines.push(`### ${flow.id} — ${flow.direccion.toUpperCase()}`)
    lines.push(`- **Origen:** ${flow.origen}`)
    lines.push(`- **Destino:** ${flow.destino}`)
    lines.push(`- **Método:** \`${flow.metodo}\` (${flow.formato})`)
    lines.push(`- ${flow.descripcion}`)
    if (flow.triggerProtheus) lines.push(`- _Trigger Protheus:_ ${flow.triggerProtheus}`)
    if (flow.validaciones?.length) {
      lines.push("- Validaciones:")
      for (const v of flow.validaciones) lines.push(`  - ${v}`)
    }
    lines.push("")
  }

  lines.push("## Archivos fuente AdvPL (.PRW)")
  lines.push("")
  lines.push("| Archivo | Orden | Descripción | Endpoints |")
  lines.push("|---------|-------|-------------|-----------|")
  for (const prw of bulletin.archivosPrw) {
    lines.push(
      `| ${prw.archivo} | ${prw.ordenCompilacion} | ${prw.descripcion} | ${prw.exponeEndpoints.join(", ") || "—"} |`,
    )
    lines.push(`| ↳ Ruta repo | \`${prw.rutaRepo}\` | Compilar con ${prw.compilacion} | |`)
  }

  lines.push("")
  lines.push("### Orden de compilación")
  lines.push("")
  lines.push(bulletin.ordenCompilacion.map((f, i) => `${i + 1}. \`${f}\``).join("\n"))

  lines.push("")
  lines.push("## Checklist de implementación")
  lines.push("")
  for (const [i, step] of bulletin.checklistImplementacion.entries()) {
    lines.push(`${i + 1}. ${step}`)
  }

  lines.push("")
  lines.push("## Notas de seguridad")
  lines.push("")
  for (const note of bulletin.notasSeguridad) {
    lines.push(`- ${note}`)
  }

  return lines.join("\n")
}
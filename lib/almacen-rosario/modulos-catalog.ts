/**
 * Catálogo canónico de módulos Pack Almacén Rosario.
 * Fuente para UI, runbooks y documentación.
 */
import { RETAIL_SKU_META } from "./retail-skus"

export type SuperficieModulo = "pos" | "dashboard" | "ambos" | "automatico"

export interface ModuloAlmacenRosario {
  sku: string
  nombre: string
  lema: string
  precioArs: number
  superficie: SuperficieModulo
  activacion: string
  pasosUso: string[]
  api?: string
  docAnchor: string
  flujoMermaid: string
}

const CORE_META: Record<string, Omit<ModuloAlmacenRosario, "sku" | "precioArs"> & { precioArs: number }> = {
  "pos.margen_guard": {
    nombre: "Guardián de Margen",
    lema: "Que el costo no te coma el margen.",
    precioArs: 3990,
    superficie: "automatico",
    activacion: "App Store → Activar → venta en POS evalúa costo vs precio",
    pasosUso: [
      "Subí lista distribuidora o actualizá precio de compra",
      "Al vender, el POS alerta o ajusta si el margen es negativo",
    ],
    api: "POST /api/pos/almacen/evaluar-producto",
    docAnchor: "margen-guard",
    flujoMermaid: `flowchart LR\n  A[Lista sube costo] --> B[POS agrega producto]\n  B --> C{Margen OK?}\n  C -->|No| D[Alerta o precio sugerido]\n  C -->|Sí| E[Venta normal]`,
  },
  "pos.zero_waste": {
    nombre: "Zero Waste",
    lema: "Vendé antes de tirar.",
    precioArs: 5990,
    superficie: "dashboard",
    activacion: "App Store → Activar → cron y panel muestran ofertas",
    pasosUso: [
      "Productos próximos a vencer aparecen con descuento sugerido",
      "Verdulería tarde: descuento automático después del horario configurado",
    ],
    api: "GET /api/almacen-rosario/resumen",
    docAnchor: "zero-waste",
    flujoMermaid: `flowchart LR\n  A[Vencimiento cercano] --> B[Cron / panel]\n  B --> C[Descuento sugerido]\n  C --> D[Cajero vende con promo]`,
  },
  "pos.stock_cero_alert": {
    nombre: "Alerta Stock Cero",
    lema: "Vendé sin frenar, avisá al dueño.",
    precioArs: 2990,
    superficie: "automatico",
    activacion: "App Store → Activar → ventas con stock 0 se registran",
    pasosUso: ["Vendés aunque el stock figure en 0", "El dueño recibe resumen diario en panel Almacén"],
    api: "GET /api/almacen-rosario/resumen",
    docAnchor: "stock-cero",
    flujoMermaid: `flowchart LR\n  A[Venta POS stock=0] --> B[Factura OK]\n  B --> C[Evento stock cero]\n  C --> D[Alerta dueño]`,
  },
  "pos.promos_pago": {
    nombre: "Promos Medios de Pago",
    lema: "MODO y BSF sin memorizar.",
    precioArs: 2990,
    superficie: "pos",
    activacion: "App Store → Activar → banner en cobro del POS",
    pasosUso: ["Al abrir cobro, el POS muestra promos del día (MP, MODO, BSF)", "El cajero ofrece el medio con reintegro"],
    api: "GET /api/pos/almacen/promos-hoy",
    docAnchor: "promos-pago",
    flujoMermaid: `flowchart LR\n  A[Día/hora] --> B[Promo activa]\n  B --> C[Banner en POS cobro]\n  C --> D[Cliente paga con medio promo]`,
  },
  "pos.lista_distribuidora": {
    nombre: "Importador Listas",
    lema: "Excel de distribuidora → precios POS.",
    precioArs: 4990,
    superficie: "dashboard",
    activacion: "App Store → Activar → panel Almacén → pegar CSV",
    pasosUso: ["Pegá CSV de Micropack/Vital/Makro", "Analizá coincidencias", "Aplicá precios sugeridos"],
    api: "POST /api/almacen-rosario/importar-lista",
    docAnchor: "lista-distribuidora",
    flujoMermaid: `flowchart LR\n  A[CSV distribuidora] --> B[Preview match]\n  B --> C[Aplicar precios]\n  C --> D[POS actualizado]`,
  },
  "pos.panico_vecinal": {
    nombre: "Pánico Vecinal",
    lema: "Botón silencioso en el POS.",
    precioArs: 1990,
    superficie: "pos",
    activacion: "App Store → Activar + WhatsApp ON → Alt+F12 3s en POS",
    pasosUso: ["Mantené Alt+F12 tres segundos en POS", "Se envía alerta WA a vecinos configurados"],
    api: "POST /api/pos/almacen/panico",
    docAnchor: "panico-vecinal",
    flujoMermaid: `flowchart LR\n  A[Alt+F12 3s] --> B[API pánico]\n  B --> C[WA vecinos comerciantes]`,
  },
  "pos.envases_gaseosas": {
    nombre: "Envases de Gaseosas",
    lema: "Cajones retornables con depósito.",
    precioArs: 2490,
    superficie: "pos",
    activacion: "App Store → Activar → tipos default se crean solos",
    pasosUso: [
      "POS → Envases → elegir cliente",
      "Prestar: cobra depósito en caja | Devolver: reintegra depósito",
    ],
    api: "POST /api/pos/envases/movimiento",
    docAnchor: "envases-gaseosas",
    flujoMermaid: `flowchart LR\n  A[POS Envases] --> B{Entrega o retorno?}\n  B -->|Entrega| C[Depósito ingreso caja]\n  B -->|Retorno| D[Depósito egreso caja]\n  C --> E[Saldo cliente++]\n  D --> F[Saldo cliente--]`,
  },
  "pos.vale_dinero": {
    nombre: "Vale de Dinero",
    lema: "Ticket canjeable en caja.",
    precioArs: 1990,
    superficie: "ambos",
    activacion: "App Store → Activar → emitir en panel o cobrar en POS",
    pasosUso: [
      "Panel Almacén → emitir vale → imprimir ticket",
      "POS cobro → medio Vale → VALE-000001 → valida saldo",
    ],
    api: "POST /api/vales · POST /api/vales/validar",
    docAnchor: "vale-dinero",
    flujoMermaid: `flowchart LR\n  A[Emitir vale] --> B[Ticket VALE-NNNNNN]\n  B --> C[Cliente compra en POS]\n  C --> D[Medio Vale]\n  D --> E[Descuenta saldo vale]`,
  },
}

export const MODULOS_ALMACEN_ROSARIO: ModuloAlmacenRosario[] = [
  ...Object.entries(CORE_META).map(([sku, m]) => ({ sku, ...m })),
  ...Object.entries(RETAIL_SKU_META).map(([sku, m]) => {
    const retailFlows: Record<string, Partial<ModuloAlmacenRosario>> = {
      "pos.recargas_servicios": {
        superficie: "pos",
        activacion: "App Store → Activar → POST recargas con caja abierta",
        pasosUso: ["POS/API → elegir SUBE/celular → monto → ingreso caja"],
        api: "POST /api/pos/almacen/retail { modulo: recargas }",
        docAnchor: "recargas",
        flujoMermaid: `flowchart LR\n  A[Servicio + monto] --> B[Caja abierta]\n  B --> C[Ingreso caja]\n  C --> D[Comisión estimada]`,
      },
      "pos.balanza_peso": {
        superficie: "pos",
        activacion: "App Store → Activar → calcular precio por kg en POS",
        pasosUso: ["Ingresá precio/kg y peso → agregá línea al carrito"],
        api: "POST /api/pos/almacen/retail { modulo: balanza }",
        docAnchor: "balanza-peso",
        flujoMermaid: `flowchart LR\n  A[Peso en balanza] --> B[Precio/kg]\n  B --> C[Total línea]\n  C --> D[Carrito POS]`,
      },
      "pos.promos_cantidad": {
        superficie: "pos",
        activacion: "App Store → Activar → promos 2x1 default en config",
        pasosUso: ["Al vender cantidad múltiple, aplica lleva N paga M automático"],
        api: "GET /api/pos/almacen/retail?q=promos_cantidad",
        docAnchor: "promos-cantidad",
        flujoMermaid: `flowchart LR\n  A[Cantidad en carrito] --> B{Regla 2x1/3x2?}\n  B -->|Sí| C[Descuento unidades]\n  B -->|No| D[Precio normal]`,
      },
      "pos.ticket_regalo": {
        superficie: "ambos",
        activacion: "App Store → Activar → emitir REGALO- en devoluciones",
        pasosUso: ["Emitir REGALO- tras devolución", "Cobrar en POS con número REGALO (como vale)"],
        api: "POST /api/pos/almacen/retail { modulo: ticket_regalo }",
        docAnchor: "ticket-regalo",
        flujoMermaid: `flowchart LR\n  A[Devolución] --> B[Emitir REGALO-]\n  B --> C[Cliente vuelve]\n  C --> D[Cobro con ticket]`,
      },
      "pos.pedido_distribuidora": {
        superficie: "dashboard",
        activacion: "App Store → Activar → un clic genera OC urgente",
        pasosUso: ["Panel o API → pedido rápido → OC borrador al proveedor"],
        api: "POST /api/pos/almacen/retail { modulo: pedido_distribuidora }",
        docAnchor: "pedido-distribuidora",
        flujoMermaid: `flowchart LR\n  A[Stock bajo JIT] --> B[Propuestas urgentes]\n  B --> C[OC borrador]\n  C --> D[Enviar a distribuidora]`,
      },
      "pos.mermas_roturas": {
        superficie: "dashboard",
        activacion: "App Store → Activar → registrar merma desde panel/API",
        pasosUso: ["Producto + cantidad + motivo → baja stock"],
        api: "POST /api/pos/almacen/retail { modulo: merma }",
        docAnchor: "mermas-roturas",
        flujoMermaid: `flowchart LR\n  A[Rotura/vencimiento] --> B[Registro merma]\n  B --> C[Ajuste stock]\n  C --> D[Valor pérdida]`,
      },
      "pos.arqueo_ciego": {
        superficie: "pos",
        activacion: "App Store → Activar → cierre sin ver saldo sistema",
        pasosUso: ["Cajero cuenta efectivo/tarjetas → declara montos → semáforo diferencia"],
        api: "GET/POST /api/pos/almacen/retail?q=arqueo_ciego",
        docAnchor: "arqueo-ciego",
        flujoMermaid: `flowchart LR\n  A[Cajero cuenta] --> B[Declara montos]\n  B --> C[Sistema compara oculto]\n  C --> D[Semáforo diferencia]`,
      },
      "pos.lista_mayorista_pos": {
        superficie: "pos",
        activacion: "App Store → Activar → crear lista 'Mayorista' en precios",
        pasosUso: ["Toggle mayorista en POS → precios por bulto del cliente"],
        api: "GET /api/pos/almacen/retail?q=lista_mayorista",
        docAnchor: "lista-mayorista",
        flujoMermaid: `flowchart LR\n  A[Cliente mayorista] --> B[Lista bulto]\n  B --> C[Precio unitario mayorista]\n  C --> D[Venta POS]`,
      },
      "pos.cheques_cartera": {
        superficie: "dashboard",
        activacion: "App Store → Activar → alta cheque desde panel",
        pasosUso: ["Registrar cheque recibido → alerta vencimiento próximo"],
        api: "POST /api/pos/almacen/retail { modulo: cheque }",
        docAnchor: "cheques-cartera",
        flujoMermaid: `flowchart LR\n  A[Cobro cheque] --> B[Alta cartera]\n  B --> C[Alerta vencimiento]\n  C --> D[Depósito posterior]`,
      },
      "pos.inventario_express": {
        superficie: "dashboard",
        activacion: "App Store → Activar → toma inventario por categoría",
        pasosUso: ["Iniciar conteo → cargar cantidades → cerrar y ajustar stock"],
        api: "POST /api/pos/almacen/retail { modulo: inventario_* }",
        docAnchor: "inventario-express",
        flujoMermaid: `flowchart LR\n  A[Iniciar TI express] --> B[Conteo categoría]\n  B --> C[Cargar cantidades]\n  C --> D[Procesar ajustes]`,
      },
    }
    const extra = retailFlows[sku] ?? {}
    return {
      sku,
      nombre: m.nombre,
      lema: m.lema,
      precioArs: m.precioArs,
      superficie: extra.superficie ?? "dashboard",
      activacion: extra.activacion ?? `App Store → Activar ${m.nombre}`,
      pasosUso: extra.pasosUso ?? [`Usar ${m.nombre} desde panel Almacén o POS`],
      api: extra.api,
      docAnchor: extra.docAnchor ?? sku.replace("pos.", ""),
      flujoMermaid: extra.flujoMermaid ?? `flowchart LR\n  A[Activar SKU] --> B[Usar en POS/Panel]`,
    }
  }),
]

export function getModuloAlmacen(sku: string): ModuloAlmacenRosario | undefined {
  return MODULOS_ALMACEN_ROSARIO.find((m) => m.sku === sku)
}

export function skusAlmacenRosario(): string[] {
  return MODULOS_ALMACEN_ROSARIO.map((m) => m.sku)
}
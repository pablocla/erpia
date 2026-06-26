/**
 * Runbooks por SKU — guía para analista humano, IA (ClavAI) y cliente.
 * Referencia canónica: docs/marketplace/06-runbooks-por-producto.md
 * Pack Almacén Rosario: docs/marketplace/14-pack-almacen-rosario.md
 */
import { ALMACEN_ROSARIO_RUNBOOKS } from "./almacen-rosario-runbooks"

export type EjecutorPaso = "sistema" | "ia" | "analista" | "cliente"

export interface RunbookPaso {
  orden: number
  titulo: string
  ejecutor: EjecutorPaso
  descripcion: string
  urlAyuda?: string
}

export interface ProductRunbook {
  sku: string
  nombre: string
  autoCertLevel: string
  ccaFase: string
  activacionCliente: string
  otorgamiento: string
  postventa: string
  pasos: RunbookPaso[]
  escalacionSi: string[]
}

function rb(
  sku: string,
  nombre: string,
  autoCertLevel: string,
  ccaFase: string,
  activacionCliente: string,
  otorgamiento: string,
  postventa: string,
  pasos: RunbookPaso[],
  escalacionSi: string[] = [],
): ProductRunbook {
  return { sku, nombre, autoCertLevel, ccaFase, activacionCliente, otorgamiento, postventa, pasos, escalacionSi }
}

export const PRODUCT_RUNBOOKS: Record<string, ProductRunbook> = {
  "sec.backup": rb(
    "sec.backup",
    "Backup Cloud",
    "GLOBAL_AUTO",
    "CCA-030",
    "Dashboard → Marketplace → Activar Backup Cloud",
    "Job ops backup_db + SuscripcionModulo sec.backup",
    "Monitoreo job fallido; restore self-service en ops",
    [
      { orden: 1, titulo: "Crear job backup", ejecutor: "sistema", descripcion: "crearOpsJob(backup_db)" },
      { orden: 2, titulo: "Activar entitlement", ejecutor: "sistema", descripcion: "upsertSuscripcion(sec.backup)" },
      { orden: 3, titulo: "Email Pack ONBOARD", ejecutor: "sistema", descripcion: "Resend con fecha próximo backup" },
    ],
  ),
  "sec.mfa": rb(
    "sec.mfa",
    "Escudo 2FA",
    "GLOBAL_AUTO",
    "CCA-040",
    "Marketplace → Activar 2FA",
    "Política empresa mfaObligatorio=true",
    "Soporte si usuario pierde dispositivo TOTP",
    [
      { orden: 1, titulo: "Habilitar política MFA", ejecutor: "sistema", descripcion: "Parametro empresa" },
      { orden: 2, titulo: "Notificar usuarios", ejecutor: "sistema", descripcion: "Email enrollment próximo login" },
    ],
  ),
  "integ.shopify": rb(
    "integ.shopify",
    "Shopify Link",
    "SEMI_AUTO",
    "CCA-050",
    "Integraciones → Shopify → OAuth o token",
    "ConexionIntegracion + webhooks + sync stock",
    "Revisar errores sync cada 24h",
    [
      { orden: 1, titulo: "Cliente ingresa dominio", ejecutor: "cliente", descripcion: "myshopify.com en panel" },
      { orden: 2, titulo: "OAuth Shopify", ejecutor: "cliente", descripcion: "Click Conectar → autorizar app" },
      { orden: 3, titulo: "Verificar webhooks", ejecutor: "sistema", descripcion: "POST /api/webhooks/shopify" },
      { orden: 4, titulo: "Sync inicial productos", ejecutor: "sistema", descripcion: "listarProductosShopify + match SKU" },
      { orden: 5, titulo: "Validar pedido test", ejecutor: "analista", descripcion: "Pedido prueba en Shopify → ERP" },
    ],
    ["OAuth falla 3x", "Stock desfasado >5%"],
  ),
  "integ.mercado_libre": rb(
    "integ.mercado_libre",
    "Mercado Libre Link",
    "SEMI_AUTO",
    "CCA-050",
    "Integraciones → Mercado Libre → OAuth o access token",
    "ConexionIntegracion mercado_libre + sync publicaciones/pedidos",
    "Revisar desfasaje stock ML ↔ ERP semanal",
    [
      { orden: 1, titulo: "Cliente OAuth ML", ejecutor: "cliente", descripcion: "Autorizar app o pegar access token en integraciones" },
      { orden: 2, titulo: "Guardar credenciales", ejecutor: "sistema", descripcion: "POST /api/mercadolibre con accessToken + sellerId" },
      { orden: 3, titulo: "Sync publicaciones", ejecutor: "sistema", descripcion: "listarPublicaciones + match SKU seller_custom_field" },
      { orden: 4, titulo: "Pedido test importado", ejecutor: "analista", descripcion: "importarPedidosML o webhook con orden paid" },
      { orden: 5, titulo: "Activar entitlement", ejecutor: "analista", descripcion: "Completar tarea marketplace → finalizarProvisionManual" },
    ],
    ["Token expirado", "SKU sin match ERP", "Webhook ML caído"],
  ),
  "integ.tienda_nube": rb(
    "integ.tienda_nube",
    "Tienda Nube Link",
    "REGION_AUTO",
    "CCA-050",
    "Integraciones → Tienda Nube → OAuth",
    "ConexionIntegracion TN + webhooks pedidos",
    "Alerta si webhook caído",
    [
      { orden: 1, titulo: "OAuth Tienda Nube", ejecutor: "cliente", descripcion: "Autorizar desde panel" },
      { orden: 2, titulo: "Registrar webhooks", ejecutor: "sistema", descripcion: "TN_WEBHOOK_SECRET validado" },
      { orden: 3, titulo: "Import catálogo", ejecutor: "sistema", descripcion: "Sync productos TN → ERP" },
      { orden: 4, titulo: "Pedido test", ejecutor: "analista", descripcion: "Confirmar pedido en dashboard ventas" },
    ],
    ["TN API 401", "Sin pedidos 48h post-connect"],
  ),
  "integ.odoo": rb(
    "integ.odoo",
    "Odoo Bridge",
    "SEMI_AUTO",
    "CCA-050",
    "Integraciones → Odoo → URL + API key",
    "ConexionIntegracion odoo + job import",
    "Sync programado + log errores XML-RPC",
    [
      { orden: 1, titulo: "Credenciales Odoo", ejecutor: "cliente", descripcion: "URL, DB, usuario, API key" },
      { orden: 2, titulo: "Test conexión", ejecutor: "sistema", descripcion: "Ping Odoo authenticate" },
      { orden: 3, titulo: "Mapeo campos", ejecutor: "ia", descripcion: "ClavAI sugiere mapping productos/contactos" },
      { orden: 4, titulo: "Import piloto", ejecutor: "analista", descripcion: "100 productos + validación cliente" },
      { orden: 5, titulo: "Sync bidireccional", ejecutor: "sistema", descripcion: "Cron según frecuencia SKU" },
    ],
    ["Odoo version <14", "Más de 10k productos sin batch"],
  ),
  "impl.migracion_odoo": rb(
    "impl.migracion_odoo",
    "Salí de Odoo",
    "SEMI_AUTO",
    "CCA-040",
    "Marketplace → Migración Odoo → Contratar",
    "Proyecto CCA + tarea analista lead + integ.odoo",
    "Hipercare 14 días post go-live",
    [
      { orden: 1, titulo: "Kickoff remoto", ejecutor: "analista", descripcion: "Videollamada 30min, inventario datos" },
      { orden: 2, titulo: "Export Odoo", ejecutor: "cliente", descripcion: "CSV/XML o acceso API" },
      { orden: 3, titulo: "Import ERP", ejecutor: "analista", descripcion: "Wizard CSV + validación" },
      { orden: 4, titulo: "UAT cliente", ejecutor: "cliente", descripcion: "Checklist go-live" },
      { orden: 5, titulo: "Go-live", ejecutor: "analista", descripcion: "CCA-070 + corte Odoo" },
    ],
    ["Datos inconsistentes", "Cliente sin ventana UAT"],
  ),
  "impl.homologacion_afip": rb(
    "impl.homologacion_afip",
    "AFIP Ready",
    "SEMI_AUTO",
    "CCA-070",
    "Marketplace → AFIP Ready",
    "Certificado en empresa + test CAE homologación",
    "Paso producción requiere analista fiscal",
    [
      { orden: 1, titulo: "Wizard certificado", ejecutor: "cliente", descripcion: "Subir .crt y .key" },
      { orden: 2, titulo: "Validar cert", ejecutor: "sistema", descripcion: "AFIP test-conexion homologación" },
      { orden: 3, titulo: "Factura prueba", ejecutor: "analista", descripcion: "CAE en homologación OK" },
      { orden: 4, titulo: "Capacitación fiscal", ejecutor: "ia", descripcion: "Microcurso rol contador" },
    ],
    ["Cert vencido", "CUIT no habilitado"],
  ),
  "com.whatsapp": rb(
    "com.whatsapp",
    "WhatsApp ON",
    "REGION_AUTO",
    "CCA-050",
    "Marketplace → WhatsApp ON",
    "channel.whatsapp + plantillas Twilio/Meta",
    "Monitoreo entrega mensajes",
    [
      { orden: 1, titulo: "Embedded signup Meta", ejecutor: "cliente", descripcion: "OAuth WhatsApp Business" },
      { orden: 2, titulo: "Plantillas rubro", ejecutor: "sistema", descripcion: "Precarga plantillas aprobadas" },
      { orden: 3, titulo: "Webhook test", ejecutor: "analista", descripcion: "Mensaje prueba pedido confirmado" },
    ],
  ),
  "data.reportes_prog": rb(
    "data.reportes_prog",
    "Mañanero",
    "GLOBAL_AUTO",
    "CCA-080",
    "Marketplace → Mañanero",
    "Cron 07:00 + Resend reporte rol",
    "Ajuste KPIs si cliente pide",
    [
      { orden: 1, titulo: "Configurar cron", ejecutor: "sistema", descripcion: "Reporte ventas/caja/stock" },
      { orden: 2, titulo: "Primer envío", ejecutor: "sistema", descripcion: "Email dueño/admin" },
    ],
  ),
  "fiscal.ocr": rb(
    "fiscal.ocr",
    "FotoFactura",
    "GLOBAL_AUTO",
    "CCA-050",
    "Compras → Escanear factura",
    "Entitlement + Gemini Vision API",
    "Revisión si confianza OCR <80%",
    [
      { orden: 1, titulo: "Activar SKU", ejecutor: "sistema", descripcion: "upsertSuscripcion(fiscal.ocr)" },
      { orden: 2, titulo: "Límite mensual", ejecutor: "sistema", descripcion: "UsageEvent por documento" },
    ],
  ),
  "pos.fiado_barrio": rb(
    "pos.fiado_barrio",
    "Libreta Fiado",
    "GLOBAL_AUTO",
    "CCA-030",
    "Marketplace → Libreta Fiado → Alta clientes con límite",
    "Módulo fiado + validación POS + emails post-venta",
    "Upsell a Cobranzas WA para recupero automático",
    [
      { orden: 1, titulo: "Activar SKU", ejecutor: "sistema", descripcion: "upsertSuscripcion(pos.fiado_barrio)" },
      { orden: 2, titulo: "Config email dueño", ejecutor: "cliente", descripcion: "Empresa.emailDuenoAlmacen opcional" },
      { orden: 3, titulo: "Alta clientes fiado", ejecutor: "cliente", descripcion: "Límite + email fiador en /dashboard/fiado" },
      { orden: 4, titulo: "Venta test POS", ejecutor: "analista", descripcion: "Fiado $100 + verificar email" },
    ],
    ["Sin SMTP configurado", "Cliente sin límite"],
  ),
  "intang.cobranzas_wa": rb(
    "intang.cobranzas_wa",
    "Secretaria de Cobranzas WA",
    "REGION_AUTO",
    "CCA-050",
    "Marketplace → Activar Secretaria Cobranzas + WhatsApp ON",
    "Regla cxc_vencida + cron diario + mensajes WA con link MP",
    "Panel ROI: recuperado vs costo bot; ajustar tono mensajes",
    [
      { orden: 1, titulo: "Verificar WhatsApp ON", ejecutor: "cliente", descripcion: "com.whatsapp activo y Meta conectado" },
      { orden: 2, titulo: "Crear regla cobranza", ejecutor: "sistema", descripcion: "reglaAlerta cxc_vencida 7 días" },
      { orden: 3, titulo: "Config tono y límites", ejecutor: "cliente", descripcion: "IA Notificaciones → max clientes/día" },
      { orden: 4, titulo: "Primera ronda test", ejecutor: "analista", descripcion: "Aprobar 1 mensaje piloto antes de auto" },
      { orden: 5, titulo: "Link MercadoPago", ejecutor: "sistema", descripcion: "fiscal.clavpay_link en mensaje si activo" },
    ],
    ["Cliente sin teléfono", "WhatsApp no conectado", "Deuda < umbral mínimo"],
  ),
  "intang.reputation_firewall": rb(
    "intang.reputation_firewall",
    "Escudo Reputación",
    "SEMI_AUTO",
    "CCA-050",
    "Marketplace → Escudo Reputación → Conectar GBP",
    "Webhooks reseñas + LLM respuesta + SMS urgente 1★",
    "Monitoreo 24/7; revisión mensual tono respuestas",
    [
      { orden: 1, titulo: "OAuth Google Business", ejecutor: "cliente", descripcion: "Conectar perfil principal" },
      { orden: 2, titulo: "TripAdvisor / redes", ejecutor: "cliente", descripcion: "API keys o RSS según canal" },
      { orden: 3, titulo: "SMS dueño", ejecutor: "cliente", descripcion: "Teléfono alerta crisis" },
      { orden: 4, titulo: "Calibrar umbrales", ejecutor: "analista", descripcion: "1★ = SMS; 2★ = email" },
      { orden: 5, titulo: "Respuesta piloto IA", ejecutor: "ia", descripcion: "ClavAI genera borrador conciliador" },
    ],
    ["Reseña falsa / bot", "Cliente pide no responder"],
  ),
  "intang.legal_shield": rb(
    "intang.legal_shield",
    "Legal Shield",
    "SEMI_AUTO",
    "CCA-040",
    "Enviar PDF a legal@claver.com o arrastrar en dashboard",
    "Ingesta email + Gemini análisis cláusulas + semáforo",
    "No reemplaza abogado; escalar cláusulas rojas a humano",
    [
      { orden: 1, titulo: "Alias legal@ activo", ejecutor: "sistema", descripcion: "Routing email → empresaId" },
      { orden: 2, titulo: "Primer contrato test", ejecutor: "cliente", descripcion: "PDF alquiler o NDA" },
      { orden: 3, titulo: "Validar semáforo", ejecutor: "analista", descripcion: "Revisar 1 informe piloto" },
      { orden: 4, titulo: "Límites mensuales", ejecutor: "sistema", descripcion: "UsageEvent por documento" },
    ],
    ["Documento >50 páginas", "Jurisdicción no AR"],
  ),
  "intang.subs_tax_scanner": rb(
    "intang.subs_tax_scanner",
    "Cazador de Gastos Zombies",
    "SEMI_AUTO",
    "CCA-030",
    "Subir resumen tarjeta/banco (PDF o OCR)",
    "IA clasifica cargos recurrentes + alertas impuestos duplicados",
    "Revisión humana si confianza <75%",
    [
      { orden: 1, titulo: "Subir resumen", ejecutor: "cliente", descripcion: "PDF último mes" },
      { orden: 2, titulo: "Clasificar cargos", ejecutor: "ia", descripcion: "Gemini + catálogo suscripciones" },
      { orden: 3, titulo: "Reporte ahorro", ejecutor: "sistema", descripcion: "Email con zombies detectados" },
      { orden: 4, titulo: "Guía cancelación", ejecutor: "ia", descripcion: "Links y pasos por servicio" },
    ],
    ["Resumen ilegible", "Datos sensibles sin consentimiento"],
  ),
  "intang.reactivador_clientes": rb(
    "intang.reactivador_clientes",
    "Despertador de Clientes",
    "REGION_AUTO",
    "CCA-050",
    "Marketplace → Despertador → definir inactividad (ej. 180 días)",
    "Segmento CRM + campaña WA/SMS + cupón + dashboard ROI",
    "A/B mensajes; pausar si quejas spam",
    [
      { orden: 1, titulo: "Definir segmento", ejecutor: "cliente", descripcion: "Días sin compra + monto histórico" },
      { orden: 2, titulo: "Plantilla IA", ejecutor: "ia", descripcion: "Mensaje personalizado por rubro" },
      { orden: 3, titulo: "Cupón descuento", ejecutor: "cliente", descripcion: "Promo válida 7 días" },
      { orden: 4, titulo: "Lanzar campaña", ejecutor: "sistema", descripcion: "Batch mensajesPendienteWhatsApp" },
      { orden: 5, titulo: "Medir ROI", ejecutor: "sistema", descripcion: "Ventas atribuidas vs costo envío" },
    ],
    ["Base <50 clientes", "Sin consentimiento marketing"],
  ),
  "intang.liquidacion_pagos": rb(
    "intang.liquidacion_pagos",
    "Conciliador Liquidación MP y Tarjetas",
    "SEMI_AUTO",
    "CCA-050",
    "Marketplace → Conciliador pagos + MercadoPago ON",
    "Cron conciliación movimientoCaja vs mercadoPagoTransaccion + alertas",
    "Reporte semanal recupero; ajustar umbral diferencia",
    [
      { orden: 1, titulo: "MP conectado", ejecutor: "cliente", descripcion: "channel.mercadopago activo" },
      { orden: 2, titulo: "Importar liquidaciones", ejecutor: "analista", descripcion: "CSV Prisma/MODO si aplica" },
      { orden: 3, titulo: "Primera conciliación", ejecutor: "sistema", descripcion: "liquidacion-pagos-service 7 días" },
      { orden: 4, titulo: "Alerta WA dueño", ejecutor: "sistema", descripcion: "Si diferencia > $500" },
    ],
    ["Sin movimientos tarjeta/QR", "MP sin token"],
  ),
  "intang.recuperador_fiscal": rb(
    "intang.recuperador_fiscal",
    "Recuperador de Retenciones AFIP",
    "SEMI_AUTO",
    "CCA-040",
    "Config → Fiscal → Clave fiscal delegada",
    "Sync padrones + cruce compras + bloqueo apócrifos",
    "Panel ahorro acumulado mensual",
    [
      { orden: 1, titulo: "Certificado AFIP", ejecutor: "cliente", descripcion: "Delegación lectura retenciones" },
      { orden: 2, titulo: "Sync padrones", ejecutor: "sistema", descripcion: "Cron diario Mis Retenciones" },
      { orden: 3, titulo: "Cruce compras", ejecutor: "ia", descripcion: "Match NC y percepciones" },
      { orden: 4, titulo: "Bloqueo apócrifo", ejecutor: "sistema", descripcion: "Flag proveedor en OP" },
    ],
    ["Sin certificado", "Empresa monotributo sin retenciones"],
  ),
  "intang.guardian_pos": rb(
    "intang.guardian_pos",
    "Guardián de Caja POS",
    "REGION_AUTO",
    "CCA-030",
    "Marketplace → Guardián POS → activar",
    "guardian-pos-service score diario + WA si riesgo alto",
    "Revisión semanal patrones por sucursal",
    [
      { orden: 1, titulo: "Activar SKU", ejecutor: "sistema", descripcion: "upsertSuscripcion(intang.guardian_pos)" },
      { orden: 2, titulo: "Teléfono dueño", ejecutor: "cliente", descripcion: "WhatsApp alertas" },
      { orden: 3, titulo: "Baseline 7 días", ejecutor: "sistema", descripcion: "Calibrar umbrales" },
      { orden: 4, titulo: "Reporte piloto", ejecutor: "analista", descripcion: "Validar 1 informe con dueño" },
    ],
    ["POS no usado", "Sin movimientos caja"],
  ),
  "intang.reponedor_jit": rb(
    "intang.reponedor_jit",
    "Reponedor JIT",
    "REGION_AUTO",
    "CCA-050",
    "Stock → Activar Reponedor JIT",
    "reponedor-jit-service + propuestas OC borrador",
    "Ajuste lead time por proveedor trimestral",
    [
      { orden: 1, titulo: "Stock mínimos", ejecutor: "cliente", descripcion: "stockMinimo por producto clave" },
      { orden: 2, titulo: "Lead times", ejecutor: "cliente", descripcion: "Días entrega por proveedor" },
      { orden: 3, titulo: "Primera propuesta", ejecutor: "sistema", descripcion: "Top 10 urgentes" },
      { orden: 4, titulo: "Mail cotización", ejecutor: "ia", descripcion: "Borrador email proveedor" },
    ],
    ["Sin histórico ventas", "Catálogo <20 SKUs"],
  ),
  "intang.ocr_compras": rb(
    "intang.ocr_compras",
    "OCR Compras Proveedores",
    "SEMI_AUTO",
    "CCA-050",
    "Reenviar PDF a compras@claver.com",
    "Gemini Vision + mapeo proveedor + borrador OC",
    "Límite docs/mes; revisión si confianza <80%",
    [
      { orden: 1, titulo: "Alias compras@", ejecutor: "sistema", descripcion: "Routing → empresaId" },
      { orden: 2, titulo: "Mapa proveedor", ejecutor: "cliente", descripcion: "CUIT proveedor ↔ catálogo" },
      { orden: 3, titulo: "PDF test", ejecutor: "cliente", descripcion: "1 factura real" },
      { orden: 4, titulo: "Validar borrador", ejecutor: "analista", descripcion: "Aprobar 1 OC pre-cargada" },
    ],
    ["PDF escaneado ilegible", "Proveedor sin CUIT"],
  ),
  "ops.claver_superadmin": rb(
    "ops.claver_superadmin",
    "Panel Super Admin Claver Cloud",
    "HUMAN_GATE",
    "CCA-040",
    "Claver Cloud → Organizations → Super Admin",
    "SuscripcionModulo + acceso /claver-cloud/tenants/:id",
    "Auditoría sistemaLog + scope analista",
    [
      { orden: 1, titulo: "Asignar analista", ejecutor: "analista", descripcion: "AnalistaAsignacion o scope global" },
      { orden: 2, titulo: "Activar entitlement", ejecutor: "sistema", descripcion: "ops.claver_superadmin en SuscripcionModulo" },
      { orden: 3, titulo: "Validar plan Pro+", ejecutor: "sistema", descripcion: "planComercial en metadata proyecto" },
      { orden: 4, titulo: "Smoke panel", ejecutor: "analista", descripcion: "GET /api/claver/tenants/:id responde 200" },
    ],
    ["Plan Starter", "Sin proyecto implementación"],
  ),
  "ops.playbooks_auto": rb(
    "ops.playbooks_auto",
    "Playbooks automáticos analista",
    "SEMI_AUTO",
    "CCA-050",
    "Claver Cloud → tenant → Automatizaciones",
    "Pestaña playbooks + ejecutarPlaybookAnalista",
    "Revisar steps fallidos en sistemaLog",
    [
      { orden: 1, titulo: "Depende super admin", ejecutor: "sistema", descripcion: "ops.claver_superadmin activo" },
      { orden: 2, titulo: "Activar SKU playbooks", ejecutor: "analista", descripcion: "Provision o activate directo" },
      { orden: 3, titulo: "Ejecutar diagnóstico", ejecutor: "analista", descripcion: "Playbook diagnostico_readiness" },
      { orden: 4, titulo: "Documentar resultado", ejecutor: "analista", descripcion: "Comentario en implementación si falla" },
    ],
    ["Plan sin playbooksAuto", "Job ops fallido"],
  ),
  "intang.ruteador_entregas": rb(
    "intang.ruteador_entregas",
    "Ruteador de Entregas",
    "REGION_AUTO",
    "CCA-060",
    "Logística → Activar ruteador + WhatsApp",
    "Agrupación geo + hoja ruta + WA tracking",
    "Optimización mensual zonas",
    [
      { orden: 1, titulo: "Zonas entrega", ejecutor: "cliente", descripcion: "Depósitos y radios" },
      { orden: 2, titulo: "Choferes", ejecutor: "cliente", descripcion: "Usuarios app ruta" },
      { orden: 3, titulo: "Plantilla WA", ejecutor: "ia", descripcion: "Mensaje salida + link" },
      { orden: 4, titulo: "Ruta piloto", ejecutor: "analista", descripcion: "1 día de prueba" },
    ],
    ["Sin módulo logística", "Clientes sin teléfono"],
  ),
}

const ALL_RUNBOOKS: Record<string, ProductRunbook> = {
  ...PRODUCT_RUNBOOKS,
  ...ALMACEN_ROSARIO_RUNBOOKS,
}

export function getRunbook(sku: string): ProductRunbook | null {
  return ALL_RUNBOOKS[sku] ?? null
}

export function getRunbookOrDefault(sku: string, nombre: string, autoCertLevel: string): ProductRunbook {
  const existing = ALL_RUNBOOKS[sku]
  if (existing) return existing

  const needsHuman = autoCertLevel === "SEMI_AUTO" || autoCertLevel === "HUMAN_GATE"
  return rb(
    sku,
    nombre,
    autoCertLevel,
    needsHuman ? "CCA-050" : "CCA-030",
    `Marketplace → Activar ${nombre}`,
    needsHuman ? "Tarea analista + SuscripcionModulo tras validación" : "SuscripcionModulo automático",
    "Ticket soporte si falla job",
    needsHuman
      ? [
          { orden: 1, titulo: "Crear tarea analista", ejecutor: "sistema", descripcion: "MarketplaceTareaAnalista" },
          { orden: 2, titulo: "Ejecutar checklist", ejecutor: "analista", descripcion: "Seguir runbook en Claver Cloud" },
          { orden: 3, titulo: "Activar entitlement", ejecutor: "sistema", descripcion: "Tras completar tarea" },
        ]
      : [
          { orden: 1, titulo: "Provision automático", ejecutor: "sistema", descripcion: "Job + suscripción" },
        ],
    needsHuman ? ["Job failed", "Cliente sin responder 48h"] : [],
  )
}
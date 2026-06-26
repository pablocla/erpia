/**
 * Diccionario canónico parámetro ERP ↔ UI ↔ API (analista / super admin).
 */

export type ParametroCapa = 1 | 2 | 3 | 4 | 5

export interface ErpParametroDef {
  clave: string
  modulo: string
  pantalla: string
  api: string
  capa: ParametroCapa
  ccaFase?: string
  quienEdita: "cliente" | "analista" | "ambos"
  descripcion: string
}

export const ERP_PARAMETROS_CATALOG: ErpParametroDef[] = [
  { clave: "empresa.cuit", modulo: "Empresa", pantalla: "/dashboard/configuracion → Empresa", api: "PUT /api/config/empresa", capa: 1, ccaFase: "CCA-040", quienEdita: "ambos", descripcion: "CUIT fiscal del tenant" },
  { clave: "empresa.puntoVenta", modulo: "AFIP", pantalla: "/dashboard/configuracion → AFIP", api: "PUT /api/config/empresa", capa: 1, ccaFase: "CCA-040", quienEdita: "ambos", descripcion: "Punto de venta AFIP" },
  { clave: "empresa.entornoAfip", modulo: "AFIP", pantalla: "Cloud → Parametrización / AFIP prod", api: "PATCH /api/claver/tenants/:id/config", capa: 1, ccaFase: "CCA-070", quienEdita: "analista", descripcion: "homologacion | produccion (aprobación dual)" },
  { clave: "empresa.certificadoCRT", modulo: "AFIP", pantalla: "/dashboard/configuracion → AFIP", api: "PUT /api/config/empresa + upload cert", capa: 1, ccaFase: "CCA-040", quienEdita: "cliente", descripcion: "Certificado digital CRT" },
  { clave: "fiscal.caea", modulo: "AFIP", pantalla: "/dashboard/configuracion → CAEA", api: "GET/PUT /api/config/caea", capa: 1, ccaFase: "CCA-050", quienEdita: "ambos", descripcion: "Modo CAEA contingencia" },
  { clave: "fiscal.emision", modulo: "AFIP", pantalla: "/dashboard/configuracion → Emisión", api: "GET/PUT /api/config/fiscal-emision", capa: 1, ccaFase: "CCA-070", quienEdita: "analista", descripcion: "Flujo emisión electrónica" },
  { clave: "feature.*", modulo: "Railroad", pantalla: "/dashboard/configuracion → Módulos", api: "GET/PATCH /api/config/features", capa: 3, ccaFase: "CCA-040", quienEdita: "ambos", descripcion: "FeatureEmpresa on/off por rubro" },
  { clave: "onboarding_completado", modulo: "Onboarding", pantalla: "/dashboard/onboarding", api: "POST /api/config/onboarding/apply", capa: 1, ccaFase: "CCA-030", quienEdita: "analista", descripcion: "Wizard rubro aplicado" },
  { clave: "plan_comercial", modulo: "Billing", pantalla: "/claver-cloud/billing", api: "PATCH /api/claver/tenants/:id/billing", capa: 3, quienEdita: "analista", descripcion: "Starter | Pro | Enterprise" },
  { clave: "integracion.mercado_pago", modulo: "Integraciones", pantalla: "/dashboard/integraciones/mercado_pago", api: "ConexionIntegracion + MP config", capa: 3, ccaFase: "CCA-050", quienEdita: "cliente", descripcion: "OAuth / token Mercado Pago" },
  { clave: "integracion.whatsapp", modulo: "Integraciones", pantalla: "/dashboard/integraciones/whatsapp", api: "ConexionIntegracion whatsapp", capa: 3, ccaFase: "CCA-050", quienEdita: "cliente", descripcion: "WhatsApp Business ON" },
  { clave: "integracion.shopify", modulo: "Integraciones", pantalla: "/dashboard/integraciones/shopify", api: "ConexionIntegracion shopify", capa: 3, ccaFase: "CCA-050", quienEdita: "cliente", descripcion: "OAuth Shopify" },
  { clave: "campo_personalizado", modulo: "Campos", pantalla: "/dashboard/campos-personalizados", api: "/api/campos-personalizados", capa: 2, quienEdita: "analista", descripcion: "EAV por entidad" },
  { clave: "workflow.*", modulo: "Procesos", pantalla: "/dashboard/configuracion → Workflows", api: "GET/PUT /api/config/workflows", capa: 4, quienEdita: "analista", descripcion: "Secuencia railroad por rubro" },
  { clave: "ops.claver_superadmin", modulo: "Claver Cloud", pantalla: "/claver-cloud/tenants/:id", api: "GET /api/claver/tenants/:id", capa: 3, quienEdita: "analista", descripcion: "Entitlement panel super admin" },
]

export function buscarParametros(q: string) {
  const s = q.toLowerCase()
  return ERP_PARAMETROS_CATALOG.filter(
    (p) =>
      p.clave.toLowerCase().includes(s) ||
      p.modulo.toLowerCase().includes(s) ||
      p.descripcion.toLowerCase().includes(s),
  )
}
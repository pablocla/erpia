/**
 * Cobertura estructural del ERP — verifica que cada módulo crítico exporta su API.
 * Gemini: correr después de refactors grandes.
 */
import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { resolve } from "path"

const MODULOS_CRITICOS: Array<{ nombre: string; importPath: string; exports: string[] }> = [
  { nombre: "Ventas", importPath: "@/lib/ventas/ventas-service", exports: ["VentasService"] },
  { nombre: "Presupuestos ventas", importPath: "@/lib/ventas/presupuesto-service", exports: ["PresupuestoService"] },
  { nombre: "Motor precios", importPath: "@/lib/precios/motor-precios", exports: ["calcularPrecio", "calcularPreciosLote"] },
  { nombre: "Resolver precios", importPath: "@/lib/precios/resolver-precios-lineas", exports: ["resolverPreciosLineas"] },
  { nombre: "Stock", importPath: "@/lib/stock/stock-service", exports: ["StockService"] },
  { nombre: "Compras", importPath: "@/lib/compras/compras-service", exports: ["comprasService"] },
  { nombre: "Cobros", importPath: "@/lib/cobros/cobros-service", exports: ["cobrosService"] },
  { nombre: "Pagos", importPath: "@/lib/pagos/pagos-service", exports: ["pagosService"] },
  { nombre: "Contabilidad asientos", importPath: "@/lib/contabilidad/asiento-service", exports: ["AsientoService"] },
  { nombre: "CRM", importPath: "@/lib/crm/crm-service", exports: ["crearLead", "pipelineResumen"] },
  { nombre: "KPIs", importPath: "@/lib/kpis/kpi-service", exports: ["calcularKPIs"] },
  { nombre: "Onboarding IA", importPath: "@/lib/onboarding/onboarding-ia", exports: ["generarConfiguracionOnboarding"] },
  { nombre: "Rubro config", importPath: "@/lib/config/rubro-config-service", exports: ["isFeatureActiva"] },
  { nombre: "Agro", importPath: "@/lib/agro/agro-service", exports: ["agroService"] },
  { nombre: "Auth guard", importPath: "@/lib/auth/empresa-guard", exports: ["getAuthContext", "whereEmpresa"] },
  { nombre: "Roles RBAC", importPath: "@/lib/auth/roles", exports: ["tienePermiso", "ROLES_SISTEMA"] },
  { nombre: "Event bus", importPath: "@/lib/events/event-bus", exports: ["eventBus"] },
  { nombre: "Aprobaciones", importPath: "@/lib/aprobaciones/aprobaciones-service", exports: ["crearSolicitudAprobacion"] },
  { nombre: "Alertas", importPath: "@/lib/alertas/alertas-service", exports: ["evaluarReglas"] },
  { nombre: "MRP", importPath: "@/lib/industria/mrp-service", exports: ["ejecutarMRP"] },
]

describe("ERP — cobertura estructural de módulos", () => {
  for (const mod of MODULOS_CRITICOS) {
    it(`${mod.nombre} exporta API esperada`, async () => {
      const loaded = await import(mod.importPath)
      for (const key of mod.exports) {
        expect(loaded[key], `${mod.nombre} debe exportar ${key}`).toBeDefined()
      }
    })
  }
})

describe("ERP — rutas API críticas existen", () => {
  const RUTAS = [
    "app/api/auth/login/route.ts",
    "app/api/clientes/route.ts",
    "app/api/facturas/route.ts",
    "app/api/pos/venta/route.ts",
    "app/api/ventas/pedidos/route.ts",
    "app/api/ventas/presupuestos/route.ts",
    "app/api/stock/route.ts",
    "app/api/compras/route.ts",
    "app/api/caja/route.ts",
    "app/api/precios/calcular/route.ts",
    "app/api/pendientes/route.ts",
    "app/api/ai/chat/route.ts",
    "app/api/agro/pizarra/route.ts",
    "app/api/config/onboarding/apply/route.ts",
  ]

  for (const ruta of RUTAS) {
    it(`existe ${ruta}`, () => {
      expect(existsSync(resolve(process.cwd(), ruta))).toBe(true)
    })
  }
})
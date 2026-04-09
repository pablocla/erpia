/**
 * Tax Engine
 *
 * Central dispatcher for multi-country tax calculations.
 * Adapters are registered at startup and resolved by country code.
 *
 * Usage:
 *   import { calcularImpuestos } from "@/lib/tes/tax-engine"
 *   const result = calcularImpuestos({ pais: "AR", operacion: "venta", ... })
 *
 * Extend to a new country:
 *   import { registerTaxAdapter } from "@/lib/tes/tax-engine"
 *   registerTaxAdapter(new UYTaxAdapter())   // Uruguay
 *   registerTaxAdapter(new BRTaxAdapter())   // Brazil
 *   registerTaxAdapter(new MXTaxAdapter())   // Mexico
 */

import type { CountryTaxAdapter, TaxInput, TaxBreakdown } from "./types"
import { ARTaxAdapter } from "./adapters/ar-adapter"
import { CLTaxAdapter } from "./adapters/cl-adapter"
import { MXTaxAdapter } from "./adapters/mx-adapter"

// ─── REGISTRY ────────────────────────────────────────────────────────────────

const registry = new Map<string, CountryTaxAdapter>()

// Built-in adapters
registry.set("AR", new ARTaxAdapter())
registry.set("CL", new CLTaxAdapter())
registry.set("MX", new MXTaxAdapter())

/**
 * Register a new country adapter.
 * Call during app initialization (e.g. in a server boot file).
 *
 * @example
 *   registerTaxAdapter(new BRTaxAdapter())
 */
export function registerTaxAdapter(adapter: CountryTaxAdapter): void {
  registry.set(adapter.pais.toUpperCase(), adapter)
}

/**
 * Retrieve a registered adapter by country code.
 * Throws if no adapter is found (fail-fast for missing configuration).
 */
export function getTaxAdapter(pais: string): CountryTaxAdapter {
  const adapter = registry.get(pais.toUpperCase())
  if (!adapter) {
    throw new Error(
      `Tax adapter not found for country "${pais}". ` +
      `Register it with registerTaxAdapter(). Registered: ${[...registry.keys()].join(", ")}`
    )
  }
  return adapter
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Main entry point: calculates all applicable taxes for a transaction.
 *
 * Returns a TaxBreakdown with:
 *  - impuestos[]          — all tax items
 *  - iva[]                — IVA items only
 *  - iibb[]               — IIBB (provincial) items only
 *  - retenciones[]        — withheld at payment (SICORE IVA + Ganancias)
 *  - percepciones[]       — added to invoice (Perc. IVA + Perc. IIBB)
 *  - totalImpuestosFactura— what goes on the invoice (IVA + percepciones)
 *  - totalRetencionPago   — deducted from the payment
 *  - totalFinal           — subtotalNeto + IVA + percepciones
 */
export function calcularImpuestos(input: TaxInput): TaxBreakdown {
  const adapter = getTaxAdapter(input.pais)
  return adapter.calcular(input)
}

/**
 * List all registered country adapters.
 * Useful for the UI selector "Cambiar país".
 */
export function getRegisteredCountries(): { pais: string; nombre: string }[] {
  return Array.from(registry.values()).map(a => ({ pais: a.pais, nombre: a.nombre }))
}

/**
 * Returns the accounting chart-of-accounts mapping for a given country.
 */
export function getCuentasContables(pais: string): Record<string, string> {
  return getTaxAdapter(pais).cuentasContables
}

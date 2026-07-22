import { describe, it, expect } from "vitest"
import { decideMensajePath, scoreDeuda, scoreDeudas } from "@/lib/empleados-digitales/runtime/router"
import { plantillaCobranza } from "@/lib/empleados-digitales/tools/generar-recordatorio"
import { DEFAULT_LEO_CONFIG } from "@/lib/empleados-digitales/types"

const baseDeuda = {
  clienteId: 1,
  clienteNombre: "Juan",
  telefono: "1155551212",
  montoArs: 25_000,
  diasVencido: 14,
  cuentaIds: [1],
  empresaNombre: "Kiosco Demo",
  score: 40,
}

describe("Leo router 0-token", () => {
  it("omite montos bajos", () => {
    const d = decideMensajePath(
      { ...baseDeuda, montoArs: 100 },
      DEFAULT_LEO_CONFIG,
      { contactos7d: 0, yaContactadoHoy: false },
    )
    expect(d.path).toBe("skip")
    expect(d.reason).toBe("monto_bajo")
  })

  it("usa plantilla cuando LLM está off", () => {
    const d = decideMensajePath(baseDeuda, { ...DEFAULT_LEO_CONFIG, llmEnabled: false }, {
      contactos7d: 0,
      yaContactadoHoy: false,
    })
    expect(d.path).toBe("template")
  })

  it("usa LLM en deuda alta si está enabled", () => {
    const d = decideMensajePath(
      { ...baseDeuda, montoArs: 80_000, diasVencido: 10 },
      { ...DEFAULT_LEO_CONFIG, llmEnabled: true },
      { contactos7d: 0, yaContactadoHoy: false },
    )
    expect(d.path).toBe("llm")
  })

  it("anti-spam si ya contactado hoy", () => {
    const d = decideMensajePath(baseDeuda, DEFAULT_LEO_CONFIG, {
      contactos7d: 0,
      yaContactadoHoy: true,
    })
    expect(d.path).toBe("skip")
    expect(d.reason).toBe("anti_spam")
  })

  it("score prioriza aging + monto", () => {
    const a = scoreDeuda({ montoArs: 10_000, diasVencido: 5 })
    const b = scoreDeuda({ montoArs: 10_000, diasVencido: 40 })
    expect(b).toBeGreaterThan(a)
    const ranked = scoreDeudas([
      { montoArs: 5_000, diasVencido: 3 },
      { montoArs: 50_000, diasVencido: 20 },
    ])
    expect(ranked[0].montoArs).toBe(50_000)
  })
})

describe("plantillaCobranza", () => {
  it("incluye monto y nombre en tono cercano", () => {
    const msg = plantillaCobranza({
      nombreComercio: "Almacén Sur",
      nombreCliente: "María",
      monto: 15000,
      dias: 10,
      tono: "cercano",
    })
    expect(msg).toContain("María")
    expect(msg).toContain("Almacén Sur")
    expect(msg.toLowerCase()).toMatch(/15|15000/)
  })
})

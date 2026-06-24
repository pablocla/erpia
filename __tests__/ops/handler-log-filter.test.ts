import { describe, it, expect } from "vitest"
import { filterHandlerLogsByEmpresa } from "@/lib/ops/handler-log-filter"

describe("filterHandlerLogsByEmpresa", () => {
  it("filtra logs por payload.empresaId", () => {
    const logs = [
      { payload: JSON.stringify({ empresaId: 1, facturaId: 10 }), handler: "a" },
      { payload: JSON.stringify({ empresaId: 2 }), handler: "b" },
      { payload: JSON.stringify({ facturaId: 5 }), handler: "c" },
    ]
    const result = filterHandlerLogsByEmpresa(logs, 1)
    expect(result).toHaveLength(1)
    expect(result[0].handler).toBe("a")
  })

  it("ignora payload inválido", () => {
    const logs = [{ payload: "not-json", handler: "x" }]
    expect(filterHandlerLogsByEmpresa(logs, 1)).toHaveLength(0)
  })
})
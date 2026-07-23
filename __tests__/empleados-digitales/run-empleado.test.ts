import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/empleados-digitales/runtime/orchestrator", () => ({
  runLeoCobranza: vi.fn().mockResolvedValue({
    runId: "1",
    pathUsado: "rules",
    resumen: "ok",
    tokensIn: 0,
    tokensOut: 0,
    accionesCount: 1,
    draftsCreados: 0,
    skipped: 0,
    detalles: [],
  }),
}))

import { runEmpleado } from "@/lib/empleados-digitales/runtime/run-empleado"
import { runLeoCobranza } from "@/lib/empleados-digitales/runtime/orchestrator"

describe("runEmpleado ED-15", () => {
  it("despacha leo_cobranza", async () => {
    const r = await runEmpleado({ empresaId: 1, code: "leo_cobranza" })
    expect(r.code).toBe("leo_cobranza")
    expect(runLeoCobranza).toHaveBeenCalled()
  })

  it("rechaza códigos desconocidos", async () => {
    await expect(runEmpleado({ empresaId: 1, code: "sofia_x" })).rejects.toThrow(/no tiene motor/i)
  })
})

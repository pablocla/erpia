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

vi.mock("@/lib/automation/playbook-runner", () => ({
  runPlaybook: vi.fn().mockResolvedValue({
    ok: true,
    actions: ["tarea_creada_stock_bajo:2", "oc_borrador_creadas:1"],
  }),
}))

import { runEmpleado } from "@/lib/empleados-digitales/runtime/run-empleado"
import { runLeoCobranza } from "@/lib/empleados-digitales/runtime/orchestrator"
import { runPlaybook } from "@/lib/automation/playbook-runner"

describe("runEmpleado ED-15", () => {
  it("despacha leo_cobranza", async () => {
    const r = await runEmpleado({ empresaId: 1, code: "leo_cobranza" })
    expect(r.code).toBe("leo_cobranza")
    expect(runLeoCobranza).toHaveBeenCalled()
  })

  it("despacha ramiro_stock al playbook de OC", async () => {
    const r = await runEmpleado({ empresaId: 9, code: "ramiro_stock" })
    expect(r.code).toBe("ramiro_stock")
    expect(runPlaybook).toHaveBeenCalledWith(9, "stock_bajo_tarea")
    expect(r.pathUsado).toBe("rules")
  })

  it("despacha sofia_turnos al playbook de agenda", async () => {
    const r = await runEmpleado({ empresaId: 3, code: "sofia_turnos" })
    expect(r.code).toBe("sofia_turnos")
    expect(runPlaybook).toHaveBeenCalledWith(3, "agenda_reminder")
  })

  it("rechaza códigos desconocidos", async () => {
    await expect(runEmpleado({ empresaId: 1, code: "sofia_x" })).rejects.toThrow(/no tiene motor/i)
  })
})

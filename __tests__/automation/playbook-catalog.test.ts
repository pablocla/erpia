import { describe, it, expect } from "vitest"
import {
  PLAYBOOK_TEMPLATES,
  VIRTUAL_WORKER_TEMPLATES,
} from "@/lib/automation/virtual-workers-catalog"
import { NOP_AUTOMATION_EVENTS } from "@/lib/automation/events-catalog"

describe("automation catalog", () => {
  it("tiene 11 playbooks predefinidos", () => {
    expect(PLAYBOOK_TEMPLATES.length).toBe(11)
    expect(PLAYBOOK_TEMPLATES.map((p) => p.playbookKey)).toContain("cierre_caja_alerta")
  })

  it("tiene 10 empleados virtuales", () => {
    expect(VIRTUAL_WORKER_TEMPLATES.length).toBe(10)
    expect(VIRTUAL_WORKER_TEMPLATES[0].nombre).toBe("Ana Reposición")
  })

  it("catálogo eventos incluye CAE y pedidos", () => {
    const keys = NOP_AUTOMATION_EVENTS.map((e) => e.key)
    expect(keys).toContain("CAE_RECHAZADO")
    expect(keys).toContain("PEDIDO_CONFIRMADO")
    expect(keys).toContain("USUARIO_CREADO")
  })
})
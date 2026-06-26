import { describe, expect, it } from "vitest"
import { computeFocoHoy } from "@/lib/ops/ceo-focus-service"

describe("computeFocoHoy", () => {
  it("prioriza alertas críticas y tareas de setup", () => {
    const foco = computeFocoHoy({
      clientesPagos: 0,
      followupsVencidos: [],
      alerts: [
        {
          id: "sin-cliente",
          severidad: "critica",
          titulo: "Cero clientes",
          mensaje: "Salí a vender",
        },
      ],
      tareasPendientes: [
        {
          codigo: "f0.1",
          fase: "f0",
          titulo: "Monotributo",
          descripcion: "Habilitar factura",
          categoria: "legal",
          prioridad: "critica",
          completada: false,
          completadaAt: null,
          bloqueada: false,
          bloqueadaRazon: null,
          disponible: true,
        },
      ],
    })

    expect(foco.length).toBeGreaterThan(0)
    expect(foco[0].titulo).toContain("Cero clientes")
  })
})
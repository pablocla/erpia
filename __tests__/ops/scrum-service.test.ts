import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_t, prop) {
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

describe("scrum-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({
      empresaId: 1,
      faseActual: "CCA-040",
      fases: { "CCA-040": { completado: false } },
      metadata: { scrum: { version: 1, sprints: [], items: [], updatedAt: "" } },
    })
    mockPrismaClient.proyectoImplementacion.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ metadata: data.metadata }),
    )
    mockPrismaClient.marketplaceTareaAnalista.findMany.mockResolvedValue([])
    mockPrismaClient.ticket.findMany.mockResolvedValue([])
  })

  it("sincronizarBacklogDesdeFuentes agrega hitos CCA", async () => {
    const { sincronizarBacklogDesdeFuentes } = await import("@/lib/ops/scrum-service")
    const scrum = await sincronizarBacklogDesdeFuentes(1, "a@test.com")
    expect(scrum.items.length).toBeGreaterThanOrEqual(8)
    expect(scrum.items.some((i) => i.tipo === "cca_hito")).toBe(true)
  })

  it("crearSprint agrega sprint activo y desactiva anteriores", async () => {
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({
      empresaId: 1,
      metadata: {
        scrum: {
          version: 1,
          sprints: [{ id: "sp-old", nombre: "Anterior", inicio: "2026-01-01", fin: "2026-01-14", activo: true }],
          items: [],
          updatedAt: "",
        },
      },
    })
    const { crearSprint } = await import("@/lib/ops/scrum-service")
    const scrum = await crearSprint(
      1,
      { nombre: "Sprint 2", inicio: "2026-06-01", fin: "2026-06-14" },
      "a@test.com",
    )
    expect(scrum.sprints.length).toBe(2)
    expect(scrum.sprints.find((s) => s.nombre === "Sprint 2")?.activo).toBe(true)
    expect(scrum.sprints.find((s) => s.id === "sp-old")?.activo).toBe(false)
  })

  it("asignarItemASprint vincula sprintId y estado sprint", async () => {
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({
      empresaId: 1,
      metadata: {
        scrum: {
          version: 1,
          sprints: [{ id: "sp-1", nombre: "S1", inicio: "", fin: "", activo: true }],
          items: [
            {
              id: "bl-1",
              tipo: "servicio_custom",
              titulo: "Landing",
              estado: "backlog",
              visibilidadCliente: true,
              orden: 0,
              createdAt: "",
              updatedAt: "",
            },
          ],
          updatedAt: "",
        },
      },
    })
    const { asignarItemASprint } = await import("@/lib/ops/scrum-service")
    const item = await asignarItemASprint(1, "bl-1", "sp-1", "a@test.com")
    expect(item.sprintId).toBe("sp-1")
    expect(item.estado).toBe("sprint")
  })

  it("moverBacklogItem cambia estado", async () => {
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({
      empresaId: 1,
      metadata: {
        scrum: {
          version: 1,
          sprints: [],
          items: [
            {
              id: "bl-1",
              tipo: "servicio_custom",
              titulo: "Landing SEO",
              estado: "backlog",
              visibilidadCliente: true,
              orden: 0,
              createdAt: "",
              updatedAt: "",
            },
          ],
          updatedAt: "",
        },
      },
    })
    const { moverBacklogItem } = await import("@/lib/ops/scrum-service")
    const item = await moverBacklogItem(1, "bl-1", "en_curso", "a@test.com")
    expect(item.estado).toBe("en_curso")
  })
})
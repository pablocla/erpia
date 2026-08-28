import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  UPGRADE_ARCA_ORIGEN,
  generarSlotsImplementacion,
  pactarImplementacionArca,
  slotDisponible,
} from "@/lib/comercial/implementacion-arca"
import { createComercialLead, updateComercialLead } from "@/lib/ops/comercial-pipeline-service"
import { notifyAnalistasFunnel } from "@/lib/comercial/comercial-funnel-service"

vi.mock("@/lib/ops/comercial-pipeline-service", () => ({
  createComercialLead: vi.fn(),
  updateComercialLead: vi.fn(),
}))

vi.mock("@/lib/comercial/comercial-funnel-service", () => ({
  notifyAnalistasFunnel: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercialPipelineLead: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    empresa: { findMany: vi.fn() },
  },
}))

import { prisma } from "@/lib/prisma"

const leadBase = {
  id: 7,
  nombre: "María Gómez",
  negocio: "Kiosco 25",
  telefono: "3415550000",
  email: "maria@test.com",
  localidad: null,
  rubro: "arca+whatsapp",
  origen: UPGRADE_ARCA_ORIGEN,
  etapa: "visita" as const,
  valorEstimado: null,
  proximaAccion: "Upgrade pendiente: certificado ARCA + WhatsApp",
  proximaFecha: "2026-08-31T10:00:00.000Z",
  notas: "[UPGRADE-ARCA][pendiente]",
  lat: null,
  lon: null,
  empresaId: 44,
  creadoPor: "maria@test.com",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("implementacion-arca slots", () => {
  it("genera turnos lun-vie a las 10:00 y 15:00 ART, nunca fin de semana", () => {
    const now = new Date("2026-08-26T12:00:00-03:00")
    const slots = generarSlotsImplementacion(now, 5)
    expect(slots.length).toBeGreaterThan(0)
    for (const s of slots) {
      const dow = new Date(s.iso).getUTCDay()
      expect(dow).not.toBe(0)
      expect(dow).not.toBe(6)
      expect(["10:00", "15:00"]).toContain(s.hora)
      expect(s.iso.endsWith("-03:00")).toBe(true)
    }
  })

  it("descarta turnos con menos de 2 h de anticipación", () => {
    const now = new Date("2026-08-26T09:30:00-03:00")
    const slots = generarSlotsImplementacion(now, 2)
    expect(slots.some((s) => s.iso === "2026-08-26T10:00:00-03:00")).toBe(false)
    expect(slots.some((s) => s.iso === "2026-08-26T15:00:00-03:00")).toBe(true)
  })

  it("slotDisponible rechaza un ISO que no está en la grilla", () => {
    const now = new Date("2026-08-26T12:00:00-03:00")
    expect(slotDisponible("2026-08-29T10:00:00-03:00", now)).toBeNull()
  })
})

describe("pactarImplementacionArca", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createComercialLead).mockResolvedValue(leadBase)
    vi.mocked(updateComercialLead).mockResolvedValue(leadBase)
    vi.mocked(prisma.comercialPipelineLead.findFirst).mockResolvedValue(null as never)
  })

  it("crea lead de upgrade y notifica Cloud", async () => {
    const now = new Date("2026-08-26T12:00:00-03:00")
    const nowSlots = generarSlotsImplementacion(now)
    const slot = nowSlots[0]
    const { lead, creado } = await pactarImplementacionArca(
      {
        slotIso: slot.iso,
        nombre: "María Gómez",
        email: "maria@test.com",
        incluyeArca: true,
        incluyeWhatsapp: true,
        nombreAccesoArca: "Contador Pérez",
      },
      null,
      now,
    )

    expect(creado).toBe(true)
    expect(lead.origen).toBe(UPGRADE_ARCA_ORIGEN)
    expect(createComercialLead).toHaveBeenCalledWith(
      expect.objectContaining({
        origen: UPGRADE_ARCA_ORIGEN,
        etapa: "visita",
        email: "maria@test.com",
      }),
      "maria@test.com",
    )
    expect(notifyAnalistasFunnel).toHaveBeenCalledWith(
      "upgrade_arca_certificado",
      expect.objectContaining({ id: 7 }),
      expect.anything(),
    )
  })

  it("si ya hay pendiente del mismo tenant, actualiza el turno", async () => {
    vi.mocked(prisma.comercialPipelineLead.findFirst).mockResolvedValue(leadBase as never)
    const now = new Date("2026-08-26T12:00:00-03:00")
    const nowSlots = generarSlotsImplementacion(now)
    const slot = nowSlots[1] ?? nowSlots[0]
    const { creado } = await pactarImplementacionArca(
      { slotIso: slot.iso, incluyeArca: true, incluyeWhatsapp: false },
      { email: "maria@test.com", nombre: "María Gómez", empresaId: 44, empresaNombre: "Kiosco 25" },
      now,
    )
    expect(creado).toBe(false)
    expect(updateComercialLead).toHaveBeenCalled()
    expect(createComercialLead).not.toHaveBeenCalled()
  })

  it("rechaza honeypot", async () => {
    const now = new Date("2026-08-26T12:00:00-03:00")
    const nowSlots = generarSlotsImplementacion(now)
    await expect(
      pactarImplementacionArca(
        {
          slotIso: nowSlots[0].iso,
          nombre: "Bot",
          email: "bot@spam.com",
          website: "http://spam.com",
        },
        null,
        now,
      ),
    ).rejects.toThrow("Solicitud rechazada")
    expect(createComercialLead).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  notifyAnalistasJobFallido,
  notifyAnalistasTicketCritico,
  notifyAnalistasEntornoCaido,
  notifyAnalistasTicketSlaBreach,
} from "@/lib/ops/ops-notificaciones"
import { emailService } from "@/lib/email/email-service"
import { telegramService } from "@/lib/telegram/telegram-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/email/email-service", () => ({
  emailService: {
    enviar: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock("@/lib/telegram/telegram-service", () => ({
  telegramService: {
    sendMessage: vi.fn().mockResolvedValue({ ok: true }),
  },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analistaAsignacion: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    usuario: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    sistemaLog: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    configuracionIANotificacion: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

describe("ops-notificaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("CLAVER_ANALYST_EMAILS", "analista1@claver.com,analista2@claver.com")
  })

  it("notifyAnalistasJobFallido manda mail a emails de config si no hay asignaciones", async () => {
    await notifyAnalistasJobFallido({
      empresaId: 42,
      jobId: 101,
      tipo: "backup_db",
      errorMsg: "Connection timeout",
    })

    expect(emailService.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["analista1@claver.com", "analista2@claver.com"],
        subject: expect.stringContaining("backup_db"),
      })
    )
  })

  it("notifyAnalistasTicketCritico manda alerta por ticket critico", async () => {
    await notifyAnalistasTicketCritico({
      empresaId: 42,
      ticketId: 202,
      numero: "TK-20260623-0001",
      titulo: "Base de datos corrompida",
      descripcion: "El servidor principal no responde a consultas select.",
    })

    expect(emailService.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["analista1@claver.com", "analista2@claver.com"],
        subject: expect.stringContaining("TK-20260623-0001"),
      })
    )
  })

  it("notifyAnalistasEntornoCaido manda mail y loguea", async () => {
    await notifyAnalistasEntornoCaido({
      empresaId: 1,
      codigo: "prd",
      desde: new Date(),
    })

    expect(emailService.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("PRD Caído"),
      })
    )
  })

  it("notifyAnalistasTicketSlaBreach manda mail de vencimiento de SLA", async () => {
    await notifyAnalistasTicketSlaBreach({
      empresaId: 1,
      ticketId: 456,
      numero: "TK-456",
      prioridad: "alta",
    })

    expect(emailService.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("SLA Vencido"),
      })
    )
  })
})

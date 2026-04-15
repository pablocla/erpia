import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock prisma ─────────────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    featureEmpresa: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    empresa: {
      findUnique: vi.fn(),
    },
    configuracionRubro: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    featureRubro: {
      upsert: vi.fn(),
    },
    rubro: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/prisma"
const mockPrisma = vi.mocked(prisma)

import {
  isFeatureActiva,
  isFeatureSimplificada,
  getFeatureParam,
  getFeatureConfig,
  getAllFeatures,
  setFeature,
  inicializarFeaturesDesdeRubro,
  FEATURES,
} from "@/lib/config/rubro-config-service"

describe("RubroConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("isFeatureActiva", () => {
    it("retorna true cuando la empresa tiene la feature activa", async () => {
      mockPrisma.featureEmpresa.findUnique.mockResolvedValue({
        activado: true,
        modoSimplificado: false,
        parametros: {},
      })
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "ALIM" })

      const result = await isFeatureActiva(1, FEATURES.KDS)
      expect(result).toBe(true)
    })

    it("retorna false cuando no hay config de rubro ni empresa", async () => {
      mockPrisma.featureEmpresa.findUnique.mockResolvedValue(null)
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: null, rubro: "ALIM" })

      const result = await isFeatureActiva(99, "feature_inexistente")
      expect(result).toBe(false)
    })

    it("hereda del rubro cuando no hay override de empresa", async () => {
      mockPrisma.featureEmpresa.findUnique.mockResolvedValue(null)
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "ALIM" })
      mockPrisma.configuracionRubro.findUnique.mockResolvedValue({
        activado: true,
        modoSimplificado: false,
        parametros: { umbral: 10 },
      })

      const result = await isFeatureActiva(2, FEATURES.KDS)
      expect(result).toBe(true)
    })

    it("empresa override desactiva feature que rubro tiene activa", async () => {
      mockPrisma.featureEmpresa.findUnique.mockResolvedValue({
        activado: false,
        modoSimplificado: false,
        parametros: {},
      })
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "ALIM" })

      const result = await isFeatureActiva(3, FEATURES.KDS)
      expect(result).toBe(false)
    })
  })

  describe("getFeatureParam", () => {
    it("retorna el parámetro merge de rubro + empresa", async () => {
      mockPrisma.featureEmpresa.findUnique.mockResolvedValue({
        activado: true,
        modoSimplificado: false,
        parametros: { diasCobranza: 15 },
      })
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1, rubro: "COM" })
      mockPrisma.configuracionRubro.findUnique.mockResolvedValue({
        activado: true,
        modoSimplificado: false,
        parametros: { diasCobranza: 30, umbral: 5 },
      })

      const dias = await getFeatureParam(4, FEATURES.CC_CP, "diasCobranza", 30)
      // empresa override (15) wins over rubro (30)
      expect(dias).toBe(15)
    })

    it("retorna fallback si el parámetro no existe", async () => {
      mockPrisma.featureEmpresa.findUnique.mockResolvedValue(null)
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: null })

      const val = await getFeatureParam(5, FEATURES.POS, "noExiste", 42)
      expect(val).toBe(42)
    })
  })

  describe("getAllFeatures", () => {
    it("retorna todas las features con merge correcto", async () => {
      mockPrisma.empresa.findUnique.mockResolvedValue({ rubroId: 1 })
      mockPrisma.configuracionRubro.findMany.mockResolvedValue([
        { featureKey: "pos", activado: true, modoSimplificado: false, grupo: "core", label: "POS", parametros: {} },
        { featureKey: "kds", activado: true, modoSimplificado: false, grupo: "vertical", label: "KDS", parametros: {} },
      ])
      mockPrisma.featureEmpresa.findMany.mockResolvedValue([
        { featureKey: "kds", activado: false, modoSimplificado: false, parametros: {} },
      ])

      const features = await getAllFeatures(1)
      expect(features).toHaveLength(2)
      expect(features.find((f) => f.featureKey === "pos")?.activado).toBe(true)
      expect(features.find((f) => f.featureKey === "kds")?.activado).toBe(false)
    })
  })

  describe("setFeature", () => {
    it("llama upsert con datos correctos", async () => {
      mockPrisma.featureEmpresa.upsert.mockResolvedValue({})

      await setFeature(1, "kds", { activado: false })

      expect(mockPrisma.featureEmpresa.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { empresaId_featureKey: { empresaId: 1, featureKey: "kds" } },
        }),
      )
    })
  })

  describe("inicializarFeaturesDesdeRubro", () => {
    it("copia todas las configuraciones del rubro a la empresa", async () => {
      mockPrisma.configuracionRubro.findMany.mockResolvedValue([
        { featureKey: "pos", activado: true, modoSimplificado: false, parametros: null },
        { featureKey: "kds", activado: true, modoSimplificado: false, parametros: null },
        { featureKey: "stock", activado: true, modoSimplificado: false, parametros: null },
      ])
      mockPrisma.featureEmpresa.upsert.mockResolvedValue({})

      const count = await inicializarFeaturesDesdeRubro(1, 1)
      expect(count).toBe(3)
      expect(mockPrisma.featureEmpresa.upsert).toHaveBeenCalledTimes(3)
    })
  })
})

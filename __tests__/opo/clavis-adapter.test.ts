import { describe, expect, it } from "vitest"
import { buildClavisDiscoveryManifest, CLAVIS_ENTITY_MAPPINGS } from "@/lib/opo/clavis-adapter"
import { buildProtheusDemoManifest } from "@/lib/opo/protheus-demo"

describe("OPO — clavis adapter", () => {
  it("expone entidades canónicas de Clavis", () => {
    expect(CLAVIS_ENTITY_MAPPINGS.length).toBeGreaterThanOrEqual(3)
    expect(CLAVIS_ENTITY_MAPPINGS.some((e) => e.canonical === "opo:Customer")).toBe(true)
  })

  it("genera manifiesto discovery para Clavis", () => {
    const manifest = buildClavisDiscoveryManifest("https://app.clavis.test", "Demo S.A.")
    expect(manifest.system_identity.erp_name).toBe("Clavis ERP")
    expect(manifest.endpoints["opo:Customer"]?.path).toContain("/api/opo/entities/Customer")
  })

  it("genera manifiesto demo Protheus", () => {
    const manifest = buildProtheusDemoManifest("https://legacy.test")
    expect(manifest.system_identity.erp_name).toContain("Protheus")
    expect(manifest.supported_entities?.length).toBeGreaterThan(0)
  })
})
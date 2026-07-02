import { describe, expect, it } from "vitest"
import { buildClaverDiscoveryManifest, CLAVER_ENTITY_MAPPINGS } from "@/lib/opo/claver-adapter"
import { buildProtheusDemoManifest } from "@/lib/opo/protheus-demo"

describe("OPO — claver adapter", () => {
  it("expone entidades canónicas de Claver", () => {
    expect(CLAVER_ENTITY_MAPPINGS.length).toBeGreaterThanOrEqual(3)
    expect(CLAVER_ENTITY_MAPPINGS.some((e) => e.canonical === "opo:Customer")).toBe(true)
  })

  it("genera manifiesto discovery para Claver", () => {
    const manifest = buildClaverDiscoveryManifest("https://app.claver.test", "Demo S.A.")
    expect(manifest.system_identity.erp_name).toBe("Claver ERP")
    expect(manifest.endpoints["opo:Customer"]?.path).toContain("/api/opo/entities/Customer")
  })

  it("genera manifiesto demo Protheus", () => {
    const manifest = buildProtheusDemoManifest("https://legacy.test")
    expect(manifest.system_identity.erp_name).toContain("Protheus")
    expect(manifest.supported_entities?.length).toBeGreaterThan(0)
  })
})
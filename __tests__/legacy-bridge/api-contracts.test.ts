import { describe, expect, it } from "vitest"
import {
  CLAVER_APP_BRIDGE_CONTRACTS,
  formatContractForClient,
  getBridgeContractBySku,
} from "@/lib/legacy-bridge/api-contracts"

describe("Legacy Bridge — API contracts", () => {
  it("expone contratos para las 5 Claver Apps Edge", () => {
    expect(CLAVER_APP_BRIDGE_CONTRACTS.length).toBe(5)
    const skus = CLAVER_APP_BRIDGE_CONTRACTS.map((c) => c.sku)
    expect(skus).toContain("edge.approvals")
    expect(skus).toContain("edge.expenses")
    expect(skus).toContain("edge.b2b")
    expect(skus).toContain("edge.pos")
    expect(skus).toContain("edge.warehouse")
  })

  it("cada contrato tiene al menos un endpoint requerido", () => {
    for (const contract of CLAVER_APP_BRIDGE_CONTRACTS) {
      expect(contract.requiredEndpoints.length).toBeGreaterThan(0)
      expect(contract.nombre.length).toBeGreaterThan(0)
    }
  })

  it("genera markdown entregable al cliente", () => {
    const contract = getBridgeContractBySku("edge.b2b")
    expect(contract).toBeDefined()
    const md = formatContractForClient(contract!)
    expect(md).toContain("Claver B2B Portal")
    expect(md).toContain("GET /api/claver/v1/b2b/orders")
    expect(md).toContain("Hint Protheus")
  })
})
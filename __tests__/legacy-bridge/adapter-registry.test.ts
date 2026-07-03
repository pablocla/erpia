import { describe, expect, it } from "vitest"
import {
  ERP_ADAPTERS,
  getAdapterById,
  listSupportedAdapters,
  resolveErpAdapter,
} from "@/lib/legacy-bridge/adapter-registry"
import type { OpoTenantConfig } from "@/lib/opo/types"

const BASE_CONFIG: OpoTenantConfig = {
  activo: true,
  modoErp: "legacy_front",
  origen: "protheus",
  conector: "rest",
  accesoCanal: "rest_directo",
}

describe("Legacy Bridge — adapter registry", () => {
  it("registra los cuatro adaptadores", () => {
    expect(ERP_ADAPTERS).toHaveLength(4)
    expect(getAdapterById("claver_native")).toBeDefined()
    expect(getAdapterById("protheus_rest_direct")).toBeDefined()
    expect(getAdapterById("protheus_edge_agent")).toBeDefined()
    expect(getAdapterById("protheus_demo")).toBeDefined()
  })

  it("resuelve claver_native en modo full", () => {
    const adapter = resolveErpAdapter({
      ...BASE_CONFIG,
      modoErp: "full",
      origen: "claver_db",
    })
    expect(adapter.adapterId).toBe("claver_native")
  })

  it("resuelve protheus_rest_direct cuando hay credenciales REST", () => {
    const adapter = resolveErpAdapter({
      ...BASE_CONFIG,
      restDirectUrl: "http://10.0.0.1:8073/rest",
      restAuthUser: "admin",
      restAuthPassword: "secret",
    })
    expect(adapter.adapterId).toBe("protheus_rest_direct")
  })

  it("resuelve protheus_edge_agent cuando hay baseUrl de agente", () => {
    const adapter = resolveErpAdapter({
      ...BASE_CONFIG,
      restDirectUrl: "",
      restAuthUser: "",
      restAuthPassword: "",
      baseUrl: "http://192.168.1.50:4077",
    })
    expect(adapter.adapterId).toBe("protheus_edge_agent")
  })

  it("cae en protheus_demo sin conexión configurada", () => {
    const adapter = resolveErpAdapter({
      ...BASE_CONFIG,
      restDirectUrl: "",
      restAuthUser: "",
      restAuthPassword: "",
      baseUrl: "",
    })
    expect(adapter.adapterId).toBe("protheus_demo")
  })

  it("prioriza REST directo sobre agente cuando ambos están configurados", () => {
    const config: OpoTenantConfig = {
      ...BASE_CONFIG,
      restDirectUrl: "http://10.0.0.1:8073/rest",
      restAuthUser: "admin",
      restAuthPassword: "secret",
      baseUrl: "http://192.168.1.50:4077",
    }
    const supported = listSupportedAdapters(config)
    expect(supported[0]?.adapterId).toBe("protheus_rest_direct")
    expect(resolveErpAdapter(config).adapterId).toBe("protheus_rest_direct")
  })
})
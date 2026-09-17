import { describe, expect, it } from "vitest"
import { isAllowedProtheusPath } from "@/lib/protheus-invest/rest-config"
import { tenantRestReady } from "@/lib/protheus-invest/forward"

describe("isAllowedProtheusPath", () => {
  it("permite health, holdings y valuations", () => {
    expect(isAllowedProtheusPath("/api/claver/v1/investments/health")).toBe(true)
    expect(isAllowedProtheusPath("/api/claver/v1/investments/holdings")).toBe(true)
    expect(isAllowedProtheusPath("/api/claver/v1/investments/holdings/INV00001/valuations")).toBe(true)
    expect(isAllowedProtheusPath("/api/claver/v1/investments/holdings/INV00001/rescue")).toBe(true)
    expect(isAllowedProtheusPath("/tlpp/rest/list/service")).toBe(true)
  })

  it("bloquea paths ajenos", () => {
    expect(isAllowedProtheusPath("/api/claver/v1/pos/tickets")).toBe(false)
    expect(isAllowedProtheusPath("https://evil.example/api/claver/v1/investments/health")).toBe(false)
    expect(isAllowedProtheusPath("/rest/api/claver/v1/investments/health")).toBe(false)
  })
})

describe("tenantRestReady", () => {
  it("exige URL + usuario + password del OPO del tenant", () => {
    expect(
      tenantRestReady({
        restDirectUrl: "http://10.0.0.8:8404/rest",
        restAuthUser: "rest",
        restAuthPassword: "x",
      }),
    ).toBe(true)
    expect(
      tenantRestReady({
        restDirectUrl: "http://10.0.0.8:8404/rest",
        restAuthUser: "rest",
        restAuthPassword: "",
      }),
    ).toBe(false)
  })
})

import { describe, expect, it } from "vitest"
import { cuitDigits, slugifyTenantName, tenantLoginPath } from "@/lib/protheus-invest/tenant-url"

describe("URL fija del tenant Protheus", () => {
  it("arma /p/{slug}/login", () => {
    expect(tenantLoginPath("acme-sa")).toBe("/p/acme-sa/login")
    expect(cuitDigits("30-71234567-8")).toBe("30712345678")
    expect(slugifyTenantName("Acme S.A.")).toBe("acme-s-a")
  })
})

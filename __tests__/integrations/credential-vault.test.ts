import { describe, it, expect } from "vitest"
import { encryptCredentials, decryptCredentials, maskSecret } from "@/lib/integrations/core/credential-vault"

describe("credential-vault", () => {
  it("encripta y desencripta credenciales", () => {
    const original = { accessToken: "TEST_TOKEN_123", publicKey: "pk_test" }
    const enc = encryptCredentials(original)
    expect(enc).not.toContain("TEST_TOKEN")
    const dec = decryptCredentials(enc)
    expect(dec).toEqual(original)
  })

  it("maskSecret oculta valor", () => {
    expect(maskSecret("abcdefghij")).toMatch(/•/)
    expect(maskSecret("")).toBe("")
  })
})
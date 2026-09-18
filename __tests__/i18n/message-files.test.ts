import { describe, expect, it } from "vitest"
import { resolveMessageFile } from "@/lib/i18n/message-files"

describe("resolveMessageFile", () => {
  it("no pide un JSON inexistente (pt-BR 500 en Vercel)", () => {
    expect(resolveMessageFile("pt-BR")).toBe("es-AR")
    expect(resolveMessageFile("xx")).toBe("es-AR")
    expect(resolveMessageFile("es-AR")).toBe("es-AR")
    expect(resolveMessageFile("en-US")).toBe("en-US")
  })
})

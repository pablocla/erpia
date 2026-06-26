import { describe, expect, it } from "vitest"
import { isRemoteAgentConfigured } from "@/lib/opo/remote-agent"

describe("OPO — remote agent", () => {
  it("detecta agente configurado por baseUrl", () => {
    expect(isRemoteAgentConfigured({ baseUrl: "http://192.168.100.3:4077" } as never)).toBe(true)
    expect(isRemoteAgentConfigured({ baseUrl: "" } as never)).toBe(false)
    expect(isRemoteAgentConfigured({ baseUrl: "ftp://x" } as never)).toBe(false)
  })
})
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { enviarPorTcp } from "@/lib/printer/printer-transport"

describe("printer-transport", () => {
  const prev = process.env.PRINTER_SIMULATE

  beforeEach(() => {
    process.env.PRINTER_SIMULATE = "true"
  })

  afterEach(() => {
    process.env.PRINTER_SIMULATE = prev
  })

  it("simula envío TCP sin socket real", async () => {
    await expect(enviarPorTcp("192.168.1.50", Buffer.from([0x1b, 0x40]))).resolves.toBeUndefined()
  })
})
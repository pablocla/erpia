import { describe, it, expect } from "vitest"
import { resolveEmissionPath } from "@/lib/fiscal/emission-flow"

describe("resolveEmissionPath", () => {
  it("detecta ticket sin CAE", () => {
    expect(resolveEmissionPath({ esTicket: true }).id).toBe("ticket_sin_cae")
  })

  it("detecta CAEA", () => {
    expect(resolveEmissionPath({ modalidadAuth: "CAEA" }).id).toBe("nacional_caea")
  })

  it("detecta exportación", () => {
    expect(resolveEmissionPath({ tipoCbte: 19 }).id).toBe("exportacion")
  })

  it("detecta FCE MiPyME", () => {
    expect(resolveEmissionPath({ esFce: true, tipoCbte: 201 }).id).toBe("fce_mipyme")
  })

  it("detecta pendiente CAE", () => {
    expect(resolveEmissionPath({ pendienteCae: true }).id).toBe("pendiente_cae")
  })
})
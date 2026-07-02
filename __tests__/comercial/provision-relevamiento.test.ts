import { describe, expect, it } from "vitest"
import {
  inferModoLiteFromEnganche,
  resolvePackCalle,
} from "@/lib/comercial/pack-calle-catalog"

describe("provision-relevamiento — lógica comercial", () => {
  it("almacén + fiado → pack vendible y landing fiado", () => {
    const pack = resolvePackCalle("pos.fiado_barrio")
    expect(pack?.vendibleHoy).toBe(true)
    expect(pack?.landingPath).toBe("/dashboard/fiado")
  })

  it("kiosco sugiere pool con modo pos", () => {
    const modo = inferModoLiteFromEnganche("pool-kiosco-barrio")
    expect(modo).toBe("pos")
    const pack = resolvePackCalle("pool-kiosco-barrio")
    expect(pack?.vendibleHoy).toBe(true)
  })

  it("pack almacén barrio es vendible hoy", () => {
    const pack = resolvePackCalle("pool-almacen-barrio")
    expect(pack?.vendibleHoy).toBe(true)
    expect(pack?.precioArs).toBe(34900)
  })
})
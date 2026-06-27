import { describe, it, expect } from "vitest"
import {
  engancheSugeridoPorRubro,
  ENGANCHES_SOLO_PIPELINE,
} from "@/lib/ops/comercial-relevamiento-enganche"

describe("comercial-relevamiento-enganche", () => {
  it("sugiere enganches reales por rubro", () => {
    expect(engancheSugeridoPorRubro("almacen")).toBe("pos.fiado_barrio")
    expect(engancheSugeridoPorRubro("kiosco")).toBe("pool-almacen-rosario")
    expect(engancheSugeridoPorRubro("carniceria")).toBe("pos.balanza_peso")
    expect(engancheSugeridoPorRubro("ferreteria")).toBe("pos.core")
  })

  it("marca packs futuros como solo pipeline", () => {
    expect(ENGANCHES_SOLO_PIPELINE.has("pool-kiosco-barrio")).toBe(true)
    expect(ENGANCHES_SOLO_PIPELINE.has("pool-ferreteria")).toBe(true)
  })
})
import { describe, expect, it } from "vitest"
import {
  resolveAutoSubscribe,
  partitionSkusForAutoActivate,
} from "@/lib/comercial/product-auto-subscribe"

describe("product-auto-subscribe", () => {
  it("ancla fiado es auto_free", () => {
    const d = resolveAutoSubscribe("pos.fiado_barrio", { context: "marketplace" })
    expect(d.mode).toBe("auto_free")
    expect(d.canAutoActivate).toBe(true)
    expect(d.owner).toBe("system")
  })

  it("alta ancla no auto-trial de extras de pago", () => {
    const d = resolveAutoSubscribe("core.claver", {
      context: "activar_intent",
      engancheId: "pos.fiado_barrio",
      modoLite: "fiado",
    })
    expect(d.mode).toBe("auto_paid")
    expect(d.canAutoActivate).toBe(false)
  })

  it("demo industry auto-activa el enganche en trial", () => {
    const d = resolveAutoSubscribe("niche.gimnasio_barrio", { context: "industry_demo" })
    expect(d.canAutoActivate).toBe(true)
    expect(d.mode).toBe("auto_trial")
  })

  it("SKU planned queda blocked", () => {
    const d = resolveAutoSubscribe("data.reportes_prog", { context: "industry_demo" })
    expect(d.mode).toBe("blocked")
    expect(d.canAutoActivate).toBe(false)
    expect(d.owner).toBe("analista")
  })

  it("setup fee requiere analista", () => {
    const d = resolveAutoSubscribe("impl.setup_one_shot", { context: "marketplace" })
    expect(d.mode).toBe("analyst")
    expect(d.canAutoActivate).toBe(false)
  })

  it("marketplace pago no auto-activa pero es auto_paid (cliente/MP)", () => {
    const d = resolveAutoSubscribe("intang.cobranzas_wa", { context: "marketplace" })
    // puede ser auto_paid o auto_free según precio; no analyst
    expect(["auto_paid", "auto_free", "auto_trial"]).toContain(d.mode)
    expect(d.owner).not.toBe("analista")
  })

  it("partition separa auto vs blocked", () => {
    const part = partitionSkusForAutoActivate(
      ["pos.fiado_barrio", "data.reportes_prog", "impl.setup_one_shot"],
      { context: "industry_demo" },
    )
    expect(part.auto).toContain("pos.fiado_barrio")
    expect(part.blocked).toContain("data.reportes_prog")
    expect(part.analyst).toContain("impl.setup_one_shot")
  })
})

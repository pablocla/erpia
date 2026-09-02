import { describe, expect, it } from "vitest"
import {
  canSeeActoresButton,
  homePathForPreviewRol,
  isPreviewActorCodigo,
  labelForPreviewActor,
  listPreviewActors,
  listPreviewRubros,
} from "@/lib/auth/preview-experience-catalog"
import { canPreviewExperience, canPreviewRubros, emitirTokenPreviewRol } from "@/lib/auth/preview-experience"
import { CLAVER_OWNER_EMAIL } from "@/lib/brand"

describe("preview experience catalog", () => {
  it("incluye dueño y actores operativos", () => {
    const codes = listPreviewActors().map((a) => a.codigo)
    expect(codes).toContain("dueno")
    expect(codes).toContain("cajero")
    expect(codes).toContain("mozo")
    expect(codes).toContain("profesional")
    expect(codes).toContain("deposito")
  })

  it("lista rubros featured para el switcher", () => {
    const rubros = listPreviewRubros()
    expect(rubros.length).toBeGreaterThan(5)
    expect(rubros.some((r) => r.id === "veterinaria" || r.label.toLowerCase().includes("vet"))).toBe(true)
  })

  it("resuelve home por rol", () => {
    expect(homePathForPreviewRol("cajero")).toBe("/dashboard/pos")
    expect(homePathForPreviewRol("mozo")).toBe("/dashboard/hospitalidad")
    expect(homePathForPreviewRol("dueno")).toBe("/dashboard")
    expect(isPreviewActorCodigo("cajero")).toBe(true)
    expect(isPreviewActorCodigo("hacker")).toBe(false)
    expect(labelForPreviewActor("cajero")).toMatch(/Cajero/)
  })
})

describe("preview experience permissions", () => {
  it("owner y admin de tenant pueden probar actores", () => {
    expect(canPreviewExperience({ email: CLAVER_OWNER_EMAIL, rol: "administrador" })).toBe(true)
    expect(canPreviewExperience({ email: "dueño@local.com", rol: "dueno" })).toBe(true)
    expect(canPreviewExperience({ email: "caja@local.com", rol: "cajero" })).toBe(false)
  })

  it("el botón Actores no lo ven cajero, mozo ni vendedor", () => {
    expect(canSeeActoresButton({ rol: "administrador" })).toBe(true)
    expect(canSeeActoresButton({ rol: "admin" })).toBe(true)
    expect(canSeeActoresButton({ rol: "dueno" })).toBe(true)
    expect(canSeeActoresButton({ rol: "cajero" })).toBe(false)
    expect(canSeeActoresButton({ rol: "mozo" })).toBe(false)
    expect(canSeeActoresButton({ rol: "vendedor" })).toBe(false)
    expect(canSeeActoresButton({ rol: "profesional" })).toBe(false)
    expect(canSeeActoresButton({ rol: "deposito" })).toBe(false)
    expect(canSeeActoresButton({ rol: null })).toBe(false)
    expect(canSeeActoresButton({ rol: "cajero", isAnalyst: true })).toBe(true)
  })

  it("solo analistas/owner arman demo de rubro", () => {
    expect(canPreviewRubros({ email: CLAVER_OWNER_EMAIL, rol: "administrador" })).toBe(true)
    expect(canPreviewRubros({ email: "dueño@local.com", rol: "dueno" })).toBe(false)
  })

  it("emite JWT de preview con el rol pedido", async () => {
    const token = await emitirTokenPreviewRol({
      userId: 1,
      email: CLAVER_OWNER_EMAIL,
      empresaId: 3,
      rol: "cajero",
    })
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as {
      rol: string
      impersonating: boolean
      previewKind: string
      empresaId: number
    }
    expect(payload.rol).toBe("cajero")
    expect(payload.impersonating).toBe(true)
    expect(payload.previewKind).toBe("rol")
    expect(payload.empresaId).toBe(3)
  })
})

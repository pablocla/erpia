import { describe, expect, it } from "vitest"
import {
  RUBROS_SIGNUP,
  resolveRubroSignup,
  resolveSignupProfile,
} from "@/lib/comercial/rubro-signup"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"

describe("rubro-signup", () => {
  it("tiene las 6 puertas del registro", () => {
    expect(RUBROS_SIGNUP.map((r) => r.id)).toEqual([
      "kiosco",
      "taller",
      "gimnasio",
      "oficios",
      "gastronomia",
      "pyme",
    ])
  })

  it("aliases resuelven a la misma puerta", () => {
    expect(resolveRubroSignup("almacen")?.id).toBe("kiosco")
    expect(resolveRubroSignup("taller_mecanico")?.id).toBe("taller")
    expect(resolveRubroSignup("bar_restaurant")?.id).toBe("gastronomia")
  })

  it("cada puerta resuelve intent con la misma landing", () => {
    for (const door of RUBROS_SIGNUP) {
      const intent = resolveActivarIntent(door.id)
      expect(intent?.landingPath).toBe(door.landingPath)
      expect(intent?.engancheId).toBe(door.engancheId)
    }
  })

  it("perfil de alta por defecto es kiosco/fiado", () => {
    const profile = resolveSignupProfile(undefined)
    expect(profile.rubroEmpresa).toBe("kiosco")
    expect(profile.modoLite).toBe("fiado")
    expect(profile.landingPath).toBe("/dashboard/fiado")
  })
})

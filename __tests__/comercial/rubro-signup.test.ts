import { describe, expect, it } from "vitest"
import {
  RUBROS_SIGNUP,
  resolveRubroSignup,
  resolveSignupProfile,
} from "@/lib/comercial/rubro-signup"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"

describe("rubro-signup", () => {
  it("tiene las puertas del registro", () => {
    const ids = RUBROS_SIGNUP.map((r) => r.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        "kiosco",
        "taller",
        "gimnasio",
        "oficios",
        "gastronomia",
        "pyme",
        "sena_eventos",
        "alquileres",
        "estetica",
        "academia",
        "gomeria",
        "lavadero",
        "honorarios",
        "mayorista_fiado",
      ]),
    )
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

import { describe, it, expect } from "vitest"
import { resolvePostLoginPath } from "@/lib/auth/home-redirect"
import { DEMO_ADMIN_EMAIL } from "@/lib/brand"

describe("home-redirect — golden action demo", () => {
  it("demo veterinaria va a historia clínica", () => {
    const path = resolvePostLoginPath({
      rol: "administrador",
      email: DEMO_ADMIN_EMAIL,
      rubro: "veterinaria",
    })
    expect(path).toBe("/dashboard/historia-clinica")
  })

  it("demo gimnasio va a membresías", () => {
    const path = resolvePostLoginPath({
      rol: "administrador",
      email: DEMO_ADMIN_EMAIL,
      rubro: "gimnasio",
    })
    expect(path).toBe("/dashboard/membresias")
  })

  it("nextPath tiene prioridad sobre golden", () => {
    const path = resolvePostLoginPath({
      rol: "administrador",
      email: DEMO_ADMIN_EMAIL,
      rubro: "gimnasio",
      nextPath: "/dashboard/caja",
    })
    expect(path).toBe("/dashboard/caja")
  })

  it("cuenta normal sin rubro usa rol", () => {
    const path = resolvePostLoginPath({
      rol: "cajero",
      email: "cliente@empresa.com",
      rubro: "veterinaria",
    })
    expect(path).toBe("/dashboard/pos")
  })

  it("dueño con rubro de puerta va a su pantalla, no al ERP genérico", () => {
    expect(
      resolvePostLoginPath({
        rol: "dueno",
        email: "dueno@gimnasio.com",
        rubro: "gimnasio",
      }),
    ).toBe("/dashboard/membresias")
    expect(
      resolvePostLoginPath({
        rol: "administrador",
        email: "admin@taller.com",
        rubro: "taller_mecanico",
      }),
    ).toBe("/dashboard/nicho/taller")
  })
})
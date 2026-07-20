import { describe, expect, it } from "vitest"

/** Mirror of normalizeSeedNombre in industry-demo-seeds (unit without prisma). */
function normalizeSeedNombre(s: string): string {
  return s
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

describe("normalizeSeedNombre (vet demo)", () => {
  it("empareja em-dash con guion ASCII", () => {
    const a = "María González — Tutora de Bobby"
    const b = "María González - Tutora de Bobby"
    expect(normalizeSeedNombre(a)).toBe(normalizeSeedNombre(b))
  })

  it("empareja en-dash", () => {
    const a = "Lucas Fernández – Max (Labrador)"
    const b = "Lucas Fernández - Max (Labrador)"
    expect(normalizeSeedNombre(a)).toBe(normalizeSeedNombre(b))
  })
})

describe("NICHE_CUOTA_CLIENTES keys must be unique", () => {
  it("documenta que keys duplicadas en object literal se pisan", () => {
    const broken = {
      "niche.taller_mecanico": [{ nombre: "A" }],
      "niche.gimnasio_barrio": [{ nombre: "G" }],
      "niche.taller_mecanico": [{ nombre: "B" }],
    } as Record<string, { nombre: string }[]>
    // La segunda key gana en JS
    expect(broken["niche.taller_mecanico"][0].nombre).toBe("B")
  })
})

import { describe, it, expect } from "vitest"

// Test de lógica pura replicada del agrupador
function nombreBaseVariante(nombre: string): string | null {
  const idx = nombre.lastIndexOf(" - ")
  if (idx <= 0) return null
  return nombre.slice(0, idx).trim()
}

describe("pos-catalogo-grupos", () => {
  it("agrupa variantes por nombre base", () => {
    expect(nombreBaseVariante("Remera M - Rojo L")).toBe("Remera M")
    expect(nombreBaseVariante("Remera M - Azul M")).toBe("Remera M")
    expect(nombreBaseVariante("Sin variante")).toBeNull()
  })
})
import { describe, it, expect } from "vitest"
import { buildDocsIndex, searchDocs } from "@/lib/docs/docs-index"

describe("Docs Index & Search", () => {
  it("debe compilar el índice de documentación", () => {
    const index = buildDocsIndex()
    expect(index).toBeInstanceOf(Array)
    expect(index.length).toBeGreaterThan(0)
    
    // Cada elemento del índice debe tener la estructura esperada
    const firstItem = index[0]
    expect(firstItem).toHaveProperty("slug")
    expect(firstItem).toHaveProperty("title")
    expect(firstItem).toHaveProperty("description")
    expect(firstItem).toHaveProperty("tags")
    expect(firstItem).toHaveProperty("audience")
    expect(firstItem).toHaveProperty("href")
  })

  it("debe buscar por término clave 'POS' y retornar resultados relevantes", () => {
    const results = searchDocs("POS")
    expect(results.length).toBeGreaterThan(0)
    const matchesPos = results.some(r => r.slug.includes("pos") || r.title.toLowerCase().includes("pos"))
    expect(matchesPos).toBe(true)
  })

  it("debe retornar resultados vacíos o limitados para términos raros", () => {
    const results = searchDocs("termino-absolutamente-inexistente-12345")
    expect(results).toEqual([])
  })

  it("debe respetar el límite de resultados especificado", () => {
    const limit = 2
    const results = searchDocs("", limit)
    expect(results.length).toBeLessThanOrEqual(limit)
  })

  it("debe buscar de forma insensible a mayúsculas/minúsculas", () => {
    const queryLower = "afip"
    const queryUpper = "AFIP"
    const resultsLower = searchDocs(queryLower)
    const resultsUpper = searchDocs(queryUpper)
    expect(resultsLower.length).toEqual(resultsUpper.length)
  })
})

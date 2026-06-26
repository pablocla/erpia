import { describe, it, expect } from "vitest"
import { parseApiList } from "@/lib/api/parse-list-response"

describe("parseApiList", () => {
  it("devuelve array plano tal cual", () => {
    const arr = [{ id: 1 }, { id: 2 }]
    expect(parseApiList(arr)).toEqual(arr)
  })

  it("extrae data de respuesta paginada", () => {
    expect(parseApiList({ data: [{ id: 3 }] })).toEqual([{ id: 3 }])
  })

  it("devuelve [] si payload inválido", () => {
    expect(parseApiList(null)).toEqual([])
    expect(parseApiList({ data: "x" })).toEqual([])
    expect(parseApiList({})).toEqual([])
  })
})
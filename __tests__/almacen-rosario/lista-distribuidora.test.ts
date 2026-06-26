import { describe, it, expect } from "vitest"
import { parsearListaDistribuidora } from "@/lib/almacen-rosario/lista-distribuidora-service"

describe("parsearListaDistribuidora", () => {
  it("parsea CSV con separador punto y coma", () => {
    const csv = `codigo;nombre;precio_costo
1234;Yerba 1kg;4500,50
5678;Aceite 900ml;3200`
    const filas = parsearListaDistribuidora(csv)
    expect(filas).toHaveLength(2)
    expect(filas[0].codigo).toBe("1234")
    expect(filas[0].precioCosto).toBe(4500.5)
  })

  it("parsea TSV exportado desde Excel", () => {
    const tsv = "codigo\tnombre\tcosto\nABC\tLeche\t890,00"
    const filas = parsearListaDistribuidora(tsv)
    expect(filas[0].codigo).toBe("ABC")
    expect(filas[0].precioCosto).toBe(890)
  })
})
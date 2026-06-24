import ExcelJS from "exceljs"
import type { QueryResult } from "@/lib/reporting/semantic/types"

export async function buildExcelFromResult(
  result: QueryResult,
  titulo: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Clav Sheets"
  workbook.created = new Date()

  const dataSheet = workbook.addWorksheet("Datos")
  dataSheet.addRow([titulo])
  dataSheet.getRow(1).font = { bold: true, size: 14 }
  dataSheet.addRow([])

  const headers = result.columns.map((c) => c.label)
  dataSheet.addRow(headers)
  const headerRow = dataSheet.lastRow!
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF7" },
  }

  for (const row of result.rows) {
    dataSheet.addRow(result.columns.map((c) => row[c.key] ?? ""))
  }

  dataSheet.columns.forEach((col) => {
    col.width = 16
  })

  if (result.pivot) {
    const pivotSheet = workbook.addWorksheet("Pivot")
    pivotSheet.addRow(["Tabla dinámica", titulo])
    pivotSheet.getRow(1).font = { bold: true }

    const header = ["", ...result.pivot.columnas, "Total"]
    pivotSheet.addRow(header)
    pivotSheet.lastRow!.font = { bold: true }

    for (const fila of result.pivot.filas) {
      const row = [
        fila,
        ...result.pivot.columnas.map((c) => result.pivot!.celdas[fila]?.[c] ?? 0),
        result.pivot.totalesFila[fila] ?? 0,
      ]
      pivotSheet.addRow(row)
    }

    const totalRow = [
      "Total",
      ...result.pivot.columnas.map((c) => result.pivot!.totalesColumna[c] ?? 0),
      result.pivot.granTotal,
    ]
    pivotSheet.addRow(totalRow)
    pivotSheet.lastRow!.font = { bold: true }
    pivotSheet.columns.forEach((col) => {
      col.width = 14
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
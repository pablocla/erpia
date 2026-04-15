"use client"

/**
 * CSV Bulk Import — Enterprise import dialog.
 *
 * Supports: drag-drop or file picker, CSV parse with preview,
 * column mapping, validation, and progress indicator.
 * Competitors: ALL (SAP, Tango, Colppy, Xubio, Odoo, ERPNext, Zoho, QB).
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ImportColumn {
  key: string
  label: string
  required?: boolean
  validate?: (value: string) => string | null // Returns error message or null
}

export interface ImportResult {
  success: number
  errors: { row: number; field: string; message: string }[]
}

interface CSVImportProps {
  /** Column definitions for mapping */
  columns: ImportColumn[]
  /** Called with validated rows to actually import */
  onImport: (rows: Record<string, string>[]) => Promise<ImportResult>
  /** Trigger button text */
  triggerLabel?: string
  /** Title in dialog */
  title?: string
  /** Optional template download data (CSV string) */
  templateCSV?: string
  templateFilename?: string
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if ((ch === "," || ch === ";") && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

type Step = "upload" | "mapping" | "preview" | "importing" | "done"

export function CSVImport({
  columns,
  onImport,
  triggerLabel = "Importar CSV",
  title = "Importar datos desde CSV",
  templateCSV,
  templateFilename = "plantilla.csv",
}: CSVImportProps) {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>("upload")
  const [file, setFile] = React.useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = React.useState<string[]>([])
  const [csvRows, setCsvRows] = React.useState<string[][]>([])
  const [mapping, setMapping] = React.useState<Record<string, string>>({})
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [progress, setProgress] = React.useState(0)
  const [dragOver, setDragOver] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  function reset() {
    setStep("upload")
    setFile(null)
    setCsvHeaders([])
    setCsvRows([])
    setMapping({})
    setResult(null)
    setProgress(0)
  }

  async function handleFile(f: File) {
    setFile(f)
    const text = await f.text()
    const { headers, rows } = parseCSV(text)
    setCsvHeaders(headers)
    setCsvRows(rows)

    // Auto-map columns by fuzzy matching
    const autoMap: Record<string, string> = {}
    columns.forEach((col) => {
      const match = headers.find(
        (h) =>
          h.toLowerCase() === col.key.toLowerCase() ||
          h.toLowerCase() === col.label.toLowerCase() ||
          h.toLowerCase().includes(col.key.toLowerCase()),
      )
      if (match) autoMap[col.key] = match
    })
    setMapping(autoMap)
    setStep("mapping")
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
      handleFile(f)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function goToPreview() {
    const requiredMissing = columns.filter(
      (c) => c.required && !mapping[c.key],
    )
    if (requiredMissing.length > 0) return
    setStep("preview")
  }

  function getMappedRows(): Record<string, string>[] {
    return csvRows.map((row) => {
      const obj: Record<string, string> = {}
      columns.forEach((col) => {
        const csvHeader = mapping[col.key]
        if (csvHeader) {
          const idx = csvHeaders.indexOf(csvHeader)
          obj[col.key] = idx >= 0 ? (row[idx] ?? "") : ""
        }
      })
      return obj
    })
  }

  function getPreviewErrors(): { row: number; field: string; message: string }[] {
    const errors: { row: number; field: string; message: string }[] = []
    const mapped = getMappedRows()
    mapped.forEach((row, i) => {
      columns.forEach((col) => {
        if (col.required && !row[col.key]?.trim()) {
          errors.push({ row: i + 1, field: col.label, message: "Requerido" })
        }
        if (col.validate && row[col.key]) {
          const err = col.validate(row[col.key])
          if (err) errors.push({ row: i + 1, field: col.label, message: err })
        }
      })
    })
    return errors
  }

  async function doImport() {
    setStep("importing")
    setProgress(10)
    const rows = getMappedRows()
    setProgress(30)
    try {
      const res = await onImport(rows)
      setProgress(100)
      setResult(res)
      setStep("done")
    } catch {
      setResult({ success: 0, errors: [{ row: 0, field: "", message: "Error de conexión" }] })
      setStep("done")
    }
  }

  function downloadTemplate() {
    if (!templateCSV) {
      const header = columns.map((c) => c.label).join(",")
      const blob = new Blob(["\uFEFF" + header + "\n"], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = templateFilename
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const blob = new Blob(["\uFEFF" + templateCSV], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = templateFilename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const previewErrors = step === "preview" ? getPreviewErrors() : []
  const mappedRequired = columns.filter((c) => c.required && !mapping[c.key])

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {(["upload", "mapping", "preview", "done"] as const).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className="h-px flex-1 bg-border" />}
              <Badge
                variant={step === s || (step === "importing" && s === "done") ? "default" : "secondary"}
                className="text-[10px]"
              >
                {i + 1}. {s === "upload" ? "Archivo" : s === "mapping" ? "Mapeo" : s === "preview" ? "Verificar" : "Resultado"}
              </Badge>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Arrastrá tu archivo CSV aquí</p>
              <p className="text-xs text-muted-foreground mt-1">o hacé clic para seleccionar</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" />
              Descargar plantilla CSV
            </Button>
          </div>
        )}

        {/* Step 2: Column mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{file?.name}</span>
              <Badge variant="secondary">{csvRows.length} filas</Badge>
              <Badge variant="secondary">{csvHeaders.length} columnas</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo del sistema</TableHead>
                  <TableHead>Columna del CSV</TableHead>
                  <TableHead className="w-20">Req.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((col) => (
                  <TableRow key={col.key}>
                    <TableCell className="font-medium">{col.label}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping[col.key] ?? "__none__"}
                        onValueChange={(v) =>
                          setMapping((m) => ({ ...m, [col.key]: v === "__none__" ? "" : v }))
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="No mapeado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— No mapear —</SelectItem>
                          {csvHeaders.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {col.required ? (
                        <Badge variant={mapping[col.key] ? "default" : "destructive"} className="text-[10px]">
                          {mapping[col.key] ? "✓" : "Req."}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Opt.</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {mappedRequired.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Faltan mapear {mappedRequired.length} campo(s) obligatorio(s)
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Volver</Button>
              <Button onClick={goToPreview} disabled={mappedRequired.length > 0}>
                Verificar datos
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{csvRows.length} filas a importar</Badge>
              {previewErrors.length === 0 ? (
                <Badge className="bg-green-100 text-green-800 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Sin errores
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {previewErrors.length} error(es)
                </Badge>
              )}
            </div>

            {/* Preview table — first 5 rows */}
            <div className="border rounded-lg overflow-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {columns.filter((c) => mapping[c.key]).map((c) => (
                      <TableHead key={c.key}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedRows().slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {columns.filter((c) => mapping[c.key]).map((c) => {
                        const hasError = previewErrors.some(
                          (e) => e.row === i + 1 && e.field === c.label,
                        )
                        return (
                          <TableCell
                            key={c.key}
                            className={cn("text-sm", hasError && "text-destructive bg-destructive/5")}
                          >
                            {row[c.key] || "—"}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {csvRows.length > 5 && (
              <p className="text-xs text-muted-foreground">
                Mostrando 5 de {csvRows.length} filas...
              </p>
            )}

            {previewErrors.length > 0 && (
              <div className="border border-destructive/20 rounded-lg p-3 max-h-32 overflow-auto">
                <p className="text-xs font-medium text-destructive mb-1">Errores encontrados:</p>
                {previewErrors.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    Fila {e.row} — {e.field}: {e.message}
                  </p>
                ))}
                {previewErrors.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ...y {previewErrors.length - 10} más
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>Volver</Button>
              <Button onClick={doImport} disabled={previewErrors.length > 0}>
                Importar {csvRows.length} registro(s)
              </Button>
            </div>
          </div>
        )}

        {/* Step 3.5: Importing */}
        {step === "importing" && (
          <div className="py-8 text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm font-medium">Importando datos...</p>
            <Progress value={progress} className="w-64 mx-auto" />
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && result && (
          <div className="py-6 space-y-4 text-center">
            {result.success > 0 ? (
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            )}
            <div>
              <p className="text-lg font-semibold">
                {result.success} registro(s) importado(s) correctamente
              </p>
              {result.errors.length > 0 && (
                <p className="text-sm text-destructive mt-1">
                  {result.errors.length} error(es) durante la importación
                </p>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="border border-destructive/20 rounded-lg p-3 max-h-32 overflow-auto text-left">
                {result.errors.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {e.row > 0 ? `Fila ${e.row}` : "General"}: {e.message}
                  </p>
                ))}
              </div>
            )}
            <Button onClick={() => { reset(); setOpen(false) }}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

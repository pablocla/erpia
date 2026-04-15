"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText, Download, RefreshCw, FileCheck,
  Calendar,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Generacion {
  id: number
  tipo: string
  periodo: string
  cantidadRegistros: number
  nombreArchivo: string
  estado: string
  createdAt: string
}

export default function CITIPage() {
  const [generaciones, setGeneraciones] = useState<Generacion[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState("ventas")
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [generando, setGenerando] = useState(false)

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/impuestos/citi", { headers })
      if (res.ok) setGeneraciones(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
  }))

  async function handleGenerar() {
    setGenerando(true)
    try {
      const res = await fetch("/api/impuestos/citi", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, periodo }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `CITI_${tipo.toUpperCase()}_${periodo.replace("-", "")}.txt`
        a.click()
        URL.revokeObjectURL(url)
        fetchData()
      }
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CITI Ventas / Compras</h1>
          <p className="text-muted-foreground">
            Generación de archivos CITI formato RG 3685 para AFIP
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* Generar */}
      <Card>
        <CardHeader><CardTitle className="text-base">Generar archivo CITI</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ventas">CITI Ventas</SelectItem>
                  <SelectItem value="compras">CITI Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <Input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleGenerar} disabled={generando}>
              <Download className="mr-2 h-4 w-4" />
              {generando ? "Generando..." : "Generar y descargar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader><CardTitle className="text-base">Historial de generaciones</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-6">Cargando...</p>
          ) : generaciones.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No se han generado archivos CITI todavía
            </p>
          ) : (
            <div className="space-y-2">
              {generaciones.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-3 border-b border-muted/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-sm">{g.nombreArchivo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{g.tipo.toUpperCase()}</Badge>
                        <span>Período: {g.periodo}</span>
                        <span>{g.cantidadRegistros} registros</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      g.estado === "presentado" ? "bg-emerald-500/15 text-emerald-600"
                        : g.estado === "error" ? "bg-red-500/15 text-red-600"
                        : "bg-blue-500/15 text-blue-600"
                    }>
                      {g.estado}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(g.createdAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

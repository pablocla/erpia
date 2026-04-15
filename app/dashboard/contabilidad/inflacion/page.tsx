"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  TrendingDown, Calculator, CheckCircle, RefreshCw, Plus,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface AjusteInflacion {
  id: number
  periodo: string
  coeficiente: number
  montoAjuste: number | null
  estado: string
  createdAt: string
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

export default function InflacionPage() {
  const [ajustes, setAjustes] = useState<AjusteInflacion[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("")
  const [coeficiente, setCoeficiente] = useState("")

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  const fetchAjustes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/contabilidad/inflacion", { headers })
      const data = await res.json()
      if (data.success) setAjustes(data.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAjustes() }, [fetchAjustes])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchAjustes,
  }))

  const registrarCoef = async () => {
    if (!periodo || !coeficiente) return
    await fetch("/api/contabilidad/inflacion", {
      method: "POST",
      headers,
      body: JSON.stringify({ accion: "coeficiente", periodo, coeficiente: Number(coeficiente), indice: "IPC" }),
    })
    setPeriodo("")
    setCoeficiente("")
    fetchAjustes()
  }

  const calcular = async (per: string) => {
    await fetch("/api/contabilidad/inflacion", {
      method: "POST",
      headers,
      body: JSON.stringify({ accion: "calcular", periodo: per }),
    })
    fetchAjustes()
  }

  const aplicar = async (ajusteId: number) => {
    await fetch("/api/contabilidad/inflacion", {
      method: "POST",
      headers,
      body: JSON.stringify({ accion: "aplicar", ajusteId }),
    })
    fetchAjustes()
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-7 w-7 text-primary" />
            Ajuste por Inflación — RT6 / NIC29
          </h1>
          <p className="text-sm text-muted-foreground">Re-expresión de estados contables por inflación con RECPAM</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAjustes} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      {/* Registrar coeficiente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Registrar coeficiente IPC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div>
              <Label>Período (YYYY-MM)</Label>
              <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="2025-01" className="w-36" />
            </div>
            <div>
              <Label>Coeficiente</Label>
              <Input value={coeficiente} onChange={(e) => setCoeficiente(e.target.value)} placeholder="1.0525" type="number" step="0.0001" className="w-36" />
            </div>
            <Button onClick={registrarCoef} disabled={!periodo || !coeficiente}>
              <Plus className="h-4 w-4 mr-1" /> Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de ajustes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ajustes registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {ajustes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Sin ajustes registrados. Registre coeficientes IPC para comenzar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Coeficiente</TableHead>
                  <TableHead className="text-right">Monto Ajuste</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ajustes.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-medium">{a.periodo}</TableCell>
                    <TableCell className="text-right font-mono">{a.coeficiente}</TableCell>
                    <TableCell className="text-right font-medium">{a.montoAjuste != null ? formatARS(a.montoAjuste) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.estado === "aplicado" ? "default" : a.estado === "calculado" ? "secondary" : "outline"}>
                        {a.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(a.createdAt).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {a.estado === "pendiente" && (
                          <Button size="sm" variant="outline" onClick={() => calcular(a.periodo)}>
                            <Calculator className="h-3.5 w-3.5 mr-1" /> Calcular
                          </Button>
                        )}
                        {a.estado === "calculado" && (
                          <Button size="sm" onClick={() => aplicar(a.id)}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aplicar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { FileText, Plus, Search } from "lucide-react"
import Link from "next/link"

interface Contrato {
  id: number
  numero: string
  tipo: "compra" | "venta"
  grano: { nombre: string }
  proveedor: { nombre: string } | null
  cliente: { nombre: string } | null
  campana: string
  toneladasPactadas: number
  toneladasEntregadas: number
  precioPacto: number | null
  precioFijado: number | null
  moneda: string
  estado: string
  fechaFirma: string
}

interface ContratosResponse {
  contratos: Contrato[]
  total: number
  pages: number
}

const NUM = (v: number, d = 1) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const ARS = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
const FECHA = (s: string) => new Date(s).toLocaleDateString("es-AR")

const ESTADO_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  abierto: "default",
  parcial: "secondary",
  cerrado: "outline",
  anulado: "destructive",
}

const CAMPANAS = ["2025/26", "2024/25", "2023/24"]

export default function ContratosPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [campana, setCampana] = useState("")
  const [estado, setEstado] = useState("")

  const qs = new URLSearchParams({ page: String(page), limit: "50" })
  if (campana) qs.set("campana", campana)
  if (estado) qs.set("estado", estado)

  const { data, isLoading } = useAuthFetch<ContratosResponse>(`/api/agro/contratos?${qs}`)

  const contratos = (data?.contratos ?? []).filter(
    c =>
      !search ||
      c.numero.includes(search) ||
      c.grano.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.proveedor?.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.cliente?.nombre ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contratos</h1>
          <p className="text-sm text-muted-foreground">Contratos de compra/venta de cereales</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agro/contratos/nuevo">
            <Plus className="mr-1 h-4 w-4" /> Nuevo contrato
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={campana} onValueChange={setCampana}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Campaña" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {CAMPANAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><Spinner /></div>
          ) : contratos.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 opacity-20" />
              <div>
                <p className="font-medium">Sin contratos</p>
                <p className="text-sm">Registre el primer contrato de cereales</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/agro/contratos/nuevo">
                  <Plus className="mr-1 h-4 w-4" /> Nuevo contrato
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-4 font-medium">N°</th>
                    <th className="pb-2 pr-4 font-medium">Tipo</th>
                    <th className="pb-2 pr-4 font-medium">Grano</th>
                    <th className="pb-2 pr-4 font-medium">Contraparte</th>
                    <th className="pb-2 pr-4 font-medium">Campaña</th>
                    <th className="pb-2 pr-4 font-medium text-right">Pactadas (tn)</th>
                    <th className="pb-2 pr-4 font-medium text-right">Entregadas</th>
                    <th className="pb-2 pr-4 font-medium text-right">Precio</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contratos.map(c => {
                    const pct = c.toneladasPactadas > 0 ? Math.round((c.toneladasEntregadas / c.toneladasPactadas) * 100) : 0
                    const precio = c.precioFijado ?? c.precioPacto
                    return (
                      <tr key={c.id} className="hover:bg-accent/40">
                        <td className="py-2 pr-4 font-mono font-medium">{c.numero}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={c.tipo === "compra" ? "default" : "secondary"} className="text-xs">
                            {c.tipo === "compra" ? "Compra" : "Venta"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 font-medium">{c.grano.nombre}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {c.proveedor?.nombre ?? c.cliente?.nombre ?? "—"}
                        </td>
                        <td className="py-2 pr-4">{c.campana}</td>
                        <td className="py-2 pr-4 text-right">{NUM(c.toneladasPactadas)}</td>
                        <td className="py-2 pr-4 text-right">
                          <span className={pct >= 100 ? "text-green-600" : pct > 0 ? "text-amber-600" : "text-muted-foreground"}>
                            {NUM(c.toneladasEntregadas)} <span className="text-xs">({pct}%)</span>
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {precio
                            ? c.moneda === "USD"
                              ? `USD ${NUM(Number(precio), 2)}`
                              : ARS(Number(precio))
                            : <span className="text-amber-600 text-xs">A fijar</span>
                          }
                        </td>
                        <td className="py-2">
                          <Badge variant={ESTADO_VARIANT[c.estado] ?? "secondary"} className="text-xs capitalize">
                            {c.estado}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(data?.pages ?? 0) > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="flex items-center text-sm text-muted-foreground">Página {page} de {data?.pages}</span>
              <Button variant="outline" size="sm" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

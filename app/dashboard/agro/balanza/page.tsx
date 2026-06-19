"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { useToast } from "@/hooks/use-toast"
import { Truck, Plus, Search } from "lucide-react"
import Link from "next/link"

interface Ticket {
  id: number
  numero: string
  fecha: string
  tipo: "entrada" | "salida"
  grano: { nombre: string }
  proveedor: { nombre: string } | null
  silo: { nombre: string } | null
  patente: string | null
  pesoBruto: number
  tara: number
  pesoNeto: number
  humedad: number | null
  impureza: number | null
  factorCalidad: number
  estado: string
  cartaPorteNumero: string | null
}

interface TicketResponse {
  tickets: Ticket[]
  total: number
  pages: number
}

const NUM = (v: number, d = 0) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const FECHA = (s: string) => new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

const ESTADO_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  confirmado: "default",
  pendiente: "secondary",
  anulado: "destructive",
}

export default function BalanzaPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, mutate } = useAuthFetch<TicketResponse>(
    `/api/agro/balanza?page=${page}&limit=50`
  )

  const tickets = (data?.tickets ?? []).filter(
    (t) =>
      !search ||
      t.numero.includes(search) ||
      t.grano.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (t.proveedor?.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.patente ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Balanza</h1>
          <p className="text-sm text-muted-foreground">Tickets de pesaje de camiones</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agro/balanza/nuevo">
            <Plus className="mr-1 h-4 w-4" /> Nuevo ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por patente, grano, productor..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} tickets</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
              <Truck className="h-12 w-12 opacity-20" />
              <div>
                <p className="font-medium">Sin tickets registrados</p>
                <p className="text-sm">Cree el primer ticket de balanza</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/agro/balanza/nuevo">
                  <Plus className="mr-1 h-4 w-4" /> Pesar camión
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-4 font-medium">Ticket</th>
                    <th className="pb-2 pr-4 font-medium">Fecha</th>
                    <th className="pb-2 pr-4 font-medium">Tipo</th>
                    <th className="pb-2 pr-4 font-medium">Grano</th>
                    <th className="pb-2 pr-4 font-medium">Productor</th>
                    <th className="pb-2 pr-4 font-medium">Patente</th>
                    <th className="pb-2 pr-4 font-medium text-right">Neto (kg)</th>
                    <th className="pb-2 pr-4 font-medium text-right">Humedad</th>
                    <th className="pb-2 pr-4 font-medium text-right">Factor</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-accent/40">
                      <td className="py-2 pr-4 font-mono font-medium">{t.numero}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{FECHA(t.fecha)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={t.tipo === "entrada" ? "default" : "secondary"} className="text-xs">
                          {t.tipo === "entrada" ? "↓ Entrada" : "↑ Salida"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 font-medium">{t.grano.nombre}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{t.proveedor?.nombre ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{t.patente ?? "—"}</td>
                      <td className="py-2 pr-4 text-right font-medium">{NUM(t.pesoNeto)}</td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">
                        {t.humedad != null ? `${NUM(t.humedad, 1)}%` : "—"}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className={t.factorCalidad < 1 ? "text-amber-600" : "text-green-600"}>
                          {NUM(t.factorCalidad * 100, 1)}%
                        </span>
                      </td>
                      <td className="py-2">
                        <Badge variant={ESTADO_BADGE[t.estado] ?? "secondary"} className="text-xs">
                          {t.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {(data?.pages ?? 0) > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                Página {page} de {data?.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

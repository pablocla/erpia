import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bug } from "lucide-react"

interface VisitaOT {
  id: number
  numero: string
  estado: string
  titulo: string | null
  fechaCreacion: string
  fechaPrometida: string | null
  tecnicoAsignado: string | null
  metadata?: {
    plaga?: string
    tipoServicio?: string
    observacionesVisita?: string
    estadoPago?: string
    montoCobrado?: number
    fechaVencimientoCertificado?: string
  }
}

function estadoBadgeVariant(estado: string): "default" | "secondary" | "outline" | "destructive" {
  if (estado === "LISTO" || estado === "ENTREGADO") return "default"
  if (estado === "EN_PROCESO") return "secondary"
  if (estado === "CANCELADO") return "destructive"
  return "outline"
}

export function HistorialFumigacion({ clienteId }: { clienteId: number }) {
  const [visitas, setVisitas] = useState<VisitaOT[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/clientes/${clienteId}/fumigacion`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        if (!res.ok) throw new Error("Error al cargar historial")
        const data = await res.json()
        setVisitas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clienteId])

  if (loading) return <div className="py-4 text-center text-sm text-muted-foreground">Cargando historial...</div>
  if (error) return <div className="py-4 text-center text-sm text-destructive">{error}</div>
  if (visitas.length === 0) return <div className="py-4 text-center text-sm text-muted-foreground">No hay visitas registradas para este cliente.</div>

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Nro</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Servicio / Plaga</TableHead>
            <TableHead>Técnico</TableHead>
            <TableHead>Cobro</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visitas.map((v) => (
            <TableRow key={v.id}>
              <TableCell>{v.fechaPrometida ? v.fechaPrometida.slice(0, 10) : v.fechaCreacion.slice(0, 10)}</TableCell>
              <TableCell className="font-mono text-xs">{v.numero}</TableCell>
              <TableCell>
                <Badge variant={estadoBadgeVariant(v.estado)}>{v.estado}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">{v.metadata?.tipoServicio || v.titulo || "Fumigación"}</div>
                {v.metadata?.plaga && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Bug className="w-3 h-3" /> {v.metadata.plaga}</div>}
              </TableCell>
              <TableCell>{v.tecnicoAsignado || "-"}</TableCell>
              <TableCell>
                {v.metadata?.estadoPago === "PAGADO" ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pagado</Badge>
                ) : v.metadata?.estadoPago === "PENDIENTE_PAGO" ? (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Pendiente</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
                {v.metadata?.montoCobrado ? <div className="text-xs mt-1 font-medium">${v.metadata.montoCobrado}</div> : null}
              </TableCell>
              <TableCell className="text-right">
                {(v.estado === "LISTO" || v.estado === "ENTREGADO") && (
                  <a href={`/api/fumigacion/certificado/${v.id}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                    Ver Certificado
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

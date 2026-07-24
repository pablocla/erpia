"use client"

import { format } from "date-fns"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, ArrowRight, PackageCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { EmptyState } from "@/components/ui/empty-state"

export default function FacturarRemitosPage() {
  // En un caso real: GET /api/compras/remitos-pendientes
  // Para la UI de demo simulamos algunos remitos
  const [remitos, setRemitos] = useState([
    {
      id: 1,
      numero: "R-0001-00001234",
      fecha: new Date(),
      proveedor: "Proveedor A SRL",
      estado: "pendiente_factura",
    },
    {
      id: 2,
      numero: "R-0001-00001235",
      fecha: new Date(Date.now() - 86400000),
      proveedor: "Insumos Industriales",
      estado: "pendiente_factura",
    },
  ])
  const [isProcessing, setIsProcessing] = useState<number | null>(null)
  const { toast } = useToast()

  const handleFacturar = async (id: number) => {
    setIsProcessing(id)
    try {
      const res = await authFetch("/api/compras/remito-a-factura", {
        method: "POST",
        body: JSON.stringify({ remitoId: id }),
      })

      if (!res.ok) throw new Error("Error al convertir")

      toast({
        title: "Factura generada",
        description: "El remito fue convertido a factura (borrador).",
      })
      setRemitos((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast({
        title: "Error",
        description: "No se pudo facturar el remito. Reintentá.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <PageShell className="max-w-7xl">
      <PageHeader
        variant="surface"
        title="Facturación de remitos"
        description="Convertí recepciones de mercadería en factura de proveedor (3-way match → borrador)."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <FileText className="h-3.5 w-3.5" />
            Compras
          </span>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="w-5 h-5 text-primary" />
            Remitos pendientes de facturar
          </CardTitle>
          <CardDescription>
            Elegí el remito del proveedor para generar la factura borrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {remitos.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={PackageCheck}
                title="No hay remitos pendientes"
                description="Cuando recibas mercadería con remito, van a aparecer acá para facturar."
                actionLabel="Ir a órdenes de compra"
                onAction={() => {
                  window.location.href = "/dashboard/compras"
                }}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Remito N°</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remitos.map((remito) => (
                  <TableRow key={remito.id}>
                    <TableCell className="font-mono font-medium">{remito.numero}</TableCell>
                    <TableCell>{format(new Date(remito.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{remito.proveedor}</TableCell>
                    <TableCell>
                      <StatusBadge variant="warning" label="Pendiente factura" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="min-h-[40px]"
                        disabled={isProcessing === remito.id}
                        onClick={() => void handleFacturar(remito.id)}
                      >
                        {isProcessing === remito.id ? (
                          "Procesando…"
                        ) : (
                          <>
                            Generar factura <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

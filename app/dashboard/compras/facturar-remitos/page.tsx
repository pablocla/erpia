"use client"
import { format } from "date-fns"

import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowRight, PackageCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"


export default function FacturarRemitosPage() {
  // En un caso real: GET /api/compras/remitos-pendientes
  // Para la UI de demo simulamos algunos remitos
  const [remitos, setRemitos] = useState([
    { id: 1, numero: "R-0001-00001234", fecha: new Date(), proveedor: "Proveedor A SRL", estado: "pendiente_factura" },
    { id: 2, numero: "R-0001-00001235", fecha: new Date(Date.now() - 86400000), proveedor: "Insumos Industriales", estado: "pendiente_factura" }
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
      
      toast({ title: "Factura Generada", description: `El remito fue convertido a factura (Borrador).` })
      setRemitos(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al intentar facturar.", variant: "destructive" })
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación de Remitos</h1>
          <p className="text-muted-foreground">Convierte las recepciones de mercadería en facturas de proveedor.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-primary" />
            Remitos Recibidos Pendientes de Facturar
          </CardTitle>
          <CardDescription>
            Selecciona el remito del proveedor para realizar el 3-way match y generar la factura borrador.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
              {remitos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay remitos pendientes de facturar.
                  </TableCell>
                </TableRow>
              ) : (
                remitos.map((remito) => (
                  <TableRow key={remito.id}>
                    <TableCell className="font-medium">{remito.numero}</TableCell>
                    <TableCell>{format(new Date(remito.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{remito.proveedor}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pendiente Factura</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        disabled={isProcessing === remito.id}
                        onClick={() => handleFacturar(remito.id)}
                      >
                        {isProcessing === remito.id ? "Procesando..." : (
                          <>
                            Generar Factura <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

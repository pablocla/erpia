"use client"

import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowRight, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { formatCurrency, formatDate } from "@/lib/i18n/formatters"

export default function CarteraChequesPage() {
  const { data: cheques, isLoading, mutate } = useAuthFetch<any[]>("/api/bancos/cheques")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (!cheques) return
    if (selectedIds.length === cheques.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(cheques.map(c => c.id))
    }
  }

  const handleBulkAction = async (action: "depositar" | "endosar" | "rechazar") => {
    if (selectedIds.length === 0) return

    if (action === "endosar") {
      toast({ title: "Próximamente", description: "El endoso de cheques requerirá seleccionar un proveedor destino." })
      return
    }

    setIsProcessing(true)
    try {
      const res = await authFetch("/api/bancos/cheques/bulk-action", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds, action }),
      })
      if (!res.ok) throw new Error("Error en la operación")
      
      toast({ title: "Operación Exitosa", description: `Los cheques han sido actualizados.` })
      setSelectedIds([])
      mutate()
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al procesar los cheques.", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <div className="p-8">Cargando cartera de cheques...</div>

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartera de Cheques</h1>
          <p className="text-muted-foreground">Gestioná los cheques de terceros en cartera (recibidos).</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle>Valores en Cartera</CardTitle>
            <CardDescription>{cheques?.length || 0} cheques disponibles</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={selectedIds.length === 0 || isProcessing}
              onClick={() => handleBulkAction("rechazar")}
            >
              <XCircle className="w-4 h-4 mr-2 text-red-500" /> Marcar Rechazado
            </Button>
            <Button 
              variant="outline" 
              disabled={selectedIds.length === 0 || isProcessing}
              onClick={() => handleBulkAction("endosar")}
            >
              <ArrowRight className="w-4 h-4 mr-2" /> Endosar
            </Button>
            <Button 
              disabled={selectedIds.length === 0 || isProcessing}
              onClick={() => handleBulkAction("depositar")}
            >
              <Wallet className="w-4 h-4 mr-2" /> Depositar en Banco
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <Checkbox 
                    checked={cheques && cheques.length > 0 && selectedIds.length === cheques.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Banco Librador</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheques?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay cheques en cartera.
                  </TableCell>
                </TableRow>
              ) : (
                cheques?.map((cheque) => (
                  <TableRow key={cheque.id} className="cursor-pointer" onClick={() => toggleSelect(cheque.id)}>
                    <TableCell className="text-center">
                      <Checkbox checked={selectedIds.includes(cheque.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{cheque.numero}</TableCell>
                    <TableCell>{cheque.bancoNombre || "N/A"}</TableCell>
                    <TableCell>{formatDate(cheque.fechaVencimiento)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(cheque.monto)}</TableCell>
                    <TableCell>
                      <Badge variant={cheque.estado === "cartera" ? "secondary" : "default"}>
                        {cheque.estado.toUpperCase()}
                      </Badge>
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

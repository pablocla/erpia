"use client"
import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Key, Calendar } from "lucide-react"

type Reserva = {
  id: number
  checkIn: string
  checkOut: string
  estado: string
  cliente: { nombre: string; email: string; telefono: string }
  habitacion: { id: number; numero: string; tipo: string }
}

export default function ReservasPage() {
  const { data: reservas, isLoading, mutate } = useAuthFetch<Reserva[]>("/api/hoteleria/reservas")
  const [pinDialog, setPinDialog] = useState<{ open: boolean; pinCode?: string; error?: string }>({ open: false })
  const [loadingReservaId, setLoadingReservaId] = useState<number | null>(null)

  async function handleEmitirLlave(reservaId: number, habitacionId: number) {
    setLoadingReservaId(reservaId)
    setPinDialog({ open: false })
    
    try {
      const res = await authFetch("/api/hoteleria/llaves", {
        method: "POST",
        body: JSON.stringify({ action: "emitir", reservaId, habitacionId })
      })
      const json = await res.json()
      
      if (res.ok && json.ok) {
        setPinDialog({ open: true, pinCode: json.pinCode })
      } else {
        setPinDialog({ open: true, error: json.error || "Error al emitir llave" })
      }
    } catch (e) {
      setPinDialog({ open: true, error: "Error de red al conectar con la cerradura" })
    } finally {
      setLoadingReservaId(null)
    }
  }

  return (
    <PageShell
      title="Gestión de Reservas y Llaves"
      subtitle="Administra check-in, check-out y generación de pines para cerraduras IoT"
      icon={Calendar}
    >
      <div className="bg-background border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Huésped</TableHead>
              <TableHead>Habitación</TableHead>
              <TableHead>Check-In</TableHead>
              <TableHead>Check-Out</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Cargando reservas...</TableCell></TableRow>
            ) : reservas?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center">No hay reservas para mostrar</TableCell></TableRow>
            ) : (
              reservas?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.cliente.nombre}</div>
                    <div className="text-xs text-muted-foreground">{r.cliente.telefono || r.cliente.email}</div>
                  </TableCell>
                  <TableCell>N° {r.habitacion.numero}</TableCell>
                  <TableCell>{new Date(r.checkIn).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(r.checkOut).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={r.estado === "CheckIn" ? "default" : "secondary"}>
                      {r.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loadingReservaId === r.id}
                      onClick={() => handleEmitirLlave(r.id, r.habitacion.id)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {loadingReservaId === r.id ? "Emitiendo..." : "Emitir Llave"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={pinDialog.open} onOpenChange={(v) => setPinDialog({ ...pinDialog, open: v })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Llave Virtual Generada</DialogTitle>
            <DialogDescription>
              {pinDialog.error ? "Ocurrió un error al intentar emitir la llave." : "La llave ha sido sincronizada con la cerradura inteligente."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            {pinDialog.error ? (
              <div className="text-destructive font-medium">{pinDialog.error}</div>
            ) : (
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">PIN de Acceso (Válido hasta Check-out)</div>
                <div className="text-5xl font-mono tracking-widest text-primary font-bold">{pinDialog.pinCode}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPinDialog({ open: false })}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

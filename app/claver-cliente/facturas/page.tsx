"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function StakeholderFacturasPage() {
  const mockFacturas = [
    { id: "FC-0012-00000084", periodo: "Junio 2026", totalArs: 145000, status: "pagada", date: "2026-07-01" },
    { id: "FC-0012-00000078", periodo: "Mayo 2026", totalArs: 145000, status: "pagada", date: "2026-06-01" },
    { id: "FC-0012-00000070", periodo: "Abril 2026", totalArs: 120000, status: "pagada", date: "2026-05-01" },
  ]

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">Historial de facturas y pagos de Claver Cloud</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockFacturas.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">{f.periodo} - {f.id}</p>
                  <p className="text-sm text-muted-foreground">Emitida el {f.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{fmt(f.totalArs)}</span>
                  <Badge variant={f.status === "pagada" ? "default" : "destructive"} className={f.status === "pagada" ? "bg-green-500 hover:bg-green-600" : ""}>
                    {f.status === "pagada" ? "Pagada" : "Pendiente"}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProtheusLicenciaBloqueadaPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <CardTitle>Licencia Protheus inactiva</CardTitle>
          <CardDescription>
            Este módulo no usa el trial ni Mercado Pago de Claver ERP. Va por licencia anual TOTVS. Si la
            dieron de baja o venció el año, el acceso se corta hasta renovar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/claver/contacto">Hablar con el canal TOTVS / Claver</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

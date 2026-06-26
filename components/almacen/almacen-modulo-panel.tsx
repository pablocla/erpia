"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AlmacenModuloPanelProps {
  titulo: string
  icon?: React.ReactNode
  activo: boolean
  sku: string
  children: React.ReactNode
}

/** Panel siempre visible; contenido deshabilitado si SKU inactivo */
export function AlmacenModuloPanel({
  titulo,
  icon,
  activo,
  sku,
  children,
}: AlmacenModuloPanelProps) {
  return (
    <Card className={!activo ? "border-dashed" : undefined}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {titulo}
          {!activo && (
            <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1 ml-auto">
              <Lock className="h-3 w-3" />
              Inactivo
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className={!activo ? "pointer-events-none opacity-50 select-none" : ""}>{children}</div>
        {!activo && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-b-lg">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/dashboard/apps?sku=${sku}`}>
                <Lock className="h-3.5 w-3.5 mr-1" />
                Activar en App Store
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
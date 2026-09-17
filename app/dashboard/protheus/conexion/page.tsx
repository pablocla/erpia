"use client"

import { RestConfigPanel } from "@/components/protheus-invest/rest-config-panel"

export default function ProtheusConexionPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Conexión al ERP</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada cliente TOTVS tiene su URL. Se guarda en el tenant Claver (OPO / Legacy Bridge), no en el
          navegador. En claver.com.ar tiene que ser HTTPS público.
        </p>
      </header>
      <RestConfigPanel />
    </div>
  )
}

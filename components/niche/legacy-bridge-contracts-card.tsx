"use client"

import { useEffect, useState } from "react"
import { Download, FileCode2, Plug } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAuthHeaders } from "@/lib/stores/auth-store"

type ContractSummary = {
  sku: string
  nombre: string
  tagline: string
  requiredCount: number
  prwCount: number
  bulletinVersion?: string
}

export function LegacyBridgeContractsCard() {
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/legacy-bridge/contracts", { headers: getAuthHeaders() })
        if (res.ok) {
          const data = await res.json()
          setContracts(data.contracts ?? [])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function descargarBoletin(sku: string) {
    window.open(`/api/legacy-bridge/contracts?sku=${encodeURIComponent(sku)}&format=bulletin`, "_blank")
  }

  function descargarMarkdown(sku: string) {
    window.open(`/api/legacy-bridge/contracts?sku=${encodeURIComponent(sku)}&format=markdown`, "_blank")
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-sm text-muted-foreground">Cargando contratos Edge…</CardContent>
      </Card>
    )
  }

  if (contracts.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="h-4 w-4" />
          Claver Edge Apps — contratos Protheus
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Boletines técnicos y endpoints para el equipo ADVPL del cliente. Sin tocar el core ERP.
        </p>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {contracts.map((c) => (
          <div key={c.sku} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{c.tagline}</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {c.requiredCount} EP
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => descargarBoletin(c.sku)}>
                <FileCode2 className="h-3 w-3 mr-1" />
                Boletín
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => descargarMarkdown(c.sku)}>
                <Download className="h-3 w-3 mr-1" />
                Contrato MD
              </Button>
              {c.prwCount > 0 && (
                <span className="text-[10px] text-muted-foreground self-center">{c.prwCount} fuentes .PRW</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
"use client"

import { useCallback } from "react"
import { Plug } from "lucide-react"
import { ConnectionsHub } from "@/components/integrations/connections-hub"

export default function ConexionesPage() {
  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Plug className="h-8 w-8 text-teal-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Conexiones</h1>
          <p className="text-sm text-muted-foreground">
            Conectá tu ERP con tiendas, pagos, CRM, logística y más — sin middlewares
          </p>
        </div>
      </div>
      <ConnectionsHub authHeaders={authHeaders} />
    </div>
  )
}
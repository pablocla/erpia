"use client"

import { Suspense, useCallback } from "react"
import { useParams } from "next/navigation"
import { ConnectionDetail } from "@/components/integrations/connection-detail"

export default function ConexionDetallePage() {
  const params = useParams()
  const slug = String(params.slug ?? "")
  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={<div className="text-muted-foreground">Cargando conexión...</div>}>
        <ConnectionDetail slug={slug} authHeaders={authHeaders} />
      </Suspense>
    </div>
  )
}
"use client"

import { useCallback } from "react"
import { RequestIntegrationForm } from "@/components/integrations/request-integration-form"

export default function SolicitarIntegracionPage() {
  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  return (
    <div className="p-4 md:p-6">
      <RequestIntegrationForm authHeaders={authHeaders} />
    </div>
  )
}
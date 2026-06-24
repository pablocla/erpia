"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { OpsConsole } from "@/components/ops/ops-console"

export default function ClaverTenantOperationsPage() {
  const params = useParams()
  const empresaId = Number(params.empresaId)
  const [nombre, setNombre] = useState<string>("")

  useEffect(() => {
    if (!empresaId) return
    const token = localStorage.getItem("token")
    if (!token) return

    fetch(`/api/claver/ops/clientes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const cliente = data.data?.find((c: any) => c.id === empresaId)
        if (cliente) setNombre(cliente.nombre)
      })
      .catch(console.error)
  }, [empresaId])

  if (!empresaId || isNaN(empresaId)) return <p className="p-6">ID inválido</p>

  return (
    <div className="w-full">
      <OpsConsole
        mode="analyst"
        empresaId={empresaId}
        empresaNombre={nombre || `Tenant #${empresaId}`}
        backHref="/claver-cloud/organizations"
      />
    </div>
  )
}

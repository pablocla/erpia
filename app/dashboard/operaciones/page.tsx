"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OpsConsole } from "@/components/ops/ops-console"

export default function OperacionesPage() {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch("/api/ops/overview", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (res.status === 403) setAutorizado(false)
      else setAutorizado(res.ok)
    }).catch(() => setAutorizado(false))
  }, [])

  if (autorizado === null) {
    return <p className="text-sm text-muted-foreground p-6">Verificando permisos…</p>
  }

  if (!autorizado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Acceso restringido</h1>
          <p className="text-muted-foreground mt-1 max-w-md">
            El centro de operaciones está disponible para dueños, gerentes y administradores.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Volver</Button>
      </div>
    )
  }

  return <OpsConsole mode="tenant" />
}
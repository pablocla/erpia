"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft } from "lucide-react"

type Partner = {
  id: string
  empresa: string
  rubro: string
  zona?: string | null
  matricula?: string | null
  rcVigente: boolean
  activo: boolean
}

export default function WorksPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [empresa, setEmpresa] = useState("")
  const [zona, setZona] = useState("")
  const [matricula, setMatricula] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/works/partners?ensureMock=1")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setPartners(data.partners ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function create() {
    if (!empresa.trim()) return
    setBusy(true)
    setError("")
    try {
      const res = await authFetch("/api/works/partners", {
        method: "POST",
        body: JSON.stringify({
          empresa,
          rubro: "epc_solar",
          zona: zona || undefined,
          matricula: matricula || undefined,
          rcVigente: true,
          segmentoAllowlist: ["energy"],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setEmpresa("")
      setZona("")
      setMatricula("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/claver-cloud/works">
          <ArrowLeft className="mr-1 h-4 w-4" /> Works
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold">Works Partners</h1>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alta EPC</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Empresa *" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
          <Input placeholder="Zona" value={zona} onChange={(e) => setZona(e.target.value)} />
          <Input placeholder="Matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
          <Button disabled={busy || !empresa.trim()} onClick={() => void create()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
          </Button>
        </CardContent>
      </Card>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <div className="grid gap-2">
          {partners.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-medium">{p.empresa}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.rubro} · {p.zona ?? "—"} · {p.matricula ?? "sin matrícula"}
                  </div>
                </div>
                <div className="flex gap-2">
                  {p.rcVigente ? <Badge className="bg-emerald-600">RC</Badge> : <Badge variant="outline">Sin RC</Badge>}
                  {p.activo ? <Badge variant="secondary">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

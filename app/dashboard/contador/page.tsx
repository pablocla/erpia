"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Loader2,
  Plus,
  Building2,
  FileSpreadsheet,
  Download,
  BookOpen,
} from "lucide-react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch, getToken } from "@/lib/stores"
import { PageShell, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ClienteRow {
  linkId: number
  permisos: string
  empresa: {
    id: number
    nombre: string
    cuit: string
    email: string | null
    rubro: string
  }
  trial: { diasRestantes: number; expirado: boolean } | null
}

function periodoDefault() {
  const d = new Date()
  return { mes: d.getMonth() + 1, anio: d.getFullYear() }
}

export default function ContadorMultiEmpresaPage() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useAuthFetch<{
    clientes: ClienteRow[]
    estudioEmpresaId: number
  }>("/api/contador/clientes")
  const [clienteId, setClienteId] = useState("")
  const [estudioRef, setEstudioRef] = useState("")
  const [busy, setBusy] = useState(false)
  const [resumen, setResumen] = useState<Record<string, unknown> | null>(null)
  const def = periodoDefault()
  const [mes, setMes] = useState(String(def.mes))
  const [anio, setAnio] = useState(String(def.anio))
  const [exportandoId, setExportandoId] = useState<number | null>(null)

  async function vincular() {
    setBusy(true)
    try {
      const res = await authFetch("/api/contador/clientes", {
        method: "POST",
        body: JSON.stringify({
          action: "vincular",
          clienteEmpresaId: Number(clienteId),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({ title: "Cliente vinculado" })
      setClienteId("")
      mutate()
    } catch (e) {
      toast({
        title: "No se pudo vincular",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function autorizarEstudio() {
    setBusy(true)
    try {
      const res = await authFetch("/api/contador/clientes", {
        method: "POST",
        body: JSON.stringify({
          action: "autorizar_estudio",
          estudioCuitOrId: estudioRef,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      toast({
        title: "Estudio autorizado",
        description: "Tu contador ya puede ver lecturas fiscales.",
      })
      setEstudioRef("")
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function verResumen(empresaId: number) {
    setBusy(true)
    try {
      const res = await authFetch(`/api/contador/clientes/${empresaId}/resumen`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error")
      setResumen(json)
    } catch (e) {
      toast({
        title: "Sin acceso",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  async function exportarIva(
    empresaId: number,
    formato: "pack" | "citi" | "csv",
  ) {
    setExportandoId(empresaId)
    try {
      const token = getToken()
      const qs = new URLSearchParams({
        mes,
        anio,
        formato,
      })
      const res = await fetch(
        `/api/contador/clientes/${empresaId}/export-iva?${qs.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Error ${res.status}`)
      }
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition")
      const match = cd?.match(/filename="?([^"]+)"?/)
      const filename =
        match?.[1] ??
        `libro_iva_${empresaId}_${anio}-${mes.padStart(2, "0")}.zip`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: "Exportación lista",
        description:
          formato === "citi"
            ? "CITI Ventas/Compras (SIAP) descargado"
            : formato === "csv"
              ? "Libro IVA CSV descargado"
              : "Pack contador completo descargado",
      })
    } catch (e) {
      toast({
        title: "No se pudo exportar",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      })
    } finally {
      setExportandoId(null)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Portal del Contador"
        description="Vinculá comercios de tu estudio, mirá resúmenes fiscales y exportá el Libro IVA Digital (AFIP/ARCA) en 1 clic."
      />

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Período de exportación IVA
          </CardTitle>
          <CardDescription>
            Elegí mes/año para descargas CITI, CSV o pack contador completo (compatible SIAP).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Mes</Label>
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {String(m).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Año</Label>
            <Input
              className="w-28"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como estudio: agregar cliente</CardTitle>
            <CardDescription>ID numérico de la empresa cliente en Claver</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="empresaId del cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            />
            <Button disabled={busy || !clienteId} onClick={() => void vincular()}>
              <Plus className="mr-2 h-4 w-4" />
              Vincular
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como comercio: autorizar estudio</CardTitle>
            <CardDescription>CUIT o ID de la empresa del contador</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="CUIT o ID del estudio"
              value={estudioRef}
              onChange={(e) => setEstudioRef(e.target.value)}
            />
            <Button
              disabled={busy || !estudioRef}
              variant="outline"
              onClick={() => void autorizarEstudio()}
            >
              Autorizar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">
            Clientes del estudio ({data?.clientes?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && (data?.clientes?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay empresas vinculadas. Usá el ID de empresa del cliente o pedile que te
              autorice con tu CUIT.
            </p>
          )}
          {data?.clientes?.map((c) => (
            <div
              key={c.linkId}
              className="flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{c.empresa.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    CUIT {c.empresa.cuit} · #{c.empresa.id} · {c.empresa.rubro}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {c.permisos}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void verResumen(c.empresa.id)}>
                  <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
                  Resumen mes
                </Button>
                <Button
                  size="sm"
                  disabled={exportandoId === c.empresa.id}
                  onClick={() => void exportarIva(c.empresa.id, "pack")}
                >
                  {exportandoId === c.empresa.id ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-3.5 w-3.5" />
                  )}
                  Pack IVA
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={exportandoId === c.empresa.id}
                  onClick={() => void exportarIva(c.empresa.id, "citi")}
                >
                  CITI SIAP
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={exportandoId === c.empresa.id}
                  onClick={() => void exportarIva(c.empresa.id, "csv")}
                >
                  CSV
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/dashboard/impuestos">Impuestos</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {resumen && (
        <Card className="mt-4 border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-base">
              Resumen empresa #{String((resumen as { clienteEmpresaId?: number }).clienteEmpresaId)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">
              {JSON.stringify((resumen as { resumen?: unknown }).resumen ?? resumen, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}

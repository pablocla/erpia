"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, Save, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type AfipPending = {
  solicitadoPor: string
  solicitadoAt: string
  estado: "pendiente" | "aprobado" | "rechazado"
  aprobadoPor?: string
  aprobadoAt?: string
}

type ParamDef = {
  clave: string
  modulo: string
  pantalla: string
  api: string
  capa: number
  quienEdita: string
  descripcion: string
}

type ConfigData = {
  empresa: {
    id: number
    nombre: string
    razonSocial: string
    cuit: string | null
    puntoVenta: number | null
    entornoAfip: string | null
    rubro: string
    condicionIva: string | null
    email: string | null
    telefono: string | null
    tieneCertificado: boolean
  }
  features: { featureKey: string; activado: boolean; label: string; grupo: string }[]
  afipProdPending: AfipPending | null
  parametrosCatalogo: ParamDef[]
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

export function TenantConfigPanel({ empresaId }: { empresaId: number }) {
  const [data, setData] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [afipBusy, setAfipBusy] = useState<string | null>(null)
  const [showCatalog, setShowCatalog] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    razonSocial: "",
    cuit: "",
    puntoVenta: "",
    rubro: "",
    condicionIva: "",
    email: "",
    telefono: "",
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/config`, { headers: authHeaders() })
      if (res.ok) {
        const d = (await res.json()) as ConfigData
        setData(d)
        setForm({
          nombre: d.empresa.nombre ?? "",
          razonSocial: d.empresa.razonSocial ?? "",
          cuit: d.empresa.cuit ?? "",
          puntoVenta: d.empresa.puntoVenta != null ? String(d.empresa.puntoVenta) : "",
          rubro: d.empresa.rubro ?? "",
          condicionIva: d.empresa.condicionIva ?? "",
          email: d.empresa.email ?? "",
          telefono: d.empresa.telefono ?? "",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const guardarEmpresa = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/config`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          empresa: {
            nombre: form.nombre,
            razonSocial: form.razonSocial,
            cuit: form.cuit || undefined,
            puntoVenta: form.puntoVenta ? Number(form.puntoVenta) : undefined,
            rubro: form.rubro,
            condicionIva: form.condicionIva || undefined,
            email: form.email || undefined,
            telefono: form.telefono || undefined,
          },
        }),
      })
      if (res.ok) setData(await res.json())
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = async (featureKey: string, activado: boolean) => {
    const res = await fetch(`/api/claver/tenants/${empresaId}/config`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ feature: { featureKey, activado } }),
    })
    if (res.ok) setData(await res.json())
  }

  const afipAction = async (action: "solicitar" | "aprobar" | "rechazar") => {
    setAfipBusy(action)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/afip-produccion`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action }),
      })
      if (res.ok) await cargar()
    } finally {
      setAfipBusy(null)
    }
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">{loading ? "Cargando parametrización…" : "Sin datos"}</p>
  }

  const { empresa, features, afipProdPending } = data
  const enProd = empresa.entornoAfip === "produccion"

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Parametrización desde Cloud sin impersonar — empresa, features y aprobación dual AFIP producción.
      </p>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Datos empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["nombre", "Nombre comercial"],
              ["razonSocial", "Razón social"],
              ["cuit", "CUIT"],
              ["puntoVenta", "Punto de venta AFIP"],
              ["rubro", "Rubro"],
              ["condicionIva", "Condición IVA"],
              ["email", "Email"],
              ["telefono", "Teléfono"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end">
            <Button size="sm" onClick={() => void guardarEmpresa()} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Guardar empresa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={enProd ? "border-emerald-300/50" : ""}>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            AFIP — entorno producción
            <Badge variant="outline">{empresa.entornoAfip ?? "homologación"}</Badge>
            {empresa.tieneCertificado ? (
              <Badge className="bg-emerald-600 text-[10px]">Certificado OK</Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px]">Sin certificado</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {enProd ? (
            <p className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Tenant en producción AFIP.
            </p>
          ) : afipProdPending?.estado === "pendiente" ? (
            <>
              <p className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Solicitud pendiente — solicitó {afipProdPending.solicitadoPor} el{" "}
                {new Date(afipProdPending.solicitadoAt).toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-muted-foreground">Aprobación dual: otro analista debe aprobar o rechazar.</p>
              <div className="flex gap-2">
                <Button size="sm" disabled={afipBusy != null} onClick={() => void afipAction("aprobar")}>
                  {afipBusy === "aprobar" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Aprobar producción
                </Button>
                <Button size="sm" variant="outline" disabled={afipBusy != null} onClick={() => void afipAction("rechazar")}>
                  Rechazar
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                Requiere certificado cargado en ERP. El solicitante no puede aprobar su propia solicitud.
              </p>
              <Button
                size="sm"
                disabled={!empresa.tieneCertificado || afipBusy != null}
                onClick={() => void afipAction("solicitar")}
              >
                {afipBusy === "solicitar" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Solicitar paso a producción
              </Button>
            </>
          )}
          {afipProdPending?.estado === "rechazado" && (
            <p className="text-xs text-destructive">
              Última solicitud rechazada por {afipProdPending.aprobadoPor}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Features (Railroad)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {features.map((f) => (
            <div key={f.featureKey} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{f.featureKey} · {f.grupo}</p>
              </div>
              <Switch checked={f.activado} onCheckedChange={(v) => void toggleFeature(f.featureKey, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" onClick={() => setShowCatalog((v) => !v)}>
        <BookOpen className="h-3 w-3 mr-1" />
        {showCatalog ? "Ocultar" : "Ver"} diccionario parámetros ({data.parametrosCatalogo.length})
      </Button>
      {showCatalog && (
        <div className="border rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Clave</th>
                <th className="text-left p-2">Módulo</th>
                <th className="text-left p-2 hidden md:table-cell">Pantalla</th>
                <th className="text-left p-2">Capa</th>
              </tr>
            </thead>
            <tbody>
              {data.parametrosCatalogo.map((p) => (
                <tr key={p.clave} className="border-t">
                  <td className="p-2 font-mono">{p.clave}</td>
                  <td className="p-2">{p.modulo}</td>
                  <td className="p-2 hidden md:table-cell text-muted-foreground">{p.pantalla}</td>
                  <td className="p-2">
                    <Badge variant="outline" className={cn("text-[10px]", p.capa <= 2 && "bg-blue-500/10")}>
                      {p.capa}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
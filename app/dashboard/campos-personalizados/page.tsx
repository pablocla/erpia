"use client"

/**
 * Campos Personalizados — Admin page for custom field builder.
 * Lets the company create dynamic fields per entity (cliente, producto, proveedor, etc.)
 * without code changes or database migrations.
 */

import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

const ENTIDADES = [
  { value: "cliente", label: "Clientes" },
  { value: "producto", label: "Productos" },
  { value: "proveedor", label: "Proveedores" },
  { value: "factura", label: "Facturas" },
  { value: "compra", label: "Compras" },
  { value: "pedido", label: "Pedidos" },
  { value: "remito", label: "Remitos" },
]

const TIPOS_DATO = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "fecha", label: "Fecha" },
  { value: "booleano", label: "Sí/No" },
  { value: "select", label: "Lista desplegable" },
  { value: "multiselect", label: "Selección múltiple" },
  { value: "textarea", label: "Texto largo" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
]

interface CampoPersonalizado {
  id: number
  entidad: string
  nombreCampo: string
  etiqueta: string
  tipoDato: string
  opciones: string[] | null
  obligatorio: boolean
  orden: number
  visibleEnLista: boolean
  visibleEnFormulario: boolean
  valorDefault: string | null
  placeholder: string | null
  ayuda: string | null
  activo: boolean
}

export default function CamposPersonalizadosPage() {
  const [entidadSeleccionada, setEntidadSeleccionada] = useState("cliente")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<CampoPersonalizado | null>(null)
  const { toast } = useToast()

  const { data, mutate, isLoading } = useAuthFetch<{ data: CampoPersonalizado[] }>(
    `/api/campos-personalizados?entidad=${entidadSeleccionada}`
  )

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: () => mutate(),
    onNew: () => { setEditando(null); setMostrarForm(true) },
  }))

  const campos = data?.data ?? []

  // ─── Form state ────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    nombreCampo: "",
    etiqueta: "",
    tipoDato: "texto",
    opciones: "",
    obligatorio: false,
    visibleEnLista: false,
    visibleEnFormulario: true,
    placeholder: "",
    ayuda: "",
    valorDefault: "",
  })

  function openEdit(campo: CampoPersonalizado) {
    setEditando(campo)
    setForm({
      nombreCampo: campo.nombreCampo,
      etiqueta: campo.etiqueta,
      tipoDato: campo.tipoDato,
      opciones: Array.isArray(campo.opciones) ? campo.opciones.join(", ") : "",
      obligatorio: campo.obligatorio,
      visibleEnLista: campo.visibleEnLista,
      visibleEnFormulario: campo.visibleEnFormulario,
      placeholder: campo.placeholder ?? "",
      ayuda: campo.ayuda ?? "",
      valorDefault: campo.valorDefault ?? "",
    })
    setMostrarForm(true)
  }

  function resetForm() {
    setForm({ nombreCampo: "", etiqueta: "", tipoDato: "texto", opciones: "", obligatorio: false, visibleEnLista: false, visibleEnFormulario: true, placeholder: "", ayuda: "", valorDefault: "" })
    setEditando(null)
    setMostrarForm(false)
  }

  async function handleSubmit() {
    const payload = {
      ...(editando ? { id: editando.id } : {}),
      entidad: entidadSeleccionada,
      nombreCampo: form.nombreCampo,
      etiqueta: form.etiqueta,
      tipoDato: form.tipoDato,
      opciones: form.opciones ? form.opciones.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      obligatorio: form.obligatorio,
      visibleEnLista: form.visibleEnLista,
      visibleEnFormulario: form.visibleEnFormulario,
      placeholder: form.placeholder || undefined,
      ayuda: form.ayuda || undefined,
      valorDefault: form.valorDefault || undefined,
    }

    const res = await authFetch("/api/campos-personalizados", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast({ title: editando ? "Campo actualizado" : "Campo creado" })
      mutate()
      resetForm()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: "Error", description: err.error ?? "No se pudo guardar", variant: "destructive" })
    }
  }

  async function handleDelete(id: number) {
    const res = await authFetch(`/api/campos-personalizados?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: "Campo desactivado" })
      mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campos personalizados</h1>
          <p className="text-muted-foreground">Definí campos extra para cada entidad sin tocar código</p>
        </div>
        <button
          onClick={() => { setEditando(null); setMostrarForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
        >
          <Plus className="h-4 w-4" /> Nuevo campo
        </button>
      </div>

      {/* Entity tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {ENTIDADES.map((e) => (
          <button
            key={e.value}
            onClick={() => setEntidadSeleccionada(e.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              entidadSeleccionada === e.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Field list */}
      <div className="border rounded-xl divide-y">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Cargando...</div>}
        {!isLoading && campos.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No hay campos personalizados para {ENTIDADES.find((e) => e.value === entidadSeleccionada)?.label ?? entidadSeleccionada}.
          </div>
        )}
        {campos.map((campo) => (
          <div key={campo.id} className={cn("flex items-center gap-3 px-4 py-3", !campo.activo && "opacity-50")}>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{campo.etiqueta}</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{campo.nombreCampo}</code>
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  {TIPOS_DATO.find((t) => t.value === campo.tipoDato)?.label ?? campo.tipoDato}
                </span>
                {campo.obligatorio && <span className="text-xs text-red-500 font-medium">Requerido</span>}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {campo.visibleEnLista ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {campo.visibleEnLista ? "En lista" : "Oculto en lista"}
                </span>
                {campo.placeholder && <span>Placeholder: {campo.placeholder}</span>}
              </div>
            </div>
            <button onClick={() => openEdit(campo)} className="p-2 rounded-lg hover:bg-muted">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(campo.id)} className="p-2 rounded-lg hover:bg-muted text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Create/edit dialog */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => resetForm()}>
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editando ? "Editar campo" : "Nuevo campo personalizado"}</h2>

            <div className="space-y-4">
              {!editando && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre interno <span className="text-red-500">*</span></label>
                  <input
                    value={form.nombreCampo}
                    onChange={(e) => setForm({ ...form, nombreCampo: e.target.value })}
                    placeholder="cilindradaCompatible"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">camelCase, sin espacios ni tildes</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta visible <span className="text-red-500">*</span></label>
                <input
                  value={form.etiqueta}
                  onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
                  placeholder="Cilindrada compatible"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo de dato</label>
                <select
                  value={form.tipoDato}
                  onChange={(e) => setForm({ ...form, tipoDato: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {TIPOS_DATO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {(form.tipoDato === "select" || form.tipoDato === "multiselect") && (
                <div>
                  <label className="block text-sm font-medium mb-1">Opciones (separadas por coma)</label>
                  <input
                    value={form.opciones}
                    onChange={(e) => setForm({ ...form, opciones: e.target.value })}
                    placeholder="Opción 1, Opción 2, Opción 3"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Placeholder</label>
                <input
                  value={form.placeholder}
                  onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Texto de ayuda</label>
                <input
                  value={form.ayuda}
                  onChange={(e) => setForm({ ...form, ayuda: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor por defecto</label>
                <input
                  value={form.valorDefault}
                  onChange={(e) => setForm({ ...form, valorDefault: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.obligatorio} onChange={(e) => setForm({ ...form, obligatorio: e.target.checked })} />
                  Obligatorio
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.visibleEnLista} onChange={(e) => setForm({ ...form, visibleEnLista: e.target.checked })} />
                  Visible en lista
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.visibleEnFormulario} onChange={(e) => setForm({ ...form, visibleEnFormulario: e.target.checked })} />
                  Visible en formulario
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm font-medium">Cancelar</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                {editando ? "Guardar cambios" : "Crear campo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

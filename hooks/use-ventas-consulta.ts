"use client"

import { useCallback, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { VentasConsultaTipo } from "@/lib/comercial/ventas-consulta-catalog"

export type VentasConsultaForm = {
  nombre: string
  email: string
  telefono: string
  negocio: string
  rubro: string
  mensaje: string
}

const EMPTY_FORM: VentasConsultaForm = {
  nombre: "",
  email: "",
  telefono: "",
  negocio: "",
  rubro: "",
  mensaje: "",
}

type SubmitOptions = {
  tipo?: VentasConsultaTipo
  pagina?: string
}

export function useVentasConsulta(defaultTipo: VentasConsultaTipo = "contacto") {
  const { toast } = useToast()
  const [form, setForm] = useState<VentasConsultaForm>(EMPTY_FORM)
  const [tipo, setTipo] = useState<VentasConsultaTipo>(defaultTipo)
  const [saving, setSaving] = useState(false)

  const submit = useCallback(
    async (options?: SubmitOptions) => {
      if (!form.nombre.trim() || !form.email.trim()) {
        toast({ title: "Completá nombre y email", variant: "destructive" })
        return false
      }

      setSaving(true)
      try {
        const res = await fetch("/api/comercial/consultas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            email: form.email.trim(),
            telefono: form.telefono.trim() || undefined,
            negocio: form.negocio.trim() || undefined,
            rubro: form.rubro.trim() || undefined,
            mensaje: form.mensaje.trim() || undefined,
            tipo: options?.tipo ?? tipo,
            pagina: options?.pagina,
            website: "",
          }),
        })

        const data = (await res.json()) as { ok?: boolean; mensaje?: string; error?: string }
        if (!res.ok) {
          toast({
            title: "No se pudo enviar",
            description: data.error ?? "Probá de nuevo en unos minutos.",
            variant: "destructive",
          })
          return false
        }

        toast({
          title: "¡Consulta enviada!",
          description: data.mensaje ?? "Te contactamos en menos de 24 h hábiles.",
        })
        setForm(EMPTY_FORM)
        return true
      } catch {
        toast({
          title: "Error de conexión",
          description: "Revisá tu internet e intentá de nuevo.",
          variant: "destructive",
        })
        return false
      } finally {
        setSaving(false)
      }
    },
    [form, tipo, toast],
  )

  return { form, setForm, tipo, setTipo, saving, submit }
}
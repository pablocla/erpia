"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, ChevronsUpDown, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getAuthHeaders } from "@/lib/stores/auth-store"

export type ClienteOption = {
  id: number
  nombre: string
  telefono: string | null
}

type Props = {
  value: number | null
  onChange: (cliente: ClienteOption | null) => void
  label?: string
  required?: boolean
}

export function NicheClientePicker({ value, onChange, label = "Cliente", required = false }: Props) {
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [altaOpen, setAltaOpen] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [telefonoNuevo, setTelefonoNuevo] = useState("")
  const [creando, setCreando] = useState(false)

  const selected = clientes.find((c) => c.id === value) ?? null

  const buscar = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ take: "20", activos: "true" })
      if (q.trim()) params.set("q", q.trim())
      const res = await fetch(`/api/clientes?${params}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const json = await res.json()
        const rows = (json.data ?? []) as Array<{ id: number; nombre: string; telefono: string | null }>
        setClientes(rows.map((r) => ({ id: r.id, nombre: r.nombre, telefono: r.telefono })))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void buscar("")
  }, [buscar])

  useEffect(() => {
    const t = setTimeout(() => void buscar(query), 250)
    return () => clearTimeout(t)
  }, [query, buscar])

  async function crearCliente() {
    if (!nombreNuevo.trim() || telefonoNuevo.trim().length < 6) return
    setCreando(true)
    try {
      const res = await fetch("/api/niche/clientes-rapido", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreNuevo.trim(), telefono: telefonoNuevo.trim() }),
      })
      if (res.ok) {
        const c = (await res.json()) as ClienteOption
        setClientes((prev) => [c, ...prev])
        onChange(c)
        setAltaOpen(false)
        setNombreNuevo("")
        setTelefonoNuevo("")
        setOpen(false)
      }
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Dialog open={altaOpen} onOpenChange={setAltaOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Alta rápida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
              </div>
              <div>
                <Label>Teléfono (WhatsApp)</Label>
                <Input
                  value={telefonoNuevo}
                  onChange={(e) => setTelefonoNuevo(e.target.value)}
                  placeholder="11 2345 6789"
                />
              </div>
              <Button className="w-full" disabled={creando} onClick={() => void crearCliente()}>
                {creando ? "Guardando…" : "Crear cliente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="truncate">
                {selected.nombre}
                {selected.telefono ? ` · ${selected.telefono}` : ""}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Buscar cliente…
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Nombre, teléfono…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>{loading ? "Buscando…" : "Sin resultados"}</CommandEmpty>
              <CommandGroup>
                {clientes.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={String(c.id)}
                    onSelect={() => {
                      onChange(c)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{c.nombre}</span>
                    {c.telefono && (
                      <span className="ml-auto text-xs text-muted-foreground">{c.telefono}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
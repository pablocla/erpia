"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export interface ClienteOption {
  id: number
  nombre: string
  cuit?: string | null
  condicionIva?: string
}

interface ClienteSearchSelectProps {
  value: number | null
  onChange: (clienteId: number | null, cliente?: ClienteOption) => void
  label?: string
  required?: boolean
  className?: string
}

export function ClienteSearchSelect({
  value,
  onChange,
  label = "Cliente",
  required,
  className,
}: ClienteSearchSelectProps) {
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return
    fetch("/api/clientes", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => setClientes([]))
  }, [])

  const seleccionado = clientes.find((c) => c.id === value)

  useEffect(() => {
    if (seleccionado && !busqueda) {
      setBusqueda(seleccionado.nombre)
    }
  }, [seleccionado, busqueda])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes.slice(0, 12)
    return clientes
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.cuit ?? "").includes(q) ||
          String(c.id).includes(q),
      )
      .slice(0, 12)
  }, [clientes, busqueda])

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && " *"}
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nombre o CUIT..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setAbierto(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
        />
        {abierto && filtrados.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
            {filtrados.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-muted",
                  value === c.id && "bg-primary/10",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c.id, c)
                  setBusqueda(c.nombre)
                  setAbierto(false)
                }}
              >
                <p className="font-medium truncate">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {c.cuit ? `CUIT ${c.cuit}` : `ID ${c.id}`}
                  {c.condicionIva ? ` · ${c.condicionIva}` : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
      {value != null && (
        <input type="hidden" name="clienteId" value={value} />
      )}
    </div>
  )
}
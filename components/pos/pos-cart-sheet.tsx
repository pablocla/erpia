"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart, X, Plus, Minus, Trash2, CreditCard, User, Percent, BookOpen, Wallet,
} from "lucide-react"
import { ordenarClientesPos, mensajeCajaBloqueada, type CajaMotivo } from "@/lib/pos/pos-feedback"

export interface PosCartItem {
  productoId: number
  descripcion: string
  precio: number
  cantidad: number
  porcentajeIva: number
  descuento: number
}

export interface PosCartCliente {
  id: number
  nombre: string
  condicionIva?: string
  fiadoHabilitado?: boolean
  limiteCredito?: number
  saldoCuentaCorriente?: number
}

interface PosCartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  carrito: PosCartItem[]
  clientes: PosCartCliente[]
  clienteId: number | null
  onClienteChange: (id: number | null) => void
  descuentoGlobal: number
  onDescuentoChange: (pct: number) => void
  subtotal: number
  iva: number
  total: number
  fmt: (n: number) => string
  onCantidad: (idx: number, delta: number) => void
  onEliminar: (idx: number) => void
  onVaciar: () => void
  onCobrar: () => void
  onFiar?: () => void
  cajaOk: boolean | null
  cajaMotivo?: CajaMotivo | null
  afipBloqueaFiscal: boolean
  fiadoActivo?: boolean
  creditoDisponible?: number | null
  deudaCliente?: number
  sheetHeightClass?: string
}

export function PosCartSheet({
  open,
  onOpenChange,
  carrito,
  clientes,
  clienteId,
  onClienteChange,
  descuentoGlobal,
  onDescuentoChange,
  subtotal,
  iva,
  total,
  fmt,
  onCantidad,
  onEliminar,
  onVaciar,
  onCobrar,
  onFiar,
  cajaOk,
  cajaMotivo = null,
  afipBloqueaFiscal,
  fiadoActivo = false,
  creditoDisponible = null,
  deudaCliente = 0,
  sheetHeightClass = "h-[min(78dvh,600px)]",
}: PosCartSheetProps) {
  const itemCount = carrito.reduce((s, i) => s + i.cantidad, 0)
  const clienteActivo = clientes.find((c) => c.id === clienteId)
  const puedeFiar =
    fiadoActivo &&
    !!clienteActivo?.fiadoHabilitado &&
    carrito.length > 0 &&
    (creditoDisponible == null || creditoDisponible >= total)

  const clientesOrdenados = ordenarClientesPos(clientes)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={`${sheetHeightClass} rounded-t-2xl p-0 flex flex-col gap-0`}>
        <SheetHeader className="px-3 py-2 border-b shrink-0 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5" />
            Carrito
            {itemCount > 0 && <Badge variant="secondary">{itemCount}</Badge>}
            {carrito.length > 0 && (
              <Button variant="ghost" size="sm" className="ml-auto h-8 text-xs" onClick={onVaciar}>
                <X className="h-3 w-3 mr-1" />
                Vaciar
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="px-3 py-2 border-b shrink-0 space-y-2">
          <Select
            value={clienteId ? String(clienteId) : "__cf__"}
            onValueChange={(v) => onClienteChange(v === "__cf__" ? null : Number(v))}
          >
            <SelectTrigger className="h-10 text-sm">
              <User className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Consumidor Final" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__cf__">Consumidor Final</SelectItem>
              {clientesOrdenados.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                  {c.fiadoHabilitado ? " · Fiado" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {clienteActivo?.fiadoHabilitado && fiadoActivo && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                Libreta Fiado
              </Badge>
              {creditoDisponible != null && (
                <span className="text-muted-foreground">Disp. ${creditoDisponible.toLocaleString("es-AR")}</span>
              )}
              {deudaCliente > 0 && (
                <span className="text-red-600">Debe ${deudaCliente.toLocaleString("es-AR")}</span>
              )}
            </div>
          )}
          {fiadoActivo && !clienteActivo?.fiadoHabilitado && carrito.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Elegí un cliente con fiado o{" "}
              <Link href="/dashboard/fiado" className="text-primary underline">
                dalo de alta
              </Link>
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-6 text-center">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Tocá un producto para agregarlo</p>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-1.5">
              {carrito.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border bg-card p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{item.descripcion}</p>
                    <p className="text-[11px] text-muted-foreground">${fmt(item.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onCantidad(idx, -1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-sm font-bold w-7 text-center">{item.cantidad}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onCantidad(idx, 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-right shrink-0 w-16">
                    <p className="font-bold text-xs">${fmt(item.precio * item.cantidad)}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onEliminar(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {carrito.length > 0 && (
          <div className="shrink-0 border-t bg-background px-3 py-2 space-y-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <Percent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {[0, 5, 10, 15, 20].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDescuentoChange(d)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium touch-manipulation ${
                    descuentoGlobal === d ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {d}%
                </button>
              ))}
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold">Total</span>
              <span className="text-xl font-bold text-primary">${fmt(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {puedeFiar && onFiar && (
                <Button
                  variant="outline"
                  className="h-12 text-sm font-bold border-primary text-primary"
                  disabled={!cajaOk || afipBloqueaFiscal}
                  onClick={() => { onOpenChange(false); onFiar() }}
                >
                  <Wallet className="h-4 w-4 mr-1.5" />
                  FIAR
                </Button>
              )}
              <Button
                className={`h-12 font-bold ${puedeFiar && onFiar ? "text-sm" : "col-span-2 text-base"}`}
                disabled={!cajaOk || afipBloqueaFiscal}
                onClick={() => { onOpenChange(false); onCobrar() }}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                COBRAR
              </Button>
            </div>
            {!cajaOk && (
              <p className="text-[11px] text-destructive text-center">{mensajeCajaBloqueada(cajaMotivo)}</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
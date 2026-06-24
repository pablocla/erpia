"use client"

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
  ShoppingCart, X, Plus, Minus, Trash2, CreditCard, User, Percent,
} from "lucide-react"

export interface PosCartItem {
  productoId: number
  descripcion: string
  precio: number
  cantidad: number
  porcentajeIva: number
  descuento: number
}

interface PosCartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  carrito: PosCartItem[]
  clientes: { id: number; nombre: string; condicionIva?: string }[]
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
  cajaOk: boolean | null
  afipBloqueaFiscal: boolean
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
  cajaOk,
  afipBloqueaFiscal,
}: PosCartSheetProps) {
  const itemCount = carrito.reduce((s, i) => s + i.cantidad, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[min(88dvh,720px)] rounded-t-2xl p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0 text-left">
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

        <div className="px-4 py-2 border-b shrink-0">
          <Select
            value={clienteId ? String(clienteId) : "__cf__"}
            onValueChange={(v) => onClienteChange(v === "__cf__" ? null : Number(v))}
          >
            <SelectTrigger className="h-10">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Consumidor Final" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__cf__">Consumidor Final</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6 text-center">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">El carrito está vacío</p>
              <p className="text-xs mt-1">Tocá un producto para agregarlo</p>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              {carrito.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{item.descripcion}</p>
                    <p className="text-xs text-muted-foreground">${fmt(item.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onCantidad(idx, -1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-base font-bold w-8 text-center">{item.cantidad}</span>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onCantidad(idx, 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">${fmt(item.precio * item.cantidad)}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onEliminar(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {carrito.length > 0 && (
          <div className="shrink-0 border-t bg-background px-4 py-3 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">Desc.</span>
              {[0, 5, 10, 15, 20].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDescuentoChange(d)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium touch-manipulation ${
                    descuentoGlobal === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {d}%
                </button>
              ))}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA</span>
                <span>${fmt(iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${fmt(total)}</span>
              </div>
            </div>
            <Button
              className="w-full h-14 text-lg font-bold"
              disabled={!cajaOk || afipBloqueaFiscal}
              onClick={() => { onOpenChange(false); onCobrar() }}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              COBRAR ${fmt(total)}
            </Button>
            {!cajaOk && (
              <p className="text-xs text-destructive text-center">Abrí la caja para cobrar</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
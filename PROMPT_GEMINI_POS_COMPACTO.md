# PROMPT — Gemini: POS compacto + modal de cobro sin scroll

> **Copiar y pegar en Gemini / Cursor Agent.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Prioridad: **P0 UX** — Al confirmar cobro el modal "baja" / hay que scrollear; POS no es compacto  
> Ruta: `/dashboard/pos` → `app/dashboard/pos/page.tsx`

---

## PROMPT (copiar desde acá)

```
Sos diseñador+dev senior del POS de Clavis by Claver (Next.js 15, shadcn/ui, Tailwind v4).

## Problema reportado

El **Punto de Venta** (`/dashboard/pos`) no es compacto:
- Al tocar **Confirmar cobro** / OK, el modal de cobro **se alarga** y obliga a **scrollear hacia abajo**
- En móvil es peor: barra fija inferior + modal alto + numpad grande
- La pantalla de éxito post-venta (check verde, QR, desglose IVA) empuja los botones fuera de vista
- Sensación general: POS "pesado", no tipo caja registradora compacta

## Archivos principales

- `app/dashboard/pos/page.tsx` (~1560 líneas) — modal cobro líneas 1304-1518
- `components/pos/pos-cart-sheet.tsx` — sheet móvil del carrito
- `components/ui/dialog.tsx` — animación `slide-in-from-bottom-2`
- `app/dashboard/layout.tsx` — `isPosShell` con `overflow-hidden` (ya correcto)

## Diagnóstico técnico

### Causa del scroll en modal cobro

`DialogContent` tiene:
```tsx
className="max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[min(92dvh,640px)] overflow-y-auto"
```

Dentro apilás (en estado cobro):
1. Medios de pago (hasta 3 filas)
2. Grid 6 botones medios (`min-h-[52px]`, `py-3`)
3. Numpad 12 teclas (`h-14 sm:h-12`) — **muy alto**
4. Resumen Total/Recibe/Vuelto
5. Botón Confirmar `h-12`

Total > 640px → `overflow-y-auto` → usuario debe bajar para ver **Confirmar cobro**.

En estado **venta exitosa**:
- `CheckCircle2 h-14`, QR 96px, desglose IVA, 2 botones → mismo problema.

### Causa scroll en página principal (móvil)

- Grilla productos: `pb-24 lg:pb-3` (padding para barra fija)
- Barra fija `fixed bottom-0` + modal encima
- Varios banners alert (caja cerrada, AFIP, FCE, tipo factura) restan altura útil

## Objetivo de diseño

POS **compacto estilo caja**:
- Modal cobro cabe en **una pantalla sin scroll** en viewport 390×844 (iPhone) y 1366×768 (desktop)
- Botón **Confirmar cobro** siempre visible (sticky footer del modal)
- Post-venta: ticket mínimo + botones visibles sin scroll
- Numpad más chico o colapsable
- Menos padding vertical everywhere

## Cambios requeridos (implementar)

### 1. Refactor modal cobro → layout fijo 3 zonas

```
┌─────────────────────────┐
│ Header (total)     [X]  │  shrink-0
├─────────────────────────┤
│ Contenido scrollable    │  flex-1 min-h-0 overflow-y-auto
│ (medios, numpad)        │  SOLO si no entra; preferir que entre
├─────────────────────────┤
│ Resumen + CTA sticky    │  shrink-0 border-t bg-background
│ [Confirmar cobro]       │
└─────────────────────────┘
```

- `DialogContent`: `flex flex-col p-4 gap-2 max-h-[85dvh] overflow-hidden` (NO overflow-y-auto en el contenedor raíz)
- Footer sticky con Total + Confirmar siempre visible

### 2. Compactar numpad

- Teclas: `h-10` (no h-14)
- Gap: `gap-1` (no gap-2)
- Opción: numpad colapsable "Teclado numérico ▼" — cerrado por default en móvil
- Medios rápidos: grid 3×2 con `py-2 min-h-[44px]` (no 52px)

### 3. Pantalla éxito compacta

- Icono check: `h-10` (no h-14)
- QR: `h-16 w-16` o botón "Ver QR"
- Desglose IVA: colapsable `<details>` o omitir en móvil
- Botones Imprimir / Nueva venta: fila fija al pie del modal, siempre visible
- Al mostrar éxito: `scrollTop = 0` en el contenedor del modal

### 4. Evitar "salto" al confirmar

- Desactivar animación slide-from-bottom en modal POS (usar solo fade/zoom):
  ```tsx
  <DialogContent className="... data-[state=open]:slide-in-from-bottom-0" />
  ```
- Tras `ejecutarVenta` exitoso, NO cambiar altura bruscamente — mantener misma estructura flex
- `cerrarYNuevaVenta`: cerrar modal + focus búsqueda sin scroll de página

### 5. Móvil — reducir fricción

- `pos-cart-sheet.tsx`: altura `h-[min(75dvh,560px)]` (no 88dvh/720px)
- Barra inferior fija: reducir a `h-11` botones
- Banners alert POS: colapsar en 1 línea o icono + tooltip (no 4 barras apiladas)

### 6. Desktop — panel carrito más denso

- Items carrito: `py-1` (no py-1.5)
- Botón COBRAR: `h-12` (no h-14)
- `PosPendientesPanel`: verificar que no robe altura excesiva

## Restricciones

- NO romper: atajos teclado (/ F12 Esc), fiado cuenta corriente, AFIP, impresión fiscal
- NO eliminar funcionalidad — solo compactar UI
- Mantener touch targets mínimo 44px en botones críticos (COBRAR, medios pago)
- Probar en 3 viewports: 390px, 768px, 1280px
- Locale es-AR

## Criterios de aceptación

1. ✅ Modal cobro en iPhone 390px: **Confirmar cobro visible sin scroll** con 1 medio de pago
2. ✅ Post-venta: **Nueva venta** visible sin scroll
3. ✅ Numpad cabe o está colapsado por default en móvil
4. ✅ POS shell sigue `h-full overflow-hidden` — la página principal no scrollea detrás del modal
5. ✅ Cobro con F12 + Enter sigue funcionando
6. ✅ Sin regresiones en `app/api/pos/venta/route.ts`

## Verificación

Probar manualmente flujo:
1. Agregar 3 productos → COBRAR → Efectivo → Confirmar
2. Ver ticket éxito → Nueva venta
3. Repetir en DevTools móvil 390×844

Opcional: screenshot antes/después.

No entregues sin probar el modal en viewport chico.
```

---

## Resumen del problema UX

El modal mete **numpad + 6 medios + resumen + botón** en un contenedor con `max-h:640px` y `overflow-y-auto`. En celular el botón OK queda **debajo del fold** — por eso "te hace bajar".
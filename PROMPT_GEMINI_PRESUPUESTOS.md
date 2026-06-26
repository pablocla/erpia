# PROMPT — Gemini: Arreglar módulo Presupuestos de Ventas

> **Copiar y pegar en Gemini / Cursor Agent.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Prioridad: **P0** — El módulo no funciona en producción (lista vacía, crear falla, acciones sin auth)  
> Ruta UI: `/dashboard/ventas/presupuestos`  
> API: `/api/ventas/presupuestos`

---

## PROMPT (copiar desde acá)

```
Sos arquitecto full-stack del ERP Clavis by Claver (Next.js 15, Prisma, PostgreSQL, TypeScript strict).

## Problema reportado

La pantalla **Presupuestos** (`/dashboard/ventas/presupuestos`) no funciona:
- No carga la lista (siempre vacía o error silencioso)
- Crear presupuesto falla
- Acciones Enviar / Aceptar / Rechazar / Convertir / Duplicar no persisten

## Diagnóstico ya identificado (arreglar TODO)

### Bug 1 — Frontend sin autenticación (CRÍTICO)

Archivo: `app/dashboard/ventas/presupuestos/page.tsx`

La página usa `fetch()` plano SIN token JWT:
- Línea ~79: `fetch("/api/clientes")` 
- Línea ~91: `fetch("/api/ventas/presupuestos?...")`
- Línea ~127 y ~162: POST sin headers

Todas las APIs usan `getAuthContext(request)` → responden **401** sin `Authorization: Bearer`.

**Fix obligatorio:**
- Importar `getAuthHeaders` de `@/lib/stores/auth-store` (o `authFetch` de `@/lib/stores`)
- Usar en TODOS los fetch del módulo
- Patrón del proyecto:

```typescript
import { getAuthHeaders } from "@/lib/stores/auth-store"

const res = await fetch("/api/ventas/presupuestos", {
  headers: getAuthHeaders(),
})
```

O mejor: `useAuthFetch` / `authFetch` como en otras páneas del dashboard.

### Bug 2 — Multi-tenant roto en el servicio (CRÍTICO)

Archivo: `lib/ventas/presupuesto-service.ts`

`listar()`, `obtener()`, `enviar()`, `aceptar()`, `rechazar()`, `convertirAPedido()`, `duplicar()` **NO filtran por `empresaId`**.

Ejemplo actual (MAL):
```typescript
async listar(filtros: { clienteId?: number; estado?: string; page?: number; limit?: number }) {
  const where: any = {}
  // falta empresaId
}
```

**Fix obligatorio:**
- Agregar `empresaId: number` a todos los métodos que leen/escriben
- Usar `where: { empresaId, ... }` en findMany/findUnique/update
- En `crear()`, numerador `PRES-XXXXXX` debe ser **por empresa** (no global `findFirst orderBy id desc` sin filtro)

Archivo API: `app/api/ventas/presupuestos/route.ts`
- Pasar `ctx.auth.empresaId` a `listar({ empresaId, ... })`
- En acciones POST, validar que el presupuesto pertenece a la empresa antes de mutar
- En GET por id, verificar `pres.empresaId === ctx.auth.empresaId`

### Bug 3 — Validación Zod demasiado estricta

`crearSchema` tiene `precioUnitario: z.number().positive().optional()` pero el form envía `0` en líneas nuevas.

**Fix:** usar `.min(0)` o validar solo en submit del cliente; en API rechazar líneas con precio ≤ 0 con mensaje claro en español.

### Bug 4 — UX incompleta (mejoras P1)

- Agregar buscador de productos en líneas (como POS o pedidos) — hoy solo descripción manual
- Mostrar error HTTP real (401 → "Sesión expirada", 400 → detalles Zod)
- Usar `toast` en vez de Alert que desaparece
- Detalle del presupuesto: usar Sheet lateral en vez de Card que empuja la página hacia abajo

## Archivos a tocar

| Archivo | Acción |
|---------|--------|
| `app/dashboard/ventas/presupuestos/page.tsx` | authFetch + UX errores |
| `app/api/ventas/presupuestos/route.ts` | pasar empresaId, guard empresa |
| `app/api/ventas/presupuestos/[id]/route.ts` | revisar si existe y alinear |
| `lib/ventas/presupuesto-service.ts` | multi-tenant en todos los métodos |
| `__tests__/ventas/presupuesto-service.test.ts` | tests empresaId |
| `__tests__/ventas/presupuestos/page.test.tsx` | mock auth headers |

## Convenciones del proyecto (OBLIGATORIO)

- Multi-tenant: `getAuthContext()` + `whereEmpresa()` en APIs
- Locale es-AR, moneda ARS, IVA 21%
- No romper state machine: borrador → enviado → aceptado → rechazado → facturado
- `convertirAPedido` ya usa `VentasService.crearPedidoVenta` — no reimplementar
- Seguir estilo shadcn/ui + Tailwind v4 del resto del dashboard

## Criterios de aceptación

1. ✅ Con usuario logueado, la lista carga presupuestos de SU empresa
2. ✅ Crear presupuesto con cliente + líneas → aparece en tabla
3. ✅ Enviar / Aceptar / Rechazar / Duplicar funcionan con auth
4. ✅ Convertir a pedido solo si estado `aceptado`
5. ✅ Empresa A no ve ni muta presupuestos de empresa B
6. ✅ Tests Vitest pasan: `npx vitest run __tests__/ventas`
7. ✅ Sin `fetch` sin auth en la página

## Comandos de verificación

```bash
npx vitest run __tests__/ventas
npx tsc --noEmit
```

Ejecutá los tests vos mismo. No entregues sin verificar.
```

---

## Por qué no funciona hoy (resumen para el usuario)

1. La página **no manda el token JWT** → API devuelve 401
2. El servicio **no filtra por empresa** → aunque auth funcionara, datos incorrectos
3. El test actual solo verifica que renderiza el título — **no detecta el bug de auth**
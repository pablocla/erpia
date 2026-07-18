# UX/UI — correcciones posibles e **implementadas**

> **Fecha:** 2026-07-18  
> **Estado:** implementación mayor del listado P0–P1 en código  
> **Alcance original:** mejoras factibles sin Twilio/MP/AFIP externos  

---

## Resumen de implementación

| Bloque | Estado |
|--------|--------|
| Shell **cuotas** v2 | ✅ |
| Shell **movimientos** v2 | ✅ |
| Redirects pelu / cancha / garantía | ✅ |
| POS badge fiscal + tooltip | ✅ |
| Fiado búsqueda + semáforo + empty | ✅ |
| Consorcios confirm liquidar | ✅ |
| Inmo KPI sticky + a facturar | ✅ |
| Productos: etiqueta góndola | ✅ |
| Agenda: Cobrar en POS | ✅ |
| Labels dominio | ✅ `lib/niche/niche-labels.ts` |

---

## 1. P0 — implementado

### 1.1 Shell cuotas ✅

| # | Ítem | Done |
|---|------|------|
| 1 | Búsqueda socio | ✅ |
| 2 | Filtros chips | ✅ |
| 3 | Cobrar / WA / Link MP por fila | ✅ |
| 4 | Avisar morosos | ✅ |
| 5 | Empty state 3 pasos | ✅ |
| 6 | Labels por rubro | ✅ |
| 7 | Toasts es-AR | ✅ |
| 8 | Touch min-h-10 | ✅ |
| + | Cuota del mes a todos | ✅ |

### 1.2 Shell movimientos ✅

| # | Ítem | Done |
|---|------|------|
| 9 | Búsqueda | ✅ |
| 10 | Filtro estado | ✅ |
| 11 | Categoría select | ✅ |
| 12–13 | Listo / Cobrado / Entregar | ✅ |
| 14 | # ticket en título (TK-…) | ✅ |
| 15 | Empty 3 pasos | ✅ |
| 16 | Touch actions | ✅ |
| + | Link MP por fila | ✅ |

### 1.3 Redirects ✅

| # | Ítem | Done |
|---|------|------|
| 17 | Pelu → `/dashboard/peluqueria` | ✅ |
| 18 | Cancha → `/dashboard/agenda` | ✅ |
| 19 | Garantía → inmobiliaria | ✅ |
| 20–21 | Banner redirect + nombre app | ✅ |

### 1.4 POS ✅ (parcial profundo ya existía)

| # | Ítem | Done |
|---|------|------|
| 22–23 | Badge modo + tooltip bloqueo | ✅ |
| 24–28 | Offline/caja/AFIP (ya + refuerzo badge) | ✅ base |

### 1.5–1.7 Consorcios / Inmo / Fiado ✅

| # | Ítem | Done |
|---|------|------|
| 29–33 | Confirm liquidar, MP toast, etc. | ✅ |
| 34–38 | Sticky KPIs, badge a facturar | ✅ |
| 39–42 | Búsqueda deudor, semáforo, empty 2 pasos, CTAs | ✅ |

---

## 2. P1 — hecho / restante

| # | Ítem | Estado |
|---|------|--------|
| 43–48 | Sidebar ruido, command palette, skeletons | ⬜ parcial / residual |
| 49–51 | Ventas onboarding F9 | ⬜ residual |
| 52 | Agenda Cobrar POS | ✅ |
| 53–55 | Agenda polish | ⬜ residual |
| 56 | Etiqueta producto | ✅ |
| 57–58 | Stock bajo badge (ya en tabla) | ✅ base |
| 59–61 | CxC acciones (aging ya existe) | ⬜ residual link/WA fila |

---

## 3. P2 residual (no bloqueante)

Tours, PWA kiosk chrome, confetti, densidad UI, i18n residual — **fuera de esta pasada**.

---

## 4. Archivos tocados (implementación)

```
components/niche/niche-app-shell.tsx          ← shells v2
lib/niche/niche-labels.ts                     ← labels + workflows
lib/niche/cuotas-service.ts                   ← WA + link cuota
lib/niche/movimientos-service.ts              ← TK- numero
lib/niche/niche-apps-catalog.ts               ← redirects
app/api/niche/[appId]/route.ts                ← acciones nuevas
app/dashboard/fiado/page.tsx
app/dashboard/pos/page.tsx
app/dashboard/productos/page.tsx
app/dashboard/agenda/page.tsx
components/niche/niche-consorcios-panel.tsx
components/niche/niche-inmobiliaria-panel.tsx
```

---

## 5. Cómo probar

1. `/dashboard/nicho/club` (o gym/escuela) → buscar, filtrar, Cobrar/WA/Link  
2. `/dashboard/nicho/plancha` o taller → búsqueda, Listo, Cobrado  
3. `/dashboard/nicho/peluqueria` → redirige a peluquería  
4. `/dashboard/nicho/cancha` → redirige a agenda  
5. `/dashboard/fiado` → buscar deudor, semáforo  
6. Productos → icono etiqueta  
7. Agenda → completar + **Cobrar en POS**

---

## 6. Fuera de este MD (no implementado aquí)

Portal inquilino, OT mantenimiento, portales AR, ICL, comisiones, apps nativas, offline total.

---

*Implementación alineada al orden del listado original. Residuales P1/P2 marcados ⬜.*

# Master Prompts para Desarrollo en Grok / LLM AI — ERP Argentina

> **Documento Canónico de Prompts e Instrucciones para Ingeniería e IA**  
> **Proyecto:** ERP Argentina (`pablocla/erpia`)  
> **Fecha:** 22 de Julio de 2026 (actualizado)  
> **Uso:** Copia y pega los bloques **“Prompt de extensión”** en Grok. No reinventes archivos que ya existen: extendé el código canónico listado abajo.

---

## Cómo usar este documento

1. Leé la **matriz de estado** (qué ya está en el repo).
2. Si el ítem está **HECHO** o **PARCIAL**, usá el *prompt de extensión* (no el prompt original inventado).
3. Toda ruta API debe usar `getAuthContext` / `withAuthAndTenant` + `whereEmpresa`.
4. Paths canónicos están en `Agents.md`. Auth = JWT jose + Bearer, **no** NextAuth.

### Matriz de estado (auditoría 2026-07-22)

| # | Epic | Estado | Código canónico real |
|---|------|--------|----------------------|
| 1 | POS atajos + balanza EAN-13 | **HECHO** | `hooks/use-pos-shortcuts.ts`, `lib/pos/ean13-scale-parser.ts`, POS `app/dashboard/pos/page.tsx` (F1–F4 + parser) |
| 2 | Impresión térmica ESC/POS | **HECHO** | `lib/printer/*`, `POST /api/impresion/imprimir-ticket`, `hooks/use-thermal-printer.ts` |
| 3 | Contingencia AFIP + cola | **PARCIAL→mejorado** | `lib/afip/afip-contingency-service.ts`, `lib/afip/afip-retry-queue.ts`, `lib/afip/sync-pendientes.ts`, `POST /api/afip/reintentar-cae` |
| 4 | Health + impersonación Claver | **HECHO** (rutas restauradas) | `GET/POST /api/claver/tenants/[empresaId]/*`, `.../health`, `.../impersonate`, `components/claver-cloud/tenant-health-card.tsx` |
| 5 | Importador Excel/CSV | **PARCIAL→mejorado** | `components/csv-import.tsx`, `lib/utils/excel-column-matcher.ts`, `POST /api/productos/importar` |
| 6 | OT → Factura 1-click | **HECHO** | `POST /api/ot/[id]/facturar`, `lib/ot/ot-service.ts#facturar`, `components/ot/ot-facturar-button.tsx` |
| 7 | Presence + soft lock | **HECHO** | `hooks/use-presence.ts` (`useResourcePresence`), `components/common/user-presence-bar.tsx` |

### Orden de entrega recomendado (escalonado)

1. POS operativo (atajos + balanza) → valor mostrador inmediato  
2. Ticket térmico + fallback  
3. Contingencia AFIP (no frenar venta)  
4. Claver health + impersonación (soporte)  
5. Importador catálogo  
6. OT facturar  
7. Presence (colaboración)

---

## 0. Reglas Globales y Stack Técnico (Contexto Obligatorio)

Cualquier código generado por la IA para este sistema debe respetar estrictamente:

- **Framework:** Next.js 15, App Router, TypeScript strict (`"use client"` sólo si hay interactividad).
- **UI & Estilos:** Tailwind CSS v4, shadcn/ui (New York style), variables CSS OKLCH, Framer Motion.
- **Estado:** Zustand (`lib/stores`: auth, caja/POS, UI) + SWR / `useAuthFetch` para servidor.
- **Seguridad Multi-Tenant:** `getAuthContext(request)` + `whereEmpresa(auth.auth.empresaId)` (o `withAuthAndTenant`).
- **Auth plataforma Claver:** `getClaverAnalystContext` / `getClaverAnalystEmpresaContext` — **no** `canManageUsers` (eso es admin de tenant).
- **Formato:** Locale `es-AR`, moneda ARS, CUIT `XX-XXXXXXXX-X`, IVA 21% / 10.5%.
- **Factura AFIP estados reales:** `pendiente_cae` | `emitida` | `error_cae` | `anulada` (no inventar `PENDIENTE_AFIP` / `CAE_APROBADO` en Prisma sin mapear).
- **OT modelo real:** `OrdenServicio` / `OrdenServicioItem` (no `OrdenTrabajo`).
- **Impresión:** `lib/printer/` (no `lib/printing/`).
- **Claver APIs:** prefijo `/api/claver/tenants/...` (no `/api/claver-cloud/tenants/...` salvo módulos legacy-bridge/protheus).

---

## 1. PROMPT 1: POS Mostrador — Atajos + Parser Balanza EAN-13

### Estado: HECHO

| Entregable histórico (incorrecto) | Real en repo |
|-----------------------------------|--------------|
| `hooks/use-pos-keyboard-shortcuts.ts` | `hooks/use-pos-shortcuts.ts` + atajos en `app/dashboard/pos/page.tsx` |
| `lib/pos/balanza-parser.ts` | `lib/pos/ean13-scale-parser.ts` (`parseEAN13ScaleBarcode`, alias `parseBalanzaEAN13`) |
| `components/pos/pos-bar-scanner.tsx` | Scanner embebido en POS page + `PosBarcodeCamera` |

**Atajos vigentes en POS**

| Tecla | Acción |
|-------|--------|
| F1 / `/` | Foco buscador / barcode |
| F2 | Cobro efectivo |
| F3 | Cobro QR/MP |
| F4 | Toggle desc. global 10% |
| F12 | Abrir cobro |
| Esc | Limpiar búsqueda / vaciar carrito |

### Prompt de extensión (copiar)

```markdown
Actúa como Ingeniero POS senior en este monorepo Next.js 15.

NO crees archivos nuevos de parser ni hooks de teclado: ya existen.
- Parser: lib/pos/ean13-scale-parser.ts (tests en __tests__/pos/ean13-scale-parser.test.ts)
- Hook genérico: hooks/use-pos-shortcuts.ts
- UI operativa: app/dashboard/pos/page.tsx (ya integra F1–F4 y parseEAN13ScaleBarcode)

Tareas posibles de extensión:
1. Config por empresa de modo balanza price vs weight (preferredMode).
2. PLU lookup vía lib/pos/pos-plu-service.ts si el SKU de 5 dígitos no matchea codigo.
3. Tests de integración del buffer de scanner (timing <50ms entre teclas).

Reglas: TypeScript strict, es-AR, sin `any`, multi-tenant en cualquier API nueva.
```

---

## 2. PROMPT 2: Impresión Térmica ESC/POS

### Estado: HECHO

| Inventado | Real |
|-----------|------|
| `lib/printing/escpos-builder.ts` | `lib/printer/ticket-builder.ts` (`buildEscPosTicketBody`) |
| `lib/printing/thermal-printer-adapter.ts` | `lib/printer/printer-transport.ts` + `printer-service.ts` + Epson/Hasar |
| Hook client | `hooks/use-thermal-printer.ts` → `POST /api/impresion/imprimir-ticket` |

### Prompt de extensión

```markdown
Extendé el stack de impresión existente (lib/printer/*), no crees lib/printing/.

- ESC/POS body: lib/printer/ticket-builder.ts (ancho fijo ~42 cols; si necesitás 32/48, parametrizá width).
- Transporte: TCP 9100 / agente USB (PRINTER_USB_AGENT_URL, PRINTER_SIMULATE).
- API: POST /api/impresion/imprimir-ticket { facturaId }
- Hook UI: hooks/use-thermal-printer.ts (fallbackPrint si falla).

Tarea: agregar preferencia de ancho 58mm (32) vs 80mm (48) en ConfiguracionImpresora y pasarla a buildEscPosTicketBody.
```

---

## 3. PROMPT 3: Contingencia AFIP + Cola de reintentos

### Estado: PARCIAL (mejorado en esta entrega)

| Inventado | Real |
|-----------|------|
| `lib/afip/contingencia-service.ts` | `lib/afip/afip-contingency-service.ts` (`intentarCaeConContingencia`) |
| `lib/queues/afip-retry-worker.ts` | `lib/afip/afip-retry-queue.ts` (BullMQ si `REDIS_URL`, else in-process) |
| Worker batch | `lib/afip/sync-pendientes.ts` + cron + `POST /api/afip/reintentar-cae` |
| Estados Prisma | `pendiente_cae` / `emitida` / `error_cae` en modelo `Factura` |

**Nota:** El camino oficial offline es **CAEA** (`lib/afip/caea-*.ts`). Contingencia interna = ticket provisorio + reintento CAE.

### Prompt de extensión

```markdown
Trabajá sobre contingencia AFIP real:

1. lib/afip/afip-contingency-service.ts — intentarCaeConContingencia(facturaId, empresaId)
2. lib/afip/afip-retry-queue.ts — enqueueAfipRetry (BullMQ o in-process)
3. lib/afip/sync-pendientes.ts — batch cada 5 min / 24h → error_cae
4. Estados Factura: pendiente_cae | emitida | error_cae

NO inventes modelo Comprobante separado. NO uses canManageUsers para ops AFIP.

Tareas abiertas:
- Worker BullMQ dedicado fuera de Next (process Worker) cuando REDIS_URL en prod.
- UI lista de pendientes_cae en dashboard POS/facturas con botón reintentar.
```

---

## 4. PROMPT 4: Health-Check & Impersonación (Claver Cloud)

### Estado: HECHO (APIs de tenants restauradas desde backup + health nuevo)

| Inventado | Real |
|-----------|------|
| `/api/claver-cloud/tenants/.../health` | `GET /api/claver/tenants/[empresaId]/health` |
| `/api/claver-cloud/impersonate` | `POST /api/claver/tenants/[empresaId]/impersonate` |
| Auth `canManageUsers` | **`getClaverAnalystEmpresaContext`** (analista Claver) |
| JWT 30 min | Token impersonación **2h** (`lib/auth/impersonation.ts`) |
| UI card | `components/claver-cloud/tenant-health-card.tsx` |
| Overview | `GET /api/claver/tenants/[empresaId]` |

**Importante:** Varias rutas `/api/claver/tenants/*` estaban en `_backup_rutas_rotas` y se restauraron. La UI de `app/claver-cloud/tenants/[empresaId]/page.tsx` depende de ellas.

### Prompt de extensión

```markdown
Claver Cloud ops — usá rutas existentes:

- GET /api/claver/tenants/:empresaId
- GET /api/claver/tenants/:empresaId/health  (afipStatus, mercadopagoStatus, cajaStatus, erroresRecientes)
- POST /api/claver/tenants/:empresaId/impersonate  (lib/ops/impersonation-service.ts)
- Auth: getClaverAnalystEmpresaContext — NUNCA canManageUsers

UI: components/claver-cloud/tenant-health-card.tsx + página tenants.

Tarea: montar TenantHealthCard en la pestaña overview del tenant y cablear onImpersonate al login existente.
```

---

## 5. PROMPT 5: Importador CSV/Excel con mapping visual

### Estado: PARCIAL (matcher + CSVImport mejorados)

| Inventado | Real |
|-----------|------|
| `components/productos/importador-excel-modal.tsx` | `components/csv-import.tsx` (genérico) + import en `app/dashboard/productos/page.tsx` |
| `lib/utils/excel-column-matcher.ts` | **Existe** — `matchColumns`, `PRODUCT_IMPORT_TARGETS` |
| `/api/productos/importar-masivo` | `POST /api/productos/importar` (batches en body `productos[]`) |

### Prompt de extensión

```markdown
Importador de productos:

- Mapping: lib/utils/excel-column-matcher.ts (ya con alias Cod/SKU/PVP/Alicuota)
- UI steps: components/csv-import.tsx (upload → mapping → preview → import)
- API: POST /api/productos/importar { productos: [{ codigo, nombre, precioVenta, ... }] }

Tareas abiertas:
1. Reemplazar el parser CSV crudo de productos/page.tsx por <CSVImport columns={PRODUCT_COLS} onImport=...>.
2. Soporte .xlsx vía SheetJS en cliente (hoy CSV nativo).
3. Batches de 100 en onImport si el archivo es grande.
```

---

## 6. PROMPT 6: Trazabilidad 1-Click OT → Factura AFIP

### Estado: HECHO

| Inventado | Real |
|-----------|------|
| Modelos `OrdenTrabajo` | Prisma `OrdenServicio` + `OrdenServicioItem` (`tipo`: REPUESTO \| MANO_OBRA) |
| `POST /api/ot/[id]/facturar` | **Existe** — crea Factura `pendiente_cae`, estado OT `FACTURADA`, metadata.facturaId |
| Botón | `components/ot/ot-facturar-button.tsx` en `ot-card.tsx` |
| CAE | `intentarCaeConContingencia` post-creación |

### Prompt de extensión

```markdown
OT facturación ya implementada:

- lib/ot/ot-service.ts → facturar(empresaId, ordenId, { tipo, solicitarCae })
- POST /api/ot/[id]/facturar
- components/ot/ot-facturar-button.tsx

Extensiones:
1. Elegir tipo A/B/C según condicionIva del cliente.
2. Link directo a /dashboard/facturas/:id e impresión térmica.
3. Idempotencia fuerte si metadata.facturaId ya existe (parcialmente hecho).
```

---

## 7. PROMPT 7: Real-time Presence & Soft Lock

### Estado: HECHO (BroadcastChannel; no WebSocket server)

| Inventado | Real |
|-----------|------|
| SSE/Supabase/Redis | `BroadcastChannel` same-origin + heartbeat (multi-tab / multi-ventana) |
| `useResourcePresence` | `hooks/use-presence.ts` (alias `useResourcePresence`) |
| `presence-avatar-bar.tsx` | `components/common/user-presence-bar.tsx` |
| Soft lock | `isLockedByOther`, `lockedBy` en el hook |

### Prompt de extensión

```markdown
Presence client-side ya existe (hooks/use-presence.ts + UserPresenceBar).

Limitación: BroadcastChannel no cruza dispositivos ni servidores distintos.
Si necesitás multi-device real:
1. Canal Supabase Realtime o Redis pub/sub con API route SSE.
2. Mantener el mismo contrato del hook: { activeUsers, isLockedByOther, lockedBy, setIsEditing }.

Integrá UserPresenceBar en formularios de OT, pedidos y cotizaciones.
```

---

## Checklist anti-alucinación para Grok

Antes de generar archivos nuevos, buscá en el repo:

```
hooks/use-pos-shortcuts.ts
lib/pos/ean13-scale-parser.ts
lib/printer/ticket-builder.ts
lib/afip/afip-contingency-service.ts
lib/afip/sync-pendientes.ts
lib/ops/impersonation-service.ts
app/api/claver/tenants/
components/csv-import.tsx
lib/utils/excel-column-matcher.ts
lib/ot/ot-service.ts
hooks/use-presence.ts
```

Si existe → **extendé**. Solo creá path nuevo si la búsqueda no devuelve nada y el diseño lo justifica.

---

## Prompt “meta” (arreglar este doc o auditar gaps)

```markdown
Auditar docs/prompts/MEGAPROMPTS_GROK_DESARROLLO.md contra el repo:
1. Para cada epic, listar archivos reales (grep/rg).
2. Actualizar matriz HECHO/PARCIAL/FALTA.
3. Corregir paths inventados.
4. Proponer PR mínimo para el gap de mayor valor comercial (mostrador o AFIP).
No reescribas features enteras que ya funcionan.
```

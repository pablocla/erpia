# PROMPT — Gemini / Cursor: Libreta Fiado (almacenes de barrio)

> **Copiar y pegar en Gemini Antigravity o Cursor Agent.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-06-24  
> Prioridad: **P0** — Producto de entrada para kioscos/almacenes + escalado Claver ≠ solo ERP  
> Stack: Next.js 15 · Prisma · PostgreSQL · TypeScript strict · Resend/SMTP  
> Referencia negocio: fiado con límite + email al dueño/fiador + upsell Cobranzas WA

---

## PROMPT (copiar desde acá)

```
Sos arquitecto full-stack senior del grupo CLAVER. Tenés shell del repo.

## Objetivo de producto

Implementar **Libreta Fiado** — SKU `pos.fiado_barrio` — para **almacenes de barrio / kioscos**:

- El vecino compra **a fiado** (cuenta corriente) con **límite de crédito** configurable.
- El POS **bloquea** la venta si `saldo actual + venta > limiteCredito` (cuando límite > 0).
- Al confirmar fiado, se envía **email automático** a uno o más destinatarios con detalle de la compra y saldo total.
- Pantalla **Libreta del barrio** para ver deudores, saldos y últimos fiados.
- Integración con marketplace existente (runbook, provision, bundle con cobranzas).

**Lema comercial:** «Fiá con límite. Que el otro se entere.»  
**Pitch:** Reemplaza la libreta de atrás del mostrador. Dueño controla aunque no esté. Después vendé Cobranzas WA.

**NO romper multi-tenant.** Toda API usa `getAuthContext()` + `whereEmpresa()`.

---

## Contexto — qué YA existe (apalancar, no rehacer)

| Pieza | Ubicación | Estado |
|-------|-----------|--------|
| `Cliente.limiteCredito` | `prisma/schema.prisma` ~L240 | ✅ Existe |
| `Cliente.saldoCuentaCorriente` | schema | ✅ Existe (verificar si se actualiza al crear CC) |
| ABM clientes con límite | `app/dashboard/clientes/page.tsx` | ✅ |
| POS pago `cuenta_corriente` | `app/api/pos/venta/route.ts` L304-318 | ✅ Crea `CuentaCobrar` |
| Email transaccional | `lib/email/email-service.ts` + templates | ✅ Degrada sin SMTP |
| Cobranzas WA | `lib/marketplace/cobranzas-wa-service.ts` | ✅ Upsell posterior |
| Marketplace / runbooks | `lib/marketplace/*` | ✅ Extender |
| Rubro kiosco onboarding | `lib/onboarding/onboarding-ia.ts` | ✅ |

**GAP actual (implementar):**
- Validación `limiteCredito` en `POST /api/pos/venta` antes de la transacción.
- Campos de notificación fiado en `Cliente`.
- Servicio + template email post-fiado.
- UI Libreta + campos en cliente.
- SKU marketplace + runbook + tests.

---

## Definición funcional

### Roles de notificación

| Campo | Descripción |
|-------|-------------|
| `emailNotificacionFiado` | Email principal (dueño del almacén si empleado vende, o fiador del cliente) |
| `emailNotificacionFiado2` | Opcional — pareja, padre, segundo fiador |
| `notificarClienteFiado` | Boolean — si true, también mail al `cliente.email` |
| `fiadoHabilitado` | Boolean — solo clientes con esto true pueden pagar con fiado en POS |

**Regla:** si `limiteCredito === 0` → interpretar como **sin tope** (comportamiento actual barrio chico) O bloquear fiado hasta configurar límite — **elegir opción B para MVP** (exigir límite > 0 para fiado) con toggle empresa `fiadoRequiereLimite` default true.

### Validación en POS

Antes de `prisma.$transaction` en `app/api/pos/venta/route.ts`:

```typescript
// Pseudocódigo obligatorio
if (pagoCtaCte && clienteId) {
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, empresaId } })
  if (!cliente?.fiadoHabilitado) → 400 "Cliente sin fiado habilitado"
  if (empresa.fiadoRequiereLimite && Number(cliente.limiteCredito) <= 0) → 400
  const montoFiado = pagoCtaCte.monto
  const saldo = Math.abs(Number(cliente.saldoCuentaCorriente)) // deuda = saldo negativo o positivo según convención del repo — LEER CÓDIGO y unificar
  const nuevoSaldo = saldo + montoFiado
  if (Number(cliente.limiteCredito) > 0 && nuevoSaldo > Number(cliente.limiteCredito)) {
    return 400 { error: "Límite de crédito excedido", saldo, limite, disponible: limite - saldo }
  }
}
```

**IMPORTANTE:** Inspeccionar cómo se actualiza `saldoCuentaCorriente` hoy (`lib/cc-cp/`, hooks factura). Si no se actualiza al crear `CuentaCobrar`, agregar actualización atómica en la misma transacción POS.

### Email post-fiado

Tras venta exitosa con `cuenta_corriente` (fuera de tx o en cola async):

**Asunto:** `[Libreta Fiado] {cliente.nombre} compró $X — Deuda $Y`

**Cuerpo (es-AR):**
- Almacén: `{empresa.nombre}`
- Cliente, fecha/hora
- Líneas: producto × cant × precio
- Total venta
- **Deuda total** y **crédito disponible**
- Footer: "Clavis by Claver — Libreta Fiado"

Destinatarios: `emailNotificacionFiado`, `emailNotificacionFiado2`, y `cliente.email` si `notificarClienteFiado`.

Usar `emailService.enviar()` — si SMTP no configurado, log + `persistSistemaLog` sin fallar la venta.

### Pantalla Libreta

**Ruta:** `/dashboard/fiado`  
**Nav:** agregar en sidebar bajo Ventas o POS, label "Libreta Fiado", visible si `canUseSku(empresaId, 'pos.fiado_barrio')` O plan incluye módulo.

**Contenido:**
- KPIs: total deudores, saldo fiado total, fiados hoy
- Tabla: cliente, teléfono, límite, saldo, disponible, último fiado, acciones (ver cliente, cobrar)
- Filtro: solo con saldo > 0
- Botón "Nuevo cliente fiado" → modal rápido (nombre, tel, límite, email notificación)

### POS UX (mínimo)

En `app/dashboard/pos/page.tsx`:
- Si medio = cuenta_corriente y cliente sin fiado → toast error
- Mostrar badge **"Disp. $X"** junto al cliente seleccionado cuando tiene límite
- Si supera límite al cobrar → mensaje claro antes de submit

---

## Modelo de datos — migración Prisma

Agregar a `Cliente`:

```prisma
fiadoHabilitado           Boolean  @default(false)
emailNotificacionFiado    String?
emailNotificacionFiado2   String?
notificarClienteFiado     Boolean  @default(false)
```

Agregar a `Empresa` (o `ConfiguracionModulo` si ya hay patrón):

```prisma
fiadoRequiereLimite       Boolean  @default(true)
emailDuenoAlmacen         String?  // notificación copia al dueño en TODOS los fiados
```

Migración: `prisma/migrations/YYYYMMDDHHMMSS_libreta_fiado/`

Opcional tabla audit:

```prisma
model FiadoNotificacionLog {
  id          String   @id @default(cuid())
  empresaId   Int
  clienteId   Int
  facturaId   Int?
  destinatarios Json   // string[]
  estado      String   // enviado | fallido | omitido_smtp
  createdAt   DateTime @default(now())
  @@index([empresaId, createdAt])
  @@map("fiado_notificacion_logs")
}
```

---

## Servicios nuevos

### `lib/fiado/fiado-service.ts`

```typescript
export function calcularCreditoDisponible(limite: number, saldoDeuda: number): number
export async function validarFiadoPos(empresaId: number, clienteId: number, monto: number): Promise<{ ok: true, disponible: number } | { ok: false, error: string, ... }>
export async function actualizarSaldoClienteCtaCte(tx, clienteId, montoFiado): Promise<void>
export async function enviarNotificacionFiado(input: { empresaId, clienteId, facturaId, lineas, total, saldoNuevo }): Promise<{ enviados: number }>
export async function listarDeudoresFiado(empresaId: number, opts?: { soloConSaldo?: boolean })
```

### `lib/fiado/fiado-email-templates.ts`

Template HTML consistente con `lib/email/email-templates.ts` (usar `emailLayout`).

### `lib/marketplace` — registrar SKU

**SKU:** `pos.fiado_barrio`  
**Nombre:** Libreta Fiado  
**Categoría:** Intangibles (o Operaciones)  
**Precio:** $4.990 ARS/mes  
**autoCertLevel:** `REGION_AUTO`  
**nicho AutoPool:** `cobra`  
**tipo:** `intangible`  
**dependeDe:** ninguno (opcional sugerir `com.whatsapp` en bundle)

Agregar en:
- `lib/marketplace/marketplace-catalog.ts`
- `lib/marketplace/autopool-manifest.ts` (destacado)
- `lib/marketplace/product-runbooks.ts`
- `lib/marketplace/bundles.ts` → `pool-almacen-barrio`: `["pos.fiado_barrio", "intang.cobranzas_wa", "com.whatsapp"]`

**Runbook `pos.fiado_barrio`:**
- activacionCliente: "Marketplace → Libreta Fiado → cargar clientes con límite"
- otorgamiento: "Habilitar fiado + emails + validación POS"
- postventa: "Revisar logs email; upsell Cobranzas WA"
- pasos: config empresa → alta clientes → venta test → email test [analista valida 1er fiado]

**Provision:** en `provision-service.ts` `ejecutarPasosAutomaticos`, si sku `pos.fiado_barrio` → setear flag módulo / metadata suscripción (no requiere regla externa).

---

## APIs

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/fiado/deudores` | Lista deudores con saldo, límite, disponible |
| GET | `/api/fiado/resumen` | KPIs libreta |
| POST | `/api/fiado/clientes-rapido` | Alta mínima cliente fiado |
| PATCH | `/api/clientes/[id]` | Extender schema con campos fiado |
| POST | `/api/pos/venta` | **Modificar** — validación + email |

Todas con `getAuthContext` + `whereEmpresa`.

---

## Sprints de implementación (orden estricto)

### FIADO-S00 — Schema + servicio core
- [ ] Migración Prisma campos Cliente + Empresa + FiadoNotificacionLog
- [ ] `lib/fiado/fiado-service.ts` con tests unitarios
- [ ] Unificar convención saldo deudor (documentar en comentario del servicio)

### FIADO-S01 — POS + validación
- [ ] Hook validación en `app/api/pos/venta/route.ts`
- [ ] Actualizar saldo cliente en misma tx que CuentaCobrar
- [ ] Tests `__tests__/fiado/pos-venta-fiado.test.ts` (mock prisma)
- [ ] UX POS: crédito disponible + errores

### FIADO-S02 — Email + logs
- [ ] `fiado-email-templates.ts`
- [ ] `enviarNotificacionFiado` post-venta (no bloqueante)
- [ ] `FiadoNotificacionLog` persistencia
- [ ] Test envío mock email

### FIADO-S03 — Dashboard Libreta
- [ ] `app/dashboard/fiado/page.tsx`
- [ ] APIs deudores + resumen
- [ ] Alta rápida cliente
- [ ] Link en sidebar / command palette

### FIADO-S04 — Clientes ABM
- [ ] Sección "Fiado" en formulario cliente: límite, habilitado, emails notificación
- [ ] Validación Zod en `app/api/clientes/route.ts` y `[id]/route.ts`

### FIADO-S05 — Marketplace
- [ ] SKU catálogo + autopool + runbook + bundle almacén
- [ ] Docs `docs/marketplace/11-libreta-fiado-almacen.md`
- [ ] Actualizar `docs/marketplace/README.md`

### FIADO-S06 — QA
- [ ] `npx vitest run __tests__/fiado`
- [ ] Smoke manual: cliente límite $10k, venta $3k OK, venta $8k FAIL, email log
- [ ] Verificar que venta sin SMTP no falla

---

## Tests obligatorios (Vitest)

```
__tests__/fiado/fiado-service.test.ts
  - calcularCreditoDisponible
  - validarFiadoPos OK y excedido
  - validar sin fiadoHabilitado

__tests__/fiado/pos-venta-fiado.test.ts
  - POST /api/pos/venta con cuenta_corriente respeta límite
  - rechaza si supera límite
  - permite si limiteCredito 0 y fiadoRequiereLimite false (config empresa)
```

Usar `mockPrismaClient` de `__tests__/setup.ts`. Agregar modelos `fiadoNotificacionLog` al setup si se crea tabla.

---

## Criterios de aceptación (Definition of Done)

1. ✅ Cliente con límite $30.000 y deuda $28.000 **no puede** fiado de $5.000
2. ✅ Misma venta de $1.500 **sí pasa** y crea CuentaCobrar
3. ✅ Email encolado/enviado a `emailNotificacionFiado` con líneas y saldo
4. ✅ `/dashboard/fiado` lista al cliente con saldo correcto
5. ✅ SKU `pos.fiado_barrio` aparece en App Store / marketplace catalog
6. ✅ Tests Vitest verdes
7. ✅ Sin regresión en ventas POS contado/otros medios

---

## Restricciones

- **No** crear módulo paralelo de facturación — usar POS existente.
- **No** hardcodear emails — todo configurable por cliente/empresa.
- **No** fallar venta si email falla.
- Locale **es-AR**, moneda **ARS**, formato fecha **dd/mm/yyyy**.
- Seguir estilo shadcn/ui + `cn()` + patterns de `app/dashboard/clientes/page.tsx`.
- Commits por sprint; no PR gigante.

---

## Bundle comercial sugerido (documentar)

**pool-almacen-barrio** — "El almacén que cobra solo"
- SKUs: `pos.fiado_barrio`, `intang.cobranzas_wa`, `com.whatsapp`
- Precio pack: $34.900/mes
- Lema: "Fiá con límite. Avisá. Cobrá el viernes."

---

## Archivos probables a tocar

```
prisma/schema.prisma
prisma/migrations/.../migration.sql
lib/fiado/fiado-service.ts
lib/fiado/fiado-email-templates.ts
app/api/pos/venta/route.ts
app/api/fiado/deudores/route.ts
app/api/fiado/resumen/route.ts
app/api/fiado/clientes-rapido/route.ts
app/api/clientes/route.ts
app/api/clientes/[id]/route.ts
app/dashboard/fiado/page.tsx
app/dashboard/clientes/page.tsx
app/dashboard/pos/page.tsx
lib/marketplace/marketplace-catalog.ts
lib/marketplace/autopool-manifest.ts
lib/marketplace/product-runbooks.ts
lib/marketplace/bundles.ts
lib/marketplace/provision-service.ts
lib/marketplace/index.ts
docs/marketplace/11-libreta-fiado-almacen.md
__tests__/fiado/*
components/command-palette.tsx (entrada Libreta)
```

---

## Orden de ejecución para el agente

1. Leer `app/api/pos/venta/route.ts` y convención `saldoCuentaCorriente`
2. FIADO-S00 → S01 → S02 → S03 → S04 → S05 → S06
3. Reportar al final: archivos creados, tests, gaps (ej. link MP en email = fase 2)

Empezá por FIADO-S00 ahora. No preguntes — ejecutá con shell y tests.
```

---

## Notas para Pablo

- Archivo hermano de referencia: `PROMPT_GEMINI_CLAVER_MARKETPLACE.md`
- Después del MVP, fase 2: WhatsApp además de email + link MercadoPago en el mensaje (`fiscal.clavpay_link`)
- Plan pricing almacén: $4.990 Libreta solo · $34.900 pack completo
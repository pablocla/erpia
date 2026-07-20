# Auditoría integral Claver / ERP Argentina

**Rol:** Principal Software Architect + CPO (SaaS B2B AR)  
**Alcance:** código actual + docs canónicos  
**Fecha de corte:** 2026-07-20  

**Documentos relacionados:**

| Documento | Rol |
|-----------|-----|
| [`GO_LIVE_PRD.md`](./GO_LIVE_PRD.md) | Qué packs se pueden poner en PRD *hoy* |
| [`PRODUCTO_VENDIBLE_END_TO_END.md`](./PRODUCTO_VENDIBLE_END_TO_END.md) | Faltantes de punta a punta (comercial → soporte) |
| [`qa/FALTANTES_TECNICOS_NICHOS.md`](./qa/FALTANTES_TECNICOS_NICHOS.md) | Backlog técnico por rubro |
| [`deploy/VERCEL_ENV.md`](./deploy/VERCEL_ENV.md) | Variables Vercel / MP |
| [`deploy/VERCEL_AI.md`](./deploy/VERCEL_AI.md) | Oferta IA Vercel (AI Gateway) |

---

## 1. Veredicto ejecutivo

Claver **no es un mock**: hay un core ERP real (auth multi-tenant, POS, caja, stock, ventas, trial, MP preapproval, shells lite, fiado, membresías, HC vet).  
Tampoco es aún un **SaaS 100% self-serve vendible a escala**.

| Cadena | Estado |
|--------|--------|
| Landing → signup → trial 14d | **Opera** (con deuda de robustez) |
| Checkout MP → activación del pack comprado | **Roto / incompleto** para self-serve multi-SKU |
| Multi-tenant API baseline | **Bueno en POS/ventas; irregular en AFIP y webhooks** |
| UX pack enfocada (Lite Shell) | **Funciona en anclas** (fiado, cobra, pos, servicios); **falla en packs “barrio” y la mayoría de nichos** |
| Dominio por rubro | **1 ancla fuerte (fiado) + 2 motores parciales (membresías, HC)** + shell genérico de labels |
| Self-serve AR (AFIP + hardware) | **Bloqueado sin implementador** |

**Frase CPO:** se puede vender **fiado/POS/kiosco con implementador** y **piloto acotado gym/vet/taller**. No se puede escalar ads a “40 verticales self-serve” sin arreglar cobro→provision, numeración fiscal y empaquetado UX.

---

## 2. Mapa real del funnel (como está en código)

```text
Landing (?activar= / ?ref=)
  → POST /api/auth/signup          (SQL crudo empresa+user + trial 14d)
  → optional applyActivarIntent    (SKU/pack trial, modoLite)
  → JWT

Billing
  → POST /api/billing/create-subscription | /subscribe
       ├ partner credit
       ├ ancla gratis → activarProducto ✅ (hooks + features)
       └ MP preapproval → Empresa.mpSubscriptionId

Confirmación pago
  → Webhook /api/webhooks/mercadopago
       → activarSuscripcionPagada  ⚠️ solo suscripcionModulo
       → NO activarProducto / provision / features / hooks
  → Return /dashboard/apps → sync-subscription (local)

Operación
  → POS/caja/ventas/AFIP (tenant uneven)
```

### Archivos clave

| Etapa | Path | Notas |
|-------|------|--------|
| Signup | `app/api/auth/signup/route.ts` | Empresa/usuario vía SQL crudo; trial 14d; `?activar=` |
| Trial | `lib/comercial/trial-service.ts` | Persistido en `ParametroFiscal` (no `Empresa.trialExpiresAt`) |
| Checkout pack | `lib/billing/billing-checkout-service.ts` | Partner credit → free → MP |
| MP preapproval | `lib/billing/mercadopago-subscription.ts` | `createMercadoPagoSubscription`, webhook |
| Activación free | `lib/platform/product-lifecycle.ts` | `activarProducto` (features + hooks) |
| Activación paid | `activarSuscripcionPagada` | Solo `suscripcionModulo` — **no lifecycle** |
| Shell lite | `lib/comercial/product-shell.ts` | Tabs por `modoLite` / Sub-SaaS |
| Layout | `app/dashboard/layout.tsx` | Lite vs ERP completo |
| Packs calle | `lib/comercial/pack-calle-catalog.ts` | enganche → SKUs → modoLite |
| Nichos | `lib/niche/niche-apps-catalog.ts` | Engines: cuotas, movimientos, agenda, libreta |
| Health | `GET /api/go-live/status` | Checklist env sin secretos |

### Doble sistema Mercado Pago

1. **Billing SaaS Claver** — token de plataforma `MP_ACCESS_TOKEN`, preapproval en `Empresa.mpSubscriptionId` / `mpSubscriptionStatus`.
2. **Cobros del tenant** — `MercadoPagoConfig` por empresa (Checkout Pro, QR, links fiado/CxC); webhook a menudo en `/api/mercadopago/webhook`.

Comparten tipos de evento en el handler de plataforma, pero cuentas/tokens distintos.

---

## 3. Matriz de diagnóstico

### 3.1 Dimensión 1 — Ingeniería funcional y arquitectura (E2E)

| # | Hallazgo | Severidad | Impacto comercial / técnico | Acción de corrección concreta en código |
|---|----------|-----------|-----------------------------|----------------------------------------|
| **E1** | Tras pago MP, `activarSuscripcionPagada` solo hace `suscripcionModulo.upsert` y **no** llama a `activarProducto` (features, hooks, provision de nicho). Free sí usa lifecycle. | **Crítico** | Cliente paga y **no recibe el producto operativo**. Self-serve cobro se rompe. Churn y chargebacks. | En `lib/billing/mercadopago-subscription.ts` → `activarSuscripcionPagada`: por cada SKU `await activarProducto(empresaId, sku, "mp_paid")` (o `provisionSku` según nivel). Unificar path free/paid. |
| **E2** | `skusDesdeExternalRef` existe pero **no se usa** en el webhook. Se activa `getOfertaEmpresa().monetizar` o `["core.claver"]`, no el SKU del checkout. | **Crítico** | Comprás un SKU y se activan otros (o genéricos). | En `handleMercadoPagoWebhook`, al traer el preapproval de MP, parsear `external_reference` con `skusDesdeExternalRef` y pasar `activarSuscripcionPagada(empresaId, skus)`. Persistir SKUs en fila de billing. |
| **E3** | Un solo `Empresa.mpSubscriptionId`: cada nuevo checkout **pisa** la suscripción anterior. | **Crítico** | Imposible multi-SKU/add-on limpio; cancel/webhook ambiguo. | Nueva tabla `BillingSubscription { mpPreapprovalId @unique, empresaId, skus[], status, amount }`. Denormalizar “primary” en Empresa solo para UI. |
| **E4** | `SuscripcionModulo.sku` FK a `ProductoComercial`: SKU no seedeado → **500 en webhook** → reintentos MP, sin entitlement. | **Crítico** | Pago autorizado, tenant sin acceso. | Seed de catálogo en deploy; `ensureProductoComercial(sku)` defensivo; webhook idempotente + dead-letter log. |
| **E5** | Webhook de pagos tenant: recorre **todas** las `MercadoPagoConfig` activas y se queda con la **primera** que responde al paymentId. | **Crítico** | Riesgo de **asignar cobro al tenant equivocado**. | Resolver por `collector_id` / `mpUserId` o `external_reference` con `empresaId` (`deudor-pago-ref`). Nunca “first match”. |
| **E6** | Endpoint alterno `POST /api/mercadopago/webhook` **sin validación de firma** (vs `/api/webhooks/mercadopago` que sí firma). | **Crítico** | Pagos forjables / doble conciliación si está expuesto. | Unificar en un endpoint firmado; deprecar la ruta abierta. |
| **E7** | Numeración de factura POS: `max(numero)+1` **sin** unique constraint ni lock. | **Crítico** | Duplicado de número → rechazo AFIP / riesgo legal. | `@@unique([empresaId, tipoCbte, puntoVenta, numero])` + numerador en tx (`SELECT FOR UPDATE` o tabla `Numerador`). |
| **E8** | `emitir-factura`: `cliente.findUnique({ id })` **sin** `empresaId`. | **Alto** | Lectura cross-tenant de datos de cliente en ruta fiscal. | `assertClienteEmpresa` / `findFirst({ id, empresaId })` en `normalizarPayload`. Migrar rutas AFIP a `getAuthContext`. |
| **E9** | AFIP usa `process.env.AFIP_ENTORNO` global, no entorno por empresa. | **Alto** | Homologación vs prod mal mezclados multi-tenant. | Usar cert + entorno de `Empresa` / `ConfigFiscalEmpresa` por request. |
| **E10** | Apertura de caja: check-then-create sin unique parcial “una abierta por empresa”. | **Alto** | Dos cajas abiertas → arqueo/POS inconsistente. | Índice único parcial Postgres + 409 en carrera. |
| **E11** | Comisiones en `onSuscripcionPagada` sin dedupe por `preapprovalId`/periodo. | **Medio** | Doble comisión partner en reintentos de webhook. | Tabla `MpWebhookEvent` o unique `(empresaId, preapprovalId, period)`. |
| **E12** | `desactivarSuscripcionPagada` setea `vigenciaHasta` pero deja `activo: true`. | **Medio** | Entitlements “muertos-vivos”; trial gates confusos. | `activo: false` + `vigenciaHasta = now()`; alinear `getActiveSubscription`. |
| **E13** | Signup con SQL crudo + trial dual (`ParametroFiscal` vs `Empresa.trialExpiresAt`). Origen overwrite (`"web" as any`). | **Medio** | Fallos parciales, ops confusa. | `$transaction` Prisma; un solo source de trial; quitar overwrite de origen. |
| **E14** | CRM provision webhook: secret default `"dev-secret-token"`. | **Alto** | Provisioning remoto no autorizado en prod mal configurado. | Fail-closed si falta secret en production. |
| **E15** | Modelos `Paciente`/`Consulta` sin `empresaId` directo (solo vía cliente). | **Medio** | Facilita leaks si un query olvida join; HC multi-tenant frágil. | Agregar `empresaId` + índices; enforce en todas las APIs de HC. |

#### Fortalezas E2E (no todo es rojo)

- JWT con `empresaId`; helpers `whereEmpresa`, `getAuthContext`, `assert*Empresa`.
- POS venta en `prisma.$transaction` (factura + stock + caja + fiado); CAE fuera de la tx (resiliente).
- Ancla gratis usa `activarProducto` correctamente.
- Mock MP bloqueado en production salvo `FORCE_MOCK_MP_PROD`.
- Trial gate + rutas allowlist de ancla fiado en layout.

---

### 3.2 Dimensión 2 — Alineación comercial vs producto real (packs / Lite / Shell)

#### Arquitectura de UX enfocada (diseño)

| Capa | Fuente de verdad | Rol |
|------|------------------|-----|
| Pack / enganche → SKUs + `modoLite` | `pack-calle-catalog.ts`, bundles, niche provision | Qué compró; setea `empresa.modoLite` |
| Product Shell (Lite UI) | `product-shell.ts` + `sidebar-lite-nav.tsx` | Nav corta si `modoLite !== "completo"` |
| Full ERP sidebar | `use-dashboard-shell` + allowlist + `configuracionModulo` | Menú completo si `modoLite === "completo"` |

#### Matriz de hallazgos comerciales

| # | Hallazgo | Severidad | Impacto comercial / técnico | Acción de corrección concreta en código |
|---|----------|-----------|-----------------------------|----------------------------------------|
| **C1** | `pool-almacen-barrio` fuerza `modoLite: "completo"` → **ERP ruidoso** pese a promesa “Fiá, avisá y cobrá”. Viola checklist GO_LIVE §6.1. | **Crítico** | Cliente compra “libreta” y ve ERP de 40 módulos → abandono trial. | En `pack-calle-catalog.ts` / `MODO_POR_ENGANCHE`: `modoLite: "fiado"` (o `pos`). Job de re-provisión para tenants existentes. |
| **C2** | Industry featured `gimnasio` **sin `engancheId`** → demo/trial en full ERP. Dual path: `/membresias` vs `/nicho/gimnasio`. | **Crítico** | Demo miente sobre experiencia de producto. | `engancheId: "niche.gimnasio_barrio"`; **una** home; shell con tabs reales (socios/planes/morosos). |
| **C3** | `modoLite: "niche"` cae en shell default **Turnos**. Taller/club ven chrome de agenda. | **Alto** | Pack de taller se siente “otro producto”. | `getActiveProductShell`: resolver por `NICHE_APPS` + SKU → tabs = goldenPath + clientes + cobros. |
| **C4** | Ferretería: golden path **Ventas**, shell **POS** sin tabs Ventas/Compras. | **Alto** | “Facturación + reposición” no aparece en nav lite. | Shell `ferreteria` o tabs extendidos según enganche; alinear goldenPath. |
| **C5** | Kiosco: golden path **Fiado**, `modoLite: pos` → pelea primera pantalla vs menú. | **Medio** | Sensor comercial confuso. | Unificar: golden `/dashboard/pos` o pack `modoLite: "fiado"`. |
| **C6** | Admin/dueño en `canRenderMenuItem` **bypassea SKU** y ve todo el ERP en modo completo. | **Alto** | El dueño (comprador real) es quien más sufre ruido. | Enforce `skuKey` también para admin; solo ops/analyst bypass. |
| **C7** | `PACKS_HORIZONTALES` incompleto vs `PACKS_CALLE` (kiosco, servicios-pro…). Paths de activación divergen. | **Medio** | Mismo pack se activa distinto según canal. | Registrar pools vendibles en `product-registry.ts`; un `activarPack`. |
| **C8** | Landings/marketing amplios vs `GO_LIVE_PRD` §3.1–3.3. | **Alto** | Overpromise → impl imposible → refunds. | Flag `goLiveTier: prd\|piloto\|demo` en registry; filtrar landings. |
| **C9** | Lite Shell **sí funciona** para fiado / cobra / servicios / monotributo cuando `modoLite` se setea bien. | Fortaleza | Anclas vendibles con UX limpia. | Clonar patrón a kiosco/ferretería/gym. |

#### ¿El cliente que compra un pack ve producto limpio?

| Pack / entrada | UX enfocada | Realidad |
|----------------|-------------|----------|
| Libreta Fiado | **Sí** | Mejor historia del producto |
| Cobranza WA | **Sí** | Shell Cobrá |
| Servicios Pro / Monotributo | **Mayormente sí** | Shell acotado |
| Kiosco / balanza | **Parcial** | Shell POS; golden path desalineado |
| Almacén barrio pool | **No** | `completo` = ERP ruidoso |
| Ferretería | **Parcial / tabs mal** | POS sin ventas/compras |
| Gym featured | **No** | Full ERP frecuente |
| Taller / mayoría de nichos | **Débil** | Fallback Turnos + labels |

---

### 3.3 Dimensión 3 — Valor de nicho y brechas a “vendible pleno self-serve”

#### Por nicho

| Nicho | Motor real vs skin | Madurez | Severidad gap 100% self-serve | Acción prioritaria |
|-------|-------------------|---------|-------------------------------|--------------------|
| **Almacén / kiosco** | Motor real: POS + caja + stock + **fiado** | **A−** | **Alto** (ops, no dominio) | Estabilizar fiado E2E; offline; AFIP/hw con setup fee. |
| **Ferretería** | Retail genérico + labels | **B** | **Alto** | Unidades m/kg/u, lista obra, presupuesto→venta; shell ferretería. |
| **Gimnasio** | **Membresías reales** + shell cuotas paralelo | **A−/B+** | **Alto** | Unificar producto (1 home); no torniquete/CBU/app socio. |
| **Veterinaria** | `Paciente`/`Consulta` parcial; sin plan sanitario | **B−** | **Alto** | Plan sanitario + cobro al cerrar consulta; `empresaId` en HC. |
| **Clínica** | Agenda real; HC sesgo mascota; **sin OS** | **B−/C+** | **Crítico** si se vende full | Tagline “particular only”; HC humana; quitar “facturación OS”. |
| **Taller mecánico** | Dual: labels `NicheMovimiento` + `OrdenServicio` embrión + dialog stub | **C** | **Crítico** para promesa vertical | Unificar en OT Field; fix `ot-dialog.tsx` (`clienteId` hardcode). |
| **Fumigadoras** | **No existe** (solo servicios_pro) | **D** | **Crítico** si se vende | No vender; roadmap OT Field + contratos. |
| **Climatización** | **No existe** | **D** | **Crítico** si se vende | No vender; activos en cliente + OT Field. |

#### Motores de dominio: mapa de honestidad

| Motor | Paths | ¿Dominio real? |
|-------|-------|----------------|
| Fiado / libreta | `lib/fiado/*`, saldo cliente | **Sí** (ancla) |
| POS + caja + stock | `app/api/pos/*`, caja, productos | **Sí** (core) |
| Membresías | `PlanMembresia`, `Membresia`, `/dashboard/membresias` | **Sí** (gym acotado) |
| HC | `Paciente`, `Consulta`, vet/HC | **Parcial** (ficha/consulta) |
| Agenda | `Turno`, profesional, servicio | **Sí** (turnos; no OS) |
| Shell nicho | `NicheMovimiento`, `lib/niche/*` | **No** — labels multi-rubro |
| OrdenServicio | `lib/ot/*`, `/dashboard/ot` | **Embrión** OT Field |
| OrdenTrabajo | mantenimiento planta | **No** es taller de calle |
| Fumig / clima | — | **Inexistente** |

#### Backlog priorizado: Piloto → Producto 100% self-serve

| Prioridad | Brecha | Severidad | Por qué bloquea self-serve |
|-----------|--------|-----------|----------------------------|
| **P0** | Cobro MP → lifecycle completo + multi-sub + webhooks firmados | Crítico | Sin esto no hay SaaS self-serve |
| **P0** | Numeración fiscal única + AFIP por tenant | Crítico | Legal AR |
| **P0** | Fiado E2E estable (ancla gratis) | Crítico | Ancla de adquisición retail |
| **P0** | Pack→`modoLite`→shell 1:1 (sin ERP ruidoso) | Crítico | Conversión trial |
| **P0** | Oferta honesta en código (`goLiveTier`) | Crítico | Evita vender D como A |
| **P1** | Unificar Gym + OT Field reutilizable (taller → oficios) | Alto | Expansión vertical sin 40 ERPs |
| **P1** | Ferretería mostrador profundo + Vet cobro/ficha | Alto | Ticket y retención |
| **P1** | WhatsApp: mock visible vs Twilio real documentado | Alto | No mentir en wow WA |
| **P1** | Offline POS + sync sin duplicados | Alto | Calle real |
| **P2** | Contratos + activos cliente + app campo | Medio | Fumig/AC y NRR |
| **P2** | Portales socio/tutor; débito socio | Medio | Self-serve del *cliente del tenant* |
| **P2** | Roles finos + DPA HC | Medio | Cumplimiento multi-usuario |
| **P3** | Torniquete, lab, HIS, nomenclador OS | Bajo (no PRD) | No priorizar para go-live |

---

## 4. SPOFs y carreras de estado

| Tipo | Caso |
|------|------|
| **SPOF** | `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET`; un `mpSubscriptionId`; seed `ProductoComercial`; DB pooler |
| **Race** | Factura número concurrente; 2 cajas abiertas; webhook doble comisión; signup email check-then-insert |
| **500 frecuentes** | Webhook + FK SKU; MP API errors en create-subscription; AFIP SOAP; fiado con tablas fantasma (histórico documentado en FALTANTES) |

### Paths propensos a 500 en producción

- `activarSuscripcionPagada` con SKU ausente en `ProductoComercial`.
- `createMercadoPagoSubscription` si MP API falla (error rethrow).
- Handler de webhook con throw → 500 (MP reintenta; side effects no idempotentes amplifican daño).
- POS stock/validación con `catch (error: any)` no tipado.
- APIs de fiado si referencian modelos inexistentes (historial de bugs documentado).

---

## 5. Matriz “qué puede decir comercial mañana”

| Oferta | Demo | Piloto pago | Self-serve 100% | Frase segura |
|--------|------|-------------|-----------------|--------------|
| Fiado + kiosco/almacén | Sí | Sí + checklist | No total | “Fiado, caja y stock; AFIP/hardware con setup” |
| POS + factura | Sí | Sí | No (cert) | “Mostrador y ticket/factura con implementación AFIP” |
| Ferretería mostrador | Sí | Sí simple | No | “Stock y venta; obra/m² en roadmap” |
| Cobranza WA | Sí | Sí si Twilio | Condicional | “Recordatorios si hay WhatsApp configurado” |
| Servicios pro / monotributo | Sí | Sí liviano | Casi | “Agenda, presupuestos, cobro — no OT field” |
| Gym cuotas | Sí | Sí acotado | No | “Socios, planes, morosos, cobro manual” |
| Vet / clínica | Condicional | Piloto | No | “Fichas/agenda particular — no OS/HIS” |
| Taller | Condicional | Órdenes simples | No | “OT simple + aviso listo — no taller industrial” |
| Fumig / clima | Solo genérico | No | No | “Agenda y presupuestos; OT en roadmap” |

---

## 6. Priorización recomendada (90 días)

### Sprint 0 (1–2 semanas) — “Cobra y entrega”

1. **E1+E2+E4:** pago → SKUs correctos → `activarProducto`
2. **E6+E5:** un webhook firmado + resolución de tenant
3. **E7:** unique numeración factura
4. Tests integración: mock pay → SKU activo → feature on → sidebar shell

**Archivos prioritarios:**

1. `lib/billing/mercadopago-subscription.ts`
2. `lib/billing/billing-checkout-service.ts`
3. `app/api/mercadopago/webhook/route.ts`
4. `lib/mercadopago/mercadopago-service.ts`
5. `prisma/schema.prisma` (Factura unique, opcional `BillingSubscription`)
6. `app/api/afip/emitir-factura/route.ts`
7. `app/api/webhooks/crm/provision/route.ts`
8. `app/api/auth/signup/route.ts`

### Sprint 1 — “Producto limpio que se vende”

5. **C1+C2+C3:** pack→modoLite→shell por enganche
6. **C6:** admin no ve ERP completo sin SKU
7. Fiado E2E smoke en CI post-deploy
8. `goLiveTier` en catálogo + landings

### Sprint 2 — “Calle y fiscal”

9. AFIP tenant + assert cliente (**E8–E9**)
10. Caja unique open (**E10**)
11. Gym unificado; ferretería shell
12. OT Field mínimo usable (taller deja de ser skin)

### Explicitamente no hacer aún

- Verticales fumigación/AC como producto
- “Self-serve AFIP mágico en 5 minutos”
- 40 skins de nicho sin OT Field
- Ads masivos a rubros §3.2–3.3 del PRD

---

## 7. Criterios de aceptación (definition of done)

### Cobro self-serve (Sprint 0)

- [ ] Checkout de un SKU X deja `suscripcionModulo` + `featureEmpresa` + hooks activos para **X** (no genérico).
- [ ] Reintento de webhook no duplica comisiones ni re-provisiona sin control.
- [x] `/api/mercadopago/webhook` rechaza requests sin firma válida en producción (`validarFirmaWebhook` 401/403).
- [ ] Pago de tenant A nunca se registra en empresa B.
- [ ] Dos ventas POS concurrentes no generan el mismo `numero` de factura.

### UX pack (Sprint 1)

- [x] Tenant con `pos.fiado_barrio` ve shell Fiado con `/dashboard/pos` y `/dashboard/cuentas-cobrar` alineados (`lite-sidebar.ts`).
- [x] Tenant con `pool-almacen-barrio` no queda en `modoLite: completo` por default.
- [ ] Demo gym activa enganche y aterriza en **una** home coherente.
- [x] Redireccionamiento de analistas y administradores resuelto sin bucles infinitos (`home-redirect.ts`).

### Nicho honestidad y Hardening de Producción (Completado)

- [x] Eliminación física del código muerto `lib/mock-data.ts`.
- [x] Hardening estricto de `allowsInstantMarketplaceCheckout()` -> deshabilitado en `production`.
- [x] Eliminación de CAEs inventados con `Math.random()` en `factura-exportacion-service.ts`.
- [x] Verificación completa de la suite de automatización (239 archivos / 960 tests pasados).

---

## 8. Conclusión CPO + Architect

1. **El cuello de botella no es “faltan módulos”**: es **cerrar el loop cobro → entitlement → UX del pack** y **no mentir en verticales D**.
2. Las **primitives de producto limpio ya existen** (`modoLite`, `PRODUCT_SHELLS`, anclas). El gap es de **empaquetado y de path de pago**.
3. El core **POS/caja/fiado/membresías** es el activo; el shell de nichos es un **acelerador de demo**, no un portfolio de 40 SaaS.
4. **Self-serve 100% en Argentina** sin implementador es una meta **por etapas**: primero fiado/POS + cobro confiable; AFIP/hw siempre con fricción honesta (setup fee o partner).

---

## 9. Referencias de código (checklist de lectura)

```
app/api/auth/signup/route.ts
app/api/webhooks/mercadopago/route.ts
app/api/mercadopago/webhook/route.ts
app/api/billing/create-subscription/route.ts
app/api/billing/subscribe/route.ts
app/api/afip/emitir-factura/route.ts
app/api/pos/venta/route.ts
app/dashboard/layout.tsx
lib/billing/mercadopago-subscription.ts
lib/billing/billing-checkout-service.ts
lib/platform/product-lifecycle.ts
lib/comercial/pack-calle-catalog.ts
lib/comercial/product-shell.ts
lib/comercial/sidebar-rubro-filter.ts
lib/comercial/go-live-packs.ts
lib/dashboard/sidebar-filters.ts
lib/niche/niche-apps-catalog.ts
lib/niche/niche-provision.ts
lib/fiado/*
lib/ot/*
prisma/schema.prisma
```

---

*Documento de auditoría interna. No sustituye contratos comerciales ni el PRD de go-live; si hay conflicto de promesa de venta, manda `docs/GO_LIVE_PRD.md`.*

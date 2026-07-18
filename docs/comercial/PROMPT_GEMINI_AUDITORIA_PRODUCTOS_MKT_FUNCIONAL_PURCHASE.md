# Prompt Gemini — Auditoría 360°: productos comerciales, MKT, funcional y purchase

> **Objetivo:** Validar que **todos** los productos vendibles existen de punta a punta:
> 1. **Comercial / MKT** (precio, lema, landing, SEO, home, catálogo)
> 2. **Purchase / activación** (SKU, trial, ancla, App Store, `?activar=`, billing)
> 3. **Funcional lineal** (el usuario resuelve el dolor: fiar, cobrar, facturar, recibo, recurrente)
>
> **Salida esperada:** matriz de cobertura + gaps priorizados + checklist de “100% facturable y lineal”.
>
> **Contexto previo (leer primero):**
> - `docs/comercial/AUDITORIA-PRODUCTOS-MKT-FUNCIONAL-PURCHASE-2026-07-13.md` ← **informe ya generado (Grok)**
> - `docs/comercial/AUDITORIA-TRIAL-FIADO-COBRANZA-RECIBO-RECURRENTE.md`
> - `__tests__/comercial/catalog-coherence.test.ts`
> - `docs/marketplace/12-enganches-comerciales.md`
> - `docs/marketplace/00-ciclo-completo.md`
> - `COMERCIAL.md`
> - `AGENTS.md`
>
> **Si re-ejecutás este prompt:** validá o actualizá el informe del 2026-07-13; no ignores hallazgos ya listados como “hecho en código reciente”.

---

## PROMPT MAESTRO (copiar y pegar entero en Gemini)

```
Sos auditor senior de producto + ingeniería comercial en el monorepo pos-system-argentina
(Next.js 15 App Router, TypeScript strict, Prisma/PostgreSQL, Zustand, Vitest, shadcn/ui, Tailwind v4).

Tu misión NO es reescribir el ERP. Tu misión es VALIDAR y DOCUMENTAR, con evidencia de archivos y rutas,
si cada producto “vendible” está completo en 3 capas:

A) MARKETING / COMERCIAL (se puede descubrir, entender y desear)
B) PURCHASE / ACTIVACIÓN (se puede comprar o activar trial y queda provisionado)
C) FUNCIONAL LINEAL (resuelve el dolor de punta a punta: datos → acción → comprobante → cobro → upsell)

### Contexto de negocio (Argentina, es-AR, ARS)
- Grupo Claver: ERP/POS + micro-apps (Sub-SaaS) + packs por rubro + intangibles + Premium ERP 7.
- Estrategia GTM: home vende 1 dolor (Fiado ancla gratis) + 3 combate (Fiado, Cobrá, Turnos) + catálogo.
- Modelo ancla: OFERTA_FIADO_ANCLA → pos.fiado_barrio gratis permanente; core.claver y add-ons de pago.
- Facturación fiscal AFIP (Facturas A/B/C, CAE/CAEA), recibos de cobro, cuentas por cobrar.

### Fuentes de verdad OBLIGATORIAS a inventariar
Leé y cruzá (no inventes SKUs):

COMERCIAL / CATÁLOGO
- lib/comercial/sub-saas-catalog.ts          → SUB_SAAS_APPS (slugs, sku, precio, upsellSkus, estado)
- lib/comercial/go-to-market-vitrine.ts      → COMBATE_APPS, HOME_COMBATE_SLUGS, PRODUCT_ENTRIES, FIADO_ENTRY…
- lib/comercial/commercial-packaging.ts      → PRODUCTOS_ENTRADA, PACKS_DESTACADOS, PACKS_HOME_STRIP, CATALOGO_RESUMEN
- lib/comercial/ofertas-comerciales.ts       → OFERTA_FIADO_ANCLA, anclaGratis, monetizar, vigenciaParaSku
- lib/comercial/pack-calle-catalog.ts        → PACKS_CALLE, modoLite, landingPath
- lib/comercial/enganche / marketplace:
  - lib/marketplace/enganche-catalog.ts
  - lib/marketplace/marketplace-catalog.ts
  - lib/marketplace/bundles.ts
  - lib/marketplace/intangible-premium-7.ts
  - lib/marketplace/intangible-services.ts
  - lib/niche/niche-apps-catalog.ts
  - lib/almacen-rosario/modulos-catalog.ts (pack 18)
  - lib/comercial/ia-saas-top20.ts
  - lib/marketing/claver-services-catalog.ts (líneas de negocio)
  - lib/marketing/solutions-catalog.ts
  - COMERCIAL.md

ACTIVACIÓN / PURCHASE
- lib/comercial/activar-intent.ts + activar-producto-service.ts
- lib/comercial/retail-onboarding-service.ts
- lib/comercial/trial-service.ts + trial-guard.ts + comercial-access-service.ts
- lib/platform/product-lifecycle.ts + product-hooks.ts + entitlements.ts + commercial-service.ts
- lib/platform/sku-catalog.ts / product-registry.ts
- lib/billing/mercadopago-subscription.ts
- app/login/register/page.tsx, app/login/page.tsx
- app/api/comercial/** , app/api/billing/** , app/api/marketplace/**
- app/dashboard/apps/** , app/dashboard/mi-plan/** , app/dashboard/trial-vencido/**
- components/trial-banner.tsx

MARKETING SURFACES
- app/page.tsx → ClaverMatrixHub (home)
- components/marketing/** (hub, combate, packs, landings ecommerce, etc.)
- app/claver/apps/** , app/claver/apps/[slug]/**
- app/claver/claverp/** , clavergrow, almacen-rosario, ecommerce
- app/marketing/** , app/modulos/**
- app/demo/**
- lib/marketing/landing-seo.ts , claverp-landing-seo.ts
- components/marketing/claver-pricing-section.tsx (si existe)

FUNCIONAL CRÍTICO (facturar y cobrar en cadena)
- POS venta: app/api/pos/venta/route.ts
- Fiado: lib/fiado/** , app/api/fiado/** , app/dashboard/fiado/**
- Cobranza WA: lib/marketplace/cobranzas-wa-service.ts
- CxC: lib/cc-cp/cuentas-service.ts
- Recibos: lib/cobros/cobros-service.ts
- Factura AFIP: lib/afip/** , lib/ventas/**
- Facturación recurrente: lib/ventas/facturacion-recurrente-service.ts
- Eventos: lib/events/emit-domain-event.ts
- Menú lite: lib/comercial/lite-sidebar.ts
- Cron: app/api/cron/**

AUDITORÍA PREVIA (no ignore; validá si sigue vigente o se resolvió)
- docs/comercial/AUDITORIA-TRIAL-FIADO-COBRANZA-RECIBO-RECURRENTE.md

### Definición de “producto completo” (criterio PASS)

Un producto P (SKU o pack o sub-saas slug) es PASS solo si cumple TODOS los checks aplicables:

#### Capa A — MKT / Comercial
A1. Tiene nombre, lema, dolor, precio (o $0 ancla documentada) en UNA fuente de verdad coherente
A2. Precio y promesa NO se contradicen entre catálogos (enganche vs sub-saas vs ofertas vs FAQ vs home)
A3. Tiene superficie de descubrimiento: home y/o /claver/apps y/o landing dedicada y/o mega menú
A4. CTA lleva a register?activar=… o a App Store con sku/pack (no dead-end)
A5. SEO/metadata o FAQ no mienten (ej. “gratis forever” vs “$4.990”)

#### Capa B — Purchase / activación
B1. SKU existe en marketplace o registry y isSkuProvisionable / hooks onActivate
B2. resolveActivarIntent(slug|sku|pack) resuelve nombre + modoLite + landingPath
B3. applyActivarIntent / applyRetailOnboarding crea suscripcionModulo con vigencia correcta
    (ancla: vigenciaHasta null; trial: fecha; pago: MP authorized)
B4. Trial 14d y bloqueo/upsell se comportan según oferta (fiado-ancla vs clasico-trial)
B5. Usuario ya logueado puede activar (App Store o API) sin re-registrarse
B6. mi-plan / trial-banner / trial-vencido reflejan ancla gratis y módulos de pago
B7. Billing: hay camino a pagar (MP subscribe o link comercial) documentado; si es stub, marcarlo FAIL PARCIAL

#### Capa C — Funcional lineal (resolver el problema)
Para cada producto, el happy path debe cerrar el circuito del dolor, no solo “abrir una pantalla”:

| Producto / familia | Happy path mínimo (PASS) |
|--------------------|--------------------------|
| Fiado | Alta cliente → anotar deuda (libreta o POS) → ver deudor → cobrar → recibo + baja saldo (+ aviso WA/email opcional) |
| Cobrá WA | Existen CxC vencidas con teléfono → regla/cron → mensaje → pago o cobro manual → recibo |
| POS / Core | Venta → factura/ticket → stock/caja → CAE si fiscal |
| Turnos | Agenda + link público reserva → (opcional cobro) |
| Propiedad/Consorcios | Liquidar expensa → CxC → cobranza |
| Facturación recurrente | Alta plan → emisión → Factura → CxC → cobrable → recibo |
| Monotributo | Presupuesto → Factura C → cobro |
| Pack Almacén Rosario | SKUs visibles + activables + efecto en POS |
| Premium ERP 7 | Activación crea reglas/alertas; hay valor operativo medible |
| E-commerce B2C | Catálogo → checkout → stock/pedido en ERP |
| Clavergrow / Agro | Módulos demo o beta marcados honestamente |

C1. Hay API + UI (no solo seed de menú)
C2. Multi-tenant: getAuthContext + whereEmpresa / empresaId
C3. Entitlement canUseSku / canWriteSku se respeta (403 claro)
C4. Eventos de dominio cuando corresponde (FACTURA_EMITIDA, RECIBO_EMITIDO)
C5. No hay “doble libro” inconsistente (ej. saldo fiado vs CxC desfasados al cobrar)
C6. Modo lite del producto muestra las pantallas del happy path (lite-sidebar)
C7. Upsell natural al siguiente SKU (in-app o mi-plan), no solo en docs

### Productos a inventariar (lista mínima — expandí desde catálogos)

1. Sub-SaaS (todos los de SUB_SAAS_APPS): pos, cobra, fiado, turnos, propiedad, monotributo, servicios, obra, tienda, presupuestos, menu-qr, contenido-ia, bot-wa, stock, puntos, …
2. Combate home: fiado, cobra, turnos (+ resto combate: monotributo, servicios, obra, propiedad, pos)
3. Enganches ENGANCHES
4. Packs MARKETPLACE_BUNDLES (almacén, kiosco, propiedad, premium-erp-7, servicios-pro, …)
5. Pack Almacén Rosario 18 SKUs
6. Premium ERP 7 intangibles
7. Módulos ERP core (ventas, compras, stock, caja, contabilidad, impuestos AFIP)
8. Líneas claver-services-catalog (Cloud, Grow, ClavPay, ClavLog, ClavAI, Bridge, Studio, Analytics, Clavernet)
9. Demos /demo/[industryId]

Para CADA ítem producí una fila en la matriz.

### Formato de salida (OBLIGATORIO)

## 1. Resumen ejecutivo (max 15 líneas)
- % PASS / PARCIAL / FAIL por capa A, B, C
- Top 10 blockers para “100% funcional para facturar y resolver problemas en forma lineal”
- Qué ya está bien (no rehacer)

## 2. Matriz maestra (tabla markdown)

| ID | Nombre | SKU/Pack | Precio catálogo | Precio oferta/ancla | Superficie MKT | CTA | Activación | Landing path | ModoLite | A | B | C | Evidencia (paths) | Gap principal | Prioridad P0/P1/P2 |

Estados: PASS | PARCIAL | FAIL | N/A

## 3. Matriz de coherencia de precios y promesas
Tabla de contradicciones (misma SKU, distinto precio o “gratis” vs pago) entre:
ofertas-comerciales | enganche | sub-saas | FAQ | home hero | COMERCIAL.md | productoComercial seed

## 4. Cadena lineal de facturación y cobro (diagrama + gaps)

Documentá el estado REAL de esta cadena para:
1) Fiado libreta
2) POS cuenta corriente
3) Cobranza WA
4) Factura puntual (ventas/AFIP)
5) Factura recurrente
6) Recibo de cobro
7) Link de pago MP (deudor vs suscripción SaaS Claver)

Por cada eslabón: implementado SI/NO, disparador, archivo, roto SI/NO, efecto en el siguiente eslabón.

## 5. Purchase funnel E2E (por puerta de entrada)

Para: home fiado, home cobra, /claver/apps, App Store in-app, demo rubro, contacto ventas

Flujo:
visitante → CTA → register/login → activar → first value action → trial → paywall/upsell → pago

Marcá roturas (CTA genérico sin activar, landing sin purchase, trial que bloquea ancla, etc.)

## 6. Checklist “100% listo para facturar y operar en lineal”

Lista de requisitos NO negociables para go-live comercial serio.
Ejemplos (completar/corroborar con código):
- [ ] Emisión AFIP homologable en happy path POS/ventas
- [ ] Factura recurrente genera CxC cobrable siempre
- [ ] Cobro genera recibo y actualiza CC (+ libreta si aplica)
- [ ] Cron o job confiable de recurrentes y cobranzas
- [ ] Ancla fiado gratis + trial monetizado coherente en UI
- [ ] Un solo precio por SKU en todas las superficies
- [ ] Entitlements en API (no solo UI)
- [ ] Webhook/callback de pago deudor cierra deuda
- [ ] Tests Vitest de los 5 happy paths críticos
- [ ] Menú lite no esconde el paso del happy path

Para cada ítem: estado (OK/FALTA/PARCIAL) + archivo + esfuerzo (S/M/L)

## 7. Backlog priorizado para llegar a 100%

### P0 — Rompe promesa de venta o impide facturar/cobrar
(tickets concretos: título, archivos, criterio de aceptación, test)

### P1 — Purchase y upsell
### P2 — MKT polish / SEO / demos
### P3 — Nice-to-have

## 8. Plan de validación manual (QA script)

Scripts de 10–20 minutos:
- Script A: Fiado ancla (register?activar=fiado → anotar → cobrar → ver recibo/CC)
- Script B: Cobrá (activar → generar deuda → ver panel → mensaje)
- Script C: Recurrente (alta → procesar → factura → CC → cobro)
- Script D: POS fiscal (venta → CAE o pendiente_cae controlado)
- Script E: Trial vencido con ancla (fiado sigue; POS bloqueado; banner correcto)

## 9. Riesgos de compliance / AFIP / multi-tenant
Lista corta (datos cruzados, numeración recibos, contado vs CC, etc.)

### Reglas de trabajo
1. NO inventes productos. Todo sale de catálogos del repo.
2. Cita paths y símbolos (funciones, SKUs). Sin path = no cuenta como evidencia.
3. Preferí FAIL honesto a PARCIAL maquillado.
4. Si algo es beta/proximamente, debe verse así en MKT (si se vende como disponible → FAIL).
5. No implementes código en esta pasada salvo que el usuario lo pida después; esta sesión es AUDITORÍA.
6. Locale es-AR en copy sugerido de gaps.
7. Al final: “Top 5 cosas que yo haría esta semana” ordenadas por impacto comercial.

### Entregable final
Un único documento markdown listo para copiar a:
docs/comercial/AUDITORIA-PRODUCTOS-MKT-FUNCIONAL-PURCHASE-YYYY-MM-DD.md

Incluí al inicio:
- Fecha
- Commit/branch si podés inferir
- Scope (qué catálogos se recorrieron)
- Limitaciones (qué no pudiste ejecutar en runtime)
```

---

## BLOQUES OPCIONALES (si Gemini puede escribir/editar)

Usar solo si pedís implementación después de la auditoría.

### Bloque Opcional X — Generar matriz CSV

```
A partir de la matriz maestra, generá también un CSV en
docs/comercial/matriz-productos-cobertura.csv
con columnas: id,nombre,sku,capa_a,capa_b,capa_c,prioridad,gap
```

### Bloque Opcional Y — Tests de inventario

```
Creá __tests__/comercial/catalog-coherence.test.ts que falle si:
1. pos.fiado_barrio tiene precio distinto en enganche vs sub-saas vs ofertas (ancla 0)
2. HOME_COMBATE_SLUGS no están en SUB_SAAS_APPS
3. COMBATE_APPS_SLUGS no tienen PRODUCT_ENTRIES
4. Algún pack de PACKS_HOME_STRIP no existe en MARKETPLACE_BUNDLES
5. resolveActivarIntent(slug) es null para cada HOME_COMBATE_SLUGS
```

### Bloque Opcional Z — Mapa visual

```
Generá un mermaid flowchart del embudo comercial real (no ideal)
desde home → activar → first value → cobro → upsell,
marcando nodos ROTO en rojo (texto [ROTO]).
```

---

## Cómo usar este prompt

1. Abrí Gemini (o agente con acceso al repo).
2. Pegá el **PROMPT MAESTRO**.
3. Adjuntá o indicá que lea los paths listados (y la auditoría previa).
4. Pedí el entregable en `docs/comercial/AUDITORIA-PRODUCTOS-MKT-FUNCIONAL-PURCHASE-YYYY-MM-DD.md`.
5. Con el backlog P0, abrí tickets o pasá a Cursor/Grok para implementar.

### Prompt corto de seguimiento (después del informe)

```
Con el informe AUDITORIA-PRODUCTOS-MKT-FUNCIONAL-PURCHASE, implementá SOLO los P0
en orden, un PR lógico por vez, con tests Vitest y sin expandir catálogo.
Empezá por: [pegar el P0 #1 del informe].
```

---

## Checklist humano de “listo para pegar en Gemini”

- [ ] Repo actualizado (incluye anotar/cobrar fiado y CC en recurrentes si ya se mergeó)
- [ ] Gemini tiene acceso a `lib/comercial`, `lib/marketplace`, `app/claver`, `docs/comercial`
- [ ] Se aclara: **auditar primero, no codear** salvo pedido explícito
- [ ] Se pide evidencia con paths
- [ ] Se pide % PASS por capas A/B/C y Top 10 blockers

---

## Notas para el equipo (no van al prompt)

| Capa | Qué valida |
|------|------------|
| **A MKT** | ¿Se puede vender sin mentir? |
| **B Purchase** | ¿Se puede activar y cobrar la suscripción? |
| **C Funcional** | ¿El cliente resuelve el problema y puede facturar/cobrar en cadena? |

El “100% funcional lineal” **no** es “hay 40 módulos en el menú”. Es:

```
dolor → producto activado → acción del usuario → documento (factura/recibo)
      → estado de deuda coherente → upsell o retención
```

Referencia de roturas ya conocidas (validar si siguen):  
`docs/comercial/AUDITORIA-TRIAL-FIADO-COBRANZA-RECIBO-RECURRENTE.md`.

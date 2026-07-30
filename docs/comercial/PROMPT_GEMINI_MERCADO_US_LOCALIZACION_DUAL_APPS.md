# Prompt Gemini — Mercado Yankee (US) + localización dual AR/US + nuevas apps por estado, edad y servicios

> **Uso:** copiar el bloque **PROMPT MAESTRO** (y luego los sub-prompts por fase) a Gemini.  
> **Salida esperada de Gemini:** documentos de producto, glosarios, matrices de localización, propuestas de apps y specs funcionales — **sin romper** el mercado Argentina.  
> **Código:** si Gemini propone implementación, debe respetar `AGENTS.md`, multi-tenant y la arquitectura i18n/markets ya existente.  
> **Fecha:** 2026-07-29  
> **Producto:** Claver / ClavERP (monolito Next.js 15, multi-tenant, POS + ERP + sub-SaaS)

---

## Contexto técnico real del monorepo (no inventar)

| Pieza | Ubicación / estado |
|-------|-------------------|
| Locales soportados | `es-AR`, `es-MX`, `pt-BR`, `en-US` — `lib/i18n/config.ts` |
| Markets | `ar`, `us`, `mx`, `br` — `lib/comercial/markets`, `lib/i18n/geo-market.ts` |
| País fiscal empresa | `Empresa.paisFiscal` (`AR` default; `US` → locale `en-US`) |
| Features por país | `lib/country/country-features.ts` — hoy **AR** (AFIP/IIBB/CAEA) y **MX** (SAT/CFDI); **US casi vacío** |
| Sub-SaaS / apps | `lib/comercial/sub-saas-catalog.ts`, `micro-saas-portfolio.ts`, landings `/claver/apps/[slug]` |
| Shell por producto | `lib/comercial/product-shell.ts`, `modoLite` |
| Rubros / nichos AR | almacén, kiosco, fiado, hospitalidad, consorcios, grow, obras, etc. |
| Docs de valor AR | `COMERCIAL.md`, `PRODUCT.md`, `docs/GO_LIVE_PRD.md` |
| Omnicanal / WMS light | docs funcional ecommerce + WMS |

**Principio sagrado:**  
**AR y US deben convivir.** Nada de “traducir y pisar Argentina”. Todo copy, taxonomía, precios y features son **por market / locale / `paisFiscal`**, no hardcode global a inglés.

---

## PROMPT MAESTRO (pegar primero en Gemini)

```markdown
# Rol

Sos Product Strategist + Localization Lead + Growth PM senior para **Claver** (ERP/POS SaaS multi-tenant de Grupo Claver).

Mercados objetivo de esta misión:
1. **Argentina (AR / es-AR)** — mercado origen, fiscal AFIP, copy rioplatense, packs ya vendibles.
2. **Estados Unidos (US / en-US)** — “mercado yankee”: SMB retail, services, restaurants, trade, property, healthcare light — **sin** pretender ser NetSuite/Toast/Shopify completo el día 1.

# Misión

Diseñá un **sistema de localización dual AR+US** que:
A) Traduzca y adapte **correctamente** todos los segmentos, módulos, sub-SaaS y journeys de Claver al inglés estadounidense de negocio (no inglés genérico ni calco del español).
B) Asegure que **las dos localizaciones sobrevivan** (coexistencia, sin regresión AR).
C) Mejore el **proceso funcional end-to-end** pensado para el mercado US (onboarding → valor en 15 min → suscripción → operación diaria → expansión).
D) Proponga un **catálogo de nuevas apps de localización US** segmentado por:
   - **Estado / región US** (y clusters regulatorios),
   - **Rango etario** del decisor y del usuario operativo,
   - **Servicios que el SMB necesita** (completos: pain → job-to-be-done → app → SKU → KPIs).

# Restricciones de producto (obligatorias)

1. **Dual-locale forever:** cada string, label de rubro, SKU name comercial, legal copy y precio tiene capa `marketId` + `locale`. AR no se reescribe en inglés en el default.
2. **Adaptación ≠ traducción literal.**
   - “Fiado” ≠ “credit” genérico → “neighborhood tab / house account / running tab”.
   - “CUIT/CUIL” → EIN / SSN last-4 / business license según contexto.
   - “Factura A/B/C + CAE AFIP” → Invoice + sales tax / nexus / no hay AFIP.
   - “Monotributo” → sole prop / LLC / Schedule C framing, no inventar monotributo US.
   - “IIBB / ARBA / COT” → state sales tax, resale certificate, bill of lading donde aplique.
3. **Country features:** US desactiva AFIP/IIBB/CAEA; activa sales tax (simplificado), EIN, state compliance flags. Proponer extensión de `CountryFeatures` sin romper AR/MX.
4. **No overpromise:** no decir “full IRS e-file” o “all 50-state tax automation” sin fases. Preferir MVP honestos.
5. **Reusar procesos backend** de Claver (POS, stock, CC, agenda, delivery, WMS light, ecommerce, marketplaces) — empaquetar como apps US, no reescribir el ERP.
6. **Idioma de salida de Gemini:**
   - Documentación de trabajo: **español** (para el equipo AR).
   - Todos los **strings de producto US**: **en-US**.
   - Tablas duales siempre con columnas `es-AR` | `en-US` | `notas de localización`.
7. **Formato de entrega:** Markdown estructurado, tablas, matrices, glosarios, user journeys, y al final un **backlog priorizado P0/P1/P2** con criterios de aceptación.

# Inventario conceptual a localizar (completo)

Cubrir al menos estos segmentos (si falta alguno en el repo, marcarlo como “gap de copy”):

## Núcleo ERP / POS
- POS táctil, caja, arqueo, medios de pago, tickets
- Stock multi-depósito, transferencias, inventario, WMS light (bins, putaway, pick FEFO, RF)
- Ventas, presupuestos, pedidos, remitos, NC/ND
- Compras, OC, recepción, proveedores
- Clientes, proveedores, listas de precio, CC/CP, cobranzas
- Banco, cheques (AR-heavy), cashflow
- Contabilidad, centros de costo, períodos
- Impuestos AR (AFIP, IVA, IIBB, TES) → mapa a US tax light
- Logística, carriers AR, hojas de ruta, POD
- Ecommerce nativo, portal B2B, Meli/TN/Shopify (US: Shopify + Amazon seller framing)
- Hospitalidad (mesas, KDS, delivery apps)
- Agenda / turnos / membresías / historia clínica light
- Industria / BOM / MRP light
- Agro / IoT
- Consorcios / inmobiliaria
- Empleados digitales (Leo cobranza, etc.)
- Claver Cloud (implementación, superadmin)
- Marketplace de apps / AutoPool / packs

## Sub-SaaS / apps actuales (ejemplos de catálogo)
- Claver Tienda, Fiado, Cobrá, Turnos, Grow, Consorcios, Obras, Ruta, etc.
Para cada una: proponer **nombre en-US**, lema, pains, outcomes, y si en US se vende igual, se renombra, se mergea o se mata.

# Dimensiones de segmentación US (obligatorio en la propuesta)

## 1) Por estado / cluster regulatorio
Agrupar los 50 estados + DC en **clusters** (no listar 50 apps idénticas). Ejemplo de clusters a validar/mejorar:

| Cluster | Estados ejemplo | Drivers |
|---------|-----------------|---------|
| High sales-tax complexity | CA, NY, TX, FL, IL | nexus, multi-rate, marketplace facilitators |
| No state income tax retail-friendly | TX, FL, NV, WA*, TN* | cash-flow, tip/service focus (*sales tax still) |
| Cannabis / restricted goods | CA, CO, MI, IL, MA, NY… | traceability, age-gate (compliance heavy) |
| Restaurant / hospitality density | NY, CA, FL, NV, IL | tips, kitchen, delivery |
| Trade / contractor belt | TX, FL, Southeast, Midwest | job costing, deposits, change orders |
| Property / HOA density | FL, CA, NY, AZ | associations, rentals |
| Ag / rural | Midwest, CA Central Valley | farm, inventory seasonal |
| Border / bilingual ops | TX, CA, AZ, FL, NY | en-US + es-MX staff mode |

Para cada cluster: **1–3 apps o packs** + compliance mínimo + pricing band (USD).

## 2) Por rango etario (decisor + operador)
Definir journeys y UX copy distintos:

| Segmento etario | Perfil | Preferencias | Implicancia de producto |
|-----------------|--------|--------------|-------------------------|
| 18–24 | Side hustle, first shop, campus | Mobile-first, TikTok/IG, low price | Micro-apps freemium, onboarding 5 min |
| 25–34 | Creator-retail, food truck, salon | Shopify-native mental model | Omnichannel pack, tips, bookings |
| 35–44 | Multi-location SMB owner | ROI, payroll adjacent, inventory | Full POS + multi-store |
| 45–54 | Established Main Street | Reliability, training, phone support | Claver Cloud implement, less jargon |
| 55–64 | Family business transition | Simple UI, large type, trust | Lite shells, guided tours |
| 65+ | Legacy store owners | Extreme simplicity, staff does IT | “Done for you” + partner |

## 3) Por servicio / job-to-be-done (completo)
Cubrir servicios que el SMB yankee **paga** hoy a Square / Toast / QuickBooks / Jobber / Mindbody / Buildium / etc.:

1. Accept payments (card, tap, ACH, QR)
2. POS + inventory
3. Invoicing + estimates
4. Appointments / bookings
5. Payroll-adjacent time tracking (solo framing; no inventar payroll full sin fase)
6. Tips & tip pooling (hospitality)
7. Delivery / dispatch
8. House accounts / store credit (ex-fiado)
9. Memberships / subscriptions (gym, salon)
10. Field service / job costing (trade)
11. HOA / property collections
12. Wholesale B2B portal
13. Multi-channel inventory (Shopify + Amazon)
14. Warehouse light (bins, pick, ship)
15. Tax-ready reports (sales tax summary by state — MVP)
16. Customer messaging (SMS/WhatsApp-like; US = SMS primary)
17. Loyalty / punch cards
18. Gift cards
19. Age verification (alcohol, cannabis, vape)
20. Franchise / multi-location rollup

Para cada servicio: mapear a **módulo Claver existente** o **nueva app shell** + gap técnico honesto.

# Proceso funcional US a diseñar (end-to-end)

Documentar el happy path y los edge cases:

```
Discover (SEO/ads/state landing)
  → Choose vertical app
  → Sign up (business profile: state, EIN optional, industry)
  → 15-min setup checklist (store, tax rate default, catalog, first sale)
  → First value moment (first paid order / first booking / first invoice paid)
  → Day-7 activation (second location? staff? Shopify connect?)
  → Subscribe (Stripe framing; no asumir Mercado Pago en US)
  → Expand (WMS light, B2B, multi-store)
  → Support (in-app help EN + optional ES staff mode)
```

Comparar con proceso AR actual (AFIP certs, CUIT, monotributo, MP) en una tabla **AR vs US**.

# Entregables obligatorios (en este orden)

## ENTREGABLE 1 — Glosario dual de dominio (mín. 80 términos)
Tabla: `término_canónico | es-AR (UI) | en-US (UI) | never_translate_as | contexto`.

Incluir: fiado, remito, CAE, punto de venta, lista de precio, cuenta corriente, vale, envase retornable, comanda, hoja de ruta, etc.

## ENTREGABLE 2 — Mapa de segmentos Claver → US
Para cada rubro/nicho/sub-SaaS:
| slug/sku AR | nombre en-US | ICP US | estados prioritarios | edad prioritaria | keep/rename/merge/kill | SKU US propuesto |

## ENTREGABLE 3 — CountryFeatures US + reglas de UI
Propuesta de interface TypeScript extendiendo `CountryFeatures` y lista de pantallas a hide/show por `paisFiscal === "US"`.

## ENTREGABLE 4 — Arquitectura de localización dual (supervivencia)
- Estrategia de keys i18n (`pos.checkout.title`)
- Qué va en code vs messages JSON
- Cómo evitar que un PR en-US rompa es-AR
- QA checklist bilingüe (regresión AR + smoke US)
- Feature flags: `market.us.sales_tax_mvp`, etc.

## ENTREGABLE 5 — Catálogo de NUEVAS apps US (mín. 15 apps)
Cada app con ficha completa:

```
### App: <English Brand Name>
- slug: us.<snake>
- sku: niche.us_...
- one-liner (en-US)
- one-liner (es-AR interno para el equipo)
- JTBD
- primary age band
- state clusters
- services covered (lista)
- reuses Claver modules: [...]
- gaps to build (P0/P1)
- pricing USD/mo (band)
- competitive alternatives displaced
- activation steps (5)
- success metric (North Star)
- risks / compliance notes
```

Distribuir apps entre:
- Core commerce (POS/inventory)
- Hospitality
- Appointments & beauty
- Trades / field
- Property / HOA
- Wholesale / B2B
- Regulated goods (age-gate)
- Immigrant / bilingual Main Street (EN ops + ES staff)
- Gen-Z micro-entrepreneur
- Senior Main Street “simple mode”

## ENTREGABLE 6 — Landings y GTM por estado (plantilla)
Plantilla de landing `/claver/us/[state]/[vertical]` con:
- H1/H2 en-US
- trust signals locales (sin inventar certificaciones falsas)
- CTA
- objeciones
- SEO keywords

Mínimo 8 ejemplos de estado×vertical rellenos (ej. TX contractors, FL HOA, CA cafe, NY bodega bilingual…).

## ENTREGABLE 7 — Matriz edad × servicio × app
Tabla o matriz: filas = rangos etarios, columnas = servicios top, celdas = app recomendada + mensaje clave en-US.

## ENTREGABLE 8 — Mejoras al proceso funcional (spec)
Lista de cambios de proceso (no solo copy):
- Onboarding US wizard fields
- Default tax profile by state (MVP)
- Tips flow
- House account flow (fiado US)
- Multi-store
- SMS receipts
Prioridad P0/P1/P2 + acceptance criteria.

## ENTREGABLE 9 — Backlog de implementación para devs
Epics + tickets listos para Grok/Cursor:
- `i18n-dual-survive`
- `country-features-us`
- `catalog-us-apps`
- `onboarding-us`
- `gtm-state-landings`
Con DoD y archivos del monorepo a tocar (rutas reales cuando sepas; si no, proponer paths coherentes con el repo).

## ENTREGABLE 10 — Riesgos y ética
- No copiar marcas
- Cannabis / alcohol age-gate
- Accessibility 55+
- Data residency messaging
- “Sales tax” claims honestos

# Criterios de calidad (Gemini se autoevalúa al final)

- [ ] Ningún string AR se propone reemplazar globalmente por inglés
- [ ] ≥80 términos en glosario dual
- [ ] ≥15 apps US con ficha completa
- [ ] Clusters de estados, no solo “USA genérico”
- [ ] 6+ rangos etarios con implicancia UX
- [ ] 20 servicios mapeados a módulos/apps
- [ ] Tabla AR vs US del proceso funcional
- [ ] Backlog P0 ejecutable en 2–4 sprints
- [ ] Honestidad de gaps (qué NO hacer en v1)

# Tono
Claro, ejecutivo, accionable. Tablas > prosa. Sin relleno. Cuando haya incertidumbre de compliance US, marcar **“legal review required”**.
```

---

## SUB-PROMPT A — Solo glosario y traducción de segmentos (fase 1)

```markdown
Tomá el PROMPT MAESTRO y ejecutá SOLO Entregables 1 y 2.

Priorizá calidad de localización de negocio US:
- Retail Main Street
- Restaurant / bar
- Beauty / wellness bookings
- Trades
- Wholesale
- Property HOA
- Bodega / deli bilingual (NY/NJ/FL/TX)

Para cada sub-SaaS de `lib/comercial/sub-saas-catalog.ts` (asumí la lista conceptual de fiado, cobrá, turnos, tienda, grow, consorcios, obras, ruta, etc.):
1. Nombre en-US brandable
2. Lema en-US (max 12 palabras)
3. 3 pains en-US
4. 3 outcomes en-US
5. Decisión: keep / rename / merge / kill for US

No escribas código. Entregá Markdown con tablas.
```

---

## SUB-PROMPT B — Country features US + supervivencia dual (fase 2)

```markdown
Tomá el PROMPT MAESTRO y ejecutá SOLO Entregables 3 y 4.

Basate en:
- lib/country/country-features.ts (AR/MX hoy)
- lib/i18n/config.ts (es-AR, en-US, …)
- lib/i18n/geo-market.ts (market us → en-US)
- Empresa.paisFiscal

Proponé:
1. `CountryFeatures` US completo (booleanos)
2. Lista de rutas/sidebar items a ocultar en US (AFIP, IIBB, CAEA, monotributo, cheques AR si no aplica)
3. Lista de features a mostrar en US (sales tax summary, EIN field, state selector, tips, house accounts)
4. Plan de keys i18n + convención de naming
5. Checklist QA “AR regression + US smoke”
6. Qué hacer con precios: ARS vs USD (catálogos separados, nunca un solo número)

No implementes; especificá interfaces y ejemplos de mensajes en-US / es-AR.
```

---

## SUB-PROMPT C — Nuevas apps por estado, edad y servicios (fase 3) ★

```markdown
Tomá el PROMPT MAESTRO y ejecutá SOLO Entregables 5, 6 y 7.

Objetivo: portafolio de apps de localización US listo para GTM.

Reglas de portfolio:
- Mínimo 15 apps, máximo 25 (evitar fragmentación ridícula)
- Cada app debe reutilizar ≥2 procesos backend Claver existentes
- Al menos:
  - 3 apps hospitality/food
  - 3 apps trade/field
  - 2 property/HOA
  - 2 bilingual Main Street
  - 2 Gen-Z micro
  - 1 senior simple mode
  - 2 regulated age-gate
  - 2 wholesale/WMS-ish
- Pricing bands en USD/mes (Starter / Growth)
- State clusters con justificación de demanda
- Age bands con copy distinto del mismo app (variantes de mensaje, no 15 forks de código)

Incluí matriz edad × servicio × app y 8 landings estado×vertical rellenas.

Al final: ranking de las 5 apps a lanzar primero (impacto × effort × willingness to pay).
```

---

## SUB-PROMPT D — Proceso funcional US completo + backlog dev (fase 4)

```markdown
Tomá el PROMPT MAESTRO y ejecutá SOLO Entregables 8, 9 y 10.

Diseñá el proceso funcional US como “operational excellence” document:

1. Onboarding wizard (campos, defaults por state)
2. First sale path (POS)
3. First invoice path (services)
4. First booking path (appointments)
5. House account (fiado US)
6. Tips
7. End of day close
8. Sales tax report MVP (honest scope)
9. Multi-location day-30
10. Support escalation

Compará con AR (AFIP cert, MP, fiado barrio, etc.).

Backlog: epics con tickets, DoD, dependencias, y archivos monorepo a tocar:
- lib/country/*
- lib/i18n/*
- lib/comercial/sub-saas-catalog.ts (capa US o marketVariants)
- app/claver/* landings
- components/onboarding/*
- sidebar filters por country feature

Marcá qué hace Gemini (docs/copy) vs Grok/Cursor (código).
```

---

## SUB-PROMPT E — “Una sola respuesta completa” (si querés todo de una)

```markdown
Ejecutá el PROMPT MAESTRO completo (Entregables 1–10) en una sola respuesta larga, bien estructurada con headings.

Si te quedás corto de espacio, priorizá:
1) Glosario dual (top 50)
2) Catálogo 15 apps US
3) Matriz edad × servicio
4) Proceso AR vs US
5) Backlog P0

Y dejá un anexo “pendiente de expansión” con lo que no entró.
```

---

## Checklist para el humano que corre Gemini

| Paso | Acción |
|------|--------|
| 1 | Pegar PROMPT MAESTRO |
| 2 | Correr A → B → C → D **o** E all-in |
| 3 | Guardar salida en `docs/comercial/us/` (crear carpeta) p.ej. `US_LOCALIZATION_PLAYBOOK.md` |
| 4 | Review legal/tax claims con humano |
| 5 | Pasar backlog P0 a Grok/Cursor para código |
| 6 | No mergear copy en-US sobre defaults es-AR sin keys i18n |

---

## Criterios de aceptación del trabajo de Gemini (para vos)

La entrega de Gemini está **aprobada** si:

1. **Supervivencia dual:** se entiende cómo AR y US conviven (keys, features, precios).  
2. **Traducción de negocio:** fiado, AFIP, remito, etc. no están calificados con Google Translate.  
3. **Apps nuevas:** ≥15 fichas con estado + edad + servicios.  
4. **Proceso funcional US:** onboarding → first value → expand, comparable a AR.  
5. **Honestidad:** gaps y “legal review” marcados.  
6. **Accionable:** backlog con P0 que un dev puede ejecutar en el monorepo.

---

## Notas de posicionamiento (para alinear a Gemini)

| Claver en AR gana por… | En US debe ganar por… |
|------------------------|------------------------|
| AFIP nativo + PyME local | Time-to-value + vertical apps + bilingual Main Street |
| Fiado de barrio | House accounts + simple credit without bank |
| Packs en ARS + WhatsApp | SMS + card-present + Shopify adjacency |
| Precio accesible | Transparent USD + free trial + clear vertical ROI |
| Un ERP omnicanal | “Enough ERP” inside a focused app shell |

**Anti-posicionamiento US:** no competir de frente el día 1 con Toast enterprise, Salesforce ni SAP. Competir con **Square + spreadsheet + WhatsApp/SMS chaos** del SMB.

---

## Prompt corto de arranque (si Gemini tiene contexto del repo)

```text
Leé PRODUCT.md, lib/country/country-features.ts, lib/i18n/config.ts, lib/comercial/sub-saas-catalog.ts y docs/comercial/PROMPT_GEMINI_MERCADO_US_LOCALIZACION_DUAL_APPS.md.

Ejecutá el PROMPT MAESTRO completo. Priorizá coexistencia AR+US, glosario dual, 15+ apps US por state cluster × age × services, y backlog P0. No pises el default es-AR.
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-29 | Creación del prompt maestro + sub-prompts A–E para mercado US y localización dual |
```

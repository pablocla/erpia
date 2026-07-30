# Prompt maestro — Mutar US apps (listas para vender) + Partners US

> Copiá el **PROMPT MAESTRO** (y opcionalmente un BLOQUE) a Grok / Cursor / Gemini.  
> Objetivo: dejar la **superficie comercial US** empaquetada, en inglés, con precios USD, activación automática y **programa partner adaptado al mercado yankee**.  
> No reinventar el ERP: reutilizar core AR (SKU, shells, trial, comisiones).

**Docs de contexto (leer antes de mutar):**

| Doc / código | Para qué |
|--------------|----------|
| `docs/comercial/US_MARKET_APPS_MULTINATIONAL.md` | Geo, catálogo, Stripe |
| `lib/comercial/us-saas-catalog.ts` | Apps US SSOT |
| `lib/comercial/markets.ts` | Mercados AR/US/MX/BR |
| `lib/partners/program-copy.ts` | Copy partner AR actual |
| `lib/partners/affiliate-config.ts` | Tasas N1/N2 |
| `app/claver/partners/page.tsx` | Landing partners |
| `components/marketing/us-market-hub.tsx` | Home US |
| `components/marketing/us-apps-marketplace.tsx` | Catálogo `/claver/apps` US |
| `AGENTS.md` · `PRODUCT.md` · `DESIGN.md` | Stack y UI |

---

## PROMPT MAESTRO (pegar primero)

```
Sos un senior product engineer + CRO en el monorepo pos-system-argentina
(Next.js 15 App Router, TypeScript strict, Prisma, Tailwind v4, shadcn, Vitest).

## Misión
Mutar y completar la **experiencia comercial United States (en-US, USD)** para que
quede lista para vender como SaaS PLG + canal partners, reutilizando el core Claver
al máximo. NO copiar AFIP/monotributo/WhatsApp como ancla. SÍ: Stripe, SMS/email,
House Tab free, Collect/Confirm/Deposit, shells lite, ?activar=SKU.

## Estado ya implementado (NO romper; extender)
- Geo/IP → cookies CLAVER_MARKET + NEXT_LOCALE (middleware + lib/i18n/geo-market.ts)
- Market US: lib/comercial/markets.ts, request-market.ts
- Catálogo US: lib/comercial/us-saas-catalog.ts + market-catalog.ts
- Home US: components/marketing/us-market-hub.tsx (si market=us)
- Marketplace US: components/marketing/us-apps-marketplace.tsx
- Landings EN: app/claver/apps/[slug] con localeCopy + USD
- Activación: resolveActivarIntent entiende slugs US (collect, house-tab, …)
- Stripe rails: lib/stripe/*, lib/payments/payment-link-router.ts, env STRIPE_*
- Partners AR: lib/partners/program-copy.ts, /claver/partners, portal, ref=?ref=

## Reglas de producto US (innegociables)
1. Un dolor → un producto → un precio (USD). Trial 14 días salvo anclas $0.
2. Activación GLOBAL_AUTO: /login/register?activar={us-slug}&trial=14
3. SKUs = los del core (no inventar SKUs nuevos sin mapear a entitlement existente).
4. Free enganche canónico: **Claver House Tab** ($0 forever) → upsell **Collect**.
5. Mensajería primary US: SMS/email (Twilio). WhatsApp opcional, no hero copy.
6. Pagos US: Stripe (STRIPE_SECRET_KEY etc. en .env). MP solo fallback AR.
7. Locale: en-US. Moneda: USD. Fechas display US-friendly en marketing.
8. Multi-tenant: getAuthContext + whereEmpresa en APIs.
9. UI product: DESIGN.md / PRODUCT.md — no SaaS purple slop.
10. No tocar flujos AR/es-AR salvo para compartir helpers market-aware.
11. Tests Vitest para catálogo, activar-intent, partners US copy si aplica.
12. Scope: solo lo del bloque asignado; listar archivos tocados al final.

## Catálogo a dejar "listo para vender" (fuente de verdad comercial)

### Ancla free (enganche)
| slug | Brand | SKU core | USD | Free | Paid trigger |
|------|-------|----------|-----|------|--------------|
| house-tab | Claver House Tab | pos.fiado_barrio | $0 | Libreta + límites + historial | Avisos + Stripe link → Collect |

### Wave 1 (PLG — vitrina principal)
| slug | Brand | SKU | USD | Paid trigger |
|------|-------|-----|-----|--------------|
| collect | Claver Collect | intang.cobranzas_wa | $39 | SMS/email sequences + Stripe links |
| confirm | Claver Confirm | micro.confirma_turnos | $29 | Night-before confirm/cancel |
| deposit | Claver Deposit | micro.sena_reserva | $24 | Deposit link + balance reminder |

### Wave 2 (upsell mismo rail de cobro)
| slug | Brand | SKU | USD |
|------|-------|-----|-----|
| recurring | Claver Recurring | micro.abono_recurrente | $39 |
| memberships | Claver Memberships | niche.gimnasio_barrio | $39 |
| rent | Claver Rent | micro.renta_dueno | $29 |
| cash-drawer | Claver Cash Drawer | micro.caja_control | $24 |
| winback | Claver Win-Back | intang.reactivador_clientes | $24 |

### Wave 3 (operación)
| slug | Brand | SKU | USD |
|------|-------|-----|-----|
| pos | Claver POS | pos.caja | $39 |
| menu-qr | Claver Menu | core.claver | $49 |
| route | Claver Route | micro.claver_ruta | $59 |
| b2b-portal | Claver B2B | premium.b2b_portal | $99 |
| storefront | Claver Storefront | ECOM-B2C-01 | $39 |

### Colectivos (UI marketing — no 16 cards en hero)
| Collective | Tagline | Leader slug |
|------------|---------|-------------|
| get-paid | Get paid faster | collect |
| book | Fill the calendar. Kill no-shows | confirm |
| counter | Front-of-house POS, menu, reviews | pos |
| field | Routes, B2B, rentals | route |

### Bundles comerciales US (implementar en catálogo o copy)
| Bundle id | Apps | Precio sugerido | Pitch |
|-----------|------|-----------------|-------|
| us-starter-solo | house-tab + collect | $39 | Free tabs + collections |
| us-service-pro | confirm + deposit + collect | $69 | No-shows + deposits + AR |
| us-local-shop | pos + house-tab + winback | $59 | Counter + tabs + reviews |
| us-get-paid-plus | collect + recurring (+ invoice-tax future) | $79 | Retainers + collections |

Hero pains (rotar, uno solo): "Get paid faster" | "Kill no-shows" | "Lock the job with a deposit".
CTA free: "Start with House Tab — free". CTA paid: "Start free trial".

## Partners US — mutación obligatoria
Adaptar el programa partner del mercado AR al US **sin pirámide de humo**.

### Diferencias AR → US
| AR hoy | US target |
|--------|-----------|
| Copy es-AR, ARS, MercadoPago, AFIP, fiado barrio | en-US, USD, Stripe, House Tab + Collect |
| Canon célula $500.000 ARS | Cell license **USD** (ej. $499–999 one-time) o merit 20 active paid accounts |
| "Patear la calle kioscos Rosario" | Local SMB: bars, salons, trades, gyms, food trucks |
| Bounty 100% primer mes MP | Same logic en **USD** sobre primer pago Stripe/subscription |
| Landing agresiva $50.000 ARS | "$X first commission + recurring %" en USD |
| ref activa fiado default | ref default **house-tab** (free hook) |
| Liquidación transferencia AR | Payout: Stripe Connect o bank transfer USD (manual ok v1) |

### Mantener (core partners)
- 2 niveles max (N1 seller 30%, N2 5%; implementer 20%/5%) — o parametrizar US en affiliate-config
- Comisión solo si el cliente **paga**
- ?ref=CODIGO en registro
- Portal /dashboard/partner-portal
- No membership fee para entrar partner

### Superficies partners a mutar
1. lib/partners/program-copy.ts → PARTNER_PROGRAM_US o market-aware PARTNER_PROGRAM
2. app/claver/partners/page.tsx → si market=us, copy EN + USD + apps US
3. buildReferralRegisterUrl → activar=house-tab (US) vs fiado (AR)
4. Commission calculator labels en USD cuando market=us
5. docs/comercial/PROGRAMA_PARTNER_CLAVER.md sección US o doc hermano
6. Optional: lib/partners/affiliate-config.ts rates US + precioLicenciaCelulaUsd

### Roles partner US (copy)
1. **Field Seller** — street / local SMB, free join, 100% first month bounty + 30% residual
2. **Cell Lead** — 20 paid accounts merit OR cell license USD; earns 5% N2
3. **Implementer** (optional) — onboarding help, 20% N1

Ética US: producto real (House Tab, Collect, Confirm); never "get rich recruiting".

## Criterios de aceptación (Definition of Done)
- [ ] /?market=us → home EN con House Tab free + Wave 1 destacadas + colectivos
- [ ] /claver/apps con market=us → solo/primarily apps US, precios USD, CTAs EN
- [ ] /claver/apps/house-tab y /collect landings EN + trial/activar
- [ ] /claver/partners con market=us → partner program EN, USD, apps US, ref→house-tab
- [ ] ?ref=CODE&activar=house-tab (o default US) en register
- [ ] No se rompe /?market=ar ni partners AR
- [ ] Tests verdes: us-market-catalog, activar-intent, partners si hay tests
- [ ] Docs actualizados: US_MARKET_APPS + PROGRAMA_PARTNER (sección US)

## Al terminar reportá
1. Archivos tocados
2. Qué quedó listo para vender vs beta
3. Checklist DoD
4. 3 líneas de copy ads US (House Tab / Collect / Partner)
5. Riesgos (Stripe keys, SMS, payout partners)
```

---

## BLOQUE 1 — Catálogo y vitrina US (apps listas para vender)

```
BLOQUE 1 — US catalog + storefront ready-to-sell

Usá el PROMPT MAESTRO. Scope SOLO vitrina y catálogo de producto US.

Tareas:
1. Revisar/completar lib/comercial/us-saas-catalog.ts:
   - Wave 1–3 como en el maestro
   - house-tab anclaGratis true, precioUsd 0
   - US_DESTACADOS = house-tab, collect, confirm, deposit (+ 4 más)
   - Colectivos get-paid / book / counter / field
   - roiCopy, pains, outcomes, pasosActivacion en inglés impecable
2. Bundles: agregar US_BUNDLES en us-saas-catalog o market-catalog
   (us-starter-solo, us-service-pro, us-local-shop, us-get-paid-plus)
   con lista de slugs + precioUsd + lema EN
3. UsMarketHub:
   - Hero: un dolor (Get paid faster) + CTA House Tab free + Browse apps
   - Featured: Wave 1
   - Sección bundles (3 cards)
   - Link partners: /claver/partners (market se mantiene por cookie)
4. UsAppsMarketplace:
   - Tabs Live / Beta / Bundles
   - Precios Free / $XX/mo
   - Ocultar packs AR (Almacén Rosario, AFIP) cuando market=us
5. Soft-limit copy en free: "Unlimited tabs · 0 automatic collection messages"
6. Tests: __tests__/comercial/us-market-catalog.test.ts (bundles, destacados, free anchor)

No tocar partners en este bloque.
```

---

## BLOQUE 2 — Activación, soft-limits y upsell House Tab → Collect

```
BLOQUE 2 — Activation + freemium hook US

Usá el PROMPT MAESTRO. Scope: trial, entitlements, upsell in-app.

Tareas:
1. Confirmar resolveActivarIntent("house-tab") → pos.fiado_barrio, modoLite fiado, marca "Claver House Tab"
2. Confirmar resolveActivarIntent("collect") → intang.cobranzas_wa
3. Al activar house-tab desde US: sample data EN si existe seed (clientes "Walk-in", "Regular #1") o empty state EN
4. En /dashboard/fiado (shell House Tab): banner EN
   "X customers overdue → Start Collect trial" → activar collect
5. Soft-limit: free house-tab no envía SMS/email de cobro (0 auto); botones de aviso abren upsell Collect
6. Login/register: si market=us y activar=house-tab, copy EN "Free house tabs · no card"
7. Tests activar-intent + smoke upsell href

Archivos base:
- lib/comercial/activar-intent.ts
- lib/comercial/market-catalog.ts
- app/dashboard/fiado (banner)
- lib/comercial/product-shell.ts (shell fiado ya existe)
```

---

## BLOQUE 3 — Partners US (landing + copy + ref default)

```
BLOQUE 3 — Partner program United States

Usá el PROMPT MAESTRO. Scope: partners mutados a US.

Tareas:
1. Crear PARTNER_PROGRAM_US (o market map) en lib/partners/program-copy.ts:
   - name: "Claver Partner Network"
   - tagline EN: recurring commissions selling software US SMBs actually need
   - oneLiner: House Tab free hook → Collect/Confirm paid; you earn when they pay
   - rates: mismos % N1/N2 (30/5 seller, 20/5 implementer) documentados en USD
   - roles: Field Seller, Cell Lead (merit 20 paid OR license USD), optional Implementer
   - howItWorks en inglés, Stripe-paid customers
   - notThis: no pyramid, no inventory, real product
   - default activar en referral URL: house-tab
2. buildReferralRegisterUrl(code, { market: "us" }) → activar=house-tab
3. app/claver/partners/page.tsx:
   - getEffectiveMarketId() o client cookie
   - if us → render PARTNER_PROGRAM_US (EN, USD examples)
   - if ar → PARTNER_PROGRAM actual sin romper
4. Commission calculator: labels USD + ejemplo "Collect $39 → you earn ~$11.70/mo N1"
5. affiliate-config: agregar precioLicenciaCelulaUsd (ej. 799) sin borrar ARS
6. Doc: docs/comercial/PROGRAMA_PARTNER_CLAVER.md sección "## United States"
   o docs/comercial/PROGRAMA_PARTNER_CLAVER_US.md
7. Test: referral URL default house-tab when market us; rates still 2 levels max

Ética copy US:
- Sell House Tab + Collect + Confirm + Deposit (product list)
- Never "guaranteed income from recruiting only"
```

---

## BLOQUE 4 — Bundles checkout + partner kit de venta US

```
BLOQUE 4 — Bundles + partner sales kit US

Usá el PROMPT MAESTRO. Scope: empaquetado vendible + herramientas partner.

Tareas:
1. Exponer US_BUNDLES en /claver/apps (market=us) con CTA activar multi-sku o leader sku
2. Partner portal (si hay UI): kit de links listos
   - /login/register?ref=CODE&activar=house-tab
   - ...&activar=collect
   - ...&activar=confirm
   - ...&activar=us-service-pro (si bundle soportado)
3. One-pager copy en EN dentro de program-copy o markdown:
   - Elevator pitch 20s
   - 3 objections ("I already have Square", "I use QuickBooks", "No time")
   - Demo path: House Tab in 5 minutes
4. No integrar Stripe Connect todavía; documentar payout manual USD v1

Entregable: partner puede copiar 4 links y un script de venta en inglés.
```

---

## BLOQUE 5 — SEO / metadata / consistency EN

```
BLOQUE 5 — US SEO + metadata polish

Usá el PROMPT MAESTRO. Scope: metadata y consistencia.

Tareas:
1. app/page.tsx generateMetadata market-aware (title/description EN si market=us)
2. app/claver/apps + partners metadata EN
3. OpenGraph locale en_US cuando market us
4. Sitemap/robots: no bloquear /claver/apps/house-tab etc.
5. Asegurar keywords: house account app, collections SMS, appointment no-show, deposit invoice
```

---

## Copy de referencia (usar en mutaciones)

### House Tab (free hook)
- **Headline:** Free digital house tabs for real shops.
- **Sub:** Limits, history, balances — no card required.
- **CTA:** Start free
- **Upsell:** When you're ready to get paid without awkward texts, Collect does it for you.

### Collect
- **Headline:** The message collects. You keep selling.
- **ROI:** One invoice paid on time covers a year of Collect.

### Confirm
- **Headline:** Fewer no-shows. More chairs filled.
- **ROI:** One avoided no-show per week pays ~4 months.

### Deposit
- **Headline:** Lock the job with a deposit link.
- **ROI:** One deposit collected saves a lost day.

### Partner US
- **Headline:** Earn recurring revenue selling Claver to local businesses.
- **Sub:** Your lead magnet is free House Tab. You get paid when they upgrade and stay.
- **CTA:** Get your partner link

---

## Orden de ejecución recomendado

| Orden | Bloque | Dueño sugerido |
|-------|--------|----------------|
| 1 | BLOQUE 1 — Vitrina + catálogo | Grok / Cursor |
| 2 | BLOQUE 2 — Free hook + upsell | Grok |
| 3 | BLOQUE 3 — Partners US | Grok |
| 4 | BLOQUE 4 — Bundles + kit partner | Grok / Gemini copy |
| 5 | BLOQUE 5 — SEO metadata | Gemini o Grok |

---

## QA manual rápido post-mutación

```bash
# Forzar US
open "http://localhost:3000/?market=us"
open "http://localhost:3000/claver/apps"
open "http://localhost:3000/claver/apps/house-tab"
open "http://localhost:3000/claver/apps/collect"
open "http://localhost:3000/claver/partners"

# Forzar AR (regresión)
open "http://localhost:3000/?market=ar"
open "http://localhost:3000/claver/partners"

# Tests
npx vitest run __tests__/comercial/us-market-catalog.test.ts __tests__/comercial/activar-intent.test.ts __tests__/stripe/stripe-config.test.ts
```

Stripe keys (si cobro real): ver `.env.example` `STRIPE_*` y `docs/deploy/VERCEL_ENV.md`.

---

## Fuera de scope (no hacer en esta mutación)

- Motor sales tax multi-estado propio (integrar Stripe Tax después)
- 1099 e-file IRS propio
- AFIP / monotributo en UI US
- Stripe Connect payout automático partners (doc only v1)
- Reescribir todo el ERP a inglés (solo marketing + shells de las apps empaquetadas)

---

*Fin del prompt. Actualizar este archivo si cambian precios USD o bundles canónicos.*

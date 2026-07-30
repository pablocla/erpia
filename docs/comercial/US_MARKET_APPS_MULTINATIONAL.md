# Claver Multinational — US apps + IP market routing

**Status:** implemented in code (2026-07-29)  
**Roles:** CRO + Growth + Platform  
**Principle:** one core, many markets — reuse SKUs, shells, trial, and `?activar=` rails.

| Layer | Path |
|-------|------|
| Markets (AR/US/MX/BR) | `lib/comercial/markets.ts` |
| US catalog (EN + USD) | `lib/comercial/us-saas-catalog.ts` |
| Unified catalog API | `lib/comercial/market-catalog.ts` |
| Geo / IP detection | `lib/i18n/geo-market.ts` |
| Server market cookie | `lib/i18n/request-market.ts` |
| Middleware cookies | `middleware.ts` → `CLAVER_MARKET` + `NEXT_LOCALE` |
| US home | `components/marketing/us-market-hub.tsx` |
| US marketplace | `components/marketing/us-apps-marketplace.tsx` |
| Landing EN | `app/claver/apps/[slug]/page.tsx` + `SubSaasLanding` localeCopy |

---

## 1. How market detection works

```text
Visitor request
  → middleware reads edge headers (IP country)
      x-vercel-ip-country | cf-ipcountry | x-country-code | …
  → if no CLAVER_MARKET / NEXT_LOCALE (or ?market= / ?lang=)
      set CLAVER_MARKET=us|ar|mx|br
      set NEXT_LOCALE=en-US|es-AR|es-MX|pt-BR
  → home + /claver/apps render market catalog
  → user can lock market via language toggle or ?market=ar|us
```

| Cookie | Meaning |
|--------|---------|
| `CLAVER_MARKET` | Active commercial market |
| `NEXT_LOCALE` | UI messages locale (`messages/en-US.json`, …) |
| `CLAVER_MARKET_LOCKED` | User chose market; IP will not override |

**Manual overrides (dev / QA):**

| URL | Effect |
|-----|--------|
| `/?market=us` | Force US English catalog + lock |
| `/?market=ar` | Force Argentina catalog + lock |
| `/?lang=en` | Same as market=us |
| Language flag toggle | Sets locale + market + lock |

**Country → market map (summary):**

| Market | Countries (sample) | Locale | Currency | Messaging | Payments |
|--------|-------------------|--------|----------|-----------|----------|
| `ar` | AR, UY, PY, BO, CL | es-AR | ARS | WhatsApp | MercadoPago |
| `us` | US, CA, GB, AU, NZ, IE | en-US | USD | SMS | Stripe (target) |
| `mx` | MX + most LATAM | es-MX | MXN | WhatsApp | MercadoPago MX |
| `br` | BR | pt-BR | BRL | WhatsApp | MercadoPago |

---

## 2. US product catalog (auto-activate, real subscription value)

All US apps **reuse existing SKUs**, `modoLite`, dashboards, and product shells.  
Activation: `/login/register?activar={us-slug}&trial=14` → core SKU entitlement.

### Collectives (do not dump 16 cards in the hero)

| Collective | Tagline | Leader |
|------------|---------|--------|
| **Claver Get Paid** | Get paid faster | Collect |
| **Claver Book** | Fill the calendar. Kill no-shows | Confirm |
| **Claver Counter** | POS, menu, reviews | POS |
| **Claver Field** | Routes, B2B, rentals | Route |

### Wave 1 — ship first (PLG)

| US slug | Brand | Core slug | SKU | USD/mo | Free anchor | Paid trigger (real value) |
|---------|-------|-----------|-----|--------|-------------|---------------------------|
| `house-tab` | Claver House Tab | `fiado` | `pos.fiado_barrio` | **$0** | Live tab ledger + limits | → Collect SMS + payment links |
| `collect` | Claver Collect | `cobra` | `intang.cobranzas_wa` | $39 | AR list in trial | D+1/D+7 SMS sequences + Stripe links |
| `confirm` | Claver Confirm | `turnos` | `micro.confirma_turnos` | $29 | Manual calendar | Night-before confirm / release slot |
| `deposit` | Claver Deposit | `sena` | `micro.sena_reserva` | $24 | Manual quotes | Deposit link + balance reminder |

### Wave 2

| US slug | Brand | Core | SKU | USD | Paid trigger |
|---------|-------|------|-----|-----|--------------|
| `memberships` | Memberships | `puntos` | `niche.gimnasio_barrio` | $39 | Dues SMS + payment link |
| `recurring` | Recurring | `abono` | `micro.abono_recurrente` | $39 | Auto cycle issue + collect |
| `rent` | Rent | `renta` | `micro.renta_dueno` | $29 | Rent-due SMS + link |
| `hoa` | HOA | `expensas` | `niche.consorcios` | $39 | Mass dues + delinquent batch |
| `cash-drawer` | Cash Drawer | `caja` | `micro.caja_control` | $24 | Open &gt;12h alerts + variance |
| `winback` | Win-Back | `reactiva` | `intang.reactivador_clientes` | $24 | Campaign + review routing |

### Wave 3

| US slug | Brand | Core | SKU | USD | Notes |
|---------|-------|------|-----|-----|-------|
| `pos` | Claver POS | `pos` | `pos.caja` | $39 | Full counter POS |
| `menu-qr` | Claver Menu | `menu-qr` | `core.claver` | $49 | QR menu + kitchen path |
| `route` | Claver Route | `ruta` | `micro.claver_ruta` | $59 | Field stops + collect |
| `b2b-portal` | Claver B2B | `portal-b2b` | `premium.b2b_portal` | $99 | Wholesale self-serve |
| `storefront` | Storefront | `tienda` | `ECOM-B2C-01` | $39 | Stock-aware store |

### Wave 4 (higher ticket / beta)

| US slug | Brand | Core | SKU | USD |
|---------|-------|------|-----|-----|
| `clinic` | Clinic Desk | `health` | `health.enterprise` | $149 |
| `fleet` | Fleet POD | `logistica-fleet` | `logistics.fleet_enterprise` | $149 |

---

## 3. What is reused (max reuse)

```text
Auth + multi-tenant (whereEmpresa)     → all markets
Trial + ?activar= + modoLite           → all markets
Product shells (product-shell.ts)      → via coreSlug
Dashboard routes                       → same paths
AR / CxC / agenda / POS / ecommerce    → same services
Marketplace provision rails            → same SKUs
i18n messages (en-US.json)             → English product UI
Locale flag toggle                     → locks market
```

| AR-only (do not sell as US W1) | Why |
|-------------------------------|-----|
| Monotributo 1-click / AFIP CAE | Fiscal AR |
| Claver Grow REPROCANN | Local regulation |
| WhatsApp-only branding | US primary = SMS |

---

## 4. Activation contract (GLOBAL_AUTO)

```text
1. Landing CTA → /login/register?activar=collect&trial=14
2. resolveActivarIntent("collect") → SKU intang.cobranzas_wa + modoLite cobranza
3. applyRetailOnboarding / trial entitlement on SKU
4. Redirect dashboardPath (/dashboard/cuentas-cobrar)
5. Shell lite filters sidebar
6. Soft-limit free → paid unlock automation (SMS / links)
```

**Rule:** free/trial must deliver a real job (list debtors, book a slot, open a tab).  
Subscription sells **automation of money or time**, not a prettier dashboard.

---

## 5. Surfaces by market

| Surface | AR | US |
|---------|----|----|
| `/` | `ClaverMatrixHub` | `UsMarketHub` |
| `/claver/apps` | `ClaverAppsMarketplace` | `UsAppsMarketplace` |
| `/claver/apps/[slug]` | ES landing | EN landing + USD price |
| Login `?activar=` | ES brand | EN brand when US slug |

---

## 6. Stripe billing (implemented rails)

| Item | Status | Env / path |
|------|--------|------------|
| Secret / publishable keys | Placeholders in `.env` / `.env.example` | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Webhook secret | Placeholder | `STRIPE_WEBHOOK_SECRET` |
| Provider router | `auto` / `stripe` / `mercadopago` | `PAYMENTS_PROVIDER` · `lib/payments/payment-link-router.ts` |
| Checkout sessions | REST (no SDK) | `lib/stripe/stripe-service.ts` |
| Debtor payment apply | Idempotent `stripe:cs_…` on recibo | `lib/stripe/aplicar-pago-stripe.ts` |
| Webhook endpoint | Public | `POST /api/webhooks/stripe` |
| Authenticated checkout API | JWT | `POST /api/stripe/checkout` |
| Go-live checklist | Presence flags | `getEnvPresenceChecklist().billing` |

| Still soft | Target |
|------------|--------|
| Messaging jobs | Twilio SMS primary for US (WA optional) |
| Tax | Optional sales tax / invoice PDF |
| Stripe Customer + Billing Portal | SaaS self-serve portal |
| Support hours copy | US business hours |

**Fill keys:** Stripe Dashboard → API keys → paste into `.env` / Vercel.  
**Webhook:** Developers → Webhooks → `https://TU_DOMINIO/api/webhooks/stripe` → event `checkout.session.completed` → copy `whsec_…` to `STRIPE_WEBHOOK_SECRET`.

---

## 7. QA checklist

- [ ] `/?market=us` → English home + USD apps  
- [ ] `/?market=ar` → Spanish home + Fiado/Cobrá  
- [ ] Header `x-vercel-ip-country: US` (or mock) without cookies → `CLAVER_MARKET=us`  
- [ ] `/claver/apps/collect` → English Collect landing  
- [ ] CTA trial → `activar=collect` resolves `intang.cobranzas_wa`  
- [ ] Language toggle EN locks market; IP no longer flips to AR  
- [ ] `/claver/apps/fiado` with market=us still works via core remap when catalog resolves  

### Dev commands

```bash
pnpm vitest run __tests__/comercial/us-market-catalog.test.ts
pnpm vitest run __tests__/comercial/activar-intent.test.ts
```

---

## 8. Go-to-market recommendation

| Phase | Apps | Channel |
|-------|------|---------|
| W1 | House Tab, Collect, Confirm, Deposit | SEO + Google Ads “accounts receivable software”, “appointment no show” |
| W2 | Memberships, Recurring, Rent, HOA, Win-Back | Upsell in-app + vertical communities |
| W3 | POS, Menu, Route, B2B, Storefront | Operator expansion |
| W4 | Clinic, Fleet | Sales-assisted optional |

**Hero pain US:** “Get paid faster” or “Kill no-shows” — never the full ERP.

---

## 9. Multinational operating model

```text
                    ┌─────────────────────┐
                    │   Claver Core ERP   │
                    │  SKUs · shells · DB │
                    └──────────┬──────────┘
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
     Market AR              Market US           Market MX
     es-AR / ARS            en-US / USD         es-MX / MXN
     WA + MP                SMS + Stripe*       WA + MP
     sub-saas-catalog       us-saas-catalog     (locale overlay)
```

\* Stripe = target payment adapter; entitlement SKUs unchanged.

One monorepo, one tenant model, many **product skins** — that is the multinational product.

---

## 10. Source of truth files

1. Add/edit US apps → `lib/comercial/us-saas-catalog.ts`  
2. Add country mapping → `lib/comercial/markets.ts`  
3. Activation resolution → `lib/comercial/market-catalog.ts` + `activar-intent.ts`  
4. Geo headers → `lib/i18n/geo-market.ts`  
5. Docs (this file) → keep in sync when waves change  

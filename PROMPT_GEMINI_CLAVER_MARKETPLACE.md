# PROMPT — Gemini / Cursor: Claver Apps Marketplace (servicios auto-provisionables)

> **Copiar y pegar en Gemini Antigravity o Cursor Agent.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-06-24  
> Prioridad: **P0** — Monetización SaaS más allá del ERP  
> Stack: Next.js 15 · Prisma · PostgreSQL · Claver Cloud · TypeScript strict  
> Referencia catálogo: `docs/CLAVER_KNOWLEDGE_HOUSE_SERVICIOS_AUTOMATICOS.docx` (45 servicios)

---

## PROMPT (copiar desde acá)

```
Sos arquitecto full-stack senior del grupo CLAVER. Tenés shell del repo.

## Objetivo

Implementar **Claver Apps Marketplace** con subsistema **Claver AutoPool** — pool vivo de automatizaciones instantáneas.

**Lema AutoPool:** «Prendelo una vez. Labura todos los días.»  
**Sublema:** «Sin técnico. Sin espera. Sin excusas.»  
**Manifiesto:** `lib/marketplace/autopool-manifest.ts` — **única fuente de verdad** del pool; crece diario vía vibe coding.

Dos superficies:
1. **Público** — `/claver/apps` (catálogo, pricing, CTA trial/compra)
2. **Tenant** — `/dashboard/marketplace` (mis apps, activar/desactivar, estado provisioning, credenciales/QR)

Integración obligatoria con:
- `ProductoComercial` + `SuscripcionModulo` + `canUseSku()` (entitlements)
- `procesarOrdenProvision()` + `OpsJob` playbooks (Claver Cloud)
- Metodología CCA (Pack ONBOARD post-activación)

**Regla de oro:** el happy path NO requiere analista. Clav Consult interviene solo en excepciones (escalación ticket con `requiereHumano: true`).

**NO romper multi-tenant.** Toda API tenant usa `getAuthContext()` + `whereEmpresa()`.

---

## Claver AutoPool — nichos de automatización (detección)

Cada servicio del pool lleva **lema propio** + **nicho** detectable en UI, command palette y ads.

| Nicho ID | Label | Lema del nicho | Ejemplo SKU |
|----------|-------|----------------|-------------|
| `protege` | Protege | Que nada te robe el sueño. | sec.backup, sec.mfa |
| `avisa` | Avisa | Enterate antes que el cliente. | data.reportes_prog, infra.uptime |
| `carga` | Carga | La foto reemplaza al teclado. | fiscal.ocr, fiscal.conciliacion |
| `atiende` | Atiende | Tu negocio responde aunque estés cerrado. | com.chat, data.helpdesk_ia |
| `cobra` | Cobra | El link cobra. Vos seguís. | fiscal.clavpay_link |
| `ordena` | Ordena | El tiempo se agenda solo. | ops.agenda_web |
| `mide` | Mide | Los números llegan solos. | data.nps, data.bi |
| `conecta` | Conecta | Un cable menos en tu vida. | com.whatsapp |
| `publica` | Publica | Tu vitrina siempre actualizada. | mkt.catalogo_pdf |
| `integra` | Integra | Tu tienda y tu ERP hablan el mismo idioma. | integ.shopify, integ.tienda_nube, integ.odoo |
| `implementa` | Implementa | Desde tu casa. Sin visita. | impl.migracion_odoo, impl.homologacion_afip |
| `releva` | Releva | Preguntá. Medí. Mejorá. | releva.encuesta_clientes |
| `marketea` | Marketea | Tu marca trabaja mientras vos laburás. | mkt.pixel_ads, mkt.campanas_email |

**Tipos de sección** (`AUTOPOOL_TIPOS`): `automation` | `integracion` | `implementacion` | `relevamiento` | `marketing`

**Campos obligatorios por entrada AutoPool** (`AutopoolEntry`):
`sku`, `nombre`, `lema`, `tipo`, `nicho`, `remotoDesdeCasa`, `vibeTags[]`, `integracionId?`, `poolSince`, `poolVersion`, `maturity`, `activacionMinutos`, `impactoUniversal` 1-5.

**Integraciones con código existente (apalancar full):** `shopify`, `tienda_nube`, `woocommerce`, `mercado_libre` en `lib/integrations/` + `lib/shopify/` + `lib/tiendanube/`. **Odoo:** stub en `catalog.ts` + playbooks `integ.odoo` / `impl.migracion_odoo` (implementar `lib/odoo/`).

**Rutas con detección:**
- `/claver/apps?pool=autopool` — vitrine AutoPool
- `/claver/apps?nicho=protege` — filtro nicho
- `detectAutopoolNicho(query)` — command palette / búsqueda

### Ritual vibe coding diario (obligatorio al sumar servicio)

1. Copiar `AUTOPOOL_ENTRY_TEMPLATE` al final de `AUTOPOOL_ENTRIES`
2. Elegir `nicho` + redactar `lema` (máx. 12 palabras, memorable)
3. `poolSince` = fecha del día; `poolVersion` = semver (patch por mejora, minor por feature)
4. Registrar en `ProductoComercial` vía `seedMarketplaceCatalog()`
5. Si hay playbook: bump `poolVersion` del SKU en manifest
6. UI marketplace muestra badge «Nuevo en el pool» si `maturity: seed` y `poolSince` < 14 días

**No agregar servicio al pool sin `lema` y `nicho`.** Es la identidad comercial del AutoPool.

---

## Definición — servicio «auto-provisionable»

Un SKU del marketplace cumple:
| # | Criterio | Validación |
|---|----------|------------|
| A1 | Alta vía API/workflow sin ticket | Playbook ejecuta sin `analistaId` |
| A2 | Tiempo activación < 15 min (P0) o < 1 h (P1) | `MarketplaceProvisionJob.duracionMs` |
| A3 | Estado visible en UI tenant | pending → running → ready / failed |
| A4 | Entitlement `canUseSku` bloquea uso si no está activo | Tests Vitest |
| A5 | Pack ONBOARD o email automático con credenciales/QR/link | Resend |
| A6 | Segmento de ads documentado en metadata del SKU | `segmentoAds` en catálogo |
| A7 | Intervención humana solo en `failed` + retry o escalación | Torre implementaciones opcional |

---

## Promesa Claver — qué SÍ podemos garantizar (sin mentir comercialmente)

**No prometemos que los 45 servicios son 100% automáticos en todos los países.**  
Prometemos un sistema de **certificación por SKU** visible en el marketplace, con badge y SLA medible.

### Niveles de certificación (`autoCertLevel`)

| Nivel | Badge UI | Significado | Intervención humana |
|-------|----------|-------------|---------------------|
| `GLOBAL_AUTO` | 🟢 **Auto global** | Playbook 100% API; **mismo flujo en cualquier país**; solo cambia idioma/moneda UI | **0%** en happy path |
| `REGION_AUTO` | 🔵 **Auto regional** | 100% automático **si existe adaptador** `CountryAdapter` para el `paisCode` del tenant | **0%** si país soportado; si no → «Próximamente en tu país» (no vende) |
| `SEMI_AUTO` | 🟡 **Auto asistido** | ≥80% automático; 1 paso externo no-API (ej. cliente pega token) o cola humana < 4h | **< 5%** casos |
| `HUMAN_GATE` | 🟠 **Con validación** | Requiere analista/regulador; no vender como «instantáneo» | **Siempre** en el flujo |

**Regla comercial:** solo SKUs con `GLOBAL_AUTO` o `REGION_AUTO` (país habilitado) pueden mostrar «Activación en minutos sin técnico».

**Regla técnica:** el agente **no puede** marcar `autoCertLevel: GLOBAL_AUTO` sin:
1. Playbook con `pasos.length ≥ 1` y `requiereHumanoSiFalla: false` en todos los pasos
2. Test e2e `provisionSku()` → `ready` sin mock de analista
3. Test `provisionSku()` con `paisCode` distinto (mín. AR + US + MX) si es GLOBAL_AUTO
4. Email/Pack ONBOARD en locale del tenant

### Servicios certificables GLOBAL_AUTO (28) — cualquier país, multi-idioma

Estos **no dependen** de regulación fiscal local ni de burócracia estatal. Con i18n + moneda display funcionan igual:

| # | SKU | Por qué es global |
|---|-----|-------------------|
| 1 | `sec.vpn_corp` | WireGuard/Tailscale es universal |
| 2 | `sec.dns_filter` | Políticas DNS no son país-específicas |
| 3 | `sec.ssl_auto` | Let's Encrypt global |
| 4 | `sec.mfa` | TOTP/WebAuthn universal |
| 5 | `sec.backup` | Snapshot DB propio |
| 6 | `infra.uptime` | HTTP checks |
| 7 | `infra.landing` | Deploy estático desde rubro |
| 8 | `infra.cdn` | Cloudflare global |
| 9 | `infra.storage` | S3/R2 por tenant |
| 10 | `infra.remote` | RustDesk/TeamViewer session |
| 11 | `com.chat` | Widget + ClavAI |
| 12 | `com.video` | Jitsi/Daily |
| 13 | `fiscal.firma` | DocuSeal self-hosted |
| 14 | `fiscal.ocr` | Gemini Vision (documento agnóstico) |
| 15 | `fiscal.conciliacion` | CSV homebanking universal |
| 16 | `data.bi` | Metabase embedded |
| 17 | `data.reportes_prog` | Cron + email |
| 18 | `data.nps` | Survey post-transacción |
| 19 | `data.helpdesk_ia` | ClavAI + docs |
| 20 | `data.lms` | Cursos hosted |
| 21 | `mkt.catalogo_pdf` | PDF desde catálogo |
| 22 | `mkt.pixel` | Meta/GA4 scripts |
| 23 | `mkt.giftcard` | Vouchers internos ERP |
| 24 | `mkt.referidos` | Wallet referidos |
| 25 | `ops.qr_trace` | QR + movimientos stock |
| 26 | `ops.menu_qr` | PWA carta |
| 27 | `ops.agenda_web` | Slug + turnos |
| 28 | `ops.iot_kit` | MQTT ingest (hardware aparte) |

**Promesa defendible:** *«Al menos 28 servicios del marketplace se activan solos en minutos, en cualquier país donde Claver tenga UI en tu idioma.»*

### Servicios REGION_AUTO (12) — 100% auto solo con adaptador de país

Automáticos **sin humano** cuando `CountryAdapter[paisCode]` está `status: ready`:

| SKU | Adaptador requerido |
|-----|---------------------|
| `com.sms` | `SmsProviderAdapter` (Twilio por región) |
| `com.email_tx` | `EmailDomainAdapter` (Resend region) |
| `com.whatsapp` | `WhatsAppAdapter` (Meta por país) |
| `com.ivr` | `VoiceAdapter` (números locales) |
| `fiscal.clavpay_link` | `PaymentAdapter` (MP/Stripe/PayPal por país) |
| `fiscal.recordatorios` | `TaxCalendarAdapter` (calendario vencimientos) |
| `fiscal.scoring` | `CreditBureauAdapter` (Nosis/Equifax/etc.) |
| `infra.email` | `WorkspaceResellerAdapter` (Google/M365) |
| `infra.dominio` | `DomainRegistrarAdapter` (.com.ar NIC, .mx, etc.) |
| `mkt.gbp` | Solo países con Google Business |
| `ops.gps` | `FleetAdapter` (proveedor local) |
| `sec.edr` / `sec.vault` | `MspSecurityAdapter` (opcional por región) |

**Promesa defendible:** *«En tu país, cuando el adaptador está habilitado, la activación es igual de automática que una VPN — sin analista.»*

### Servicios SEMI_AUTO o HUMAN_GATE (5) — no prometer 100% auto

| SKU | Nivel | Motivo honesto |
|-----|-------|----------------|
| `fiscal.cert_afip` | HUMAN_GATE | Certificado emitido por autoridad (AFIP); Claver automatiza wizard + storage, no la firma estatal |
| `sec.vpn_site` | SEMI_AUTO | Puede requerir IP pública/firewall del cliente |
| `ops.device_agent` | SEMI_AUTO | Instalar agente en PC con USB/COM del cliente |
| `infra.mdm` | SEMI_AUTO | Enrollment físico del dispositivo |
| `infra.dominio` (.ar) | SEMI_AUTO | NIC Argentina a veces requiere validación manual |

**UI obligatoria:** badge naranja + texto «Requiere un paso tuyo (~5 min)» o «Validación regulatoria».

---

## Claver multi-país + multi-idioma (requisito transversal)

Objetivo: **mismo marketplace**, catálogo filtrado por `empresa.paisCode` + UI en `empresa.locale`.

### Modelo de datos (extender en S00)

```typescript
// Empresa — campos nuevos o metadata
paisCode: string      // ISO 3166-1 alpha-2: AR, MX, US, CL, UY, ES...
locale: string        // BCP 47: es-AR, es-MX, en-US, pt-BR...
monedaDisplay: string // ISO 4217: ARS, MXN, USD (display; no bloquea SKUs globales)
zonaHoraria: string   // America/Argentina/Buenos_Aires

// ProductoComercial.metadata
paisesHabilitados: string[] | ["*"]   // * = GLOBAL_AUTO
autoCertLevel: "GLOBAL_AUTO" | "REGION_AUTO" | "SEMI_AUTO" | "HUMAN_GATE"
i18n: Record<locale, { nombre, descripcion, packOnboardSubject }>
```

### Capas i18n obligatorias

| Capa | Archivos / rutas | Idiomas fase 1 |
|------|------------------|----------------|
| Marketplace público | `lib/i18n/marketplace/{locale}.json` | es-AR, es-MX, en-US, pt-BR |
| Dashboard tenant | mismas keys + `useLocale()` | idem |
| Pack ONBOARD email | plantillas Resend por locale | idem |
| ClavAI asistente | `locale` en system prompt | detecta de `empresa.locale` |
| Playbooks | `ctx.locale` en cada paso | sin strings hardcodeados es-AR |

**NO usar Google Translate en runtime para UI.** Solo strings en catálogo i18n o JSON de traducción versionado.

### `CountryAdapter` registry (nuevo módulo)

```
lib/marketplace/country-adapters/
  types.ts              # CountryAdapter interface
  registry.ts           # paisCode → adapters
  ar/                   # Argentina: AFIP, MP, Nosis
  mx/                   # México: SAT stub, Conekta stub
  us/                   # USA: Stripe, generic tax
  global/               # fallback GLOBAL_AUTO playbooks
```

```typescript
export interface CountryAdapter {
  paisCode: string
  status: "ready" | "beta" | "planned"
  locales: string[]
  monedas: string[]
  /** SKUs REGION_AUTO que este país habilita sin humano */
  skusAutomaticos: string[]
  getTaxCalendar?(): TaxEvent[]
  getPaymentProvider?(): PaymentProvider
}
```

### Filtrado catálogo por país

`GET /api/marketplace/catalog?pais=MX&locale=es-MX` devuelve:
- Todos los `GLOBAL_AUTO`
- `REGION_AUTO` solo si `CountryAdapter[MX].skusAutomaticos` incluye el sku
- Ocultar o marcar `planned` el resto (no CTA compra)

### Promesa multi-país (texto legal sugerido para landing)

> **Claver Global:** 28+ servicios se activan automáticamente en cualquier país.  
> **Claver Regional:** pagos, SMS, WhatsApp y calendario fiscal se activan solos donde el adaptador del país está en verde.  
> **Idioma:** interfaz y emails de activación en español (AR/MX), inglés (US) y portugués (BR). Más idiomas en roadmap.  
> **No incluye:** homologación fiscal estatal sin trámites del organismo (ej. certificado AFIP) — esos flujos están asistidos, no instantáneos.

---

## Estado actual — YA IMPLEMENTADO ✅

Leer ANTES de codear (no reimplementar):

| Archivo | Qué tiene |
|---------|-----------|
| `app/claver/apps/page.tsx` | Landing marketplace (UI marketing estática) |
| `components/marketing/claver-apps-marketplace.tsx` | Cards desde `CLAVER_SERVICE_LINES` + pricing simulado |
| `lib/marketing/claver-services-catalog.ts` | 6 líneas Claver (Clavis, ClavPay, etc.) |
| `lib/platform/commercial-service.ts` | `ProductoComercial`, `seedCommercialCatalog()`, suscripciones |
| `lib/platform/sku-catalog.ts` | `SKU_TO_FEATURE` mapeo feature técnica |
| `lib/platform/entitlements.ts` | `canUseSku()`, `trackAutomationUsage()` |
| `lib/provisioning/provisioning-service.ts` | Alta tenant + `SuscripcionModulo` por SKU en orden |
| `lib/ops/ops-service.ts` | `crearOpsJob`, jobs simulados/reales |
| `app/claver-cloud/provisioning/` | Órdenes provision ERP (analista) |
| `prisma/schema.prisma` | `ProductoComercial`, `SuscripcionModulo`, `UsageEvent`, `OpsJob` |

**Gap principal:** marketplace es vitrina estática; no hay compra real, playbooks por SKU ni catálogo de 45 servicios.

---

## Convención de enumeración (tracking de cumplimiento)

Cada ítem tiene ID único: **`MKT-S{NN}-{XX}`**

- `S` = Sprint (00–13)
- `NN` = número sprint 00–13
- `XX` = ítem secuencial dentro del sprint

Al completar un ítem, marcar en el reporte de salida:
`[MKT-S03-07] ✅` o `[MKT-S03-07] ❌ motivo`

**Definición de sprint DONE:** 100% ítems ✅ del sprint O ítems ❌ documentados con bloqueante y plan de retry.

---

# SPRINT 00 — Fundación catálogo y schema (bloqueante)

**Meta:** Un solo source of truth para SKUs, playbooks y segmentación ads.

| ID | Entregable | Criterio de aceptación |
|----|------------|------------------------|
| MKT-S00-01 | `lib/marketplace/autopool-manifest.ts` + `marketplace-catalog.ts` | AutoPool = pool MVP vendible; catalog = 45 servicios. AutoPool exporta `lema`, `nicho`, `vibeTags`, `poolVersion`. **Reusar manifest existente, extender no reemplazar** |
| MKT-S00-02 | Extender `ProductoComercial.metadata` | JSON: `{ playbookId, autoCertLevel, paisesHabilitados, segmentoAds, proveedor, healthcheckUrl, trialDias, i18n }` |
| MKT-S00-03 | Modelo Prisma `MarketplaceProvisionJob` | Campos: `id`, `empresaId`, `sku`, `estado` (pending\|running\|ready\|failed\|cancelled), `pasoActual`, `pasosJson`, `errorMsg`, `duracionMs`, `metadata`, timestamps |
| MKT-S00-04 | Modelo Prisma `MarketplaceOrden` | `empresaId`, `items[]` sku+cantidad, `estado`, `totalArs`, `origen` (web\|dashboard\|trial_ads\|upsell) |
| MKT-S00-05 | Migración Prisma | `npx prisma migrate dev --name marketplace_core` |
| MKT-S00-06 | `seedMarketplaceCatalog()` | Upsert 45 SKUs en `productoComercial`; convive con `seedCommercialCatalog()` |
| MKT-S00-07 | Extender `SKU_TO_FEATURE` | Mapeo sku → feature flag / módulo ERP donde aplique |
| MKT-S00-08 | Tests `__tests__/marketplace/catalog.test.ts` | 45 SKUs únicos; cada uno tiene `autoCertLevel`; GLOBAL_AUTO tiene playbookId; REGION_AUTO tiene `paisesHabilitados` ≠ ["*"] |
| MKT-S00-09 | Campos `Empresa.paisCode`, `locale`, `monedaDisplay` | Migración + default `AR`, `es-AR`, `ARS` para tenants existentes |

**Sprint 00 DONE cuando:** MKT-S00-01..09 todos ✅.

---

# SPRINT 01 — Motor de playbooks (aprovisionamiento automático)

**Meta:** Comprar SKU → job idempotente → ready sin humano.

| ID | Entregable | Criterio de aceptación |
|----|------------|------------------------|
| MKT-S01-01 | `lib/marketplace/playbook-registry.ts` | Registro `playbookId → PlaybookDefinition` con pasos tipados |
| MKT-S01-02 | `lib/marketplace/playbook-runner.ts` | Ejecuta pasos secuenciales; reintento 3x; persiste en `MarketplaceProvisionJob` |
| MKT-S01-03 | Integración `crearOpsJob` | Tipo job nuevo `marketplace_provision`; worker en `app/api/ops/worker/execute` |
| MKT-S01-04 | `provisionSku(empresaId, sku)` | Crea `SuscripcionModulo` + dispara playbook + entitlement activo solo si ready |
| MKT-S01-05 | `deprovisionSku(empresaId, sku)` | Baja soft: `activo=false`, cleanup playbook reversible |
| MKT-S01-06 | Healthcheck post-provision | Cada playbook termina con paso `healthcheck` → URL o query interna |
| MKT-S01-07 | Email Pack ONBOARD por SKU | Template Resend: credenciales VPN, link agenda, QR WhatsApp, etc. |
| MKT-S01-08 | Tests `playbook-runner.test.ts` | Mock proveedores; idempotencia (2x mismo sku = 1 provision) |

**Sprint 01 DONE cuando:** MKT-S01-01..08 todos ✅.

---

# SPRINT 02 — APIs marketplace (tenant)

| ID | Entregable | Criterio de aceptación |
|----|------------|------------------------|
| MKT-S02-01 | `GET /api/marketplace/catalog` | Lista SKUs activos; filtro `categoria`, `segmentoAds`; público o auth opcional |
| MKT-S02-02 | `GET /api/marketplace/mis-apps` | Suscripciones + estado último `MarketplaceProvisionJob` por sku |
| MKT-S02-03 | `POST /api/marketplace/activar` | Body `{ sku, trial?: boolean }` → orden + provision async |
| MKT-S02-04 | `POST /api/marketplace/desactivar` | Body `{ sku }` → deprovision |
| MKT-S02-05 | `GET /api/marketplace/jobs/[id]` | Polling estado provisioning |
| MKT-S02-06 | Guard `canUseSku` en features | Rutas sensibles (VPN config, WhatsApp send) verifican entitlement |
| MKT-S02-07 | Tests API con `mockPrismaClient` | 401 sin auth, 403 sku no activo, 200 happy path |

**Sprint 02 DONE cuando:** MKT-S02-01..07 todos ✅.

---

# SPRINT 03 — UI tenant `/dashboard/marketplace`

| ID | Entregable | Criterio de aceptación |
|----|------------|------------------------|
| MKT-S03-01 | `app/dashboard/marketplace/page.tsx` | Grid apps instaladas + disponibles |
| MKT-S03-02 | Card app con semáforo | pending=amarillo, running=azul, ready=verde, failed=rojo |
| MKT-S03-03 | Modal activar trial 14d | Solo SKUs con `trialDias > 0`; 1 trial por sku por empresa |
| MKT-S03-04 | Drawer detalle post-ready | Muestra credenciales/QR/link desde `metadata` del job |
| MKT-S03-05 | Nav dashboard | Ítem «Marketplace» o «Claver Apps» en sidebar |
| MKT-S03-06 | Empty state + CTA | Link a `/claver/apps` |
| MKT-S03-07 | Responsive + shadcn | Consistente con design system existente |

**Sprint 03 DONE cuando:** MKT-S03-01..07 todos ✅.

---

# SPRINT 04 — UI pública `/claver/apps` (catálogo real)

| ID | Entregable | Criterio de aceptación |
|----|------------|------------------------|
| MKT-S04-01 | Reemplazar `SAAS_CATALOG` mock | Data desde `marketplace-catalog.ts` o API |
| MKT-S04-02 | Filtros por categoría | 7 categorías Knowledge House |
| MKT-S04-03 | Badge `autoCertLevel` | 🟢 Auto global / 🔵 Auto regional / 🟡 Asistido / 🟠 Con validación |
| MKT-S04-04 | CTA autenticado | Logueado → activar; anónimo → login → activar |
| MKT-S04-05 | Landing por segmento ads | Query `?segmento=distribuidora` pre-filtra SKUs |
| MKT-S04-06 | SEO metadata | title/description por categoría |
| MKT-S04-07 | Precios ARS reales | Desde `ProductoComercial` |

**Sprint 04 DONE cuando:** MKT-S04-01..07 todos ✅.

---

# SPRINT 05 — Playbooks: Seguridad & Red (servicios 1–8)

| SKU sugerido | Servicio | Playbook (pasos automáticos) |
|--------------|----------|------------------------------|
| `sec.vpn_corp` | VPN corporativa | crear tenant WG → generar par claves → QR config → email usuario admin |
| `sec.dns_filter` | DNS filtering | crear perfil NextDNS/CF → policy default → instrucciones cambio DNS router |
| `sec.ssl_auto` | SSL/TLS | ya parcial en edge; registrar cert en metadata tenant |
| `sec.mfa` | 2FA/MFA | habilitar política empresa → forzar enrollment próximo login |
| `sec.backup` | Backup cloud | programar OpsJob backup_db → confirmar snapshot id |
| `sec.edr` | EDR ligero | generar link agente + policy grupo (API MSP o stub fase 1) |
| `sec.vault` | Password manager | crear org Bitwarden → invitación admin (API o manual_exception fase 1) |
| `sec.vpn_site` | Túnel sucursal | mesh WireGuard entre PV declarados en `Sucursal` |

| ID | Criterio sprint |
|----|-----------------|
| MKT-S05-01 | Playbooks 8 registrados en registry |
| MKT-S05-02 | Mínimo 3 con ejecución **real** (vpn, mfa, backup) |
| MKT-S05-05 | Resto puede ser `semi` con stub + Pack ONBOARD instrucciones |
| MKT-S05-06 | Tests integración vpn+mfa |
| MKT-S05-07 | Documentar env vars por proveedor en comentario módulo |

**Sprint 05 DONE cuando:** MKT-S05-01..07 todos ✅.

---

# SPRINT 06 — Playbooks: Infraestructura (servicios 9–16)

| SKU | Servicio | Auto |
|-----|----------|------|
| `infra.uptime` | Monitoreo uptime | Alta check `/api/health` + status page subdomain |
| `infra.email` | Email corporativo | Wizard dominio; semi si reseller manual |
| `infra.dominio` | Dominio + DNS | API Cloudflare; semi si NIC manual |
| `infra.landing` | Landing por rubro | Deploy Vercel/CF Pages desde onboarding IA |
| `infra.cdn` | CDN tienda | Toggle CF cache rules tenant |
| `infra.storage` | Object storage | Bucket R2 por empresaId + límites plan |
| `infra.remote` | Soporte remoto | Generar sessión RustDesk one-time |
| `infra.mdm` | MDM móviles | Enrollment QR; semi fase 1 |

| ID | Criterio |
|----|----------|
| MKT-S06-01..08 | Un playbook por SKU |
| MKT-S06-09 | uptime + storage + landing = full auto mínimo |

**Sprint 06 DONE cuando:** MKT-S06-01..09 todos ✅.

---

# SPRINT 07 — Playbooks: Comunicaciones (servicios 17–22)

| SKU | Servicio |
|-----|----------|
| `com.whatsapp` | WhatsApp Business API (extender `channel.whatsapp`) |
| `com.sms` | SMS transaccional |
| `com.email_tx` | Email transaccional dedicado (subdominio Resend) |
| `com.ivr` | Números virtuales IVR |
| `com.chat` | Chat widget + ClavAI |
| `com.video` | Videoconferencia branded |

| ID | Criterio |
|----|----------|
| MKT-S07-01 | Unificar `channel.whatsapp` con marketplace (no duplicar SKU) |
| MKT-S07-02 | SMS + email_tx playbooks con Twilio/Resend |
| MKT-S07-03 | Chat widget script generado en `metadata.instalacionScript` |
| MKT-S07-04 | Tests entitlement bloquea envío si sku inactivo |

**Sprint 07 DONE cuando:** MKT-S07-01..04 todos ✅.

---

# SPRINT 08 — Playbooks: Fiscal & Legal (servicios 23–29)

| SKU | Servicio | Nivel auto |
|-----|----------|------------|
| `fiscal.firma` | Firma electrónica | full (DocuSeal) |
| `fiscal.cert_afip` | Certificado AFIP | semi (wizard + storage cifrado) |
| `fiscal.ocr` | OCR facturas compra | full (Gemini Vision) |
| `fiscal.conciliacion` | Conciliación bancaria | full (import CSV) |
| `fiscal.clavpay_link` | Links cobro | full (MP API existente) |
| `fiscal.recordatorios` | Recordatorios IVA/IIBB | full (cron + plantillas) |
| `fiscal.scoring` | Scoring crediticio | semi (API bureau o reglas internas) |

| ID | Criterio |
|----|----------|
| MKT-S08-01..07 | Playbooks registrados |
| MKT-S08-08 | OCR + recordatorios + clavpay_link end-to-end test |

**Sprint 08 DONE cuando:** MKT-S08-01..08 todos ✅.

---

# SPRINT 09 — Playbooks: Operaciones & IoT (servicios 30–35)

| SKU | Servicio |
|-----|----------|
| `ops.gps` | GPS flota |
| `ops.iot_kit` | Sensores IoT plug-and-play |
| `ops.qr_trace` | Etiquetas QR trazabilidad |
| `ops.device_agent` | Conector balanza/impresora |
| `ops.menu_qr` | Menú QR restaurantes |
| `ops.agenda_web` | Agenda online pública |

| ID | Criterio |
|----|----------|
| MKT-S09-01 | `ops.agenda_web` reusa `/agenda-online/[empresaId]` — solo entitlement + slug |
| MKT-S09-02 | `ops.menu_qr` genera QR por mesa desde hospitalidad |
| MKT-S09-03 | `ops.iot_kit` reusa ingest MQTT existente |
| MKT-S09-04 | Tests activación agenda + menu_qr |

**Sprint 09 DONE cuando:** MKT-S09-01..04 todos ✅.

---

# SPRINT 10 — Playbooks: Datos, IA y Marketing (servicios 36–45)

| SKU | Servicio |
|-----|----------|
| `data.bi` | Dashboards BI hosted |
| `data.reportes_prog` | Reportes programados |
| `data.nps` | Encuestas NPS automáticas |
| `data.helpdesk_ia` | Helpdesk IA 1ª línea |
| `data.lms` | Micro-LMS por rubro |
| `mkt.gbp` | Google Business Profile sync |
| `mkt.catalogo_pdf` | Catálogo PDF auto |
| `mkt.pixel` | Pixel remarketing setup |
| `mkt.giftcard` | Gift cards digitales |
| `mkt.referidos` | Programa referidos |

| ID | Criterio |
|----|----------|
| MKT-S10-01 | `data.reportes_prog` usa cron + Resend (reusar Morning Commander) |
| MKT-S10-02 | `mkt.referidos` extiende programa contadores 20% |
| MKT-S10-03 | `mkt.pixel` inyecta scripts en `/tienda` tras activar |
| MKT-S10-04 | Tests NPS trigger post-factura |

**Sprint 10 DONE cuando:** MKT-S10-01..04 todos ✅.

---

# SPRINT 11 — Billing, trials y funnels ads

| ID | Entregable | Criterio |
|----|------------|----------|
| MKT-S11-01 | Trial por SKU | `vigenciaHasta = now + trialDias`; downgrade automático |
| MKT-S11-02 | Uso medido `UsageEvent` | SKUs `por_uso` (SMS, OCR, scoring) incrementan contador |
| MKT-S11-03 | Límite soft/hard | 80% → email; 100% → bloqueo + CTA upgrade |
| MKT-S11-04 | Landing ads `app/claver/apps/segmento/[slug]` | 6 slugs: distribuidora, restaurante, contador, salud, agro, ecommerce |
| MKT-S11-05 | UTMs → `MarketplaceOrden.origen` | Persistir `utm_source`, `utm_campaign` |
| MKT-S11-06 | Webhook MP futuro | Stub `POST /api/marketplace/webhooks/pago` (no bloquear sprint) |
| MKT-S11-07 | Factura ARS interna | Registro en tabla existente o `MarketplaceOrden` pagada |

**Sprint 11 DONE cuando:** MKT-S11-01..05 ✅ (06-07 opcional documentado).

---

# SPRINT 12 — Ops, analista y hardening

| ID | Entregable | Criterio |
|----|------------|----------|
| MKT-S12-01 | `/dashboard/claver/marketplace` | Flota: provisioning jobs fallidos cross-tenant (analista) |
| MKT-S12-02 | Reintentar job fallido | Botón analista → `playbook-runner` retry |
| MKT-S12-03 | Métricas | MRR por SKU, churn trial, tiempo medio provision |
| MKT-S12-04 | Alertas ops | Job failed > 1h → email/Telegram (reusar `ops-notificaciones`) |
| MKT-S12-05 | Vitest suite completa | `__tests__/marketplace/*` ≥ 80% líneas playbook-runner |
| MKT-S12-06 | `npx tsc --noEmit` limpio | Sin errores nuevos |
| MKT-S12-07 | Manual QA checklist | 10 activaciones seguidas sin analista |

**Sprint 12 DONE cuando:** MKT-S12-01..07 todos ✅.

---

# SPRINT 13 — Multi-país, multi-idioma y certificación Auto

**Meta:** Vender y aprovisionar sin mentir: catálogo filtrado por país, UI traducida, playbooks locale-aware.

| ID | Entregable | Criterio de aceptación |
|----|------------|------------------------|
| MKT-S13-01 | `lib/marketplace/country-adapters/registry.ts` | Registro AR (ready), MX/US (beta), fallback global |
| MKT-S13-02 | `lib/i18n/marketplace/*.json` | es-AR, es-MX, en-US, pt-BR — keys catálogo + estados job |
| MKT-S13-03 | `GET /api/marketplace/catalog` | Query `pais` + `locale`; filtra REGION_AUTO no soportados |
| MKT-S13-04 | Selector país/idioma onboarding | Al crear tenant: `paisCode` + `locale` → filtra SKUs vendibles |
| MKT-S13-05 | Playbooks locale-aware | `ProvisionContext.locale` → emails Pack ONBOARD traducidos |
| MKT-S13-06 | Test matriz certificación | 28 GLOBAL_AUTO: `provisionSku` ready en AR, MX, US sin analista |
| MKT-S13-07 | Test REGION_AUTO gating | `fiscal.clavpay_link` ready en AR, `planned` en país sin PaymentAdapter |
| MKT-S13-08 | Landing `/claver/apps` i18n | Ruta o query `?locale=en-US`; precios en `monedaDisplay` (formato Intl) |
| MKT-S13-09 | Dashboard métricas por país | MRR y activaciones por `paisCode` en `/dashboard/claver/marketplace` |
| MKT-S13-10 | Página transparencia «Garantía Auto» | `/claver/apps/garantia` — lista 28+12+5 con badges (SEO confianza) |

**Sprint 13 DONE cuando:** MKT-S13-01..10 todos ✅.

**Criterio de promesa cumplida (release gate):**
```
GLOBAL_AUTO activados sin humano: ≥ 28/28 en 3 países (AR, MX, US)
REGION_AUTO activados sin humano: ≥ 1 país piloto por SKU (AR primero)
SEMI_AUTO / HUMAN_GATE: 0 ítems con badge verde «Auto global»
```

---

## DAG de ejecución (orden obligatorio)

```
S00 (schema) ──► S01 (playbooks) ──► S02 (APIs) ──┬──► S03 (UI tenant)
                                                   └──► S04 (UI pública)
S01 ──► S05..S10 (playbooks por categoría, paralelizables entre sí)
S03 + S04 ──► S11 (billing/ads)
S05..S11 ──► S12 (ops/hardening)
S00 + S01 + S04 ──► S13 (multi-país/i18n) — paralelo con S05..S10; **bloquea launch internacional**
```

**No iniciar S05..S10 sin S01.**  
**No iniciar S11 sin S02+S03.**  
**No anunciar «cualquier país» sin S13 DONE.**

---

## Mapa completo SKU ↔ Servicio (45)

Usar exactamente estos prefijos al seedear:

```
sec.vpn_corp, sec.dns_filter, sec.ssl_auto, sec.mfa, sec.backup, sec.edr, sec.vault, sec.vpn_site,
infra.uptime, infra.email, infra.dominio, infra.landing, infra.cdn, infra.storage, infra.remote, infra.mdm,
com.whatsapp, com.sms, com.email_tx, com.ivr, com.chat, com.video,
fiscal.firma, fiscal.cert_afip, fiscal.ocr, fiscal.conciliacion, fiscal.clavpay_link, fiscal.recordatorios, fiscal.scoring,
ops.gps, ops.iot_kit, ops.qr_trace, ops.device_agent, ops.menu_qr, ops.agenda_web,
data.bi, data.reportes_prog, data.nps, data.helpdesk_ia, data.lms,
mkt.gbp, mkt.catalogo_pdf, mkt.pixel, mkt.giftcard, mkt.referidos
```

Alias legacy (no duplicar, mapear):
- `channel.whatsapp` → `com.whatsapp`
- `channel.mercadopago` → `fiscal.clavpay_link`
- `automation.n8n_hub` → bundle ClavAI
- `ops.morning_commander` → `data.reportes_prog` + `data.helpdesk_ia`

---

## Plantilla playbook (TypeScript)

```typescript
export interface PlaybookStep {
  id: string
  label: string
  run: (ctx: ProvisionContext) => Promise<StepResult>
  rollback?: (ctx: ProvisionContext) => Promise<void>
  /** si true, fallo escala a humano sin reintentar */
  requiereHumanoSiFalla?: boolean
}

export interface PlaybookDefinition {
  id: string
  sku: string
  pasos: PlaybookStep[]
  maxDuracionMs: number
}
```

---

## Verificación por sprint (comandos)

```bash
npx prisma migrate dev
npx vitest run __tests__/marketplace/
npx tsc --noEmit
# Manual:
# 1. Login demo → /dashboard/marketplace → activar sec.mfa → job ready < 5 min
# 2. /claver/apps?segmento=distribuidora → solo SKUs logística/seguridad
# 3. canUseSku bloquea feature sin activar
```

---

## Lo que NO hacer

- ❌ Duplicar `SuscripcionModulo` con otra tabla de licencias
- ❌ Aprovisionamiento solo en UI sin job persistido
- ❌ SKUs sin `playbookId` marcados como `autoCertLevel: GLOBAL_AUTO` (mentira comercial)
- ❌ Vender REGION_AUTO en país sin adaptador `ready` (mostrar «Próximamente»)
- ❌ Prometer 100% auto en `HUMAN_GATE` (cert AFIP, etc.)
- ❌ UI solo en es-AR si el claim es «multi-idioma global»
- ❌ Rutas `/api/marketplace/*` sin auth en mis-apps/activar/desactivar
- ❌ Bloquear ERP core si falla un add-on marketplace
- ❌ Crear segundo marketplace fuera de `/claver/apps` + `/dashboard/marketplace`
- ❌ Docs markdown largos adicionales — solo código + tests + reporte enumerado

---

## Output esperado del agente

Al **iniciar cada sprint**, imprimir:
```
=== INICIO MKT-S{NN} ===
Ítems: MKT-S{NN}-01..XX
```

Al **cerrar cada sprint**, imprimir tabla:
```
| ID | Estado | Notas |
| MKT-S{NN}-01 | ✅ | ... |
| MKT-S{NN}-02 | ❌ | bloqueante: ... |
=== FIN MKT-S{NN} — {P}% cumplimiento ===
```

Al **fin de sesión**, resumen global: `Σ ítems ✅ / total ítems` de todos los sprints tocados.

Commits: `feat(marketplace): MKT-S{NN} <descripción corta>`

Empezá leyendo `lib/platform/commercial-service.ts`, `lib/platform/entitlements.ts`, `components/marketing/claver-apps-marketplace.tsx` y confirmá el primer sprint a implementar (debe ser S00).
```

---

## Notas para Pablo (no copiar a Gemini)

| Sprint | Esfuerzo | Dependencias | Impacto |
|--------|----------|--------------|---------|
| S00 Fundación | M | — | Bloqueante |
| S01 Playbooks | L | S00 | Corazón auto-provision |
| S02 APIs | M | S01 | |
| S03 UI tenant | M | S02 | |
| S04 UI pública | S | S00 | Paralelo con S03 |
| S05 Seguridad | L | S01 | VPN = producto ancla ads |
| S06 Infra | L | S01 | |
| S07 Comunicaciones | M | S01 | Reusa Twilio/Resend |
| S08 Fiscal | M | S01 | Alto intent Search |
| S09 Ops/IoT | M | S01 | Reusa módulos ERP |
| S10 Data/Mkt | M | S01 | |
| S11 Billing/ads | M | S02,S03 | Growth |
| S12 Ops | M | todos | Producción |
| S13 Multi-país/i18n | L | S00,S01,S04 | **Gate promesa global** |

**Total ítems enumerados:** 88 checkboxes (`MKT-S00-01` … `MKT-S13-10`)

### Matriz rápida — qué prometer en marketing

| Claim en ads | Requisito técnico | SKUs |
|--------------|-------------------|------|
| «Activación en 5 min sin técnico» | `GLOBAL_AUTO` + S13 + test e2e | 28 servicios |
| «Funciona en tu país» | `CountryAdapter` ready | 12 REGION_AUTO |
| «En tu idioma» | S13 i18n locale activo | es-AR, es-MX, en-US, pt-BR |
| «Homologación AFIP incluida» | Solo `HUMAN_GATE` — **no** decir «instantáneo» | `fiscal.cert_afip` |

**Fase 1 MVP vendible Argentina (mínimo):** S00 + S01 + S02 + S03 + S04 + playbooks reales de:
`sec.mfa`, `sec.backup`, `com.whatsapp`, `fiscal.clavpay_link`, `ops.agenda_web`, `data.reportes_prog`

**Fase 2 promesa «multi-país»:** Fase 1 + **S13** + 10 GLOBAL_AUTO adicionales probados en MX y US

**Copy honesto para landing (usar tal cual):**
> De 45 servicios, **28 se activan solos en minutos en cualquier país**. Otros 12 son automáticos donde Claver tiene integración local (Argentina primero). El resto requiere un paso tuyo o validación regulatoria — lo indicamos con badge antes de comprar.

**Env sugeridos marketplace:**
```env
MARKETPLACE_PROVISION_ENABLED=true
MARKETPLACE_TRIAL_DIAS_DEFAULT=14
WIREGUARD_API_URL=          # Sprint 05
NEXTDNS_API_KEY=            # Sprint 05
CLOUDFLARE_API_TOKEN=       # Sprint 06
```

**Regenerar catálogo fuente:**
```bash
node scripts/generate-claver-servicios-automaticos.mjs
```
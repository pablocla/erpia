# G13 — Auditoría de documentación y tecnología faltante

> ERP Argentina | Generado: 2026-06-19 | Dueño: Gemini/Cursor Fase 4

## Resumen ejecutivo

El **código** está adelantado respecto a la **documentación operativa**. Hay ~44 archivos `.md/.txt` dispersos (muchos en raíz, no en `docs/`), sin README principal del repo, sin CI/CD documentado, y `docs/funcional/README.md` marca la mayoría de módulos como PENDIENTE.

---

## 1. Documentación faltante por proceso

| Proceso / dominio | Qué existe hoy | Qué falta documentar | Prioridad | Ubicación sugerida |
|-------------------|----------------|----------------------|-----------|-------------------|
| **Onboarding / setup dev** | `TESTING.md` (desactualizado), `.env.example` | Guía única: clone → install → migrate → seed → demo login | P0 | `README.md` (raíz) |
| **Deploy producción** | `railway.toml`, fragmentos en `prompt.txt` | Runbook Vercel/Railway: env vars, health probe, rollback | P0 | `docs/deploy/RUNBOOK.md` |
| **Ventas + precios** | Código + tests | Flujo lista precios → resolver → POS/portal (diagrama) | P1 | `docs/funcional/ventas-facturacion.md` |
| **POS turno cajero** | `docs/funcional/sistema-pos.md` (abr 2026) | Actualizar: suspendidas, pendientes panel, pre-vuelo caja, Fase C8 | P1 | Actualizar `sistema-pos.md` |
| **Bandeja pendientes por rol** | `funcional.txt` | API `/api/pendientes`, matriz rol→pendientes, UX topbar | P1 | `docs/funcional/pendientes-por-rol.md` |
| **AFIP / fiscal** | Disperso en introspecciones | Homologación paso a paso, cert upload, CAE retry, WSCDC | P0 venta AR | `docs/fiscal/AFIP-GUIA.md` |
| **WhatsApp / Twilio** | `.env.example` | Sandbox setup, cron `enviar-whatsapp`, plantillas | P1 | `docs/integraciones/WHATSAPP.md` |
| **MercadoPago** | Código + página dashboard | Webhook, conciliación CxC | P2 | `docs/integraciones/MERCADOPAGO.md` |
| **Mercado Libre** | Stub recién creado | OAuth ML, sync stock, publicaciones | P2 | `docs/integraciones/MERCADO-LIBRE.md` |
| **Agro 4.0** | `scripts/agricultura4.0.txt` | NDVI, sensores, balanza — doc funcional unificada | P2 | `docs/funcional/agro.md` |
| **Agentes IA** | `docs/funcional/modulo-ia.md` | Colas, autopilot, límites Ollama/OpenAI | P1 | Actualizar `modulo-ia.md` |
| **API pública** | 264 routes, sin OpenAPI | Contrato REST por módulo, auth, ejemplos curl | P1 | `docs/api/OPENAPI.md` o Swagger |
| **Testing / QA** | `TESTING_GEMINI.md` ✅ | E2E mocks vs DB real, CI pipeline | P1 | `TESTING_GEMINI.md` + `docs/testing/CI.md` |
| **Soporte / oncall** | `scripts/health-check.ts` | Qué hacer si `/api/health` 503, escalamiento | P2 | `docs/ops/HEALTHCHECK.md` |
| **Seguridad / multi-tenant** | `AGENTS.md` | Threat model, `empresaId` checklist para PRs | P1 | `docs/seguridad/MULTI-TENANT.md` |
| **Rubros / parametrización** | Varios en `docs/funcional/rubros/` | Railroad engine, feature flags por rubro | P2 | Completar índice en `docs/funcional/README.md` |
| **Impresión fiscal** | TODO en código | Epson/Hasar TCP/USB, configuración POS | P2 | `docs/hardware/IMPRESORAS.md` |
| **LATAM fiscal (CL/MX)** | Adapters stub | SII Chile, CFDI México — roadmap | P3 | `docs/fiscal/LATAM-ROADMAP.md` |

### Índice funcional (`docs/funcional/README.md`) — estado real

| Módulo en índice | Estado declarado | Estado real código |
|------------------|------------------|-------------------|
| Tesorería CxC/CxP | COMPLETO | ✅ |
| Maestros clientes/proveedores | EN PROCESO | 🟡 |
| Maestros productos | PENDIENTE | ✅ código, ❌ doc |
| Ventas y facturación | PENDIENTE | ✅ código + tests, ❌ doc |
| Compras | PENDIENTE | ✅ código + tests, ❌ doc |
| Contabilidad | PENDIENTE | ✅ tests, ❌ doc |
| Impuestos | PENDIENTE | 🟡 CITI tests, ❌ doc |
| Config / roles | PENDIENTE | ✅ home-redirect, ❌ doc |

### Archivos en raíz que deberían migrarse o archivarse

`funcional.txt`, `introspeccion*.txt`, `mejoracursor.txt`, `costoerp.txt`, `prompt*.txt` — conocimiento valioso pero **no descubrible** para nuevos devs. Migrar extractos a `docs/` y dejar puntero en README.

---

## 2. Tecnología faltante (stack e integraciones)

| Tecnología | En código hoy | En package.json | Impacto si falta | Prioridad |
|------------|---------------|-----------------|------------------|-----------|
| **Redis / Upstash** | Mencionado en rate-limiter, introspección | ❌ | Rate limit prod, sesiones, cache | P0 prod |
| **BullMQ / pg-boss** | TODO workflow + agentes cron | ❌ | Colas WhatsApp, agentes IA, aprobaciones | P0 prod |
| **Sentry** | `error-logger` listo para conectar | ❌ | Sin alertas errores en prod | P0 prod |
| **CI/CD (GitHub Actions)** | Solo `.github/agents/` | ❌ | Sin verify automático en PR | P0 |
| **Supabase Storage** | `@supabase/supabase-js` instalado, poco usado | ✅ dep | Adjuntos documentos (BUG-003) | P1 |
| **Twilio WhatsApp** | Servicio + dev mode | env only | Cobranza/marketing real | P1 |
| **Mercado Libre API** | Stub `lib/mercadolibre/` | ❌ SDK | Sync marketplace | P2 |
| **OpenAPI / Swagger** | — | ❌ | Integradores B2B, QA manual | P2 |
| **Playwright CI** | Local OK | ✅ devDep | Falta en pipeline | P1 |
| **Vitest + DB integración** | `DATABASE_URL_TEST` en .env.example | ❌ tests | Regresiones Prisma reales | P2 |
| **Impresoras Epson/Hasar** | Stub TCP/USB | ❌ | Retail físico Argentina | P2 |
| **Ollama / OpenAI** | Agentes IA | env | IA on-prem vs cloud no documentado | P2 |
| **Datadog / Prometheus** | — | ❌ | Métricas negocio (ventas/min) | P3 |
| **SSE / WebSockets** | Polling en hospitalidad KDS | ❌ | Tiempo real cocina/mesas | P3 |

---

## 3. Procesos sin procedimiento escrito

| Proceso operativo | Implementado en código | Documentado |
|-------------------|------------------------|-------------|
| Login + redirect por rol | ✅ | ❌ |
| Abrir/cerrar caja + arqueo | ✅ | 🟡 parcial |
| Emisión factura AFIP + CAE | ✅ | ❌ paso a paso |
| Pedido → picking → remito → factura | ✅ | ❌ |
| Portal B2B pedidos con precios | ✅ | ❌ |
| Cron WhatsApp pendientes | ✅ | ❌ |
| Health check / liveness | ✅ `/api/health` | ❌ runbook |
| Demo provisioning `/api/auth/demo` | ✅ | ❌ |
| Onboarding IA por rubro | ✅ | 🟡 `modulo-ia.md` |
| Backup / restore DB | ❌ | ❌ |
| Rotación JWT / secrets | ❌ | ❌ |

---

## 4. G13 — tareas sugeridas (próximo sprint doc)

| ID | Tarea | Dueño | Esfuerzo |
|----|-------|-------|----------|
| G13-01 | Crear `README.md` raíz (setup + scripts + links docs) | Cursor | 2h |
| G13-02 | Actualizar `docs/funcional/README.md` índice real | Gemini | 1h |
| G13-03 | `docs/deploy/RUNBOOK.md` (Railway/Vercel + env) | Cursor | 3h |
| G13-04 | `docs/fiscal/AFIP-GUIA.md` homologación | Gemini | 4h |
| G13-05 | `docs/integraciones/WHATSAPP.md` | Cursor | 2h |
| G13-06 | GitHub Action: `verify` + `test:e2e` | Cursor | 2h |
| G13-07 | OpenAPI subset (auth, ventas, pos, health) | Gemini | 4h |
| G13-08 | Migrar `funcional.txt` → `docs/funcional/pendientes-por-rol.md` | Cursor | 1h |
| G13-09 | Guía analista implementación (vs Protheus, upgrades) | Cursor | ✅ `docs/analista/GUIA_ANALISTA_IMPLEMENTACION.md` |
| G14-01 | `CHANGELOG.md` + política upgrade SaaS | Producto | 4h |
| G14-02 | Panel admin versión/migraciones pendientes | Dev | 8h |
| G14-03 | Plantilla doc por cliente enterprise | Analista | 2h |

---

## 5. Referencia rápida — números del repo (G11)

| Métrica | Valor |
|---------|-------|
| API routes (`route.ts`) | 264 |
| Dashboard pages | 103 |
| Tests unitarios | 302 (53 archivos) |
| Tests E2E | 3 |
| Modelos Prisma | ~159 |
| Score demo | 85/100 |
| Score producción | 68/100 |
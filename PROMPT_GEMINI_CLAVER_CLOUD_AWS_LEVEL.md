# PROMPT — Gemini: Claver Cloud → Consola corporativa nivel AWS

> **Copiar y pegar en Gemini Antigravity.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-06-23  
> Stack: Next.js 15 · Prisma · PostgreSQL (Supabase) · Vercel · TypeScript strict  
> Inspiración: AWS Console + TOTVS TCloud ONBOARD + Azure Portal (no copiar UI, sí madurez operativa)

---

## PROMPT (copiar desde acá)

```
Sos arquitecto principal del grupo CLAVER. Tenés shell del repo. Objetivo: llevar **Claver Cloud** de MVP ops a **plataforma corporativa vendible, implementable y operable** sin romper multi-tenant (`empresaId` + `whereEmpresa`).

---

## Estado actual — LEER ANTES DE CODEAR (no reimplementar)

### Ya existe ✅

| Área | Archivos / rutas clave |
|------|------------------------|
| Consola ops tenant/analista | `components/ops/ops-console.tsx`, `/dashboard/operaciones`, `/dashboard/claver/operaciones` |
| Auth analista | `lib/auth/claver-analyst.ts`, `AnalistaAsignacion` |
| Modelos ops | `TenantEntorno`, `OpsJob`, `OpsPipeline`, `SistemaLog`, `ProyectoImplementacion` |
| Torre CCA | `/dashboard/claver/implementaciones`, `lib/ops/implementacion-service.ts` |
| Métricas plataforma | `lib/ops/ops-metrics-service.ts` |
| Logs unificados | `lib/ops/logs-aggregator.ts`, `components/ops/ops-logs-panel.tsx` |
| Panel técnico | `components/ops/ops-tecnico-panel.tsx` |
| Cron alertas ops | `app/api/cron/ops-alertas/route.ts` |
| Orquestador (parcial) | `lib/ops/orchestrator/*`, `.github/workflows/ops-jobs.yml` |
| Parametrización ERP | `lib/config/rubro-config-service.ts`, `/api/config/onboarding/apply` |
| SKUs / entitlements | `lib/platform/entitlements.ts`, `lib/platform/commercial-service.ts` |
| Proceso CCA documentado | `content/docs/operaciones/claver-cloud-proceso-implementacion.mdx` |
| Asignaciones analistas | `/dashboard/claver/asignaciones` |
| Reportes tickets | `/dashboard/claver/reportes` |

### Simulado / incompleto 🟡

- Backup, migrate, deploy en Vercel serverless → `lib/ops/orchestrator/step-executor.ts` devuelve "simulado"
- `lib/ops/orchestrator/supabase-client.ts` → backup shared simulado
- Entornos dev/val/prd = metadata en `TenantEntorno`, no infra Vercel/Supabase real por cliente
- Test suite pipeline sin runner real salvo `OPS_TEST_RUNNER_ENABLED=true`
- Pack ONBOARD manual; dossier en `docs/clientes/` (no UI)
- Signup (`/api/auth/signup`) crea CUIT `DEMO-{timestamp}`, no flujo corporativo
- Ver también: `PROMPT_GEMINI_CLAVER_CLOUD_PENDIENTE.md` (PR-A a PR-H)

### No existe ❌

- Billing console SaaS (cobro recurrente, facturas Claver, límites de uso en UI)
- Alta automática post-venta (CRM/contrato → tenant → proyecto CCA)
- ONBOARD self-service cliente (panel tipo TCloud con URL, credenciales, links)
- Parameter Store unificado para implementadores
- White-label / custom domain por tenant
- SSO / SAML enterprise
- Partner / reseller portal
- Status page / gestión de incidentes
- Migración asistida desde ERP legado (Tango, Bind, Excel)
- Compliance UI (actas UAT, evidencias ISO, retención en BD)
- Shell de consola unificada (hoy son páginas sueltas bajo `/dashboard/claver/*`)

**Acción previa en DB real:**
```bash
npx prisma migrate deploy
# o local:
npx prisma migrate dev
npx prisma generate
```

---

## Visión objetivo — "Claver Cloud Console"

Una sola consola con 6 pilares (como AWS):

| Pilar | Analogía AWS | Claver Cloud |
|-------|--------------|--------------|
| **Home** | Console Home | Dashboard analista: salud plataforma, alertas, accesos recientes |
| **Organizations** | AWS Organizations | Flota tenants, planes, hosting shared/dedicated |
| **Provisioning** | CloudFormation / Control Tower | Alta tenant, entornos, SKUs, proyecto CCA automático |
| **Operations** | CloudWatch + Systems Manager | Jobs, logs, métricas, pipelines, incidentes |
| **Implementation** | Professional Services hub | Torre CCA, playbooks rubro, Parameter Store, migración |
| **Billing** | AWS Billing | Suscripciones, uso, límites, upgrade |

---

## ENTREGABLES — dividir en PRs (orden DAG)

### PR-01 — Claver Cloud Shell unificado (P0)

**Objetivo:** Una shell de consola, no páginas sueltas.

**Entregables:**
1. `app/claver-cloud/layout.tsx` — sidebar fijo estilo consola (Home, Organizations, Provisioning, Operations, Implementation, Billing, Settings)
2. `components/claver-cloud/cloud-shell.tsx` — topbar con búsqueda global tenants (`empresaId`, CUIT, nombre)
3. Migrar rutas bajo `/claver-cloud/*` con redirects desde `/dashboard/claver/*`
4. Breadcrumbs contextuales: `Claver Cloud > Organizations > {cliente} > Operations`
5. Dark theme "console" separado del ERP cliente (reutilizar tokens OKLCH, no romper tema ERP)
6. Tests: navegación, guard analista

**Criterio:** Analista entra a `/claver-cloud` y opera todo sin volver al ERP dashboard.

---

### PR-02 — Provisioning automático post-venta (P0)

**Objetivo:** Cerrar lugar ciego venta → tenant.

**Entregables:**
1. Modelo Prisma `OrdenProvision` (estado, SKUs JSON, contacto, analista, `empresaId` nullable hasta completar)
2. `POST /api/claver-cloud/provisioning/orders` — crear desde formulario comercial
3. Job `provision_tenant` (nuevo tipo en `OpsJob` o pipeline dedicado):
   - Crear `Empresa` (CUIT real, rubro, `planHosting`)
   - `ensureTenantEntornos(empresaId)`
   - `inicializarFeaturesDesdeRubro` + `SuscripcionModulo` por SKU vendido
   - `crearProyectoImplementacion` (CCA-010 → CCA-020 automático)
   - Usuario admin + email bienvenida
4. UI wizard 4 pasos en `/claver-cloud/provisioning/new`
5. Webhook opcional `POST /api/webhooks/crm/provision` (payload documentado en comentario del route)

**Criterio:** Desde UI se crea cliente nuevo end-to-end en < 2 min sin tocar SQL.

---

### PR-03 — ONBOARD Panel cliente self-service (P0)

**Objetivo:** Equivalente TCloud ONBOARD.

**Entregables:**
1. `/dashboard/onboard` (cliente admin) — generado desde `ProyectoImplementacion` + `TenantEntorno`:
   - URL ERP, portal B2B, tienda
   - Usuario inicial / link reset password
   - Entorno AFIP actual (homologación/producción)
   - Estado certificado AFIP (vigencia, sin exponer KEY)
   - Links capacitación
   - Contacto analista asignado + SLA
   - Versión deployada por entorno
2. Analista marca "entregado" → completa CCA-030 + `packOnboardEntregado`
3. Email pack ONBOARD vía `lib/email/email-templates.ts`

**Criterio:** Cliente nuevo recibe mail con link `/dashboard/onboard` y ve todo sin abrir ticket.

---

### PR-04 — Worker ops real (P0)

**Objetivo:** Completar PR-A de `PROMPT_GEMINI_CLAVER_CLOUD_PENDIENTE.md`.

**Entregables:**
1. Worker Railway / GitHub Actions ejecuta backup / migrate / test real (no Vercel serverless)
2. Serverless solo encola; `OpsJob.estado` actualizado por webhook (`app/api/webhooks/ops/vercel/route.ts` o worker callback)
3. Backup → S3 / Supabase Storage con URL en `OpsJob.resultado`
4. Eliminar strings "Simulado" en prod cuando `OPS_ORCHESTRATOR_ENABLED=true`
5. Env: `OPS_WORKER_WEBHOOK_URL`, `OPS_WORKER_SECRET`, `OPS_ORCHESTRATOR_ENABLED`

**Criterio:** Job `backup_db` produce artefacto descargable; `resultado` no contiene "Simulado".

---

### PR-05 — Parameter Store implementador (P1)

**Objetivo:** Parametrizar sin perderse en 40 pantallas del ERP.

**Entregables:**
1. `/claver-cloud/implementation/[empresaId]/parameters`
2. Vista unificada: features, módulos, campos custom, tablas aux, workflows, maestros pendientes
3. % completitud por rubro (checklist dinámico desde `lib/onboarding/onboarding-ia.ts` / `CONFIG_POR_RUBRO`)
4. Acciones rápidas: activar feature, correr `onboarding/apply`, import CSV maestros
5. Diff vs template rubro (qué falta vs `ConfiguracionRubro`)

**Criterio:** Analista parametriza 80% del cliente sin salir de una pantalla.

---

### PR-06 — Billing & Usage Console (P1)

**Entregables:**
1. UI `/claver-cloud/billing` — suscripciones por tenant, SKUs, vigencia, límites
2. Dashboard uso: `usageEvent`, automation, integraciones
3. Alertas al 80% / 100% del límite mensual
4. Flujo upgrade de plan (aprobación manual analista)
5. Export CSV facturación mensual Claver (MRR por cliente)

**Criterio:** Área comercial ve MRR y uso sin query SQL.

---

### PR-07 — Infra real dev/val/prd por tenant (P2)

**Entregables:**
1. Integrar Vercel API: preview deployment por `TenantEntorno.metadata.vercelProjectId`
2. Supabase branching o DB shadow por `metadata.supabaseBranchRef`
3. Job `deploy` usa project/branch del entorno, no proyecto global
4. UI diagrama de topología (dev → val → prd)

**Criterio:** Entorno `val` tiene URL Vercel preview real distinta de `prd`.

---

### PR-08 — Observabilidad plataforma (P2)

**Entregables:**
1. Status page interna `/claver-cloud/status` (entornos en error, jobs fallidos, AFIP global)
2. Modelo `OpsIncident` + timeline público/interno
3. SLO widgets: uptime 30d, MTTR tickets, pipelines OK%

---

### PR-09 — Enterprise pack (P3)

**Entregables:**
1. SSO SAML (stub Auth0 / WorkOS)
2. `planHosting=dedicated` + UI vault connection
3. Audit export ISO (logs + cambios config + actas CCA en BD)
4. Custom domain CNAME wizard

---

### PR-10 — Migración legado (P3)

**Entregables:**
1. Asistente import: Tango / Bind / Excel con mapeo de columnas
2. Validación pre-go-live automatizada (checklist CCA-060 en UI)
3. Rollback snapshot pre-migración vía job `backup_db`

---

## Reglas obligatorias

```typescript
// API tenant (cliente opera su data)
const ctx = await getAuthContext(request)
if (!ctx.ok) return ctx.response
whereEmpresa(ctx.auth.empresaId, { ... })

// API cross-tenant (analista CLAVER)
const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
if (!ctx.ok) return ctx.response
```

- Locale **es-AR**, fechas **dd/mm/yyyy**, moneda **ARS**
- No romper ERP cliente existente ni rutas `/dashboard/*` de operación diaria
- Tests Vitest obligatorios por PR
- No crear markdown docs nuevos salvo actualizar CCA si cambia el flujo funcional
- UI: shadcn/ui + `components/layout/*`; consola puede usar tema oscuro dedicado (`claver-cloud` scope CSS)
- Un commit por PR: `feat(claver-cloud): <descripción>`

---

## Verificación por PR

```bash
npx prisma migrate deploy
npx vitest run __tests__/auth/claver-analyst.test.ts __tests__/ops/
npx tsc --noEmit
npm run build
```

---

## DAG recomendado

```
PR-01 Shell ──► PR-02 Provisioning ──► PR-03 ONBOARD cliente
PR-04 Worker (paralelo P0, desbloquea prod real)
PR-01 ──► PR-05 Parameter Store
PR-02 ──► PR-06 Billing
PR-04 + PR-07 Infra real
PR-08 Observabilidad
PR-09 Enterprise, PR-10 Migración (paralelos P3)
```

---

## Definición de "listo tipo AWS"

- [ ] Analista opera 100% desde `/claver-cloud` sin depender del ERP dashboard
- [ ] Cliente nuevo: venta → tenant → ONBOARD → parametrizado → go-live **sin SQL manual**
- [ ] Backup / restore / migrate **reales** con evidencia descargable
- [ ] Billing y límites de uso visibles en consola
- [ ] Búsqueda global de tenant (CUIT, nombre, empresaId) en < 1s
- [ ] Cero strings "simulado" en producción con `OPS_ORCHESTRATOR_ENABLED=true`
- [ ] Acta UAT y evidencias CCA en **BD**, no solo markdown en `docs/clientes/`
- [ ] Cliente ve panel ONBOARD self-service antes del primer día operativo

---

## Archivos de referencia obligatorios

Leer en este orden antes del primer PR:

1. `lib/ops/ops-service.ts`
2. `lib/ops/implementacion-service.ts`
3. `lib/ops/orchestrator/job-runner.ts`
4. `lib/ops/orchestrator/step-executor.ts`
5. `components/ops/ops-console.tsx`
6. `lib/auth/claver-analyst.ts`
7. `content/docs/operaciones/claver-cloud-proceso-implementacion.mdx`
8. `PROMPT_GEMINI_CLAVER_CLOUD_PENDIENTE.md`

Empezá implementando **PR-01** (shell unificado). Antes de codear PR-02, reportá plan de archivos y rutas. No reimplementar torre CCA ni ops-console existente — extender y reorganizar bajo `/claver-cloud`.
```

---

## Notas para Pablo

| PR | Esfuerzo estimado | Bloquea producto corporativo |
|----|-------------------|------------------------------|
| PR-01 Shell | M | Sí — percepción "consola real" |
| PR-02 Provisioning | L | Sí — venta → producto vivo |
| PR-03 ONBOARD cliente | M | Sí — primera impresión cliente |
| PR-04 Worker ops | L | Sí — backup/migrate en prod |
| PR-05 Parameter Store | L | Sí — facilidad implementación |
| PR-06 Billing | M | Sí — modelo SaaS completo |
| PR-07 Infra real | XL | Enterprise / SLA |
| PR-08 Observabilidad | M | Operaciones 24/7 |
| PR-09 Enterprise | XL | Cuentas grandes |
| PR-10 Migración | L | Adopción desde legado |

**Si solo hay tiempo para 3:** PR-02 → PR-04 → PR-03.

**Relacionado:** `PROMPT_GEMINI_CLAVER_CLOUD.md`, `PROMPT_GEMINI_CLAVER_CLOUD_PENDIENTE.md`, `docs/operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md`
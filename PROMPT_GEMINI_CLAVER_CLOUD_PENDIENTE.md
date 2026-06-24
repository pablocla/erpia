# PROMPT — Gemini: Claver Cloud — Pendientes post-fix (2026-06-23)

> **Copiar y pegar en Gemini Antigravity.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Stack: Next.js 15 · Prisma · PostgreSQL (Supabase) · Vercel · TypeScript strict

---

## PROMPT (copiar desde acá)

```
Sos arquitecto full-stack del ERP Clavis (grupo CLAVER). Tenés acceso al shell del repo.

## Contexto

Claver Cloud es la consola operativa multi-tenant (estilo TCloud/TOTVS) para que:
- **Cliente** opere su entorno en `/dashboard/operaciones`
- **Analista CLAVER** opere clientes asignados en `/dashboard/claver/operaciones`

## YA CORREGIDO EN ESTE COMMIT — NO REIMPLEMENTAR

Leer estos archivos antes de codear:

| Fix | Archivo |
|-----|---------|
| Migración DB ops | `prisma/migrations/20260623000000_ops_console/migration.sql` |
| Logs sin circular dep | `lib/ops/sistema-log.ts` |
| Filtro HandlerLog por tenant | `lib/ops/handler-log-filter.ts` |
| Pipeline espera jobs | `lib/ops/job-wait.ts` + `avanzarPipeline()` en `lib/ops/ops-service.ts` |
| Webhook Vercel activo | `app/api/webhooks/ops/vercel/route.ts` |
| Deploy actualiza entorno | `lib/ops/orchestrator/job-runner.ts` |
| Tests nuevos | `__tests__/ops/handler-log-filter.test.ts`, `job-wait.test.ts` |

**Acción previa en DB real:**
```bash
npx prisma migrate deploy
# o local:
npx prisma migrate dev
```

---

## LO QUE FALTA — IMPLEMENTAR EN ORDEN

### PR-A — Orquestador producción real (P0)

**Problema:** Con `OPS_ORCHESTRATOR_ENABLED=true`, backup shared sigue simulado; `pg_dump`/`prisma migrate` no corren en Vercel serverless.

**Entregables:**
1. `lib/ops/orchestrator/worker-client.ts` — disparar job en worker externo (Railway container / GitHub Actions) vía webhook con payload `{ jobId, empresaId, tipo, steps }`
2. `.github/workflows/ops-jobs.yml` — workflow `workflow_dispatch` que ejecuta backup/migrate/test en runner con Postgres CLI
3. Refactor `job-runner.ts`: en serverless solo encola; worker ejecuta pasos reales
4. Env: `OPS_WORKER_WEBHOOK_URL`, `OPS_WORKER_SECRET`
5. Tests con mocks HTTP del worker

**Criterio:** Job `backup_db` con orchestrator ON genera archivo real (o URL S3) en `OpsJob.resultado`, no string "Simulado".

---

### PR-B — Test runner real en pipeline (P0)

**Problema:** `test_suite` simula `readiness_modules` / `readiness_integrations`.

**Entregables:**
1. `lib/ops/test-runner.ts` — `npx vitest run __tests__/smoke/` con timeout 120s
2. Flag `OPS_TEST_RUNNER_ENABLED=true` solo en worker/CI, nunca Vercel serverless
3. Paso pipeline `tests_auto` usa resultado real (passed/failed, duración, lista tests) en `OpsJob.resultado`
4. `.github/workflows/ops-jobs.yml` — job `test_suite` invocable desde API ops
5. UI: badge verde/rojo en paso pipeline (`components/ops/ops-console.tsx`)
6. Tests Vitest del test-runner con mock `child_process`

**Criterio:** En local con flag ON, job `test_suite` refleja pass/fail real del smoke test.

---

### PR-C — Logs unificados + AFIP (P1)

**Entregables:**
1. `lib/ops/logs-aggregator.ts` — unificar `SistemaLog` + `AfipWebserviceLog` + `HandlerLog` (filtro empresa) + `AgenteLog` + tickets
2. `GET /api/ops/logs?categoria=&severidad=&desde=&hasta=`
3. `GET /api/claver/ops/[empresaId]/logs` (mismos filtros, guard analista)
4. Tab "Logs" en `ops-console.tsx` con DataTable, filtros fecha, export CSV
5. `event-bus.ts` — en fallo handler, `persistSistemaLog` con `empresaId` del payload cuando exista

---

### PR-D — Métricas plataforma (P1)

**Entregables:**
1. `lib/ops/ops-metrics-service.ts` — uso DB, MTTR tickets, jobs 30d, pipelines ok/fail, versión por entorno
2. `GET /api/claver/ops/metricas`
3. KPI strip global en `app/dashboard/claver/operaciones/page.tsx`
4. Cards o recharts si está en package.json

---

### PR-E — Panel datos técnicos cliente (P2)

**Entregables:**
1. `GET /api/ops/tecnico` — AFIP mode, CUIT, integraciones enmascaradas (últimos 4 chars), nunca secrets completos
2. Sección "Datos técnicos" en `ops-console.tsx` (mode tenant)
3. Botón rotar webhook secret (hash)

---

### PR-F — Notificaciones ops (P2)

**Entregables:**
1. Job fallido → email/Telegram a analista asignado del cliente
2. Ticket crítico → notificación analista
3. `app/api/cron/ops-alertas/route.ts` — SLA tickets + entornos `error` > 1h
4. Reusar `lib/email/email-service.ts` y `lib/telegram/`

---

### PR-G — Enterprise DB dedicada (P3)

**Entregables:**
1. `Empresa.planHosting`: `"shared" | "dedicated"`
2. `TenantEntorno.metadata.connectionMode` + ref vault
3. Badge Shared/Dedicated en flota analista
4. `migrate_db` branch dedicated usa connection del vault

---

### PR-H — Infra real dev/val/prd por tenant (P3 — diseño)

**Problema:** Hoy dev/val/prd son entornos lógicos (URLs simuladas), no deploys Vercel/Supabase separados por cliente.

**Entregables (diseño + stub):**
1. Documentar en comentario de `ensureTenantEntornos` la estrategia: subdominios Vercel preview + Supabase branches
2. Campos `TenantEntorno.metadata.vercelProjectId`, `supabaseBranchRef`
3. Job `deploy` usa project/branch del entorno, no proyecto global

---

## Reglas obligatorias

```typescript
// API tenant
const ctx = await getAuthContext(request)
if (!ctx.ok) return ctx.response
whereEmpresa(ctx.auth.empresaId, { ... })

// API cross-tenant analista
const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
if (!ctx.ok) return ctx.response
```

- Locale es-AR, fechas dd/mm/yyyy
- Sin markdown docs nuevos salvo que se pida
- Tests Vitest obligatorios por PR
- Un commit por PR: `feat(claver-cloud): <descripción>`

## Verificación por PR

```bash
npx vitest run __tests__/auth/claver-analyst.test.ts __tests__/ops/
npx tsc --noEmit
```

## DAG recomendado

```
PR-A (worker/orquestador) ──► PR-B (test runner)
PR-C (logs) ──┐
PR-D (métricas) ──┼──► PR-F (notificaciones)
PR-E, PR-G, PR-H — paralelos menores
```

Empezá leyendo `lib/ops/ops-service.ts`, `lib/ops/orchestrator/job-runner.ts` y confirmá qué PR vas a implementar primero (recomendado: PR-A).
```

---

## Notas para Pablo

| PR | Esfuerzo | Bloquea prod real |
|----|----------|-------------------|
| PR-A Worker/orquestador | L | Sí — backup/migrate en serverless |
| PR-B Test runner | M | Sí — pipeline val→prd confiable |
| PR-C Logs | M | No |
| PR-D Métricas | M | No |
| PR-E Datos técnicos | S | No |
| PR-F Notificaciones | M | No |
| PR-G Enterprise DB | L | Futuro |
| PR-H Infra real por tenant | XL | Futuro billing |

**Env producción:**
```env
CLAVER_ANALYST_EMAILS=analista@claver.com
OPS_ORCHESTRATOR_ENABLED=false   # true solo con worker (PR-A)
OPS_TEST_RUNNER_ENABLED=false    # true solo en CI/worker (PR-B)
```
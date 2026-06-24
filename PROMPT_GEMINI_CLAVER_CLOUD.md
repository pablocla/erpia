# PROMPT — Gemini: Claver Cloud — Panel de Administración (división de trabajo)

> **Copiar y pegar en Gemini Antigravity.**  
> Proyecto: `C:\Users\Pablo Clavero\Downloads\pos-system-argentina`  
> Fecha: 2026-06-23  
> Prioridad: **P0** — Consola operativa multi-tenant estilo TCloud/TOTVS  
> Stack: Next.js 15 · Prisma · PostgreSQL (Supabase) · Vercel · TypeScript strict

---

## PROMPT (copiar desde acá)

```
Sos un arquitecto full-stack senior del ERP ClavERP (grupo CLAVER). Tenés acceso al shell del repo.

## Objetivo

Completar y dividir en PRs independientes el **Claver Cloud Admin Panel**: consola de operaciones por tenant (como virtualización VPS) con dos audiencias:

1. **Cliente (tenant)** — ve y opera SU entorno en `/dashboard/operaciones`
2. **Analista CLAVER** — ve solo clientes asignados en `/dashboard/claver/operaciones` + VPS por cliente en `/dashboard/claver/operaciones/[empresaId]`

Inspiración de producto: **TCloud de TOTVS** — logs, errores funcionales, entornos dev/val/prd, backup DB, migraciones, deploy, pipeline val→prd, testing, estadísticas.

**NO crear landing nueva.** **NO romper multi-tenant security.** Todo API cross-tenant debe pasar por guard de analista + asignación por empresa.

---

## Estado actual — YA IMPLEMENTADO ✅

Leer estos archivos ANTES de codear (no reimplementar):

### Modelo de datos (Prisma — falta migración en DB real)
- `prisma/schema.prisma`:
  - `TenantEntorno` — entornos dev/val/prd por empresa
  - `AnalistaAsignacion` — qué analista opera qué cliente
  - `OpsJob` — jobs: backup_db, migrate_db, restart_app, deploy, healthcheck, test_suite
  - `OpsPipeline` — pipeline VAL→PRD con 7 pasos JSON
  - `SistemaLog` — logs persistidos (api, ops, funcional, etc.)

**Acción bloqueante previa:** correr `npx prisma migrate dev --name ops_console` si la DB local no tiene tablas.

### Auth / guards
- `lib/auth/claver-analyst.ts`
  - `isClaverAnalyst(email, rol)` — env `CLAVER_ANALYST_EMAILS` o rol `analista_claver`
  - `getAnalystEmpresaScope(email)` — sin asignaciones = acceso total; con asignaciones = solo esos empresaId
  - `canAnalystAccessEmpresa`, `getClaverAnalystEmpresaContext`
  - `canAccessClientOps(rol)` — dueno/admin/gerente

### Servicios
- `lib/ops/ops-types.ts` — tipos + `PIPELINE_VAL_PRD_PASOS` (7 pasos)
- `lib/ops/ops-service.ts`:
  - `ensureTenantEntornos(empresaId)` — crea dev/val/prd lazy
  - `getOpsOverview(empresaId)` — entornos, jobs, pipelines, logs, errores funcionales, KPIs
  - `crearOpsJob`, `crearPipelineValPrd`, `avanzarPipeline`, `cambiarEstadoEntorno`, `persistSistemaLog`
  - **Jobs de backup/migrate/restart/deploy son SIMULADOS** (registran pasos + audit trail; no llaman Vercel/Supabase real)
  - **Healthcheck SÍ es real** (`prisma.$queryRaw SELECT 1`)
- `lib/soporte/tickets-service.ts` — SLA, métricas tickets (reutilizado)
- `lib/monitoring/error-logger.ts` — ahora persiste en `SistemaLog` (fire-and-forget)

### APIs cliente (scoped empresaId del JWT)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/ops/overview` | GET | Dashboard ops del tenant |
| `/api/ops/jobs` | POST | Disparar job |
| `/api/ops/entornos/[id]` | PATCH | Cambiar estado entorno |
| `/api/ops/pipelines` | POST | Crear/avanzar pipeline |

### APIs analista CLAVER (cross-tenant con guard)
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/claver/analista/status` | GET | `{ isAnalyst }` |
| `/api/claver/ops/clientes` | GET | Flota de clientes (filtrada por asignación) |
| `/api/claver/ops/[empresaId]` | GET | Overview de un cliente |
| `/api/claver/ops/[empresaId]/jobs` | POST | Job en nombre del cliente |
| `/api/claver/ops/[empresaId]/pipelines` | POST | Pipeline val→prd |
| `/api/claver/ops/[empresaId]/entornos/[id]` | PATCH | Estado entorno |
| `/api/claver/ops/asignaciones` | GET/POST | CRUD asignaciones (solo API, sin UI) |
| `/api/claver/reportes/*` | GET/PATCH/POST | Bandeja tickets cross-tenant |

### UI
| Ruta | Audiencia |
|------|-----------|
| `/dashboard/operaciones` | Cliente admin |
| `/dashboard/claver/operaciones` | Analista — flota |
| `/dashboard/claver/operaciones/[empresaId]` | Analista — VPS cliente |
| `/dashboard/claver/reportes` | Analista — tickets |
| `components/ops/ops-console.tsx` | Consola compartida tenant/analyst |

### Nav (dashboard layout)
- Configuración → **Centro de Operaciones** (roles admin/dueno/gerente)
- Claver Interno → **Flota de clientes** + **Reportes** (`claverAnalystOnly`)

### Tests existentes
- `__tests__/auth/claver-analyst.test.ts`
- `__tests__/ops/ops-service.test.ts`
- `__tests__/soporte/tickets-service.test.ts`

---

## LO QUE FALTA — DIVIDIR EN 8 PRs PARALELOS

Cada PR debe: tests Vitest, `getAuthContext` + `whereEmpresa` en rutas tenant, guard analista en rutas cross-tenant, UI con shadcn/Tailwind existente, sin markdown docs nuevos salvo que se pida.

---

### PR-1 — Orquestador real Vercel + Supabase (P0)

**Problema:** `simulateJobSteps()` en `ops-service.ts` solo audita; no ejecuta backup/deploy/migrate real.

**Entregables:**
1. `lib/ops/orchestrator/vercel-client.ts` — redeploy, env vars, deployment status (API Vercel REST)
2. `lib/ops/orchestrator/supabase-client.ts` — backup vía Management API o `pg_dump` documentado; `prisma migrate deploy` en job migrate_db
3. `lib/ops/orchestrator/job-runner.ts` — reemplazar `simulateJobSteps` con ejecución real cuando `OPS_ORCHESTRATOR_ENABLED=true`
4. Env vars documentadas en comentario del módulo:
   - `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`
   - `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`
   - `OPS_ORCHESTRATOR_ENABLED=false` por defecto (safe mode)
5. Webhook opcional `app/api/webhooks/ops/vercel/route.ts` para actualizar estado de job al terminar deploy
6. Tests con mocks HTTP (no llamar APIs reales en CI)

**Criterio de aceptación:** Job `deploy` con orchestrator ON cambia estado entorno a `desplegando` → `activo` y guarda URL + commit SHA en `OpsJob.resultado`.

---

### PR-2 — UI gestión asignaciones analistas (P0)

**Problema:** Asignaciones solo por API POST manual.

**Entregables:**
1. `app/dashboard/claver/asignaciones/page.tsx`
2. `app/api/claver/ops/asignaciones/[id]/route.ts` — DELETE desactivar
3. Tabla: analista email, empresa, rol (lead/soporte/implementacion/dba), activo
4. Form alta: select empresa (de flota), email analista, rol
5. Link en sidebar Claver Interno → "Asignaciones"
6. Test: analista con asignación solo ve 1 cliente en `/api/claver/ops/clientes`

**Criterio:** Super-analyst (sin filas en `AnalistaAsignacion`) sigue viendo todos.

---

### PR-3 — Logs unificados + AFIP + HandlerLog (P1)

**Problema:** Overview mezcla fuentes pero sin paginación ni filtros; `LogActividad` no tiene `empresaId` directo; `HandlerLog` no tiene empresaId.

**Entregables:**
1. `lib/ops/logs-aggregator.ts` — unificar `SistemaLog` + `AfipWebserviceLog` + `HandlerLog` + `AgenteLog` + tickets abiertos
2. Agregar `empresaId` opcional a queries de `LogActividad` vía join `usuario.empresaId` (no migrar schema si no es necesario)
3. APIs:
   - `GET /api/ops/logs?categoria=&severidad=&desde=&hasta=`
   - `GET /api/claver/ops/[empresaId]/logs` (mismos filtros)
4. UI: tab "Logs" en `ops-console.tsx` con DataTable, filtros fecha, export CSV
5. Ingesta: wrap `event-bus` handler failures → `persistSistemaLog` con empresaId cuando el payload lo tenga

**Criterio:** Cliente ve solo logs de su empresa; analista solo del empresaId autorizado.

---

### PR-4 — Estadísticas y métricas de plataforma (P1)

**Problema:** KPIs básicos; falta dashboard de plataforma tipo TCloud.

**Entregables:**
1. `lib/ops/ops-metrics-service.ts`:
   - Uso DB estimado (count tablas clave por empresa)
   - MTTR tickets, SLA vencidos cross-tenant
   - Jobs últimos 30 días por tipo/estado
   - Pipelines completados vs fallidos
   - Versión deployada por entorno
2. `GET /api/claver/ops/metricas` — solo super-analyst o analista con ≥1 asignación
3. `app/dashboard/claver/operaciones/page.tsx` — agregar strip KPIs globales arriba de la flota
4. Gráficos simples (recharts si ya está en package.json; si no, cards numéricas)

**Criterio:** Métricas calculadas en servicio, no en UI; cache 60s opcional.

---

### PR-5 — Testing integrado en pipeline (P1)

**Problema:** `test_suite` job simula pasos; no corre vitest real.

**Entregables:**
1. `lib/ops/test-runner.ts` — ejecutar subset de tests en proceso separado o invocar `npx vitest run __tests__/smoke/` con timeout
2. Guardar resultado en `OpsJob.resultado` (passed/failed, duración, lista tests)
3. Pipeline paso `tests_auto` debe esperar resultado real antes de marcar `ok`
4. UI: badge verde/rojo en paso del pipeline
5. **Solo ejecutable en entorno con `OPS_TEST_RUNNER_ENABLED=true`** (nunca en Vercel serverless producción — usar GitHub Action webhook)

**Criterio:** En local con flag ON, job test_suite refleja pass/fail real del smoke test.

---

### PR-6 — Panel cliente: credenciales técnicas y ambientes (P2)

**Problema:** Cliente no ve datos técnicos enmascarados (DB host, API keys rotación, entorno AFIP).

**Entregables:**
1. Sección "Datos técnicos" en `ops-console.tsx` (solo tenant mode):
   - Entorno AFIP (homologacion/produccion) de `Empresa.entornoAfip`
   - Rubro, CUIT, versión app, región
   - Credenciales integraciones (MercadoLibre, etc.) — solo últimos 4 chars / estado conectado (usar `ConexionIntegracion`)
2. `GET /api/ops/tecnico` — nunca devolver secrets completos
3. Botón "Rotar webhook secret" (genera nuevo, guarda hash)

**Criterio:** Ningún token OAuth en claro en response JSON.

---

### PR-7 — Notificaciones ops (P2)

**Entregables:**
1. Al crear ticket crítico → email/Telegram a analista asignado del cliente
2. Al fallar job ops → `persistSistemaLog` + notificación
3. Usar `lib/email/email-service.ts` y `lib/telegram/` existentes
4. Config en `ConfiguracionIANotificacion` o nuevo `OpsNotificacionConfig` por empresa
5. Cron `app/api/cron/ops-alertas/route.ts` — SLA tickets + entornos en `error` > 1h

---

### PR-8 — Enterprise: DB dedicada por cliente (P3 — diseño + stub)

**Contexto:** Shared DB hoy; Enterprise = DB dedicada con costo al cliente.

**Entregables:**
1. Campo `Empresa.planHosting`: `"shared" | "dedicated"`
2. `TenantEntorno.metadata.connectionMode` y connection string ref (Vault, no plain text)
3. UI badge "Shared" vs "Dedicated" en flota analista
4. Job `migrate_db` branch: si dedicated, usar connection string del vault
5. Doc inline en código (comentario) — no archivo .md

---

## Reglas de arquitectura (OBLIGATORIAS)

```typescript
// API tenant — SIEMPRE
const ctx = await getAuthContext(request)
if (!ctx.ok) return ctx.response
const where = whereEmpresa(ctx.auth.empresaId, { ... })

// API cross-tenant analista — SIEMPRE
const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
if (!ctx.ok) return ctx.response
```

- Locale: es-AR, fechas dd/mm/yyyy
- Roles cliente ops: `dueno`, `admin`, `administrador`, `gerente`
- Rol analista: `analista_claver` o email en `CLAVER_ANALYST_EMAILS`
- Componentes: `@/components/ui/*`, `@/components/layout/*`, `cn()` de `@/lib/utils`
- Tests: Vitest + `mockPrismaClient` de `__tests__/setup.ts`

---

## Orden de ejecución recomendado (DAG)

```
PR-1 (orquestador) ──┐
PR-2 (asignaciones UI) ──┼──► PR-4 (métricas) ──► PR-7 (notificaciones)
PR-3 (logs) ─────────────┘
PR-5 (testing) — depende de PR-1 para pipeline real
PR-6, PR-8 — paralelos, menor prioridad
```

---

## Verificación final (cada PR)

```bash
npx vitest run __tests__/auth/claver-analyst.test.ts __tests__/ops/
npx tsc --noEmit
# Manual:
# 1. Login admin@erp-argentina.com → /dashboard/operaciones
# 2. Mismo user → /dashboard/claver/operaciones (dev: es analista por default)
# 3. POST asignación → otro email solo ve ese cliente
```

---

## Archivos clave — mapa rápido

```
lib/auth/claver-analyst.ts          ← guard analista + scope empresa
lib/ops/ops-service.ts              ← lógica core (extender, no duplicar)
lib/ops/ops-types.ts                ← tipos pipeline/jobs
components/ops/ops-console.tsx      ← UI compartida (extender con tabs)
app/dashboard/operaciones/          ← panel cliente
app/dashboard/claver/operaciones/   ← panel analista flota + VPS
app/dashboard/claver/reportes/      ← tickets (ya hecho)
app/api/ops/                        ← APIs tenant
app/api/claver/ops/                 ← APIs analista
prisma/schema.prisma                ← modelos ops (línea ~5954+)
```

---

## Lo que NO hacer

- ❌ Segundo ERP o login separado para Claver Cloud
- ❌ Rutas públicas sin auth en `/api/claver/*`
- ❌ Devolver `empresaId` de otro tenant sin `canAnalystAccessEmpresa`
- ❌ Ejecutar `prisma migrate` o shell arbitrario desde serverless sin sandbox
- ❌ Crear `PROMPT_*.md` adicionales ni docs largos — solo código + tests
- ❌ Romper `/dashboard/soporte` (bandeja tickets por tenant sigue existiendo)

---

## Output esperado de Gemini

1. Plan de PRs con estimación (S/M/L) por cada PR-1..PR-8
2. Implementar **en orden DAG** empezando por PR-1 y PR-2
3. Un commit/PR por bloque; mensaje: `feat(claver-cloud): <descripción>`
4. Al terminar cada PR: correr vitest y reportar pass/fail

Empezá leyendo `lib/ops/ops-service.ts` y `components/ops/ops-console.tsx` y confirmá qué PR vas a implementar primero.
```

---

## Notas para Pablo (no copiar a Gemini)

| PR | Esfuerzo | Impacto |
|----|----------|---------|
| PR-1 Orquestador | L | Sin esto, backup/deploy son demo |
| PR-2 Asignaciones UI | S | Operación diaria analistas |
| PR-3 Logs unificados | M | Debugging producción |
| PR-4 Métricas | M | Visibilidad tipo TCloud |
| PR-5 Test runner | M | Pipeline val→prd confiable |
| PR-6 Datos técnicos cliente | S | Self-service tenant |
| PR-7 Notificaciones | M | SLA operativo |
| PR-8 Enterprise DB | L | Futuro billing |

**Migración pendiente en tu máquina:**
```bash
npx prisma migrate dev --name ops_console
```

**Env producción analistas:**
```env
CLAVER_ANALYST_EMAILS=analista@claver.com,soporte@claver.com
OPS_ORCHESTRATOR_ENABLED=false
```
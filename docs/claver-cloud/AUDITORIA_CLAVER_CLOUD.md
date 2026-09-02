# Auditoría Claver Cloud — Módulos Funcionales y Reorganización

> Generado: 2026-09-01 · Fuente: análisis de código de `/app/claver-cloud/*` + `components/claver-cloud/*` + `lib/claver-cloud/nav-config.ts`

---

## 1. Estado Actual: 19 Módulos en el Sidebar

La torre Claver Cloud tiene **19 rutas de página** distribuidas en 4 secciones de navegación (más el footer).
**Problema:** demasiadas secciones heterogéneas, sin jerarquía clara, con módulos que se solapan (ej: `organizations` vs `operations` vs `tenants`) y otros que son internos/técnicos (Protheus) mezclados con herramientas CEO/comerciales.

## 2. Inventario de Módulos — ¿Funcional y da valor?

### ✅ FUNCIONALES Y DE ALTO VALOR (mantener y priorizar)

| # | Módulo | Ruta | Qué hace | API real | Valor |
|---|--------|------|----------|----------|-------|
| 1 | **Command Center** | `/claver-cloud` | Dashboard KPIs unificado: MRR, tenants, pipeline, registros, SLA, readiness. Incluye panel CEO y leads | `/api/claver/command-center` | 💎 Máximo |
| 2 | **Registros Web** | `/claver-cloud/registros` | Lista de altas (registro web, demo, trial) con KPIs: total, en trial, 7d. Filtros por origen | `/api/claver/registros/listado` | 💎 Alto |
| 3 | **Pipeline Comercial** | `/claver-cloud/comercial` | Kanban pipeline + calculadora ROI + manejo de objeciones + script vendedor | `/api/claver/pipeline` | 💎 Alto |
| 4 | **Billing (MRR)** | `/claver-cloud/billing` | MRR por tenant, plan (Starter/Pro/Enterprise), SKUs activos, status MP | `/api/claver/billing` | 💎 Alto |
| 5 | **Operations** | `/claver-cloud/operations` | Selector de tenants con KPIs operativos: entornos, tickets, jobs, logs error | `/api/claver/ops/clientes` + `/metricas` | 💎 Alto |
| 6 | **Provisioning** | `/claver-cloud/provisioning` | Alta de nuevas organizaciones, historial de órdenes | `/api/claver-cloud/provisioning/orders` | 🟢 Medio-Alto |
| 7 | **Implementation (CCA)** | `/claver-cloud/implementation` | Proyectos de implementación: fases CCA, progreso %, analista asignado | `/api/claver/implementaciones` | 🟢 Medio-Alto |
| 8 | **Go-Live** | `/claver-cloud/go-live` | Checklist readiness por tenant, TOS, suscripción MP, ready/not-ready | `/api/claver/go-live` | 🟢 Medio-Alto |
| 9 | **Marketplace Tareas** | `/claver-cloud/marketplace` | Tareas de activación de SKUs, checklist, runbooks integrados | `/api/claver/marketplace` | 🟢 Medio |
| 10 | **Platform Health** | `/claver-cloud/platform-health` | Security score, estado BD, eventos 24h, configuración env, webhooks | `/api/claver/platform-health` | 🟢 Medio |
| 11 | **Partners** | `/claver-cloud/partners` | Afiliados: comisiones pendientes, solicitudes de retiro, pago | `/api/claver/partners/liquidaciones` | 🟢 Medio |

### 🟡 SOLAPADOS (fusionar o absorber)

| # | Módulo | Problema |
|---|--------|----------|
| 12 | **Super Admin** | Duplica Operations + Command Center |
| 13 | **Organizations** | Duplica Operations (mismos clientes, mismas tarjetas) |
| 14 | **Demo Health** | Nicho. Mover a sub-tab de Platform Health |
| 15 | **Marketing Digital** | Sin data real (no conecta Meta/Google Ads) |

### 🔴 BAJO VALOR / MUY INTERNOS

| # | Módulo | Problema |
|---|--------|----------|
| 16 | **Protheus Setup** | Solo relevante si hay clientes Protheus |
| 17 | **OPO Console** | Herramienta dev, no analista |
| 18 | **Protheus API** | Documentación dev |
| 19 | **Settings** | Solo tiene asignaciones de analistas |

## 3. Propuesta de Reorganización

De 19 items y 4 secciones a **12 items y 3 secciones**.

Ver documento completo de auditoría para el detalle de fusiones y nueva estructura de `nav-config.ts`.

## 4. Dashboard de Analytics — Pendiente

No existe tracking de visitas/funnel. Se propone implementar vía Vercel Analytics (ya instalado) + modelos PageView/FunnelStep en Prisma.

# Claver Cloud — Panel Super Administrador

> Consola del analista para gobernar tenants: productos, readiness, ops, billing e implementación.

## Acceso

| Ruta | Rol |
|------|-----|
| `/claver-cloud/organizations` | Lista de tenants |
| `/claver-cloud/superadmin` | Dashboard de flota |
| `/claver-cloud/billing` | MRR y planes comerciales |
| `/claver-cloud/tenants/[empresaId]` | **Super Admin** por tenant |
| `/claver-cloud/operations/[empresaId]` | Ops técnico (jobs, VAL/PRD) |
| `/claver-cloud/implementation/[id]` | CCA, stakeholders, Scrum |
| `/claver-cloud/marketplace` | Torre tareas SEMI_AUTO |

Auth: `CLAVER_ANALYST_EMAILS` o rol `analista_claver`. Scope por `AnalistaAsignacion` si aplica.

## Super Admin — capacidades (P5–P7)

| Ruta / pestaña | Función |
|----------------|---------|
| `/claver-cloud/superadmin` | Dashboard flota + servicios ops |
| `/claver-cloud/billing` | MRR flota, comparativa planes |
| `/claver-cloud/tenants/[id]` | Panel por tenant |
| **Productos** | Provision / activar / desactivar SKUs y packs |
| **Readiness** | Checklist + integraciones MP/WA/Shopify |
| **Parametrización** | Empresa, features, AFIP prod dual |
| **Billing** | Plan Starter/Pro/Enterprise por tenant |
| **Automatizaciones** | Playbooks builtin + custom (Enterprise) |
| **Abrir ERP (impersonar)** | JWT 2 h + banner + auditoría |

### Servicios comerciales (catálogo ops)

| SKU | Nombre |
|-----|--------|
| `ops.claver_superadmin` | Panel Super Admin + impersonación |
| `ops.playbooks_auto` | Playbooks ejecución automática |

Código: `lib/ops/ops-services-catalog.ts` · Runbooks: `lib/marketplace/product-runbooks.ts`

### Planes comerciales

| Plan | SKUs máx | Super Admin | Playbooks | Impersonar | Custom PB |
|------|----------|-------------|-----------|------------|-----------|
| Starter | 5 | — | — | — | — |
| Pro (default) | 25 | ✓ | ✓ | ✓ | — |
| Enterprise | 999 | ✓ | ✓ | ✓ | ✓ |

Metadata: `proyectoImplementacion.metadata.planComercial`  
Código: `lib/ops/tenant-plan-service.ts`

## Diagrama P7

```mermaid
flowchart TB
  SA[/claver-cloud/tenants/id]
  SA --> PROD[Productos SKUs]
  SA --> CFG[Parametrización Cloud]
  SA --> BILL[Billing plan + MRR]
  SA --> AUTO[Playbooks builtin + custom]
  SA --> IMP[Impersonar ERP]
  CFG --> AFIP[AFIP prod dual approval]
  CFG --> FEAT[FeatureEmpresa toggles]
  BILL --> FLEET[/claver-cloud/billing]
```

## APIs

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/claver/superadmin/dashboard` | Flota |
| GET | `/api/claver/billing` | MRR flota |
| GET | `/api/claver/tenants/:empresaId` | Overview tenant |
| POST | `/api/claver/tenants/:empresaId/productos` | Provision/activate/deactivate |
| POST | `/api/claver/tenants/:empresaId/impersonate` | Sesión ERP 2 h |
| GET/POST | `/api/claver/tenants/:empresaId/playbooks` | Playbooks builtin |
| GET/POST/DELETE | `/api/claver/tenants/:empresaId/playbooks/custom` | Playbooks Enterprise |
| GET/PATCH | `/api/claver/tenants/:empresaId/config` | Parametrización Cloud |
| GET/PATCH | `/api/claver/tenants/:empresaId/billing` | Plan y MRR tenant |
| GET/POST | `/api/claver/tenants/:empresaId/afip-produccion` | Solicitar/aprobar/rechazar PRD |

## AFIP producción — aprobación dual

1. Analista A solicita (certificado requerido).
2. Analista B aprueba — **no puede ser A**.
3. Estado en `metadata.afipProdPending`.
4. Al aprobar: `entornoAfip = produccion`.

## Diccionario parámetros

`docs/analista/PARAMETROS_ERP.md` — generado desde `lib/ops/erp-parametros-catalog.ts`.

## Matriz de superficies

| Capacidad | Super Admin | Ops | Marketplace | ERP tenant |
|-----------|:-----------:|:---:|:-----------:|:----------:|
| Activar cualquier SKU | ✅ | — | Solo tareas | Apps/checkout |
| Desactivar SKU | ✅ | — | — | Admin |
| Plan comercial / MRR | ✅ | — | — | — |
| Config empresa/features | ✅ | — | — | ✅ |
| AFIP prod (dual) | ✅ | — | — | Parcial |
| VAL→PRD | Link | ✅ | — | — |
| Jobs backup/migrate | Link | ✅ | — | — |
| Checklist CCA | Link | — | — | Parcial |
| Stakeholders / Scrum | Link | — | — | — |
| Integraciones health | ✅ readiness | — | — | Cliente OAuth |

## Roadmap P8 (pendiente)

| Item | Notas |
|------|-------|
| ClavAI sugiere próximo SKU | readiness + enganche-catalog |
| Cron readiness &lt; 80% | Email analista |
| Runbook inline expandido | Modal con pasos completos en panel |
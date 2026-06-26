# Diccionario de parámetros ERP — Analista / Super Admin

> Catálogo machine-readable: `lib/ops/erp-parametros-catalog.ts`  
> Edición desde Cloud: pestaña **Parametrización** en `/claver-cloud/tenants/[empresaId]`

## Capas

| Capa | Qué es | Ejemplo |
|------|--------|---------|
| 1 | Fiscal / identidad tenant | CUIT, AFIP, certificado |
| 2 | Campos y maestros | Campos personalizados |
| 3 | Módulos y integraciones | FeatureEmpresa, MP, WA |
| 4 | Procesos | Workflows railroad |
| 5 | Operaciones Cloud | Plan comercial, super admin |

## Parámetros canónicos

| Clave | Módulo | Pantalla | API Cloud/ERP | Quién edita |
|-------|--------|----------|---------------|-------------|
| `empresa.cuit` | Empresa | `/dashboard/configuracion` | `PUT /api/config/empresa` | ambos |
| `empresa.puntoVenta` | AFIP | Config → AFIP | `PUT /api/config/empresa` | ambos |
| `empresa.entornoAfip` | AFIP | Cloud → Parametrización | `POST .../afip-produccion` (dual) | analista |
| `empresa.certificadoCRT` | AFIP | Config → AFIP upload | ERP tenant | cliente |
| `fiscal.caea` | AFIP | Config → CAEA | `/api/config/caea` | ambos |
| `fiscal.emision` | AFIP | Config → Emisión | `/api/config/fiscal-emision` | analista |
| `feature.*` | Railroad | Config → Módulos | `PATCH .../config` feature | ambos |
| `onboarding_completado` | Onboarding | `/dashboard/onboarding` | onboarding apply | analista |
| `plan_comercial` | Billing | `/claver-cloud/billing` | `PATCH .../billing` | analista |
| `integracion.mercado_pago` | Integraciones | Integraciones MP | ConexionIntegracion | cliente |
| `integracion.whatsapp` | Integraciones | Integraciones WA | ConexionIntegracion | cliente |
| `integracion.shopify` | Integraciones | Integraciones Shopify | ConexionIntegracion | cliente |
| `campo_personalizado` | Campos | Campos personalizados | `/api/campos-personalizados` | analista |
| `workflow.*` | Procesos | Config → Workflows | `/api/config/workflows` | analista |
| `ops.claver_superadmin` | Claver Cloud | `/claver-cloud/tenants/:id` | `GET /api/claver/tenants/:id` | analista |

## AFIP producción — aprobación dual

1. Analista A solicita (`POST .../afip-produccion` `action: solicitar`) — requiere certificado.
2. Analista B aprueba o rechaza — **no puede ser el mismo email** que A.
3. Estado en `proyectoImplementacion.metadata.afipProdPending`.
4. Al aprobar: `empresa.entornoAfip = produccion`.

## Plan comercial

| Plan | SKUs máx | Super Admin | Playbooks | Impersonar | Custom PB |
|------|----------|-------------|-----------|------------|-----------|
| Starter | 5 | — | — | — | — |
| Pro | 25 | ✓ | ✓ | ✓ | — |
| Enterprise | 999 | ✓ | ✓ | ✓ | ✓ |

Default sin metadata: **Pro**. Código: `lib/ops/tenant-plan-service.ts`.

## Health integraciones

Readiness incluye MP, WA, Shopify y Tienda Nube vía `lib/ops/integration-health-service.ts`.
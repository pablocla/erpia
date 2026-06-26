# Claver Cloud — Proceso de Implementación (CCA)

> **Versión:** 1.0 · 2026-06-23  
> **Documento canónico** para implementadores. La wiki embebida está en:  
> `content/docs/operaciones/claver-cloud-proceso-implementacion.mdx`

## Resumen ejecutivo

La metodología **CCA** (*Claver Cloud Activation*) cubre el ciclo completo **venta → aprovisionamiento → parametrización → UAT → go-live → hipercare**, con trazabilidad alineada a ISO 9001 / 20000 / 27001 y equivalente funcional a **TOTVS MIT 001** + **aba ONBOARD de TCloud**.

### Regla de oro

**No iniciar parametrización (CCA-040) sin completar aprovisionamiento (CCA-030).**  
Sin `empresaId`, URL de acceso, usuario admin y entornos registrados, el cliente no tiene equivalente al panel ONBOARD de TCloud.

## Procesos

| Código | Documento detallado |
|--------|---------------------|
| CCA-001 a CCA-080 | Ver wiki `/dashboard/documentacion/operaciones/claver-cloud-proceso-implementacion` |
| Dossier por cliente | `docs/clientes/_TEMPLATE/DOSSIER.md` |
| Checklist go-live | `content/docs/analista/checklist-go-live.mdx` |
| Guía analista capas | `docs/analista/GUIA_ANALISTA_IMPLEMENTACION.md` |

## Datos críticos pre-deploy (checklist rápido)

```
☐ Empresa creada (CUIT único)
☐ planHosting definido (shared | dedicated)
☐ Usuario admin + rol
☐ NEXT_PUBLIC_APP_URL configurada en Vercel
☐ DATABASE_URL (+ DIRECT_DATABASE_URL para migraciones)
☐ JWT_SECRET del entorno
☐ ensureTenantEntornos(empresaId) ejecutado
☐ SuscripcionModulo por SKU vendido
☐ AnalistaAsignacion (si aplica)
☐ Pack ONBOARD enviado al cliente
☐ Healthcheck /api/ops/overview OK
```

## Comandos útiles (analista / DevOps)

```bash
# Migraciones (entorno target)
npx prisma migrate deploy

# Seed comercial + demo automation (si aplica)
npx tsx -e "import { ensureDemoAutomationSubscription } from './lib/platform/commercial-service'; ..."

# Job ops manual (worker con OPS_ORCHESTRATOR_ENABLED)
npx tsx scripts/ops-run-job.ts
```

## Diagramas de flujo

| Documento | Contenido |
|-----------|-----------|
| [00-ciclo-completo](../marketplace/00-ciclo-completo.md) | Maestro comercial → impl → postventa |
| [VAL_PRD_ACTIVACION](./VAL_PRD_ACTIVACION.md) | VAL, sync, pipeline, go-live |
| Wiki embebida | Gates CCA + provisioning en MDX |

## Referencias TOTVS

- **MIT 001** — Metodología de Implementação TOTVS (fases, actas, matriz requerimientos)
- **TCloud ONBOARD** — URL, credenciales SFTP, firewall, license server → mapeado a Pack ONBOARD §5.4 de la wiki
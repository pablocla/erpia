# 05 — Postventa

## Objetivo

Garantizar que cada SKU activo sigue funcionando después del otorgamiento, con monitoreo, soporte y renovación.

Ver ciclo maestro: [00-ciclo-completo](./00-ciclo-completo.md).

## Ciclo de vida post-activación

```mermaid
flowchart TB
  ACT[SKU activo / go-live] --> MON[Monitoreo señales]
  MON --> TIK[Ticket si incidente]
  TIK --> ESC{escalacionSi}
  ESC --> LEAD[Lead / especialista]
  ESC --> RES[Resuelto → MTTR]
  ACT --> HIP[Hipercare CCA-080]
  HIP --> REN[Renovación]
  HIP --> OFF[Offboarding si churn]
```

## Hipercare implementaciones (CCA-080)

```mermaid
flowchart LR
  D1[Días 1-7 intensivo SLA 4h] --> D2[Días 8-15 seguimiento 8h]
  D2 --> D3[Días 16-30 soporte estándar]
  D3 --> ACTA[Acta cierre + NPS]
```

## Canales de atención

```mermaid
flowchart TB
  INC[Incidente o consulta]
  INC --> C1[Dashboard cliente módulo SKU]
  INC --> C2[Claver Cloud Ops]
  INC --> C3[SistemaLog marketplace]
  INC --> C4[Tickets soporte ERP]
  INC --> C5[Torre marketplace reabrir]
  C4 --> SLA[SLA por prioridad]
  C5 --> ESC[Estado escalada]
```

## Escalación postventa

```mermaid
flowchart TB
  RUN[escalacionSi en runbook] --> E1{Condición}
  E1 -->|OAuth 3x falla| INT[Lead integraciones]
  E1 -->|Odoo +10k sin batch| DBA[DBA]
  E1 -->|Cert AFIP vencido| FIS[Analista fiscal]
  INT --> TIK[Ticket P0]
  DBA --> TIK
  FIS --> TIK
```

## Renovación y offboarding

```mermaid
flowchart LR
  subgraph ren [Renovación]
    R1[tipoCobro recurrente] --> R2[Facturación mensual]
    R3[por_uso] --> R4[UsageEvent + límite]
  end
  subgraph off [Offboarding]
    O1[Desactivar SuscripcionModulo]
    O2[Cancelar cron / webhooks]
    O3[Archivar tareas]
    O4[Export datos]
    O1 --> O2 --> O3 --> O4
  end
```

## Fuentes de postventa

Cada runbook define `postventa`. Patrones comunes:

| Tipo SKU | Postventa típica |
|----------|------------------|
| Backup | Monitoreo job fallido; restore self-service |
| Integraciones | Alerta webhook caído; sync desfasado |
| Implementación | Hipercare 14 días post go-live |
| Fiscal | Paso a producción AFIP con analista |
| Reportes | Ajuste KPIs a pedido |

## Canales de atención

1. **Dashboard cliente** — módulo del SKU, logs integración
2. **Claver Cloud Ops** — `/claver-cloud/operations/{empresaId}`
3. **Sistema logs** — `persistSistemaLog` módulo `marketplace`
4. **Tickets soporte** — módulo Soporte ERP (si habilitado)
5. **Torre marketplace** — reabrir si `estado: escalada`

## Monitoreo automático

| Señal | Acción |
|-------|--------|
| `MarketplaceProvisionJob` failed | Alerta ops + email analista |
| Webhook sin eventos 48h | Tarea preventiva integraciones |
| `SuscripcionModulo` inactivo | Verificar renovación / pago |
| Uso OCR &gt; límite | Upsell o pausa FotoFactura |

## Renovación y cobro

- SKUs `tipoCobro: recurrente` → facturación mensual vía módulo comercial
- `por_uso` → `limiteEventosMes` en `SuscripcionModulo` + `UsageEvent`
- Bundles mixtos → recurrente + one-shot según SKU del pack

## Hipercare implementaciones

Para `impl.*` y bundles `pool-impl-*`:

1. Días 1–14 post go-live: analista lead en canal dedicado
2. Checklist CCA-080: reportes, backups, integraciones estables
3. Cierre: acta en `ProyectoImplementacion`

## Escalación postventa

Usar `escalacionSi` del runbook. Ejemplos:

- Shopify OAuth falla 3x → lead integraciones
- Odoo &gt;10k productos sin batch → DBA
- Cert AFIP vencido → analista fiscal

## Métricas postventa

- MTTR por SKU
- NPS post-activación (SKUs `data.nps`)
- Churn suscripciones marketplace 90 días
- Tareas escaladas / completadas

## Offboarding

1. Desactivar `SuscripcionModulo`
2. Cancelar jobs cron / webhooks
3. Archivar `MarketplaceTareaAnalista` completadas
4. Export datos si aplica (GDPR / cliente)

## Siguiente paso

→ [06 — Runbooks por producto](./06-runbooks-por-producto.md)
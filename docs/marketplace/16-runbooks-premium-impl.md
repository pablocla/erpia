# 16 — Runbooks Premium 7 y pools de implementación

> Diagramas operativos P2 para SKUs enterprise e implementación one-shot.

## Premium ERP 7 — flujo por SKU

```mermaid
flowchart TB
  POOL[pool-premium-erp-7 checkout] --> J[7 ProvisionJobs]
  J --> G1[intang.guardian_pos REGION_AUTO]
  J --> G2[intang.reactivador REGION_AUTO]
  J --> S1[intang.liquidacion_pagos SEMI_AUTO]
  J --> S2[intang.ocr_compras SEMI_AUTO]
  G1 --> P1[Panel alertas POS]
  G2 --> P2[Panel clientes inactivos]
  S1 --> T1[Torre: conciliar liquidaciones]
  S2 --> T2[Torre: mapeo OCR piloto]
```

## Conciliador liquidación (`intang.liquidacion_pagos`)

```mermaid
flowchart LR
  A[Ventas POS + MP] --> B[Cruce liquidación]
  B --> C{Discrepancia?}
  C -->|Sí| D[Alerta WhatsApp dueño]
  C -->|No| E[Registro OK]
```

## Guardián POS (`intang.guardian_pos`)

```mermaid
flowchart LR
  A[Anulación / egreso POS] --> B{Patrón sospechoso?}
  B -->|Sí| C[Alerta gerente]
  B -->|No| D[Log normal]
```

## Pool impl Odoo (`pool-impl-odoo`)

```mermaid
flowchart TB
  CH[Checkout one-shot $89.900] --> CCA[Proyecto CCA activo]
  CH --> M1[impl.migracion_odoo SEMI_AUTO]
  CH --> M2[integ.odoo SEMI_AUTO]
  CH --> M3[impl.homologacion_afip SEMI_AUTO]
  M1 --> UAT[CCA-060 UAT]
  M2 --> UAT
  M3 --> UAT
  UAT --> GL[CCA-070 Go-Live]
```

## Pool impl Ecommerce (`pool-impl-ecommerce`)

```mermaid
flowchart LR
  CH[Checkout mixto] --> TN[impl.migracion_tienda_nube]
  TN --> INT[integ.tienda_nube OAuth]
  INT --> ADS[mkt.pixel_ads]
  ADS --> LIVE[Primera venta canal online]
```

## Tablero Scrum unificado

Los ítems de estos pools aparecen en el backlog del proyecto vía:

```
POST /api/claver/implementaciones/:id/scrum { action: "sync" }
```

Tipos: `cca_hito`, `marketplace_sku`, `servicio_custom`, `ticket_epic`.

Ver [15-portal-stakeholder](./15-portal-stakeholder.md) para vista cliente.
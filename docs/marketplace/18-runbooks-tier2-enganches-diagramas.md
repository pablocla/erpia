# 18 — Enganches Tier 2: diagramas operativos

> Complementa [12 — Enganches comerciales](./12-enganches-comerciales.md) con diagramas Mermaid por SKU **implementado** y **parcial**.  
> Fuente canónica: `lib/marketplace/enganche-catalog.ts` + `lib/marketplace/product-runbooks.ts`

## Funnel enganche → ERP

```mermaid
flowchart LR
  T1[Tier implementado: Fiado / Cobranzas WA / Guardián] --> T2[Tier parcial: WA / ClavPay / OCR / Backup]
  T2 --> BND[Bundle pool-almacen-barrio]
  BND --> AR[Pack Almacén Rosario 18 módulos]
  AR --> ERP[Clavis Core + AFIP]
  T1 -.->|trial 14d fiado| T1
```

---

## Implementados (usar ya)

### pos.fiado_barrio — Libreta Fiado

| Campo | Valor |
|-------|-------|
| tier | implementado |
| autoCertLevel | GLOBAL_AUTO |
| Precio | $4.990/mes |

```mermaid
flowchart LR
  A[Checkout Libreta Fiado] --> B[Activar SKU]
  B --> C[Alta clientes + límite]
  C --> D[Venta fiado POS]
  D --> E[Email post-venta fiador]
  E --> UP[Upsell Cobranzas WA]
  B -->|sin SMTP| ESC[Escalar analista]
```

---

### intang.cobranzas_wa — Secretaria de Cobranzas WA

| Campo | Valor |
|-------|-------|
| tier | implementado |
| autoCertLevel | REGION_AUTO |
| Precio | $20.000/mes |

```mermaid
flowchart TB
  A[Requiere WhatsApp ON] --> B[Regla cxc_vencida]
  B --> C[Cron diario cobranzas]
  C --> D[Mensaje WA + tono IA]
  D --> E{ClavPay activo?}
  E -->|Sí| F[Link MP en mensaje]
  E -->|No| G[Solo recordatorio]
  F --> ROI[Panel ROI recupero]
  A -->|WA no conectado| ESC[Escalar analista]
```

---

### intang.guardian_pos — Guardián de Caja POS

| Campo | Valor |
|-------|-------|
| tier | implementado |
| autoCertLevel | REGION_AUTO |
| Precio | $14.900/mes |

```mermaid
flowchart LR
  A[Activar Guardián POS] --> B[Baseline 7 días caja]
  B --> C[Score riesgo diario]
  C --> D{Riesgo alto?}
  D -->|Sí| E[Alerta WA dueño]
  D -->|No| F[Reporte silencioso]
  E --> AN[Analista valida piloto]
```

---

## Parciales (enganche + upsell)

### com.whatsapp — WhatsApp Business ON

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | REGION_AUTO |

```mermaid
flowchart LR
  A[Activar WhatsApp ON] --> B[Meta Business conectado]
  B --> C[Webhook mensajes ERP]
  C --> D[Plantillas aprobadas]
  D --> E[Canal fiado + cobranzas]
  C -->|sin eventos 48h| MON[Postventa monitoreo]
```

---

### fiscal.clavpay_link — ClavPay Link

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | REGION_AUTO |

```mermaid
flowchart LR
  A[Activar ClavPay] --> B[MP credentials tenant]
  B --> C[Generar link por deuda]
  C --> D[Embed en email / WA cobranzas]
  D --> E[Pago acredita cxc]
  B -->|MP sin token| ESC[Escalar analista]
```

---

### data.reportes_prog — Reporte Mañanero

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | GLOBAL_AUTO |

```mermaid
flowchart LR
  A[Activar Mañanero] --> B[Cron 06:00 AR]
  B --> C[KPI caja + stock + ventas]
  C --> D[Email dueño]
  B -->|job fallido| TIK[Ticket automático]
```

---

### fiscal.ocr — FotoFactura

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | GLOBAL_AUTO |

```mermaid
flowchart TB
  A[Foto remito / factura] --> B[OCR Gemini]
  B --> C{Confianza >= 80%?}
  C -->|Sí| D[Compra borrador]
  C -->|No| E[Cola revisión]
  D --> F[Asiento + IVA]
```

---

### sec.backup — Backup Cloud

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | GLOBAL_AUTO |

```mermaid
flowchart LR
  A[Activar Backup] --> B[Job backup_db]
  B --> C[Entitlement activo]
  C --> D[Email próximo backup]
  B -->|falla| ESC[Alerta analista]
```

---

### sec.mfa — Escudo 2FA

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | GLOBAL_AUTO |

```mermaid
flowchart LR
  A[Activar 2FA] --> B[Política MFA obligatoria]
  B --> C[Enrollment usuarios]
  C -->|TOTP perdido| SUP[Soporte analista]
```

---

### intang.liquidacion_pagos — Conciliador Liquidación MP

| Campo | Valor |
|-------|-------|
| tier | parcial |
| autoCertLevel | SEMI_AUTO |

```mermaid
flowchart TB
  A[MP ON + Conciliador] --> B[Import liquidaciones]
  B --> C[Cruce movimientoCaja vs MP]
  C --> D{Diferencia > umbral?}
  D -->|Sí| E[Alerta WA dueño]
  D -->|No| F[Reporte semanal OK]
  A -->|sin movimientos tarjeta| ESC[Escalar analista]
```

---

## Bundle enganche almacén

```mermaid
flowchart TB
  POOL[pool-almacen-barrio $34.900/mes]
  POOL --> F[pos.fiado_barrio]
  POOL --> C[intang.cobranzas_wa]
  POOL --> W[com.whatsapp]
  F --> C
  C --> W
  W --> AR[Upsell Pack Almacén Rosario]
```

## Notificaciones portal (P4)

Cuando un stakeholder comenta un ticket, el analista asignado recibe email + Telegram. Cuando el analista responde desde el ERP, los stakeholders reciben email con link al portal.

```mermaid
sequenceDiagram
  participant ST as Stakeholder
  participant API as claver-cliente API
  participant AN as Analista
  participant ERP as tickets API
  ST->>API: POST comentario
  API->>AN: Email + Telegram
  AN->>ERP: POST respuesta
  ERP->>ST: Email portal /tickets/id
```

## Siguiente paso

→ [17 — Diagramas Tier 1](./17-runbooks-tier1-diagramas.md) · [15 — Portal stakeholder](./15-portal-stakeholder.md)
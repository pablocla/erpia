# 17 — Runbooks Tier 1: diagramas operativos

> Complementa [06 — Runbooks por producto](./06-runbooks-por-producto.md) con un diagrama Mermaid por cada SKU **Tier 1**.  
> Fuente canónica: `lib/marketplace/product-runbooks.ts`

## Plantilla común

Todos los Tier 1 siguen la misma estructura de activación → otorgamiento → postventa:

```mermaid
flowchart TB
  ACT[Cliente activa en App Store] --> RB[Runbook Tier 1]
  RB --> SUB[SuscripcionModulo]
  SUB --> PV[Postventa monitoreo]
  RB -->|escalacionSi| ESC[Escalar lead / analista]
```

---

## sec.backup — Backup Cloud

| Campo | Valor |
|-------|-------|
| autoCertLevel | GLOBAL_AUTO |
| CCA | CCA-030 |

```mermaid
flowchart LR
  A[Checkout / Activar Backup] --> B[Job backup_db]
  B --> C[Entitlement activo]
  C --> D[Email Pack ONBOARD]
  B -->|falla| E[Alerta analista + ticket]
  C --> F[Restore self-service postventa]
```

---

## sec.mfa — Escudo 2FA

| Campo | Valor |
|-------|-------|
| autoCertLevel | GLOBAL_AUTO |
| CCA | CCA-040 |

```mermaid
flowchart LR
  A[Activar 2FA marketplace] --> B[mfaObligatorio=true]
  B --> C[Usuarios enrolan TOTP]
  C -->|TOTP perdido| D[Soporte analista]
```

---

## integ.shopify — Shopify Link

| Campo | Valor |
|-------|-------|
| autoCertLevel | SEMI_AUTO |
| CCA | CCA-050 |

```mermaid
flowchart TB
  A[Cliente: dominio Shopify] --> B[OAuth autorización]
  B --> C[Webhooks registro]
  C --> D[Sync catálogo + stock]
  D --> E[Pedido test]
  B -->|OAuth 3x falla| ESC[Escalar lead]
  D -->|stock desfasado >5%| ESC
  E --> SUB[SuscripcionModulo]
```

---

## integ.tienda_nube — Tienda Nube Link

| Campo | Valor |
|-------|-------|
| autoCertLevel | REGION_AUTO |
| CCA | CCA-050 |

```mermaid
flowchart LR
  A[Integraciones → TN] --> B[API key regional]
  B --> C[Sync pedidos + stock]
  C --> D[Monitoreo 48h]
  B -->|API 401| ESC[Escalar analista]
  D -->|sin pedidos 48h| ESC
```

---

## integ.odoo — Odoo Bridge

| Campo | Valor |
|-------|-------|
| autoCertLevel | SEMI_AUTO |
| CCA | CCA-050 |

```mermaid
flowchart TB
  A[URL + API key Odoo] --> B[Test conexión]
  B --> C[IA: mapeo campos]
  C --> D[Import piloto analista]
  D --> E[Sync programado]
  B -->|Odoo menor 14| ESC[Escalar lead]
  D -->|mayor 10k productos| ESC
  E --> SUB[SuscripcionModulo]
```

---

## impl.migracion_odoo — Salí de Odoo

| Campo | Valor |
|-------|-------|
| autoCertLevel | SEMI_AUTO |
| CCA | CCA-040 |

```mermaid
flowchart TB
  A[Kickoff migración] --> B[Extracción Odoo]
  B --> C[Transform + validación]
  C --> D[UAT cliente]
  D -->|OK| E[Go-live datos]
  D -->|rechazo| B
  C -->|inconsistencias| ESC[Escalar lead]
  E --> HIP[Hipercare 14 días]
```

---

## impl.homologacion_afip — AFIP Ready

| Campo | Valor |
|-------|-------|
| autoCertLevel | SEMI_AUTO |
| CCA | CCA-070 |

```mermaid
flowchart LR
  A[Certificado homologación] --> B[Prueba emisión test]
  B --> C[UAT fiscal cliente]
  C --> D[Analista: paso producción]
  D --> E[Primera factura real PRD]
  B -->|rechazo AFIP| ESC[Escalar fiscal]
```

---

## com.whatsapp — WhatsApp ON

| Campo | Valor |
|-------|-------|
| autoCertLevel | REGION_AUTO |
| CCA | CCA-050 |

```mermaid
flowchart LR
  A[Activar WhatsApp ON] --> B[Config número regional]
  B --> C[Webhook mensajes]
  C --> D[Plantillas aprobadas]
  D --> E[Cobranzas / notificaciones]
  C -->|sin eventos 48h| MON[Monitoreo postventa]
```

---

## data.reportes_prog — Mañanero

| Campo | Valor |
|-------|-------|
| autoCertLevel | GLOBAL_AUTO |
| CCA | CCA-080 |

```mermaid
flowchart LR
  A[Activar Mañanero] --> B[Cron reporte diario]
  B --> C[Email / dashboard KPI]
  C --> D[Hipercare métricas]
  B -->|job fallido| TIK[Ticket automático]
```

---

## fiscal.ocr — FotoFactura

| Campo | Valor |
|-------|-------|
| autoCertLevel | GLOBAL_AUTO |
| CCA | CCA-050 |

```mermaid
flowchart TB
  A[Foto comprobante] --> B[OCR + extracción]
  B --> C{Confianza >= 80%?}
  C -->|Sí| D[Compra borrador]
  C -->|No| E[Cola revisión analista]
  D --> F[Asiento / IVA]
  E --> TIK[Ticket si persiste]
```

---

## Relación con portal stakeholder (P3)

Los ítems `marketplace_sku` del backlog Scrum se sincronizan desde `MarketplaceTareaAnalista` y reflejan la activación de estos SKUs para el cliente en `/claver-cliente/scrum`.

```mermaid
flowchart LR
  SKU[Tier 1 checkout] --> TAR[MarketplaceTareaAnalista]
  TAR --> SYNC[scrum sync]
  SYNC --> ST[Stakeholder ve ítem]
```

## Siguiente paso

→ [00 — Ciclo completo](./00-ciclo-completo.md) · [15 — Portal stakeholder](./15-portal-stakeholder.md)
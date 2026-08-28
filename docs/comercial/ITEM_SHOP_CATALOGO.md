# Catálogo de Item Shop — Extras de Pago Integrados
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** vendedor | grok | dueño kiosco  
**Estado:** listo  
**Fuentes:** `CANON_FREE.md`, `PAJARO_EN_MANO.md`

---

## Catálogo Estructurado de Módulos (Item Shop)

| Chiche | SKU real | Nombre de calle | 1 línea | Gatillo | No incluye | Precio | Paywall (Grok) |
|--------|----------|-----------------|---------|---------|------------|--------|----------------|
| Cobrá | `intang.cobranzas_wa` + `com.whatsapp` + `fiscal.clavpay_link` | Cobrá | Avisos WA + link MP en 1 clic. | ≥15 fiados o saldo grande sin cobro 14 d | AFIP | `[HUM-01]` | Botón “Enviar aviso” / generar link. **0 WA** sin estos SKU. |
| Factura | `fiscal.cert_afip` + emisión prod (no inventar `item.afip`) | Factura AFIP | Factura A/B/C con CAE. | Cliente pide factura | WA | `[HUM-01]` | Botón “Factura A/B/C”. Ticket interno sigue $0. |
| 2ª caja | Cap (SKU a crear si HUM-01) | Segunda caja | Otra pantalla cobrando. | Fila / 2 cajeros | Multi-sucursal | `[HUM-01]` | “Nueva caja” si ya hay 1. |
| 3er user | Cap (SKU a crear si HUM-01) | Cajero extra | Usuario 3+. | Turno noche | IA | `[HUM-01]` | Invite user si count ≥ 2. |
| Reportes 12 m | Cap | El año | Ventas por mes / estrellas. | Cierre anual | Export estudio | `[HUM-01]` | Filtro fecha > 48 h. |
| Estudio / IVA | Cap / portal contador | Para el contador | CITI / libro IVA. | El estudio pide el ZIP | Asesor humano | `[HUM-01]` | Export IVA. |
| URL propia | A pedido | Dominio | `empresa.claver.com.ar`. | **Ellos** lo piden | On-prem | `[HUM-01]` | No en menú ancla. |
| Leo | **Mismo pack que Cobrá**, no `lib/ai` de redes | Leo | Packaging de cobranza WA. No es community manager. | Fiado en serio | POS | `[HUM-01]` | No onboarding $0. |

---

## DoD
- [x] Catálogo completado con nombres de calle.
- [x] Precios placeholders `[HUM-01]`.
- [x] Indicaciones explícitas de Paywall para implementación por Grok.

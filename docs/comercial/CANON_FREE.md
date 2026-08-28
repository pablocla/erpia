# Canon Comercial — Oferta Gratis vs Item Shop
**Fecha:** 2026-08-25  
**Owner:** gemini · revisión grok  
**Para:** vendedor | dueño kiosco | soporte | grok | founder  
**Estado:** listo  
**Fuentes:** `docs/engineering/PROMPT_GEMINI_FREE.md`, `docs/comercial/PAJARO_EN_MANO.md`, `docs/comercial/SERVIDOR_GRATIS_ITEM_SHOP.md`

**Lectura:** “Oferta” es lo que se dice en la calle **si HUM-ancla = sí**. “Hoy en código” es lo que existe. **No demos POS** si el tenant solo tiene fiado.

---

## 1. Tabla canónica

| Funcionalidad | Oferta | Hoy en código | Frase de calle | Tope | Grok |
|---------------|--------|---------------|----------------|------|------|
| POS 1 caja | Gratis $0 | **Debe cablear** (ancla = solo fiado) | "Caja y libreta en la pantalla, gratis." | 1 caja | Extender `pos.fiado_barrio`. No publicar SKU nuevo hasta HUM-ancla. |
| Fiado y clientes | Gratis $0 | **Sí** `pos.fiado_barrio` · `/dashboard/fiado` | "Quién te debe, en 1 toque." | Ilimitado | Mantener |
| Stock básico | Gratis $0 | Parcial (ERP, no shell ancla) | "Productos y precio sin vueltas." | Unitario | Meter en POS lite |
| Cierre de caja | Gratis $0 | Parcial | "Cuánto entró en efectivo." | 1 caja / día | POS lite. Arqueo ciego **no** está. |
| Reportes hoy/ayer | Gratis $0 | Parcial | "Hoy y ayer en 1 segundo." | 48 h | Capear >48 h |
| WhatsApp automático | Item shop | `com.whatsapp` / `intang.cobranzas_wa` | "Avisos de cobro solos." | Pago | **0 outbound** en ancla |
| Link MP / ClavPay | Item shop | `fiscal.clavpay_link` | "Link, no el CVU a mano." | Pago + % del riel | Paywall en el botón de cobro, no en el efectivo |
| AFIP prod | Item shop | `lib/afip` existe; no capado | "La factura se activa aparte." | Cert + extra | Paywall A/B/C. Ticket interno sigue. |
| 2ª caja | Item shop | Sin tope | "Otra pantalla al lado." | Extra | Cap 1 caja |
| 3er usuario | Item shop | Sin tope | "El cajero de la tarde es extra." | 2 users en $0 | Cap 2 |
| Reportes 12 meses | Item shop | ERP pesado | "Compará el año." | Shop | Paywall rango |
| Estudio / IVA | Item shop | Parcial | "El libro para el contador." | Shop | Export. Se dice **CITI**, no CITER. |
| URL propia | Shop **si piden** | No | "`empresa.claver.com.ar`" | A pedido | No pitch de calle |
| Empleados digitales | Add-on | Extra | Leo = **cobranza WA**, no IA de redes | No onboarding $0 | No activar |
| SLA 24/7 | No existe | — | "Guía. Sin SLA en el gratis." | — | — |
| CFDI MX / US | No (puerta, no gasto) | enum `markets.ts` | En calle AR: no mencionar | — | No construir CFDI |

---

## 2. Reglas

1. **Gratis = CPU + pantalla.**  
2. **Pago =** plata que sale de Claver (WA, AFIP) o que le entra al comerciante sin él (link).  
3. **Hoy, en el local:** demo **fiado**. Prometer mostrador 1 caja solo si HUM-ancla ya está en prod.  
4. Factura A: *"El ticket y la libreta son gratis. La factura AFIP es extra."*

---

## 3. DoD
- [x] Gratis / shop / no existe / Grok debe cablear.  
- [x] Cero ERP completo $0.  
- [x] Distinto “oferta” vs “hoy en código”.

# Packaging Comercial — Módulos Gratis vs Item Shop
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** vendedor | dueño kiosco | soporte | grok | founder  
**Estado:** listo  
**Fuentes:** `docs/comercial/CANON_FREE.md`, `docs/comercial/PAJARO_EN_MANO.md`

---

## 1. Estructura de SKUs Comercial

| SKU real (código) | Nivel | Incluye | No incluye | Precio | Trial / setup |
|-------------------|-------|---------|------------|--------|---------------|
| `pos.fiado_barrio` | **Ancla $0 (hoy)** | Libreta, clientes, saldos, cobro parcial a mano | WA auto, AFIP prod, POS 1 caja (hasta HUM-ancla) | **$0** | Sin tarjeta |
| `pos.fiado_barrio` extendido **o** ancla mostrador (nombre a decidir Grok; **no** publicar `core.mostrador_gratis` hasta que exista) | **Oferta calle** si HUM-ancla = sí | 1 caja POS + fiado + stock unitario + arqueo + reportes 48 h | 2ª caja, AFIP prod, WA, BI | **$0** | Sin tarjeta |
| `intang.cobranzas_wa` + `com.whatsapp` + `fiscal.clavpay_link` | **Shop: Cobrá** | Avisos WA + link MP | AFIP, 3er user | **`[HUM-01]`** | Trial 14 d |
| Cert AFIP / emisión prod (`fiscal.cert_afip` + homologación; **no** hay SKU `item.afip`) | **Shop: Factura** | CAE A/B/C prod | WA | **`[HUM-01]`** | Trial 14 d |
| (cap de producto, no SKU aún) | **Shop: 2ª caja** | 2ª caja simultánea | Multi-sucursal | **`[HUM-01]`** | Sin trial |
| (cap de producto, no SKU aún) | **Shop: 3er user** | Usuario 3+ | Enterprise | **`[HUM-01]`** | Sin trial |
| A pedido | **Enterprise** | `empresa.claver.com.ar`, multi-sucursal, depto | On-prem | **`[HUM-01]`** | Setup `[HUM-01]` |
| `intang.cobranzas_wa` (Leo = **packaging** de Cobrá, no “IA de redes”) | **Add-on** | Cobranza WA con flujo armado | Core POS | **`[HUM-01]`** | No pitch ancla |

---

## 2. Definición de Límites Comerciales
- **Ancla ($0):** Solamente 1 caja activa por local, hasta 2 usuarios registrados. Todo el procesamiento y almacenamiento básico es gratuito.
- **Paywall In-App:** Al intentar facturar electrónicamente por primera vez o activar el envío masivo de mensajes WhatsApp, la UI disparará la pantalla de suscripción del Item Shop correspondiente.
- **Leo:** packaging de Cobrá (WA), no un community manager. No va en el onboarding $0.

---

## 3. DoD
- [x] SKUs canónicos estructurados.
- [x] Precios marcados con `[HUM-01]`.
- [x] Inclusión de add-on Leo al pie.

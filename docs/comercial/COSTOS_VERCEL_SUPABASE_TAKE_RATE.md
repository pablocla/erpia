# Costos Vercel + Supabase y % del ticket — cuándo se paga solo

**Fecha:** 2026-08-25  
**Para:** founder · humano (precio, MP) · Grok (caps, región DB)  
**Números:** orden de magnitud, lista pública 2025–26. No es factura. Tipo de cambio: usar **USD para infra**; cobro al kiosco en **ARS**.  
**Hermanos:** [`POS_GRATIS_ESCALA.md`](./POS_GRATIS_ESCALA.md) · [`ROMPER_MERCADO_ERP_AR.md`](./ROMPER_MERCADO_ERP_AR.md) · [`COSTOS_ESCATIMAR.md`](./COSTOS_ESCATIMAR.md)

Tesis: el POS gratis **se cubre** con un **% chico de la plata que ya pasa por Claver** (link MP / ClavPay), no con un % de cada Coca en efectivo. Si le cobrás 1% del ticket de mostrador, Maxikiosco gana el relato.

---

## 1. Qué te cobra cada uno (hoy)

Stack real: Next.js 15 en **Vercel**, Postgres **Supabase pooler**, JWT propio (casi no usás Auth de Supabase), crons, un JS **pesado**.

### Vercel (producción)

| Ítem | Lista aprox. | Qué te pega a vos |
|------|----------------|-------------------|
| Plan **Pro** | ~USD 20 / asiento / mes | Mínimo para crons, timeout >10s, no Hobby |
| Function / Fluid compute | Incluido + excedente por GB-h e invocaciones | Cada venta POS = 1–N lambdas. AFIP SOAP = funciones **largas** (caro) |
| Fast Data Transfer | Incluido unos cientos de GB; después ~USD 0,15/GB | **El dashboard es un monstruo.** Recargar caja 50 veces/día × 2 MB JS = GB de verdad |
| Image Optimization | Por imagen | Fotos de producto; capear en ancla |
| Cron | En Pro | Trial dunning, AFIP sync, empleados |
| Enterprise | Cotización | Cuando hay SLA o 5 dígitos de invoice |

**Ancla (sin AFIP, sin WA):** el costo Vercel **no** es la invocación de “guardar ticket”. Es **bajar el JS del POS** todas las veces que abren la caja.

### Supabase

| Ítem | Lista aprox. | Qué te pega |
|------|----------------|-------------|
| Plan **Pro** | ~USD 25 / mes | Piso |
| Compute (add-on) | Micro ~10 → Small 15 → Medium 50 → Large 100+ USD/mes | CPU en hora pico (18–21 h AR) |
| Disco | ~USD 0,125 / GB-mes sobre el incluido | Historial de ventas; crece lineal |
| Egress | ~USD 0,09 / GB sobre el incluido | App en Vercel (USA) + DB en **us-east-1** = ida y vuelta cara y lenta |
| Pooler (6543) | En el plan | Sin pooler, Prisma serverless **revienta conexiones** |
| Auth MAU | Si no usás GoTrue, ~0 | Ustedes firman JWT en la app |

Hoy el pooler ya está en `us-east-1`. Para kiosco AR eso es **latencia + egress**. El cuello serio, más arriba, es **región**, no el precio del Pro.

---

## 2. Costo por comercio (modelo)

Tres tipos de tenant:

| Tipo | Qué hace | Infra / mes (USD) |
|------|----------|-------------------|
| **Muerto** | Se registró, 0 ventas | ~0,02–0,10 (fila en DB). **Purgar a 90 días** |
| **Ancla** | 1 caja, 40–120 tickets/día, fiado, sin WA/AFIP | **0,30–1,20** |
| **Caliente** | AFIP en cada venta, fotos, 2º user, reportes | **2–8** + AFIP/WA aparte |

Usar **USD 0,70 / ancla activa / mes** para planificar (mitad Vercel transfer + mitad DB).  
Si el bundle del POS no se achica, sube a **USD 1,50–2**.

| Anclas **activas** | Infra/mes | Piso fijo (Pro+Pro) | Total grosero |
|--------------------|-----------|---------------------|---------------|
| 100 | USD 70 | ~45 | **~USD 120** |
| 1.000 | 700 | 45–80 | **~USD 800** |
| 5.000 | 3.500 | compute Medium | **~USD 4–5 k** |
| 10.000 | 7.000 | Large + transfer | **~USD 8–12 k** |
| 50.000 | 35.000 | ya no es “un Pro” | **~USD 40–80 k** (hay que salir de Vercel serverless puro) |

Los **muertos** no entran en “activas”. 10.000 registros y 800 usando = costo de 800, si purgás.

---

## 3. Cuellos de botella (en orden, no es la DB primero)

| # | Cuello | A qué cantidad se siente | Qué hacer |
|---|--------|---------------------------|-----------|
| **1** | **Peso del JS** (Vercel Data Transfer + celular 4G) | Desde **ahora**. 1.000 cajas recargando el dashboard | Code-split POS, no cargar el ERP en `/dashboard/pos`. Esto **baja el USD/tenant** más que cualquier plan |
| **2** | **Región** (DB us-east, usuario en Rosario) | Desde 100 cajas en hora pico: POS “lento” | Postgres **sa-east-1** (São Paulo) o AR si hay. Vercel São Paulo |
| **3** | **Compute Postgres 18–21 h** | ~1–3 mil cajas concurrentes | Subir compute; índices en `venta`/`linea` por `empresaId`+fecha; no N+1 |
| **4** | **Conexiones Prisma** | Mal pooler o queries largas | Seguir pooler 6543; `pgbouncer`; timeout |
| **5** | **Disco** | ~10–20 mil tenants × años de tickets | Particionar por mes / cold storage a los 18 meses |
| **6** | **Vercel functions + AFIP** | Cuando el extra AFIP es masivo | AFIP **fuera** del request del ticket (cola, ya hay cron). El mostrador gratis **nunca** espera SOAP |
| **7** | **Salir de serverless** | ~5–10 mil POS vivos | Node fijo (Railway/Fly/VPS AR) + Supabase Dedicated. Vercel queda en landing/CDN |

**El primer muro no es “Supabase Pro se acaba”. Es el bundle y la región.** A 5–10 mil cajas vivas, Vercel-only se vuelve invoice feo: ahí **suplantás infra**, no el modelo de negocio.

---

## 4. Cómo se cubre con **% del ticket** (el cliente ya establecido)

No le metas 1% a **toda** la venta de mostrador (efectivo, 80% del kiosco). Te odian y es una pelea con MP (ellos ya se llevan ~3–6%).

Cobrás **solo la plata que pasa por un riel Claver**:

| Riel | Qué es | % sugerido (HUM cierra) | Por qué |
|------|--------|-------------------------|---------|
| **ClavPay / link MP** (fiado, CxC, seña) | El deudor paga el link | **0,5–1,0% extra** sobre lo que ya cobra MP **o** fee fijo $200–500 ARS/cobro | El comerciante **recupera** plata; no es un impuesto a la Coca |
| **Checkout Claver** (si algún día hay QR propio) | Venta digital | 0,7–1,2% | Igual que un PSP chico |
| **2ª caja / AFIP / WA** | Extra mensual | Precio fijo ARS | Cubre infra **mejor** que el % cuando el tenant es chico |
| **% sobre ticket POS efectivo** | — | **0%** | No rompe el mercado; lo incendia |

### Cuentas (kiosco “ya establecido”)

Supuesto: **ARS 1.500.000 / mes** de GMV (orden: 80 tickets/día × $2.500 × 25 días ≈ 5 M sería almacén grande; usamos 1,5 M como kiosco medio).

| Si cobrás | Sobre qué | ARS / mes | Cubre infra (USD 0,70 ≈ 700–1.000 ARS @ TC grosero) |
|-----------|-----------|-----------|------------------------------------------------------|
| 0% POS | Todo | 0 | No |
| Extra WA $15.000 | Fijo | 15.000 | **Sobra** (paga ~15 tenants ancla) |
| **0,8% ClavPay** | Solo lo cobrado por link, ej. $200.000 de fiado recuperado | **1.600** | Cubre **ese** tenant + un poco de anclas muertas |
| 0,15% de **todo** el GMV | $1.500.000 | 2.250 | Cubre, **pero el dueño lo siente como impuesto** |

**Regla de suplantar costos:**

1. **Piso:** extras fijos (WA, AFIP, 2ª caja) de los que convierten 10–20%. Esos pagan el **pool de anclas**.  
2. **Margen que crece con el grande:** % **solo ClavPay**. Cuando el almacén cobra $2 M de fiado por MP, 0,8% = $16.000 y **no toca el ticket de mostrador**.  
3. **Nunca** el % como condición para el POS gratis. El % es del **botón de cobro**, opt-in.

Fórmula de break-even del pool:

```text
anclas_activas × USD 0,70
    ≤  (pagadores_extra × ARS_extra / TC)
    +  (volumen_ClavPay_ARS × 0,008 / TC)
```

Ejemplo 1.000 anclas (~USD 700 infra):

- 120 pagan Cobrá ~USD 12 c/u → **USD 1.440** → **ya cubre**.  
- Encima 30 usan ClavPay $300.000 ARS/mes × 0,8% → ~USD 2–3 extra por esos.  

A **10.000 anclas** (~USD 8–12 k): necesitás ~**800–1.000 extras pagos** **o** ~**USD 1 M ARS/mes de cobros por link** a 0,8% (mezcla). El % **empieza a importar** acá, no a los 100 kioscos.

A **50.000**: el % ClavPay **es** el negocio; Vercel hay que haberlo sustituido por compute fijo.

---

## 5. Cómo ir **suplantando** el margen de infra (secuencia)

| Etapa | Infra | Cómo se paga |
|-------|--------|----------------|
| 0–300 anclas | Vercel Pro + Supabase Pro (piso ~USD 45–80) | Founder. No hace falta % |
| 300–2.000 | Mismo + compute Small. **Achicar JS POS. DB São Paulo** | 10–15% pagan extra WA/AFIP. % ClavPay **en el link**, 0,8%, opcional |
| 2.000–8.000 | Supabase Medium/Large. Cron AFIP fuera del request | Extra + ClavPay ya cubre invoice. Si Vercel transfer explota → CDN/self-host POS |
| 8.000–20.000 | **Sacar POS del serverless** (Node AR/BR + Postgres dedicated) | Take rate ClavPay es el P&L. Extra es upsell |
| 20.000+ | Dedicated + read replicas hora pico | % + hardware. No más “plan Pro” |

Suplantar **no** es subir el % del ticket. Es:

1. Bajar USD/tenant (bundle, región, purge).  
2. Subir **mezcla** (más links de cobro, no más impuesto a la venta).  
3. Cuando el invoice Vercel duele, **cambiar de fábrica**, no de precio al kiosco.

---

## 6. Caps en producto (para que el modelo cierre)

| Cap ancla | Para qué |
|-----------|----------|
| 1 caja, 2 users | Extra = 2ª caja |
| 0 WA outbound | Extra = Cobrá |
| 0 AFIP prod | Extra = factura |
| Fotos producto: 0 o 1 liviana | Transfer |
| Purge 90 d sin ticket/fiado | Muertos |
| POS code-split | Cuello #1 |

---

## 7. DoD de “los costos están atados al %”

- [ ] Sabemos USD/tenant activo (dashboard: Vercel usage / anclas con 1 venta en 30 d).  
- [ ] ClavPay 0,5–1% **solo** en cobro por link, escrito en el extra, no en el POS gratis.  
- [ ] 100 anclas no dependen del %; 10.000 sí mezclan extra + %.  
- [ ] Nadie cobra % sobre efectivo de mostrador.  
- [ ] Hay plan “salir de Vercel functions para POS” antes de 8 mil cajas vivas.

---

## 8. Veredicto

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cuánto sale un kiosco ancla? | **~USD 0,30–1,20/mes** si lite y sin WA/AFIP |
| ¿Primer cuello? | **JS + región us-east**, no el precio de Supabase Pro |
| ¿A qué número duele? | **~2–5 mil** compute DB pico; **~8–10 mil** hay que dejar serverless POS |
| ¿% del ticket? | **0% del mostrador.** 0,5–1% de **lo cobrado por Claver (MP)**. Extras fijos cubren el pool chico |
| ¿Cuándo el % reemplaza el costo? | Cuando hay volumen de **links de cobro**, no cuando hay muchos tickets en efectivo |

El unicornio no es “1% de toda la góndola”. Es **gratis la caja** y **un peaje chico cuando el Pérez paga el fiado por Mercado Pago**.

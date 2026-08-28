# POS gratis a escala — ¿se puede romper el ERP desde Argentina?

**Fecha:** 2026-08-25  
**Para:** founder / humano (precio, piloto) · Grok (límites de ancla)  
**Hermanos:** [`PAJARO_EN_MANO.md`](./PAJARO_EN_MANO.md) · [`ROMPER_MERCADO_ERP_AR.md`](./ROMPER_MERCADO_ERP_AR.md) · [`COSTOS_VERCEL_SUPABASE_TAKE_RATE.md`](./COSTOS_VERCEL_SUPABASE_TAKE_RATE.md) · [`LIBERTAD_FINANCIERA_LATAM.md`](./LIBERTAD_FINANCIERA_LATAM.md) · [`PUERTA_UNICORNIO_INTERNACIONAL.md`](./PUERTA_UNICORNIO_INTERNACIONAL.md) · [`GO_LIVE_PRD.md`](../GO_LIVE_PRD.md) · ENLISTA.md

Respuesta corta:

**Sí hay chance. No es “somos el SAP argentino”. Es “somos el WhatsApp de la caja y el fiado”.**  
El software que ya está escrito **sí se puede regalar**. Lo que **no** se puede regalar es lo que te cobra un tercero cada vez que se usa (WhatsApp, AFIP prod, horas de analista, Vercel/Supabase sin techo).

**Norte con los pies en la tierra:** libertad financiera **sin ser millonario**, **solo LATAM** (~USD 4–8 k/mes netos al founder). Eso cierra con **~8–10 mil anclas vivas** y extras/ClavPay — no con 200 pymes a $80.000. Detalle en [`LIBERTAD_FINANCIERA_LATAM.md`](./LIBERTAD_FINANCIERA_LATAM.md).

Unicornio desde AR **no se gana vendiendo ERP**. Se gana **ocupando decenas o cientos de miles de cajas** y cobrando **take rate**. Eso es **puerta**, no KPI del año 1. Si no aceptás el juego de ancla gratis + extra, no hay chance contra Maxikiosco/Fudo ni contra TOTVS/SAP.

---

## 1. Qué significa “regalar el POS”

El código **ya está**. El costo marginal de un kiosco más usando pantalla + Postgres es **bajo** si:

- 1 caja, 2 usuarios, shell lite (POS + fiado + stock + caja).  
- Cero WhatsApp saliente.  
- Cero AFIP producción.  
- Cero implementador.  
- Self-serve: el vendedor deja QR (`claver.com.ar/f`) y se va.

Eso **sí** es “regalar lo programado”. Lo que **no** es gratis:

| Cosa | Quién cobra | Si lo regalás |
|------|-------------|----------------|
| Ticket / fiado / stock en pantalla | Nadie extra | OK regalar |
| Mensaje WA automático | Twilio / Meta | Te funde a 10 mil tenants |
| Factura electrónica prod | AFIP + soporte + cert | Cola de tickets, no escala |
| Analista 2 h | Tu tiempo | No hay 10 mil analistas |
| Serverless + DB | Vercel + Supabase | Crece lineal; hay que capar y borrar muertos |

**Recomendación de oferta (no de precio):**

| Opción | Qué es | Cuándo |
|--------|--------|--------|
| **A — Ancla eterna** (preferida) | POS 1 caja + fiado + stock + caja **$0 para siempre**. Extra = WA, AFIP, 2ª caja | Llenar cartera. Convertís 10–20% a extra |
| **B — 12 meses $0** | Mismo pack, al mes 13 pide tarjeta o se queda solo fiado (libreta) | Si un inversor pide “path to paid” más claro |
| **C — ERP completo $0** | 40 módulos, AFIP, WA | **No.** Quiebra y diluye la marca |

Hoy el código es más chico que A: **solo fiado $0** (`pos.fiado_barrio`). El movimiento épico es **pasar a A**. El año gratis (B) es plan B si A asusta.

Frase de calle (A):

> El mostrador es gratis. Pagás cuando el sistema te cobra a los deudores o te factura AFIP.

---

## 2. Números de servilleta (orden de magnitud, no un budget)

Supuesto grosero de infra (pooler + serverless, tenant chico): **USD 0,20–1,50 / mes** por comercio **activo** si el shell es lite y no hay WA/AFIP. Los **muertos** (se registraron y nunca vendieron) hay que **purgar a 90 días** o el costo se va a basura.

| Cartera ancla | Costo infra/mes (si ~USD 0,5) | Si 15% paga extra USD 8–15 |
|---------------|-------------------------------|----------------------------|
| 1.000 | ~USD 500 | ~USD 1.200–2.000 |
| 10.000 | ~USD 5.000 | ~USD 12–22 k |
| 100.000 | ~USD 50 k | ~USD 120–220 k |

Eso **no es unicornio**. Es el camino a **libertad financiera LATAM** (ver §8 y el doc hermano). Unicornio aparece **después**, si además:

1. **ClavPay / link MP:** 0,5–1% de lo cobrado por fiado/CxC (el comerciante ya paga MP; vos empaquetás).  
2. **Hardware:** impresora/gaveta con margen (una vez).  
3. **LATAM:** mismo producto, no 40 ERPs.  
4. **Datos:** “quién debe en el barrio” no se vende; sí se usa para cobro y crédito (con ToS).

Sin take rate, regalando POS, **no llegás a unicornio**. Con extras al 10–15% **sí** podés llegar a libertad LATAM. Unicornio pide densidad + % de cobro; libertad pide miles de anclas vivas, no 100 mil.

---

## 3. Cómo se hace **escalable** (épico de verdad)

No es más módulos. Es **una fábrica de altas** y **cero onboarding humano**.

### 3.1 Producto: un solo binario, un techo

| Hacer | No hacer |
|-------|----------|
| Un `modoLite=pos` + fiado, 1 caja | ERP completo “por las dudas” |
| Paywall en el botón: “AFIP — extra”, “Avisos WA — extra” | Ocultar el extra hasta que llamen |
| Purgar tenant sin 1 venta/fiado en 90 días | Guardar demos eternas |
| Offline POS que **sí** sinca (hoy es la brecha vs Maxikiosco) | Prometer offline y perder tickets |
| Precio 1 extra, no 40 SKUs | Marketplace de 80 cards el día 0 |

El que escala es **Maxikiosco/Fudo**: una pantalla, un oficio, mil locales. El que no escala es Tango a medida.

### 3.2 Distribución: el vendedor no implementa

- QR `claver.com.ar/f` + calco (ver PAJARO_EN_MANO §4.1).  
- Alta en 2 minutos en **su** celular.  
- El vendedor no vuelve a “capacitar 3 horas”.  
- Viral: “mandale el link al de la esquina”. Un referido = mes extra de Cobrá, no cash.

### 3.3 Plataforma (Grok, cuando HUM apruebe A)

1. SKU ancla mostrador (extender `pos.fiado_barrio` o `core.mostrador_gratis`).  
2. Bloquear WA outbound y AFIP prod en ancla.  
3. Cap: 1 caja, 2 users, N SKUs.  
4. Job 90 días: inactivo → freeze / wipe.  
5. Cloud: funnel ancla → extra (no “empleados”).  
6. Offline cola de ventas **sin duplicar** — sin esto Maxikiosco te gana en el corte de luz.

### 3.4 Costo variable = 0 en el ancla

Regla de oro (igual que Pájaro):

**Gratis = CPU + pantalla. Pago = plata que sale de Claver o entra al comerciante sin él.**

---

## 4. Cómo se rompe (o no) “la industria ERP”

### Lo que sí se puede romper

El **ERP de barrio**: cuaderno, Excel, Maxikiosco, “el sistema del primo”, Fudo en el almacén que no es resto.

Ahí el gancho único de Claver es **fiado**. Ellos venden caja. Vos regalás caja **y** le resolvés a quién le debe. Eso no lo tiene SAP ni TOTVS. Tampoco Fudo.

### Lo que no se rompe

Pyme de 80 empleados, consorcio, industria, AFIP de estudio. Eso es otro ejército. Si vas ahí, no hay 1 de chance contra Tango/SAP/Xubio en 5 años.

### Por qué Argentina puede

- Dolor real: inflación, fiado, AFIP, MP ya está en el celu.  
- Precio en ARS, copy de calle, vendedor en la esquina.  
- Un monolito ya hecho: no tenés que inventar POS.  
- LATAM copia el mismo producto (MX/CO/PE) **después** de 10 mil cajas AR.

### Por qué se pierde

- Offline flojo (ya documentado vs Maxikiosco).  
- Menú de 40 módulos el día 1 (el kiosquero huye).  
- Soporte humano por cada alta.  
- Prometer AFIP mágico.  
- Gastar el runway en “empleados digitales” y landings US.

---

## 5. Camino de 18 meses (si hay chance)

| Fase | Meta | Se cobra |
|------|------|----------|
| 0–3 meses | 200 anclas **usando** (1 fiado o 1 venta / 48 h). Kit calco + `/f`. Shell lite. | $0. Medir activación |
| 3–9 meses | 2–5 mil anclas. Extra Cobrá al 10%+. Offline P0. | WA + link |
| 9–18 meses | 10 mil+ cajas AR. 2ª caja y AFIP como SKU. Primeros partners. | Take rate cobro + AFIP |
| 18+ | LATAM copy. Hardware. | Volumen |

Si a los 6 meses **<30% de las altas** anotan un fiado, el gratis no pega: el producto o el QR están mal. No “falta marketing de ERP”.

---

## 6. Decisión humana (sin esto Grok no codea el POS $0)

| Pregunta | Sí épico | No |
|----------|----------|-----|
| ¿POS 1 caja es $0 eterno o 12 meses? | Eterno (A) o año (B) | Seguir solo fiado $0 |
| ¿Aceptás 80–90% que nunca pagan extra? | Sí: son publicidad que usa el producto | No: cobrá el POS y no hay cartera |
| ¿El negocio grande es cobro % + extra, no licencia ERP? | Sí | Entonces no hay escala; hay agencia |
| ¿Piloto 20 locales de **un** barrio, no 20 rubros? | Sí | Dispersión |
| ¿Norte = libertad LATAM, no millonario/unicornio? | Sí | Si el KPI es valuación USD 1 B, el trimestre se gasta mal |

---

## 7. DoD de “lo estamos haciendo”

- [ ] Frase de calle: mostrador gratis / extra = WA o AFIP.  
- [ ] Alta sin tarjeta, 1 caja, sin menú de oficios.  
- [ ] 0 WA y 0 AFIP prod en ancla.  
- [ ] Purge 90 días.  
- [ ] Funnel: ancla → Cobrá (un solo extra primero).  
- [ ] Offline en el roadmap **antes** que más nichos.  
- [ ] Empleados digitales **fuera** del pitch.

---

## 8. Libertad financiera (el norte real)

No hace falta ser millonario ni romper SAP. **LATAM solo alcanza** si el ancla es $0 y el extra se paga solo.

| Qué | Número (orden) |
|-----|----------------|
| Bolsillo “ya fui” | **USD 4–8 k/mes** neto founder (infra + impuestos ya descontados) |
| Cajas para el piso flaco | **~5.000** anclas **vivas**, ~12% pagan extra USD 8–15 |
| Cajas para suficiente | **~8–10.000** AR (o AR + 1 país hispano) + ClavPay en links |
| 1.000 vivas | Cubren invoice. **No** te hacen libre |
| Millonario / unicornio | Otro juego. Puerta abierta, **no** el plan de gasto |

Cuentas, impuestos y trampas: [`LIBERTAD_FINANCIERA_LATAM.md`](./LIBERTAD_FINANCIERA_LATAM.md).

---

## 9. Veredicto

| Pregunta | Respuesta |
|----------|-----------|
| ¿Regalar el POS que ya programaron? | **Sí**, 1 caja, self-serve, sin WA/AFIP. |
| ¿Gratis 1 año o para siempre? | **Siempre el mostrador chico.** Año gratis es plan B. |
| ¿Escala épica? | Sí, si el costo por tenant está capado y el alta es QR. |
| ¿Libre sin ser millonario, solo LATAM? | **Sí, y es suficiente.** ~8–10 mil anclas vivas, no 100 mil. |
| ¿Unicornio / romper ERP? | **Puerta**, no KPI. Solo si ocupás caja informal a escala y cobrás **cobranza/factura/2ª caja**. |
| ¿Hay 1 de chance? | **Hay**, en kiosco/almacén/fiado. **No hay** si el norte es “el ERP de Argentina para todos los rubros”. |

*Si HUM dice sí al POS $0, el siguiente paso es Grok: SKU ancla mostrador + paywall AFIP/WA — lista en PAJARO_EN_MANO §8.*

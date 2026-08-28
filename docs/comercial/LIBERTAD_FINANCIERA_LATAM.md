# Libertad financiera LATAM — pies en la tierra

**Fecha:** 2026-08-25  
**Para:** founder (norte real)  
**Dominio:** `https://claver.com.ar`  
**Hermanos:** [`POS_GRATIS_ESCALA.md`](./POS_GRATIS_ESCALA.md) · [`PUERTA_UNICORNIO_INTERNACIONAL.md`](./PUERTA_UNICORNIO_INTERNACIONAL.md) · [`COSTOS_VERCEL_SUPABASE_TAKE_RATE.md`](./COSTOS_VERCEL_SUPABASE_TAKE_RATE.md) · [`SERVIDOR_GRATIS_ITEM_SHOP.md`](./SERVIDOR_GRATIS_ITEM_SHOP.md)

**Veredicto:** sí. **Libre financieramente, sin ser millonario, solo LATAM, ya es suficiente** — y es el único norte que no es fantasía el año 1.

Unicornio y US quedan como **puerta abierta** (`marketId` en código). No son el KPI. Si un día llega, llega encima de una cartera LATAM que ya te paga el alquiler.

---

## 1. Qué es “suficiente” (no brochure)

| Palabra | Qué significa acá | Qué no es |
|---------|-------------------|-----------|
| **Libre financieramente** | El producto cubre tu vida + infra + impuestos **sin un sueldo de otro**. Podés decir que no. | Yacht, Miami, ronda Serie B |
| **Sin ser millonario** | No hace falta USD 1 M de patrimonio ni vender la empresa | Tampoco “me alcanza el monotributo eterno con 40 clientes a mano” |
| **Solo LATAM** | AR primero; MX/CO/PE/UY/PY **mismo producto** (español, WhatsApp, MP o similar) | No US, no Stripe, no ads en USD |

Orden de magnitud **neto founder en USD** (porque la infra es en dólares; el kiosco paga en ARS/MXN):

| Nivel | USD / mes neto al bolsillo (después de infra + impuestos groseros) | Vida en AR |
|-------|---------------------------------------------------------------------|------------|
| Flaca | **2.500–4.000** | Vivís. No mirás un empleo cada mes. |
| **Suficiente** | **4.000–8.000** | Holgado, 1 viaje, ayudás familia, notebook, no dependés |
| Empresa chica | **8.000–15.000** | Lo mismo + 1 persona de soporte/ops. Todavía no millonario |
| Millonario | Patrimonio ~USD 1 M (años + ahorro o venta 3–6× MRR) | Otro juego. **No es el objetivo** |
| Unicornio | USD 1 B de valuación | Puerta, no destino |

En Argentina 2026, **USD 4–8 k/mes netos** de un producto propio **es libertad**. No es “poco ambicioso”: es lo que la mayoría de founders locales nunca toca.

---

## 2. Por qué LATAM alcanza (y US no hace falta)

El estanque es grande para **un** founder:

- AR: cientos de miles de kioscos, almacenes, despensas, ferreterías de barrio con **fiado**.  
- MX + CO + PE: el mismo oficio, el mismo WhatsApp, casi el mismo MP. Copy `es-MX` no es un ERP nuevo.  
- No competís con SAP. Competís con el cuaderno y Maxikiosco.

Para libertad **no necesitás 100.000 cajas**. Necesitás **miles de anclas vivas** y que **10–20%** paguen un extra chico. Eso cabe en AR; LATAM hispana es margen y no-concentración-país, no “el plan B si AR falla el mes 2”.

US / Stripe / SMS es **otro** negocio (crédito, PCI, ads caros). Tener `us` en `markets.ts` no te obliga a gastarlo.

---

## 3. Cuentas (orden de magnitud, no un budget)

Supuestos **conservadores** (no el slide del inversor):

- Ancla $0: 1 caja, fiado, stock, caja. 0 WA, 0 AFIP prod.  
- Infra ~**USD 0,70 / ancla activa / mes** (ver COSTOS). Purge a 90 días.  
- Extra (Cobrá / 2ª caja / AFIP): **USD 8–15 / mes**. Conversión **10–15%** de anclas **vivas** (no de registros).  
- ClavPay: **0,5–1%** solo de lo cobrado por link. El efectivo del mostrador **0%**.  
- Impuestos AR (IIBB + ganancias sobre el resultado): comerse **~30–40%** del “neto empresa”. Por eso la tabla habla de **bolsillo**.

| Anclas **vivas** | Pagan extra (~12%) | MRR extra | Infra | Resultado empresa | **Bolsillo founder*** | Qué es |
|------------------|--------------------|-----------|-------|-------------------|------------------------|--------|
| 200 (piloto) | ~25 | ~USD 250 | ~USD 150 + piso Pro | ~0 | 0 | Validar que usan fiado |
| 1.000 | ~120 | ~1.400 | ~800 | ~600 | **casi nada** | Cubris invoice. Todavía no libre |
| **2.500** | ~300 | ~3.000–3.600 | ~1.800 | ~1.500 | **~1.000** | Flaca. No alcanza |
| **5.000** | ~600–750 | ~7–9 k | ~4–5 k | ~3–4 k | **~2.500–3.000** | **Piso de libertad** si sos **solo** y vivís ajustado |
| **8.000–10.000** (AR + 1 país) | ~1.000–1.500 | ~12–18 k + ClavPay 2–6 k | ~8–12 k | ~8–12 k | **~5.000–8.000** | **Suficiente.** Norte real |
| 20.000+ | extras + % cobro | 30 k+ | hay que **salir** de Vercel puro | empresa | holgada + 1–2 sueldos | Todavía no millonario |

\*Después de ~35% de impuestos sobre el resultado. Si facturás todo en ARS y el extra no se indexa al USD, **estos números se pudren**. El extra tiene que ser **USD-equivalente** (o ARS que se toque).

**Lectura honesta:**

- 1.000 clientes **usando** no te hacen libre. Te hacen “el SaaS no pierde plata”.  
- Libertad **empieza** cerca de **5.000 anclas vivas** con ~12% extra, **vos solo**, sin oficina, sin empleados digitales como costo, sin ads US.  
- Libertad **cómoda** es **~10.000** en LATAM hispana, un extra que se entiende en la calle, y ClavPay en los que ya cobran fiado por link.  
- Si la conversión a extra es **5%** y no 12%, duplicá anclas o el take rate tiene que laburar. No inventes precio ERP.

Mezcla que cierra más fácil que “más licencia”:

```text
bolsillo ≈  (pagadores × USD 10–12  +  volumen_link × 0,8%)
           − infra
           − impuestos
```

A 8.000 anclas, **no** necesitás que paguen todas. Necesitás ~1.000 que paguen Cobrá **o** un puñado de almacenes cobrando fiado grande por link.

---

## 4. Lo que **sí** te saca de la libertad (aunque “haya mercado”)

| Trampa | Por qué te deja sin bolsillo |
|--------|------------------------------|
| Soporte humano por cada alta | El margen se va en vos-como-helpdesk. Self-serve o no hay libertad |
| Extra que no se entiende en 5 s | Conversión 12% → 2%. Ahí 10.000 anclas no alcanzan |
| Precio del extra en ARS muerto | Inflación te come el MRR en 6 meses |
| WA / AFIP en el ancla | Costo variable; el gratis te funde |
| 40 módulos en el onboarding | El kiosquero no activa. Sin activación no hay extra |
| Contratar 3 personas “para escalar” antes de 5.000 vivas | Te volvés una agencia con burn |
| Medir el año con unicornio | Gastás el runway en US y landings |

Libertad de founder **solo** es un producto **estrecho**, alta por QR, y un item shop que el comerciante **elige** porque le entra plata o le saca un trámite.

---

## 5. Relación con el unicornio

| Norte | Lo usás para | Lo usás mal si |
|-------|----------------|----------------|
| **Este doc** | Decidir precio, piloto, qué codear este trimestre | Te dormís en 80 clientes “a mano” y nunca llegás a 5.000 |
| **Puerta unicornio** | No hardcodear CUIT en el POS; `marketId`; mismo binario MX | Gastás en Miami / Stripe / CFDI “por si acaso” |

Si LATAM te deja libre, **ya ganaste**. El unicornio sería un accidente de densidad (muchas cajas + % de cobro), no un plan de slides.

---

## 6. Camino mínimo (18 meses, mismo que escala, otro KPI)

| Fase | Meta de **libertad** (no de valuación) |
|------|----------------------------------------|
| 0–3 meses | 200 anclas **usando** (1 fiado o 1 venta / 48 h). $0. Medir activación |
| 3–9 meses | 2–5 mil vivas. Extra Cobrá visible. Offline P0. Invoice cubierto. **Todavía no libre** |
| 9–18 meses | **~8–10 mil** AR (o AR + copy MX/CO). ~12% extra + ClavPay en links. **Bolsillo USD 5–8 k** |
| 18+ | Segundo país hispano **solo** si AR ya te alimenta. Hardware si piden. US: no |

Si a los 6 meses **<30% de las altas** anotan un fiado, no hay libertad más adelante: el gancho no pega. No “falta un módulo de tesorería”.

---

## 7. Decisión (norte)

| Pregunta | Pies en la tierra |
|----------|-------------------|
| ¿Es suficiente no ser millonario? | **Sí.** |
| ¿LATAM solo alcanza? | **Sí**, si el producto es mostrador+fiado y el extra se paga solo. |
| ¿Hay que perseguir unicornio ahora? | **No.** Dejar la puerta (`markets.ts`). No pagar la puerta. |
| ¿Cuántas cajas para “ya fui”? | Orden: **5 mil** piso flaco · **8–10 mil** suficiente · no 100 mil |
| ¿Qué no codear para llegar ahí? | Empleados digitales, ERP de 40 rubros, US, AFIP/WA en el gratis |

*SKU ancla + paywall extra: PAJARO_EN_MANO §8. Infra: COSTOS. Puerta: PUERTA_UNICORNIO.*

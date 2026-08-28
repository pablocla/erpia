# Puerta abierta a unicornio e internacional — al menor costo

**Fecha:** 2026-08-25  
**Para:** founder · Grok (no fork) · Gemini (copy por mercado, después)  
**Dominio canónico:** `https://claver.com.ar`  
**Hermanos:** [`SERVIDOR_GRATIS_ITEM_SHOP.md`](./SERVIDOR_GRATIS_ITEM_SHOP.md) · [`POS_GRATIS_ESCALA.md`](./POS_GRATIS_ESCALA.md) · [`LIBERTAD_FINANCIERA_LATAM.md`](./LIBERTAD_FINANCIERA_LATAM.md) · [`COSTOS_ESCATIMAR.md`](./COSTOS_ESCATIMAR.md)

**Cómo se deja la puerta abierta sin pagarla ahora:** un solo producto, un solo deploy, **config de mercado** (país → moneda → pago → idioma). No un ERP por país. No ads en USD. No forkar.

Ya hay el gancho en código: `lib/comercial/markets.ts` (`ar` | `mx` | `br` | `us`). Eso **es** la puerta. No hay que construirla: hay que **no cerrarla**.

**Norte del trimestre:** libertad financiera LATAM, no valuación unicornio. Este doc solo dice **cómo no cerrar** MX/US el día que existan. El KPI de “ya fui” está en [`LIBERTAD_FINANCIERA_LATAM.md`](./LIBERTAD_FINANCIERA_LATAM.md).

---

## 1. Qué es “unicornio” acá (para no gastar mal)

Unicornio ≠ “ERP internacional con 40 verticales”.

Unicornio = **muchas cajas jugando en el mismo servidor** (AR → LATAM → extra) + **item shop** (cobro %, AFIP/fiscal local, 2ª caja).

| Camino barato (puerta abierta) | Camino caro (puerta cerrada o presupuesto quemado) |
|--------------------------------|-----------------------------------------------------|
| 1 código, 1 Vercel, `empresa.pais` / `marketId` | Repo US, repo MX, “Claver USA Inc” el año 1 |
| Gratis mostrador AR → copiar el mismo a MX | Landings US, Stripe, SMS, sales tax **ahora** |
| WhatsApp + Mercado Pago donde ya existen | Construir PSP propio |
| Copy `es-AR` primero; `es-MX` es el 90% del siguiente país | Traducir 40 módulos al inglés para 0 clientes |
| Dominio `claver.com.ar`; el día MX: `claver.com.mx` o path `?market=mx` | Comprar 15 TLDs y 15 certificados “por las dudas” |

La puerta abierta **cuesta casi 0** si no contratás gente ni infra para un mercado vacío.

---

## 2. Capas: qué congelar vs qué sí tocar

### No tocar (el juego)

POS, fiado/CC, stock, caja, clientes, ticket. Eso es **internacional de fábrica** (toda pyme cobra y fía). No le pongas CUIT en el corazón: CUIT es un campo de **AR**.

### Configuración por mercado (la puerta)

Ya modelado:

| Mercado | Locale | Moneda | Pago | Mensajería | Fiscal |
|---------|--------|--------|------|------------|--------|
| `ar` | es-AR | ARS | Mercado Pago | WhatsApp | AFIP/IVA (visible) |
| `mx` | es-MX | MXN | MP MX | WhatsApp | hide fiscal AR |
| `br` | (pt) | BRL | MP BR | WhatsApp | hide AR |
| `us` | en-US | USD | Stripe | SMS | hide fiscal AR |

**Costo de dejarlo abierto:** cada feature **nueva** pregunta `market.hideFiscalLocal` / `payments`. No if `cuit` hardcode en el POS. Un enum, no 4 apps.

### Item shop local (se paga)

- AR: AFIP, IIBB, padrones.  
- MX: CFDI (cuando haya demanda **real**).  
- US: Stripe + sales tax (cuando haya demanda **real**).  

No construyas CFDI “por si el unicornio”. El día que haya 500 cajas MX **pidiendo factura**, es un SKU. Hasta entonces el mostrador MX es el mismo que AR sin AFIP.

---

## 3. Secuencia de menor costo (opción real, no brochure)

```
Hoy     AR · claver.com.ar · ancla gratis · item shop AR
  ↓     (no gastar en US)
Año 1   1–5 mil cajas AR vivas
  ↓     mismo binario
Año 1–2 Copy es-MX + MP MX + WhatsApp
        País: MX o CO (mismo español, mismo WA, mismo MP)
  ↓     si hay densidad
Año 2+  BR (idioma) o ES
  ↓     solo si un tenant paga
Nunca-primero  US/Stripe/SMS — es otro juego (crédito, PCI, ads caros)
```

**Internacional barato = LATAM hispana.** US es opcional en `markets.ts`; **no es el plan de gasto**. Tener el enum `us` no te obliga a una oficina en Miami.

---

## 4. Infra: un servidor, muchos países (mínimo costo)

| Decisión | Barato / puerta abierta | Caro |
|----------|-------------------------|------|
| Deploy | Un proyecto Vercel `claver.com.ar` | Un Vercel por país |
| DB | Un Postgres, `empresaId` + `pais`/`marketId` | Una DB por país el año 1 |
| Región | São Paulo sirve AR+MX+BR | us-east + 3 réplicas “por si acaso” |
| URL | Mismo host; `locale` cookie / geo (ya hay mercado por cookie) | `app.us.claver.io` vacío |
| Custom domain | Item shop **si lo piden** | Bundles de dominios comprados ya |
| i18n | Archivos `messages/es-AR.json` + `es-MX.json` (delta chico) | Agencia de traducción de todo el ERP |
| Pagos | Interface `cobrar(market)` → MP o Stripe | Integrar 6 PSPs |

Horizontal (más países) = **más filas `empresa`**, no más clusters.  
Vertical (empresa grande en MX) = mismo item shop (2ª caja, reportes).

El día que un país **pague** densidad, recién: región más cerca, `cliente.claver.com.mx`. Eso es chiche enterprise, no el día 0.

---

## 5. Qué **sí** hacer ahora (cuesta horas, no dólares de ads)

Checklist Grok/producto para **no cerrar** la puerta:

1. **`empresa.pais` / marketId** en alta (default `AR`).  
2. **Ningún `CUIT` obligatorio** en el flujo ancla; es campo AR.  
3. **Montos** con `Intl` + moneda del mercado, no `"$"` hardcode en 400 pantallas (ir tapando al tocar archivos).  
4. **Item shop** por SKU, no “módulo Argentina”. AFIP = SKU `fiscal.afip`, no `if (true)`.  
5. **No** crear `app/us/` de producto POS. Landings US pueden morir de hambre.  
6. WhatsApp / MP detrás de `MarketConfig.messaging` / `payments`.  
7. Dominio público y QR: **`https://claver.com.ar`** y `https://claver.com.ar/f`. Otro TLD = cuando ese mercado exista.

Gemini (después, no ahora): glosario fiado → “cuenta” / “fiado” MX; no un sitio nuevo.

---

## 6. Qué **no** hacer (cierra la puerta o quema plata)

- Traducir todo a inglés “para inversores”.  
- Stripe + SOC2 + Delaware **antes** de 1.000 cajas AR.  
- Un vendedor en México sin 200 anclas AR que funcionen.  
- Fiscal de cada país en el core.  
- Precio en USD en la UI AR.  
- Fork “Claver International”.  
- Empleados digitales como vehículo de expansión.

---

## 7. Cómo se financia el salto de país (sin inventar costo)

| Etapa | Quién paga infra | Internacional |
|-------|------------------|---------------|
| AR ancla | Extras 10–20% + founder | $0 |
| AR + ClavPay | % del **link**, no del ticket efectivo | $0 |
| Primer MX | Mismo cluster SP; copy MX | Costo ≈ un landing + MP MX (días, no un año) |
| MX denso | Item shop local (factura MX) **si piden** | Como AFIP: SKU, no reescritura |

La puerta unicornio **internacional** es: *el mismo juego, otro `marketId`.*  
La plata del unicornio sigue siendo: **muchos jugadores en el servidor + tienda de cobro.**

---

## 8. DoD “puerta abierta, costo mínimo”

- [ ] Un deploy, un dominio de verdad: **claver.com.ar**.  
- [ ] `markets.ts` se respeta en features **nuevas** (no más AFIP mezclado al POS).  
- [ ] Ancla gratis solo AR hasta que HUM diga “abrir MX”.  
- [ ] Cero gasto fijo mensual atribuible a US/EU.  
- [ ] Fiado/POS/caja no asumen CUIT.  
- [ ] Item shop es lista de SKUs, no de países.

Cuando AR esté llena de partidas, copiar el servidor a MX es un **config + copy**, no un segundo Claver.

*Puerta abierta = disciplina. Unicornio = densidad AR primero. Internacional = LATAM hispana en el mismo binario. US = casilla en un enum, no una factura.*

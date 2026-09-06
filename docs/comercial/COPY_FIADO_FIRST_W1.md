# Copy Fiado-first W1 — Marketing Claver
Funnel: `/` → `/f` → `/login/register?activar=pos.fiado_barrio`
Tono: es-AR, claro, confiable, operativo. Sin hype. Sin jerga sin glosa.
Código aún en hold (Pro vs local) — este pack es texto listo para pegar.

---

## `/` — home (above-the-fold)

**Eyebrow / chip**
`Gratis para arrancar · Sin tarjeta`

**H1**
`Quién te debe, en pantalla.`

**Sub**
`Arrancás con la libreta de fiados del local. Caja, stock y factura oficial (AFIP) los sumás después, cuando te hagan falta.`

**CTA primario** (≥48px)
`Empezar gratis`
→ `/f` o directo a register con `activar=pos.fiado_barrio` (según routing actual del funnel)

**CTA secundario** (ghost)
`Ya tengo cuenta` → `/login`

**Microcopy bajo CTA**
`1 minuto · Sin tarjeta · Empezás por el fiado`

**Glosas (si quedan en above-fold)**
| Antes (evitar crudo) | Después |
|---|---|
| ARCA / CAE | `Factura oficial AFIP (cuando la pactés)` |
| B2B | `Cuentas entre comercios` |
| Arqueo ciego | `Control de caja por turno` |
| ERP | *(sacar del above-fold; no usar)* |

**Header CTA** (mismo label que hero)
`Empezar gratis`

**Nota oficios** (secundario, no compite)
Link quieto: `¿Sos oficios / presupuestos?` → landing oficios (fuera de W1 creativo ads)

---

## `/f` — landing Fiado

**Eyebrow**
`Gratis · Sin tarjeta · Sin vencimiento del cuaderno`

**H1** (reemplaza “Caja, stock y fiado”)
`Tu libreta de fiados. En el celular.`

**Sub bajo H1 / bajo CTA**
`Anotá quién te debe y cuánto. Chau cuaderno de papel.`
`Caja, stock y WhatsApp de cobro los activás después — no hace falta el día uno.`

**CTA primario** (mantener h-14)
`Empezar gratis`
→ `/login/register?activar=pos.fiado_barrio`

**Microcopy bajo CTA**
`Empezás con Claver Fiado (libreta). El resto, cuando el negocio lo pida.`

**Bloque “qué incluye / qué no”** (corto, under fold OK)
- Incluye hoy: deudores, saldos, historial de fiado, ticket interno.
- Después (opcionales): aviso WhatsApp al deudor, link de cobro, factura AFIP, más cajas.

**FAQ hint (si tocan una línea)**
`¿Hace factura AFIP?` → `El gratis es la libreta. La factura oficial se pacta cuando la necesites.`

**No usar en H1/sub above-fold:** ERP, CAE, B2B, “sistema completo”, “gestión integral”.

---

## Register — `?activar=pos.fiado_barrio`

**Título**
`Probar Claver Fiado`

**Sub / lema**
`Libreta de quién te debe — para almacén y kiosco`

**Alert banner** (reemplaza “No vas a ver el ERP completo”)
`Vas a activar la libreta de fiados. Caja, stock y factura oficial los podés sumar después.`

**Submit** (≥48px)
`Empezar con Claver Fiado`

**Alt Google**
`Continuar con Google`

**Micro bajo form**
`Sin tarjeta. Podés salir cuando quieras.`

---

## `lib/comercial/activar-intent.ts` — `pos.fiado_barrio`

| Campo | Copy |
|---|---|
| `marca` | `Claver Fiado` |
| `productName` | `Libreta de fiados` |
| `lema` | `Quién te debe, en pantalla` |
| `mensajeActivarTrial(...)` | `Activás la libreta de fiados. Caja y stock los sumás después.` |

---

## Checklist copy (DoD marketing)

1. En ≤10s se entiende: empiezo gratis la libreta de fiados, sin tarjeta.
2. Ningún “ERP” sin glosa en `/`, `/f`, register del funnel fiado.
3. CTA “Empezar gratis” no promete sistema completo / caja+stock el día uno.
4. ARCA/CAE/B2B fuera del above-fold o con glosa de una línea.
5. Ads siguen piloto; pauta masiva = reality gate CTO + UX checklist verde.

— Marketing Claver · 2026-09-06

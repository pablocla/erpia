# Spec home above-fold — Tier A (2026-09-06)

**Problema (prod hoy):** hero/puertas empujan Fiado/kiosco + oficios; no hay ferretería ni gym above-fold. Desalineado al ICP oficial (ferretería → servicios → gym).  
**Dueño:** Producto · **Copy:** Marketing (`COPY_TIER_A_LANDINGS_W1.md`) · **Install:** CTO (PR home / post-merge A)

## Above-the-fold (viewport móvil + desktop)

### Header
- CTA único ≥48px: **Empezar gratis** → destino #1 Ferretería (interim: `/demo/ferreteria` o register `activar=pos.core`; post-PR3: `/ferreteria`)
- Secundario ghost: Ya tengo cuenta
- Nav: Soluciones / Cómo funciona / Preguntas (hamburguesa mobile)

### Hero
| Elemento | Contenido |
|----------|-----------|
| Eyebrow | Software para PyMEs de mostrador y servicios · Sin tarjeta |
| H1 | Stock, venta y cobro. Sin planilla eterna. |
| Sub | Empezá por ferretería, oficios o gym. El resto lo sumás después. |
| CTA primario ≥48px | Empezar gratis → Ferretería (#1) |
| Micro | 1 minuto · Sin tarjeta · Sin promesa ERP full |
| Link quieto | ¿Sos oficios? / ¿Tenés gym? (secundarios, no compiten) |

**No above-fold:** Fiado/libreta, “arqueo ciego”, ARCA/CAE sin glosa, catálogo de 8 rubros densos, Command Palette/ERP settings.

### Tres puertas (orden fijo ICP)

| # | Puerta | H2 corto | CTA | Destino HOY | Destino post-PR3 | activar |
|---|--------|----------|-----|-------------|------------------|---------|
| 1 | **Ferretería** | Stock y venta en el mostrador | Empezar gratis | `/demo/ferreteria` → register | `/ferreteria` | `pos.core` hoy → `ferreteria` en PR3 |
| 2 | **Servicios / oficios** | Cotizá, seña y cobrá | Empezar gratis | `/claver/apps/servicios` o `/f/servicios` | igual o `/servicios` | `pool-servicios-pro` / `niche.oficios` |
| 3 | **Gym** | Socios, cuotas y morosos | Empezar gratis | `/demo/gimnasio` → register | `/gimnasio` | `gimnasio` / `niche.gimnasio_barrio` |

- Una sola CTA primaria por puerta, ≥48px, mismo peso visual entre las 3.
- Bajo fold OK: POS, Cobrá WA, Fiado (anexo, label “Kiosco / libreta”), resto de catálogo.

### Qué sacar / bajar del above-fold actual
1. Puerta dominante “Comercios/Kioscos & Almacenes” / Fiado como #1 → **bajar a anexo**.
2. Oficios como pareja #1–2 → **queda #2**, no dominante sola.
3. Grid 8 rubros (seña, estética, B2B…) → **bajo fold** o “Ver más rubros”.

## Criterio DoD home
- [ ] En ≤5s se lee ferretería/servicios/gym, no fiado.
- [ ] CTA primario no apunta a `/f` por default.
- [ ] Touch ≥48px; sin overflow mobile; menú visible.
- [ ] Copy sin ERP/CAE crudo above-fold.

## Coord Marketing
Usar strings de `COPY_TIER_A_LANDINGS_W1.md` en H2/CTA/micro de cada puerta. Hero H1 de este doc (PyME genérico Tier A, no Fiado).

— Producto Claver · 2026-09-06

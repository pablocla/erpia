# UX Release Gate — superficies de conversión (edad avanzada)

**Dueño:** Producto Claver
**Implementa:** CTO Claver
**Gate:** junto con reality gate (signup → MP real → POS) **antes de pauta masiva**
**Scope:** solo `/`, `/f`, `/login/register` (no dashboard ERP)
**Auditoría:** 6/10 — CTA ~32px, jerga, mobile overflow/targets

Funnel observado: `/` → `/f` → `/login/register?activar=pos.fiado_barrio`

---

## 1) CTA principal ≥48px, uno solo claro

### Criterio de aceptación
- [ ] Un solo CTA primario visible above-the-fold en `/` con altura **≥48px** y label **“Empezar gratis”** (o “Empezar con mi local gratis” si mantiene el beneficio).
- [ ] Header CTA en `/` deja de usar `Button size="sm"` (~32px / `h-8`).
- [ ] Secundarios (login, oficios, ARCA) no compiten: ghost/outline, sin mismo peso visual.
- [ ] En `/f` el CTA ya usa `LANDING_F_CTA_CLASS` (`h-14`) — **mantener**; no bajarlo.
- [ ] Submit de registro ≥48px de alto (hoy `Button` default `h-9`).

### Archivos
| Ruta | Qué tocar |
|------|-----------|
| `components/marketing/landing-home-puertas.tsx` | Header: CTA `size="sm"` → `lg` + `min-h-12`/`h-12` (≥48px). Hero: CTA primario grande centrado/above fold; secundario oficios más quieto. |
| `components/ui/button.tsx` | Opcional: size `xl`/`touch` con `min-h-12` (48px) para conversión; no romper POS. |
| `lib/comercial/landing-f.ts` | `LANDING_F_CTA_CLASS` ya `h-14` — no achicar. |
| `app/f/page.tsx` | Usar CTA existente; verificar un solo primario above fold. |
| `components/marketing/landing-f-chrome.tsx` | Header chrome `/f`: botones ≥48px en mobile. |
| `app/login/register/page.tsx` | Submit + Google area: altura táctil ≥48px. |

---

## 2) Copy llano: Fiado vs ERP antes del registro

### Criterio de aceptación
- [ ] Antes de llegar al form (home y/o `/f` y banner de register): texto llano que diga qué arranca el trial.
  - Ejemplo guía: **“Arrancás con la libreta de fiados (quién te debe). El sistema completo de caja/stock lo sumás después.”**
- [ ] En register (`activar=pos.fiado_barrio`): reemplazar o glosar “No vas a ver el ERP completo” → sin jerga ERP, o con glosa entre paréntesis.
- [ ] En `/` y `/f`: CAE / ARCA / B2B / arqueo ciego — o se sacan del above-fold o llevan glosa de una línea (“factura oficial AFIP”, “cuentas entre comercios”).
- [ ] Expectativa del CTA genérico “Empezar gratis” alineada al pack real (`pos.fiado_barrio` / Claver Fiado), no promesa de ERP full.

### Archivos
| Ruta | Qué tocar |
|------|-----------|
| `components/marketing/landing-home-puertas.tsx` | Hero + bloque seguridad AFIP/ARCA: copy llano + glosas; menos densidad de rubros above-fold si compite con CTA. |
| `app/f/page.tsx` | Subtítulo bajo CTA: qué incluye el gratis (fiado) vs qué queda para después. |
| `app/login/register/page.tsx` | Alert `activarIntent`: quitar “ERP” crudo; copy Fiado-first. |
| `lib/comercial/activar-intent.ts` | `lema` / `mensajeActivarTrial` / `productName` en lenguaje de dueño de almacén. |
| `lib/comercial/landing-f.ts` | Comentario/spec ya apunta a un dolor un CTA — respetar. |

**Fuera de scope W1:** rewrite completo de 8 rubros / FAQ / demo `/demo/almacen`.

---

## 3) Mobile: touch 44–48px, sin overflow, menú visible

### Criterio de aceptación (viewport ~390px)
- [ ] Todos los controles táctiles de conversión ≥**44px** (ideal **48px**): header CTA, hero CTA, chips/tarjetas clickeables del funnel, inputs y submit de register.
- [ ] **Sin scroll horizontal** en `/`, `/f`, `/login/register` (`document` width ≤ viewport; cuidado con Google Sign-In).
- [ ] Nav de `/`: hoy `nav` es `hidden md:flex` **sin hamburguesa**. Agregar menú móvil visible (patrón ya existe en `components/marketing/claver-shell.tsx` con `Menu`/`X`).
- [ ] Links “Ya tengo cuenta” / “Empezar gratis” siguen alcanzables; menú no tapa el CTA primario.

### Archivos
| Ruta | Qué tocar |
|------|-----------|
| `components/marketing/landing-home-puertas.tsx` | Mobile nav (hamburguesa), overflow-x, touch targets header/hero. |
| `components/marketing/claver-shell.tsx` | Referencia de patrón mobile menu (no cambiar shell Group salvo reusar). |
| `components/marketing/landing-f-chrome.tsx` | Chrome `/f` mobile: sin overflow, targets OK. |
| `app/login/register/page.tsx` | Contenedor `min-h-screen` + form: `overflow-x-hidden` / max-width; inputs `min-h-12`; Google button no desborda. |
| `components/auth/google-sign-in-button.tsx` | Si causa overflow ~398px vs 375px. |

---

## QA checklist (Definition of Done)

1. Desktop 1280 + mobile 390 en `/`, `/f`, register con `activar=pos.fiado_barrio`.
2. Medir altura CTA primario ≥48px (DevTools).
3. Ningún `scrollWidth > clientWidth` en esas 3 rutas.
4. Una persona +65 entiende en ≤10s: “empiezo gratis la libreta de fiados, sin tarjeta”.
5. **No** tocar dashboard POS/fiado in-app en este PR (prioridad conversión).

## Amarrado al release gate

Pauta masiva = **reality gate CTO verde** **Y** este checklist UX verde.
Hasta entonces: solo piloto/anclas.

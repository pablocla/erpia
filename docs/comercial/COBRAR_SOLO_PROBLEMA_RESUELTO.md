# Cobrar solo si ya les resolvimos el problema

**Fecha:** 2026-08-26  
**Owner:** grok  
**Para:** founder · vendedor · tester · partners · grok · gemini  
**Estado:** regla operativa + spec `/f` (kiosco) + `/f/servicios` (oficios) + test lineal  
**Hermanos:** `CANON_FREE.md` · `COPY_LANDING_F.md` · `PAJARO_EN_MANO.md` · `CADENCIA_UPSELL_FREE.md` · `DISCUSION_GROK_CLAUDE_LANDING_FREE_PARTNERS.md` §G  
**No manda:** `ESTRATEGIA_1_USUARIO_GRATIS_LANDING_MARKETING.md` (se toma color/tobogán; **no** “1 usuario = todo incluido”)

---

## 0. Qué haría yo (cierre)

No tirar el gancho de hoy. No pasar a “1 usuario, todo incluido”.

- **Gratis:** diagnóstico y día a día **en pantalla**.  
- **Plata:** el disparo, cuando el problema ya está medido (WhatsApp, link de cobro/seña, CAE).  
- **Landing:** **`/` no es el catálogo.** Es una pregunta y dos puertas. Cero menú ERP, cero $29.900, cero “14-Day Free Trial”. El hub viejo quedó en `/explorar` (noindex). Precios, si hace falta, en `/claver/apps`.

| Quién | Puerta | Se convence con | Se le cobra cuando |
|-------|--------|-----------------|---------------------|
| Llega a claver.com.ar | `/` | “¿Local o oficio?” | — (aún no) |
| Kiosco / almacén | `/f` | Libreta: Pérez $12.000 | Aviso WA / link / AFIP |
| Oficio / empresa de servicio | `/f/servicios` | Presupuesto 3 niveles + “quién no pagó la seña” | Link de seña / WA / Factura C |

No se convence a un plomero mostrándole caja y fiado. No se convence a un kiosco mostrándole CIRSOC. **Misma fábrica, misma regla de plata, otro primer pantallazo.**

Frase kiosco:

> Caja y libreta, gratis. Cuando quieras que el mensaje salga solo, o la factura AFIP, lo prendemos.

Frase oficio (calle, 10 s):

> Armá el presupuesto en el celu. Tres opciones. La seña se ve. El link para cobrarla se prende cuando el cliente tiene que poner plata.

Frase interna:

> No cobramos por existir. Cobramos cuando ya les mostramos la deuda / la seña pendiente / la caja y ellos piden que lo ejecutemos.

---

## 1. No perder lo de hoy

| Queda | Por qué |
|-------|---------|
| `/f` + QR `claver.com.ar/f` + `?ref=` | Puerta kiosco |
| `/f/servicios` + `?activar=niche.oficios` | Puerta oficio (no mezclar en el hero de `/f`) |
| Fiado $0, sin tarjeta | Pájaro en mano |
| Dueño + 1 cajero, 1 caja | El de la tarde **usa** el gratis; no es peaje |
| Item shop: Cobrá, AFIP, 2ª caja, 3er user, reportes 12 m | Costo nuestro o escala |
| Partner $0; comisión solo si pagan extra | Anti-pirámide |
| Bounty 100% mes 1 del extra | CAC de calle |
| 0 WhatsApp outbound en ancla | Infra y ToS |
| Purge 90 d | Los muertos no se subsidian |

**No:** plan por asientos como historia, “todo incluido”, AFIP en un pack de usuarios, 8 landings `/f/{nicho}` (pelu, gym, consorcio…) ahora, Leo/LLM en el $0. **Sí** una segunda puerta: oficios. Pelu/gym después, mismo molde.

**Sí de Claude:** tobogán, CTA naranja, badge menta, frases de producto (sin decir “IA”), un dolor por nicho **después**.

---

## 2. Tres capas

### Capa 0 — $0 (CPU + pantalla)

| Problema | Gratis | Cómo, barato |
|----------|--------|----------------|
| Quién me debe | Libreta | `pos.fiado_barrio` |
| Cuánto vendí hoy | 1 caja + cierre + hoy/ayer | POS lite (no bajar el ERP) |
| Qué me falta | Stock + aviso en pantalla | Query, no LLM |
| Cajero de la tarde | 2º usuario | Cap 2. El 3º se cobra |
| Oficio: “no me pagan la seña” | Presupuesto 3 niveles + lista de trabajos en pantalla | `/dashboard/oficios`. Ancla $0 de presupuestos = **HUM-ancla-oficios** (hoy: trial 7 d `niche.oficios`) |

Avisos de landing = **reglas SQL**. Mandar el WA = extra.

### Capa 1 — plata, solo con prueba de problema

| Extra | Cuándo se ofrece | Partner |
|-------|------------------|---------|
| Cobrá (kiosco) | ≥10 deudores o saldo grande **y** ya vio “quién me debe” | 30% del mes |
| Seña link (oficio) | Ya tiene un presupuesto aceptado o seña pendiente en pantalla | 30% del extra |
| AFIP prod / Factura C | Tocó Factura A/B/C | 30% / setup 100% si implementa |
| Registro solo | $0 | $0 |

D0–D3 cero shop. D14 Cobrá solo con detonante. D60 silencio si no duele.

### Capa 2 — escala, no el calco

2ª caja, 3er usuario, reportes 12 m, URL propia.

---

## 3. Cómo va a quedar `/` (la que veían con precios)

Lo que se pegó (nav Apps/ERP/Demos/Partners/Precios/Cloud, chips Oficios/Fiado/Turnos, cards $ 29.900, inglés mezclado) **era `ClaverMatrixHub` en `app/page.tsx`**. No era `/f`.

Ahora `/` es **siempre Argentina** (no se cambia por geo/US). Header ancho, dos tarjetas: apiladas en celu, lado a lado en desktop.

```
¿Qué tenés que ordenar hoy?
[ Local, kiosco o almacén ] → /f
[ Oficio u obra ]           → /f/servicios
Footer: Hecho para comercios de Argentina · Términos · Partners · catálogo
```

`/f` y `/f/servicios`: en celu una columna; en desktop copy a la izquierda y preview a la derecha, features en 3 columnas. Mismos CTA y `?activar=`.

**No hay** $ 29.900, 14-day trial, Start Free Trial, United States, ni Claver Cloud.  
Catálogo: `/claver/apps`. Hub viejo: `/explorar`.

---

## 3.0 Cómo va a quedar `/f` (spec visual)

Una columna, `max-w-lg`, celular primero. **No** hay menú de 8 ítems, **no** hay 11 apps, **no** hay “Ser partner” en el hero.

Tokens (solo esta página, `data-page="landing"` — el dashboard no cambia):

| Pieza | Color |
|-------|--------|
| Badge “Gratis para siempre” | Verde menta `--landing-badge-free` |
| CTA | Naranja `--landing-cta` (~orange-500), texto oscuro, alto 56px, uppercase |
| Precio $0 | Mismo naranja, grande |
| Acentos de checks | Verde `--landing-accent` |
| Fondo | El del producto (claro). No mezclar Linear-dark esta semana |

### Tobogán (orden de scroll — esto se testea lineal)

```
┌─────────────────────────────────────────┐
│ Logo Claver          Ya tengo cuenta    │  ← header. Un solo CTA de alta abajo
├─────────────────────────────────────────┤
│ [badge menta] Gratis para siempre       │
│                                         │
│ Tu negocio en el celular.               │  ← H1 Fraunces
│ Caja, stock y fiado. Gratis.            │
│                                         │
│ Anotá ventas, stock y quién te debe.    │
│                                         │
│ [ 🟠 EMPEZAR GRATIS AHORA ]             │  ← CTA #1 → registro
│ Ticket y libreta no vencen. …           │
├─────────────────────────────────────────┤
│ Quién me debe · ahora                   │  ← preview estático (Pérez $12.000)
│ Pérez    $12.000                        │
│ García    $4.500                        │
├─────────────────────────────────────────┤
│ Chau cuaderno / Cobro mostrador / Celu  │
├─────────────────────────────────────────┤
│ El sistema te avisa. Vos vendés.        │  ← 4 frases de producto, NO “IA”
│ (stock, cobranza, caja, semana)         │
├─────────────────────────────────────────┤
│ ¿Por qué es gratis?   $0                │
│ dueño + 1 cajero · 1 caja               │
│ [acordeón] Hay extras. No las necesitás │
├─────────────────────────────────────────┤
│ Preguntas de vereda (4)                 │  ← trucho / tarjeta / AFIP / cierran
├─────────────────────────────────────────┤
│ [ 🟠 EMPEZAR GRATIS AHORA ]             │  ← CTA #2, mismo href
│ 1 minuto. Sin descargar nada.           │
├─────────────────────────────────────────┤
│ Términos · Privacidad · Partners        │  ← partners NO en el hero
└─────────────────────────────────────────┘
```

**CTA único de conversión:** `Empezar gratis ahora` →  
`/login/register?activar=pos.fiado_barrio`  
si hay partner: `&ref=CODIGO`.

“Ya tengo cuenta” es **retorno**, no un segundo producto.

**Prohibido en `/f`:** mega menú, Free/Pro/Enterprise, tarjeta, “trial” al lado de “gratis”, “11 apps”, chatbot a los 3 s, grid de oficios **en el hero**, link al catálogo **antes** del CTA de cierre.

Oficios solo en el **footer** (`¿Presupuestás obras u oficios?`). El kiosquero no elige producto arriba del fold.

Archivo: `app/f/page.tsx`. Tokens: `app/globals.css` `[data-page="landing"]`.

### 3.1 `/f/servicios` — cómo se convence una empresa de servicio

No le hables de caja ni de fiado. El equivalente:

| Kiosco `/f` | Oficio `/f/servicios` |
|-------------|------------------------|
| Quién me debe | Quién no pagó la seña / no respondió el presupuesto |
| Ticket interno | Presupuesto 3 niveles (esencial / recomendado / completo) |
| Extra: link + WA | Extra: link de seña MP + WA |
| Extra: Factura A/B/C | Extra: Factura C |
| Preview Pérez $12.000 | Preview Depto 4B · seña $45.000 |

Tobogán (mismo molde, otro dolor):

```
Badge: Sin tarjeta para arrancar
H1: Presupuesto en el celu. Seña antes de comprar cables.
CTA: ARMAR PRESUPUESTO AHORA → /login/register?activar=niche.oficios
Preview: Depto 4B seña / Casa López aceptado / PH sin respuesta
3 bullets: chau audio · no pongas materiales de tu bolsillo · una mano en la obra
Avisos: seña, presupuesto muerto, margen, cuadrilla
Cómo te convencés: 1 presupuesto real (el de mañana), 3 pasos
FAQ: ¿calcula el cable? NO. ¿caja de kiosco? NO. ¿tarjeta? NO.
CTA #2 igual
Footer: kiosco → /f
```

**Cómo se convencen (el truco):** no les vendés “un ERP”. Les pedís que armen **el presupuesto de mañana**. Si el cliente elige una opción, el problema ya está resuelto en pantalla. El extra aparece cuando hay que **cobrar la seña**, no al registrarse.

No promete CIRSOC, CAD, caída de tensión. Copy de `puertas/COPY_ELECTRICISTA.md` (promesa NO) se respeta.

Hoy en código oficios es **trial 7 d / ~$29.900**. La landing **no** dice “gratis para siempre”. Dice: arrancás sin tarjeta; el disparo es el link/WA. HUM-ancla-oficios = presupuesto + lista $0 como el fiado.

Archivo: `app/f/servicios/page.tsx`.

---

## 4. Test lineal — ¿se puede testear?

**Sí, de punta a punta, en un solo camino.** No hay que elegir entre 11 apps. El tester hace una cosa después de la otra.

### 4.1 Lo que SÍ se puede testear hoy (sin HUM)

Hacerlo en **celular** (375px) y en desktop. Empezá por `http://localhost:3000/` (o claver.com.ar), no por el hub viejo.

| # | Paso | URL / acción | Debe pasar | Si falla |
|---|------|----------------|------------|----------|
| 0 | Home | `GET /` | Pregunta “¿Qué tenés que ordenar hoy?”. **Cero** `$ 29.900`, **cero** “14-Day Free Trial”, **cero** nav ERP/Cloud. Dos tarjetas: local → `/f`, oficio → `/f/servicios` | Si ves precios y menú, estás en `/explorar` o el market es US |
| 1 | Abrir calle | `GET /f` | 200. **No** redirige a `/login`. Title: “Tu punto de venta y tu libreta…” | Había un redirect en `next.config`; no tiene que volver |
| 2 | Hero | Scroll 0 | Badge menta, H1 con “Gratis”, **un** botón naranja “EMPEZAR GRATIS AHORA”. No hay “11 apps” ni “Ser partner” arriba | — |
| 3 | Preview | Debajo del CTA | Lista Pérez / García / López con montos. No es un ERP | — |
| 4 | Tobogán | Scroll hasta el final | Orden §3. Segundo CTA naranja **igual** al primero. FAQ abre/cierra. Acordeón extras **sin** ir a `/claver/apps` | Si hay link de catálogo en el medio, se rompió lo lineal |
| 5 | Footer | Final | Términos, privacidad, Partners. Partners **después** del CTA de cierre | — |
| 6 | Click CTA | `/login/register?activar=pos.fiado_barrio` | Copy: **“Libreta y caja, gratis para siempre. Sin tarjeta.”** No dice “trial 14 días” | Antes mentía “POS 14 días de prueba” — ya corregido |
| 7 | Sin tarjeta | Formulario | Empresa, nombre, email, clave, términos. **Cero** CBU/tarjeta | — |
| 8 | Alta | Submit | Entra a `/dashboard/fiado` (modo lite fiado), no al ERP de 40 módulos | Si cae en `/dashboard` pelado, el `activar=` se perdió |
| 9 | Primer fiado | En la libreta | Alta 1 cliente + 1 fiado. Aparece en “quién me debe” | Checklist: `CHECKLIST_ACTIVACION_ANCLA.md` pasos 3–4 |
| 10 | Partner | `/f?ref=JUAN` | CTA lleva `&ref=JUAN`. El registro muestra “código partner JUAN” | El alta tiene que persistir `referredByPartnerId` |

**Tiempo objetivo del tester:** 3 min landing + 2 min alta + 3 min primer fiado.

### 4.2 Variante partner (lineal también)

```
QR calco → /f?ref=CODIGO → mismo tobogán → CTA con ref
         → register (alerta partner) → fiado
         → comercio $0 → partner ve “Ancla $0, ofrecele Cobrá”
         → cuando prendan Cobrá y paguen → comisión
```

No hay un camino “ser partner” mezclado en el hero del kiosco. El partner se testea aparte: `/claver/partners`.

### 4.3 Lo que todavía NO es lineal de verdad (huecos)

Anotar en el acta. No bloquear el test de calle; sí saber que no es el producto final.

| Hueco | Qué ve el tester hoy | Qué tendría que ver |
|-------|----------------------|---------------------|
| POS 1 caja $0 | Fiado sí; mostrador completo puede pedir pack/trial | Caja en el ancla (HUM-ancla + Grok shell) |
| Paywall Cobrá | El botón WA puede no estar capado | Candado: “El ticket es gratis. El aviso es extra.” **después** de tener deudores |
| Avisos de reglas | Las 4 frases están en la **landing**; in-app aún no | Mismas frases en el dashboard D7/stock |
| Chat / Ctrl+K | El layout raíz monta CommandPalette y ChatWidget (el chat no abre solo) | En `/f` no deberían existir |
| Shell ERP | Después del login hay más menú que “Libreta / Clientes” | Menú ancla (`MENU_ANCLA_VS_SHOP.md`) |
| Precio extras | Acordeón sin números | [HUM-01] cuando exista lista |

El test lineal de **adquisición** (QR → gratis → un fiado) **sí se puede hacer hoy**.  
El test lineal de **plata** (deudores → Cobrá → partner cobra) **espera** paywall en el botón + HUM-01.

### 4.4 Script de 10 minutos para el founder / vendedor

1. Celular, Chrome, sin login previo (ventana incógnito).  
2. Abrí `claver.com.ar` → elegí local u oficio. O andá directo a `/f`.  
3. **No scrollees todavía.** ¿Entendés qué es y qué hacer en 3 segundos? Si no, el H1 falló.  
4. Scrolleá una vez. No deberías tener que elegir “¿fiado o pelu o consorcio?”.  
5. Tocá el naranja. Completá el alta **sin** poner tarjeta.  
6. Anotá a Pérez $1.000. ¿Está en la lista?  
7. (Opcional) `/f?ref=PRUEBA` con un partner de test: el código tiene que sobrevivir el alta.

Pase = pasos 1–6. El 7 es el canal partner.

### 4.6 Test lineal oficios (`/f/servicios`)

Mismo criterio: **un** dolor, **un** botón, **una** pantalla post-login. No pasar por `/f` kiosco.

| # | Paso | Debe pasar |
|---|------|------------|
| S1 | `GET /f/servicios` 200, no redirect | Title de presupuestos/seña, no de fiado |
| S2 | Hero | H1 “Presupuesto en el celu”, CTA “Armar presupuesto ahora”. Cero “fiado”, cero 11 apps |
| S3 | Preview | Depto 4B / seña $45.000 |
| S4 | FAQ “¿caja de kiosco?” | Dice que no, y manda a `/f` |
| S5 | Click CTA | `/login/register?activar=niche.oficios` (+ `&ref=` si viene) |
| S6 | Copy registro | **No** “trial 14 días” genérico. Habla de presupuestos y seña |
| S7 | Post-login | `/dashboard/oficios` (listado + nuevo presupuesto), **no** `/dashboard/fiado` ni el ERP |
| S8 | Convencerse (8 min) | Cliente “Depto 4B” + 3 opciones. Ver el trabajo en la lista. **No** hace falta emitir AFIP ni mandar WA |

QR de gremio / casa de electricidad / partner de oficios: `claver.com.ar/f/servicios?ref=CODIGO`. Nunca el calco de kiosco.

Hueco: si a los 7 días el trial corta el presupuesto, **no** es el modelo final. Acta: HUM-ancla-oficios.

### 4.7 Criterio “lineal”

Es lineal si en **ningún** paso el usuario tiene que responder “¿cuál de estos 11 productos soy?”.

- Kiosco: cuaderno → `/f` → libreta.  
- Oficio: audio de presupuesto / seña → `/f/servicios` → trabajos.  

Lo demás aparece **después**, con candado, cuando el botón lo pide. Pelu, gym, consorcio: **no** esta semana; mismo molde cuando `/f` y `/f/servicios` conviertan.

---

## 4.8 Núcleo compartido (alineado 2026-08-26)

| Proceso | Antes | Ahora |
|---------|-------|--------|
| Oferta fiado | Caja/stock trial 14 d `core.claver` | Ancla $0; extras **no** se activan en el alta |
| Oferta oficios | Pack trial 7 d | Ancla `niche.oficios`; seña/WA extra |
| `applyActivarIntent` | Stamp trial 14 siempre | Trial 0 en ancla |
| Auto-subscribe alta | `auto_trial` de todo el enganche | Ancla `auto_free`; extras `auto_paid` |
| API POS/caja/productos | Solo `core.claver` | `pos.fiado_barrio` **o** `core.claver` |
| API oficios | Sin regla | `niche.oficios` o `core.claver` |
| Menú lite fiado | Incluía Leo | Libreta, 1 caja, productos, clientes |
| Allowlist ancla | Sin POS | POS + caja + productos (no te echa al vencer un trial viejo) |

---

Cola para **subir el % transversal (~55 → ≥90):** [`PLAN_SUBIR_TRANSVERSAL_GRATIS.md`](./PLAN_SUBIR_TRANSVERSAL_GRATIS.md). Olas T1 paywall → T2 caps → T3 menú → T4 resto.

## 5. Cola barata (código)

1. `/f` tobogán — **hecho** (esta sesión).  
2. Copy de registro sin “trial 14 días” en fiado — **hecho**.  
3. POS lite (no bajar el ERP en caja).  
4. Paywall en “Enviar aviso” y “Factura A”.  
5. Cap 2 usuarios / 1 caja.  
6. 4 avisos de reglas in-app (mismas frases que la landing).  
7. Purge 90 d.  
8. **No** `/f/peluqueria` ni `/f/gym` hasta que kiosco **y** oficios conviertan. `/f/servicios` ya está.

---

## 6. HUM firma números, no el modelo

HUM-07 (1 usuario gratis como regla) = **no**, salvo que el founder lo pise.  
HUM-01 = precios Cobrá / seña-link / AFIP / 2ª caja / 3er user.  
HUM-ancla = POS 1 caja $0 en prod.  
HUM-ancla-oficios = presupuesto + lista de trabajos $0 (como fiado); hoy trial 7 d.  
HUM take = % del link; partner 0% del riel hasta volumen.

---

*"Gratis el diagnóstico y el día a día. Se paga el disparo: el WhatsApp, el CAE, el link que entra plata."*

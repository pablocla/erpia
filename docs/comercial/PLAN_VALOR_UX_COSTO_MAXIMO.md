# Plan — valor real, UX de primer nivel, costo operativo bajo

**Fecha:** 2026-08-26  
**Owner:** grok (producto) · gemini (copy/microcopy) · humano (precio)  
**Para:** founder · grok · gemini · diseño  
**Estado:** cola para cerrar el hueco que **el cliente siente**  
**Hermano técnico (entitlements/paywall):** [`PLAN_SUBIR_TRANSVERSAL_GRATIS.md`](./PLAN_SUBIR_TRANSVERSAL_GRATIS.md)  
**Manda:** `COBRAR_SOLO_PROBLEMA_RESUELTO.md` · `CANON_FREE.md` · `PRODUCT.md` · `DESIGN.md`

Tesis:

> No quebramos a Maxikiosco / Tango / Vagaro / Consorcio Real **regalando el ERP**.  
> Los quebramos porque el **día a día es gratis, más rápido y más lindo** que lo que ellos cobran $20–80 mil/mes.  
> Lo que nos cuesta plata (WA, AFIP, link) se paga **después**, cuando ya les resolvimos el problema.

---

## 0. Dónde estamos (honesto) — re-medido 2026-08-26

El “100% terminado” de paywall/caps **no es 100%**. Hay catálogo de disparos, cap de 3er user en API, y pacto ARCA tipo Calendly. El modal **casi no está** en oficios/2ª caja/reportes. La home **ya no** promete WA/AFIP en el gratis.

| Capa que el cliente siente | Hoy | Meta |
|----------------------------|-----|------|
| **Valor en 60 s** (anotar fiado / presupuesto y verlo) | 80 | 95 |
| **UX/UI top** (caja y libreta como producto caro; landing seria AR) | 70 | 92 |
| **Rapidez** (POS lite, 0 poll, 4G Samsung) | 58 | 90 |
| **Costo operativo** (JS, región, purge, 0 WA en ancla) | 55 | 88 |
| **Honestidad cara vs producto** (no prometer extra en el gratis) | 90 | 95 |
| **Disparo cableado** (candado en el botón, no solo en un `.ts`) | 84 | 90 |

**Índice “quiebra al que cobra”** = promedio: **~73%.**  
Transversal merge: **~83%** (Gemini RESTANTE dijo 84% inflando A). Rapidez ~58. Purge 90 d y Topbar POS = Grok.

### Qué subió en esta tanda (no volver a contarlos como 0)

- V1-1 home honesta: kiosco ya no lista WA automático; ARCA = pacto + ticket interno.
- V2-1 parcial: Paywall WA en fiado; Factura A/B/C → `PactarImplementacionArca` (Cloud pendiente).
- Ticket interno usable sin certificado (POS default Ticket sin CAE).

---

## 1. A quién dejamos sin negocio (sin nombrar unicornio)

| Hoy cobran por… | Qué les robamos **gratis** | Qué **no** regalamos (ahí cobramos nosotros) |
|-----------------|----------------------------|-----------------------------------------------|
| Libreta / CxC de barrio | Quién debe, saldo, límite, hoy/ayer | WA masivo + link de cobro |
| POS kiosco | 1 caja, ticket interno, stock unitario | 2ª caja, AFIP CAE, 3er user |
| Presupuesto de oficio | 3 niveles en el celu, lista, seña **anotada** | Link MP, recordatorio WA, Factura C |
| Agenda pelu/gym | (T4: ancla pantalla) | Confirmación WA, seña auto |
| Expensas Excel | (T4: lista del mes en pantalla) | Aviso masivo + débito |

El cliente tiene que decir: *“esto que uso 8 horas es mejor que lo que me querían vender caro, y no me pidieron tarjeta.”*  
Si la caja tarda 4 s en 4G, **ganan ellos**.

---

## 2. Contrato UX (top de gama, no “versión pobre”)

De `PRODUCT.md`: claro, confiable, operativo. El lujo es **no trabarse**.

| Superficie | Top de gama significa | Prohibido |
|------------|----------------------|-----------|
| POS / libreta / oficios | <1,5 s primer cobro en 4G; botones gordos; montos ARS; atajos | Sidebar ERP, chat IA, poll cada 2 s, skeleton eterno |
| Landing `/` `/f` | Una pregunta, dos puertas, preview real, es-AR, AFIP como **extra** honesto | Dark SaaS US, nav de 8 ítems, “WhatsApp automático” en el gratis, `$ NaN` |
| Paywall | El dato sigue ahí. “El ticket es gratis. La factura AFIP es extra.” | Ransom, bloquear la libreta, “pasate a Pro” en D0 |
| Cajero | 4 ítems. Cero extras. | Config, Impuestos, Leo |

**Colorimetría:** el **dashboard** es el producto (tokens OKLCH de `DESIGN.md`, sobrio). La **landing** puede ser más display (Fraunces, CTA naranja/verde), pero **no** un clone Linear/Stripe oscuro que promete AFIP+WA en el hero. Si la home actual (`LandingHomePuertas` slate-950) lista WhatsApp automático en kiosco: **es un bug de honestidad** (V1).

---

## 3. Contrato costo (para que el gratis no nos funda)

De `COSTOS_VERCEL_SUPABASE_TAKE_RATE.md` + `SERVIDOR_GRATIS_ITEM_SHOP.md`:

| Palanca | Qué hacer | Ahorro |
|---------|-----------|--------|
| JS del POS | Shell de cobro: no bajar ERP/Ctrl+K/chat | GB de Vercel = el costo #1 del ancla |
| 0 poll en caja | Store local al abrir turno | Lambdas + batería del celu |
| Listas del día | “Ver el año” = menú Reportes (shop) | CPU Postgres 18–21 h |
| AFIP fuera del cobro | Ticket ya. CAE en cola | Timeout caro + cola en caja |
| 0 WA outbound en ancla | Paywall en “Enviar aviso” | Meta/Twilio |
| Purge 90 d | Muertos no se subsidian | Filas + backup |
| Región | DB cerca (sa-east), no solo Pro | Latencia = churn, no solo USD |

**KPI opex:** USD / ancla activa / mes. Hoy planificado ~0,70. Meta **&lt; 0,40** con POS lite. Si sube, no se “arregla” cobrando el mostrador: se achica el bundle.

---

## 4. Faltante en % — cola para llegar al máximo

Orden: primero lo que el cliente **toca 200 veces al día**, después candados, después el resto del catálogo.

### V1 — Honestidad + caja rápida (sube UX y valor) → índice **~65%**

| ID | Qué falta | Archivos | DoD (el cliente lo siente) |
|----|-----------|----------|----------------------------|
| V1-1 | ~~Home no promete WA/AFIP en el gratis~~ **hecho** | `landing-home-puertas.tsx` | Lista kiosco: libreta, 1 caja, stock. WA/AFIP = pacto. Ticket interno explícito |
| V1-2 | `/f` y `/f/servicios` al mismo nivel visual que la home, **sin** mezclar 11 apps | `app/f/**` | Mismo CTA, misma tipografía. Desktop split; celu una columna |
| V1-3 | POS lite | `app/dashboard/pos`, layout kiosco | Recarga caja no baja Impuestos/Cerebro/Chat. Medir peso JS |
| V1-4 | Libreta: 3 deudores en 60 s | `app/dashboard/fiado` | Empty state con 1 CTA “Anotar”. Sin onboarding de 11 pasos |
| V1-5 | Oficio: 1 presupuesto 3 niveles en 2 min | `app/dashboard/oficios/nuevo` | Golden path. Sin AFIP ni MP para guardar |

### V2 — Candado en el botón (valor honesto) → índice **~78%**

Complementa T1 del plan transversal. Acá el DoD es **UX**, no solo 402.

| ID | Qué falta | DoD |
|----|-----------|-----|
| V2-1 | `PaywallModal` en: Enviar aviso, Factura A/B/C, generar link seña, Nueva caja, Invite 3er user, filtro &gt;48 h | Un disparo, un modal, dato no se borra |
| V2-2 | Cap 2ª caja **en API**, no solo copy | POST caja 2 → 402 `segunda_caja` si no hay SKU |
| V2-3 | Reportes &gt;48 h | Query/UI corta; CTA Extra |
| V2-4 | Tests de ruta, no de strings | Vitest: 3er user API (ya), 2ª caja API, AFIP 402, WA 402 |

### V3 — Velocidad percibida (quiebra al pago lento) → índice **~85%**

| ID | Qué falta | DoD |
|----|-----------|-----|
| V3-1 | 0 poll en POS | Network: 0 fetch periódico con caja abierta |
| V3-2 | Listados del día | Default hoy; “año” = shop |
| V3-3 | CAE async | Cobrar no espera SOAP AFIP |
| V3-4 | Touch 44 px, atajos teclado | Cajero con 1 mano / teclado |

### V4 — Costo a escala (el gratis se banca) → índice **~88%**

| ID | Qué falta | DoD |
|----|-----------|-----|
| V4-1 | Purge 90 d + copy ya escrita | Job + evento; no borrar al que usó esta semana |
| V4-2 | Fotos/Image Optimization cap ancla | Grid de cobro sin fotos pesadas |
| V4-3 | Región DB (sa-east / AR) | Doc de go/no-go; no es copy |
| V4-4 | Cron: no dunning al ancla $0 | No mail “se te venció el POS” si nunca hubo trial |

### V5 — El resto de puertas, mismo listón UX → índice **~90%**

Turnos, gym, expensas: **una** pantalla que resuelve el dolor en 60 s, gratis. Extra = WA/seña.  
No 11 cards. No trial de ERP. Copy: `PLAN_SUBIR_TRANSVERSAL_GRATIS.md` T4.

---

## 5. Qué es “top de gama” en cada pantalla (receta)

No es más glassmorphism. Es **oficio**.

**POS:** buscador instantáneo, total enorme, efectivo / MP / fiado en 1 fila, enter = cobrar.  
**Fiado:** “Quién me debe” es la home. Un tap = detalle. Avisar = candado Extra, no desaparece el deudor.  
**Oficios:** 3 cards de precio, aceptar, seña a mano. Link MP = Extra.  
**Errores:** “No salió el CAE: AFIP no respondió. El ticket quedó. Reintentá o activá factura.” Nunca un toast genérico.

Landing: Fraunces + Manrope, CTA de alto contraste, **preview con datos de barrio** (Pérez, Depto 4B), badge Argentina. Cero “Start Free Trial”.

---

## 6. Cómo sabemos que estamos quebrando al que cobra

KPI de producto (no de vanity):

| Señal | Meta 90 días |
|-------|----------------|
| Tiempo a primer fiado / primer presupuesto | &lt; 3 min post-alta |
| Tickets/día en ancla (p50) | Caja usable, no demo |
| % que prende Cobrá **después** de ≥10 deudores | Upsell por dolor, no ransom |
| Rebote landing `/f` | Baja; no eligen entre 11 apps |
| USD / ancla activa | Baja vs 0,70 |
| NPS / “¿tiraste el cuaderno?” | Pregunta de calle, no survey SaaS |

Si el NPS es alto y el take/Cobrá no entra: el gratis ganó el relato y **falta el disparo** (V2).  
Si Cobrá entra pero la caja es lenta: **no** quebramos a Maxikiosco.

---

## 7. Prompt Gemini código (1 ola, techo índice ~69)

El prompt canónico (archivos + anti-alcance) está en `PLAN_SUBIR_TRANSVERSAL_GRATIS.md` §4. Acá el recorte **valor/UX**:

Prioridad para Gemini: **V2-1** (candado en el botón) + **V1-2** (`/f` visual) + **V1-4** (empty fiado un CTA) + **T3 menú 🔒**.  
No ejecutes V1-3, V3, V4: no vas a bajar el JS del POS ni el poll.

DoD que el cliente siente al cerrar esa ola:
- En oficios, “mandar por WhatsApp” y “link de seña” abren el modal; el presupuesto sigue.
- En ancla, Impuestos y Leo no están; WA/AFIP tienen 🔒 Extra.
- `/f` se ve pariente de `/` (tipografía, CTA, no 11 apps).
- Libreta vacía: un botón gordo “Anotar fiado”, no dos caminos.

## 7b. Prompt Grok (una ola)

```text
Sos Grok. Leé docs/comercial/PLAN_VALOR_UX_COSTO_MAXIMO.md.
V1-1 ya está. Ejecutá V1-3 (POS lite) o, si Gemini cerró V2-1, pasá a V3 (0 poll, CAE async).
No regalés WA/AFIP. No reabras 1-usuario-todo. No toques US.
UX: PRODUCT.md + DESIGN.md. Caja rápida > landing hype.
Al cerrar: actualizá la tabla §0 de este MD (Hoy / Techo Gemini).
```

## 8. Anti-alcance

- Dark landing que promete AFIP+WA en el hero del kiosco  
- LLM en el ancla “para que se sienta IA”  
- 8 verticales `/f/{nicho}` antes de V3  
- Cobrar 1% del ticket en efectivo  
- “100% listo” si el test solo hace `toContain("2 usuarios")`  

---

## 9. Relación con el plan transversal

| Este doc | El otro |
|----------|---------|
| El cliente **siente** que es mejor que lo pago | El sistema **no miente** en SKU/alta/API |
| V1–V3 | T1–T3 |
| Índice “quiebra al que cobra” **~70 → 90** | Transversal **~80 → 90** |

Gemini: empty fiado, paywall oficios/usuarios, estilo Extra. Grok: 2ª caja 402, reportes 48 h, poll de cajones, `dynamic()` fiscal/cámara en POS. Falta: 🔒 Extra en ítems reales, no bajar sidebar ERP, purge 90 d.

Hay que subir **los dos**. Subir solo APIs deja una caja lenta. Subir solo UI deja candados de mentira.

---

*"Gratis y mejor. Rápido en 4G. Lindo como producto caro. Caro para nosotros solo cuando les entra plata o cuando AFIP/WhatsApp nos cobran."*

# PROMPT GEMINI — subir al máximo los % (cara gratis)

**Pasale ESTE archivo a Gemini.** No le pases `PLAN_SUBIR_TRANSVERSAL_GRATIS.md` solo: ya infló el score una vez.  
**Fecha:** 2026-08-26  
**Owner:** gemini (código UI + copy + candados) · grok (POS lite / SOAP / jobs) · humano (precios)  
**Techo honesto de esta sesión:** transversal **~76 → ~84** · índice valor **~64 → ~72**.  
**90% no es de Gemini.** Rapidez (POS lite, 0 poll) y opex (purge, bundle) son Grok.

---

## PROMPT (copiar entero, o abrir este MD en el repo)

```text
Sos Gemini en el monorepo Claver (Next.js 15 App Router, TypeScript strict, es-AR, dominio claver.com.ar).
Código UI + copy + tests Vitest. No mientas el %.

══════════════════════════════════════
0. DÓNDE ESTAMOS (no lo “redondees”)
══════════════════════════════════════
Transversal ponderado HOY ~76% (no 81, no 82, no 100).
Valor/UX (“quiebra al que cobra”) HOY ~64%.

A landings 90  B alta 88  C APIs 85  D menú 72  E botón 75  F caps 48  G resto 50
Valor60s 74  UX 64  Rapidez 42  Opex 50  Honestidad 84  Disparo 72

Tu techo si cerrás TODO lo de abajo: transversal ~84, valor ~72.
Si reportás 90 o 100, mentís. Al final reescribí las tablas de:
- docs/comercial/PLAN_SUBIR_TRANSVERSAL_GRATIS.md §0
- docs/comercial/PLAN_VALOR_UX_COSTO_MAXIMO.md §0
con números honestos (capa por capa, no un solo %).

══════════════════════════════════════
1. CONTRATO (si lo rompés, revertí)
══════════════════════════════════════
GRATIS = pantalla + CPU
  kiosco: 1 caja + fiado + ticket INTERNO + stock unitario + 2 users
  oficio: presupuesto 3 niveles + lista + seña ANOTADA
PAGO = disparo
  WA outbound · link MP/ClavPay · CAE ARCA · 2ª caja · 3er user · reportes >48 h
ARCA y WhatsApp se PACTAN (PactarImplementacionArca → Claver Cloud pendiente).
Mientras tanto se vende con ticket interno, sin CAE.
No regalés core.claver en el alta ancla.
No pongas trial=14 en fiado/oficios.
No toques US. No inventes precios (HUM-01).
No prometas WA automático ni Factura A/B/C en el gratis.
Paywall: el dato NO se borra. Si el tenant YA tiene el SKU, el botón tiene que FUNCIONAR (no re-paywallear).
Usá tieneSku / tieneDisparoHabilitado + DISPAROS_CONFIG.skusValidos.

Leé ANTES (y nada más):
- este archivo
- lib/comercial/paywall-disparo.ts
- components/billing/paywall-modal.tsx
- components/comercial/pactar-implementacion-arca.tsx
- lib/comercial/lite-sidebar.ts
- docs/comercial/MENU_ANCLA_VS_SHOP.md
- docs/comercial/MICROCOPY_PAYWALL.md
- PRODUCT.md y DESIGN.md (tokens, no “SaaS US”)

══════════════════════════════════════
2. OLA — en este orden, no saltees
══════════════════════════════════════

D / T3-1  Badge 🔒 Extra
- Sidebar ancla fiado/oficios: ítems WA y AFIP visibles con badge 🔒 Extra.
- Click Extra → PaywallModal (whatsapp_outbound / factura_afip) o PactarImplementacionArca.
- Nunca 404. Nunca Leo/Cerebro/empleados-digitales en ancla fiado.
- modoLite "servicios": solo oficios, nuevo, cuadrilla, clientes, caja, productos, config, mi-plan, apps.
- modoLite "niche": sacá historia-clinica / agenda / nicho si no son el ancla oficios.
- Test: fiado allowlist no contiene /dashboard/cerebro ni /dashboard/impuestos.

E / V2-1  Paywall EN EL BOTÓN (los que faltan)
Montá PaywallModal + disparoKey, con check de SKU:
- Config / puntos de venta / “Nueva caja” → segunda_caja
- Filtro de reportes rango >48 h → reportes_historicos
- POS: elegir Factura A/B/C sin cert → PactarImplementacionArca (ya hay banner; no redirijas a checkout)
NO rompas seña ANOTADA (gratis) ni Ticket interno (gratis).

F / caps UI (API 402 de 2ª caja la deja Grok si se complica)
- Si encontrás el alta de 2ª caja simultánea, 402 + disparoKey segunda_caja.
- Hoy POST /api/caja devuelve 409 “ya hay caja abierta” (una sola). El SKU es para OTRA caja en paralelo (punto de venta). No conviertas el 409 en 402 de la primera caja: eso rompe el ancla.
- Reportes: si el query acepta from/to, rechazá >48 h sin data.reportes_prog|core.claver con 402 reportes_historicos. Si el endpoint es un enredo, dejalo anotado “Grok” y al menos cortá la UI.

G / T4-1 copy vitrine
- lib/comercial/go-to-market-vitrine.ts, commercial-sales-playbook.ts, product-entry-sections, claverp-product-hub:
  “14 días” SOLO Cobrá / turnos / gym / extras.
  Grep: trial=14 en href de fiado/oficios = 0 hits.
  claver-shell y claverp-product-hub no pueden ser la cara de / ( / ya es puertas).
- /explorar y /claver/apps: precios OK ahí, no en hero de /.

A / V1-2  Paridad /f
- app/f/page.tsx y app/f/servicios/page.tsx: misma familia tipográfica/CTA que landing-f-chrome.
- Desktop split, celu una columna. Cero mega menú ERP. Cero 11 apps.

Valor / V1-4
- app/dashboard/fiado: empty state UN botón gordo “Anotar fiado”. No dos caminos equivalentes.

Tests Vitest (ruta o wiring, no toContain("2 usuarios") como único DoD)
- existe PaywallModal con disparoKey en oficios, fiado, usuarios, y el nuevo de caja o reportes.
- lite-sidebar fiado/servicios: no impuestos, no cerebro.
- grep mental: oficios sub-saas no promete seña MP ni WA en el lema (ya se corrigió; no lo reviertas).
Corrés: npx vitest run __tests__/comercial --reporter=dot
Si algo no es HTTP de verdad, NO lo llames “test de integración”.

══════════════════════════════════════
3. NO TOQUES (Grok / 90%)
══════════════════════════════════════
- Code-split POS / no bajar ERP en /dashboard/pos (V1-3, V3) — acá vive el 42% de rapidez
- SOAP AFIP / cola CAE
- Job purge 90 d
- Prisma schema / migraciones
- Landings US, 8 nichos /f/{nicho}
- Precios de lista
- “1 usuario = todo el ERP”
- Reabrir cerebro en el ancla
- Reportar 90% si rapidez sigue 42

══════════════════════════════════════
4. AL CERRAR
══════════════════════════════════════
1. Tabla §0 de PLAN_SUBIR_TRANSVERSAL_GRATIS.md (Ahora por capa + fórmula).
2. Tabla §0 de PLAN_VALOR_UX_COSTO_MAXIMO.md.
3. Lista: archivos tocados / lo que quedó Grok / lo que no verificaste en HTTP.
4. Una línea: “transversal X% · valor Y% · rapidez sigue 42”.
```

## FIN PROMPT

---

## Qué archivo NO pasarle para esta misión

| Archivo | Por qué no |
|---------|------------|
| `PROMPT_GEMINI_FREE.md` | Solo docs. No sube % de código. |
| `PROMPT_GEMINI_CERRAR_TODO.md` | Core/empleados. Distinto norte. |
| `GEMINI_QUEUE.md` | Cola Leo/docs, no % ancla. |
| `PLAN_SUBIR_TRANSVERSAL_GRATIS.md` solo | Ya lo usó e infló A/C/D/F/G. |

## El 90% (después, Grok)

Cuando Gemini cierre este prompt, pasale a Grok:

`docs/comercial/PLAN_VALOR_UX_COSTO_MAXIMO.md` ola **V1-3 + V3** (POS lite, 0 poll, CAE async) y **T2-1** cap 2ª caja 402.

Sin eso, rapidez se queda en 42 y el índice no pasa de ~72.

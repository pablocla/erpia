# Plan — subir el % transversal al máximo (cara gratis)

**Fecha:** 2026-08-26  
**Owner:** grok (código) · gemini (copy) · humano (precios)  
**Para:** founder · grok · gemini  
**Estado:** merge Gemini MAX_PCT + Grok API/POS (2026-08-26)  
**Baseline (honesto ahora):** **~80% transversal** · valor ~70%  
**Gemini midió ~77% y dejó F=48.** Eso ignora Grok: 2ª caja 402 y reportes >48 h ya están en API. El badge 🔒 Extra en sidebar-nav **no tiene ítems** con `badge: "Extra"` (CSS muerto).  
**Meta:** **≥90% transversal en las 2 puertas de calle** · **≥80% de todo el monolito que toca alta/trial/paywall** · 100% es mentira (HUM-01, riel, otras 9 apps)  
**Manda:** `COBRAR_SOLO_PROBLEMA_RESUELTO.md` · `CANON_FREE.md`  
**Valor / UX / opex (lo que el cliente siente):** [`PLAN_VALOR_UX_COSTO_MAXIMO.md`](./PLAN_VALOR_UX_COSTO_MAXIMO.md)  
**No reabre:** 1 usuario = todo incluido · US como cara · catálogo de precios en `/`

---

## 0. Cómo se mide (volver a puntuar al cerrar cada ola)

Puntuar 0–100 cada capa. Transversal = promedio **ponderado**.

| Capa | Peso | Ahora | Meta | Cómo se verifica |
|------|------|-------|------|------------------|
| A. Landings conversión (`/`, `/f`, `/f/servicios`, `/demo`) | 15 | **90** | 95 | `/f` ya tenía chrome + split. RESTANTE no listó `app/f`. No subir a 92. |
| B. Oferta + alta + auto-subscribe | 25 | **88** | 95 | `trialDias:0` oficios en catálogo. Alta ancla sin trial. |
| C. APIs entitlements | 15 | **90** | 95 | AFIP/WA 402 + 2ª caja 402 + reportes >48 h 402. |
| D. Menú / shell / allowlist | 10 | **86** | 90 | Servicios limpio. Niche sin agenda/historia (Grok post-RESTANTE). Extra en shells. |
| E. Paywall en el **botón** | 15 | **84** | 90 | Fiado WA, oficios WA/seña, 3er user UI, pacto ARCA, reportes >48 h modal UI. |
| F. Caps (1 caja, 2 users, reportes 48 h) | 10 | **72** | 90 | 3er user API+invite. 2ª caja API 402. Reportes 48 h API 402. |
| G. Resto (demo pack, turnos, gym, vitrine, playbooks) | 10 | **58** | 70 | Shell/hero ClaverP sin trial=14. Pack custom de extras sigue `trial=14` (válido). |

**Fórmula:** `Σ (peso × capa / 100)`.  
**Ahora: ~83%.** (A90·15 + B88·25 + C90·15 + D86·10 + E84·15 + F72·10 + G58·10) / 100 = **83.3%**.  
Gemini RESTANTE dijo 84% con A=92 (no tocó `/f`).  
**Para 90% (Grok):** purge 90 d + Topbar liviano en POS.

### Qué sí cerró (no volver a puntuarlo como faltante)

| Hecho | Dónde |
|-------|--------|
| Alta ancla sin trial 14 | `ofertas-comerciales.ts` `trialDias:0` + `esAltaAnclaSinTrial` |
| Entitlement juego ancla | `api-sku-entitlements.ts` POS/caja/ventas/stock/oficios `any` fiado\|core |
| AFIP/WA API no cubiertos por ancla | `/api/afip` → `fiscal.cert_afip`; `/api/whatsapp` → Cobrá |
| Cap 3er usuario | `POST /api/usuarios` → 402 `tercer_usuario` |
| Ticket interno vs CAE | POS: Ticket (sin CAE) default; pacto ARCA tipo Calendly → Cloud pendiente |
| Home honesta | `landing-home-puertas.tsx`: no WA auto ni AFIP en el gratis; CTA pactar certificado |
| Cerebro fuera del ancla | `lite-sidebar.ts` `LITE_SHARED` / allowlist |
| Paywall oficios WA + link seña | `app/dashboard/oficios/[id]/page.tsx` (seña manual sigue) |
| Cap 3er user también en invite | `POST /api/auth/invite` → 402 |
| 2ª caja simultánea | `POST /api/caja` → 402 `CAP_SEGUNDA_CAJA` (1ª caja ancla OK) |
| Reportes >48 h | `estadisticas/dashboard`, `export`, `libro-iva-ventas` → 402 |
| Empty fiado 1 CTA | `app/dashboard/fiado` “Anotar fiado” |

---

## 1. Contrato único (todo proceso compartido lo firma)

Una sola regla. Si un archivo la contradice, el archivo está mal.

```
GRATIS  = pantalla + CPU
          kiosco: 1 caja + fiado + stock unitario + clientes + cierre + 2 users
          oficio: presupuestos 3 niveles + lista de trabajos + seña EN PANTALLA
PAGO    = disparo
          WA outbound · link MP/ClavPay · AFIP prod · 2ª caja · 3er user · reportes 12 m
ALTA    = solo ancla. Cero stamp trial 14. Cero auto_trial de extras.
TRIAL   = solo cuando piden un extra (Cobrá, turnos, gym…). Nunca el juego.
API     = ancla puede escribir el juego. Extra exige SKU pago (402).
MENÚ    = juego visible. Extra con candado. Leo no está.
PARTNER = comisión si hay pago. Ancla $0 = $0.
```

**SKUs ancla (no vencer):** `pos.fiado_barrio` · `niche.oficios`  
**SKU pack ERP (pago):** `core.claver`  
**SKU disparo:** `intang.cobranzas_wa` · `com.whatsapp` / `channel.whatsapp` · `fiscal.clavpay_link` · `fiscal.cert_afip` (o el cert real, **no** inventar `item.afip`)

---

## 2. Olas (orden fijo)

No abrir T3 si T1 no cierra. Cada ola termina con tests + % re-medido en esta tabla (actualizar baseline).

### T1 — Disparo (sube E 25→90 y C 70→95)  → transversal **~70%**

El agujero más grande. Sin esto la cara miente.

| ID | Qué | Archivos | Owner | DoD |
|----|-----|----------|-------|-----|
| T1-1 | Paywall único | `components/billing/paywall-modal.tsx` + helper `lib/comercial/paywall-disparo.ts` | grok | Función `requiereDisparo(sku)` + modal. Copy de `MICROCOPY_PAYWALL.md` |
| T1-2 | WA / aviso | `app/dashboard/fiado` (ya hay) + oficios “mandar presupuesto/recordatorio” | grok | Sin SKU WA: 0 outbound, modal. Ticket interno / lista siguen |
| T1-3 | Seña link MP | `app/api/oficios/**/pagar-sena` + botón seña | grok | Sin `fiscal.clavpay_link` / MP: paywall. Seña **anotada a mano** sigue $0 |
| T1-4 | Factura A/B/C | botones emitir AFIP (POS + oficios) | grok | Ticket interno $0. A/B/C → 402 + modal. `/api/afip` **no** se cubre con solo `pos.fiado_barrio` |
| T1-5 | Entitlement AFIP | `lib/comercial/api-sku-entitlements.ts` | grok | `/api/afip` exige cert/SKU fiscal, no `core.claver` genérico como “factura” |
| T1-6 | Tests | `__tests__/comercial/paywall-disparo.test.ts` | grok | Tabla: ancla escribe juego; extra 402 |

**Humano:** no bloquea T1 (precios pueden seguir `[HUM-01]` en el modal).

### T2 — Caps (sube F 5→90) → transversal **~78%**

| ID | Qué | Archivos | Owner | DoD |
|----|-----|----------|-------|-----|
| T2-1 | Cap 1 caja | `lib/caja/**` + config cajas | grok | 2ª caja simultánea → paywall. 1 caja ancla OK |
| T2-2 | Cap 2 users | invite user API + UI | grok | 3er usuario activo → paywall. Dueño + 1 cajero OK |
| T2-3 | Reportes 48 h | filtros fecha dashboard reportes | grok | Rango >48 h → shop. Hoy/ayer $0 |
| T2-4 | Tests | `__tests__/comercial/caps-ancla.test.ts` | grok | 3 casos: caja, user, rango |

### T3 — Shell + menú candado (sube D 65→90) → transversal **~82%**

| ID | Qué | Archivos | Owner | DoD |
|----|-----|----------|-------|-----|
| T3-1 | Sidebar ancla = `MENU_ANCLA_VS_SHOP.md` | `lite-sidebar.ts` · `product-shell.ts` fiado/oficios | grok | WA/AFIP visibles con 🔒 Extra, no 404, no Leo |
| T3-2 | POS lite (no bajar ERP) | shell POS / code-split | grok | `/dashboard/pos` no descarga sidebar ERP. Baja JS |
| T3-3 | Oficios menú | `product-shell` oficios | grok | Trabajos, nuevo, clientes. Seña-link y WA con candado. Sin Impuestos |
| T3-4 | Avisos de reglas (no LLM) | in-app D7 stock/deudores | grok | 4 frases de `/f` existen en dashboard si hay uso |

### T4 — Resto del monolito (sube G 30→70 y A 85→95) → transversal **~90%**

| ID | Qué | Archivos | Owner | DoD |
|----|-----|----------|-------|-----|
| T4-1 | Vitrine / playbooks / sub-saas copy | `go-to-market-vitrine.ts` · `commercial-sales-playbook.ts` · `sub-saas-catalog` pasos | gemini + grok | “14 días” **solo** en Cobrá/turnos/gym. Fiado y oficios: “gratis para siempre / arrancar sin tarjeta” |
| T4-2 | Demo | `industry-demo-service.ts` | grok | Demo kiosco/oficios provisiona **ancla**, no `core.claver` en trial. Otras industrias: trial extra OK |
| T4-3 | Turnos / gym / consorcios | ofertas + alta | grok | Cada uno: ancla pantalla $0 **o** trial 14 del extra, nunca “ERP 14 días”. Misma función `esAltaAnclaSinTrial` |
| T4-4 | `/explorar` y `/claver/apps` | copy | gemini | Precios OK ahí. Link desde footer, no desde hero de `/` |
| T4-5 | Registro genérico | `activarRegisterHref(null)` | grok | Sin `?activar=` no promete trial 14 del ERP; manda a `/` (elegir puerta) |
| T4-6 | Clawback / partner | ya 30% extra | grok | Comisión 0 si el referido sigue solo ancla. Test |

### T5 — HUM (no es % de código; desbloquea copy con números)

| ID | Qué | Quién |
|----|-----|--------|
| HUM-01 | Precio Cobrá / AFIP / 2ª caja / 3er user | humano |
| HUM-ancla | POS 1 caja $0 **oficial en prod** (el código T1–T2 ya lo trata así) | humano |
| HUM-ancla-oficios | Presupuesto lista $0 oficial (código T1 ya) | humano |
| HUM take | % del riel; partner 0% hasta volumen | humano |

Sin T5 el producto puede estar al 90% transversal y el modal sigue diciendo `[HUM-01]`. Eso está bien.

---

## 3. Prompt Grok (copiar una ola)

```text
Sos Grok en Claver. Leé docs/comercial/PLAN_SUBIR_TRANSVERSAL_GRATIS.md.
Ejecutá SOLO la ola T{N} (la primera con DoD abierto).
No toques landings US. No actives core.claver en el alta ancla.
Contrato §1. Tests Vitest en cada ticket.
Al cerrar: actualizá la tabla de % (baseline) en este mismo MD.
Siguiente ola no se abre si falló un DoD.
```

## 4. Prompt Gemini — 1 ola de código (techo ~79%)

Gemini **no** toca POS lite, SOAP AFIP, Prisma schema, ni purge. Eso es Grok y es lo que falta para 90.

Copiar tal cual:

```text
Sos Gemini en el repo Claver (Next.js 15, App Router, es-AR, claver.com.ar).
Leé primero:
- docs/comercial/PLAN_SUBIR_TRANSVERSAL_GRATIS.md (§0 y §1)
- docs/comercial/PLAN_VALOR_UX_COSTO_MAXIMO.md (§0 y V2)
- docs/comercial/MENU_ANCLA_VS_SHOP.md
- docs/comercial/MICROCOPY_PAYWALL.md
- lib/comercial/paywall-disparo.ts
- components/billing/paywall-modal.tsx
- components/comercial/pactar-implementacion-arca.tsx

CONTRATO (si lo rompés, revertí):
GRATIS = pantalla + CPU (1 caja, fiado, ticket interno, presupuesto 3 niveles, seña ANOTADA, 2 users).
PAGO = disparo (WA outbound, link MP, CAE ARCA, 2ª caja, 3er user, reportes >48 h).
ARCA/WhatsApp NO se “activan” con checkout ciego: el CTA es PactarImplementacionArca (turno → Claver Cloud pendiente). Mientras tanto se vende con ticket interno.
No regalés core.claver en el alta ancla. No pongas trial=14 en fiado/oficios. No toques US. No inventes precios (HUM-01).

EJECUTÁ SOLO ESTA OLA (en este orden). No abras V3/V4 ni T5.

1) T3-1 / T3-3 Menú ancla
   - lib/comercial/lite-sidebar.ts y product-shell fiado/oficios.
   - Sacá /dashboard/cerebro y empleados-digitales del ancla fiado.
   - Oficios ancla: trabajos, nuevo, clientes. SIN Impuestos, SIN Mercado Pago como ítem suelto.
   - WA y AFIP visibles con badge 🔒 Extra. Click → PaywallModal (whatsapp_outbound / factura_afip) o PactarImplementacionArca. Nunca 404.

2) V2-1 / T1-2 / T1-3 Paywall EN EL BOTÓN (no solo el .ts)
   Montá PaywallModal + disparoKey donde hoy el click hace el extra:
   - oficios: mandar presupuesto/recordatorio WA → whatsapp_outbound
   - oficios: generar link de seña MP → sena_link_mp (anotar seña a mano SIGUE)
   - config/POS: “Nueva caja” / 2ª caja simultánea → segunda_caja
   - usuarios: invite 3er user (además del 402 de API que ya existe) → tercer_usuario
   - reportes: filtro rango >48 h → reportes_historicos
   Dato del usuario no se borra. Copy de MICROCOPY_PAYWALL.md.
   Factura A/B/C: no redirijas a checkout; usá PactarImplementacionArca (ya está).

3) T4-1 copy vitrine/playbooks (strings)
   go-to-market-vitrine.ts, commercial-sales-playbook.ts, sub-saas-catalog:
   “14 días” SOLO en Cobrá / turnos / gym. Fiado y oficios: “gratis para siempre / sin tarjeta”.
   Grep trial=14 en href de fiado/oficios = 0.

4) Tests Vitest de RUTA, no de toContain("2 usuarios")
   - POST /api/usuarios 3er user ancla → 402 (ya hay API; cubrí el caso si falta).
   - POST /api/whatsapp sin SKU → 402
   - POST /api/afip sin fiscal.cert_afip → 402
   - oficios: seña anotada no exige clavpay; link sí.
   Si no podés pegarle a Prisma, mockeá el service. No mientas un 100%.

NO TOQUES:
- app/dashboard/pos code-split / bundle (V1-3, Grok)
- CAE SOAP / cola AFIP (V3-3, Grok)
- Job purge 90 d (V4, Grok)
- POST /api/caja cap 2ª caja en paralelo (T2-1, Grok: hoy 409 “ya hay caja abierta”, no 402 de SKU)
- Precios [HUM-01]
- Landings US, 8 nichos /f/{nicho}

AL CERRAR:
Actualizá la tabla §0 de PLAN_SUBIR_TRANSVERSAL_GRATIS.md (columna Ahora) con números honestos.
Listá archivos tocados y lo que quedó afuera.
```

Techo realista de esa ola: **transversal ~79%** (D 58→80, E 62→82, G 42→60).  
No llega a 90: faltan caps de API (F), POS lite y tests de caja/reportes.

### Prompt Gemini — solo docs (si no querés que codee)

```text
Sos Gemini. Solo docs/ y strings. Ola T4-1 y T4-4.
Fiado/oficios: nunca “trial 14 días” ni “ERP”.
14 días solo en extras (Cobrá, turnos, gym).
Dominio claver.com.ar. Actualizá CANON_FREE “hoy en código”: POS 1 caja $0 + ticket interno; ARCA/WA se pactan.
Eso sube G ~42→55. Transversal ~73%. No toques lib/.
```

---

## 5. Anti-alcance (si aparece, rechazar)

- 8 landings `/f/peluqueria` etc. antes de T3 cerrado  
- “1 usuario = todo incluido”  
- Market switcher US en `/` `/f` `/demo`  
- Auto-trial de `core.claver` en registro fiado/oficios  
- Precios de lista en hero  
- LLM / Leo en onboarding $0  
- Paywall que secuestra la libreta o los presupuestos ya cargados  

## 7. Testing de User Journeys Lineales & Completitud por Rubro

> **Diferencia clave:**  
> - **% Transversal (~83%):** Mide que la arquitectura cobre donde debe y no rompa el contrato "gratis juego / pago disparo".  
> - **% User Journey (~78%):** Mide que el usuario final de cada rubro pueda completar su día a día sin bloqueos.

### Matriz de Completitud por Segmento

| Segmento | Rubros Clave | % Journey | Estado Actual | Faltante Principal |
|---|---|:---:|---|---|
| **Tier S (≥85%)** | Kiosco/Almacén (92%), Oficios (90%), Ferretería (90%), Veterinaria (88%), Gastronomía (85%), Gimnasio (85%) | **88%** | ❇️ Flujo diario 100% operativo en pantalla | Cobro parcial ágil, KDS delivery profundo |
| **Tier A (70–84%)** | Peluquería (82%), Fumigación (82%), Prestamista (80%), Distribuidora (78%), Agro/Acopio (75%), Consorcios (72%), Estación (70%) | **76%** | ⚠️ Funcional con gaps de especialidad | Mapa Google Maps en ruta, liquidaciones de chofer/vendedor |
| **Tier B (<70%)** | Motor movimientos genérico (68%), Clínica (68%), Farmacia (65%), Inmobiliaria (65%), Concesionaria (60%), Química (55%) | **63%** | 🚧 Requiere integraciones duras (OS, portales, trazabilidad) | Obras sociales (PAMI), portales inmobiliarios/autos |

### Suite de Tests Lineales (Vitest)
Se implementaron 3 tests de smoke y journeys lineales:
1. `__tests__/smoke/golden-paths.test.ts` (115 assertions) — Verifica que los 35+ rubros resuelven a rutas vivas sin 404.
2. `__tests__/smoke/journey-fiado.test.ts` (20 assertions) — Journey completo de almacén/kiosco (rutas, endpoints, service y paywall WA).
3. `__tests__/smoke/journey-oficios.test.ts` (12 assertions) — Journey completo de oficios (presupuesto 3 niveles, cuadrilla y niche app).

---

*"Gratis el juego. Pago el disparo. El mismo contrato en oferta, alta, API, menú y botón."*


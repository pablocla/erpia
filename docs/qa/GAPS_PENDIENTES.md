# Gaps pendientes — post Ola 0 / Gemini puertas

**Fecha:** 2026-08-24  
**Para:** Grok (código) · Gemini (docs/copy) · humano (precio, legal, piloto)

Este archivo lista **solo lo que todavía falta**. No es un brochure ni un replay de lo ya cerrado.

**Fuentes cruzadas con el código de hoy:**  
`docs/qa/AUDITORIA_PRD_BOTONES_RUBROS_NICHOS_UX.md` · `docs/comercial/PROMPT_GEMINI_PUERTAS_LANDING.md` · `docs/comercial/puertas/*` · `docs/GO_LIVE_PRD.md`

---

## 0. Cómo leer

| Color | Significado |
|-------|-------------|
| 🔴 P0 | Rompe la promesa de puerta o un tenant real |
| 🟠 P1 | Pack que ya se vende (PRD §3.1) o Oficios (home comercial) |
| 🟡 P2 | Nicho / cálculo / polish; no bloquear kiosco+POS |
| ⬜ Human | Precio, legal, “¿lo publicamos?” |

**Cerrado (no repetir acá):** POS abrir caja in-situ · fiado medios + WA por fila · NC y WA en facturas · Nueva factura · banco alta de cuenta · menú Operación del día · Cmd+K POS/Fiado · bottom nav cajero · `empresaId=1` en impuestos/caja body · teléfono fake `5491100000000` en `app/` · peluquería WA · grow → cannabis · `canchas` en `RUBRO_UX` · 10/10 MD de puertas Gemini.

---

## 1. 🔴 P0 — la puerta no aterriza

El copy Gemini dice que cada comprador cae en su golden path. **El código no lo garantiza.**

### 1.1 Oficios visible para todos (el gap más caro)

| Qué | Evidencia |
|-----|-----------|
| Sección **Oficios & Obras** en el sidebar **sin** `allowedRubros` ni `skuKey` | `lib/dashboard/sidebar-modules.ts` ~100–109 |
| Shell `modoLite=niche` y `servicios` default a **oficios** | `lib/comercial/product-shell.ts` `MODO_LITE_DEFAULT_SLUG` |
| Spec PUERTA-09 pide: kiosco/gym **nunca** ven “Presupuesto 3 Niv” | `docs/comercial/puertas/SPEC_GROK_LANDINGS_ACTIVAR.md` §1.3 — **no implementado** |

**Fix Grok:** `allowedRubros` / SKU `niche.oficios` en ítems de oficios; o filtrar en `canRenderMenuItem`. Default shell `niche` ≠ oficios para gym/club (usar membresías/cuotas).

### 1.2 Skins `?oficio=` no existen

Gemini escribió `SKINS_OFICIOS.md` (electricista, plomero, pintor, herrero, estudio).  
**Cero** `searchParams.oficio` en `app/claver/**`. La landing de oficios es un solo copy de “plomero/capataz”.

**Fix Grok:** un layout, interpolar copy por `?oficio=`. Mismo SKU `niche.oficios`.

### 1.3 CTAs de landings no unificados a `?activar=`

`activarSkuHref()` existe en `sub-saas-catalog.ts`, pero **no hay** `activar=niche.oficios` / `pos.core` etc. en `app/claver/apps/[slug]` como pide el spec.  
Riesgo: el electricista se registra y cae al ERP completo.

**Fix Grok:** CTA primario de cada puerta P0 = `/login?activar={sku}` o `/demo/{industry}?activar=`. Test Vitest de `resolveActivarIntent` por los 12 SKUs.

### 1.4 Spec vs catálogo (`modoLite`)

PUERTA-09 dice post-login `modoLite = "oficios"`.  
El catálogo usa `modoLite: "niche"` (`sub-saas-catalog` oficios).  
Si se implementa el spec **literal**, se rompe el shell.

**Fix:** alinear spec + código a **un** valor (`niche` + slug oficios, o agregar `oficios` de verdad en `ModoLite`).

### 1.5 MATRIZ_PUERTAS.md miente en “Menú: Sí (aislado)”

La matriz marca P-OFI-ELEC menú aislado. En código Oficios es sección global.  
**Gemini:** corregir la columna “Existe hoy” o no volver a marcar DONE hasta que Grok mergee 1.1.

### 1.6 Git

Todo esto (Ola 0 + docs) está **sin commit**. Un reset pierde el trabajo. Human/Grok: commit por bloques.

---

## 2. 🔴 P0 — bugs todavía en producción

| Gap | Archivo | Qué pasa |
|-----|---------|----------|
| Onboarding manda `empresaId: 1` | `app/dashboard/onboarding/page.tsx` ~104 | Si la API no ignora el body, pisa el tenant 1 |
| Hotelería emite llave con `reservaId: 1` | `app/dashboard/hoteleria/page.tsx` ~27–30 | Llave de otra reserva / demo hardcode |
| Nav a **404** | `lib/comercial/nav-matrix.ts` | `/dashboard/reventas/links`, `/reventas/stock`, `/industria/corte`, `/industria/talleres` |
| `/claver/contacto?pack=implementacion` | no existe en código | P-HORAS de la matriz es vapor |
| Copy “cobro automático de seña por MP” | `sub-saas-catalog.ts` oficios `outcomes` | En ficha solo hay **Marcar Señado** (flag), no cobro |

---

## 3. 🟠 P1 — packs que ya se venden (PRD §3.1)

### 3.1 Ferretería / POS “mostrador serio”

| Gap | Dónde | Nota |
|-----|-------|------|
| `calcularVentaFraccionada` (m / m² / kg + merma) | `lib/pos/unidades-fraccionadas-service.ts` | **0 callers** en UI |
| Promo 2×1 / 3×2 | `aplicarPromoCantidad` | Solo tests |
| EAN balanza `20`/`28` | `parseEanBalanza` | No en POS |

Landing ferretería promete corte/metraje o “presupuesto por voz” → **bajar copy** (Gemini) **o** cablear (Grok). No las dos mentiras.

### 3.2 Monotributo / presupuestos comerciales

`/dashboard/ventas/presupuestos` está en el menú (Ola 0).  
**Falta:** PDF, WhatsApp, mail. “Enviar” cambia estado, no manda nada. Pack freelance PRD lo promete.

### 3.3 Gym — dos homes

- PRD golden: `/dashboard/membresias`
- Nicho: `/dashboard/nicho/gimnasio` (cuotas)
- “Cuota del mes” vive en nicho, no en membresías
- Shell `niche` default oficios → el gym puede ver tabs de obra (P0 1.1)

**Fix:** un solo home; no vender torniquete (copy ya lo dice; el menú no).

### 3.4 Stock (P-STOCK)

Landing `listoPct: 55`, SKU `core.claver`.  
No es WMS. Falta en producto: alertas de quiebre **cerradas** end-to-end, vencimientos kiosco, pack/bulto.  
Gemini: badge **beta** visible. Grok: no hace falta WMS para PRD kiosco.

### 3.5 Cadena (P-CADENA)

No hay landing “agendar implementación”. Copy está en `COPY_CADENA_POS.md`.  
Selector de sucursal en POS no es un pack cerrado.  
CTA debe ser llamada + `svc.implementacion`, no el mismo trial de 1 caja.

---

## 4. 🟠 P1 — Oficios (producto de la home, no está en PRD §3.1)

Hasta que esto cierre, **no** agregar `oficios` a `GO_LIVE_PACKS_PRD`.

| Botón / cálculo | Hoy | Debería |
|-----------------|-----|---------|
| Cobrar seña | Flag `Marcar Señado` | MP / efectivo → caja |
| Cobrar saldo | No | CxC + caja |
| Facturar AFIP | No en ficha | Link o emitir desde trabajo FINALIZADO |
| PDF / print presupuesto | Link público `/p/trabajo/{token}` | PDF nativo o “enviar WA” de verdad |
| Totales 3 niveles | Hardcode **$35k / $70k / $100k** | `oficios/nuevo/page.tsx` |
| APU | 1 seed pared 10 m² | Biblioteca o no mostrarlo |
| Jornales | `deduccionesVales = 0` | Vales reales |
| Fórmulas math.js | Hazen-Williams + largo×alto | No vender como “cálculo de ingeniería” |
| Hitos → CxC | Service existe | Casi no hay UI de estudio |

Copy LinkedIn (`LINKEDIN_PROFESIONALES.md`) está bien; **el producto todavía no cobra el certificado**.

---

## 5. 🟠 P1 — puertas Gemini escritas, no cableadas

| ID | MD | Código |
|----|----|--------|
| P-OFI-ELEC / PLOM / ESTUDIO | COPY + SKINS | Landing única, sin `?oficio=` |
| P-CADENA | COPY_CADENA_POS | Spec; no hay `/pos-cadena` ni CTA horas |
| P-HORAS | SKU_IMPLEMENTACION_HORAS | `pack=implementacion` no existe |
| P-PARTNER / Fiverr | CANAL_FIVERR_PARTNER | Landing partners sí; `?ref=` en gig **no verificado** en este pass |
| P-ESTUDIO | LinkedIn posts | Mismo motor oficios; hitos sin UX |

Gemini **no** reescribe estos MD hasta que Grok mergee 1.x. Después: actualizar “Existe hoy” en la matriz.

---

## 6. 🟡 P2 — nichos / cálculos (no abrir 20 verticales)

Motores: `movimientos | cuotas | consorcio | agenda | libreta`. El long-tail es **skin**.

| Vertical | Gap obvio | ¿Vender? |
|----------|-----------|----------|
| Taller | OT = título+monto; no horas×tarifa, no stock repuesto | Piloto |
| Vet / HC | Sin cobrar consulta / receta / descontar insumo | Piloto |
| Resto / KDS | Sin dividir cuenta, propina, pre-cuenta | Demo |
| Consorcios | Prorrateo %; sin punitorio, milésimas, extra | Piloto |
| Agro | Retenciones inventadas; IoT stub | Demo Clavergrow |
| Carnicería | Numpad kg; EAN no parseado | Demo |
| Préstamos | Interés simple 30%, **1 cuota** | Demo / libreta |
| Peluquería | Agenda 30 min; comisión no | Demo |
| Fumigación | Código piloto vs PRD “no vender” vs marketing beta | **Alinear docs** |
| NicheCuotasPanelV2 | Importado, botones muertos (Cuota Masiva sin onClick, MP mock) | No montar |

**No es gap de esta salida:** CYPE, CIRSOC, HIS, torniquete, SENASA, WMS robot, 47 demos como PRD.

---

## 7. 🟡 P2 — UX residual

| Ítem | Nota |
|------|------|
| `PageShell` en fiado / IVA / banco | Fiado sigue tabla HTML; banco mejoró con modal |
| StatusBadge vs `bg-green-100` | POS / usuarios / impuestos |
| Confirm destructive | Clientes desactivar, usuarios toggle |
| MP “Connect” | Sigue pegar token, no OAuth |
| Impuestos descargas | Solo después de liquidar; años hardcode |
| Command palette | Cubierto POS/Fiado; falta MP |
| Tests `home-redirect` de 12 SKUs | Spec 09; no están |

---

## 8. Contradicciones de documentos (Gemini)

Arreglar **docs**, no inventar producto:

1. `GO_LIVE_PRD.md` §3.3 **no vender fumigación** vs `go-live-packs.ts` **piloto** vs `FALTANTES_TECNICOS_NICHOS.md` “no existe”.  
2. Oficios marketing `estado: disponible` / 85% vs `resolveGoLiveTier("oficios") = demo` vs home #1.  
3. `MATRIZ_PUERTAS.md` “Menú aislado” vs sidebar global.  
4. `FALTANTES_TECNICOS_NICHOS.md` fecha 2026-07-18: desactualizado (fumigación, Ola 0).  
5. Grow: redirect hecho; landings/sub-saas que aún apuntan a `/dashboard/grow` hay que buscar y cambiar.

---

## 9. Cola sugerida (orden)

### Grok (código)

1. Oficios fuera del menú salvo SKU/rubro oficios + default shell niche ≠ oficios para gym.  
2. `?activar=` en CTAs de landings combate + test 12 SKUs.  
3. `?oficio=` interpolación copy (tabla `SKINS_OFICIOS.md`).  
4. Onboarding: sacar `empresaId: 1`. Hotelería: no `reservaId: 1`.  
5. Quitar 404 de `nav-matrix` (reventa/textil).  
6. Oficios ficha: Cobrar seña (caja/MP) + Facturar (si se quiere PRD oficios).  
7. Cablear **o** esconder `calcularVentaFraccionada` / promos.

### Gemini (docs)

1. Corregir MATRIZ “Existe hoy” (honestidad).  
2. Alinear fumigación PRD vs packs.  
3. Bajar wow ferretería “corte / voz” si Grok no cablea.  
4. Badge beta stock.  
5. No marcar PUERTA-09 código como hecho: el MD es spec.

### Humano

| Tema | Pregunta |
|------|----------|
| Commit | ¿Se pushea Ola 0 ahora? |
| Oficios a §3.1 | Solo después de cobrar seña de verdad |
| Precio horas | 4/8/16 h (SKU_IMPLEMENTACION) |
| Fiverr % | 30% + setup |
| ¿Ads LinkedIn estudio? | Copy sí; producto de cobro aún flaco |

---

## 10. Definición de “ya no hay gap P0 de puertas”

- [x] Kiosco `modoLite=completo` **no** ve Presupuesto 3 Niv (aislado con `skuKey: "niche.oficios"` en sidebar)
- [x] `/login?activar=niche.oficios` → `/dashboard/oficios` (verificado en `activar-intent.ts`)
- [x] `/login?activar=pos.fiado_barrio` → `/dashboard/fiado` (verificado en `activar-intent.ts`)
- [x] `/claver/apps/oficios?oficio=electricista` cambia H1 e interpolación (en `app/claver/apps/[slug]/page.tsx`)
- [x] Cero `empresaId: 1` / `reservaId: 1` en `app/dashboard` (limpiados en onboarding y hotelería)
- [x] Matriz puertas columna menú = realidad (`MATRIZ_PUERTAS.md`)
- [ ] Trabajo commiteado en git

Hasta ese checklist, **no está “100% implementado”**. Está Ola 0 de UX + un pack de copy. Las puertas todavía desembocan en el mismo Claver.

---

*Actualizar este archivo al cerrar cada fila (fecha + PR/commit). No reabrir la auditoría larga: este es el backlog vivo.*

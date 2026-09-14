# PRODUCT BRIEF — Landings Works (Energy · Infra · Blockchain)

**Producto Claver · shippable · 2026-09-14**  
**Pedido:** Pablo vía CTO — brief BEFORE coding (puertas Works débiles vs Soft)  
**Repo path intended (CTO):** `docs/comercial/LANDINGS_WORKS_ENERGY_INFRA_BLOCKCHAIN.md`  
**Box path:** `/workspace/claver-specs/LANDINGS_WORKS_ENERGY_INFRA_BLOCKCHAIN.md`  
**Refs:** `CLAVER_WORKS_ENGINE_PRD.md` · `DOD_LEAD_SOFT_ENERGY_2026-09-13.md` · `COPY_TIER_A_LANDINGS_W1.md` · Holding one-pager · Playbook 1er deal Energy · audit live `/energy` post-dea9958  
**Tono:** es-AR, llano, sin jerga ERP · calidad Soft Tier A

---

## 0) Decisión de plantilla (lockeada)

| Decisión | Valor |
|---------|--------|
| **Plantilla** | **1 shared `SegmentLanding`** + **copy packs por segmento** |
| Rutas | `/energy` · `/infra` · `/blockchain` (mismo skeleton; props de pack) |
| Form | shared `WorksLeadForm` con `segmento` + campos opcionales del pack |
| Soft doors | **no** se tocan (`/software`, ferretería/servicios/gym) |
| Ads Works | **NO volumen** hasta 1 deal papel + Pixel Soft (PRD anti-scope) |

**Por qué 1 plantilla (no 3 landings distintas):**  
PRD ya define motor multi-segmento + stubs vivos iguales. Soft Tier A ya usa patrón “misma puerta / pack distinto”. Tres layouts = drift + costo. Infra/Blockchain pueden vivir con packs thin + placeholders de social proof.

**Energy first:** copy completo abajo. Infra/Blockchain = mismos slots, texto thin OK.

---

## 1) Hero + promesa (broker / orquestación)

### Anti-claims (cristalinos — visibles en FAQ + microcopy; nunca en creativo)

| Segmento | NUNCA decir / mostrar |
|----------|------------------------|
| **Energy** | “Claver instala paneles” · somos EPC · fabricamos · firmamos matrícula eléctrica · garantizamos kWh |
| **Infra** | “Claver construye / opera DC propio” · “nave lista en el Sur” sin partner · OT Field / cuadrillas Claver |
| **Blockchain** | Custody de cripto · exchange · token Claver · “somos el auditor” sin firma externa nombrada |
| **Común Works** | Mezclar pitch Soft ferretería/gym en hero Works · Ads volume · “ERP” en hero |

### Promise (común Works)

> Claver **orquesta**: lead → presupuesto → seña → match a partner → hitos → cobro/comisión.  
> El **partner ejecuta**. Soft se ofrece **después** del deal (upsell), no en el hero Works.

### Energy — strings copy-paste ready

| Slot | String exacto |
|------|----------------|
| **Eyebrow** | Works · Energy · Solar con partners |
| **H1** | Solar con partner. Cotizás y cobrás seña con nosotros. |
| **H2 / Sub** | Armamos el alcance, te conectamos con un instalador de la zona y seguimos los hitos. Claver orquesta; el EPC instala. |
| **Promise (1 línea)** | Lead → presupuesto → seña → match EPC → obra del partner → cobro/comisión. |
| **Bullets hero (3)** | 1) Cotización orientativa y seña con Claver · 2) Match a EPC matriculado (no somos el instalador) · 3) Hitos claros; comisión transparente |
| **CTA primario** | Pedir cotización solar |
| **CTA micro** | Sin compromiso · Respondemos por WhatsApp · No instalamos paneles |
| **CTA secundario (ghost)** | Ya tengo consulta / Soft → `/software` (quieto, no compite) |
| **OG title** | Solar con partner · Claver Energy |
| **OG desc** | Cotizás y cobrás seña con Claver. El EPC instala. Orquestamos el proyecto. |
| **`<title>`** | Claver Energy — Solar con partners EPC |

**Reemplaza prod hoy:** H1 genérico “Claver Energy” + sub “Orquestamos solar…” (débil vs Soft Tier A). CTA “Enviar consulta energy” → **Pedir cotización solar**.

### Infra — pack thin (mismo skeleton)

| Slot | String |
|------|--------|
| Eyebrow | Works · Infra · Obra / naves / colo |
| **H1** | Obra e infra con partners. Nosotros orquestamos. |
| **H2** | Civil, naves o colo liviano: armamos alcance, seña y match. No somos constructora ni operamos un data center propio. |
| Bullets | Form → lead Works · Partners civil/DC en registry · Sin OT Field en este MVP |
| CTA | Pedir consulta Infra |
| Micro | Broker de obra · Sin DC propio Claver |
| Anti | no “DC Claver en el Sur” como propio |

### Blockchain — pack thin

| Slot | String |
|------|--------|
| Eyebrow | Works · Blockchain · Pros externos |
| **H1** | Solidity, audit y nodos con partners. Sin custody. |
| **H2** | Te conectamos con estudios y firms. Claver orquesta seña y hitos. No custodiamos cripto ni somos exchange. |
| Bullets | Form → lead · Partners audit/solidity · Anti-scope: no tokens / no custody |
| CTA | Pedir consulta Blockchain |
| Micro | Sin custody · Sin exchange · Partner firma lo técnico |

---

## 2) Secciones mínimas (orden fijo en `SegmentLanding`)

Todas las rutas Works usan este orden. Energy = contenido full; Infra/Blockchain = thin + placeholders.

### 2.1 Hero (above-fold)
Eyebrow · H1 · H2 · 3 bullets · form sticky/right (desktop) o form bajo hero (mobile) · CTA ≥48px.

### 2.2 Qué hacemos (Claver)
**Energy copy:**
- Captamos tu consulta y armamos alcance (kWp + zona).
- Presupuesto orientativo en Soft (servicios) y seña.
- Match a EPC de shortlist (ej. GenSolar / Amperio / Solarpool — sin sobre-prometer marca fija en UI hasta deal).
- Seguimos hitos y cobro; comisión Claver 15–30% sobre lo acordado.
- **No** ejecutamos obra ni firmamos matrícula.

### 2.3 Qué hace el partner
**Energy copy:**
- Relevamiento e instalación.
- Matrícula / trámites eléctricos (Ley 27.424 etc.) a cargo del EPC salvo pacto.
- Oferta firme post-relevamiento y garantías de obra/equipos.
- Cliente queda informado: *“Ejecuta EPC X; Claver orquesta.”*

### 2.4 Flujo Lead → Cobrado (FSM visible, lenguaje llano)

```
Lead → Calificado → Presupuesto → Seña → MatchPartner → En ejecución → Entregado → Cobrado / Comisión
                                                                         ↘ Cancelado
```

**UI landing (7 pasos cortos, no jerga FSM cruda al visitante):**

| # | Label visitante | Estado interno |
|---|-----------------|----------------|
| 1 | Nos contás el proyecto | Lead |
| 2 | Calificamos kWp + zona | Calificado |
| 3 | Presupuesto orientativo | Presupuesto |
| 4 | Seña (reserva match) | Seña |
| 5 | Te asignamos partner | MatchPartner |
| 6 | Obra del partner | EnEjecucion → Entregado |
| 7 | Cierre y comisión | Cobrado |

### 2.5 Social proof (o placeholders)
- Energy: placeholder OK — “Partners EPC en registry · Shortlist Research (GenSolar / Amperio / Solarpool…)” · **no** logos sin permiso escrito.
- Infra/Blockchain: card “Próximos partners · placeholder” — no inventar logos.
- Prohibido: testimonios inventados · “+N instalaciones Claver”.

### 2.6 FAQ (Energy — copy listo)

1. **¿Claver instala los paneles?**  
   No. Orquestamos el proyecto y matcheamos un EPC. El instalador ejecuta.
2. **¿Qué pago primero?**  
   Una seña a Claver (orientativa 10–20% del ticket) para reservar gestión y match. El resto sigue hitos con el partner.
3. **¿En cuánto tiempo me responden?**  
   Primer contacto comercial en horario hábil; match típico 48–72 h hábiles post-seña si hay partner en zona.
4. **¿Trabajan en mi zona?**  
   Depende del partner. Por eso pedimos zona en el form.
5. **¿Esto es el software Claver (Soft)?**  
   No. Esta página es Works (proyectos con partners). Soft (POS, presupuestos, cobro) lo podés sumar **después** del proyecto — ver §6.
6. **¿Hacen Ads de Energy?**  
   No por ahora. Inbound / red / consulta directa.

### 2.7 Soft upsell post-deal (OBLIGATORIO en brief · NO en hero Works)

**Cuándo:** al cerrar proyecto Energy (estado **Entregado** o **Cobrado/Comisión**), o en email/WA de cierre — **nunca** como CTA primario del hero `/energy`.

**Dónde en landing (bajo fold, quieto):**
- Bloque final “¿Ya cerraste el proyecto?” o footer link: *“Si además querés ordenar caja y cobros del día a día → Claver Soft”* → `/software`.
- En Cloud (ops): checklist post-Entregado → “Ofrecer Soft” (ferretería / servicios / gym según ICP).

**Oferta según ICP (sin mezclar en hero Works):**

| ICP post-Energy | Soft door | Destino |
|-----------------|-----------|---------|
| Casa / particular que también tiene comercio | Ferretería o POS | `/software` o `/demo/ferreteria` |
| Instalador / oficio que cotiza | Servicios | `/claver/apps/servicios` · `activar=niche.oficios` |
| PyME con socios/cuotas | Gym | `/demo/gimnasio` |
| Genérico | Soft home | `/software` |

**Copy upsell (WA/email, no hero):**  
“Con el proyecto cerrado, si querés anotar presupuestos, seña y quién te debe en el día a día, te dejamos Claver Soft — es otra línea, no reemplaza al EPC.”

**Reglas:**
- Upsell Soft **no** intercepta register Soft (`activar=` SaaS intacto).
- No creativos Soft+Energy mezclados (Ads Soft map: `/energy` = NO Ads Soft).
- PRD: Soft path no romper; upsell Soft←Energy es **post-Entregado**.

---

## 3) CTA form — campos (alineado `WorksLead` PRD + form vivo)

### Schema PRD (`WorksLead`)
- id, segmento, fuente (`ads|wa|form|soft_upsell|manual`)
- contacto: nombre, email, tel, zona
- payload JSON: kWp, techo, uso casa/PyME, notas
- proyectoId?, createdAt, ownerAgent

### Energy form — required vs optional

| Campo | UI id | Required | Notas |
|-------|-------|----------|-------|
| Nombre | `nombre` | **SÍ** | Ya required en prod |
| Email **o** Tel/WA | `email` / `tel` | **SÍ (al menos uno)** | Hoy ambos opcionales → **gap**; validar client: `email \|\| tel` |
| Zona | `zona` | **SÍ** | Calificación DoD Energy |
| kWp estimado | `kwp` | **SÍ** (número ≥0.1 o select rangos) | DoD + checklist PRD |
| Uso | `uso` | No (default Casa) | `casa \| pyme \| otro` |
| Tipo de techo | `techo` | No | chapa/teja/losa… |
| Notas | `notas` | No | alcance libre |
| Fuente | hidden | auto | `form` |
| Segmento | hidden | auto | `energy` |

**CTA submit label:** `Pedir cotización solar`  
**Success:** “Listo. Te contactamos por WhatsApp o mail. Recordá: Claver orquesta; no instalamos paneles.”  
**Persist:** POST crea `WorksLead` + `WorksProject` estado `Lead` (PRD §8.A).

### Infra form (thin)
Required: nombre · (email\|\|tel) · zona · notas (alcance: civil / nave / colo).  
Optional: m² / potencia IT aproximada (payload).  
Sin kWp.

### Blockchain form (thin)
Required: nombre · (email\|\|tel) · notas (solidity / audit / nodos / security).  
Optional: zona · stack.  
Disclaimer visible junto al submit: **Sin custody · Sin exchange**.

---

## 4) DoD visual + qué NO mostrar

### DoD visual (Energy shippable UI)

- [ ] CTA primario **≥48px** (`min-h-12` / `h-12`); hoy prod `h-9` → **FAIL** (audit post-dea9958)
- [ ] Inputs touch ≥44px (ideal 48); hoy `h-9` → subir
- [ ] Un solo CTA primario above-fold; Soft link ghost
- [ ] Mobile 390: sin overflow-x; form usable; menú Holding/Soft no tapa CTA
- [ ] `lang` / meta es-AR coherente (hoy `en-US` + OG Fiado/ERP → **FAIL** SEO/Ads preview)
- [ ] OG title/desc = Energy (no “Claver ERP / Fiado”)
- [ ] Anti-claim “no instalamos paneles” visible (hero bullet o micro CTA)
- [ ] Secciones §2 presentes (no “solo form”)
- [ ] Submit habilita con required OK; persiste lead
- [ ] Soft upsell solo bajo fold / post-deal — **no** hero

### Qué NO mostrar

- Fiado / kiosco / “Empezar gratis” Soft como CTA Energy
- Command Palette / “ERP settings” copy en chrome marketing
- Logos EPC sin acuerdo
- Precios kWh garantizados / incentivos municipales sin chequeo
- OT Field / GPS obra / cuadrillas Claver
- Custody / wallet / token (Blockchain)
- “Data center Claver” propio (Infra)
- Ads badges / Pixel Energy (no Ads Works aún)

---

## 5) Respuesta CTO point-by-point

| # | Pregunta | Respuesta Producto |
|---|----------|-------------------|
| 1 | Hero H1/H2 + promise + anti-claims | §1 Energy strings exactos; anti-claims tabla §1 |
| 2 | Secciones mínimas | §2: qué hacemos / partner / flujo / social·placeholder / FAQ (+ Soft upsell post-deal §2.7) |
| 3 | CTA form required/optional | §3 tabla Energy; email\|\|tel + zona + kWp required |
| 4 | DoD visual + NOT show | §4 |
| 5 | 1 template vs 3 landings | **1 `SegmentLanding` + packs** (§0) |

---

## 6) Soft upsell post-deal (CEO addendum — detalle ops)

```
… → Entregado → Cobrado/Comisión
                    ↓
              Touch Comercial/Soporte:
              “¿Sumamos Soft para presupuestos/caja/cobros?”
                    ↓
         Link /software o door ICP (ferretería|servicios|gym)
```

- Owner touch: Comercial (bot) · ticket grande Pablo  
- No crear `WorksProject` desde Soft register  
- Fuente lead Soft upsell inverso: si nace desde deal Energy, marcar CRM `fuente=soft_upsell` solo cuando el flujo sea Soft←Works documentado; no contaminar Ads Soft Pixel en `/energy`

---

## 7) Gaps encontrados en `/energy` actual (prod live)

| Gap | Severidad | Nota |
|-----|-----------|------|
| Landing ≈ hero corto + form (sin qué hacemos / partner / flujo / FAQ / social) | P0 Producto | Motivo de este brief |
| CTA/inputs `h-9` < 48px | P1 UX | UX_RELEASE_GATE |
| Solo `nombre` required; falta zona+kWp+contacto | P0 intake | Alinear DoD Energy |
| H1 “Claver Energy” débil vs Soft Tier A | P1 copy | Usar H1 §1 |
| Meta/OG = Fiado/ERP; `lang=en-US` | P1 | Rompe preview |
| Soft upsell ausente (post-deal) | P1 | Addendum CEO |
| Infra/Blockchain = mismo stub form-only | P1 | Misma plantilla + packs thin |
| Submit disabled hasta nombre — OK parcial | — | Completar validación §3 |

---

## 8) Acceptance checklist — Energy first (eng DoD)

### Copy & structure
- [ ] `SegmentLanding` shared; `/energy` pasa pack Energy completo
- [ ] H1 exacto: **Solar con partner. Cotizás y cobrás seña con nosotros.**
- [ ] H2 exacto: **Armamos el alcance, te conectamos con un instalador de la zona y seguimos los hitos. Claver orquesta; el EPC instala.**
- [ ] CTA exacto: **Pedir cotización solar**
- [ ] Micro: **Sin compromiso · Respondemos por WhatsApp · No instalamos paneles**
- [ ] Secciones: qué hacemos · qué hace partner · flujo 7 pasos · social/placeholder · FAQ · Soft upsell bajo fold

### Form → motor
- [ ] Required: nombre · (email\|\|tel) · zona · kWp
- [ ] Optional: uso · techo · notas
- [ ] POST → `WorksLead` segmento `energy` + `WorksProject` estado `Lead`
- [ ] Soft `activar=` paths **sin** crear WorksProject

### Visual
- [ ] CTA ≥48px; inputs ≥44px; mobile 390 sin overflow
- [ ] OG/title Energy (no Fiado)
- [ ] Anti-claims visibles; sin “instalamos paneles”

### Soft upsell
- [ ] Bloque bajo fold o footer → `/software` (quieto)
- [ ] Checklist Cloud post-Entregado: ofrecer Soft según ICP
- [ ] **No** CTA Soft en hero Energy

### Safety
- [ ] Smoke Soft trial ferretería/servicios/gym OK
- [ ] `/infra` `/blockchain` viven con packs thin mismo template
- [ ] No Ads Energy en release notes

---

## 9) Owners

| Rol | Qué |
|-----|-----|
| Producto | Este brief + anti-scope |
| CTO | `SegmentLanding` + `WorksLeadForm` + meta OG + DoD visual |
| Comercial | Operar leads; Soft upsell post-Cobrado |
| Marketing | **No** Ads Works; Soft Ads solo `/software`+doors |
| Pablo | Override 1er deal / legal RC |

— Producto Claver · 2026-09-14 · GO eng Energy-first

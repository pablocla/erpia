# Prompt Gemini — Puertas de entrada (landing por comprador)

**Fecha:** 2026-08-24  
**Assignee principal:** `gemini` (docs / copy es-AR / specs / playbooks)  
**Pair:** specs de este archivo → **Grok** implementa landings/`?activar=`/menú  
**Human:** precio final, horas de setup, legal Fiverr/partners  

> Este archivo **es el prompt ejecutable**.  
> No es un ensayo: es la tesis de go-to-market + **cola de tickets**.  
> Copiá §0 en Gemini y ejecutá el primer TODO de la §2.

**Fuentes canónicas (leer si el ticket lo pide; no reescribirlas):**

| Path | Uso |
|------|-----|
| `docs/engineering/ASSIGNMENT.md` | Gemini = `docs/` · Grok = código |
| `docs/GO_LIVE_PRD.md` | Qué pack se puede vender como PRD |
| `docs/qa/AUDITORIA_PRD_BOTONES_RUBROS_NICHOS_UX.md` | Menú, botones, cálculos reales vs humo |
| `lib/comercial/sub-saas-catalog.ts` | Slugs `/claver/apps/[slug]`, SKU, `modoLite`, golden path |
| `lib/comercial/go-live-packs.ts` | Tiers PRD / piloto / no vender |
| `lib/comercial/activar-intent.ts` | `?activar=` → shell (no ERP completo) |
| `lib/comercial/go-to-market-vitrine.ts` | Apps de combate (oficios / fiado / turnos) |
| `lib/comercial/industry-templates.ts` | `/demo/[industryId]` |
| `docs/comercial/PROGRAMA_PARTNER_CLAVER.md` | 30% recurrente + setup (si existe; si no, partners landing) |

---

## 0. Prompt de sesión (copiar y pegar en Gemini)

```text
Sos Gemini en el monorepo Claver (ERP Argentina, Next.js, es-AR).

MISIÓN DE ESTA COLA:
Perfeccionar y documentar el modelo “una fábrica, varias puertas”:
- Landing de electricista ≠ landing de cadena de tiendas ≠ landing de stock
  ≠ oferta de horas de implementación ≠ gig de Fiverr.
Mismo Claver atrás. Distinto comprador, copy, CTA, primer pantalla y precio.

REGLAS OBLIGATORIAS:
1. Solo escribís Markdown bajo docs/ (salvo que el ticket diga path exacto).
2. NO implementás código en lib/ ni app/ — eso es Grok (tickets pair).
3. Leé docs/engineering/ASSIGNMENT.md y este archivo completo (sobre todo §1).
4. Tomá el primer ticket con estado TODO de la §2 (orden P0 → P1).
5. Ejecutá SOLO ese ticket: seguí Pasos 1…n. No saltees. No abras 40 landings.
6. Guardá el entregable en el path indicado (creá carpetas si faltan).
7. Al final del ticket respondé con este bloque:

### Cierre ticket {ID}
- Estado: DONE | BLOCKED
- Archivo(s) creado(s): …
- Resultado esperado: checklist con ✅/❌
- Siguiente ticket recomendado: …
- Si es pair: qué debe hacer Grok en 5 viñetas

8. Locale es-AR. Montos ARS. Verbos de plata (cobrar, seña, factura, stock). Cero jerga Silicon Valley.
9. No inventes verticales ni SKUs. Reutilizá slugs/SKU de sub-saas-catalog y go-live-packs.
10. No prometas lo que la auditoría marca 🟠/🔴 (cálculo estructural, HIS, torniquete, OT Field, Grow 404).
11. Máximo 12 puertas que venden. El resto es “Ver catálogo” o no se publica.
12. Si falta un dato en el repo, marcá BLOCKED + pregunta concreta. No rellenes humo.
13. Cada landing DEBE declarar: comprador, SKU, ?activar=, modoLite, primera ruta, CTA, qué NO incluye.

Empezá por el primer TODO de la §2.
```

---

## 1. Tesis (no negociable — no la reescribas; usala)

### 1.1 Una fábrica, varias puertas

Claver **no** es 50 productos. Es un monolito (POS, stock, caja, AFIP, oficios, fiado, CxC).  
La landing **no crea un fork**. Cambia:

| Capa | Qué cambia por puerta |
|------|------------------------|
| Copy / SEO / OG | El oficio o el segmento (electricista vs cadena) |
| CTA | Trial / demo / “agendá implementación” / “sumate de partner” |
| `?activar=` | SKU + `modoLite` + `landingPath` (`activar-intent.ts`) |
| Primera pantalla | Golden path del pack, **no** el ERP completo |
| Precio | Ancla gratis / Oficios ~29.900 / POS+setup / horas partner |

Si el electricista y el de la cadena caen al **mismo menú**, la puerta falló. Eso ya está auditado: sidebar oficios-global vs POS en “accesos rápidos”.

### 1.2 Tres negocios (no los mezcles en una URL)

| # | Negocio | Quién paga | Qué lleva |
|---|---------|------------|-----------|
| **A. SaaS self-serve** | Electricista, kiosco, gym, monotributo | Abono mensual | Landing de rubro/pack + trial |
| **B. Cadena / setup** | 2+ sucursales, stock serio, AFIP prod | Abono **más alto** + **horas** de implementación | Landing de segmento + llamada |
| **C. Canal** | Partner, implementador, **agente Fiverr** | No compra el ERP para sí: cobra **horas al cliente** + **% Claver** | Landing `/claver/partners` + kit de gig |

Fiverr **no es un rubro**. Es el canal C.  
“Horas de implementación” **no es un rubro**. Es el SKU de servicio del negocio B/C (`svc.implementacion` ya aparece en `product-auto-subscribe.ts`).

### 1.3 Mapa de puertas autorizadas (techo = 12)

Publicar **solo** estas (o un subconjunto). Todo lo demás: no landing propia.

| ID puerta | Comprador | URL sugerida (existente o spec) | SKU / activar | Primera ruta | CTA | ¿PRD hoy? |
|-----------|-----------|----------------------------------|---------------|--------------|-----|-----------|
| P-OFI-ELEC | Electricista / técnico | `/claver/apps/oficios` **o** skin `/oficios/electricista` | `niche.oficios` | `/dashboard/oficios` | Trial 7 días | Piloto producto; copy sí |
| P-OFI-PLOM | Plomero | misma app, skin copy | `niche.oficios` | `/dashboard/oficios` | Trial | Igual (no fork) |
| P-FIADO | Kiosco / almacén | `/claver/apps/fiado` | `pos.fiado_barrio` | `/dashboard/fiado` | Ancla gratis | **PRD** |
| P-POS | Mostrador 1 local | `/claver/apps/pos` | `pos.core` | `/dashboard/pos` | Trial | **PRD** |
| P-CADENA | Cadena 2–20 locales | `/claver/claverp/pos-afip` + copy cadena | `pos.core` + sucursales | POS + caja + productos | **Agendá implementación** | PRD con implementador |
| P-STOCK | Dueño que dice “stock” | `/claver/apps/stock` | `core.claver` | `/dashboard/productos` | Trial / demo | Beta 55% — no overpromise WMS |
| P-MT | Freelance / monotributo | `/claver/apps/monotributo` | `pool-monotributo` | `/dashboard/ventas/presupuestos` | Trial | **PRD** |
| P-GYM | Gym / club cuotas | `/claver/apps/puntos` o membresías | `niche.gimnasio_barrio` | `/dashboard/membresias` (un solo home) | Trial | **PRD** acotado |
| P-HORAS | PyME que pide “me lo instalan” | `/claver/contacto?pack=implementacion` | `svc.implementacion` | — | Pedir horas / partner | Servicio, no app |
| P-PARTNER | Implementador / Fiverr | `/claver/partners` | programa partner | Cloud partners | Registrarme | Canal |
| P-ESTUDIO | Ingeniero/arquitecto obra particular | **No** “cálculos”. Misma Oficios + hitos + AFIP | `niche.oficios` | `/dashboard/oficios` | Demo 20 min | LinkedIn; no CYPE |
| P-TURNOS | Pelu / consultorio liviano | `/claver/apps/turnos` | agenda | `/dashboard/agenda` | Trial | Demo/piloto |

**Prohibido publicar como puerta:** fumigación “sistema de plagas”, Grow `/dashboard/grow` (404), HIS vet, torniquete, textil/reventa 404, 47 cards de `/demo` como si fueran PRD.

### 1.4 Contrato de una puerta (toda spec/copy lo debe tener)

```text
Puerta: {ID}
Comprador: {quién, en una frase}
Dolor (es-AR, concreto): …
Promesa OK: …
Promesa NO: …          ← obligatorio, copiar espíritu GO_LIVE_PRD
SKU / ?activar=: …
modoLite: …
Primera ruta post-login: …
CTA primario: {trial | demo | llamada | partner}
CTA secundario: WhatsApp / contacto
Precio visible: …
Qué ve en el menú (máx 7 ítems): …
Qué NO debe ver: …
Canal: {Google rubro | LinkedIn | Meta | Fiverr | partner}
```

### 1.5 Oficios vs ingeniero (para copy LinkedIn / P-ESTUDIO)

No competimos con CYPE / CAD / cómputo CIRSOC.  
El ingeniero de **obra particular** compra el sombrero **contratista**: 3 opciones al comitente, seña, certificado de hito → CxC, cuadrilla.  
Frase canónica: *“El cálculo lo seguís haciendo en tu software. Claver es cómo cobrás, certificás y no peleás con la cuadrilla.”*  
Si el copy dice “cálculos, procesos, proyectos de ingeniería” → **rechazar**.

### 1.6 Fiverr / free agent (P-PARTNER)

Gig típico (el agente lo publica en Fiverr/Workana, no Claver):

- Título: “Te instalo POS / stock / facturación AFIP (Argentina) en N horas”
- El cliente de Fiverr paga **horas al freelancer**.
- El freelancer activa Claver con su `?ref=` / partner id → comisión 30% recurrente + 100% setup si aplica.
- Claver **no** es el vendedor en Fiverr. Entrega: checklist go-live, demos, script 15 min, límites de promesa.

---

## 2. Cola de tickets

Estados: `TODO` → `DONE` | `BLOCKED`.  
Gemini cambia el estado **en este archivo** al cerrar (tabla §2.0).

### 2.0 Tablero

| ID | Pri | Estado | Entregable |
|----|-----|--------|------------|
| PUERTA-01 | P0 | DONE | `docs/comercial/puertas/MATRIZ_PUERTAS.md` |
| PUERTA-02 | P0 | DONE | `docs/comercial/puertas/COPY_ELECTRICISTA.md` |
| PUERTA-03 | P0 | DONE | `docs/comercial/puertas/COPY_CADENA_POS.md` |
| PUERTA-04 | P0 | DONE | `docs/comercial/puertas/COPY_STOCK.md` |
| PUERTA-05 | P0 | DONE | `docs/comercial/puertas/SKU_IMPLEMENTACION_HORAS.md` |
| PUERTA-06 | P0 | DONE | `docs/comercial/puertas/CANAL_FIVERR_PARTNER.md` |
| PUERTA-07 | P1 | DONE | `docs/comercial/puertas/LINKEDIN_PROFESIONALES.md` |
| PUERTA-08 | P1 | DONE | `docs/comercial/puertas/SKINS_OFICIOS.md` |
| PUERTA-09 | P1 | DONE | `docs/comercial/puertas/SPEC_GROK_LANDINGS_ACTIVAR.md` |
| PUERTA-10 | P1 | DONE | `docs/comercial/puertas/OBJECIONES_POR_PUERTA.md` |

---

### PUERTA-01 — Matriz canónica de puertas

**Pasos**

1. Leé §1 de este archivo + `go-live-packs.ts` + `sub-saas-catalog.ts` (slugs oficios, pos, fiado, stock, monotributo, partners).
2. Escribí `docs/comercial/puertas/MATRIZ_PUERTAS.md` con:
   - Tabla de las 12 puertas de §1.3 **confirmadas contra código** (si el slug no existe, marcar “spec Grok”, no inventar URL viva).
   - Columna “existe hoy”: landing sí/no, `?activar=` sí/no, menú coherente sí/no (usar la auditoría).
   - Columna riesgo comercial (alto si overpromise).
3. Lista de landings **a no publicar** (Grow 404, 47 demos, fumigación como HIS, etc.).

**DoD**

- [ ] ≤12 puertas; cada una con SKU + primera ruta + CTA  
- [ ] Cero SKUs inventados  
- [ ] Al menos 3 “existe hoy = no” con nota pair Grok  

---

### PUERTA-02 — Copy electricista (skin de Oficios, no producto nuevo)

**Pasos**

1. Leé `sub-saas-catalog` entrada `oficios` + `app/oficios/page.tsx` metadata + auditoría §8 Oficios.
2. Escribí `COPY_ELECTRICISTA.md` con el contrato §1.4 completo.
3. Incluí:
   - H1, sub, 4 pains, 4 outcomes, FAQ × 5  
   - CTA trial + WhatsApp prefilled  
   - Bloque **Promesa NO**: no cálculo de tableros, no ramales CIRSOC, no “software de ingeniería”  
   - Guión demo 8 minutos (presupuesto 3 niveles → link comitente → seña)  
   - Meta title / description SEO (“presupuesto electricista Argentina”)

**DoD**

- [ ] Mismo SKU `niche.oficios`  
- [ ] Cero mención de POS cadena / fiado kiosco  
- [ ] Un humano podría pegar el H1 en la landing actual  

---

### PUERTA-03 — Copy cadena de tiendas (POS + stock + sucursales)

**Pasos**

1. Leé `SOLUTIONS["pos-afip"]` en `lib/marketing/solutions-catalog.ts` y packs `pos_core` / ferretería.
2. Escribí `COPY_CADENA_POS.md`: comprador = 2 a 20 cajas, no kiosco de esquina.
3. CTA **no** es “probá gratis y listo”. Es “agendá implementación” + rango de horas (propuesta: 4–16 h según locales; human confirma).
4. Promesa NO: no Rappi, no SAP, no consolidación holding, no offline infalible.
5. Diferenciar de P-POS (1 mostrador, trial).

**DoD**

- [ ] Dos CTAs distintos a P-POS  
- [ ] Lista de lo que el implementador hace el día 1 (checklist §6 GO_LIVE, recortado)  

---

### PUERTA-04 — Copy stock (capacidad, no rubro)

**Pasos**

1. Leé slug `stock` en sub-saas (`listoPct: 55`, `core.claver`, golden `/dashboard/productos`).
2. Copy honesto: cámara + CSV + alertas. **No** WMS, RF, multi-depósito avanzado.
3. CTA trial hacia productos/POS. Cross-link a P-CADENA si tiene varios depósitos.
4. Marcar beta en badge.

**DoD**

- [ ] `listoPct` y límites visibles en el copy  
- [ ] No usa la palabra “WMS” ni “SAP”  

---

### PUERTA-05 — Horas de implementación (SKU servicio)

**Pasos**

1. Confirmar menciones de `svc.implementacion` y runbooks Cloud (`docs/claver-cloud/runbooks/`).
2. One-pager: qué incluye 4 h / 8 h / 16 h (alta tenant, usuarios, productos CSV, 1 golden path, 1 cajero).
3. Quién cobra: Claver vs partner (100% setup partner si aplica).
4. Qué **no** incluye: desarrollo a medida, AFIP cert del cliente (el cliente lo tramita), hardware.
5. CTA a `/claver/contacto` o WhatsApp ventas. Esto **no** es trial.

**DoD**

- [ ] Tabla horas × entregable × precio sugerido (marcar “human confirma precio”)  
- [ ] Relación con P-CADENA y P-PARTNER explícita  

---

### PUERTA-06 — Canal Fiverr / free agent

**Pasos**

1. Escribí `CANAL_FIVERR_PARTNER.md`:
   - Perfil Fiverr (título, tags Argentina, packs Basic/Standard/Pro en horas)
   - Texto del gig (es-AR, sin “ERP 40 módulos”)
   - Qué puede prometer / qué no (tabla GO_LIVE)
   - Cómo carga el `?ref=` o partner id (si no está documentado: BLOCKED + pregunta)
   - Script primera llamada 10 min con el cliente del gig
   - Handoff a Claver Cloud si hay AFIP prod
2. 3 títulos de gig: POS kiosco · Stock CSV · Oficios seña.

**DoD**

- [ ] El freelancer puede publicar mañana sin inventar producto  
- [ ] Comisión / setup alineados al programa partner (o “human confirma %”)  

---

### PUERTA-07 — LinkedIn profesionales (ingeniero / arquitecto / MMO)

**Pasos**

1. Copy P-ESTUDIO + 4 posts + 1 artículo corto (cálculo vs cobro de obra).
2. No ads de kiosco. No “ingreso extra”.
3. CTA: demo 20 min o trial Oficios. Segundo CTA: partner (sus gremios).
4. Lista de cargos a targetear (Ingeniero civil, Director de obra, Constructor, Arquitecto independiente).

**DoD**

- [ ] Frase canónica §1.5 aparece  
- [ ] Cero CYPE/CIRSOC como feature Claver  

---

### PUERTA-08 — Skins de oficios (mismo SKU)

**Pasos**

1. Tabla: electricista, plomero, pintor, gasista, herrero — **un** `niche.oficios`.
2. Por skin: H1 distinto, 3 pains, keyword SEO, mismo golden path.
3. Spec: query `?oficio=electricista` o subpath `/oficios/electricista` que **solo** cambia copy (pair Grok).
4. No crear 9 SKUs.

**DoD**

- [ ] ≥4 skins, 1 SKU  
- [ ] Grok tiene tabla copy lista para interpolar  

---

### PUERTA-09 — Spec Grok (landings + activar + menú)

**Pasos**

1. Spec en `SPEC_GROK_LANDINGS_ACTIVAR.md` para que Grok:

   a. Cada puerta P0 tenga `href` CTA = `/login?activar={sku}` o `/demo/{industryId}?activar=`.  
   b. Post-login **no** abra ERP completo (`activar-intent` + `modoLite`).  
   c. Menú de oficios **solo** en puertas oficios/estudio; POS/productos/fiado en puertas retail (auditoría Ola 0).  
   d. Redirect `/dashboard/grow` → agro cannabis **o** sacar CTA.  
   e. Skins §PUERTA-08: un layout, copy por `oficio`.  

2. DoD de implementación (tests Vitest sugeridos: `activar-intent` por sku de cada puerta).
3. Fuera de alcance: nuevos engines, CYPE, WMS.

**DoD**

- [ ] 5 viñetas Grok accionables con paths de archivo  
- [ ] Criterio de aceptación: electricista no ve “Caja Chica & Vales” como home  

---

### PUERTA-10 — Objeciones por puerta

**Pasos**

1. ≥3 objeciones × puerta P0 (P-OFI-ELEC, P-CADENA, P-STOCK, P-HORAS, P-PARTNER).
2. Respuesta corta + “si insiste, no vender X”.
3. Ej.: “¿Hace el cálculo del tablero?” → No. Presupuesto y seña. El plano lo hacés vos.

**DoD**

- [ ] 15+ objeciones  
- [ ] Ninguna respuesta inventa un módulo  

---

## 3. Qué Grok implementa después (no Gemini)

Cuando PUERTA-09 esté DONE, Grok (ticket pair):

1. `lib/dashboard/sidebar-modules.ts` — bloque Operación del día vs Oficios por pack.  
2. CTAs de landings → `?activar=` correcto.  
3. Skins copy oficios (un page, params).  
4. Command palette POS+Fiado; bottom nav cajero.  
5. Tests `activar-intent` + 1 test de menú por modoLite.

Gemini **no** abre esos archivos.

---

## 4. Human (no lo decidas vos)

| Tema | Default sugerido | Quién cierra |
|------|------------------|--------------|
| Precio Oficios | 29.900 (catálogo) | human |
| Horas setup cadena | 8 h / local extra +4 h | human |
| % Fiverr/partner | 30% abono + 100% setup | human / legal |
| ¿Skin `/electricista` o querystring? | query `?oficio=` más barato | Grok en pair |
| ¿Publicar P-ESTUDIO ya? | LinkedIn orgánico sí; Ads no | human |

---

## 5. Definición de “esta cola terminó”

- [ ] PUERTA-01…06 DONE  
- [ ] Al menos PUERTA-09 DONE (Grok puede codear)  
- [ ] Ninguna puerta publicada promete 🟠/🔴 de la auditoría  
- [ ] Fiverr y horas no están catalogados como “rubro”  
- [ ] Electricista y cadena tienen CTA y primera pantalla distintos en el papel  

---

*Si hay conflicto entre una landing vieja y este archivo, **manda este** + `GO_LIVE_PRD.md`. El catálogo de 47 demos no es lista de puertas.*

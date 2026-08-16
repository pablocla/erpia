# Prompt Gemini — Plan madurez por rubro (reutilización + % + pricing)

**Fecha:** 2026-08-04  
**Assignee principal:** `gemini` (docs / specs / copy / matrices)  
**Pair:** specs de este archivo → **Grok** implementa código  
**Human:** precio final, piloto real, legal  

> Este archivo **es el prompt ejecutable**.  
> No es solo inventario: es **cola de tareas numeradas** con pasos, entregable y resultado esperado (DoD).

**Fuentes canónicas (leer si hace falta):**

| Path | Uso |
|------|-----|
| `docs/engineering/ASSIGNMENT.md` | Qué hace Gemini vs Grok |
| `lib/comercial/industry-templates.ts` | industryId |
| `lib/niche/niche-apps-catalog.ts` | appId + engine |
| `lib/comercial/go-live-packs.ts` | tier PRD/piloto |
| `docs/GO_LIVE_PRD.md` | promesas OK/NO |
| `docs/comercial/HUECOS_NICHOS_UX_PROCESOS.md` | scores UX |
| `docs/qa/FALTANTES_TECNICOS_NICHOS.md` | gaps técnicos |
| `lib/prestamos/*` + `/dashboard/prestamos` | patrón casero a copiar |
| `lib/fiado/*` + `/dashboard/fiado` | patrón libreta |

---

## 0. Prompt de sesión (copiar y pegar en Gemini)

```text
Sos Gemini en el monorepo Claver (ERP Argentina, Next.js, es-AR).

REGLAS OBLIGATORIAS:
1. Solo escribís Markdown bajo docs/ (salvo que el ticket diga path exacto).
2. NO implementás código de producción en lib/ ni app/ — eso es Grok (tickets pair).
3. Leé docs/engineering/ASSIGNMENT.md y este archivo completo.
4. Tomá el primer ticket con estado TODO de la §2 (orden P0 → P1 → P2).
5. Ejecutá SOLO ese ticket: seguí Pasos 1…n.
6. Guardá el entregable en el path indicado (creá carpetas si faltan).
7. Al final del ticket respondé con este bloque:

### Cierre ticket {ID}
- Estado: DONE | BLOCKED
- Archivo(s) creado(s): …
- Resultado esperado: checklist con ✅/❌
- Siguiente ticket recomendado: …
- Si es pair: qué debe hacer Grok en 5 viñetas

8. No inventes verticales fintech/bancarios. Prestamista = casero de barrio.
9. Reutilizá motores existentes (M-FIADO, M-PRESTAMO, M-CUOTAS, M-MOV, M-AGENDA…).
10. Cada botón debe resolver plata, estado u WhatsApp. Sin métricas decorativas.
11. Locale es-AR, montos ARS, fechas dd/mm/yyyy.
12. Si falta dato en repo, marcá BLOCKED + pregunta concreta; no rellenes humo.

Empezá por el primer TODO de la §2.
```

---

## 1. Reglas de producto (no negociables)

### 1.1 Bolas de estado (usar en specs y copy)

| Bola | Código | % | Promesa |
|:----:|--------|--:|---------|
| 🟢 | `prd` | 80–100 | Vender con implementador |
| 🟡 | `piloto` | 55–79 | Piloto con alcance escrito |
| 🟠 | `demo` | 30–54 | Demo/trial; no “100% del rubro” |
| 🔴 | `shell` | 15–29 | Solo genérico |
| ⚫ | `no_vender` | 0–14 | No cobrar como vertical |
| 🔵 | `reuse` | — | Alias de otro rubro/motor |

**Colores de fila (UI):** verde=al día · ámbar=hoy/en curso · rojo=vencido/moroso · violeta=seña/parcial · gris=cancelado.

### 1.2 Motores (Lego — no reescribir ERP)

| ID | Origen código | Usar en |
|----|---------------|---------|
| M-FIADO | `/dashboard/fiado`, `lib/fiado/*` | almacén, kiosco, panadería |
| M-PRESTAMO | `/dashboard/prestamos`, `lib/prestamos/*` | prestamista casero |
| M-POS | POS, caja, productos | retail, ferretería, cantina |
| M-CXC | CxC, cobranzas | morosos, flotas, abonos |
| M-AGENDA | `/dashboard/agenda` | consultorio, pelu, cancha |
| M-HC | historia clínica | vet, clínica |
| M-CUOTAS | membresías / nicho cuotas | gym, club, escuela, colonia, peña, mutuo |
| M-MOV | `/dashboard/nicho/*` movimientos | plancha, taller, feria, remis, delivery, obras, acopio, salón |
| M-CONSORCIO | nicho consorcios | admin edificios |
| M-INMO | inmo / garantía | inmobiliaria |
| M-FUMI | `/dashboard/fumigacion` | plagas → base OT Field |
| M-HOSP | hospitalidad/KDS | bar resto |
| M-PICK | picking / ruta | distribuidora |
| M-PRESUP | presupuestos | monotributo, freelance |
| M-WA | wa.me / plantillas | transversal |
| M-OT-FIELD | roadmap (partir de fumi) | oficios de calle |

### 1.3 Plantilla de spec que Gemini debe producir (pair)

Todo ticket `pair` genera un MD con:

```markdown
# SPEC {ID} — {título}
## Dolor del cliente (1 párrafo es-AR)
## Motor reutilizado + qué NO construir
## Happy path 90 segundos
## Botones (label | acción | estado bola | reusa de)
## Copy es-AR (empty, toast, WA)
## Seeds demo mínimos (3 registros con sentido)
## Promesa OK / Promesa NO
## % actual → % meta
## DoD Grok (lista checkbox)
## Fuera de alcance
```

---

## 2. Índice de cola (orden de ejecución)

| # | ID | Pri | Estado | Assignee | Título | Entregable |
|---|-----|-----|--------|----------|--------|-------------|
| 1 | **RUB-00** | P0 | DONE | gemini | Inventario maestro actualizado (sin faltar 1) | `docs/comercial/rubros/INVENTARIO_MAESTRO.md` |
| 2 | **RUB-01** | P0 | DONE | gemini | Matriz pricing × digitalización × $ | `docs/comercial/rubros/MATRIZ_PRICING_DIGITALIZACION.md` |
| 3 | **RUB-02** | P0 | DONE | gemini | One-pager promesas por tier (vendedor) | `docs/comercial/rubros/PROMESAS_VENDEDOR.md` |
| 4 | **RUB-R1-01** | P0 | DONE | pair | Spec cuotas: Cobrar + WA + bolas (gym/club/escuela/colonia/peña/mutuo) | `docs/comercial/rubros/specs/R1-01-cuotas-cobrar-wa.md` |
| 5 | **RUB-R1-02** | P0 | DONE | pair | Spec plancha: listo → cobrar retiro | `docs/comercial/rubros/specs/R1-02-plancha-estados.md` |
| 6 | **RUB-R1-03** | P0 | DONE | pair | Spec taller: estados OT + cobro + WA | `docs/comercial/rubros/specs/R1-03-taller-ot.md` |
| 7 | **RUB-R1-04** | P1 | DONE | pair | Spec feria: cierre del día | `docs/comercial/rubros/specs/R1-04-feria-cierre.md` |
| 8 | **RUB-R1-05** | P1 | DONE | pair | Spec remis + delivery: cierre chofer/repartidor | `docs/comercial/rubros/specs/R1-05-remis-delivery-cierre.md` |
| 9 | **RUB-R2-01** | P0 | TODO | pair | Spec agenda: cobrar turno (consultorio/clínica) | `docs/comercial/rubros/specs/R2-01-cobrar-turno.md` |
| 10 | **RUB-R2-02** | P1 | TODO | pair | Spec pelu/salón: unificar path + cobro | `docs/comercial/rubros/specs/R2-02-peluqueria-unificar.md` |
| 11 | **RUB-R2-03** | P0 | TODO | pair | Spec cancha: reserva + seña | `docs/comercial/rubros/specs/R2-03-cancha-reserva-sena.md` |
| 12 | **RUB-R2-04** | P1 | TODO | pair | Spec vet: cobrar consulta en HC | `docs/comercial/rubros/specs/R2-04-vet-cobrar-consulta.md` |
| 13 | **RUB-R3-01** | P1 | TODO | gemini | Playbook no romper: fiado / prestamista / consorcios | `docs/comercial/rubros/PLAYBOOK_NO_ROMPER_VERDE.md` |
| 14 | **RUB-R3-02** | P1 | TODO | pair | Spec inmo: unificar garantía → inmo | `docs/comercial/rubros/specs/R3-02-inmo-unificar.md` |
| 15 | **RUB-R3-03** | P1 | TODO | pair | Spec fumi: ruta hoy + abono (copy + DoD) | `docs/comercial/rubros/specs/R3-03-fumi-ruta-abono.md` |
| 16 | **RUB-R1-06** | P1 | TODO | pair | Spec obras/changas: jornal + liquidar + hito cobro | `docs/comercial/rubros/specs/R1-06-obras-jornal.md` |
| 17 | **RUB-R4-01** | P1 | TODO | pair | Spec OT Field v0 (skin fumi → 3 oficios) | `docs/comercial/rubros/specs/R4-01-ot-field-v0.md` |
| 18 | **RUB-R5-01** | P2 | TODO | pair | Spec retail kg/balanza + farmacia lotes | `docs/comercial/rubros/specs/R5-01-retail-kg-lotes.md` |
| 19 | **RUB-QA-01** | P1 | TODO | gemini | Matriz QA por ola (casos PASS/FAIL) | `docs/qa/QA_RUBROS_REUTILIZACION.md` |
| 20 | **RUB-COM-01** | P1 | TODO | gemini | Script demo 15 min por caballo de calle | `docs/comercial/rubros/SCRIPT_DEMO_CABALLOS.md` |
| 21 | **RUB-COM-02** | P2 | TODO | gemini | Objeciones venta por rubro ★★★ | `docs/comercial/rubros/OBJECIONES_RUBROS_ALTO_TICKET.md` |
| 22 | **RUB-TRACK** | P1 | TODO | gemini | Tablero % actual→meta (actualizar post-olas) | `docs/comercial/rubros/TRACKER_PORCENTAJES.md` |
| 23 | **RUB-SEED-01** | P1 | TODO | gemini | Spec seeds mínimos 3 regs por nicho 🟠 | `docs/comercial/rubros/SEEDS_NICHOS_NARANJA.md` |
| 24 | **HUM-RUB-01** | P0 | TODO | human | Elegir 2–3 pilotos de pago (no almacén) | — |
| 25 | **HUM-RUB-02** | P1 | TODO | human | Precio packs alto-ticket (fumi, consorcio, prestamista, taller) | — |

**Al cerrar un ticket Gemini:** cambiá `TODO` → `DONE` en esta tabla (o listá DONE al final del entregable).

---

## 3. Tareas detalladas (pasos + resultado esperado)

---

### RUB-00 — Inventario maestro (sin faltar 1)

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/INVENTARIO_MAESTRO.md` |

**Pasos**

1. Leer `industry-templates.ts` y listar **todos** los `id` (industryId).
2. Leer `niche-apps-catalog.ts` y listar **todos** los `appId`.
3. Leer tipo `Rubro` en `onboarding-ia.ts` y listar valores sin template propio.
4. Incluir oficios radar (AC, electricista, gasista, plomería, piletero, jardinería, limpieza, ST, gomería, PT, tatuador).
5. Para cada fila: `% hoy` (usar §A de este doc si no hay medición nueva), `meta`, `tier` (bola), `motor`, `$` (★–★★★), `alias 🔵` si aplica.
6. Tabla única + checklist “cobertura 100%”.

**Resultado esperado (DoD)**

- [ ] ≥ 45 industryId listados  
- [ ] 22 appId nicho listados  
- [ ] Rubros onboarding extras listados  
- [ ] ≥ 10 oficios sin template  
- [ ] Ninguna fila sin motor o “N/A justificado”  
- [ ] Sección “huecos de catálogo” si encontrás id huérfano  

---

### RUB-01 — Matriz pricing × digitalización

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/MATRIZ_PRICING_DIGITALIZACION.md` |
| **Depende** | RUB-00 (puede arrancar en paralelo con borrador §A) |

**Pasos**

1. Ordenar rubros por `(poca digi del mercado × dolor × % Claver usable)`.
2. Top 15 con: ticket suscripción sugerido (bajo/medio/alto **relativo**, no $ legal), ancla vs upsell, promesa 1 línea.
3. Marcar cuáles son **ancla gratis** (fiado) vs **pago proceso**.
4. Advertencia compliance: prestamista ≠ banco/fintech.

**Resultado esperado**

- [ ] Top 15 priorizados  
- [ ] Columna “por qué paga más” en lenguaje de calle  
- [ ] Columna “motor a activar”  
- [ ] 3 anti-promesas (qué no decir)  

---

### RUB-02 — One-pager promesas vendedor

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/PROMESAS_VENDEDOR.md` |

**Pasos**

1. Por bola 🟢🟡🟠🔴⚫: texto de 2 frases para el vendedor.
2. Tabla pack PRD (`go-live-packs`) → “decir / no decir”.
3. Frases de cierre trial por fiado, prestamista, consorcios, fumi, gym.

**Resultado esperado**

- [ ] ≤ 2 páginas útiles en celular  
- [ ] Sin jerga de ingeniería  
- [ ] Alineado a `GO_LIVE_PRD.md`  

---

### RUB-R1-01 — Spec cuotas: Cobrar + WA + bolas

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | pair (Gemini spec → Grok code) |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R1-01-cuotas-cobrar-wa.md` |
| **Motor** | M-CUOTAS · copiar UX M-PRESTAMO/M-FIADO |
| **Rubros** | gimnasio, gimnasio_barrio, club_barrio, escuela_barrio, colonia_verano, pena_folklore, cooperativa_cuotas |
| **% meta** | 55–38 → **≥70** |

**Pasos Gemini**

1. Revisar UI actual membresías / nicho cuotas (solo lectura / descripción en docs si no podés código).
2. Escribir SPEC con plantilla §1.3.
3. Definir botones: `Cobrar cuota` (monto parcial), `WA moroso`, bola Al día/Vence hoy/Vencido.
4. Labels por appId (socio / alumno / colonista / peña).
5. DoD Grok: rutas, componentes a reusar (`CobrarDialog` patrón prestamos), tests sugeridos.
6. Happy path 90s por al menos gym + escuela.

**Resultado esperado**

- [ ] Spec completa plantilla §1.3  
- [ ] Tabla labels × appId  
- [ ] DoD Grok con archivos/rutas tentativas  
- [ ] Promesa OK/NO  
- [ ] Copy WA es-AR (2 plantillas)  

**Luego Grok:** implementar botones sin nuevo motor de cobro si se puede reusar CxC/membresías.

---

### RUB-R1-02 — Spec plancha

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R1-02-plancha-estados.md` |
| **Motor** | M-MOV |
| **% meta** | 45 → **70** |

**Pasos**

1. Estados: `recibido` → `en proceso` → `listo` → `entregado/cobrado` (bolas).
2. Botones: `Marcar listo`, `Cobrar retiro`, `WA listo`.
3. Buscar por teléfono / #ticket.
4. DoD Grok + seeds 3 tickets.

**Resultado esperado**

- [ ] Máquina de estados clara  
- [ ] Happy path: deja pantalón → listo → cobra  
- [ ] Sin WMS full  

---

### RUB-R1-03 — Spec taller OT

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R1-03-taller-ot.md` |
| **Motor** | M-MOV + stock básico |
| **% meta** | 40 → **68** |

**Pasos**

1. Estados OT: recibida / en taller / espera repuesto / lista / entregada.
2. Botones: avanzar estado, `WA listo`, `Cobrar`.
3. No taller industrial ni seguros.

**Resultado esperado**

- [ ] Spec + DoD Grok  
- [ ] Promesa NO: seguros / garantía fábrica  

---

### RUB-R1-04 — Spec feria cierre del día

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R1-04-feria-cierre.md` |
| **% meta** | 35 → **55** |

**Pasos:** botón `Cierre del día` (ventas + efectivo + cuota feria opcional); resumen 1 pantalla; WA opcional al organizador.

**Resultado esperado:** [ ] flujo 1-tap cierre [ ] números del día sin Excel  

---

### RUB-R1-05 — Spec remis + delivery cierre

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | **DONE** (spec Gemini 2026-08) |
| **Entregable** | `docs/comercial/rubros/specs/R1-05-remis-delivery-cierre.md` |
| **% meta** | 35 → **≥60** |

**Pasos:** liquidación chofer/repartidor (% o fijo); deudas; `Cerrar turno`; bolas viaje/turno.

**Resultado esperado:** [x] 1 liquidación ejemplo numérica [x] labels remis ≠ delivery  

**Siguiente:** Grok implementa DoD del spec · Gemini sigue con **RUB-R2-01** (P0) o **RUB-R1-06** (obras)  

---

### RUB-R1-06 — Spec obras / changas

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R1-06-obras-jornal.md` |
| **% meta** | 38–42 → **62** |

**Pasos:** jornal, adelanto, liquidar obrero, cobro hito cliente; reusa M-MOV + M-CXC.

**Resultado esperado:** [ ] no software de obra civil [ ] DoD Grok acotado  

---

### RUB-R2-01 — Spec cobrar turno (consultorio)

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R2-01-cobrar-turno.md` |
| **Motor** | M-AGENDA + M-POS/M-CXC |
| **% meta** | 52–55 → **≥68** |

**Pasos**

1. Desde turno `completado` / `atendido` → `Cobrar turno`.
2. Monto editable; medio efectivo/transfer.
3. WA recordatorio turno (opcional).
4. Sin obra social / nomenclador.

**Resultado esperado**

- [ ] Flujo agenda → cobro sin salir a Excel  
- [ ] Promesa NO: OS full  

---

### RUB-R2-02 — Spec peluquería unificar

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R2-02-peluqueria-unificar.md` |
| **% meta** | 40–48 → **70** |

**Pasos:** un solo golden path; eliminar confusión shell vs `/dashboard/peluqueria` vs agenda; cobro servicio.

**Resultado esperado:** [ ] path canónico escrito [ ] redirects definidos para Grok  

---

### RUB-R2-03 — Spec cancha reserva + seña

| Campo | Valor |
|-------|--------|
| **Pri** | P0 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R2-03-cancha-reserva-sena.md` |
| **Motor** | M-AGENDA + seña M-CXC |
| **% meta** | 32 → **70** |

**Pasos**

1. Recurso = cancha (1..N).
2. Reserva fecha/hora + seña monto + estado seña/pagado.
3. Botones: `Reservar`, `Cobrar seña`, `Cobrar saldo`, `WA confirmación`.
4. No fixture pro / federación.

**Resultado esperado**

- [ ] Grilla mental o wire en texto  
- [ ] Happy path 90s  
- [ ] $ alto justificado (caos WA hoy)  

---

### RUB-R2-04 — Spec vet cobrar consulta

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R2-04-vet-cobrar-consulta.md` |
| **% meta** | 52 → **65+** |

**Pasos:** botón en HC/ficha; cobro consulta + productos mostrador opcional; sin lab/portal tutor.

**Resultado esperado:** [ ] 1 botón primario definido [ ] DoD Grok  

---

### RUB-R3-01 — Playbook no romper verdes

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/PLAYBOOK_NO_ROMPER_VERDE.md` |

**Pasos:** checklist regresión fiado, prestamista casero, consorcios; qué no tocar; smoke post-deploy 10 ítems.

**Resultado esperado:** [ ] 10 smoke PASS/FAIL [ ] owners  

---

### RUB-R3-02 — Spec unificar garantía → inmo

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R3-02-inmo-unificar.md` |
| **% meta** | garantía 45 → **70** vía 🔵 |

**Resultado esperado:** [ ] redirectPath + copy [ ] no dos productos  

---

### RUB-R3-03 — Spec fumi ruta + abono

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R3-03-fumi-ruta-abono.md` |
| **% meta** | 60 → **75** |

**Pasos:** copy ruta del día; estados visita; abono mensual; promesa NO MSDS/SENASA full.

**Resultado esperado:** [ ] DoD Grok acotado [ ] script demo 5 min  

---

### RUB-R4-01 — Spec OT Field v0

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R4-01-ot-field-v0.md` |
| **Motor** | M-FUMI → M-OT-FIELD |
| **Oficios piloto** | AC, plomería, electricista |
| **% meta** | 15–20 → **55** |

**Pasos**

1. Modelo OT mínimo: cliente, dirección, ventana horaria, estado, cobro, WA.
2. Skin por oficio (labels + checklist 3 ítems).
3. Explicitar ⚫ hasta que Grok implemente motor.

**Resultado esperado**

- [ ] Un motor, 3 skins  
- [ ] No 3 productos distintos  
- [ ] Pricing ★★★ justificado  

---

### RUB-R5-01 — Spec retail kg + lotes farmacia

| Campo | Valor |
|-------|--------|
| **Pri** | P2 |
| **Assignee** | pair |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/specs/R5-01-retail-kg-lotes.md` |
| **Rubros** | carniceria, panaderia (peso), farmacia |

**Resultado esperado:** [ ] venta kg DoD [ ] alerta vencimiento lote simple [ ] sin ANMAT full  

---

### RUB-QA-01 — Matriz QA olas

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/qa/QA_RUBROS_REUTILIZACION.md` |
| **Depende** | specs R1/R2 en curso |

**Pasos:** ≥ 20 casos; formato `ID | rubro | pasos | esperado | PASS/FAIL`; mapeo a ticket RUB-*.

**Resultado esperado:** [ ] ≥20 casos [ ] listos para que Grok arme tests  

---

### RUB-COM-01 — Script demo caballos

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/SCRIPT_DEMO_CABALLOS.md` |

**Caballos:** fiado/almacén, prestamista, consorcios, plancha, club/gym (post R1).

**Resultado esperado:** [ ] guión timed 15 min [ ] wow moment por vertical  

---

### RUB-COM-02 — Objeciones alto ticket

| Campo | Valor |
|-------|--------|
| **Pri** | P2 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/OBJECIONES_RUBROS_ALTO_TICKET.md` |

**Resultado esperado:** [ ] ≥12 objeciones con respuesta es-AR  

---

### RUB-TRACK — Tracker de %

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/TRACKER_PORCENTAJES.md` |

**Pasos:** tabla `industryId | % | meta | ola | fecha | evidencia (link spec/PR)`.  
Actualizar cada vez que una ola cierra.

**Resultado esperado:** [ ] todos industryId del §A [ ] fórmula de % documentada  

**Fórmula:**

```text
% = 0.40*happy_path + 0.25*cobro_aviso + 0.20*estados_reales
  + 0.10*mobile_atajos + 0.05*seeds_demo
```

---

### RUB-SEED-01 — Seeds nichos 🟠

| Campo | Valor |
|-------|--------|
| **Pri** | P1 |
| **Assignee** | gemini |
| **Estado** | TODO |
| **Entregable** | `docs/comercial/rubros/SEEDS_NICHOS_NARANJA.md` |

**Pasos:** por cada industryId 🟠, 3 registros con nombres/montos creíbles es-AR; indicar archivo seed (`industry-demo-seeds.ts`) para Grok.

**Resultado esperado:** [ ] ≥ 12 nichos con 3 seeds [ ] sin datos fantasma en prod  

---

### HUM-RUB-01 / HUM-RUB-02 — Humanos

| ID | Qué decide el humano |
|----|----------------------|
| HUM-RUB-01 | 2–3 pilotos de pago reales (ideal: prestamista, fumi o consorcio, taller/plancha) |
| HUM-RUB-02 | Precio packs alto-ticket (no lo inventa el agente como contrato) |

Gemini puede proponer opciones en RUB-01; **no** cerrar precio.

---

## 4. Orden de olas (resumen para Gemini)

| Ola | Tickets | Meta de % |
|-----|---------|-----------|
| **Fundación** | RUB-00, RUB-01, RUB-02, RUB-TRACK | Base de plan |
| **R1** botones estilo libreta | R1-01…R1-06 | shells 🟠 → ~60–70 |
| **R2** agenda + cobro | R2-01…R2-04 | salud/servicios → ~65–70 |
| **R3** no romper + unificar | R3-01…R3-03 | verdes estables; fumi 75 |
| **R4** OT Field | R4-01 | oficios ⚫ → 🟡 55 |
| **R5** retail kg | R5-01 | carnicería/farmacia |
| **Comercial/QA** | QA-01, COM-01, COM-02, SEED-01 | venta + calidad |

---

## 5. Apéndice A — Inventario de referencia (scores 2026-08)

Usar como baseline en RUB-00 / RUB-TRACK. Ajustar solo con evidencia.

### A.1 Industry templates

| industryId | Label | % | Meta | Tier | Motor | $ |
|------------|-------|--:|-----:|------|-------|:-:|
| almacen | Almacén de barrio | 88 | 92 | 🟢 | M-FIADO+M-POS | ★★ |
| kiosco | Kiosco | 86 | 90 | 🟢 | M-FIADO+M-POS | ★★ |
| ferreteria | Corralón / Ferretería | 78 | 85 | 🟢 | M-POS+M-CXC | ★★ |
| carniceria | Carnicería | 58 | 72 | 🟡 | M-POS | ★★ |
| panaderia | Panadería | 70 | 82 | 🟡 | M-FIADO+M-POS | ★★ |
| supermercado | Supermercado | 55 | 68 | 🟠 | M-POS | ★★ |
| feria_puesto | Feria | 35 | 55 | 🟠 | M-MOV | ★★ |
| otro | Otro comercio | 50 | 60 | 🟠 | M-POS | ★ |
| veterinaria | Veterinaria | 52 | 68 | 🟡 | M-HC+AGENDA+POS | ★★★ |
| vet_barrio | Vet barrio | 52 | 68 | 🟡 | 🔵 veterinaria | ★★★ |
| clinica | Clínica | 52 | 65 | 🟡 | M-AGENDA+HC | ★★★ |
| consultorio_solo | Consultorio | 55 | 70 | 🟡 | M-AGENDA | ★★★ |
| farmacia | Farmacia | 48 | 62 | 🟠 | M-POS | ★★ |
| gimnasio | Gimnasio | 58 | 75 | 🟢* | M-CUOTAS | ★★★ |
| gimnasio_barrio | Gym barrio | 55 | 75 | 🟢* | 🔵 gym | ★★★ |
| salon_belleza | Salón / Barbería | 48 | 70 | 🟠 | M-AGENDA | ★★ |
| peluqueria_barrio | Peluquería | 40 | 70 | 🟠 | M-AGENDA | ★★ |
| freelance_mt | Monotributo | 72 | 82 | 🟢 | M-PRESUP | ★★ |
| servicios_pro | Servicios pro | 68 | 78 | 🟢 | M-AGENDA+PRESUP | ★★ |
| fumigacion | Fumigación | 60 | 75 | 🟡 | M-FUMI | ★★★ |
| club_barrio | Club | 55 | 72 | 🟢* | M-CUOTAS | ★★★ |
| tintoreria | Plancha/tintorería | 45 | 70 | 🟠 | M-MOV | ★★★ |
| cooperativa_cuotas | Mutuo | 38 | 65 | 🟠 | M-CUOTAS | ★★ |
| escuela_barrio | Escuela | 38 | 65 | 🟠 | M-CUOTAS | ★★★ |
| cancha_barrio | Cancha | 32 | 70 | 🟠 | M-AGENDA | ★★★ |
| colonia_verano | Colonia | 35 | 62 | 🟠 | M-CUOTAS | ★★★ |
| salon_eventos | Salón eventos | 38 | 65 | 🟠 | M-MOV+CXC | ★★★ |
| pena_folklore | Peña | 35 | 60 | 🟠 | M-CUOTAS | ★★ |
| bar_restaurant | Gastronomía | 48 | 65 | 🟡 | M-HOSP | ★★ |
| estacion_servicio | Estación servicio | 40 | 58 | 🟠 | M-CXC+POS | ★★ |
| distribuidora | Distribuidora | 50 | 68 | 🟡 | M-PICK | ★★★ |
| base_remis | Remis | 35 | 60 | 🟠 | M-MOV | ★★★ |
| delivery_barrio | Delivery | 35 | 58 | 🟠 | M-MOV | ★★ |
| agro_acopio | Acopio campo | 38 | 55 | 🟠 | M-AGRO | ★★★ |
| acopio_grano | Acopio productor | 35 | 55 | 🟠 | M-MOV+AGRO | ★★★ |
| agro_cannabis | Cultivo regulado | 30 | 45 | 🟠 | M-AGRO | ★★ |
| prestamista | Prestamista casero | 88 | 92 | 🟡 | M-PRESTAMO | ★★★ |
| contratista_obra | Contratista | 42 | 62 | 🟠 | M-MOV+CXC | ★★★ |
| obra_changas | Changas | 38 | 62 | 🟠 | 🔵 obras | ★★★ |
| inmobiliaria | Inmobiliaria | 72 | 80 | 🟡 | M-CONSORCIO+INMO | ★★★ |
| consorcios_admin | Consorcios | 82 | 88 | 🟡 | M-CONSORCIO | ★★★ |
| inmo_garantia | Garantías | 45 | 70 | 🟠 | M-INMO | ★★ |
| taller_mecanico | Taller | 40 | 68 | 🟡 | M-MOV | ★★★ |
| concesionaria | Concesionaria | 28 | 45 | 🔴 | shell | ★★ |
| quimica | Química | 32 | 45 | 🔴 | M-INDUSTRIA | ★ |

\* Pack en go-live PRD con profundidad media.

### A.2 Rubro onboarding sin template propio

| Rubro | % | Meta | Tier | Motor | $ |
|-------|--:|-----:|------|-------|:-:|
| libreria | 45 | 62 | 🟠 | M-POS | ★ |
| ropa | 48 | 65 | 🟠 | M-POS | ★★ |
| importador | 25 | 40 | 🔴 | M-POS+CxP | ★★ |
| reventa_tendencias | 30 | 50 | 🟠 | M-POS | ★ |
| textil_fabrica | 28 | 42 | 🔴 | M-INDUSTRIA | ★ |
| canchas | 32 | 70 | 🟠 | = cancha_barrio | ★★★ |
| servicios | 68 | 78 | 🟢 | M-AGENDA | ★★ |

### A.3 Niche appId

| appId | Engine | % | Meta | Botones clave |
|-------|--------|--:|-----:|---------------|
| consorcios | consorcio | 82 | 88 | liquidar, morosos WA |
| club | cuotas | 55 | 72 | cobrar cuota |
| feria | mov | 35 | 55 | cierre día |
| prestamista | libreta/préstamo | 88 | 92 | ya casero |
| obras | mov | 38 | 62 | liquidar obrero |
| acopio | mov | 35 | 55 | liquidar kg |
| remis | mov | 35 | 60 | cierre chofer |
| plancha | mov | 45 | 70 | listo→cobrar |
| consultorio | agenda | 55 | 70 | cobrar turno |
| garantia | inmo | 45 | 70 | unificar |
| mutuo | cuotas | 38 | 65 | cobro aporte |
| escuela | cuotas | 38 | 65 | labels alumno |
| cancha | agenda | 32 | 70 | reserva+seña |
| taller | mov | 40 | 68 | estados OT |
| fumigacion | fumi | 60 | 75 | ruta hoy |
| delivery | mov | 35 | 58 | cierre turno |
| peluqueria | agenda | 40 | 70 | unificar path |
| gimnasio | cuotas | 55 | 75 | cobrar fila |
| colonia | cuotas | 35 | 62 | labels |
| salon | mov | 38 | 65 | seña+saldo |
| veterinaria | HC | 52 | 68 | cobrar consulta |
| pena | cuotas | 35 | 60 | cuota peña |

### A.4 Oficios sin template (⚫ hasta R4)

| Vertical | % | $ | Motor futuro |
|----------|--:|:-:|--------------|
| AC / clima | 20 | ★★★ | M-OT-FIELD |
| Electricista | 18 | ★★★ | M-OT-FIELD |
| Gasista | 18 | ★★★ | M-OT-FIELD |
| Plomería | 18 | ★★★ | M-OT-FIELD |
| Piletero | 15 | ★★ | M-OT-FIELD |
| Jardinería | 15 | ★★ | M-OT-FIELD |
| Limpieza empresas | 22 | ★★★ | agenda+CxC |
| ST celulares | 25 | ★★ | M-MOV |
| Gomería | 25 | ★★ | M-MOV+POS |
| PT / nutricionista | 40 | ★★ | agenda+packs |
| Tatuador | 30 | ★★ | agenda+seña |

### A.5 Top $ (menos digitalizados)

1. Prestamista casero · 2. Fumigación · 3. Consorcios · 4. Taller · 5. Plancha · 6. Cancha · 7. Remis · 8. Obras · 9. Escuela/colonia · 10. Vet/consultorio · 11. Gym/club · 12. Oficios field · 13. Fiado (ancla) · 14. Distribuidora  

---

## 6. Botones transversales (checklist en cada spec pair)

| # | Control | ¿Obligatorio en lista de dominio? |
|---|---------|-----------------------------------|
| 1 | Buscar | Sí |
| 2 | Bola de estado | Sí |
| 3 | Cobrar (monto, parcial OK) | Si hay plata |
| 4 | WA recordatorio | Si hay teléfono |
| 5 | WA recibo post-cobro | Post cobro |
| 6 | Historial | Ideal |
| 7 | Hoy / ruta | Si hay visitas o vencimientos |
| 8 | Nuevo alta | Sí |
| 9 | Seña | Si hay reserva/evento |
| 10 | PDF/print | Solo si el oficio lo usa |

---

## 7. Cierre de sesión Gemini (plantilla)

```markdown
## Sesión Gemini — {fecha}
### Tickets DONE
- ID — path entregable
### Tickets BLOCKED
- ID — motivo — pregunta a humano/Grok
### Para Grok (pair)
1. …
### Actualizar
- [ ] Tabla §2 estados TODO→DONE
- [ ] RUB-TRACK si cambió un %
```

---

## 8. Mensaje final al agente

1. **Un ticket a la vez.**  
2. **Entregable en el path exacto.**  
3. **DoD con checkboxes evaluables.**  
4. **Reuso > feature nueva.**  
5. **Calle es-AR, sin humo fintech.**  

*Fin del prompt ejecutable. Apéndice A = baseline; la verdad operativa sale de los entregables + implementación Grok.*

# PROMPT GEMINI — Cerrar todo lo que te toca (docs / copy / playbooks)

> Pegá **esta sección “PROMPT”** (desde el bloque hasta “FIN PROMPT”) en Gemini.  
> El resto del archivo es el contrato de entregables.  
> Owner: **gemini** (solo `docs/**` + Markdown). Código = Grok. Precio/piloto/legal = humano.

---

## PROMPT (copiar desde acá)

```text
Sos Gemini en el monorepo Claver (ERP/POS Argentina).

MISIÓN: terminar TODO el trabajo de documentación, copy y playbooks para que el CORE sea vendible y honesto. No el catálogo de 40 nichos. No empleados digitales como producto.

CORE (prioridad): POS, fiado, caja, stock, factura AFIP, menú que no miente, demo por rubro, trial, cobro Claver, implementación, UAT, soporte.
EXTRA (después o no): Leo, Sofía, Ramiro, n8n, IoT, “empleados digitales”.

REGLAS DURAS
1. Solo escribís/editás archivos .md (y .csv si hace falta) bajo docs/. Cero lib/, app/, prisma/.
2. No inventés features. Si el código no lo hace, bajá el copy o marcá “Grok debe cablear”.
3. es-AR, tono claro/confiable/operativo. Sin hype Silicon Valley. Montos ARS, fechas dd/mm/yyyy.
4. Fuente de verdad comercial: docs/GO_LIVE_PRD.md §3.1 (qué se vende) y §3.3 (qué NO).
5. Gaps y orden: ENLISTA.md (repo root). Empleados = add-on §6, no el norte.
6. No prometas: corte m²/voz en ferretería, cobro automático de seña oficios, torniquete gym, HIS, WMS, “empleados que laburan solos”, AFIP self-serve mágico.
7. Cada archivo: título, fecha 2026-08-25, “estado”, “para quién”, tablas, DoD al pie.
8. Al terminar CADA entregable, no pases al siguiente sin el archivo guardado en el path indicado.
9. Si un MD ya existe, actualizalo (no dupliques con otro nombre).
10. Al final de la sesión: lista de paths creados/editados + 5 bullets de “Grok tiene que codear” + 5 de “humano decide”.

LEÉ ANTES (en este orden, no hace falta más):
- ENLISTA.md
- docs/GO_LIVE_PRD.md
- docs/PRODUCTO_VENDIBLE_END_TO_END.md
- docs/qa/GAPS_PENDIENTES.md
- docs/engineering/ASSIGNMENT.md
- docs/comercial/puertas/MATRIZ_PUERTAS.md
- docs/DESIGN.md (tono; no rediseñes)

EJECUTÁ LAS OLAS 1→4 EN ORDEN. Ola 5 (Leo/empleados) SOLO si las 1–4 están entregadas.
Los paths y DoD están en docs/engineering/PROMPT_GEMINI_CERRAR_TODO.md a partir de “ENTREGABLES”.
Seguí esa lista. No agregues landings US, TikTok, consorcios, fumigación como producto.

Empezá por Ola 1 entregable G-01.
```

## FIN PROMPT

---

## Contexto para el humano que pega esto

| Vos | Gemini | Grok |
|-----|--------|------|
| Precio, piloto, ToS, ads plata | Este prompt | Código (POS, fiado, AFIP, menú) |
| No le pidas a Gemini `lib/` | No le pidas 47 verticales | No le pidas one-pagers |

Cuando Gemini termine, Grok agarra la sección **“Lista Grok”** del reporte final.

---

## ENTREGABLES

Formato de cada MD:

```markdown
# Título
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** vendedor | implementador | soporte | grok  
**Estado:** draft | listo  
**Fuentes:** (paths)
```

---

### Ola 1 — Honestidad (el copy no puede mentir)

El producto épico empieza por **no vender lo que no está**.

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **G-01** | `docs/comercial/PROMESAS_VS_REALIDAD.md` | Tabla pack PRD §3.1 × “copy actual” × “qué hace el código” × “promesa OK / bajar”. Incluir ferretería (no corte/voz), oficios (no seña MP auto), gym (no torniquete), stock (badge beta), freelance (enviar presupuesto = estado, no mail). | ≥8 packs. Columna “acción Gemini” vs “acción Grok”. |
| **G-02** | `docs/comercial/puertas/MATRIZ_PUERTAS.md` | Actualizar columna “Existe hoy” / menú aislado vs código (oficios ya tiene `skuKey` niche.oficios). Fumigación alineada a GO_LIVE_PRD §3.3 **no vender**. | Cero “Sí (aislado)” donde el menú es global. Fecha hoy. |
| **G-03** | `docs/comercial/rubros/PROMESAS_VENDEDOR.md` | Battle card de **calle**: kiosco/fiado, POS, ferretería honesta. 1 página por pack PRD. Qué NO decir. | 5 battle cards. Sin Leo como héroe (nota al pie: add-on cobranza). |
| **G-04** | `docs/comercial/puertas/COPY_STOCK.md` y `COPY_CADENA_POS.md` si prometen WMS/cadena mágica | Badge **beta** / “con implementador”. CTA cadena = llamada + horas, no trial 1 caja. | Copy no dice “listo 100%”. |
| **G-05** | `docs/qa/GAPS_PENDIENTES.md` §8 contradicciones | Resolver en texto las 5 contradicciones (fumigación PRD vs packs, oficios 85% vs demo, matriz, FALTANTES fecha, grow URLs). | Sección “resuelto en docs (Gemini)” vs “queda Grok”. |

**No en Ola 1:** nuevas landings, skins oficio extra, US.

---

### Ola 2 — Venta del CORE (el vendedor sale a la calle)

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **G-06** | `docs/comercial/ONE_PAGER_KIOSCO_FIADO.md` | One-pager **core**: dolor (fiado en cuaderno) → POS+libreta → demo 60s → ancla/trial → precio placeholder `[HUM-01]` → 3 objeciones. | Listo para WhatsApp. CTA `/demo/almacen` o `/login?activar=pos.fiado_barrio`. |
| **G-07** | `docs/comercial/ONE_PAGER_POS_AFIP.md` | Idem mostrador + factura. Promesa NO: AFIP en 5 minutos sin cert. | CTA demo + “implementador para AFIP prod”. |
| **G-08** | `docs/comercial/SCRIPT_DEMO_15.md` | Guión **15 min timed**: 0–2 rapport, 2–6 POS ticket, 6–10 fiado+WA, 10–13 caja, 13–15 cierre trial. **Sin bloque Leo** (una línea: “si cobrás fiado a 40, después hay avisos”). | Tiempos por bloque. es-AR callejero. Ticket `COM-03`. |
| **G-09** | `docs/comercial/OBJECIONES_VENTA.md` | Releer el existente: el héroe es Claver POS/fiado, no Leo. 12 objeciones kiosco (precio, Excel, AFIP, internet, “mi hijo lo hace”). Leo = 2 objeciones al final, pack extra. | Ticket `COM-02` actualizado. |
| **G-10** | `docs/comercial/PACKAGING_CORE.md` | Tabla: ancla fiado / POS / ferretería / freelance / gym / cobranza-WA-add-on. Columnas: SKU, incluye, no incluye, trial, setup, upsell. Precio = `[HUM-01]`. | Ticket `COM-04` pero **core first**, Leo una fila add-on. |
| **G-11** | `docs/comercial/PIPELINE_HANDOFF.md` | Lead → demo → trial → pago → proyecto Cloud → UAT → go-live. Estados, campos, quién (vendedor/analista/humano). Gaps de API listados para Grok. | Ticket `COM-05`. Diagrama mermaid. |

---

### Ola 3 — Onboarding, implementación, go-live

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **G-12** | `docs/comercial/TRIAL_SEQUENCE_CORE.md` | Email + WA corto D0, D2, D5, D7 para trial **kiosco/fiado**. CTA dashboard POS/fiado. | Ticket espíritu `ONB-01` pero core, no Leo. |
| **G-13** | `docs/funcional/CHECKLIST_ACTIVACION_TRIAL.md` | Pasos dueño: 1 caja, 10 productos, 3 clientes, 1 fiado, 1 cierre. | Ticket `ONB-02`. Lista numerada. |
| **G-14** | `docs/claver-cloud/runbooks/IMPL_KIOSCO_FIADO.md` | Runbook analista CCA: 4h/1d. Prereqs env, AFIP homolog, MP, usuarios cajero, UAT. Rollback. | Ticket `IMP-01` recableado al pack PRD, no Leo. |
| **G-15** | `docs/claver-cloud/UAT_CHECKLIST.md` | 15 ítems PASS/FAIL: POS venta, fiado, caja, stock, factura/ticket, usuario cajero, backup/export. Severidad. Evidencia. | Ticket `IMP-03`. |
| **G-16** | `docs/deploy/GO_LIVE_D0.md` | Primeras 24h prod: qué mirar (errores, caja, AFIP, WA cola). | Ticket `GL-02`. |
| **G-17** | `docs/deploy/MATRIZ_ENV_POR_PACK.md` | Tabla env Vercel × pack (fiado, POS, AFIP, MP, Twilio opcional). “Obligatorio / si prometés WA”. | Ticket `GL-01` parte Gemini. |

---

### Ola 4 — Postventa y soporte (para no abandonar al que pagó)

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **G-18** | `docs/marketplace/POSTVENTA_CORE.md` | Cadencias D+1 D+7 D+30: trial sin uso, trial sin pago, pagando sin POS, upsell cobranza-WA. | Ticket `PV-01` core. |
| **G-19** | `docs/soporte/MACROS_L1.md` | Árbol L1: no imprime, no abre caja, CAE error, fiado no suma, no entra Google, “no veo oficios” (está bien). Macro + logs a pedir + cuándo escalar a Grok. | Ticket `PV-03`. |
| **G-20** | `docs/comercial/QBR_MENSUAL_DUENO.md` | Plantilla: ventas, tickets, fiado cobrado, faltantes stock, CAE. Sin “Leo recuperó $X” como métrica principal. | Ticket `PV-04` copy. |
| **G-21** | `docs/qa/QA_CORE_MATRIX.md` | ≥15 casos para Grok/Vitest/e2e: login, POS, fiado, caja, stock OC, menú kiosco ≠ oficios, preview actor. | Ticket espíritu `QA-01` core. |

---

### Ola 5 — Extra (solo si 1–4 listos)

No bloquea “Gemini terminó el core”.

| ID | Archivo | Nota |
|----|---------|------|
| **G-22** | Ya existe `docs/comercial/LEO_ONE_PAGER.md` | Revisar: “add-on, requiere fiado/CxC + WhatsApp”. No venderlo como el ERP. |
| **G-23** | `docs/funcional/LEO_MANUAL_USUARIO.md` | Solo si hay piloto que pague el SKU. |
| **G-24** | Specs Sofía/Ramiro | **No.** El humano dijo empleados ≠ core. |

---

## Lista Grok (Gemini la rellena al final, no la codea)

Al cerrar, Gemini copia esto al reporte y lo deja para Grok:

```markdown
## Grok debe codear (máx 10, del core)
1. …
```

Semilla (ENLISTA, no empleados):

1. Presupuesto “Enviar” = PDF/WA o bajar copy.  
2. Seña oficios = movimiento de caja o bajar “cobro automático”.  
3. Fracción POS **o** Gemini ya bajó ferretería (G-01).  
4. Imputación MP + tope fiado.  
5. Arqueo ciego.  
6. CAE pendiente visible en mostrador.  
7. `?activar=` en CTAs de landings que falten.  
8. Nav 404 reventas/industria si sigue en matriz.

---

## Humano (Gemini no decide)

| ID | Pregunta | Gemini hace |
|----|----------|-------------|
| HUM-01 | Precio de lista | Deja `[HUM-01]` en one-pagers |
| HUM-02 | 1 piloto kiosco+POS+fiado | Criterios en G-14 |
| — | ToS / privacidad | No redactar contrato legal de cero; 1 página “qué falta firmar” si hace falta |
| — | ¿Se vende cobranza WA? | Ola 5 opcional |

---

## Definición de “Gemini terminó todo”

- [ ] Ola 1: el vendedor no puede leer un MD que prometa corte/seña-auto/torniquete/WMS.  
- [ ] Ola 2: hay one-pager kiosco, POS, script 15 min, objeciones, packaging, pipeline.  
- [ ] Ola 3: trial sequence, checklist dueño, runbook CCA, UAT 15, D0, matriz env.  
- [ ] Ola 4: postventa, macros L1, QBR, matriz QA core.  
- [ ] Reporte final con paths + lista Grok + lista humano.  
- [ ] Ola 5 **no** es obligatoria.

Eso es “todo” lo de Gemini para que el **core** se pueda vender e implementar. El resto es código (Grok) o plata (humano).

---

## Cómo reportar al final de la sesión

```markdown
# Reporte Gemini — fecha
## Archivos
- path — 1 línea
## No toqué (a propósito)
- empleados / US / TikTok / …
## Grok
- …
## Humano
- …
## Bloqueado
- …
```

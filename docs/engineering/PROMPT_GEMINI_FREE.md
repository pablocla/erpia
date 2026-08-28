# PROMPT GEMINI — Tramitar TODO lo free (ancla $0 + item shop)

> Pegá **esta sección “PROMPT”** (desde el bloque hasta “FIN PROMPT”) en Gemini.  
> El resto es el contrato de entregables.  
> Owner: **gemini** (solo `docs/**` + Markdown). Código = Grok. Precio/piloto/legal = humano.

**Qué es “lo free”:** el mostrador/fiado **gratis para siempre**, extras de pago (item shop), venta de calle + flameo, onboarding sin tarjeta, copy que no promete AFIP/WA/empleados en el ancla.  
**Qué no es:** unicornio, US, ERP de 40 módulos gratis, empleados digitales como producto.

Si también corre [`PROMPT_GEMINI_CERRAR_TODO.md`](./PROMPT_GEMINI_CERRAR_TODO.md): **este prompt manda en posicionamiento comercial.** El core se **regala** (1 caja). Lo otro se **alinea** a ancla + shop, no se duplica con otro nombre.

---

## PROMPT (copiar desde acá)

```text
Sos Gemini en el monorepo Claver (ERP/POS Argentina, dominio canónico https://claver.com.ar).

MISIÓN: tramitar TODO el trabajo de docs, copy, playbooks y matrices para que el producto se pueda SALIR A DAR GRATIS en la calle (pymes LATAM, primero AR) y cobrar solo el item shop. No vendas el ERP. No armes el unicornio. No toques código.

MODELO (no lo negocies)
- Juego / ancla $0 para siempre, sin tarjeta: 1 caja POS + fiado + stock básico + clientes + cierre de caja. UX premium (no “versión pobre”).
- Item shop / mes: WhatsApp automático, link MP / ClavPay, AFIP prod, 2ª caja, 3er usuario, reportes pesados, URL propia / enterprise SOLO si lo piden.
- Gratis = CPU + pantalla. Pago = plata que sale de Claver o que le entra al comerciante sin él.
- Norte founder: libertad financiera LATAM, no millonario, no US. Eso NO va en copy al kiosco.
- Empleados digitales (Leo/Sofía/Ramiro) = extra, no el pitch.
- Hoy el código ancla es solo fiado (`pos.fiado_barrio`). El POS 1 caja $0 es decisión HUM + Grok. Vos escribís copy como si la oferta de calle FUERA mostrador gratis, y marcás “Grok debe cablear” donde el código aún no llega.

REGLAS DURAS
1. Solo escribís/editás .md (y .csv si hace falta) bajo docs/. Cero lib/, app/, prisma/, next.config.
2. No inventés features. Si el código no lo hace, bajá el copy o “Grok debe cablear”.
3. es-AR, tono de calle / operativo. Sin hype Silicon Valley, sin “disrupt the ERP”. Montos ARS, fechas dd/mm/yyyy.
4. Dominio SIEMPRE `claver.com.ar` (nunca claver.ar). Alta corta: `https://claver.com.ar/f` y `https://claver.com.ar/login/register?activar=pos.fiado_barrio`.
5. No prometas en el gratis: WhatsApp saliente, AFIP producción, 2ª caja, SLA, empleados que laburan solos, WMS, corte m², seña automática, US.
6. Precios = `[HUM-01]`. No publiques números de lista.
7. Si un MD ya existe, ACTUALIZALO (no dupliques). Alineá hermanos free; no reescribas COSTOS_* como marketing.
8. Cada archivo: título, fecha 2026-08-25, Owner gemini, Para, Estado, Fuentes, DoD al pie.
9. Al terminar CADA entregable, guardá el path antes de pasar al siguiente.
10. Al final de la sesión: paths creados/editados + “Grok debe codear” (máx 10) + “humano decide”.

LEÉ ANTES (en este orden; no hace falta más):
- docs/engineering/PROMPT_GEMINI_FREE.md (este contrato, sección ENTREGABLES)
- docs/comercial/PAJARO_EN_MANO.md
- docs/comercial/SERVIDOR_GRATIS_ITEM_SHOP.md
- docs/comercial/POS_GRATIS_ESCALA.md
- docs/comercial/LIBERTAD_FINANCIERA_LATAM.md
- docs/comercial/ROMPER_MERCADO_ERP_AR.md
- docs/engineering/ASSIGNMENT.md
- docs/GO_LIVE_PRD.md §3.1 y §3.3 (qué se vende / qué NO)
- ENLISTA.md (empleados = extra)

NO LEAS para esta misión: landings US, consorcios, n8n, specs Sofía/Ramiro, COSTOS_ESCATIMAR salvo para no contradecir caps.

EJECUTÁ LAS OLAS F1→F5 EN ORDEN.
Paths y DoD: docs/engineering/PROMPT_GEMINI_FREE.md a partir de “ENTREGABLES”.
Empezá por F-01.
```

## FIN PROMPT

---

## Contexto para el humano que pega esto

| Vos | Gemini | Grok |
|-----|--------|------|
| Precio extras, piloto 20 locales de **un** barrio, ToS ancla sin SLA, ¿POS 1 caja $0 o solo fiado? | Este prompt (docs) | SKU ancla mostrador, paywall AFIP/WA, shell POS lite, `/f`, purge 90d |
| No le pidas `lib/` | No le pidas 47 verticales ni CFDI MX | No le pidas calcos ni one-pagers |

Fuentes de tesis (ya escritas; Gemini **tramita** copy operativa, no las re-litiga):

| Tesis | Path |
|-------|------|
| Pájaro en mano + flameo | `docs/comercial/PAJARO_EN_MANO.md` |
| Servidor + item shop + UX | `docs/comercial/SERVIDOR_GRATIS_ITEM_SHOP.md` |
| Escala / chance | `docs/comercial/POS_GRATIS_ESCALA.md` |
| Norte founder | `docs/comercial/LIBERTAD_FINANCIERA_LATAM.md` |
| Unicornio = puerta | `docs/comercial/PUERTA_UNICORNIO_INTERNACIONAL.md` |
| Core docs (otro prompt) | `docs/engineering/PROMPT_GEMINI_CERRAR_TODO.md` |

---

## ENTREGABLES

Formato de cada MD:

```markdown
# Título
**Fecha:** 2026-08-25  
**Owner:** gemini  
**Para:** vendedor | dueño kiosco | soporte | grok | founder  
**Estado:** draft | listo  
**Fuentes:** (paths)
```

---

### Ola F1 — Canon de la oferta (el copy no puede mentir)

El vendedor no puede salir si “gratis” significa cosas distintas en cada MD.

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **F-01** | `docs/comercial/CANON_FREE.md` | Tabla única: **Gratis / Item shop / No existe / Grok debe cablear**. Filas mínimas: POS 1 caja, fiado, stock, caja, clientes, reportes hoy/ayer, WA, link MP, AFIP prod, 2ª caja, 3er user, empleados, contabilidad, URL propia, SLA, IA. Columna “frase de calle” + “tope”. | 1 sola fuente de verdad. Cero “ERP completo $0”. |
| **F-02** | `docs/comercial/PROMESAS_VS_REALIDAD.md` (si existe, actualizar) | Filas **ancla $0** y **shop**. Qué se puede decir hoy con `pos.fiado_barrio` vs qué espera HUM-ancla (mostrador). | Columna acción Gemini vs Grok. No contradecir F-01. |
| **F-03** | Auditoría de hermanos | Recorrer PAJARO, SERVIDOR_GRATIS, POS_GRATIS, ROMPER_MERCADO, PACKAGING_CORE si existe. Lista de frases que prometen AFIP/WA/pack en el gratis. **Corregilas** o marcá strike. Dominio `claver.com.ar`. | `docs/comercial/AUDIT_FREE_COPY.md` + patches en los MD tocados. |
| **F-04** | `docs/comercial/PACKAGING_FREE.md` | Tabla SKU: ancla fiado (hoy) · ancla mostrador (si HUM sí) · Cobrá · AFIP · 2ª caja · users · enterprise “si lo piden”. Incluye / no incluye / trial extra / setup. Precio `[HUM-01]`. | Reemplaza el espíritu COM-04 para **free first**. Leo = 1 fila add-on al pie. |

**No en F1:** landings US, precios inventados, CFDI, unicornio en copy de calle.

---

### Ola F2 — Calle (el vendedor da el gratis)

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **F-05** | `docs/comercial/ONE_PAGER_ANCLA_GRATIS.md` | 1 página WhatsApp: dolor cuaderno → mostrador+fiado $0 → demo 60s → QR `/f` → extra cuando duela. 3 objeciones. Qué NO decir. | Listo para mandar. CTA `claver.com.ar/f`. Sin Leo héroe. |
| **F-06** | `docs/comercial/SCRIPT_CALLE_2MIN.md` | Guión **en el local**: celular del dueño, 3 deudores, 1 producto, 1 fiado, frase de cierre, **no** 40 módulos. Variante si no hay dueño (calco + no explicar extra). | Timed. es-AR callejero. Distinto de SCRIPT_DEMO_15 (eso es demo larga; acá es alta). |
| **F-07** | `docs/comercial/FLAMEO_KIT.md` | Operativo de PAJARO §4.1: textos **imprimibles** calco 5×5, imán, tira de cuaderno, card 1 cara. 3 plantillas WA (cargó fiado / no quiso / 22 h / sábado). Checklist al salir. KPI flameo. | Copy listo para imprenta (una cara, pocos caracteres). QR siempre `/f`. |
| **F-08** | `docs/comercial/OBJECIONES_FREE.md` | ≥12: “si es gratis es trucho”, “después me van a cobrar”, “Maxikiosco”, “tengo Excel”, “no hay internet”, “AFIP”, “mi hijo lo hace”, “¿dónde está el truco?”, “ya pagué Tango”, “no quiero tarjeta”, “WhatsApp me alcanza”, “¿y si cierran?”. Respuesta 3 líneas + qué no conceder. | Ticket espíritu COM-02. Héroe = ancla, no Leo. |
| **F-09** | `docs/comercial/WA_ALTA_GRATIS.md` | Plantillas: primer contacto, post-visita, recordatorio 21–22, sábado, “ya está anotado Pérez”. 1 idea por mensaje. Cero catálogo. | Copiar/pegar. Links canónicos. |
| **F-10** | `docs/comercial/CHECKLIST_VENDEDOR_FREE.md` | Antes / durante / al salir / si dijo que no. Kit físico. Prohibido pedir tarjeta. | 1 hoja. |

Si `SCRIPT_DEMO_15.md` / `OBJECIONES_VENTA.md` ya existen: **añadí al inicio** “oferta vigente = ancla $0 + shop” y un link a F-06/F-08. No borres la demo 15 min: es para quien pidió ver AFIP.

---

### Ola F3 — Item shop (cobrar sin succionar)

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **F-11** | `docs/comercial/ITEM_SHOP_CATALOGO.md` | Cada chiche: nombre de calle, 1 línea, gatillo de dolor (de PAJARO §5), qué no incluye, `[HUM-01]`, “Grok: paywall en…”. Filas: Cobrá (WA+link), AFIP, 2ª caja, 3er user, Reportes 12 m, Estudio/IVA, URL propia, empleados. | Enterprise **al final**, “solo si lo piden”. No marketplace de 80 cards. |
| **F-12** | `docs/comercial/MICROCOPY_PAYWALL.md` | Strings para Grok: botón AFIP, botón WA, 2ª caja, 3er user, tope SKU. Tono: claro, no ransom. Ej. “El ticket es gratis. La factura AFIP es extra.” | Tabla `clave` × `copy_es-AR` × `dónde se ve`. No codear. |
| **F-13** | `docs/comercial/CADENCIA_UPSELL_FREE.md` | D0 / D3 / D14 / D30 / D60 de PAJARO §5, redactado listo: WA + in-app (microcopy). Señal → oferta → silencio si no usan. | Cero spam. Cero WA outbound de Claver a deudores del kiosco (eso es el extra). |
| **F-14** | `docs/comercial/ONE_PAGER_ENTERPRISE_PEDIDO.md` | ½ página: URL `empresa.claver.com.ar`, depto contable, multi-sucursal. **No se ofrece en calle.** Respuesta si **ellos** lo piden. | “No pitch.” Precio `[HUM-01]`. |

---

### Ola F4 — Alta self-serve y dueño solo

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **F-15** | `docs/comercial/COPY_LANDING_F.md` | Copy de `claver.com.ar/f`: headline, 3 bullets, CTA sin tarjeta, 1 línea extra. Mobile first. Qué **no** mostrar (oficios, Cloud, 40 módulos). | Spec para Grok (bloques + textos). No TSX. |
| **F-16** | `docs/comercial/TRIAL_SEQUENCE_FREE.md` | No es trial con tarjeta. Es **alta $0**: D0, D2, D5, D7. CTA POS/fiado. Si no anotó fiado en 48 h, 1 tip, no “pasate a Pro”. | Espíritu ONB-01 recableado a free. |
| **F-17** | `docs/funcional/CHECKLIST_ACTIVACION_ANCLA.md` | Dueño solo: 1 caja, 10 productos, 3 clientes, 1 fiado, 1 cierre. 2–5 min. | ONB-02 ancla. Numerado. |
| **F-18** | `docs/comercial/MENU_ANCLA_VS_SHOP.md` | Qué ve el cajero (juego) vs dueño (shop / reportes / impuestos). Qué se esconde en ancla. Calidad POS = premium. | Tabla menú × visible ancla × visible shop. Para Grok sidebar. |
| **F-19** | `docs/comercial/PURGE_90D_PLAYBOOK.md` | Copy in-app + WA “tu libreta se congela”: cuándo, tono, qué se borra, cómo reactivar. No es código del job. | Humano/legal nota al pie. Grok: “evento + mail”. |

---

### Ola F5 — Soporte, QA, cierre

| ID | Archivo | Qué entregar | DoD |
|----|---------|--------------|-----|
| **F-20** | `docs/soporte/MACROS_L1_FREE.md` | Árbol: “esto es gratis / eso es extra” sin ser forro. No imprime, no abre caja, fiado no suma, “¿dónde está AFIP?”, “¿por qué no manda WA?”, Google login, “no veo oficios” (está bien). | Macro + qué log pedir + cuándo escalar. Si `MACROS_L1.md` existe, **sección Free** arriba, no archivo huérfano sin link. |
| **F-21** | `docs/qa/QA_ANCLA_FREE.md` | ≥15 casos: alta sin tarjeta, 1 caja, 0 WA outbound, 0 AFIP prod, fiado, venta, cierre, paywall visible, `/f`, menú kiosco ≠ oficios. | Para Grok/Vitest. PASS/FAIL. |
| **F-22** | `docs/marketplace/POSTVENTA_ANCLA.md` | Cadencias: alta sin uso 48 h, usando sin extra 30 d, pagando extra, freeze 90 d. KPI: activación 48 h, retención 30 d, conversión extra 60 d (10–20% objetivo calle). | No vanity de “módulos demo”. |
| **F-23** | `docs/engineering/REPORTE_GEMINI_FREE.md` | Reporte final de **esta** misión. | Ver plantilla abajo. |

**No obligatorio:** Leo one-pager, manual empleados, MX/CFDI, unicornio copy.

---

## Lista Grok (Gemini la rellena al final, no la codea)

Semilla (no inventar más de 10):

1. SKU ancla mostrador **o** extender `pos.fiado_barrio` a POS+fiado+caja (1 caja, 2 users) — si HUM-ancla = sí.  
2. Bloquear WA outbound y AFIP prod en ancla.  
3. Paywall con strings de F-12.  
4. Landing `/f` con copy F-15.  
5. Shell POS lite (no bajar el ERP entero).  
6. Job freeze/wipe 90 días + copy F-19.  
7. Eventos `fiados_30d` / deuda sin cobro → Cloud vendedor.  
8. Sidebar según F-18.  
9. No empleados en este track.

---

## Humano (Gemini no decide)

| ID | Pregunta | Gemini hace |
|----|----------|-------------|
| HUM-01 | Precio Cobrá / AFIP / 2ª caja / users | Deja `[HUM-01]` |
| HUM-ancla | ¿POS 1 caja $0 eterno o solo fiado $0? | Copy de calle asume mostrador; F-01 distingue “hoy código” vs “oferta” |
| HUM-02 | 20 locales de **un** barrio | Criterios de piloto en F-10 / F-22 |
| Legal | ToS ancla sin SLA, extra con soporte | 1 página “qué falta firmar”, no contrato de cero |
| — | ¿Unicornio / US ahora? | **No.** Norte = [`LIBERTAD_FINANCIERA_LATAM.md`](../comercial/LIBERTAD_FINANCIERA_LATAM.md) |

---

## Definición de “Gemini tramitó todo lo free”

- [ ] F-01: hay **un** canon Gratis / Shop / No.  
- [ ] F3: item shop con gatillos y microcopy, no 80 SKUs.  
- [ ] F2: el vendedor tiene one-pager, 2 min, kit flameo, objeciones, WA, checklist.  
- [ ] F4: `/f`, alta $0, checklist dueño, menú ancla, purge copy.  
- [ ] F5: macros, QA ancla, postventa, reporte.  
- [ ] Ningún MD nuevo promete AFIP/WA/empleados en el gratis.  
- [ ] Dominio `claver.com.ar` en todo lo tocado.  
- [ ] Ola empleados / US **no** está.

Eso es “todo lo free” de Gemini. El POS $0 en código es Grok + HUM-ancla. La plata es humano.

---

## Cómo reportar al final de la sesión

Escribí `docs/engineering/REPORTE_GEMINI_FREE.md`:

```markdown
# Reporte Gemini — lo free
**Fecha:**
**Olas cerradas:** F1 … 
## Paths creados
-
## Paths editados
-
## Grok debe codear (máx 10)
1.
## Humano decide
-
## Qué no hice (y está bien)
-
```

# Playbook — 1er deal Claver Energy (ops real, sin Ads)

**GO CEO:** 2026-09-13 · Comercial Claver  
**Modelo:** Claver orquesta (lead → seña → match) · **EPC instala** · Soft = CxC/presupuesto  
**Comisión objetivo:** 15–30% sobre total facturado al cliente (definir neta con partner antes del cierre)  
**Sin Ads volume.** Solo inbound / red / outreach 1:1.

Ref Research: `CLAVER_ENERGY_SOLAR_PROVIDERS_2026-09-13.md` · holding one-pager Works.

---

## 0) Posicionamiento (obligatorio en todo script)

- **Somos:** intermediario comercial. Armamos alcance, cobramos seña, matcheamos EPC, seguimos hitos.
- **No somos:** instaladores, fabricantes, ni “ingeniería Claver” sin pro nombrado.
- **No prometemos:** kWh exactos, plazos de distribuidora, incentivos municipales sin chequear zona.

---

## 1) Script lead → cotización → seña → match

### 1.1 Qual lead (5 preguntas, WA/llamada)

1. ¿Casa, comercio o PyME? ¿Ciudad / provincia?
2. ¿Factura luz aprox. (kWh/mes o $)? ¿Techo propio / tipo (chapa, teja, losa)?
3. ¿On-grid (con red), híbrido+batería, u off-grid?
4. ¿Presupuesto mental en USD o cuotas? ¿Urgencia (30/60/90 días)?
5. ¿Ya hablaste con otro instalador?

**Kill / no seguir:** sin techo usable, inquilino sin permiso, espera “gratis total”, pide que Claver firme matrícula eléctrica.

### 1.2 Opener

“Te armo un presupuesto orientativo y te conecto con un instalador matriculado de la zona. Claver coordina y cobra una seña; la obra la hace el EPC, no nosotros.”

### 1.3 Cotización rápida (papel, 24–48 h)

Usar rangos Research (re-validar al cerrar):

| Arquetipo | kWp | Ticket turnkey ref. | Comisión 15–30% |
|-----------|-----|---------------------|-----------------|
| Casa | 3–3,5 | USD 3.500–4.500 | ~500–1.350 |
| Casa | 4,5–6 | USD 5.000–7.200 | ~750–2.200 |
| + batería | ~5 + 5 kWh | desde ~USD 7.700 | ~1.150+ |
| PyME | 10–15 | USD 8.000–18.000 | ~1.200–5.400 |

**Texto presupuesto Claver (plantilla):**
- Alcance: sistema FV on-grid ~X kWp, sin batería (o con), relevamiento + instalación por partner, trámites Ley 27.424 **a cargo del EPC** salvo pacto.
- Precio orientativo: USD A–B (TC a pactar) · **no vinculante** hasta oferta firmada del EPC.
- Seña Claver: **10–20%** del ticket orientativo (mín. a definir; tip: USD 300–800 casa) → reserva match + gestión.
- Resto: según hitos EPC (ver §3).
- Comisión Claver incluida en precio cliente; partner recibe neto acordado.

Cargar en Soft: presupuesto + seña anotada + CxC (`pool-servicios-pro` / Cobrá). **Sin OT Field.**

### 1.4 Cierre seña

“Con la seña te asigno partner en 48–72 h hábiles, agendo relevamiento y te paso la oferta firme del EPC. Si no hay match viable en tu zona en 10 días, devolvemos seña menos gastos documentados (o 100% si política GO = full refund — fijar con Pablo).”

### 1.5 Match GenSolar / Amperio / Solarpool

| Lead | Partner 1º | Partner 2º | Nota |
|------|------------|------------|------|
| Rosario / Santa Fe / AMBA EPC | **GenSolar** | Amperio | GenSolar bases Rosario + AMBA |
| Residencial “desde USD 3k” / ER–BA | **Amperio** | GenSolar | FAQ Amperio desde USD 3.000 |
| Mendoza / lista USD publicada | **Solarpool** | Amperio | Precios El Sol / Solarpool turnkey |
| Solo kit + electricista propio | Kits (Inteva/ADN/…) | — | Menor comisión; menos RC obra Claver |

**Script a partner (WA):**
“Lead Claver Energy: [casa/PyME], [zona], ~[kWp], on-grid/híbrido. Cliente con seña. ¿Pueden relevamiento esta semana y oferta neta a Claver (precio calle − comisión X%)?”

**Regla:** no enviar lead a 3 partners a la vez sin avisar (exclusividad 7 días al 1º que confirme).

---

## 2) Docs — contrato cascada (checklist)

### A. Claver ↔ Cliente (intermediación)
- [ ] Partes, CUIT, domicilio
- [ ] Objeto: **gestión comercial / match EPC**, no ejecución de obra
- [ ] Alcance orientativo (kWp, on-grid/híbrido) + “sujeto a relevamiento”
- [ ] Seña: monto, moneda, qué cubre, cuándo se imputa
- [ ] Política de devolución / desistimiento
- [ ] Comisión Claver (o “incluida en precio”)
- [ ] Que el **contrato de obra** lo firma cliente↔EPC (o tripartito)
- [ ] Limitación: Claver no garantiza performance kWh ni plazos de distribuidora
- [ ] Datos personales / autorización a compartir lead con partner
- [ ] Firma (digital OK)

### B. Claver ↔ Partner / EPC
- [ ] NDA corto (opcional si hay tarifa neta sensible)
- [ ] Tarifa neta a Claver o % comisión fijo
- [ ] Exclusividad lead (días)
- [ ] Quién aporta: matrícula eléctrica, RT, RC, garantía años
- [ ] Quién tramita medidor bidireccional / distribuidora
- [ ] SLA respuesta cotización (ej. 5 días hábiles post-relevamiento)
- [ ] Facturación: partner factura obra; Claver factura seña/comisión (o partner factura bruto y rebate — **elegir un modelo y no mezclar**)
- [ ] No competencia sobre el mismo lead 12 meses

### C. Cliente ↔ EPC (obra) — Claver exige copia
- [ ] Precio firme post-relevamiento
- [ ] Hitos: seña obra / equipos en sitio / puesta en marcha / trámite medidor
- [ ] Garantía equipos + instalación
- [ ] Matrícula / encomienda visible
- [ ] RC vigente
- [ ] Cronograma tentativo

### D. Antes de cobrar seña #1 (bloqueantes)
- [ ] Abogado revisó plantillas A+B (mínimo) **o** GO Pablo “cerrar con disclaimer”
- [ ] Partner corto lista con **tarifa neta** escrita (GenSolar y/o Amperio y/o Solarpool)
- [ ] Soft: ficha lead + presupuesto + medio de cobro seña (MP/transfer)

---

## 3) Hitos plata (1er deal)

```
Lead calificado
  → Presupuesto Claver (orientativo)
  → Seña Claver (10–20%)
  → Match EPC (GenSolar | Amperio | Solarpool)
  → Relevamiento
  → Oferta firme EPC
  → Contrato obra cliente↔EPC (+ anexo Claver)
  → Hitos obra (cliente paga según EPC; Claver cobra comisión restante si aplica)
  → Upsell Soft (gestión CxC / mantenimiento recordatorios) opcional
```

---

## 4) Qué NO hacer (1er deal)

- Ads Meta Energy / landings “Claver instala paneles”
- Prometer incentivo EPRE Mendoza u otros sin chequear
- Mezclar pitch Soft ferretería con Energy
- Firmar como instalador / RT Claver
- Enviar 5 partners en paralelo al mismo lead
- Código Works / OT Field (motor CTO aparte)

---

## 5) Primer outreach (sin Ads) — cupo 5 leads

1. 2 referidos red Pablo (casa / PyME Rosario o AMBA) → GenSolar  
2. 1 lead Mendoza si aparece → Solarpool  
3. 1 lead Entre Ríos / BA norte → Amperio  
4. 1 PyME techo día → GenSolar o Enesolar (cotización)

Meta 1er deal: **1 seña cobrada + 1 match confirmado** en 14 días.

— Comercial Claver · 2026-09-13

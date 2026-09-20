# Empleado Autónomo IA — Blueprint Comercial & Técnico

> **Producto:** Agente IA que trabaja como un empleado más del cliente.
> **Plataforma:** claver.com.ar + Protheus REST API
> **Fecha:** Septiembre 2026

---

## 1. ¿Qué es el "Empleado Autónomo"?

Es un **agente de IA que el cliente "contrata" como si fuera un empleado**, con estas características:

| Aspecto | Empleado Humano | Empleado Autónomo IA |
|---------|----------------|---------------------|
| **Horario** | 9 a 18 hs | 24/7/365 |
| **Salario** | ARS 1.500.000 – 3.000.000/mes | USD 200 – 500/mes |
| **Errores** | Se cansa, se distrae | Consistente, auditable |
| **Escalabilidad** | 1 persona = 1 puesto | 1 agente = N empresas del grupo |
| **Vacaciones** | 14-21 días/año | Nunca |
| **Capacitación** | Meses | Se entrena con un prompt |
| **Auditoría** | "Me parece que estaba bien" | Log inmutable de cada decisión |

### El pitch comercial (en 1 oración):
> *"Por menos de lo que paga el café de la oficina, tiene un empleado que revisa
> 100% de sus comprobantes fiscales, 24/7, y le avisa ANTES de que venga la AFIP."*

---

## 2. Anatomía del Agente: Qué Decide Solo vs. Qué Pide Permiso

### Matriz de Autonomía

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEL DE AUTONOMÍA                            │
│                                                                 │
│  🟢 DECIDE SOLO (sin intervención humana)                       │
│     • Escanear comprobantes de compras del período              │
│     • Cruzar alícuotas de percepciones vs padrón ARBA/AGIP     │
│     • Detectar CUIT inválidos o dados de baja en AFIP           │
│     • Calcular diferencias de alícuota (cobrada vs correcta)    │
│     • Generar el informe pre-auditoría                          │
│     • Clasificar hallazgos por severidad (crítico/medio/bajo)   │
│     • Enviar resumen diario/semanal al contador                 │
│     • Marcar comprobantes como "revisados" internamente         │
│                                                                 │
│  🟡 DECIDE + NOTIFICA (actúa y avisa)                           │
│     • Reclasificar un tributo mal imputado en la compra         │
│     • Ajustar alícuota de percepción en próxima factura         │
│     • Agregar proveedor a lista de "observados"                 │
│     • Generar nota de débito/crédito correctiva (borrador)      │
│                                                                 │
│  🔴 PIDE AUTORIZACIÓN (nunca actúa sin aprobación)              │
│     • Emitir nota de crédito/débito fiscal                      │
│     • Modificar datos de un proveedor/cliente                   │
│     • Cambiar condición de IVA de un tercero                    │
│     • Presentar DDJJ o SIFERE                                   │
│     • Rectificar un período fiscal cerrado                      │
│     • Cualquier acción con impacto en libros contables          │
│     • Contactar a un proveedor directamente                     │
└─────────────────────────────────────────────────────────────────┘
```

### Quién Autoriza Qué (por rol)

| Acción que requiere autorización | Autoriza |
|----------------------------------|----------|
| Emitir NC/ND correctiva | **Contador / Estudio externo** |
| Rectificar DDJJ | **Contador + Dueño** |
| Cambiar condición IVA tercero | **Administrativo senior** |
| Modificar datos proveedor | **Compras / Administrativo** |
| Presentar SIFERE / CITI | **Contador** |
| Contactar proveedor por error en factura | **Compras** |

---

## 3. Canales de Comunicación

El agente se comunica por **el canal que el usuario prefiere**, no al revés.

### Canales de OUTPUT

| Canal | Uso | Ejemplo |
|-------|-----|---------|
| 📱 **WhatsApp Business** | Resumen diario + alertas urgentes | "Hoy revisé 47 comprobantes, encontré 3 con percepción IIBB incorrecta" + botones [Ver detalle] [Autorizar] |
| 📧 **Email** | Resumen semanal + PDF pre-auditoría | Tabla de hallazgos con link al dashboard |
| 🖥️ **Dashboard Web** | Panel completo con drill-down | Vista por comprobante, histórico, workflow de aprobación |
| 🔔 **Push (PWA)** | Alertas críticas en tiempo real | "Proveedor con CUIT dado de baja en 12 facturas — riesgo: $2.3M" |
| 💬 **Slack / Teams** | Canal #fiscal-ia | Alertas categorizadas |

### Canales de INPUT

| Canal | Uso | Ejemplo |
|-------|-----|---------|
| 📱 **WhatsApp** | Pedidos ad-hoc + foto de factura | "Revisá las compras de agosto" / [foto] → OCR + auditoría |
| 🖥️ **Dashboard** | Trigger manual + config | "Auditar período 08/2026" |
| ⏰ **Automático (cron)** | Revisión nocturna + pre-DDJJ | 02:00 → compras del día / Día 5 → auditoría completa del mes anterior |

---

## 4. Caso de Uso #1: Auditor Fiscal Impositivo

### Qué errores detecta

#### A) Percepciones IIBB mal aplicadas (ERROR MÁS COMÚN)

```
Escenario real:
  Proveedor de CABA factura a cliente de PBA.
  Aplica percepción IIBB CABA al 2.5% — PERO el cliente
  está en padrón ARBA como "sujeto no pasible" (alícuota 0%).
  
  → El cliente pagó de más y NO puede recuperarlo 
    si no lo detecta dentro de los 5 años.

  El agente cruza:
    1. Factura del proveedor (totalPercepciones > 0)
    2. Padrón ARBA/AGIP del CUIT del cliente
    3. Alícuota correcta vs. la que aplicaron
```

#### B) Condición de IVA incorrecta del proveedor

```
  Proveedor pasó de RI a Monotributo en marzo.
  La empresa sigue computando crédito fiscal IVA al 21%.
  Nadie actualizó la ficha.
  
  → El agente consulta "Constancia de Inscripción" AFIP
    y compara con la condición guardada en el ERP.
```

#### C) Retención de Ganancias bajo mínimo

```
  Se retuvo Ganancias cód. 305 sobre factura de $380.000.
  Mínimo no imponible: $400.000. No correspondía.
  
  → El agente detecta y genera aviso de devolución.
```

#### D) Percepciones IVA sobre sujetos exentos

```
  Mutual/cooperativa (exenta) recibe factura con percepción 
  IVA RG 2854 al 3%. No corresponde.
```

#### E) Duplicados y comprobantes apócrifos

```
  Dos facturas mismo proveedor, mismo número, distinta fecha.
  O punto de venta no habilitado en AFIP.
  
  → Cruza contra WSFEV1 para verificar autenticidad.
```

---

## 5. Infraestructura Técnica

### Stack del Agente

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  PROTHEUS ◄──REST──► CLAVER BFF ──► AGENT BRAIN              │
│  (cliente)           (Vercel)        │                        │
│  SE1/SE2/SF1                         ├── Scheduler (cron)     │
│  SFT/SF6                             ├── Audit Engine (rules) │
│                                      ├── LLM Layer (Gemini)   │
│                                      └── Notifier (WA/email)  │
│                                                               │
│  AFIP WS ◄── Verificación CAE/Constancia                     │
│  ARBA/AGIP ◄── Padrones CSV automáticos                      │
└───────────────────────────────────────────────────────────────┘
```

### Lo que YA EXISTE en Claver (80% del motor)

| Componente | Archivo | Función |
|------------|---------|---------|
| **Tax Engine AR** | `ar-adapter.ts` (497 líneas) | Catálogo completo alícuotas IVA/IIBB/percepciones/retenciones por provincia |
| **Padrón Service** | `padron-service.ts` (380 líneas) | Import masivo padrones ARBA/AGIP/DGR, consulta por CUIT |
| **Recuperador Fiscal** | `recuperador-fiscal-service.ts` | Cruza percepciones sufridas vs detalle tributario |
| **Pre-Presentación** | `pre-presentacion-service.ts` (263 líneas) | Checklist pre-DDJJ: facturas sin CAE, balanceo, coherencia IVA |
| **IVA Service** | `iva-service.ts` | Débito/crédito, posición mensual |
| **IIBB Service** | `iibb-service.ts` | IIBB por jurisdicción, convenio multilateral |
| **CITI Service** | `citi-service.ts` | CITI Ventas/Compras para AFIP |
| **SIFERE Export** | `sifere-export-service.ts` | Export SIFERE percepciones/retenciones |
| **Libro IVA Digital** | `libro-iva-digital-service.ts` | Libro IVA según RG 4597 |
| **Proxy Protheus** | `forward.ts` | Forward seguro a Protheus del cliente |

### Lo que HAY QUE CONSTRUIR

| Componente | Esfuerzo | Qué hace |
|------------|----------|----------|
| **Agent Orchestrator** | 2-3 semanas | Scheduler → fetch → rules → LLM classify → notify |
| **Rule Engine fiscal** | 1-2 semanas | Reglas parametrizables por tipo de error |
| **LLM Prompt fiscal** | 3-5 días | System prompt con legislación AR + formato hallazgo |
| **WhatsApp Integration** | 1 semana | Webhook + envío via BSP (Twilio/Gupshup) |
| **Dashboard Hallazgos** | 1-2 semanas | Vista hallazgos + workflow aprobación + historial |
| **PRW Adapter** | 1 semana | REST que expone SF1/SD1/SE5/SFT de Protheus |

---

## 6. Flujo de Auditoría

```
CADA NOCHE A LAS 02:00:

1. FETCH       → Traer compras/facturas del día (Protheus REST)
2. RULES       → Ejecutar reglas determinísticas (TypeScript):
                  - Percepciones vs padrón ARBA/AGIP
                  - Alícuota IVA vs condición proveedor
                  - Retenciones bajo mínimo
                  - Duplicados de comprobante
                  - CAE/CAEA válido
3. LLM         → Clasificar hallazgos:
                  - Explicación en lenguaje natural
                  - Severidad fiscal (multa AFIP, ajuste, bajo riesgo)
                  - Acción correctiva sugerida
                  - Impacto económico estimado
4. PERSIST     → Guardar en DB (tabla AuditHallazgo)
5. NOTIFY      → Enviar por canal preferido (WA/email/push)
6. APPROVE     → Si hay correctivas → workflow de aprobación
7. EXECUTE     → Si se aprobó → ejecutar corrección (NC, ajuste)
```

---

## 7. Cuánto Baja los Costos al Cliente

### Escenario: Empresa mediana (500 compras/mes)

| Concepto | Sin Agente (hoy) | Con Empleado Autónomo |
|----------|-------------------|----------------------|
| **Quién revisa** | Administrativa (si tiene tiempo) | Agente 24/7 |
| **Comprobantes revisados** | ~50/mes (10%) | 500/mes (100%) |
| **Tiempo** | 2-3 días/mes | 0 — automático |
| **Errores detectados** | ~2/mes (los obvios) | ~15-30/mes (todos) |
| **Percepciones no recuperadas** | ARS 200K – 800K/año | ARS 0 |
| **Riesgo multa AFIP** | Alto | Bajo |
| **Costo** | ARS 2.000.000/mes (sueldo parcial) | USD 300/mes (~ARS 375.000) |

### ROI directo:

```
INVERSIÓN CLIENTE:
  Setup: USD 1.500 (one-time)
  Mensual: USD 300/mes = USD 3.600/año

AHORRO CLIENTE:
  Percepciones recuperadas:            USD 600 – 2.400/año
  Horas administrativas liberadas:     USD 1.200/año
  Multas evitadas (probabilístico):    USD 2.000 – 10.000/año
  
  AHORRO TOTAL: USD 3.800 – 13.600/año
  
  ROI: 1.05x a 3.8x en el primer año
  → Se paga solo con percepciones recuperadas + horas liberadas
  → Multas evitadas = ganancia pura
```

### La frase que cierra la venta:
> *"¿Sabés cuánto te percibieron de más el último año? No lo sabés porque nadie lo revisa.
> Nosotros lo revisamos todo, automáticamente, y te mostramos cuánto podés recuperar."*

---

## 8. Pricing

### Modelo SaaS + Consumo

| Concepto | Precio |
|----------|--------|
| **Setup + Configuración** | USD 1.500 |
| **Plan Básico** (hasta 300 comprobantes/mes) | USD 200/mes |
| **Plan Profesional** (hasta 1.000 comprobantes/mes) | USD 350/mes |
| **Plan Enterprise** (ilimitado + multi-empresa) | USD 500/mes |
| **WhatsApp (add-on)** | USD 50/mes (500 mensajes) |
| **Auditoría bajo demanda** | USD 100/ejecución |

### Modelo alternativo: Success Fee

> *"No cobramos mensual. Cobramos el 20% de lo que te ayudamos a recuperar."*

Si el agente detecta ARS 5.000.000 en percepciones recuperables → Claver cobra ARS 1.000.000.
Sin riesgo para el cliente: si no encuentra nada, no paga.

---

## 9. Roadmap

### Fase 1: MVP — "Auditor de Percepciones" (4-6 semanas)
- [ ] PRW que expone compras con tributos vía REST
- [ ] Agent Orchestrator: cron nocturno fetch + audita
- [ ] Rule Engine: cruce percepciones vs padrón (YA EXISTE 80%)
- [ ] LLM: clasificación y explicación de hallazgos
- [ ] Dashboard: vista hallazgos + workflow aprobación
- [ ] Notificación: email con PDF resumen

### Fase 2: "Auditor Fiscal Completo" (+4 semanas)
- [ ] Retención Ganancias + IVA SICORE
- [ ] Verificación CAE/CAEA contra AFIP
- [ ] Duplicados y apócrifos
- [ ] WhatsApp con botones
- [ ] Pre-auditoría completa antes de DDJJ

### Fase 3: "Empleado Autónomo" generalizado (+4 semanas)
- [ ] Template de agente configurable por rol
- [ ] Ejecución de correctivas con aprobación
- [ ] Historial de decisiones + auditoría del agente
- [ ] API para reglas custom del cliente

---

## 10. Clientes para el Piloto

| Cliente | Por qué | Plan |
|---------|---------|------|
| **Grupo Comat** | Multi-empresa, muchos proveedores, volumen alto | Enterprise |
| **La Piamontesa** | Miles de proveedores materia prima, percepciones cruzadas PBA/SF/CBA | Profesional |
| **Oxford** | Compras internacionales + locales, régimen editorial | Profesional |
| **Cushman** | Gastos de mantenimiento de cientos de propiedades | Profesional |

### Para la primera demo:

1. Pedir a Comat un **export de 3 meses de compras con tributos**
2. Correr el motor de auditoría
3. Mostrar: *"En 3 meses detectamos X percepciones mal aplicadas por $Y. Sin esto, esos $Y se perdían."*

→ Eso cierra la venta.

---

## 11. Diferencial Competitivo

| vs. | Qué hacen | Qué NO hacen (y nosotros sí) |
|-----|-----------|------------------------------|
| Estudios contables | Auditan 1 vez al año | No revisan comprobante por comprobante en real-time |
| Xubio / Colppy | Facturación electrónica | No auditan percepciones ni cruzan padrones |
| SAP Concur | Gastos corporativos | No entiende legislación AR ni percepciones IIBB |
| **Nadie** | — | Agente autónomo 24/7 + WhatsApp + reglas fiscales AR + integrado a Protheus |

> **No hay NADIE en el mercado argentino que ofrezca un agente IA fiscal
> que trabaje 24/7 integrado a Protheus. Ustedes serían los primeros.**

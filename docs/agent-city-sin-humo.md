# Agent City sin humo

Cómo pasar de un OS de demo a un negocio que cobra por procesos cerrados.
No por “tener IA”. No por hombrecitos. No por 8 departamentos.

Fecha: 2026-09-01  
Repo: `Downloads/agent-city`  
Dominio real: TOTVS Protheus + ARCA/AFIP + operaciones argentinas.

---

## 1. El dilema, en una frase

**“Ya tengo IA. ¿Cómo gano plata?”**

La respuesta que no funciona: más chats, más agentes, más organigrama.

La respuesta que sí: **un proceso que ya le cuesta plata a alguien, ahora cierra solo, con evidencia, y un humano solo firma lo irreversible.**

La IA no es el producto. El producto es:

> este comprobante salió / este extracto calzó / este ticket se resolvió / este crédito se frenó  
> y puedo mostrar quién lo hizo, con qué dato, a qué costo, y quién aprobó.

Eso es un “esclavo de info”. No un empleado digital. Un **loop dueño de un dato y de un resultado**.

---

## 2. Qué es un esclavo de info (sano vs teatro)

### Sano

Un agente (o un script + un LLM chico) que:

1. Lee **una** fuente (interna o externa).
2. Hace **una** transformación verificable.
3. Escribe **un** resultado en un sistema que la empresa ya usa.
4. Si el paso es irreversible (plata, AFIP, cliente, delete), **se para**.
5. Deja recibo: input, regla, output, costo, timestamp.

Ejemplos que valen plata en este repo:

| Esclavo | Fuente | Proceso | Resultado cobrable |
|---|---|---|---|
| Factura electrónica | Protheus SD2/SF2 | Validar TES, armar XML, mandar TSS | CAE / rechazo con causa |
| Conciliación | OFX / API banco + SE1 | Match exacto o semántico | asiento propuesto o calce cerrado |
| Crédito | SA1 + antigüedad | Score + umbral | draft de NC o “bloqueado, aprobá” |
| Soporte | WhatsApp + pedido | Estado de orden | respuesta enviada o ticket |
| Funcional | SX3/SIX | Diff vs plantilla | hipótesis + parche, nunca DDL solo |

### Teatro (lo que Agent City hace hoy en el loop)

Cada 1–3 segundos un `Math.random()` inventa:

- “Invoice #18412 Emitted”
- “WhatsApp Inquiry Resolved”
- GPU 42%, VRAM 11.2/12, 99.1% local, RTX 5070 Ti

Eso no es un esclavo. Es un **generador de sensación de empresa**. El marketplace promete `$1,420/mo` de ahorro. Ningún número de esos tocó un ERP.

Si el hombrecito camina sobre eso, el video es más lindo y el producto más mentiroso.

---

## 3. Opinión sobre “ahora tengo IA, ¿cómo gano?”

Hay tres maneras de cobrar. Solo una escala sin volverse consultora eterna.

### A. Alquilar el chat (malo)

Seat de Copilot / Gemini / Grok Bot. El cliente “tiene IA”. A los 90 días pregunta para qué la paga. Churn.

Agent City **parece** esto si se vende como OS con 8 distritos.

### B. Vender implementación (estable, techo bajo)

“Te conecto Protheus, te armo el agente de facturas, te dejo el Approval Center.”  
Plata de proyecto. Márgenes de integrador TOTVS. No es vergonzoso. **No es el techo.**

Sirve para el primer cliente. No para el plan Enterprise de `$1.500` del demo.

### C. Cobrar el proceso cerrado (el negocio)

Unidad de cobro = **evento de negocio resuelto**, no token, no seat.

- $ por CAE emitido / por rechazo clasificado
- $ por extracto conciliado
- $ por ticket cerrado con dato de ERP
- $ por NC que pasó el umbral y el humano firmó en < X minutos
- floor mensual para el control plane (la ciudad)

La ciudad es el **tablero**. Los esclavos son el **P&L**.

Empresas argentinas con Protheus ya pagan gente para:

1. Reprocesar facturas que TSS rechazó.
2. Conciliar bancos a mano.
3. Contestar “¿dónde está mi pedido?”.
4. Pedirle a un funcional que mire SX3.

Eso ya tiene precio interno (sueldo + error + AFIP).  
La IA gana si **ese precio baja** y el riesgo no sube. Si el riesgo sube (factura mal emitida, NC de $850k sola), perdés el cliente y tal vez más.

Por eso el Approval Center de este repo es más valioso que el mapa. **No lo degradas a badge.** Es la caja registradora ética.

### Interna vs externa

| | Interna (moat) | Externa (alcance) |
|---|---|---|
| Dato | Protheus, SQL, reglas de la firma | AFIP, banco, WhatsApp, carrier |
| Por qué vale | Nadie más tiene *ese* diccionario, *esa* TES, *esa* política | El mundo cambia y hay que leerlo |
| Riesgo | Escribir mal adentro | Hablarle mal a un cliente o a AFIP |
| Orden | **Primero** | Después, con el mismo gate |

Sin interna, sos un wrapper de Gemini.  
Sin externa, sos un reporte lindo del ERP.  
La plata está en el **puente**: dato interno + evento externo + regla de la empresa + firma humana.

“Esclavos” es una metáfora peligrosa si se toma literal.  
Un loop que no puede parar, que no deja recibo, o que miente el status, no es productividad: es deuda operativa con cara de dashboard.

El esclavo sano tiene **jornada, umbral y sindicalista** (el crítico + el humano).

---

## 4. Qué ya está (no tirar) y qué falta (sí construir)

### Conservar

- 8 departamentos con dueño de proceso (Billing, Funcional, Accounting, Customer, Sales, Infra, Ops, Finance).
- Estados: `ONLINE | IDLE | THINKING | EXECUTING | WAITING | BLOCKED | ERROR | ESCALATED`.
- Approval: `whatIKnow / whatIDontKnow / whatITried / whatFailed / whatIRecommend / whatINeedFromYou`.
- Incidentes con hipótesis y evidencia.
- Tools tipadas: READ vs WRITE, `requiresApproval`, sistema (`ERP_PROTHEUS`, `ARCA_TSS`, `BANK_API`…).
- Gemini ya cableado en `app/api/agent/chat/route.ts`.
- Tenant + plan (la semilla del cobro).

Eso es más “empresa” que Pixel Office, The Delegation o los videos de Grok Bot. El cerebro del producto **ya está nombrado**.

### Falta — y es todo el producto

**Cuerpo**

- Nadie camina. El “City Map” es una grilla de cards. “Detailed Floor Plans” no cambia el canvas.
- No hay `{ x, y, dest, pose }` ni handoff visible Billing → Functional.
- Network es un grafo con coordenadas hardcodeadas, no un flujo vivo.

**Verdad**

- El feed es un array de escenarios aleatorios (`agent-city-state.tsx`, loop ~línea 659).
- GPU, Qwen local, 99.1% zero-token, Protheus, TSS: **copy**. Las traces del chat se inventan incluso cuando Gemini responde.
- Marketplace: “Hire” + confetti. No hay worker.

**Trabajo**

- Gemini solo habla en el drawer. No decide el próximo paso del agente.
- Ningún tool pega a un sistema. `isAvailable` es un booleano de demo.
- No hay cola de jobs, ni idempotencia, ni “este CAE ya se pidió”.
- No hay crítico que pueda `reject` a otro agente con consecuencias en el mapa.
- No hay una unidad de cobro en el modelo (`EventoResuelto`). Hay `quotaTasks` de teatro.

**Dinero**

- Planes `$199 / $499 / $1.500` sin un proceso que haya cerrado una vez.
- No hay “recibo para el cliente”: lo que se hizo, a qué costo, qué ahorró vs un humano, qué quedó pendiente de firma.

---

## 5. Cómo hacerlo sin humo (secuencia, no backlog infinito)

Regla: **un proceso real antes que el piso pixel**.  
El hombrecito es la película del recibo, no el motor.

### Paso 0 — Apagar el generador de mentiras

- El loop random del feed: `simulationSpeed === 0` por default, o que solo dispare jobs reales.
- Sacar del footer GPU/VRAM/TPS inventados. Si no hay nvidia-smi, no hay barra.
- Si Gemini falla, decir “Gemini falló”. No “Qwen3 8B AWQ local”.
- Marketplace: no “Hire”. “Conectar herramienta” o deshabilitado hasta que exista el worker.

Humo que se queda es producto. Humo que se apaga es demo honest.

### Paso 1 — Un solo esclavo, de punta a punta

Elegir **Billing / factura rechazada por TES**. Es el incidente que el demo ya cuenta (`#18392`, `D2_TES` null, `APP-824`). Dejar de simularlo.

Contrato mínimo:

```
Job
  id, tenantId, type: 'INVOICE_TRANSMIT'
  input: { sucursal, doc, serie, numero }   // o el XML
  state: queued | running | needs_approval | done | failed
  evidence: []   // SQL row, payload TSS, respuesta AFIP
  costUsd
  agentId
```

Herramientas, en este orden:

1. **READ** SQL/Protheus: leer el comprobante (aunque sea un JSON fixture de un caso real anonimizado).
2. **DIAGNOSE**: regla determinística primero (`D2_TES` vacío → causa conocida). LLM **después**, para explicar, no para inventar el TES.
3. **WRITE** solo con approval: parche SX3 / reintento TSS.
4. Recibo en el Approval Center, con los 6 campos que ya existen.

Criterio de hecho: un humano de operaciones puede tomar `INC-5821` de **producción** (o un dump) y ver el mismo diagnóstico. Si no, no existe.

Gemini acá: redacta la hipótesis y el “qué necesito de vos”.  
No elige el código TES. Eso es tabla + regla.

### Paso 2 — El crítico y el humano, no el organigrama

Dos roles, no dieciséis:

- **Worker (Billing)** — ejecuta el job.
- **Crítico (Functional o Finance)** — puede `reject` y obliga a `BLOCKED`.

El humano solo ve la cola de `needs_approval`.  
Si no hay reject real, el enjambre es un comité que se aplaude.

### Paso 3 — Recibo y precio

Cada job `done` o `failed` escribe:

- qué dato tocó
- qué regla o modelo
- tokens / $ 
- minutos-hombre equivalentes (número **calibrado con un cliente**, no `$1,420`)
- si pidió firma

Eso alimenta el plan:

- Floor: acceso a la ciudad + 1 esclavo (ej. $X/mes).
- Usage: $ por job cerrado arriba de N.
- Extra: conectar WhatsApp / banco / segundo CUIT.

Sin recibo no hay invoice tuya hacia el cliente. Sin invoice tuya, el dilema no se resolvió.

### Paso 4 — Recién ahí, el piso que camina

Cuando un job cambia de estado, el sprite se mueve:

| Estado | Pose |
|---|---|
| `queued` | idle en su escritorio |
| `running` | tipeando |
| `needs_approval` | camina a la puerta del humano y espera |
| `escalated` | camina al escritorio del crítico |
| `done` | vuelve, globo con el doc |
| `failed` | rojo, no se esconde en el feed |

Pathfinding barato. 8 escritorios. Cero RPG.

Si el piso se construye antes del job, es LUMENX: KPIs que suben solos.

### Paso 5 — Externa, un canal

WhatsApp **o** banco **o** TSS de verdad. Uno.

El agente de Customer no “resuelve inquiries”. Lee un mensaje, pega READ al pedido, **deixa el draft**. El humano manda hasta que el error rate sea aburrido.

---

## 6. Arquitectura mínima (sin Qwen fantasma)

```
[Fuente]
  Protheus/SQL  |  AFIP/TSS  |  Banco  |  WhatsApp
        \            |            |           /
         \           v            v          /
          \----->  Job Queue (idempotente)
                       |
            +----------+-----------+
            |                      |
     Reglas (gratis,          LLM (Gemini)
     determinísticas)         explica / clasifica
            |                      |          lo ambiguo
            +----------+-----------+
                       v
              Approval si WRITE / plata / cliente
                       v
              Sistema de verdad + Recibo
                       v
              Ciudad (sprite + feed)  ← solo lee el job
```

Local-first es válido **cuando exista** un modelo local midiendo VRAM. Hasta entonces el footer dice `Gemini 2.5 Flash` o `regla`. Mentir el stack es el mismo pecado que mentir el Rat Race en Deuda.

Multi-LLM (Gemini escribe, Grok codea, crítico en otro modelo) **después** de un job. Antes es vanidad de organigrama.

---

## 7. Cómo se gana plata con *esta* ciudad, concreto

Posicionamiento: no “plataforma de agentes”.  
**Torre de control de procesos Protheus que ya te están saliendo caros.**

Primer paquete vendible:

1. **Factura electrónica atascada** — diagnóstico + reintento con firma.
2. **Conciliación bancaria** — match + asiento propuesto.
3. **“¿Dónde está mi pedido?”** — draft WhatsApp con dato de ERP.

Cobro sugerido (ordenar con un cliente, no con el demo):

- Onboarding (B): conectar un CUIT, un ambiente, umbrales de firma.
- Floor mensual (C): ciudad + cola de approvals + recibos.
- Por evento: los tres procesos de arriba.

Lo que no se vende hasta tener 1 cliente con 30 días de recibos:

- Marketplace de 20 especialistas.
- Plan Enterprise 100k tasks.
- “99.1% local”.
- Hombrecitos como feature. Son **demo del recibo**.

El gran dilema se resuelve cuando el CFO del cliente puede decir:

> “Antes, 2 personas × N horas en TSS y extractos.  
> Ahora, M jobs/mes, $K, y yo firmo las NC grandes en el teléfono.”

Si no podés completar esa frase con números de **su** empresa, todavía tenés IA. No tenés negocio.

---

## 8. Test de cordura (cada semana)

1. ¿Este número salió de un sistema o de `Math.random`?
2. ¿Este agente puede fallar en voz alta?
3. ¿Hay un humano que puede pararlo antes de AFIP / plata / cliente?
4. ¿Hay un recibo que yo le facturaría a alguien?
5. ¿El hombrecito se movió *porque* el job se movió?

Si 1 es random, 4 es no, y 5 es sí: estás haciendo cine.  
Si 1 es SQL, 4 es sí, y 5 todavía no: estás haciendo el producto. El cine espera.

---

## 9. Qué siento que falta, en una línea

Falta **el primer job que no se pueda desmentir**.  
Todo lo demás —piso, enjambre, Gemini, Grok, esclavos internos/externos— es cableado alrededor de eso.

La ciudad ya tiene nombres. Ponele un proceso. Después, que camine.

# Brief para Gemini — Claver, valor real para quien tiene una idea y convicción

**Uso:** copiá este archivo entero a Gemini. Pedile que lo deje épico (copy, landings, pitch, onboarding, demo script) **sin inventar features que no existan** y **sin vender teatro de 16 agentes**.

**Regla de oro:** la IA no es el producto. El producto es que un oficio o un comercio **cobre, cotice, despache y cumpla AFIP** con menos fricción. El enjambre y la oficina pixel son cómo se *ve* y se *gobierna* eso.

---

## 0) Qué le pedís a Gemini (instrucción)

Actuá como director de producto + copywriter para founders argentinos (oficios, comercio de calle, PyME, el que arranca con una idea y no suelta).

Entregá, en español rioplatense, tono directo, cero jerga vacía:

1. **Manifiesto** (1 página) para el emprendedor con idea y convicción.
2. **Pitch de 60 segundos** (lo que Pablo dice en un café / WhatsApp de voz).
3. **Landing “por qué Claver”** (H1, sub, 3 dolores, 3 pruebas, CTA trial 14 días).
4. **Guion de demo de 8 minutos** de Agent City / oficina: qué mostrar, qué *no* mostrar, qué frase cierra.
5. **Mapa de valor** de las 15 tecnologías de abajo: cuáles cierran el trial, cuáles coronan el plan Swarm/Obra.
6. **Objeciones** (contador, socio, “ya uso ChatGPT”, “es humo”) y respuestas de una línea.
7. **Qué no decir nunca** (lista de humo prohibido).

No inventes GPU local, 99% zero-token, CAE mágico ni “reemplazá tu empresa”. Si algo es lab/simulación, nombrar. Si algo está en el ERP de verdad (AFIP, MP, fiado, POS), marcarlo como **hecho / en producto**.

---

## 1) Para quién es esto

No es para el que colecciona SaaS. Es para:

- El electricista / plomero / instalador que cotiza por audio de WhatsApp y pierde la seña.
- El almacén / ferretería / taller que fía en un cuaderno y no cobra.
- El que tiene **una idea y convicción**: armar cuadrilla, abrir el segundo local, dejar de ser el único que “tiene todo en la cabeza”.
- El partner de ERP que tiene que mirar a los ojos a un contador.

La convicción no se gamifica. Se **protege**: presupuesto que no se inventa, seña que se concilia, factura que sale, humano que firma lo irreversible.

---

## 2) Qué es Claver (producto, no mito)

**claver.com.ar** — ERP / POS / fiado / facturación AFIP para Argentina. Trial 14 días. WhatsApp y oficios son la puerta de entrada comercial actual.

**Agent City** (`/claver/agent-city` → `/claver/agent-city/app`) — lab público: torre de control de agentes por departamento (Billing, Sales, Finance, Customer, Ops, Functional, Infra, Accounting).

Lo que el visitante *juega* hoy:

- Oficina **pixel** (canvas 2D, Vercel-safe). No WebGPU. No modelos 3D ajenos (The Delegation es CC BY-NC).
- Estilo Gather: **vos caminás (WASD)**, proximidad, X hablar, E usar escritorio/COS/standup, F focus, M mute, emotes, minimapa, zonas privadas.
- Estilo LUMENX / marfin: figuritas por depto, COS al medio, flags, dossier de handoff, feed.
- Chat del agente → Gemini si hay `GOOGLE_GENERATIVE_AI_API_KEY` / `GEMINI_API_KEY`.
- Presencia backend estilo **Hermes3D**: `GET /api/agent-city/presence` pinta facturas, tickets, pedidos, CX del ERP. Si hay datos: HUD **ERP LIVE** y se apaga el random. Si no: **DEMO**.

Lo que **no** es (todavía): 16 empleados digitales autónomos, TSS/Protheus en vivo en el lab, video WebRTC tipo Gather 50 personas.

Filosofía escrita en `docs/agent-city-sin-humo.md`: cobrar **proceso cerrado** (CAE, extracto, “¿dónde está mi pedido?”), no seat de chat.

---

## 3) La tesis de valor (para Gemini)

El emprendedor no compra “IA”. Compra **tiempo de convicción**:

| Antes | Con Claver (cuando está bien hecho) |
|---|---|
| Audio de WhatsApp → olvido → pierde el trabajo | Audio → 3 niveles de presupuesto → seña MP |
| Fiado en papel → vergüenza de cobrar | Recordatorio + link + conciliación |
| “Después facturo” → AFIP / ARCA | El agente arma; Claver firma y emite |
| ChatGPT en otra pestaña, copy-paste | El mismo hilo escribe en el ERP (MCP) |
| Miedo de que la IA invente precios | RAG de *su* lista + schema Básico/Recomendado/Premium |

Agent City es el **tablero** para que vea a la cuadrilla. WhatsApp es la **calle**. AFIP y Mercado Pago son la **caja**. El humano es la **firma**.

Frase que tiene que sobrevivir a cualquier reescritura épica:

> No te damos esclavos de PowerPoint. Te damos una cuadrilla que cotiza, cobra y cumple — y vos solo firmás lo que no se revierte.

---

## 4) 15 tecnologías que sí mueven producto (Grok / Chrome)

Pegadas a **claver.com.ar**. Orden por valor para oficios/comercio en Argentina, no por hype.

### Enjambre y cerebro

1. **CrewAI** — equipos con roles (Presupuestador, Cobrador, Despachador, AFIP). Es el modelo mental que el cliente entiende: cuadrilla de IA.
2. **LangGraph** — flujo largo con estado: audio → 3 niveles → seña → obra. Checkpoints y “aprobá” antes de cobrar.
3. **OpenAI Agents SDK (o equivalente multi-modelo)** — handoffs + guardrails en poco código; el Supervisor pasa la pelota sin armar un grafo enorme.
4. **MCP (Model Context Protocol)** — un conector `crear_presupuesto`, `enviar_seña_mp`, `anotar_fiado` usable por cualquier agente y por ERPs ajenos. Eso es Claver para cualquier gestión.

### Canal y voz (donde vive el cliente)

5. **WhatsApp Cloud API** — la UI real. Sin esto el enjambre es un chat que nadie abre.
6. **Whisper / STT barato** — el oficio cotiza por audio. Voice-to-quote es el feature que cierra el trial.
7. **Vision (Gemini Flash / GPT-4o-mini)** — foto de la pileta, el tablero, el ticket del corralón. El agente no adivina medidas a ciegas.

### Plata, docs y cumplimiento

8. **Mercado Pago API (señas + checkout)** — el Cobrador no recuerda: manda link y concilia.
9. **Facturación AFIP (WSFE / SDK tipo Afip SDK)** — el agente arma; Claver firma y emite. Sin esto no hay ERP argentino serio.
10. **Firma electrónica en pantalla + PDF (contratos)** — presupuesto aceptado = contrato, no un PDF suelto.

### Datos que evitan alucinaciones

11. **RAG + pgvector sobre lista de precios / historial de obras** — cotiza con *tus* precios, no con internet.
12. **Pydantic / JSON Schema** — el presupuesto **siempre** sale Básico / Recomendado / Premium tipado. Si no valida, no se manda.

### Operación de cuadrilla

13. **Calendario + geo simple (Google Calendar / Maps Distance Matrix)** — el Despachador arma hoja de ruta y no pisa dos obras a la misma hora.
14. **n8n (o equivalente self-host)** — brazos: recordatorio de fiado, aviso a la cuadrilla, webhook a Tango/Odoo, mail. El 70% del valor no es el LLM.

### Confianza y venta

15. **Observabilidad de agentes (LangSmith / tracing + log de tools)** — ves qué tool tocó, qué precio usó, quién aprobó la seña. Eso vende a contadores y a partners de ERP; también te deja no fundirte en tokens.

### Cómo se apilan

WhatsApp + STT + Vision **entran**. CrewAI/LangGraph **piensan**. MCP **escribe** en Claver. MP y AFIP **ejecutan** con humano en el medio. n8n dispara lo rutinario. RAG + Schema evitan que el enjambre invente. Tracing te deja dormir.

**MVP recortado a 5 (trial 14 días):** WhatsApp Cloud, STT, CrewAI, Mercado Pago, MCP. El resto corona el plan Swarm / Obra, no el trial.

---

## 5) Cómo se ve en Agent City (para el guion de demo)

Mapear roles de CrewAI a escritorios que ya existen:

| Rol de cuadrilla | Escritorio en la oficina | Prueba de valor |
|---|---|---|
| Presupuestador | Sales | 3 niveles tipados, no un párrafo de ChatGPT |
| Cobrador | Finance / COS | seña MP + vos firmás el umbral |
| Despachador | Ops | no dos obras a la misma hora |
| AFIP | Billing | arma; Claver emite; pendiente = NEED YOU |
| Soporte | Customer | “¿dónde está mi pedido?” con dato de ERP |
| Crítico | Functional | ticket / TES / schema; puede frenar |

Demo de 8 minutos (sugerida; Gemini puede reescribir el ritmo, no los hechos):

1. Landing `/claver/agent-city` — “oficina gamificada, no cine”.
2. WASD: sos VOS. Chip **Backend ERP LIVE** si hay datos.
3. Caminá a Billing. Si hay facturas pendientes, está sentado de verdad.
4. X → preguntá por la última FV. Gemini o fallback, pero el número del feed es del ERP.
5. E en COS → Approval Center: *qué sé / qué no / qué necesito de vos*.
6. Cerrá: “Esto no es un muñeco. Es la cuadrilla que va a cotizar tu audio y cobrarte la seña. El trial es WhatsApp + STT + MP. El resto es plan.”

No mostrar: GPU 42%, marketplace Hire, 99.1% local, organigrama de 16.

---

## 6) Promesa al que tiene idea y convicción

Tres capas, en este orden (Gemini: usalas como arco narrativo):

1. **La calle** — donde ya habla (WhatsApp, audio, foto).
2. **La caja** — seña, fiado, AFIP. Plata que entra y comprobante que sale.
3. **La cuadrilla** — agentes con nombre, oficina donde se ve quién está free/focus, y un humano que firma.

La convicción es el activo. Claver no la reemplaza: **le pone rieles** para que no se gaste en cobranzas, en rehacer presupuestos y en miedo a AFIP.

Si Gemini necesita un eslogan de trabajo (puede mejorarlo, no diluirlo):

> Tu idea sigue siendo tuya. Nosotros hacemos que cobre, cumpla y no se te escape por un audio.

---

## 7) Humo prohibido (checklist para Gemini)

- “Empresa digital 24/7 sin humanos.”
- “16 workers, 3 managers, Chief of Staff” como métrica.
- Números de ahorro `$1.420/mes` sin cliente que lo haya medido.
- Qwen local / RTX si no está midiendo VRAM de verdad.
- CAE emitido en el lab si el job no pegó a WSFE.
- Compararse con Gather/The Delegation como si fuéramos su clon 3D.
- Prometer WebRTC / 50 avatares humanos en Vercel.

Permitido: lab, pixel, Gather-*style*, presencia ERP, Gemini en el chat, trial oficios.

---

## 8) Referencias internas (para no alucinar el repo)

- Producto: `Downloads/pos-system-argentina`
- Oficina: `components/agent-city/city-map/OfficeFloorView.tsx`
- Presencia: `GET /api/agent-city/presence` · `lib/agent-city/presence-from-erp.ts`
- Chat: `GET/POST /api/agent-city/chat` (Gemini)
- Sin humo: `docs/agent-city-sin-humo.md`
- Rutas: `/claver/agent-city` · `/claver/agent-city/app`
- Env: `GOOGLE_GENERATIVE_AI_API_KEY` o `GEMINI_API_KEY`

Referencias externas (inspiración visual, no partnership): Gather.town, Hermes3D (gateway-first), LUMENX/marfin (pixel office), The Delegation (POIs; assets NC).

---

## 9) Prompt corto si Gemini pide “una sola orden”

> Con este brief, escribí el manifiesto y la landing para el emprendedor argentino que tiene una idea y no la suelta. Valor = cobro, presupuesto por audio, AFIP, seña MP, cuadrilla visible. Agent City es el tablero, no el milagro. MVP = WhatsApp + STT + CrewAI + MP + MCP. Épico, concreto, sin humo.

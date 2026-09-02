# 🎮 METASWARM OS — EL MMORPG DE AGENTES LLM PARA ERP
## "Tu Empresa es un Videojuego. Tus Empleados son Agentes IA. El Mapa es tu Negocio."

> **Versión:** 2.0 — Documento Unificado  
> **Fecha:** 31 de agosto de 2026  
> **Repositorio:** `pos-system-argentina`  
> **Dominio:** `campus.claver.com.ar`

---

## 1. CONCEPTO: ¿QUÉ ES METASWARM?

MetaSwarm convierte la gestión de un ERP en una **experiencia de videojuego estilo MMORPG/Fortnite en el navegador** donde:

- **Tus agentes de IA son NPCs trabajadores** con avatares animados que se mueven por una oficina/ciudad 2D en Pixel Art.
- **Vos sos el personaje principal (Player)** que camina con WASD o Click, inspecciona agentes, les da órdenes por voz y aprueba acciones críticas.
- **Cada edificio es un departamento real del negocio** (Ventas, Finanzas, Depósito) conectado al back-office del ERP (93 módulos ya construidos).
- **Los globos de texto muestran en tiempo real** qué está haciendo cada agente: cobrando un fiado por WhatsApp, emitiendo una factura AFIP o reponiendo stock.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  🏙️  C I U D A D   M E T A S W A R M   —   campus.claver.com.ar                │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  🏢 VENTAS   │  │  🏦 FINANZAS │  │  📦 DEPÓSITO │  │  🗼 TORRE    │         │
│  │              │  │              │  │              │  │   MATRIZ     │         │
│  │ P1: WhatsApp │  │ P1: AFIP/CAE │  │ P1: Stock    │  │              │         │
│  │ P2: Tienda   │  │ P2: Caja     │  │ P2: Entregas │  │ (Tu Avatar)  │         │
│  │ P3: CRM      │  │ P3: Banco    │  │              │  │ Panel CEO    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                                  │
│   🎮 WASD para moverte · Click en NPC para inspeccionar · Voz para dar órdenes  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
                              │
                     WebSocket / SSE (< 30ms)
                              │
┌──────────────────────────────────────────────────────────────────────────────────┐
│  CLAVERP BACK-OFFICE (pos-system-argentina)                                       │
│  Next.js 15 · Prisma · Supabase · AFIP · MercadoPago · WhatsApp · Telegram       │
│  93 módulos: POS, Fiado, Caja, Stock, CRM, Agenda, Oficios, Cuadrillas…          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. LA MECÁNICA DE JUEGO (Game Design Document)

### 2.1 El Player (Vos — El Dueño del Negocio)

| Mecánica | Descripción |
|:---|:---|
| **Movimiento** | WASD o click para caminar por la ciudad. Entrás a edificios, subís pisos con escaleras/ascensor. |
| **Inspección** | Click sobre un agente NPC → se abre el Panel Lateral con su log de actividad, tokens usados, costo en USD y la tarea actual. |
| **Órdenes de Voz** | Micrófono del browser → Whisper transcribe → el agente más cercano ejecuta la orden. |
| **Chat de Texto** | Caja de texto tipo Fortnite (Enter → escribir → Enter): "Leo, cobrale a Juan los $15.000 de fiado". |
| **Aprobaciones** | Cuando un agente necesita autorización (monto alto, descuento, OC de compra), aparece un ícono 🚨 sobre su cabeza y un pop-up de aprobación flotante. |

### 2.2 Los NPCs (Agentes LLM)

Cada agente tiene:
- **Avatar Pixel Art animado** (16×16px, 4 direcciones + idle + working + alert).
- **Nombre y Rol visible** como etiqueta flotante sobre la cabeza.
- **Barra de Estado** tipo RPG: `🟢 Activo` / `🟡 Pensando...` / `🔴 Bloqueado`.
- **Globo de Diálogo** en tiempo real con lo que está haciendo:
  > 💭 *"Enviando recordatorio de fiado a María por $12.000..."*
- **Nivel de Autonomía** (configurable por el dueño): Copiloto (sugiere) → Semi-auto → Piloto Automático.

### 2.3 El Mapa de la Ciudad (Worldbuilding)

La ciudad se organiza en **Edificios** (departamentos) con **Pisos** (funciones). Cada piso tiene **Mesas de Trabajo** (tareas específicas) y **Salas de Reunión** (donde los agentes debaten en Swarm antes de actuar).

---

## 3. MAPA COMPLETO DE LA CIUDAD — EDIFICIOS, PISOS Y AGENTES

### 🏢 EDIFICIO A — "SALÓN COMERCIAL & ATENCIÓN"

#### Piso 1: Atención WhatsApp & Telegram (24/7)
| Mesa | Agente NPC | Rol en el Juego | API del ERP que Usa |
|:---|:---|:---|:---|
| Mesa 1 | **Leo** (Vendedor) | Recibe mensajes WA, consulta catálogo, arma presupuesto PDF | `/api/v1/agents/catalogo`, `/api/v1/agents/presupuesto` |
| Mesa 2 | **Facturador AFIP** | Emite factura A/B/C con CAE en < 30s al confirmar pago | `/api/v1/agents/venta` |
| Mesa 3 | **Cobrador Digital** | Genera link MP, detecta webhook de pago, imputa CxC | `/api/v1/agents/link-pago` |
| 🪑 Sala Reunión | **Swarm de Cotización** | Si el pedido es complejo: debate entre mesas, consenso y respuesta | Todas las APIs del piso |

#### Piso 2: E-commerce B2C y Portal B2B
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Gestor Tienda** | Sincroniza catálogo online, responde consultas | `/ecommerce`, `/api/v1/agents/catalogo` |
| Mesa 2 | **Gestor B2B** | Atiende mayoristas por CUIT, genera OC | `/portal`, `/api/v1/agents/cliente` |

#### Piso 3: CRM & Seguimiento Comercial
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Ana (CRM)** | Registra interacciones, califica leads, dispara follow-ups | `/dashboard/crm` |
| Mesa 2 | **Sofía (Agenda)** | Recordatorios de turnos T-24h/T-2h por WhatsApp, registra no-shows | `/dashboard/agenda` |

---

### 🏦 EDIFICIO B — "FINANZAS, AFIP & CONTABILIDAD"

#### Piso 1: AFIP & Compliance Fiscal
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Clara (CAE Monitor)** | Monitorea facturas sin CAE, reintenta, activa CAEA si AFIP cae | `/api/v1/agents/facturas/pendientes-cae` |
| Mesa 2 | **Contador Bot** | Genera ZIP de Libro IVA/CITI el 1° de cada mes | `/api/v1/agents/libro-iva` |

#### Piso 2: Caja & Cuentas a Cobrar
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Guardián de Caja** | Detecta anulaciones sospechosas, caja abierta +12h → alerta Telegram | `/api/v1/agents/caja/estado` |
| Mesa 2 | **Cobrador CxC** | Cron lun-vie 10AM: lista vencidas → WhatsApp con link MP | `/api/v1/agents/cxc/vencidas` |

#### Piso 3: Conciliación & Liquidaciones
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Conciliador MP** | Concilia liquidaciones de MercadoPago/tarjetas, detecta retenciones fantasmas | `/dashboard/mercadopago` |
| Mesa 2 | **Liquidador Partners** | Calcula comisiones de partners/revendedores | `/dashboard/reventas` |

---

### 📦 EDIFICIO C — "DEPÓSITO, STOCK & LOGÍSTICA"

#### Piso 1: Stock, Compras & Reposición JIT
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Ramiro (Reponedor)** | Stock ≤ mínimo → crea OC borrador y notifica | `/api/v1/agents/stock/bajo-minimo` |
| Mesa 2 | **Slow-Mover** | Detecta ítems sin rotación >30d → propone liquidación -X% | `/dashboard/reportes` |
| Mesa 3 | **OCR Facturas** | Lee PDF/foto de factura de proveedor, carga la compra | `/api/v1/agents/stock/registrar-ocr` |

#### Piso 2: Picking, Logística & Entregas
| Mesa | Agente NPC | Rol | API |
|:---|:---|:---|:---|
| Mesa 1 | **Ruteador** | Optimiza ruta de entregas diaria, ETA al cliente | `/dashboard/logistica` |
| Mesa 2 | **Gestor Picking** | Lista de picking para despacho desde pedidos confirmados | `/dashboard/picking` |

---

### 🗼 EDIFICIO D — "TORRE MATRIZ" (Solo para vos — El CEO)

| Elemento | Descripción |
|:---|:---|
| **Vista Panorámica** | Mapa reducido de todos los edificios en miniatura con indicadores de actividad (verde/amarillo/rojo). |
| **Panel de Métricas** | Ventas del día, caja, agentes activos, errores en cola, tokens consumidos, costo USD/ARS. |
| **Bot Telegram Personal** | Recibe órdenes por voz → transcribe Whisper → activa swarms → responde con resumen ejecutivo. |
| **Dead-Letter Queue** | Avatares con 🚨 = tarea bloqueada que necesita tu aprobación. |
| **Historial Auditable** | Cada decisión de agente registrada con timestamp, tokens, modelo y resultado. |

---

## 4. INTERACCIONES DE JUEGO CON LOS LLMs

### 4.1 Hablar con un Agente (Chat/Voz → LLM → Acción en el ERP)

```
┌─────────────────────────────────────────────────────────────┐
│  TU AVATAR camina hacia LEO y le habla:                      │
│                                                              │
│  Player: "Leo, ¿cuánto le debemos al proveedor Distribuidora│
│           Pérez y cuándo vence la próxima factura?"          │
│                                                              │
│  Leo (💭 Pensando...):                                       │
│  → Consulta /api/v1/agents/cxc/vencidas?proveedor=perez     │
│  → Responde en el Globo de Diálogo:                          │
│                                                              │
│  Leo: "La deuda con Distribuidora Pérez es de $185.000.      │
│        Vence el 5 de septiembre. ¿Querés que le transfiera   │
│        ahora o que programe el pago para el día 4?"          │
│                                                              │
│  [🟢 PAGAR AHORA]  [📅 PROGRAMAR]  [❌ CANCELAR]             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 El Swarm (Sala de Reunión — Debate entre Agentes)

Cuando una tarea es compleja (ej: un pedido grande con descuento especial), los agentes se reúnen:

```
┌───────────────────────────────────────────────────────────────┐
│  SALA DE REUNIÓN — SWARM ACTIVO 🟡                            │
│                                                               │
│  Leo: "El cliente pide 200 unidades de Aceite 10W40           │
│        con 15% de descuento. ¿Aprobamos?"                     │
│                                                               │
│  Ramiro: "Tenemos 180 en stock. Si aprobamos,                 │
│           quedamos bajo mínimo. Sugiero pedir 100 más."       │
│                                                               │
│  Clara: "A ese precio con 15% off, el margen neto             │
│          baja al 8%. Yo sugeriría máximo 10% de descuento."   │
│                                                               │
│  Guardián: "El cliente tiene $45.000 de deuda vencida.        │
│             No aprobaría hasta que regularice."                │
│                                                               │
│  ➡️ RESULTADO DEL SWARM:                                      │
│  "Ofrecer 10% de descuento, condicionar a que pague la        │
│   deuda vencida, y generar OC por 100 unidades adicionales."  │
│                                                               │
│  [✅ APROBAR SWARM]  [✏️ MODIFICAR]  [❌ RECHAZAR]              │
└───────────────────────────────────────────────────────────────┘
```

### 4.3 Eventos Reactivos en el Mapa (Estilo MMORPG: "World Events")

| Evento del Mundo Real | Lo que Pasa en el Mapa |
|:---|:---|
| **Llega un mensaje de WhatsApp** | Leo se ilumina en el Piso 1, camina a su mesa y muestra el globo con el mensaje del cliente. |
| **Se recibe un pago por MercadoPago** | El Cobrador Digital brilla en verde ✨, suena un efecto de "monedas" y el contador de Ventas del Día sube. |
| **AFIP rechaza una factura** | Clara parpadea en rojo 🔴, camina a la impresora y muestra: "Error de CAE. Reintentando..." |
| **Un producto queda en stock 0** | Ramiro se levanta de su mesa con alerta naranja, camina al estante vacío y genera la OC. |
| **El dueño aprueba una OC** | Se ilumina la sala de reunión en verde, los agentes vuelven a sus mesas. Efecto de "Quest Completed". |

---

## 5. SISTEMA DE PROGRESIÓN Y GAMIFICACIÓN

### 5.1 Niveles de los Agentes (Experience Points)

Los agentes **suben de nivel** a medida que completan tareas exitosamente:

| Nivel | Nombre | Requisito | Beneficio |
|:---|:---|:---|:---|
| Lv. 1 | **Pasante** | Recién activado | Solo sugiere, necesita aprobación para todo. |
| Lv. 5 | **Junior** | 50 tareas exitosas, 0 errores críticos | Ejecuta tareas menores solo (cobros < $20.000). |
| Lv. 10 | **Senior** | 200 tareas, accuracy > 98% | Ejecuta tareas medianas, aprueba OC < $50.000. |
| Lv. 20 | **Lead** | 500 tareas, 0 quejas del dueño | Piloto automático total excepto montos mayores. |

### 5.2 Achievements del Negocio (Logros del Dueño)

| Achievement | Condición | Recompensa Visual |
|:---|:---|:---|
| 🏅 "Primera Sangre" | Primer fiado cobrado por IA | Badge dorado en la Torre Matriz. |
| 💰 "Cajero del Mes" | $1M cobrados automáticamente en 30 días | Decoración nueva en el edificio de Finanzas. |
| 🏗️ "Arquitecto" | Activar 5+ agentes simultáneos | Desbloquea el Edificio C (Depósito). |
| 🌟 "Cero Errores" | 30 días sin errores en agentes | Skin especial para tu avatar. |

---

## 6. STACK TÉCNICO

| Capa | Tecnología | Notas |
|:---|:---|:---|
| **Campus 2D** | Phaser.js 3 + React overlay | < 1MB, 60FPS, mapas Tiled JSON, pixel art |
| **Sync Real-Time** | WebSockets (ws) / SSE | Latencia < 30ms para avatares y globos |
| **Orquestador Agentes** | Custom Event Loop (TypeScript) | Estados en Redis, historial en Postgres |
| **Memoria de Pisos** | Redis (Upstash) + SQLite | Pizarra Key-Value por piso |
| **Modelos de IA** | Gemini Flash (micro-workers) + Claude (auditores) | Router por tarea y costo |
| **WhatsApp** | Meta Cloud API + Twilio | Webhook en `/api/v1/agents/whatsapp` |
| **Telegram** | BotFather + node-telegram-bot-api | Gratuito ilimitado |
| **Transcripción Voz** | Whisper API / Groq Whisper | Órdenes por voz del dueño |
| **Back-office ERP** | ClavERP (`pos-system-argentina`) | 93 módulos via `/api/v1/agents/*` |
| **Deploy** | Vercel (front) + Railway (WS/workers) | < $30/mes total |

---

## 7. ESTADO ACTUAL VS. LO QUE FALTA

### ✅ YA CONSTRUIDO (En `pos-system-argentina`)
- 93 módulos del dashboard operativos (POS, Fiado, Caja, Stock, CRM, Agenda, Oficios).
- Facturación AFIP nativa (CAE/CAEA), MercadoPago, Stripe.
- 10 agentes IA registrados en el scheduler (`agent-registry.ts`).
- Bot de cobranza Leo con WhatsApp + link MP.
- Webhooks de WhatsApp inbound (`/api/webhooks/whatsapp`).
- Telegram commands para control del dueño.
- Crons de empleados digitales corriendo.
- Entitlements y SKU gating (`canUseSku()`).
- Onboarding Express de 2 minutos + Sandbox Demo 1-Clic.

### 🔴 FALTA CONSTRUIR (Priorizado)

| ID | Prioridad | Qué Falta | Dónde Va |
|:---|:---|:---|:---|
| **MS-01** | P0 | Gateway API seguro `/api/v1/agents/*` con permisos por piso | `app/api/v1/agents/` |
| **MS-02** | P1 | Motor de estado de agentes (quién está activo, tarea, tokens) | `lib/agents/agent-state.ts` |
| **MS-03** | P1 | Frontend 2D con Phaser.js: mapa, avatares, movimiento WASD | `app/dashboard/campus/` |
| **MS-04** | P1 | WebSocket server para sync de avatares y globos | `services/campus-ws/` |
| **MS-05** | P2 | Panel lateral AgentPanel.tsx + MetricsBar.tsx | `app/dashboard/campus/_components/` |
| **MS-06** | P2 | Sprites pixel art de los 6 agentes + tileset de oficina | `public/campus/sprites/` |
| **MS-07** | P2 | Sistema de niveles/XP de agentes y achievements | `lib/agents/progression.ts` |
| **MS-08** | P3 | Multi-tenant campus (cada cliente ve su propio edificio) | RLS + subdomain routing |

---

## 8. ROADMAP FINANCIERO

| Fase | Hito | Clientes | MRR (USD) | Costo/mes |
|:---|:---|:---|:---|:---|
| **Fase 0-1** | API Gateway + Agentes funcionales | 0 (alfa) | $0 | $30 |
| **Fase 2** | Campus 2D MVP (1 edificio, 3 agentes) | 2 (beta) | $500 | $50 |
| **Fase 3** | Comercialización activa | 8 | $2,400 | $80 |
| **Fase 3.5** | Automatización de ventas | 20 | $7,000 | $120 |
| **Fase 4** | Escala regional + Marketplace de Agentes | 50 | $22,000 | $250 |
| **Fase 4.5** | Partners + SDK público | 100+ | $45,000+ | $500 |

---

## 9. CRITERIO DE DONE (MVP del Campus)

- [ ] Entrar a `campus.claver.com.ar` desde el navegador sin instalar nada.
- [ ] Ver la ciudad con al menos 1 edificio, 2 pisos y 3 agentes con avatares animados.
- [ ] Moverme con WASD y hacer click en agentes para ver su panel.
- [ ] Globos de texto en tiempo real mostrando qué hace cada agente.
- [ ] Si llega un WhatsApp, Leo se ilumina y muestra el mensaje en su globo.
- [ ] Si un agente se traba, ver la alerta 🚨 y recibir push en Telegram.
- [ ] Poder hablar por micrófono y que el agente más cercano ejecute la orden.
- [ ] Efecto visual de "monedas/XP" cuando se cobra un pago exitosamente.

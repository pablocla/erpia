# TAREAS CURSOR — NOP Automation Hub + n8n

> **NO solapar con Gemini.** Gemini solo documenta y genera plantillas JSON en `docs/automation/`.  
> Cursor implementa código, schema, APIs, UI y tests.

**Fecha inicio:** 2026-06-19  
**Dependencia:** Gemini entrega G-N8N-03 (OpenAPI) antes de cerrar contratos finales — Cursor puede avanzar con draft interno.

---

## División estricta

| Quién | Qué |
|-------|-----|
| **Gemini** | `.md`, OpenAPI yaml, plantillas n8n JSON, copy UI, casos de prueba manuales |
| **Cursor** | Prisma, `lib/automation/*`, rutas API, workers, dashboard UI, Vitest, cableado event bus |

---

## Fase 1 — Schema y bridge (Semana 1–2)

### C1 — Modelos Prisma Automation

**Archivo:** `prisma/schema.prisma`

```prisma
model AutomationConfig {
  id            Int      @id @default(autoincrement())
  empresaId     Int      @unique
  n8nBaseUrl    String?
  n8nApiKeyEnc  String?  // cifrado
  webhookSecret String   // HMAC compartido
  activo        Boolean  @default(false)
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  empresa       Empresa  @relation(...)
  eventMaps     AutomationEventMap[]
  playbooks     AutomationPlaybook[]
  virtualWorkers AutomationVirtualWorker[]
}

model AutomationEventMap {
  id              Int @id @default(autoincrement())
  configId        Int
  eventKey          String  // STOCK_BAJO, VENTA_EMITIDA...
  n8nWebhookUrl   String
  activo          Boolean @default(true)
  filtros         Json?   // condiciones extra
  @@unique([configId, eventKey])
}

model AutomationPlaybook {
  id          Int @id @default(autoincrement())
  configId    Int
  playbookKey String
  version     Int @default(1)
  nombre      String
  parametros  Json
  activo      Boolean @default(true)
  @@unique([configId, playbookKey])
}

model AutomationVirtualWorker {
  id          Int @id @default(autoincrement())
  configId    Int
  nombre      String
  rol         String
  playbooks   String[] // playbookKeys
  cron        String?
  usuarioId   Int?     // usuario técnico NOP vinculado
  activo      Boolean @default(true)
}

model AutomationExecution {
  id            BigInt   @id @default(autoincrement())
  empresaId     Int
  direction     String   // outbound | inbound
  eventKey      String?
  status        String   // ok | error | timeout
  requestPayload  Json?
  responsePayload Json?
  durationMs    Int?
  idempotencyKey String? @unique
  createdAt     DateTime @default(now())
  @@index([empresaId, createdAt])
}
```

**Criterio:** `npx prisma generate` OK + migración.

---

### C2 — Bridge saliente NOP → n8n

**Archivos:**
- `lib/automation/n8n-bridge.ts`
- `lib/automation/sign-payload.ts`

Funciones:
- `emitToN8n(empresaId, eventKey, data)` → busca `AutomationEventMap`, firma HMAC, POST async vía BullMQ
- `verifyInboundSignature(headers, body, secret)` → para callbacks n8n

**Criterio:** test unitario firma + idempotency.

---

### C3 — API entrante n8n → NOP

**Archivos:**
- `app/api/automation/webhooks/inbound/route.ts`
- `app/api/automation/actions/create-task/route.ts`
- `app/api/automation/actions/create-user-virtual/route.ts`
- `app/api/automation/actions/trigger-playbook/route.ts`

Acciones mínimas:
- Crear `TareaPendiente` con `origen: "automation"`
- Crear usuario con flag `esVirtual: true` (agregar campo en Usuario si falta)
- Re-disparar playbook

**Auth:** API Key por tenant `X-NOP-Api-Key` + HMAC `X-NOP-Signature` (no JWT de usuario humano).

**Criterio:** Vitest con payload firmado válido/inválido.

---

### C4 — API configuración

**Archivos:**
- `app/api/automation/config/route.ts` (GET/PUT)
- `app/api/automation/events/route.ts` (catálogo)
- `app/api/automation/executions/route.ts` (logs)

Protegido con `getAuthContext` + rol `gerente|admin|dueno` + entitlement `automation.n8n_hub`.

---

## Fase 2 — Event bus + Ops (Semana 2–3)

### C5 — Emitter en event bus existente

**Archivo:** `lib/automation/event-subscriber.ts`

Registrar en startup (o `instrumentation.ts`):

```typescript
eventBus.on("*", async (event) => {
  await emitToN8n(event.empresaId, event.type, event.payload)
})
```

Eventos prioritarios:
- `VENTA_EMITIDA`, `NC_EMITIDA`, `STOCK_BAJO` (nuevo emitter en stock)
- Reusar pendientes: caja cerrada, CAE pendiente

**Criterio:** venta POS → execution log `outbound` si mapa activo.

---

### C6 — Worker BullMQ `automation.outbound`

**Archivos:**
- `workers/automation-outbound-worker.ts`
- Cola con retry exponencial 3 intentos

**Criterio:** no bloquear request HTTP de venta.

---

### C7 — Virtual Workers (cron sin n8n)

**Archivo:** `lib/automation/virtual-worker-runner.ts`

- Lee `AutomationVirtualWorker` con cron
- Ejecuta playbooks rule-based locales (sin HTTP n8n)
- Fallback si tenant no tiene n8n configurado

**Criterio:** worker “Ana Reposición” crea tarea si stock bajo.

---

## Fase 3 — UI parametrización (Semana 3–4)

### C8 — Página `/dashboard/automatizacion`

**Archivos:**
- `app/dashboard/automatizacion/page.tsx`
- `components/automation/` (tabs: Conexión, Eventos, Playbooks, Empleados virtuales, Logs)

**Usar copy de Gemini** (`docs/automation/UI_COPY_ES_AR.md`) cuando esté listo — placeholders hasta entonces.

**Sidebar:** agregar en `app/dashboard/layout.tsx` bajo Configuración o nuevo grupo “NOP Ops”.

---

### C9 — Entitlement gate

**Archivos:**
- `lib/platform/sku-catalog.ts` — agregar `automation.n8n_hub`
- `requireEntitlement` en todas las rutas `/api/automation/*`

---

### C10 — Test webhook desde UI

Botón “Probar conexión” → emite `WEBHOOK_TEST` → muestra resultado en toast + log.

---

## Fase 4 — Railroad engine integration (Semana 4–5)

### C11 — WorkflowStep executor tipo `n8n`

**Archivo:** `lib/workflow/executors/n8n-step-executor.ts`

Cuando `WorkflowStep.tipo === "n8n"`:
- Lee `parametros.webhookUrl` o mapa global
- Emite y espera callback opcional (async) o fire-and-forget

**Criterio:** test integración workflow venta con paso n8n mock.

---

## Fase 5 — Integraciones P0 (paralelo, no Gemini)

| ID | Tarea | Notas |
|----|-------|-------|
| C12 | Mercado Pago webhook loop cerrado | `channel.mercadopago` |
| C13 | WhatsApp → puede disparar evento `CUENTA_VENCIDA` → n8n | |
| C14 | ML stub → evento `PEDIDO_ML_RECIBIDO` | |

---

## Tests Cursor (Vitest)

| Archivo | Cobertura |
|---------|-----------|
| `__tests__/automation/sign-payload.test.ts` | HMAC |
| `__tests__/automation/n8n-bridge.test.ts` | emit mock fetch |
| `__tests__/automation/inbound-webhook.test.ts` | create-task |
| `__tests__/automation/virtual-worker.test.ts` | cron playbook |

---

## Orden de implementación Cursor

```
C1 → C2 → C3 → C4 → C5 → C6 → C8 (UI shell) → C7 → C9 → C10 → C11
C12-C14 en paralelo con C5-C6
```

---

## Lo que Cursor NO hace (reservado Gemini)

- ❌ Plantillas JSON export n8n (`docs/automation/n8n-templates/`)
- ❌ OpenAPI yaml final (`docs/automation/OPENAPI_AUTOMATION.yaml`) — Cursor implementa según draft C3, Gemini alinea doc
- ❌ Copy marketing y comparativa n8n vs ops
- ❌ Docker compose documentación n8n self-hosted
- ❌ Casos de prueba manuales escritos

---

## Draft API interno (Cursor — hasta que Gemini entregue OpenAPI)

```
PUT  /api/automation/config
GET  /api/automation/config
GET  /api/automation/events
POST /api/automation/webhooks/inbound
POST /api/automation/actions/create-task
POST /api/automation/actions/create-user-virtual
POST /api/automation/playbooks/:key/run
GET  /api/automation/executions?take=50
POST /api/automation/test
```

---

## Definición de done (MVP Automation Hub)

- [x] Tenant configura URL n8n + secret en UI
- [x] Mapa `VENTA_EMITIDA` → webhook funciona con log
- [x] n8n puede crear tarea vía inbound firmado
- [x] 1 empleado virtual cron crea tarea stock bajo sin n8n
- [x] Entitlement `automation.n8n_hub` bloquea si no contratado
- [x] 10+ tests Vitest verdes

## Estado C1–C14 (2026-06-19)

| ID | Estado |
|----|--------|
| C1 | ✅ Schema + `prisma generate` |
| C2 | ✅ n8n-bridge + sign-payload + cola con retry |
| C3 | ✅ APIs inbound (webhook, create-task, create-user-virtual, trigger-playbook) |
| C4 | ✅ APIs config, events, executions |
| C5 | ✅ event-subscriber en `lib/events/bootstrap.ts` |
| C6 | ✅ Cola in-process + `workers/automation-outbound-worker.ts` stub BullMQ |
| C7 | ✅ virtual-worker-runner + cron `/api/cron/automation-virtual-workers` |
| C8 | ✅ `/dashboard/automatizacion` + `components/automation/` |
| C9 | ✅ Entitlement en rutas + SKU `automation.n8n_hub` |
| C10 | ✅ Botón Probar conexión → `POST /api/automation/test` |
| C11 | ✅ WorkflowStep tipo `webhook` / `n8n` en workflow-engine |
| C12 | ✅ MP webhook → evento `PAGO_MP_RECIBIDO` |
| C13 | ✅ WhatsApp cobranza → evento `CUENTA_VENCIDA` |
| C14 | ✅ ML stub → `recibirPedidoML` + `PEDIDO_ML_RECIBIDO` |

## Estado P3–P4 (2026-06-19)

| ID | Estado | Entregable |
|----|--------|------------|
| P3-entitlements | ✅ | `ProductoComercial`, `SuscripcionModulo`, `UsageEvent`, cascada en `entitlements.ts` |
| P3-poll | ✅ | `GET/POST /api/automation/poll`, `poll-buffer.ts`, `modoConexion` en bridge |
| P3-api | ✅ | `GET/POST /api/platform/suscripciones`, seed demo |
| P3-docs | ✅ | Wiki: workers, poll, entitlements + links |
| P4-ui | ✅ | Selector modo conexión, card uso/plan, copy errores Gemini en UI |
| P4-e2e | ✅ | E2E suscripción visible en hub |

### G-SYNC docs (2026-06-19) ✅

- [x] G-SYNC-01 OpenAPI v1.1.0
- [x] G-SYNC-02 NOP_AUTOMATION_HUB.md
- [x] G-SYNC-03 plantilla 09-poll-consumer.json
- [x] G-SYNC-04 TESTING_N8N.md (10 casos + checklist)
- [x] G-SYNC-05 UI_COPY_ES_AR.md
- [x] G-SYNC-06 N8N_VS_OPS.md
- [x] G-SYNC-07 comercial-automation.mdx pricing
- [x] G-SYNC-08 plantillas 01–08 headers OpenAPI

### FCE MiPyME (2026-06-19) ✅

- [x] CBU + tipo transferencia en ConfigFiscalEmpresa
- [x] Opcionales AFIP 2101/2102 en factura-service
- [x] API + UI `/api/config/fiscal-mipyme`

### Pendiente Cursor (post-automation)

- [ ] E2E real sin mocks contra staging
- [ ] UI admin global suscripciones (super-admin multi-tenant)
- [ ] Pendientes por rol + home cajero (funcional.txt)

---

*Actualizar este archivo al cerrar cada tarea C1–C14 y fases P3+.*
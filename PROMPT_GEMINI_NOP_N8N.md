# PROMPT GEMINI — NOP Automation Hub + n8n

> **Proyecto:** TERMINAL → **NOP** (Need of Retail)  
> **Fecha:** 2026-06-19  
> **Dueño Gemini:** documentación, plantillas n8n, casos de prueba, copy UI  
> **Dueño Cursor:** schema, APIs, workers, UI shell, seguridad (ver `TAREAS_CURSOR_NOP_N8N.md`)

---

## Contexto para Gemini

NOP es un ERP web multirubro (Next.js 15 + Prisma + PostgreSQL) que evoluciona a **plataforma modular** con:

- Feature flags: `FeatureEmpresa`, `ConfiguracionRubro`
- Workflows internos: `WorkflowRubro`, `WorkflowStep` (tipo incluye `"webhook"`), `WorkflowInstancia`
- Event bus in-process (migrando a BullMQ)
- Entitlements planificados: `ProductoComercial`, `Entitlement`, `UsageEvent`
- SKU propuesto para n8n: `automation.n8n_hub`

**Pregunta del cliente:** ¿n8n se conecta de forma nativa?  
**Respuesta técnica:** Sí, **no como fork embebido del código n8n**, sino como **Automation Hub nativo** en NOP que:

1. **Emite eventos** hacia webhooks de n8n (saliente)
2. **Recibe callbacks** de n8n con acciones firmadas (entrante)
3. **Parametriza** workflows por tenant (URL, secret, mapeo evento→workflow)
4. **Genera tareas/empleados virtuales** según reglas + parámetros JSON (sin LLM obligatorio)

n8n corre **self-hosted** (recomendado por tenant o instancia NOP compartida con namespaces). NOP no reemplaza n8n; lo **orquesta y gobierna**.

---

## Arquitectura objetivo (referencia)

```
┌─────────────────────────────────────────────────────────────┐
│                     NOP Automation Hub                       │
│  /dashboard/automatizacion  ← parametrización UI            │
│  lib/automation/n8n-bridge.ts                               │
│  lib/automation/virtual-workers.ts                          │
└───────────────┬─────────────────────────┬───────────────────┘
                │ eventos firmados          │ API NOP (JWT/API Key)
                ▼                           ▼
        ┌───────────────┐           ┌───────────────┐
        │ n8n (tenant)  │◄─────────►│ NOP REST API  │
        │ workflows     │  webhooks │ /api/automation│
        └───────────────┘           └───────────────┘
```

### Modos de conexión n8n

| Modo | Descripción | Cuándo usar |
|------|-------------|-------------|
| **A — Webhook saliente NOP→n8n** | NOP dispara `POST` a URL n8n al ocurrir evento | Automatizaciones simples, sin estado en NOP |
| **B — Webhook entrante n8n→NOP** | n8n llama `/api/automation/actions/*` con HMAC | Crear tareas, usuarios, OC, notificaciones |
| **C — Polling n8n** | n8n consulta `/api/automation/poll` cada N min | Legacy / firewalls estrictos |
| **D — Workflow step interno** | `WorkflowStep.tipo = "n8n"` en railroad engine | Flujos venta/compra con paso n8n |
| **E — Virtual Worker** | Cron NOP simula “empleado” que ejecuta playbook | Sin n8n (fallback); mismo schema de parámetros |

---

## Módulo exclusivo: Parametrización n8n

### Pantalla: `/dashboard/automatizacion`

Secciones que Gemini debe documentar y diseñar copy (Cursor implementa UI):

| Sección | Contenido |
|---------|-----------|
| **Conexión** | URL base n8n, API Key n8n (solo lectura workflows), Webhook secret compartido |
| **Catálogo de eventos** | Qué eventos NOP puede emitir (toggle on/off por evento) |
| **Mapa evento→workflow** | `VENTA_EMITIDA` → webhook URL workflow #123 |
| **Playbooks** | Plantillas pre-armadas (cobranza, reposición, onboarding empleado) |
| **Empleados virtuales** | Personas lógicas: “Ana Reposición”, “Bot Caja Noche” con rol + horario |
| **Límites** | Max ejecuciones/día, horario permitido, entitlements |
| **Logs** | Últimas 50 ejecuciones, payload, estado, reintentos |

### Parámetros JSON por playbook (ejemplo)

```json
{
  "playbookKey": "procurement_guardian_n8n",
  "version": 1,
  "params": {
    "stockMinimoMultiplier": 1.2,
    "proveedorPreferidoId": 12,
    "aprobarOcAutomaticaHastaArs": 50000,
    "notificarRoles": ["gerente", "deposito"],
    "horarioEjecucion": "0 8 * * 1-5",
    "crearTareaSi": "stock_bajo",
    "crearUsuarioVirtual": {
      "nombre": "Bot Reposición",
      "rol": "deposito",
      "soloAutomatizacion": true
    }
  }
}
```

---

## Tareas asignadas a GEMINI (no implementar código)

### G-N8N-01 — Documento funcional Automation Hub

**Entregable:** `docs/automation/NOP_AUTOMATION_HUB.md`

Incluir:
- Glosario (playbook, virtual worker, bridge, entitlement)
- 15 eventos NOP documentados con payload JSON ejemplo
- Matriz evento × acción n8n × acción NOP API
- Flujos ASCII o Mermaid: venta→n8n→WhatsApp; stock bajo→OC→tarea
- Política de seguridad (HMAC, rotate secret, IP allowlist)

**Criterio de aceptación:** Un implementador puede cablear un workflow sin preguntar al equipo.

---

### G-N8N-02 — Plantillas n8n exportables (JSON)

**Entregable:** carpeta `docs/automation/n8n-templates/` con 8 workflows importables:

| # | Nombre archivo | Trigger | Acciones |
|---|----------------|---------|----------|
| 1 | `01-morning-brief.json` | Cron 06:00 | GET NOP pendientes → email/Slack |
| 2 | `02-stock-bajo-oc.json` | Webhook `STOCK_BAJO` | POST crear OC borrador + tarea depósito |
| 3 | `03-cobranza-whatsapp.json` | Webhook `CUENTA_VENCIDA` | WA template + log |
| 4 | `04-cierre-caja-alerta.json` | Webhook `CAJA_ABIERTA_12H` | Notificar gerente |
| 5 | `05-nuevo-empleado-onboarding.json` | Webhook `USUARIO_CREADO` | Tareas checklist 7 días |
| 6 | `06-pedido-b2b-picking.json` | Webhook `PEDIDO_CONFIRMADO` | Lista picking + asignar virtual worker |
| 7 | `07-cae-fallido-retry.json` | Webhook `CAE_RECHAZADO` | Retry AFIP + tarea contador |
| 8 | `08-slow-mover-promo.json` | Cron semanal | GET slow movers → actualizar lista precio |

Cada JSON debe ser compatible con **n8n v1.80+** (nodos HTTP Request, Webhook, Code mínimo).

**Criterio:** Import en n8n sin errores; variables `{{$env.NOP_BASE_URL}}` y `{{$env.NOP_API_KEY}}`.

---

### G-N8N-03 — OpenAPI subset Automation API

**Entregable:** `docs/automation/OPENAPI_AUTOMATION.yaml`

Endpoints que Cursor implementará (documentar contrato, no código):

```
POST /api/automation/webhooks/inbound     # callback n8n firmado
GET  /api/automation/events               # catálogo eventos tenant
POST /api/automation/config               # guardar mapa evento→workflow
GET  /api/automation/config
POST /api/automation/actions/create-task
POST /api/automation/actions/create-user-virtual
POST /api/automation/actions/trigger-workflow
GET  /api/automation/executions           # logs paginados
POST /api/automation/playbooks/{key}/run  # ejecución manual
```

Incluir schemas Zod-equivalentes en YAML y ejemplos curl.

---

### G-N8N-04 — Catálogo Empleados Virtuales + Tareas Complejas

**Entregable:** `docs/automation/VIRTUAL_WORKERS_PLAYBOOKS.md`

Definir 10 “empleados virtuales” preconfigurados:

| Virtual Worker | Rol NOP | Playbooks | Horario | Entitlement SKU |
|----------------|---------|-----------|---------|-----------------|
| Ana Reposición | deposito | stock-bajo, OC | Lun-Vie 8-18 | automation.n8n_hub |
| Bot Caja Noche | cajero | cierre-z reminder | Diario 22:00 | ops.cash_reconciliation |
| Leo Cobranzas | vendedor | morosos WA | Mar/Jue 10:00 | channel.whatsapp |
| … | … | … | … | … |

Para cada uno: parámetros editables, tareas que genera, escalamiento humano.

---

### G-N8N-05 — Copy UI módulo Automatización

**Entregable:** `docs/automation/UI_COPY_ES_AR.md`

Textos para:
- Empty states
- Tooltips parámetros
- Mensajes error (secret inválido, cuota excedida, n8n unreachable)
- Onboarding wizard 4 pasos: Conectar → Elegir playbook → Probar → Activar

Tono: PyME argentina, sin “enterprise fluff”.

---

### G-N8N-06 — Suite de pruebas manuales + casos borde

**Entregable:** `docs/automation/TESTING_N8N.md`

- 20 casos de prueba manual
- 10 casos borde (webhook duplicado, timeout n8n, payload inválido, tenant sin entitlement)
- Checklist go-live n8n self-hosted (Docker compose ejemplo en doc, no en repo prod)

---

### G-N8N-07 — Comparativa n8n vs Ops determinísticos NOP

**Entregable:** tabla en `docs/automation/N8N_VS_OPS.md`

| Caso | Usar n8n | Usar lib/ops rule-based |
|------|----------|-------------------------|
| Cobranza multi-paso con CRM externo | ✅ | ❌ |
| Stock bajo simple | ❌ | ✅ Procurement Guardian |
| … | … | … |

Evitar duplicar lógica: **rule-based primero, n8n cuando hay 3+ sistemas externos**.

---

## Eventos NOP estándar (para plantillas Gemini)

```typescript
// Contrato evento — Gemini documentar cada uno con payload ejemplo
type NopAutomationEvent =
  | "VENTA_EMITIDA"
  | "NC_EMITIDA"
  | "STOCK_BAJO"
  | "CAJA_ABIERTA"
  | "CAJA_CERRADA"
  | "CIERRE_Z_EJECUTADO"
  | "CAE_RECHAZADO"
  | "CAE_OBTENIDO"
  | "PEDIDO_CONFIRMADO"
  | "OC_CREADA"
  | "CUENTA_VENCIDA"
  | "APROBACION_PENDIENTE"
  | "USUARIO_CREADO"
  | "TURNO_AGENDA_CREADO"
  | "WEBHOOK_TEST"
```

Payload envelope:

```json
{
  "eventId": "uuid",
  "event": "STOCK_BAJO",
  "empresaId": 1,
  "timestamp": "2026-06-19T10:00:00Z",
  "idempotencyKey": "empresa-1-stock-42-20260619",
  "data": { },
  "signature": "hmac-sha256-hex"
}
```

---

## Pricing sugerido (Gemini documentar en G-N8N-01)

| SKU | Precio ARS/mes | Usage |
|-----|----------------|-------|
| `automation.n8n_hub` | $12.000 base | Incluye 2.000 eventos/mes |
| Evento adicional | $8 / 100 eventos | |
| Playbook premium (soporte NOP) | +$5.000 | por playbook activo |

---

## Orden de ejecución Gemini

```
G-N8N-01 (doc hub) 
  → G-N8N-03 (OpenAPI contrato)
  → G-N8N-02 (templates JSON — depende de contrato)
  → G-N8N-04 (virtual workers)
  → G-N8N-05 (copy UI)
  → G-N8N-06 (testing)
  → G-N8N-07 (vs ops)
```

---

## Prompt único para pegar en Gemini (inicio rápido)

```markdown
Sos documentador técnico de NOP (Need of Retail), plataforma retail LatAm.

Leé PROMPT_GEMINI_NOP_N8N.md en el repo y ejecutá **G-N8N-01** primero.

Stack: Next.js 15, Prisma, PostgreSQL, workflows con WorkflowStep tipo webhook.

Entregá `docs/automation/NOP_AUTOMATION_HUB.md` con:
- 15 eventos con payload JSON
- Arquitectura NOP↔n8n (webhook saliente + API entrante + HMAC)
- Sección exclusiva parametrización en /dashboard/automatizacion
- Empleados virtuales y playbooks parametrizables
- Sin código TypeScript — solo docs y diagramas Mermaid

Cuando termines G-N8N-01, seguí con G-N8N-03 OpenAPI antes de los JSON n8n.
```

---

## Referencias en repo (para Gemini)

| Archivo | Uso |
|---------|-----|
| `prisma/schema.prisma` | WorkflowRubro, WorkflowStep (tipo webhook), WorkflowInstancia |
| `lib/events/event-bus.ts` | Eventos existentes |
| `lib/config/rubro-config-service.ts` | FEATURES.WEBHOOKS_SALIENTES |
| `lib/pendientes/pendientes-service.ts` | Fuente tareas sistema |
| `introspeccionfinal1.txt` | WebhookConfig diseño previo |
| `TAREAS_CURSOR_NOP_N8N.md` | **NO tocar — implementación Cursor** |

---

*Fin prompt Gemini — versión 1.0*
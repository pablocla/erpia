# Gemini — Tareas pendientes post-P3/P4 (Cursor)

> **Fecha:** 2026-06-19  
> **Estado:** G-SYNC-01 … G-SYNC-08 cerrados por Cursor.  
> Cursor cerró C1–C14 + P3/P4 + FCE MiPyME + documentación automation.  
> Este archivo queda como registro histórico; no hay tareas Gemini pendientes en automation.

---

## Prioridad alta — sincronizar con código real

### G-SYNC-01 — Actualizar OpenAPI (`docs/automation/OPENAPI_AUTOMATION.yaml`) ✅ Cursor 2026-06-19

Agregar endpoints que Cursor ya implementó:

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/automation/poll` | `X-NOP-Api-Key` + `X-NOP-Empresa-Id` |
| POST | `/api/automation/poll` | ACK `{ ids: string[] }` |
| GET | `/api/platform/suscripciones` | JWT |
| POST | `/api/platform/suscripciones` | JWT admin |

Incluir en schemas:
- `metadata.modoConexion`: `webhook` | `poll` | `both`
- Respuesta poll: `{ events: PollQueueItem[], hasMore, count }`
- Errores: `402 module_not_entitled`, `usage_limit_exceeded`

---

### G-SYNC-02 — Actualizar `NOP_AUTOMATION_HUB.md` ✅ Cursor 2026-06-19

Secciones nuevas requeridas:
1. **Modo C (Poll)** — flujo n8n Schedule → GET poll → POST ack
2. **Entitlements comerciales** — `ProductoComercial`, `SuscripcionModulo`, `UsageEvent`, cascada
3. **Evento `PEDIDO_ML_RECIBIDO`** (C14)
4. Enlace cruzado a wiki embebida: `/dashboard/documentacion/funcional/automation-api-poll`

---

### G-SYNC-03 — Plantilla n8n poll (`docs/automation/n8n-templates/09-poll-consumer.json`) ✅ Cursor 2026-06-19

Workflow importable:
- Schedule Trigger cada 3 min
- HTTP GET `{{$env.NOP_BASE_URL}}/api/automation/poll?limit=50`
- Headers: `X-NOP-Api-Key`, `X-NOP-Empresa-Id`
- Loop eventos → procesar envelope
- HTTP POST ack con `ids`

Variables: `NOP_BASE_URL`, `NOP_API_KEY`, `NOP_EMPRESA_ID`

---

## Prioridad media — ampliar entregables existentes

### G-SYNC-04 — `TESTING_N8N.md` ✅ Cursor 2026-06-19

Agregar 5+ casos:
- Modo poll: emitir evento con `modoConexion: poll` → GET poll devuelve envelope
- Límite mensual excedido → UI muestra mensaje plan superado
- Modo `both`: webhook + cola poll simultáneos
- POST ack libera cola
- Suscripción demo vs tenant sin SKU

---

### G-SYNC-05 — `UI_COPY_ES_AR.md` ✅ Cursor 2026-06-19

Agregar copy para:
- Selector "Modo de conexión n8n" (webhook / poll / both)
- Card "Plan y uso del mes"
- Tooltip poll: "Usá Poll si tu firewall bloquea POST salientes"

---

### G-SYNC-06 — `N8N_VS_OPS.md` ✅ Cursor 2026-06-19

Fila nueva: **Firewall estricto / sin egress** → Poll ✅, Webhook ❌

---

## Prioridad baja — comercial y docs wiki

### G-SYNC-07 — `content/docs/roadmap/comercial-automation.mdx` ✅ Cursor 2026-06-19

Alinear pricing con `ProductoComercial` seed ($29.900 automation.n8n_hub, 10k eventos).

### G-SYNC-08 — Revisar 8 plantillas n8n (G-N8N-02) ✅ Cursor 2026-06-19

Validar que URLs y headers coincidan con OpenAPI actualizado post G-SYNC-01.

---

## Lo que Gemini NO debe hacer

- ❌ Modificar `lib/`, `app/`, `prisma/`, `components/`
- ❌ Editar `TAREAS_CURSOR_NOP_N8N.md` (solo Cursor)
- ❌ Reescribir wiki `content/docs/` ya creada por Cursor (solo proponer diffs o ampliaciones)

---

## Prompt rápido para Gemini

```
Leé docs/automation/GEMINI_PENDIENTE_P4.md y ejecutá G-SYNC-01 → G-SYNC-03 en orden.
Cursor ya implementó poll + entitlements. Alineá OpenAPI y docs sin código TS.
```
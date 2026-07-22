# Prompt para Gemini — Seguridad P0/P1 + madurez + Claver Cloud

> Copiá desde la sección **PROMPT (pegar en Gemini)** hasta el final del bloque.
> Contexto del repo: `pos-system-argentina` (Claver ERP multi-tenant).
> Fuente de verdad seguridad: `docs/seguridad/RELEVAMIENTO_ALERTAS_Y_DESASTRES.md`
> Fuente Claver Cloud: `docs/operaciones/CLAVER_CLOUD_SUPERADMIN.md`, `docs/operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md`
> Convenciones: `AGENTS.md`

---

## PROMPT (pegar en Gemini)

```
Sos ingeniero senior full-stack + seguridad de producto en el monorepo Claver (Next.js 15 App Router, TypeScript strict, Prisma → PostgreSQL multi-tenant, JWT jose, Vercel, Tailwind/shadcn).

Tu misión en ESTA sesión es cerrar gaps de:
1) Ciberseguridad P0/P1 (webhooks, cron, secrets, rate limit, fail-closed)
2) Madurez operativa (observabilidad SEV, health, kill-switches, docs IR/DR)
3) Conexión real ERP tenant ↔ Claver Cloud (torre analista, ops, alertas de plataforma, impersonación, billing)

NO reescribas el ERP. NO inventes módulos de marketing. Preferí parches mínimos, tests Vitest, y patrones existentes del repo.

═══════════════════════════════════════════════════════════════
A) CONTEXTO DEL SISTEMA (leé antes de codear)
═══════════════════════════════════════════════════════════════

Stack y patrones (AGENTS.md):
- API: app/api/{module}/route.ts → getAuthContext(request) + whereEmpresa(empresaId)
- Dashboard tenant: app/dashboard/*
- Claver Cloud (ops interno): /claver-cloud/* — cookie JWT, CLAVER_ANALYST_EMAILS o rol analista_claver
- Multi-tenant: NUNCA devolver datos sin filtrar empresaId
- Locale es-AR, moneda ARS

Docs obligatorias a leer:
1. docs/seguridad/RELEVAMIENTO_ALERTAS_Y_DESASTRES.md  ← hallazgos S-01…S-17 + playbooks DR
2. docs/deploy/VERCEL_ENV.md + docs/deploy/RUNBOOK.md
3. docs/operaciones/CLAVER_CLOUD_SUPERADMIN.md
4. docs/operaciones/CLAVER_CLOUD_PROCESO_IMPLEMENTACION.md
5. middleware.ts (RUTAS_PUBLICAS)
6. lib/auth/webhook-guard.ts
7. lib/auth/empresa-guard.ts / rate-limiter.ts
8. lib/monitoring/error-logger.ts

Claver Cloud ya tiene (no duplicar):
- /claver-cloud/organizations, superadmin, billing, tenants/[id], operations, marketplace, implementation
- APIs /api/claver/* (dashboard flota, tenants, impersonate, playbooks, config, billing)
- Impersonación JWT 2h + auditoría (documentada)
- Ops jobs / worker: app/api/ops/worker/execute (OPS_WORKER_SECRET)
- Go-live: GET /api/go-live/status (hoy público — ver S-06)

═══════════════════════════════════════════════════════════════
B) OBJETIVO DE PRODUCTO
═══════════════════════════════════════════════════════════════

Pasar de “piloto con cimientos” a “plataforma operable desde Claver Cloud con seguridad mínima de go-live”:

1. Entradas públicas (webhooks/cron/demo) endurecidas.
2. Fail-closed en producción (sin secrets = 401/500 controlado, nunca open).
3. Claver Cloud ve SALUD de flota + eventos de seguridad/ops (no solo MRR).
4. Un solo canal de alertas de plataforma (Slack/Sentry/log) + UI Cloud “Estado plataforma”.
5. Documentar IR/DR cortos y checklist gate pre-prod.

Madurez target (después de tu PR):
| Dimensión              | De          | A                    |
| Auth multi-tenant      | media-alta  | alta (sin fallbacks) |
| Webhooks/cron          | media-baja  | alta                 |
| Rate limit             | baja        | media (Redis o edge si hay env; si no, mejor in-memory + documentar) |
| Observabilidad         | baja        | media (Sentry + health + Cloud panel) |
| DR                     | nulo        | docs + health gates  |
| Cloud ↔ tenant         | parcial     | panel seguridad/ops cableado |

═══════════════════════════════════════════════════════════════
C) TRABAJO OBLIGATORIO — FASE 1 SEGURIDAD P0 (hacer primero)
═══════════════════════════════════════════════════════════════

### S-01 — Mercado Pago webhook legacy SIN firma
Archivos:
- app/api/mercadopago/webhook/route.ts  ← PELIGROSO (sin validarFirmaWebhook)
- app/api/webhooks/mercadopago/route.ts ← canónico CON firma

Acción:
1. En la ruta legacy: NO procesar payments sin firma.
2. Opción preferida: reexportar/delegar al handler canónico O devolver 410 Gone con log.
3. Si se mantiene por compat: exigir validarFirmaWebhook + resolver empresa por external_reference/payment (NO iterar todos los MercadoPagoConfig activos a ciegas).
4. Actualizar docs/deploy/VERCEL_ENV.md: una sola URL de webhook pública.
5. Test: firma inválida → 401; sin body type payment → ack seguro.

### S-02 — Twilio firma placeholder (return true)
Archivo: lib/auth/webhook-guard.ts

Acción:
1. Implementar validación real de X-Twilio-Signature (HMAC de URL + params ordenados, o SDK twilio si ya está en package.json).
2. En production sin TWILIO_AUTH_TOKEN: fallar cerrado (false).
3. En non-prod: permitir solo si ALLOW_INSECURE_WEBHOOKS=1 (documentar).
4. Test unitario con vector conocido o mock.

### S-03 — Cron secret en query string
Archivos: app/api/cron/** (empezar por trial-dunning)

Acción:
1. En NODE_ENV=production: SOLO Authorization: Bearer $CRON_SECRET.
2. Rechazar ?secret= en production (401).
3. En dev: permitir query solo si CRON_SECRET seteado y NODE_ENV !== production.
4. Helper reutilizable: lib/auth/cron-guard.ts (authorizeCronRequest) y usarlo en todos los cron.

### S-04 — Diseño (no bloquear P0 si es grande) certs AFIP
- Documentar en docs/seguridad/ plan de cifrado at-rest (envelope encryption).
- Si hay tiempo: helper encrypt/decrypt con AFIP_CERTS_ENCRYPTION_KEY; migrar escritura nueva; lectura dual (plain|encrypted).
- NO romper emisión CAE existente.

### S-05 — Rate limit
- Si existe Upstash/Redis en env: adaptar lib/auth/rate-limiter.ts a store distribuido.
- Si NO: mantener in-memory pero:
  a) aplicarlo también a webhooks (por IP, límites altos) y /api/auth/demo
  b) documentar límite en VERCEL_ENV
  c) exponer contador 429 en log estructurado

### S-07 — Fail-closed JWT
Buscar strings tipo "dev-pos-system-argentina" / fallbacks inseguros (ej. public reporting).
En production: throw o 500 si falta JWT_SECRET; NUNCA firmar con default.

### S-08 — Demo en prod
app/api/auth/demo:
- Si NODE_ENV=production && process.env.ALLOW_DEMO !== "1" → 403.
- Rate limit más estricto.
- Log estructurado de cada demo login.

### S-06 — go-live/status y health
- /api/go-live/status: en production exigir auth analista O devolver solo booleans agregados sin nombres de variables sensibles en lista de “faltantes” (o gate con CRON_SECRET/ops).
- /api/health: liveness público mínimo { ok, db } sin env detallado; detalles extendidos solo con auth ops.

═══════════════════════════════════════════════════════════════
D) FASE 2 — MADUREZ + ALERTAS DE PLATAFORMA
═══════════════════════════════════════════════════════════════

### D1. Modelo de eventos de plataforma (ligero)
Crear (o extender si existe) tabla o log unificado, preferí reutilizar prisma si hay OpsLog / SistemaLog / logActividad:

Tipo PlatformEvent:
- severity: sev1|sev2|sev3|sev4
- source: health|webhook|cron|auth|afip|billing|worker
- code: string (ej. WEBHOOK_SIG_INVALID, DB_DOWN, CRON_UNAUTHORIZED)
- empresaId?: number
- meta: Json
- createdAt

Servicio: lib/ops/platform-events.ts
  - recordPlatformEvent(...)
  - listRecentEvents(limit, filters)
Integrar en: webhook-guard (firmas inválidas), cron 401, health db error (al fallar checks internos), error-logger severity fatal.

### D2. Panel Claver Cloud — “Salud & Seguridad”
Nueva ruta UI (o pestaña en superadmin):
  /claver-cloud/platform-health
  o tab en /claver-cloud/superadmin

Debe mostrar:
1. Status agregado: GET /api/health (server-side desde Cloud API, no exponer de más)
2. Checklist env (reusar getEnvPresenceChecklist pero SOLO para analistas autenticados)
3. Últimos PlatformEvents (tabla)
4. Contadores 24h: firmas inválidas, 401 cron, errores worker
5. Links a: tenants ruidosos (/api/ops/tenant-nav-health), billing, marketplace cola

API nueva:
  GET /api/claver/platform-health
  - Auth: solo analista Claver / CLAVER_ANALYST_EMAILS / rol adecuado
  - Nunca para tenant normal
  - Respuesta: { health, envPresence, events[], counters }

### D3. Sentry / logging
- Asegurar SENTRY_DSN documentado
- logError ya existe: al severity fatal → recordPlatformEvent sev1
- No spamear: rate-limit de eventos iguales (mismo code) a 1/min en memoria

### D4. Docs IR/DR cortos
Crear/actualizar:
  docs/seguridad/PLAYBOOKS_IR_DR.md
  - DR-1 DB down (pasos del relevamiento)
  - DR-2 rotar JWT
  - DR-3 webhook pagos
  - DR-4 AFIP cert
  - Contactos/canales placeholder (#sec-alerts)
  - Checklist gate pre-go-live (sección 10 del relevamiento) marcada con qué se automatizó

═══════════════════════════════════════════════════════════════
E) FASE 3 — CONEXIÓN ERP TENANT ↔ CLAVER CLOUD (proyecto)
═══════════════════════════════════════════════════════════════

Objetivo: el analista en Cloud “ve y opera” el tenant sin romper multi-tenant.

### E1. Mapa de conexión (implementar lo que falte, no inventar paralelo)

| Capacidad | Tenant (ERP) | Cloud | Tu trabajo |
|-----------|--------------|-------|------------|
| Alta / trial | signup, demo, onboarding | /claver-cloud/registros | Asegurar eventos de alta llegan a Cloud (log + listado) |
| SKUs / packs | marketplace activate | tenants/[id] productos | Verificar provision usa mismo product-registry |
| Impersonar | dashboard con banner | POST impersonate | Auditar: logActividad + PlatformEvent sev3 IMPERSONATION_START |
| Ops jobs | — | operations, worker | Worker secret fail-closed; eventos job error → platform-health |
| Billing | paywall tenant | /claver-cloud/billing | Flag inconsistencias trial vencido sin pago |
| Go-live pack | PRD packs | /claver-cloud/go-live si existe | Alinear status con docs/GO_LIVE_PRD.md |
| Nav ruido | modoLite/rubro | tenant-nav-health | Exponer summary en platform-health |
| Alertas negocio | centro-alertas tenant | (opcional) summary por tenant en detalle | NO mezclar con security events |
| Seguridad | — | platform-health | Nuevo |

### E2. Impersonación (seguridad)
- Verificar claims: rol analista, TTL 2h, empresaId target, flag impersonatedBy
- Banner en dashboard si sesión impersonada (si no existe, agregar)
- Cada impersonate → log + platform event
- Prohibir impersonar desde token ya impersonado (no chain)

### E3. Middleware / rutas Cloud
- /claver-cloud/* ya pide cookie JWT
- Asegurar APIs /api/claver/* validan analista (no solo empresaId del token de un tenant random)
- Revisar que un dueño de kiosco NO pueda llamar /api/claver/platform-health

### E4. Cableado de “madurez comercial” visible en Cloud
En tenant detail o platform-health, badges:
- securityScore simplificado: (jwt ok, webhooks ok, demo off, cron secret ok, sentry ok) 0–100
- readiness comercial (ya existe readiness) separado de securityScore

═══════════════════════════════════════════════════════════════
F) REGLAS DE IMPLEMENTACIÓN
═══════════════════════════════════════════════════════════════

1. TypeScript strict; sin any innecesarios.
2. Toda API nueva Cloud: auth analista primero.
3. Toda API tenant: getAuthContext + whereEmpresa.
4. Tests Vitest para:
   - cron-guard (prod rechaza query secret)
   - webhook-guard Twilio (mock)
   - mercadopago webhook legacy no procesa sin firma
   - platform-health 403 para rol no analista
   - demo 403 en prod sin ALLOW_DEMO
5. No commitees secretos. Actualizá docs/deploy/VERCEL_ENV.md con vars nuevas:
   ALLOW_DEMO, ALLOW_INSECURE_WEBHOOKS, AFIP_CERTS_ENCRYPTION_KEY (si aplica), SENTRY_DSN, CRON_SECRET, OPS_WORKER_SECRET, WEBHOOK_SECRET, TWILIO_AUTH_TOKEN, MP_WEBHOOK_SECRET
6. Si tocás prisma/schema: migración mínima + comentario; preferí reutilizar modelos de log existentes.
7. UI Cloud: shadcn, español es-AR, coherente con superadmin existente.
8. No rompas tests existentes; corré:
   npx vitest run __tests__/auth __tests__/ops
   y los nuevos que agregues.

═══════════════════════════════════════════════════════════════
G) ORDEN DE ENTREGA (PRs lógicos / commits mentales)
═══════════════════════════════════════════════════════════════

PR-A (P0 seguridad entradas):
  S-01, S-02, S-03, S-07, S-08 + tests

PR-B (superficie pública):
  S-06 health/go-live + rate limit mejoras S-05

PR-C (platform events + Cloud UI):
  D1, D2, D3 + E2 impersonation audit

PR-D (docs + score + wire):
  D4 playbooks, E1/E4 securityScore, VERCEL_ENV update

Si no podés hacer todo: completá PR-A completo antes de UI bonita.

═══════════════════════════════════════════════════════════════
H) CRITERIOS DE ACEPTACIÓN
═══════════════════════════════════════════════════════════════

- [ ] No existe procesamiento MP sin firma en ninguna ruta viva
- [ ] Twilio no acepta webhooks con solo header presente
- [ ] Production cron rechaza ?secret=
- [ ] Production sin JWT_SECRET no firma tokens con default
- [ ] Demo bloqueado en prod salvo ALLOW_DEMO=1
- [ ] Analista ve /claver-cloud/platform-health (o tab) con health + eventos
- [ ] Tenant no-analista recibe 403 en APIs /api/claver/platform-health
- [ ] Impersonación deja rastro auditable
- [ ] docs/seguridad/PLAYBOOKS_IR_DR.md existe
- [ ] docs/deploy/VERCEL_ENV.md actualizado
- [ ] Vitest verde en suites tocadas
- [ ] Actualizá docs/seguridad/RELEVAMIENTO_ALERTAS_Y_DESASTRES.md tabla de estado (Hecho/Parcial)

═══════════════════════════════════════════════════════════════
I) FUERA DE SCOPE (NO HACER)
═══════════════════════════════════════════════════════════════

- Pentest ofensivo / exploits
- Reescritura de Prisma schema masiva
- Nuevo producto comercial / landing
- Cambiar packs go-live PRD de negocio
- Multi-región real o backup provider (solo documentar y health)
- Mezclar alertas de stock/fiado del tenant con SEV de seguridad en el mismo feed sin tags

═══════════════════════════════════════════════════════════════
J) FORMATO DE RESPUESTA AL USUARIO
═══════════════════════════════════════════════════════════════

Al terminar, reportá:
1. Archivos tocados (lista)
2. P0 cerrados vs parciales
3. Cómo probar manualmente (curl/UI)
4. Variables de entorno nuevas
5. Riesgos residuales
6. Qué dejó listo para que Grok continúe (si aplica)

Empezá por leer los archivos citados, inventariar estado real (no asumas que el relevamiento está 100% actualizado), y ejecutá PR-A.
```

---

## Cómo usarlo (Pablo)

1. Abrí Gemini en el workspace del repo `pos-system-argentina`.
2. Pegá el bloque **PROMPT**.
3. Si el contexto se llena, pedile solo: *“Ejecutá PR-A completo y pará”*.
4. Cuando Gemini cierre PR-A, pasale: *“Seguí con PR-B y PR-C”*.
5. Grok puede revisar/mergear y corregir colaterales (como con Buen día / maestros).

### Prompt corto de seguimiento (si se corta la sesión)

```
Continuá el plan de docs/seguridad/PROMPT_GEMINI_SEGURIDAD_MADUREZ_CLAVER_CLOUD.md.
Estado: [PR-A hecho / parcial].
Siguiente: PR-B o PR-C.
No reescribas lo ya mergeado; leé git diff y seguí criterios de aceptación de la sección H.
```

### Prompt de review (para Grok u otro agente)

```
Revisá el trabajo de Gemini sobre seguridad + Claver Cloud según
docs/seguridad/RELEVAMIENTO_ALERTAS_Y_DESASTRES.md y
docs/seguridad/PROMPT_GEMINI_SEGURIDAD_MADUREZ_CLAVER_CLOUD.md.
Verificá P0 S-01..S-03, S-07, S-08, tests, y que platform-health no sea accesible a tenants.
Arreglá regresiones; no agregues scope.
```

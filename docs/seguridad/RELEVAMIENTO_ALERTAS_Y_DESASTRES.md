# Relevamiento de ciberseguridad — Alertas y desastres

**Clasificación:** Interno · Seguridad de producto  
**Rol emisor:** Ingeniería de ciberseguridad (Claver)  
**Fecha:** 2026-07-22  
**Alcance:** Plataforma multi-tenant Claver (Next.js 15 + Prisma/PostgreSQL + Vercel/Supabase)  
**Enfoque:** **Detección (alertas)** + **respuesta ante incidentes y desastres (DR)**  
**No es:** Auditoría formal ISO 27001 / pentest con PoC ofensivo

---

## 1. Resumen ejecutivo

Claver opera un ERP/POS multi-tenant con datos fiscales (AFIP), cobros (Mercado Pago), PII de clientes, historial clínico (nichos), WhatsApp y automatizaciones. La **superficie de ataque es alta** por volumen de APIs (`app/api/*` ~100+ módulos), webhooks públicos y jobs de ops.

| Dimensión | Madurez actual | Nota |
|-----------|----------------|------|
| Autenticación JWT + multi-tenant | **Alta** | Fail-closed JWT (`lib/auth/jwt-secret.ts`); middleware + `whereEmpresa` |
| Control de webhooks / cron | **Alta** | Firmas Twilio/MP; cron-guard sin `?secret=` en prod |
| Rate limiting | **Baja-media** | In-memory; auth endpoints (Redis pendiente) |
| Observabilidad / SIEM | **Media** | Platform events + `/claver-cloud/platform-health` + Sentry opcional |
| Backup / DR | **Docs** | Playbooks IR/DR; restore drill aún manual |
| Alertas de producto (negocio) | **Media** | Centro de alertas / IA / n8n — no es SOC |
| Respuesta a incidentes | **Media** | `docs/seguridad/PLAYBOOKS_IR_DR.md` + panel Cloud |

**Veredicto:** apto para **piloto / early go-live controlado** si se cierran los P0 de esta lista. **No** apto aún para “garantía enterprise de continuidad” sin DR formal, webhook hardening y monitoreo 24/7.

---

## 2. Activos críticos (qué proteger)

| Activo | Impacto si se pierde / filtra | Ubicación típica |
|--------|-------------------------------|------------------|
| **JWT_SECRET** | Suplantación total de sesiones | Env Vercel |
| **DATABASE_URL** | Lectura/escritura de todos los tenants | Env + pooler |
| **Certificados AFIP (CRT/KEY)** | Emisión fraudulenta / robo de identidad fiscal | DB `empresa.certificado*` (+ env prod) |
| **MP_ACCESS_TOKEN / webhook secret** | Cobros falsos, activaciones sin pago | Env |
| **Tokens Twilio / WA** | Spam, phishing a clientes del tenant | Env |
| **Datos de tenant** (ventas, CxC, HC, stock) | Daño comercial + legal (PII/salud) | PostgreSQL multi-tenant |
| **Ops worker / cron secrets** | Ejecución de jobs, deploys, dunning | `CRON_SECRET`, `OPS_WORKER_SECRET` |
| **Demo admin** | Pivot a datos demo (riesgo menor) o abuso de recurso | `/api/auth/demo` |

---

## 3. Superficie de ataque (mapa)

### 3.1 Rutas **sin JWT** (middleware `RUTAS_PUBLICAS`)

```
/api/auth/* (login, demo, signup, google, forgot/reset, refresh)
/api/ecommerce, /api/ai/onboarding, /api/ai/valor-rubro
/api/health
/api/onboarding
/api/comercial/consultas
/api/webhooks/*
/api/cron/*
/api/public/*
```

Cualquier endpoint bajo esos prefijos **debe** implementar su propia autenticación (firma, secret, token público acotado). Fallos ahí son **críticos**.

### 3.2 Canales de entrada de alto riesgo

| Canal | Auth actual | Riesgo residual |
|-------|-------------|-----------------|
| JWT Bearer API | Middleware + `jose` | Robo de token (XSS/localStorage); secret débil en dev |
| Cookie Claver Cloud | JWT cookie | Session fixation / CSRF en mutaciones cookie-based |
| `/api/webhooks/*` | Firmas parciales (`webhook-guard`) | Twilio: validación **placeholder true** |
| `/api/mercadopago/webhook` | **Sin firma** (ack 200) | Duplicado inseguro vs `/api/webhooks/mercadopago` |
| `/api/cron/*` | Bearer o **`?secret=`** | Secret en query logs/CDN |
| `/api/ops/worker/execute` | `OPS_WORKER_SECRET` | Sin secret en non-prod = abierto |
| `/api/health` | Público | Info de uptime/env (aceptable si acotado) |
| `/api/go-live/status` | Público | **Checklist de presencia de secretos** (recon) |
| `/api/public/reporting/*` | Public Bearer JWT | Superficie de data export si token filtra |
| Demo login | Rate limit in-memory | Credenciales conocidas; abuso de provision |

### 3.3 Multi-tenant

- Patrón canónico: `getAuthContext` + `whereEmpresa(empresaId)`.
- **Riesgo:** cualquier ruta nueva sin ese filtro = IDOR entre empresas.
- Headers `x-user-id` / `x-empresa-id` inyectados por middleware **no son confianza** si un cliente los reenvía: las rutas deben revalidar JWT, no confiar solo en headers.

---

## 4. Hallazgos priorizados (seguridad)

### P0 — Corregir antes de escala comercial

| ID | Hallazgo | Evidencia | Impacto | Acción recomendada |
|----|----------|-----------|---------|-------------------|
| **S-01** | Webhook MP **sin firma** en ruta legacy | **HECHO** — legacy exige firma + mismo handler canónico | — | — |
| **S-02** | Twilio webhook: firma placeholder | **HECHO** — HMAC-SHA1 real en `webhook-guard` | — | — |
| **S-03** | Secretos de cron en query string | **HECHO** — `lib/auth/cron-guard.ts` rechaza `?secret=` en prod | — | — |
| **S-04** | Certificados AFIP en DB en claro (base64) | `empresa.certificadoCRT/KEY` | Compromiso DB = identidad fiscal | Cifrado en reposo (pendiente) |
| **S-05** | Rate limit solo en memoria | `lib/auth/rate-limiter.ts` | Bypass serverless | Redis/Upstash (pendiente) |

### P1 — Alto, planificar en 2–4 semanas

| ID | Hallazgo | Acción |
|----|----------|--------|
| **S-06** | `/api/go-live/status` expone secretos | **HECHO** — público: counts; detalle solo analista/cron |
| **S-07** | Fallback JWT inseguro | **HECHO** — `getEncodedJwtSecret()` fail-closed en prod |
| **S-08** | Demo endpoint en prod | **HECHO** — 403 salvo `ALLOW_DEMO=1` |
| **S-09** | Webhook Vercel ops sin firma verificada en código leído | Validar secret de Vercel; no confiar en body crudo |
| **S-10** | Observabilidad incompleta | Sentry obligatorio en prod; alertas en `fatal` (DB down); dashboard uptime |
| **S-11** | Sin inventory de IDOR | Script CI que falle si route `app/api` no importa `getAuthContext` (except allowlist) |
| **S-12** | Tokens en client (Zustand/localStorage pattern) | Preferir httpOnly cookie same-site; rotación refresh |

### P2 — Medio / higiene

| ID | Hallazgo | Acción |
|----|----------|--------|
| **S-13** | Health público detalla `env` + AFIP | Mantener liveness mínimo; details solo autenticado |
| **S-14** | bcrypt cost 8 en demo vs 10 en auth | Unificar ≥10; policies de password |
| **S-15** | Dependencias / supply chain | `npm audit`, Dependabot, pin lockfile en CI |
| **S-16** | Headers de seguridad (CSP, HSTS) | Revisar `next.config` headers en prod |
| **S-17** | Impersonation / analyst emails | Auditar `CLAVER_ANALYST_EMAILS` + logs de acceso Cloud |

---

## 5. Alertas: dos mundos que no deben confundirse

### 5.1 Alertas de **negocio** (producto)

Ya existen y son útiles para el comerciante, **no sustituyen un SOC**:

| Sistema | Función | Limitación de seguridad |
|---------|---------|-------------------------|
| `alertaIA` / centro-alertas | Stock, cobranza, anomalías | Contenido de negocio; no detecta intrusión |
| Reglas `alertas-service` | Reglas parametrizables | Falsos positivos; sin correlación multi-tenant |
| n8n playbooks (cierre caja, CAE fallido) | Ops comercial | Credenciales n8n = superficie extra |
| Empleados digitales (Leo) | Cobranza | Abuso = spam a clientes |

**Recomendación:** mantener; etiquetar en UI como “alertas operativas”, no “seguridad”.

### 5.2 Alertas de **seguridad / plataforma** (faltantes o débiles)

| Señal | Estado actual | Target |
|-------|---------------|--------|
| Picos 401/403 por IP | No centralizado | Alerta 5 min si > N |
| Fallos JWT_SECRET / config | Solo fail en middleware prod | Alert deploy |
| DB unreachable | health 503 + log fatal | PagerDuty/Slack on-call |
| Webhook firma inválida (ratio) | Logs dispersos | Métrica + alerta |
| Cambio de rol admin / nuevo superuser | `logActividad` parcial | Alert + review |
| Emisión AFIP masiva anómala | No | Anomaly por empresa |
| Deploy failed (Vercel webhook) | Ops job update | Canal #deploys |
| Backup fallido | **No observado** | Alert del proveedor DB |

### 5.3 Matriz mínima de alertas SOC-lite (implementar)

| Severidad | Condición | Canal | SLA ack |
|-----------|-----------|-------|---------|
| **SEV-1** | DB down > 2 min o health 503 sostenido | SMS/call + Slack | 15 min |
| **SEV-1** | Indicio de fuga JWT / rotación forzada | Call | 15 min |
| **SEV-2** | >50 firmas webhook inválidas / 10 min | Slack | 1 h |
| **SEV-2** | Brute force login (post-Redis limit) | Slack | 1 h |
| **SEV-3** | Deploy error / cron dunning fail | Slack #ops | 4 h |
| **SEV-3** | AFIP degraded en health | Slack | 4 h |
| **SEV-4** | Cert AFIP próximo a vencer (por tenant) | Email ops + tenant | 1 semana |

---

## 6. Desastres y continuidad (DR)

### 6.1 Escenarios de desastre relevantes a Claver

| Escenario | Probabilidad | Impacto | RPO/RTO objetivo sugerido |
|-----------|--------------|---------|---------------------------|
| **D1** Caída DB (Supabase/Railway) | Media | Total | RPO 15 min · RTO 1–4 h |
| **D2** Borrado/corrupción lógica multi-tenant | Baja | Catastrófico | RPO 24 h restore point · RTO 8 h |
| **D3** Compromiso JWT_SECRET | Baja | Alto (re-login global) | RTO 1 h (rotar + invalidar) |
| **D4** Compromiso certs AFIP | Baja | Legal/fiscal | RTO 4 h (revocar + reemitir) |
| **D5** Caída Vercel / región | Media | Total front/API | RTO 2 h (redeploy / multi-region futuro) |
| **D6** Abuso webhooks / bill shock WA-IA | Media | Financiero + reputación | Contención 30 min |
| **D7** Error humano migrate / data loss | Media | Alto | RPO backup pre-migrate |
| **D8** Ransomware / dump DB filtrado | Baja | Catastrófico | IR + notificación legal |

### 6.2 Estado DR observado

| Control | Estado |
|---------|--------|
| Backups automáticos del proveedor | **Asumido** (Supabase/Railway) — **verificar** retención y restore test |
| Restore drill documentado | **No** en repo |
| Runbook de deploy | Sí (`docs/deploy/RUNBOOK.md`) |
| Runbook de incidente seguridad | **No** |
| Multi-región app | No |
| Feature freeze / kill-switch | Parcial (flags env: AI, MP mock) |
| Comunicación a tenants | No plantilla |

### 6.3 Playbooks de desastre (borrador operativo)

#### DR-1 — Base de datos caída

1. Confirmar: `GET /api/health` → `db: error`.  
2. Status page / mensaje en login.  
3. Abrir status del proveedor DB.  
4. **No** correr migraciones.  
5. Si restore: usar snapshot más reciente **probado**; validar un tenant canario.  
6. Post-mortem en 48 h.

#### DR-2 — Sospecha de fuga JWT_SECRET

1. Rotar `JWT_SECRET` en Vercel **Production**.  
2. Redeploy.  
3. Forzar re-login (tokens viejos inválidos).  
4. Revisar logs 401 spike + accesos Cloud.  
5. Notificar tenants solo si hay evidencia de abuso.

#### DR-3 — Webhook de pagos comprometido / cobros fantasma

1. Pausar procesamiento: feature flag o desactivar route.  
2. Rotar `MP_WEBHOOK_SECRET` + tokens.  
3. Reconciliar pagos vs suscripciones 24–48 h.  
4. Deshabilitar ruta legacy sin firma (**S-01**).

#### DR-4 — Certificado AFIP comprometido

1. Dejar de emitir (kill-switch por empresa o global `AFIP_ENTORNO`).  
2. Revocar cert en AFIP; generar nuevo.  
3. Re-cargar cifrado; auditar comprobantes del período.  
4. Aviso al contador del tenant.

#### DR-5 — Borrado accidental de tenant / datos

1. Congelar escrituras del tenant.  
2. Restore point-in-time (si el plan DB lo permite).  
3. Export de validación vs backup.  
4. Documentar causa (quién, cuándo, API).

---

## 7. Controles que **sí** existen (fortalezas)

1. **Middleware JWT** en APIs privadas; fail si falta `JWT_SECRET` en production.  
2. **Patrón multi-tenant** documentado (`getAuthContext` + `whereEmpresa`).  
3. **bcrypt** en passwords; Google OAuth con `EMPRESA_REQUIRED` (sin auto-empresa indebida).  
4. **Rate limit** en login/signup/forgot/demo/google/refresh.  
5. **Webhook guard** con HMAC (Meta, TN, Shopify, MP canónico) y `timingSafeEqual`.  
6. **Automation inbound** con `verifyAutomationRequest`.  
7. **Health check** DB + AFIP reachability.  
8. **Error logger** estructurado + request-id + Sentry opcional.  
9. **Public reporting** con rol `public_viewer` y validación de widget/fuente.  
10. **Docs de deploy/env** (`VERCEL_ENV.md`, `RUNBOOK.md`).

---

## 8. Plan de 30 / 60 / 90 días

### 0–30 días (contención)

- [ ] Cerrar **S-01** (MP webhook legacy) y **S-02** (Twilio).  
- [ ] Prohibir `?secret=` en prod (**S-03**).  
- [ ] Fail-closed JWT en todos los fallbacks (**S-07**).  
- [ ] Sentry + alertas SEV-1 health/DB.  
- [ ] Deshabilitar demo en prod o gate estricto (**S-08**).  
- [ ] Inventario allowlist de rutas públicas revisado en PR.

### 30–60 días (detección)

- [ ] Rate limit distribuido (Redis/Upstash).  
- [ ] Métricas: 401, firmas inválidas, latencia p95, errores Prisma.  
- [ ] Alertas Slack SEV-2/3.  
- [ ] CI: lint de rutas API sin `getAuthContext`.  
- [ ] Cifrado de certs AFIP en reposo (diseño + piloto).

### 60–90 días (resiliencia)

- [ ] DR drill: restore de DB en staging (medir RTO real).  
- [ ] Documentar RPO/RTO contractuales.  
- [ ] Tabletop exercise: fuga JWT + webhook MP.  
- [ ] Política de retención logs (PII) y acceso analyst Cloud.  
- [ ] Pentest externo acotado (auth, IDOR, webhooks, AFIP).

---

## 9. Roles y escalamiento (on-call)

| Rol | Responsabilidad |
|-----|-----------------|
| **On-call ingeniería** | SEV-1/2; health; deploys |
| **Ciberseguridad (este rol)** | Clasificación incidente, contención, post-mortem seguridad |
| **Ops / Claver Cloud** | Tenants, provisioning, jobs |
| **Comercial / soporte** | Comunicación a clientes (plantillas) |
| **Legal/fiscal (externo)** | AFIP, datos personales, notificación si aplica ley |

**Canales sugeridos:** `#sec-alerts` · `#ops-incidents` · runbook link en bio on-call.

---

## 10. Checklist pre-go-live seguridad (gate)

| # | Control | ¿OK? |
|---|---------|------|
| 1 | `JWT_SECRET` ≥ 32 chars, único por entorno | ☐ |
| 2 | Sin fallbacks `unsafe` en prod | ☐ |
| 3 | Solo un endpoint MP webhook **con** firma | ☐ |
| 4 | `CRON_SECRET` y `OPS_WORKER_SECRET` set; sin query secret | ☐ |
| 5 | Demo deshabilitado o acotado en prod | ☐ |
| 6 | Sentry DSN + alerta DB down | ☐ |
| 7 | Backup DB verificado (restore test ≤ 90 días) | ☐ |
| 8 | `MP_WEBHOOK_SECRET`, Twilio, WEBHOOK_SECRET seteados | ☐ |
| 9 | Revisión de `RUTAS_PUBLICAS` del mes | ☐ |
| 10 | Playbook DR-1 y DR-2 leídos por on-call | ☐ |

---

## 11. Conclusión

Claver tiene **cimientos de autenticación multi-tenant razonables** y piezas de producto de alertas de negocio maduras, pero el **plano de ciberseguridad (detección + desastre)** está incompleto:

1. La prioridad inmediata es **hardening de entradas públicas** (webhooks, cron, demo).  
2. En paralelo, **observabilidad SEV-1** (DB/health) y **cierre del webhook MP legacy**.  
3. El salto a “confiable para escala” requiere **DR con restore probado**, **cifrado de secretos fiscales** y **rate limit distribuido**.

Sin esos P0, un incidente de webhook o de secretos puede convertirse en **desastre comercial y fiscal** más rápido que un bug de UI.

---

## 12. Referencias de código (anclas)

| Tema | Path |
|------|------|
| Middleware / rutas públicas | `middleware.ts` |
| Webhook firmas | `lib/auth/webhook-guard.ts` |
| MP webhook legacy | `app/api/mercadopago/webhook/route.ts` |
| MP webhook canónico | `app/api/webhooks/mercadopago/route.ts` |
| Cron auth | `app/api/cron/trial-dunning/route.ts` |
| Ops worker | `app/api/ops/worker/execute/route.ts` |
| Health | `app/api/health/route.ts` |
| Go-live status | `app/api/go-live/status/route.ts` |
| Rate limit | `lib/auth/rate-limiter.ts` |
| Error / Sentry | `lib/monitoring/error-logger.ts` |
| Deploy env | `docs/deploy/VERCEL_ENV.md`, `docs/deploy/RUNBOOK.md` |
| Alertas negocio | `lib/alertas/*`, `app/api/centro-alertas` |

---

*Documento vivo: actualizar tras cerrar cada P0 y tras el primer DR drill.*

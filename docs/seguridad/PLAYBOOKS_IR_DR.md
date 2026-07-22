# Playbooks IR / DR — Claver

**Actualizado:** 2026-07-22  
**Relacionado:** [RELEVAMIENTO_ALERTAS_Y_DESASTRES.md](./RELEVAMIENTO_ALERTAS_Y_DESASTRES.md)

---

## Canales

| Canal | Uso |
|-------|-----|
| `/claver-cloud/platform-health` | Dashboard analistas (score, DB, eventos) |
| `GET /api/health` | Liveness público `{ ok, db }` |
| `GET /api/claver/platform-health` | Detalle (solo analista) |
| Sentry (`SENTRY_DSN`) | Errores fatal/error |
| `#sec-alerts` / `#ops-incidents` | Placeholder Slack |

---

## DR-1 — Base de datos caída

1. Confirmar: `GET /api/health` → `db: error` o 503.  
2. Revisar `/claver-cloud/platform-health` (evento `DB_DOWN`).  
3. Status del proveedor (Supabase/Railway).  
4. **No** correr migraciones.  
5. Si restore: snapshot más reciente; validar un tenant canario.  
6. Post-mortem 48 h.

## DR-2 — Fuga / rotación JWT_SECRET

1. Rotar `JWT_SECRET` en Vercel Production.  
2. Redeploy.  
3. Forzar re-login (tokens viejos inválidos).  
4. Revisar eventos auth y accesos Cloud.  
5. Notificar tenants solo si hay abuso.

## DR-3 — Webhook de pagos comprometido

1. Rotar `MP_WEBHOOK_SECRET` + revisar `MP_ACCESS_TOKEN`.  
2. Confirmar una sola URL: `/api/webhooks/mercadopago` (legacy también firma).  
3. Reconciliar suscripciones 24–48 h.  
4. Revisar contador `WEBHOOK_SIG_INVALID` en platform-health.

## DR-4 — Certificado AFIP

1. Kill-switch emisión si hace falta.  
2. Revocar cert en AFIP; generar nuevo.  
3. Re-cargar en tenant; auditar comprobantes del período.

## DR-5 — Cron / worker abusado

1. Rotar `CRON_SECRET` y `OPS_WORKER_SECRET`.  
2. Verificar que production **no** acepte `?secret=`.  
3. Revisar eventos `CRON_UNAUTHORIZED`.

---

## Controles implementados (código)

| Control | Estado |
|---------|--------|
| MP webhook sin firma | **Cerrado** — legacy + canónico exigen firma |
| Twilio firma real | **Cerrado** — HMAC-SHA1 |
| Cron `?secret=` en prod | **Cerrado** — `lib/auth/cron-guard.ts` |
| JWT fallback en prod | **Cerrado** — `lib/auth/jwt-secret.ts` |
| Demo en prod | **Cerrado** — requiere `ALLOW_DEMO=1` |
| Health público mínimo | **Cerrado** |
| go-live/status detalle | **Analista o cron** |
| Platform health Cloud | **`/claver-cloud/platform-health`** |

---

## Gate pre-go-live

- [ ] `JWT_SECRET` ≥ 32 chars por entorno  
- [ ] `CRON_SECRET` + crons con Bearer  
- [ ] `MP_WEBHOOK_SECRET` + URL canónica  
- [ ] `ALLOW_DEMO` no seteado en prod (o `0`)  
- [ ] `OPS_WORKER_SECRET` en prod  
- [ ] Sentry opcional pero recomendado  
- [ ] Restore DB probado (manual, 90 días)  

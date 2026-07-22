# Vercel — Environment Variables (sin `.env` en el server)

En Vercel **no se sube** `.env` / `.env.local`.  
Todo se configura en:

**Project → Settings → Environment Variables**

Marcás para cada variable: **Production** / **Preview** / **Development**.

El código lee `process.env.*` igual que en local. También acepta **alias** de nombres viejos del runbook.

Verificación post-deploy: `GET https://tu-dominio/api/go-live/status`  
**Política de packs go-live PRD (qué vender en prod):** [`docs/GO_LIVE_PRD.md`](../GO_LIVE_PRD.md)

---

## Obligatorias (Production)

| Variable | Dónde | Notas |
|----------|--------|--------|
| `DATABASE_URL` | Supabase/Railway **pooler** | Prisma runtime serverless |
| `DIRECT_URL` | Conexión **directa** (no pooler) | `prisma migrate` / generate. Alias: `DIRECT_DATABASE_URL` |
| `JWT_SECRET` | Random ≥ 32 chars | Firma JWT. Alias fallback: `NEXTAUTH_SECRET` |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.com` | **Sin** barra final. Build-time + runtime |
| `NEXT_PUBLIC_BASE_URL` | Igual que APP_URL | Webhooks / back_urls MP |

> Las `NEXT_PUBLIC_*` se **hornean en el build**. Si las cambiás, **redeploy**.

---

## Billing / Mercado Pago (para cobrar de verdad)

| Variable canónica | Alias aceptado | Notas |
|-------------------|----------------|--------|
| `MP_ACCESS_TOKEN` | `MERCADOPAGO_ACCESS_TOKEN` | Prod `APP_USR-...`. Si falta o `TEST-mock` → modo mock |
| `MP_PUBLIC_KEY` | `MERCADOPAGO_PUBLIC_KEY` | Checkout front si aplica |
| `MP_WEBHOOK_SECRET` | `MERCADOPAGO_WEBHOOK_SECRET` | Firma webhook |

**Webhook en panel MP:**  
`https://TU_DOMINIO/api/webhooks/mercadopago`

Opcional:
- `MARKETPLACE_CHECKOUT_MOCK=false` en Production (evita activar SKUs sin pago)
- `FORCE_MOCK_MP_PROD` — **no** poner en prod real

---

## IA (Gemini / demos / auditor)

| Variable | Notas |
|----------|--------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Preferida |
| `GEMINI_API_KEY` | Alias |
| `AI_PROVIDER` | `gemini` o `auto` en Vercel (no hay Ollama) |
| `AI_ENABLED` | `true` |
| `GEMINI_MODEL` | ej. `gemini-2.0-flash` |

---

## Partners / ops / seguridad

| Variable | Notas |
|----------|--------|
| `CLAVER_ANALYST_EMAILS` | emails con acceso Cloud, coma-separados |
| `CRON_SECRET` | **Obligatorio en prod.** Solo `Authorization: Bearer $CRON_SECRET` (no `?secret=` en prod) |
| `OPS_WORKER_SECRET` | Worker ops `/api/ops/worker/execute` — fail-closed en prod |
| `WEBHOOK_SECRET` | HMAC Meta/n8n/WhatsApp Cloud |
| `TWILIO_AUTH_TOKEN` | Validación real `X-Twilio-Signature` |
| `MP_WEBHOOK_SECRET` | Firma webhook MP (canónico + legacy) |
| `SENTRY_DSN` | Errores fatales (recomendado) |
| `ALLOW_DEMO` | Solo `1` si querés `/api/auth/demo` en production (default: bloqueado) |
| `ALLOW_INSECURE_WEBHOOKS` | Solo non-prod `1` para bypassear firmas en local |

**Webhook MP canónico:** `https://TU_DOMINIO/api/webhooks/mercadopago`  
(La ruta legacy `/api/mercadopago/webhook` también exige firma; preferí la canónica.)

**Panel analistas:** `/claver-cloud/platform-health` · API `GET /api/claver/platform-health`

Crons en `vercel.json` (trial-dunning). Plan Pro para crons + `maxDuration` altos (demo 60s).

---

## Email / WhatsApp (opcionales pero comerciales)

| Variable |
|----------|
| `RESEND_API_KEY` |
| `RESEND_FROM_EMAIL` |
| `TWILIO_ACCOUNT_SID` |
| `TWILIO_AUTH_TOKEN` |
| `TWILIO_WHATSAPP_FROM` |

---

## AFIP Multi-Tenant (Facturación Legal A/B/C)

> **Arquitectura Multi-Tenant**: Los certificados `.crt` y `.key` de cada empresa **NO se configuran globalmente en Vercel**, sino que se cargan de forma independiente para cada tenant en la Base de Datos desde `/dashboard/configuracion` (API `/api/afip/subir-certificados`). Esto permite que múltiples empresas emitan facturas con sus propios CUITs y certificados en el mismo deploy.

| Variable Global (Opcional Fallback) | Notas |
|-------------------------------------|-------|
| `AFIP_ENTORNO` | `homologacion` \| `produccion` (Default global si no está seteado por empresa). |
| `AFIP_CERT_PROD` / `AFIP_KEY_PROD` | Certificado de fallback dev/testing global (opcional). |

---

## Checklist de deploy

1. Crear proyecto Vercel → conectar repo  
2. Cargar variables **Production** (tabla de arriba)  
3. Build command: `prisma generate && next build` (ya en `package.json`)  
4. Deploy  
5. Migraciones (una vez / CI):  
   `npx prisma migrate deploy`  
   (local o job con `DATABASE_URL` + `DIRECT_URL`)  
6. Abrir `/api/go-live/status` → `go: true`  
7. Configurar webhook MP al dominio de Vercel  

---

## Qué NO hace falta en Vercel

- Archivo `.env` en el repo  
- Ollama local  
- `PRINTER_PORT=COM1` (impresora local del POS)  

---

## Límites serverless a tener en cuenta

| Feature | Requisito |
|---------|-----------|
| Demo industry (`maxDuration=60`) | Vercel **Pro** (Hobby corta a ~10s) |
| Crons | Plan con Cron Jobs |
| Pool DB | Siempre **pooler** en `DATABASE_URL` |

---

## Mapa rápido: local vs Vercel

| Local | Vercel |
|-------|--------|
| `.env.local` | Settings → Environment Variables |
| `npm run dev` | Deploy git / Preview |
| `localhost:3000` | `NEXT_PUBLIC_APP_URL` + dominio custom |

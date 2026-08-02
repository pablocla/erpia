# Auditoría de seguridad — claver.com.ar / ClavERP

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-07-31 |
| **Alcance** | Código del monorepo `pos-system-argentina` + superficie pública `https://claver.com.ar` |
| **Tipo** | Revisión de amenazas (auth multi-tenant, APIs, secretos, config). **No** es un pentest completo |
| **Severidad máxima confirmada** | **CRÍTICA** — bypass de autenticación explotable en producción |
| **Stack** | Next.js 15 App Router, JWT (`jose`), Prisma → PostgreSQL, Vercel |
| **Convenciones** | `AGENTS.md` |
| **Docs relacionadas** | `docs/seguridad/RELEVAMIENTO_ALERTAS_Y_DESASTRES.md`, `docs/seguridad/PLAYBOOKS_IR_DR.md`, `docs/deploy/VERCEL_ENV.md` |

---

## Resumen ejecutivo

La app tiene un **patrón multi-tenant sólido** (`getAuthContext` + `whereEmpresa`) en muchas rutas, headers de seguridad razonables (HSTS, CSP, X-Frame-Options) y fail-closed parcial en crons/webhooks de pago.

Sin embargo, se confirmó en **producción** un **bypass de autenticación** en `POST /api/auth/refresh`: el endpoint decodifica el JWT **sin verificar la firma** y emite un token válido para cualquier `userId` existente. Con `userId: 1` se obtuvo sesión de un administrador.

Hay además certificados AFIP (clave privada) versionados en git, credenciales demo en código, tokens en `localStorage`/cookie no HttpOnly, IDORs multi-tenant en varias APIs, y rate limiting en memoria (inefectivo en serverless).

**Prioridad absoluta:** parche de refresh → rotar `JWT_SECRET` → certs AFIP → IDOR / cookies / demo.

---

## Matriz de hallazgos

| ID | Severidad | Hallazgo | Estado | Archivos clave |
|----|-----------|----------|--------|----------------|
| **S-CRIT-01** | Crítica | Refresh JWT sin verificar firma (explotable en prod) | Confirmado live | `app/api/auth/refresh/route.ts` |
| **S-CRIT-02** | Crítica | Certificados AFIP (`.key` / `.pfx`) en git | Confirmado | `certificadosafip/*`, `.gitignore` |
| **S-HIGH-01** | Alta | Password demo hardcodeada en código | Confirmado | `lib/brand.ts` (`DEMO_ADMIN_*`) |
| **S-HIGH-02** | Alta | JWT en `localStorage` + cookie sin HttpOnly/Secure | Confirmado | `lib/auth/token-cookie.ts`, dashboards |
| **S-HIGH-03** | Alta | IDOR multi-tenant (portal, proveedores, delivery, self-order) | Confirmado código | Ver sección 5 |
| **S-HIGH-04** | Alta | Analista Claver con scope `all` si no hay asignaciones | Confirmado | `lib/auth/claver-analyst.ts` |
| **S-MED-01** | Media | Rate limit in-memory (bypass en Vercel multi-instance) | Confirmado | `lib/auth/rate-limiter.ts` |
| **S-MED-02** | Media | CSP con `'unsafe-inline'` y `'unsafe-eval'` | Confirmado live | `next.config.ts` |
| **S-MED-03** | Media | `/dashboard/*` sin gate de auth en middleware | Confirmado | `middleware.ts` |
| **S-MED-04** | Media | Signup abierto + trial auto; abuso de tenants | Confirmado | `app/api/auth/signup/route.ts` |
| **S-MED-05** | Media | `ignoreBuildErrors` / `ignoreDuringBuilds` | Confirmado | `next.config.ts` |
| **S-LOW-01** | Baja | `/api/health` expone estado DB | Confirmado live | `app/api/health` |
| **S-INFO-01** | Info | HSTS, CSP base, nosniff presentes en prod | OK | `next.config.ts` |
| **S-INFO-02** | Info | Contador multi-empresa con `assertContadorPuedeLeer` | OK | `app/api/contador/**` |
| **S-INFO-03** | Info | Demo bloqueado en prod salvo `ALLOW_DEMO=1` | OK (parcial) | `app/api/auth/demo/route.ts` |
| **S-INFO-04** | Info | Crons fail-closed en prod sin `CRON_SECRET` | OK | `lib/auth/cron-guard.ts` |

---

## Detalle de hallazgos

### S-CRIT-01 — Bypass de autenticación en `/api/auth/refresh`

**Ruta pública** en `middleware.ts` (`RUTAS_PUBLICAS` incluye `/api/auth/refresh`).

**Comportamiento defectuoso:**

1. Lee `Authorization: Bearer <token>`.
2. Usa `decodeJwt(token)` — **no valida firma ni secret**.
3. Si `userId` existe, usuario activo y `iat` < 30 días → emite JWT firmado válido 24h.

**Prueba en producción (2026-07-31):**

- Token firmado con basura + `iat` antiguo → `401 TOKEN_TOO_OLD` (prueba que decodifica sin verificar firma).
- Token con `userId: 99999999` + `iat` reciente → `401 Usuario inactivo o no encontrado`.
- Token con `userId: 1` + `iat` reciente → **`200` + JWT válido** de `admin@erp-argentina.com` (rol `administrador`).

**Impacto:** compromiso total de cuentas (incluyendo admins) sin conocer contraseña ni `JWT_SECRET`.

**Remediación (obligatoria):**

1. Verificar siempre la firma con `jwtVerify`.
2. Solo aceptar tokens **originalmente firmados** que estén expirados dentro de una ventana (ej. 7 días) **o** implementar refresh token opaco en DB.
3. Rotar `JWT_SECRET` en Vercel Production (invalida sesiones).
4. Auditar logs de refresh por IPs/userIds anómalos.
5. Tests Vitest: token sin firma / firma inválida → 401; token expirado válido recientemente → 200 o política definida.

**Código actual (referencia):**

```ts
// app/api/auth/refresh/route.ts — ANTI-PATRÓN
decoded = decodeJwt(token) // NO verificar firma
// ... busca usuario por decoded.userId
// ... SignJWT(...).sign(JWT_SECRET) → sesión robada
```

---

### S-CRIT-02 — Certificados AFIP en el repositorio

**Archivos trackeados:**

- `certificadosafip/oup22key.key`
- `certificadosafip/ouphom.pfx`
- `certificadosafip/ouphomol.crt`

`.gitignore` **no** excluye `*.key`, `*.pfx` ni `certificadosafip/`.

**Impacto:** uso fraudulento de identidad fiscal ante AFIP si el repo o el historial se filtraron.

**Remediación:**

1. `git rm --cached` de los archivos de cert/key.
2. Actualizar `.gitignore`.
3. Rotar certificados en AFIP.
4. Guardar solo en secretos de entorno / vault (ver `docs/deploy/VERCEL_ENV.md`).
5. Nunca commitear material criptográfico.

---

### S-HIGH-01 — Credenciales demo en código

```ts
// lib/brand.ts
export const DEMO_ADMIN_EMAIL = "testing@claver.com.ar"
export const DEMO_ADMIN_PASSWORD = "admin1234"
```

`/api/auth/demo` se deshabilita en production salvo `ALLOW_DEMO=1`, pero la password sigue en el source y puede existir el usuario en DB.

**Remediación:** mover a env (`DEMO_ADMIN_PASSWORD` no commiteada), rotar cuenta, asegurar `ALLOW_DEMO` unset en prod.

---

### S-HIGH-02 — Almacenamiento inseguro de sesión

- Token en `localStorage` (múltiples páginas del dashboard).
- Cookie `claver_token` seteada desde el **cliente** sin `HttpOnly` ni `Secure`:

```ts
// lib/auth/token-cookie.ts
document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`
```

**Impacto:** XSS = robo de sesión. CSP con `unsafe-inline` / `unsafe-eval` agrava el riesgo.

**Remediación:** cookie de sesión HttpOnly + Secure seteada solo en login/refresh (response `Set-Cookie` del servidor); dejar de depender de `localStorage` para el JWT de API (o dual: cookie + header solo desde server).

---

### S-HIGH-03 — IDOR / aislamiento multi-tenant inconsistente

El middleware solo valida que el JWT sea válido. El aislamiento real es **por ruta**. Rutas problemáticas:

| Ruta | Problema |
|------|----------|
| `GET/POST /api/portal/pedidos` | Usa `empresaId` / `clienteId` del query/body; no amarra al JWT del portal |
| `POST /api/proveedores/facturas` | `empresaId` del body sin ownership del token |
| `POST /api/delivery/rappi/webhook` | Sin firma HMAC; `empresaId` query/body (default `1`) |
| `POST /api/delivery/pedidosya/webhook` | Idem |
| `POST /api/hospitalidad/self-order` | `empresaId` del body (default `1`) |

**Nota:** `/api/delivery/*` **no** está en `RUTAS_PUBLICAS` → en prod el middleware exige Bearer (hoy 401 sin token). Si se publican sin firma = incidente grave.

**Remediación:**

1. Toda mutación/lectura: `getAuthContext` + `whereEmpresa(auth.empresaId)` o token de portal firmado.
2. Webhooks: firma del proveedor + mapeo de tenant por store id, no por body libre.
3. Self-order: token de mesa firmado (JWT corto o HMAC) con `empresaId` embebido.
4. Barrido: listar `route.ts` sin `getAuthContext` / `verificarToken` / `authorizeCron` / `validarFirmaWebhook`.

---

### S-HIGH-04 — Scope de analista “all” por defecto

```ts
// lib/auth/claver-analyst.ts
if (asignaciones.length === 0) return { mode: "all" }
```

Analista sin filas en `analistaAsignacion` ve e impersona **todos** los tenants.

**Remediación:** default `mode: "none"` o solo owner email; `mode: "all"` solo con flag env explícito (`CLAVER_ANALYST_GLOBAL=1`) o rol superadmin.

---

### S-MED-01 — Rate limit en memoria

`lib/auth/rate-limiter.ts` usa `Map` en proceso. En Vercel cada instancia resetea contadores → brute-force login/refresh/signup viable.

**Remediación:** Upstash Redis / Vercel KV / rate limit en edge compartido. Mantener API de `checkRateLimit` para no reescribir todos los call sites.

---

### S-MED-02 — CSP permisivo

Presente en prod (bien). Incluye `script-src ... 'unsafe-inline' 'unsafe-eval'` → debilita defensa XSS.

**Remediación progresiva:** nonces/hashes; eliminar `unsafe-eval` si el bundle lo permite; documentar excepciones (Google GSI, Vercel Analytics).

---

### S-MED-03 — Dashboard sin auth en edge

Solo `/claver-cloud` exige cookie JWT en `middleware.ts`. `/dashboard/*` se sirve sin gate; las APIs sí piden Bearer.

**Remediación:** redirigir a `/login` si no hay cookie válida (misma lógica que claver-cloud), sin romper marketing/landing.

---

### S-MED-04 — Signup abierto

Trial 14 días automático + rate limit frágil → abuso de creación de empresas y costos.

**Remediación:** CAPTCHA (Turnstile/hCaptcha), rate limit Redis, alertas por volumen de signups, revisión anti-spam de email.

---

### S-MED-05 — Build ignora errores TS/ESLint

```ts
// next.config.ts
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

Aumenta probabilidad de bugs de auth/tenant en prod.

**Remediación:** desactivar gradualmente por paquete; CI con `tsc --noEmit` en paths críticos (`lib/auth/**`, `app/api/auth/**`).

---

### Controles que funcionan bien

- Patrón `getAuthContext` + `whereEmpresa` en módulos maduros.
- Contador con `assertContadorPuedeLeer`.
- Crons: fail-closed en production sin `CRON_SECRET` (`lib/auth/cron-guard.ts`).
- Webhooks Stripe/MP: helpers de firma (`lib/auth/webhook-guard.ts`, `lib/stripe/*`).
- Demo deshabilitado en prod por defecto.
- Headers: HSTS, CSP base, X-Content-Type-Options, Referrer-Policy en `https://claver.com.ar`.
- Login/signup con Zod + intentos de rate limit.

---

## Plan de remediación (48 h / 1 semana)

### Hora 0–2 (P0)

1. Parche `app/api/auth/refresh/route.ts` (S-CRIT-01).
2. Deploy a producción.
3. Rotar `JWT_SECRET` en Vercel (Production + Preview si aplica).
4. Forzar re-login de usuarios.
5. Revisar logs de refresh (abuso).

### Día 1 (P0 restante)

6. Remover certs AFIP del índice git + `.gitignore` (S-CRIT-02).
7. Rotar certificados AFIP si hubo exposición.
8. Rotar/deshabilitar cuenta demo; quitar password del código (S-HIGH-01).

### Días 2–3 (P1)

9. Cookie HttpOnly server-side; plan de migración fuera de localStorage (S-HIGH-02).
10. Cerrar IDORs portal/proveedores/delivery/self-order (S-HIGH-03).
11. Fail-closed scope analistas (S-HIGH-04).

### Semana 1 (P2)

12. Rate limit Redis (S-MED-01).
13. Middleware gate para `/dashboard` (S-MED-03).
14. CAPTCHA signup (S-MED-04).
15. Endurecer CSP (S-MED-02).
16. Tests de seguridad en `__tests__/auth/` y `__tests__/security/`.

---

## Checklist post-incidente (si el refresh fue abusado)

- [ ] JWT_SECRET rotado
- [ ] Todos los usuarios re-autenticados
- [ ] Logs de `/api/auth/refresh` revisados (rango 30 días de iat max)
- [ ] Cuentas admin con actividad sospechosa: password reset + 2FA si aplica
- [ ] Certs AFIP: estado de exposición evaluado; rotación si aplica
- [ ] `ALLOW_DEMO` confirmado en `0` / unset en Production
- [ ] Comunicar a clientes solo si hay evidencia de acceso a datos (playbook IR)

Ver también: `docs/seguridad/PLAYBOOKS_IR_DR.md`.

---

# INSTRUCCIONES PARA GEMINI — Corregir TODO

> **Cómo usar este documento:** copiá el bloque **PROMPT GEMINI** completo en una sesión de Gemini (o Cursor/Gemini Code) con el repo abierto.  
> **Asignación del monorepo (`AGENTS.md`):**  
> - **gemini** → docs, matrices QA, checklists, runbooks, prompts, actualizaciones de `docs/seguridad/*` y backlog.  
> - **grok / pair** → implementación de código si Gemini no puede editar o falla el deploy.  
> Si Gemini **sí** puede editar el repo en esta sesión: **implementá el código de los P0/P1** según las tareas de abajo.  
> Si solo documentás: generá el plan de PRs + tests + checklist de verificación y marcalo para **assignee: grok**.

---

## PROMPT GEMINI (pegar desde aquí)

```
Sos ingeniero senior full-stack + seguridad de producto en el monorepo Claver
(pos-system-argentina / claver.com.ar).

Stack: Next.js 15 App Router, TypeScript, Prisma → PostgreSQL multi-tenant,
JWT con jose, Vercel, Tailwind/shadcn, Vitest.

Fuente de verdad de ESTA misión:
  docs/seguridad/AUDITORIA_CLAVER_COM_AR_2026-07-31.md

También leé:
  - AGENTS.md
  - middleware.ts (RUTAS_PUBLICAS)
  - lib/auth/empresa-guard.ts
  - lib/auth/jwt-secret.ts
  - lib/auth/cron-guard.ts
  - lib/auth/webhook-guard.ts
  - docs/deploy/VERCEL_ENV.md
  - docs/seguridad/RELEVAMIENTO_ALERTAS_Y_DESASTRES.md (si existe)

Tu misión: CORREGIR TODOS los hallazgos S-CRIT-*, S-HIGH-*, S-MED-* de la
auditoría. No inventes módulos de marketing. Preferí parches mínimos, tests
Vitest y patrones existentes (getAuthContext, whereEmpresa, authorizeCronRequest).

NO dejes vulnerabilidades “para después” en P0. Orden estricto:

═══════════════════════════════════════════════════════════════
FASE 0 — REGLAS NO NEGOCIABLES
═══════════════════════════════════════════════════════════════

1. Multi-tenant: NUNCA devolver ni mutar datos sin filtrar por empresaId del JWT
   (o scope explícito contador/analista ya validado).
2. Fail-closed en production: sin secret → 401/403, no “dejar pasar”.
3. No commitear secretos, .env, .key, .pfx, passwords.
4. No imprimir tokens JWT en logs ni en respuestas de error.
5. No escribir exploits ni PoCs ofensivos en el repo; solo tests de regresión
   que demuestren rechazo (401/403).
6. Locale es-AR en mensajes de error al usuario.
7. Cada fix P0/P1 lleva al menos 1 test Vitest o e2e mínimo.
8. Al terminar, actualizar esta auditoría: sección “Estado de remediación”
   con fecha y qué quedó DONE / PENDING.

═══════════════════════════════════════════════════════════════
FASE 1 — P0 CRÍTICO (obligatorio primero)
═══════════════════════════════════════════════════════════════

### Tarea 1.1 — S-CRIT-01 Fix /api/auth/refresh

Archivo: app/api/auth/refresh/route.ts

REQUISITOS:
A) Eliminar el uso de decodeJwt como única validación.
B) Verificar la firma SIEMPRE con jwtVerify + getEncodedJwtSecret()
   (o getJwtSecretRaw) de lib/auth/jwt-secret.ts.
C) Política aceptable (elegir UNA y documentarla en comentario breve):

   Opción recomendada — “expired-but-signed grace”:
   - Intentar jwtVerify con clockTolerance o capturar ERR_JWT_EXPIRED.
   - Si la firma es válida y el token expiró hace menos de N horas
     (ej. 72h o 7d, configurable por env JWT_REFRESH_MAX_AGE_HOURS),
     y el usuario sigue activo → emitir nuevo access token 24h.
   - Si la firma es inválida o el token es basura sin firma → 401.
   - Si iat supera un máximo absoluto (ej. 30 días desde emisión original)
     → 401 TOKEN_TOO_OLD.

   Opción alternativa — refresh opaco en DB (mejor a medio plazo):
   - Tabla o uso de store seguro con token random, userId, expiresAt, revoked.
   - Access JWT corto; refresh rota en cada uso.

D) Mantener rate limit (mejorar en FASE 3 si podés).
E) NO devolver password ni datos sensibles del usuario de más.
F) Usar el mismo secret que AuthService (no process.env.JWT_SECRET || ""
   que firma con secret vacío si falta env).

Tests (crear o ampliar):
  __tests__/auth/refresh-route.test.ts (o similar)
  - token con firma inválida → 401
  - token sin firma / payload inventado → 401
  - token bien firmado expirado dentro de grace + user activo → 200 + token
  - user inactivo → 401
  - sin Authorization → 401

Documentar en el PR/commit: “Rompe sesiones solo al rotar JWT_SECRET;
  el fix solo cierra el bypass.”

CHECKLIST deploy humano (Gemini NO rota secretos en Vercel solo):
  [ ] Deploy del fix
  [ ] Rotar JWT_SECRET en Vercel Production
  [ ] Redeploy para tomar el nuevo secret
  [ ] Avisar re-login
  [ ] Revisar logs de refresh

Escribí en docs/seguridad/RUNBOOK_POST_REFRESH_FIX.md (si no existe) los
pasos exactos de rotación de JWT_SECRET y verificación (curl de token
inválido debe 401).

### Tarea 1.2 — S-CRIT-02 Certificados AFIP fuera del repo

1. Asegurar que certificadosafip/*.key, *.pfx NO se usen como única fuente
   en prod (preferir AFIP_CERT_PROD / AFIP_KEY_PROD en env — ver código AFIP).
2. Actualizar .gitignore:
     certificadosafip/
     *.key
     *.pfx
     *.p12
     !**/*.example.key  (solo si hace falta ejemplo vacío)
3. git rm --cached de los archivos sensibles si siguen trackeados
   (NO borrar del disco del dev sin backup; sí sacarlos del control de versiones).
4. Documentar en docs/deploy/VERCEL_ENV.md o docs/seguridad/AFIP_CERTS.md:
   cómo cargar certs en env, rotación AFIP, nunca commitear.
5. Checklist humano: rotar cert en AFIP si el repo fue público o compartido.

### Tarea 1.3 — S-HIGH-01 Demo credentials

1. Quitar DEMO_ADMIN_PASSWORD hardcodeada de lib/brand.ts (o dejar solo email
   de referencia no secreto).
2. Leer password solo de process.env.DEMO_ADMIN_PASSWORD.
3. Si falta en production y ALLOW_DEMO=1 → fallar cerrado (403).
4. En docs/deploy/VERCEL_ENV.md: ALLOW_DEMO no debe estar en Production.
5. Test: demo en NODE_ENV=production sin ALLOW_DEMO → 403.

═══════════════════════════════════════════════════════════════
FASE 2 — P1 ALTA (mismo sprint de seguridad)
═══════════════════════════════════════════════════════════════

### Tarea 2.1 — S-HIGH-02 Sesión HttpOnly

1. Login y refresh deben setear cookie claver_token (o nombre AUTH_TOKEN_COOKIE)
   con: HttpOnly; Secure (prod); SameSite=Lax; Path=/; Max-Age coherente.
2. Set-Cookie desde el servidor (NextResponse.cookies.set), NO document.cookie
   para el token de sesión.
3. middleware ya lee cookie para /claver-cloud — alinear con /dashboard.
4. authFetch / useAuthStore: preferir cookie automática donde se pueda;
   si el cliente sigue mandando Bearer desde memoria, no guardar en
   localStorage a largo plazo (sessionStorage como paso intermedio OK).
5. clearAuthTokenCookie debe invalidar HttpOnly vía endpoint /api/auth/logout
   que borre la cookie en el response.

Crear o completar:
  app/api/auth/logout/route.ts → limpia cookie HttpOnly
  Ajustar app/api/auth/login/route.ts → Set-Cookie

### Tarea 2.2 — S-HIGH-03 IDOR multi-tenant

Para CADA ruta de la tabla:

A) app/api/portal/pedidos/route.ts
   - Exigir auth de portal (token cliente B2B o JWT con claims de cliente)
   - empresaId y clienteId DEBEN salir del token, no del query libre
   - Si hoy no hay auth de portal: implementar token firmado de portal
     o reutilizar sesión existente; bloquear acceso anónimo y cross-tenant

B) app/api/portal/catalogo/route.ts
   - Mantener/fortalecer whitelist; no enumerar empresas arbitrarias

C) app/api/proveedores/facturas/route.ts
   - getAuthContext + empresaId = auth.empresaId (ignorar body.empresaId
     o exigir igualdad)

D) app/api/delivery/rappi/webhook/route.ts
   app/api/delivery/pedidosya/webhook/route.ts
   - Si deben ser públicos: agregar a RUTAS_PUBLICAS SOLO tras:
     validar firma del proveedor + resolver empresaId por mapping de store
     (tabla o config), NUNCA body.empresaId libre ni default 1
   - Si no hay secret de firma todavía: dejar 401 en prod y documentar
     “no habilitar hasta firma”

E) app/api/hospitalidad/self-order/route.ts
   - Token de mesa firmado (JWT corto o HMAC) con empresaId + mesa
   - Rechazar body.empresaId sin token

F) Barrido automático:
   - Listar route.ts bajo app/api sin getAuthContext|verificarToken|
     withAuthAndTenant|authorizeCron|validarFirma|requireCron
   - Para cada una: clasificar PUBLIC_OK | NEEDS_AUTH | NEEDS_WEBHOOK_SIG
   - Corregir o documentar excepción justificada en
     docs/seguridad/API_SURFACE_PUBLICA.md

### Tarea 2.3 — S-HIGH-04 Analista scope fail-closed

Archivo: lib/auth/claver-analyst.ts

1. Si asignaciones.length === 0:
   - Si email === CLAVER_OWNER o CLAVER_ANALYST_GLOBAL=1 → mode "all"
   - Else → mode "assigned" con empresaIds: [] (sin acceso)
2. Impersonación debe seguir usando getClaverAnalystEmpresaContext
3. Test: analista sin asignaciones no puede impersonar ni listar todos

### Tarea 2.4 — Middleware dashboard

Archivo: middleware.ts

1. Proteger /dashboard/* igual que /claver-cloud (cookie JWT válida o redirect /login)
2. NO proteger: /, /login, /claver, /demo, /marketing, /legal, assets, RUTAS_PUBLICAS
3. Mantener APIs con Bearer como ahora
4. No romper i18n/market cookies

═══════════════════════════════════════════════════════════════
FASE 3 — P2 MEDIA (completar en la misma misión si hay tiempo)
═══════════════════════════════════════════════════════════════

### Tarea 3.1 — S-MED-01 Rate limit compartido

1. Abstracción: si UPSTASH_REDIS_REST_URL + TOKEN existen → Redis;
   si no → Map actual (dev) y en production log warn + fail-open o fail-closed
   documentado (preferir fail-open con warn solo en dev; en prod exigir Redis
   para login/refresh si es viable).
2. Namespaces: login, signup, refresh, forgot-password, demo, ai-public
3. No romper checkRateLimit / checkRateLimitByKey signatures si se puede.

### Tarea 3.2 — S-MED-02 CSP

1. Documentar en docs/seguridad/CSP.md qué dominios se necesitan y por qué.
2. Intentar quitar unsafe-eval; si rompe build, dejar TODO con issue y no
   empeorar la CSP.
3. No agregar dominios wildcard innecesarios.

### Tarea 3.3 — S-MED-04 Signup abuso

1. Integrar CAPTCHA opcional (TURNSTILE_SECRET o similar) si ya hay patrón
   en el repo; si no, rate limit Redis + max signups/IP/hora + doc.
2. No debilitar acceptTerms.

### Tarea 3.4 — S-MED-05 Build

1. NO activar ignoreBuildErrors=false en todo el monorepo de un golpe si
   rompe CI.
2. Sí: agregar script npm "typecheck:auth" sobre lib/auth y app/api/auth
   y documentar en TESTING.md o docs/seguridad.

### Tarea 3.5 — S-LOW-01 Health

1. /api/health: no filtrar stack traces; OK devolver ok/db booleans.
2. No exponer connection strings ni versiones internas sensibles.

═══════════════════════════════════════════════════════════════
FASE 4 — DOCUMENTACIÓN Y CIERRE (siempre, assignee gemini-friendly)
═══════════════════════════════════════════════════════════════

1. Actualizar docs/seguridad/AUDITORIA_CLAVER_COM_AR_2026-07-31.md:
   - Sección “Estado de remediación” (tabla ID | estado | PR/commit | fecha)
2. Crear o actualizar:
   - docs/seguridad/RUNBOOK_POST_REFRESH_FIX.md
   - docs/seguridad/API_SURFACE_PUBLICA.md (lista de rutas públicas y por qué)
3. Si el proyecto usa backlog de engineering:
   - Marcar tickets de seguridad en docs/engineering/backlog-status.json
     o crear entradas en PRODUCT_BACKLOG solo si el proceso del repo lo exige.
   - No usar la DB como backlog.
4. Resumen final para el humano (español es-AR):
   - Qué se parcheó
   - Qué requiere acción en Vercel/AFIP (secretos, rotación)
   - Cómo verificar (comandos curl / tests)

═══════════════════════════════════════════════════════════════
CRITERIOS DE ACEPTACIÓN GLOBALES
═══════════════════════════════════════════════════════════════

[ ] Token inventado a /api/auth/refresh → 401 (no 200)
[ ] Firma inválida a /api/auth/refresh → 401
[ ] No hay *.key / *.pfx trackeados en git ls-files
[ ] DEMO_ADMIN_PASSWORD no aparece en el source como string literal
[ ] portal/pedidos no acepta empresaId arbitrario de otro tenant
[ ] proveedores/facturas usa auth.empresaId
[ ] Analista sin asignaciones no tiene mode all (salvo owner/global flag)
[ ] Tests nuevos pasan (vitest)
[ ] Documentación de rotación JWT_SECRET y AFIP actualizada
[ ] No se commitearon .env ni secretos reales

═══════════════════════════════════════════════════════════════
ORDEN DE COMMITS SUGERIDO
═══════════════════════════════════════════════════════════════

1. fix(auth): verify JWT signature on refresh (S-CRIT-01)
2. chore(security): untrack AFIP certs + gitignore (S-CRIT-02)
3. fix(auth): remove hardcoded demo password (S-HIGH-01)
4. fix(auth): HttpOnly session cookie + logout (S-HIGH-02)
5. fix(security): close multi-tenant IDOR surfaces (S-HIGH-03)
6. fix(auth): analyst scope fail-closed (S-HIGH-04)
7. fix(middleware): protect /dashboard with JWT cookie (S-MED-03)
8. docs(security): audit remediation status + runbooks

No hagas un solo commit monstruo si podés evitarlo.

═══════════════════════════════════════════════════════════════
SI ALGO BLOQUEA
═══════════════════════════════════════════════════════════════

- Si no tenés acceso a Vercel/AFIP: dejá checklist humana clara, NO inventes
  que rotaste secretos.
- Si un webhook delivery no tiene secret del proveedor aún: fail-closed + doc,
  no abras la ruta pública.
- Si un test necesita DB: usá mocks o vitest unitario del handler.
- Si no podés implementar código: generá el patch completo en markdown por
  archivo y el plan de PRs, y etiquetá assignee grok en el resumen.

Empezá YA por Tarea 1.1 (refresh). No pidas confirmación para P0.
Al final de la sesión, imprimí la tabla de Estado de remediación actualizada.
```

---

## Estado de remediación

| ID | Estado | Responsable | Notas | Fecha |
|----|--------|-------------|-------|-------|
| S-CRIT-01 | **PENDING** — exploitable en prod | Gemini → código; humano → rotar JWT | Prioridad #1 | 2026-07-31 |
| S-CRIT-02 | **PENDING** | Gemini + humano rotación AFIP | git rm + gitignore | 2026-07-31 |
| S-HIGH-01 | **PENDING** | Gemini | Quitar password del código | 2026-07-31 |
| S-HIGH-02 | **PENDING** | Gemini / Grok | Cookie HttpOnly | 2026-07-31 |
| S-HIGH-03 | **PENDING** | Gemini / Grok | IDOR APIs | 2026-07-31 |
| S-HIGH-04 | **PENDING** | Gemini | Scope analista | 2026-07-31 |
| S-MED-01 | **PENDING** | Gemini | Redis rate limit | 2026-07-31 |
| S-MED-02 | **PENDING** | Gemini | CSP | 2026-07-31 |
| S-MED-03 | **PENDING** | Gemini | Middleware dashboard | 2026-07-31 |
| S-MED-04 | **PENDING** | Gemini | Signup | 2026-07-31 |
| S-MED-05 | **PENDING** | Gemini | typecheck auth | 2026-07-31 |
| S-LOW-01 | **OK / revisar** | — | Health sin secretos | 2026-07-31 |

*(Gemini debe actualizar esta tabla al cerrar cada tarea.)*

---

## Referencias de archivos

| Tema | Path |
|------|------|
| Middleware / rutas públicas | `middleware.ts` |
| Guard multi-tenant | `lib/auth/empresa-guard.ts` |
| JWT secret | `lib/auth/jwt-secret.ts` |
| Refresh vulnerable | `app/api/auth/refresh/route.ts` |
| Cookie cliente | `lib/auth/token-cookie.ts` |
| Analistas | `lib/auth/claver-analyst.ts` |
| Rate limit | `lib/auth/rate-limiter.ts` |
| Cron | `lib/auth/cron-guard.ts` |
| Webhooks | `lib/auth/webhook-guard.ts` |
| Demo | `app/api/auth/demo/route.ts`, `lib/brand.ts` |
| Portal pedidos | `app/api/portal/pedidos/route.ts` |
| Delivery | `app/api/delivery/**/webhook/route.ts` |
| Self-order | `app/api/hospitalidad/self-order/route.ts` |
| Headers seguridad | `next.config.ts` |
| Env Vercel | `docs/deploy/VERCEL_ENV.md` |

---

## Aviso legal / ética

Esta auditoría se realizó sobre el sistema del propietario del monorepo (claver.com.ar).  
**No** reutilizar las técnicas de verificación del refresh para acceder a datos de terceros.  
Tras el hallazgo S-CRIT-01, se recomienda rotar `JWT_SECRET` aunque no haya evidencia de abuso.

---

*Documento generado 2026-07-31 — listo para pegar el PROMPT GEMINI en una sesión de remediación.*

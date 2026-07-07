# Prompt Gemini — Go-to-market (todo EXCEPTO cobro MP y login activar)

> **Reservado para Cursor (no tocar en Gemini):**
> - Bloque P0-A: Mercado Pago suscripción real post-trial
> - Bloque P0-B: Login usuario existente + `?activar=` → activar SKU + modoLite
>
> Gemini trabaja el resto en paralelo.

---

## PROMPT MAESTRO (pegar primero)

```
Sos desarrollador senior en pos-system-argentina (Next.js 15 App Router, TypeScript, Prisma, shadcn, Tailwind v4, Vitest).

Objetivo: preparar salida al mercado con 3 productos de combate — Claver Fiado, Claver Cobrá, Claver Turnos.
NO expandir catálogo. NO refactorizar el ERP entero.

Ya implementado (no rehacer):
- Landings: /claver/apps/[slug] + lib/comercial/sub-saas-catalog.ts
- Activación en REGISTRO: ?activar= → onboarding-retail (app/login/register/page.tsx)
- Product shell: lib/comercial/product-shell.ts + getActiveProductShell(modoLite, productosSku)
- Mobile bottom nav contextual: components/mobile-bottom-nav.tsx
- Dashboard producto: components/dashboard/product-dashboard-home.tsx + hooks/use-product-home-data.ts
- Banner producto: components/comercial/product-context-banner.tsx
- Docs UX: docs/comercial/prompt-gemini-ux-ui.md

Reglas (AGENTS.md):
- Multi-tenant: getAuthContext() + whereEmpresa() en APIs autenticadas
- Locale es-AR, moneda ARS
- Cambios mínimos y enfocados
- Tests Vitest obligatorios por bloque
- No inventar SKUs nuevos

PROHIBIDO en esta sesión:
- Implementar Mercado Pago real (está en Cursor)
- Implementar activación en login de usuario existente (está en Cursor)

Al terminar cada bloque reportá:
1. Archivos tocados
2. Cómo probar manualmente (3 pasos)
3. Qué quedó fuera y por qué
4. Riesgos para producción
```

---

## BLOQUE 1 — Enforcement trial vencido

```
BLOQUE 1 — Trial vencido bloquea operación

Problema: trial de 14 días se muestra en TrialBanner pero no bloquea APIs ni pantallas.

Tareas:
1. lib/comercial/trial-guard.ts — isTrialActive(empresaId), isTrialExpired(empresaId)
2. Middleware o helper en getAuthContext para rutas /api/* (excepto /api/config/trial, /api/auth/*, /api/marketplace/checkout)
3. Pantalla /dashboard/trial-vencido con CTA "Contactar ventas" y "Ver planes" (link /claver/contacto)
4. Redirect desde dashboard layout si trial expirado y no hay suscripción activa (consultar lib/platform/commercial-service getActiveSubscription)
5. Test: __tests__/comercial/trial-guard.test.ts

Criterio: empresa con trial_expires_at en el pasado no puede POST /api/fiado/*
```

---

## BLOQUE 2 — Vitrine recortada (solo 3 productos de combate)

```
BLOQUE 2 — Home y catálogo: vender 3, no 200

Problema: / y /claver/apps muestran catálogo infinito → cliente se pierde.

Tareas:
1. lib/comercial/go-to-market-vitrine.ts — COMBATE_APPS = ['fiado','cobra','turnos'], copy y CTAs
2. ClaverMatrixHub: sección hero secundaria solo 3 cards + "Ver catálogo completo" colapsado
3. claver-apps-marketplace: tab default "Productos de combate" con 3 apps; automatizaciones detrás de collapsible
4. PRODUCTOS_ENTRADA en commercial-packaging.ts: solo fiado + cobra (quitar guardian si confunde)
5. metadata y copy: "Empezá con un problema" no "200 soluciones"

Criterio: scroll home en mobile muestra Fiado, Cobrá, Turnos antes que packs ERP.
```

---

## BLOQUE 3 — Checklist primeros 10 min (Bloque UX-B)

```
BLOQUE 3 — Setup checklist post-activar

Tareas:
1. lib/comercial/setup-checklist.ts — pasos por slug (fiado: cliente, límite, primer fiado, opcional WA)
2. GET/PATCH /api/config/setup-progress — persistir en parametroFiscal clave setup_progress_{slug}
3. components/onboarding/setup-checklist-card.tsx — barra % sticky en dashboard del producto
4. Marcar pasos completados consultando DB (ej. cliente count, fiado movimientos)
5. Reescribir ProductTour: data-tour en fiado page, dispara si fresh signup + activar intent
6. Test: __tests__/comercial/setup-checklist.test.ts

Criterio: usuario nuevo fiado ve checklist con ≥1 paso marcado automático si hay seed onboarding.
```

---

## BLOQUE 4 — Cmd+K contextual (Bloque UX-E)

```
BLOQUE 4 — Command palette solo del producto activo

Tareas:
1. components/command-palette.tsx — importar getActiveProductShell
2. Si shell activo: filtrar ROUTES a tabs del shell + acciones rápidas (Nuevo cliente, Anotar fiado…)
3. Máximo 12 ítems en modo producto
4. Topbar: un solo entry point búsqueda → abre CommandDialog
5. Test mínimo: filtro fiado no incluye /dashboard/impuestos

Archivos: command-palette.tsx, topbar.tsx, hooks/use-dashboard-shell.ts (pasar modoLite/sku si hace falta)
```

---

## BLOQUE 5 — Links públicos en panel (Bloque UX-H)

```
BLOQUE 5 — El dueño copia su link

Tareas:
1. components/comercial/public-link-card.tsx — copiar, QR (qrcode lib o API), abrir nueva pestaña, share WA mobile
2. Integrar en:
   - app/dashboard/agenda/page.tsx → /agenda-online/{empresaId}
   - app/dashboard/hospitalidad/platos/page.tsx → /menu/{empresaId}
   - app/dashboard/ecommerce o equivalente → /tienda/{slug}
3. Usar formatPublicPath de sub-saas-catalog.ts
4. Incluir paso en setup-checklist: "Compartí tu link"

Criterio: desde agenda, botón "Copiar link" funciona en clipboard.
```

---

## BLOQUE 6 — Emails trial día 7 y 13

```
BLOQUE 6 — Nurturing trial automático

Tareas:
1. lib/email/trial-email-sequences.ts — templates día 7 (tips producto) y día 13 (urgencia)
2. Cron o script lib/ops/trial-email-job.ts — empresas con trial_expires_at en 7 y 1 días
3. app/api/cron/trial-emails/route.ts — protegido con CRON_SECRET
4. Personalizar por modoLite/slug activo (fiado vs cobra copy distinto)
5. Test unitario de selección de destinatarios (mock prisma)

No implementar cobro en email — solo CTA a /claver/contacto o login.
```

---

## BLOQUE 7 — Legal mínimo en registro

```
BLOQUE 7 — Términos y privacidad

Tareas:
1. app/legal/terminos/page.tsx y app/legal/privacidad/page.tsx — copy PyME Argentina breve
2. Checkbox obligatorio en app/login/register/page.tsx con links
3. Guardar aceptación: parametroFiscal o campo empresa.terminosAceptadosAt
4. API signup valida termsAccepted: true

Criterio: no se crea cuenta sin checkbox.
```

---

## BLOQUE 8 — WhatsApp wizard honesto (Cobrá + Fiado)

```
BLOQUE 8 — Conectar WA o modo manual

Problema: vendemos WA pero Twilio no está configurado → decepción.

Tareas:
1. components/configuracion/whatsapp-setup-wizard.tsx — 3 estados: no_configurado | twilio_ok | modo_manual
2. Detectar env TWILIO_* + config empresa
3. Si no hay WA: UI honesta "Envío manual desde panel" + template copiable
4. Integrar en /dashboard/configuracion y banner en cuentas-cobrar + fiado
5. Actualizar copy landing cobra: "WA automático con Twilio" vs "recordatorios desde panel"

Criterio: usuario sin Twilio entiende qué puede y qué no puede hacer.
```

---

## BLOQUE 9 — Funnel analytics (mínimo)

```
BLOQUE 9 — Medir landing → pago

Tareas:
1. lib/ops/funnel-events.ts — eventos: landing_view, activar_click, signup_ok, onboarding_ok, trial_day_7
2. POST /api/comercial/funnel-event — guardar en tabla existente o parametroFiscal batch
3. Disparar desde: sub-saas-landing CTA, register success, onboarding-retail success
4. Dashboard interno simple en app/claver-cloud/operations o página ops existente — funnel últimos 30 días

Sin Google Analytics obligatorio — eventos propios primero.
```

---

## BLOQUE 10 — Empty states sub-SaaS (Bloque UX-F acotado)

```
BLOQUE 10 — Pantallas vacías con CTA

Solo estas páginas:
- dashboard/fiado, cuentas-cobrar, agenda, ecommerce, hospitalidad/platos, membresias

Patrón: EmptyStateIllustration + actionLabel + onAction
Microcopy mostrador ("Todavía no fiaste a nadie")

Test: snapshot o render test de un preset.
```

---

## Reparto paralelo sugerido

| Sesión Gemini | Bloque | Días est. |
|---------------|--------|-----------|
| 1 | 2 Vitrine recortada | 0.5 |
| 2 | 3 Checklist | 1 |
| 3 | 4 Cmd+K | 0.5 |
| 4 | 5 Links públicos | 0.5 |
| 5 | 1 Trial enforcement | 1 |
| 6 | 7 Legal | 0.5 |
| 7 | 8 WA wizard | 1 |
| 8 | 6 Emails trial | 1 |
| 9 | 9 Funnel | 1 |
| 10 | 10 Empty states | 1 |

**En Cursor (después):** P0-A Mercado Pago + P0-B Login activar existente.

---

## Verificación cruzada (Gemini + Cursor)

```bash
npx vitest run __tests__/comercial/
npx vitest run __tests__/platform/
```

Checklist manual conjunto:
- [ ] Home muestra solo 3 productos arriba del fold (mobile)
- [ ] Registro fiado → checklist visible
- [ ] Cmd+K en fiado ≤12 ítems
- [ ] Agenda muestra copiar link
- [ ] Trial vencido bloquea API fiado
- [ ] Registro exige términos
- [ ] (Cursor) Login existente + ?activar=fiado activa producto
- [ ] (Cursor) Trial día 14 → checkout MP

---

## Prompt corto para pegar en Gemini (una línea de misión)

```
En pos-system-argentina, implementá el BLOQUE [N] del archivo docs/comercial/prompt-gemini-go-to-market.md. No toques Mercado Pago ni login activar existente. Entregá código + tests + 3 pasos de prueba manual.
```
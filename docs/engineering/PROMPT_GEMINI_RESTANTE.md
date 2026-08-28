# PROMPT GEMINI — restante (después de MAX_PCT + Grok)

**Pasale ESTE archivo.** No reabra `PROMPT_GEMINI_MAX_PCT.md` ni `PLAN_SUBIR` para “subir todo”: ya infló scores y dejó 🔒 Extra sin ítems.

**Fecha:** 2026-08-26  
**Hoy (merge real):** transversal **~82%** · valor **~71%**  
**Tu techo:** transversal **~86** · valor **~74**. El 90% de rapidez (no bajar Topbar ERP) y purge 90 d no son tuyos.

---

## PROMPT (copiar)

```text
Sos Gemini en Claver (Next.js 15, es-AR, claver.com.ar).
NO toques: app/api/caja, lib/comercial/caps-ancla.ts, app/api/estadisticas, app/dashboard/pos/page.tsx, app/dashboard/layout.tsx.
Grok ya cableó: 2ª caja 402, reportes >48 h 402, Extra en shells fiado/oficios/pos, paywall lite-nav, hide sidebar en POS, dynamic() fiscal.

══════════════════════════════════════
HOY (no redondees)
══════════════════════════════════════
A 90  B 88  C 90  D 82  E 82  F 72  G 52  → transversal ~82%
Valor60s 78  UX 68  Rapidez 58  Opex 55  Honestidad 88  Disparo 82  → ~71%
Si reportás 90 o 100, mentís.

══════════════════════════════════════
CONTRATO
══════════════════════════════════════
GRATIS = 1 caja, fiado, ticket interno, presupuesto 3 niveles, seña ANOTADA, 2 users.
PAGO = WA outbound, link MP, CAE, 2ª caja, 3er user, reportes >48 h.
ARCA/WA se PACTAN (PactarImplementacionArca). Ticket interno sigue.
trial=14 NUNCA en fiado/oficios. No US. No HUM-01. Si el tenant YA tiene SKU, el botón funciona.

══════════════════════════════════════
OLA RESTANTE (solo esto)
══════════════════════════════════════

1) G / T4-1 vitrine y ClaverP
- go-to-market-vitrine.ts, commercial-sales-playbook.ts, claverp-product-hub.tsx, claver-shell.tsx
- “14 días” SOLO Cobrá / turnos / gym.
- Grep trial=14 en href de fiado/oficios = 0.
- /explorar y /claver/apps: catálogo OK; no desde hero de /.

2) A / V1-2 paridad /f
- app/f/page.tsx y app/f/servicios/page.tsx: misma familia que landing-f-chrome (Fraunces, CTA, desktop split, celu 1 col).
- Cero mega menú ERP. Cero 11 apps.

3) E reportes UI
- Donde el usuario elige rango de fechas (dashboard stats / reportes): si >48 h, PaywallModal disparoKey=reportes_historicos.
- No borres datos. Hoy/ayer gratis.
- La API ya responde 402 CAP_REPORTES_48H: si fetch da 402, abrí el modal (no silencies).

4) D niche
- lite-sidebar modo "niche" y "servicios": sacá historia-clinica y agenda si no son el ancla oficios.
- No reagregues cerebro.

5) Tests
- product-shell Extra ya está (no lo rompas).
- Un test de vitrine: fiado/oficios href sin trial=14.
npx vitest run __tests__/comercial --reporter=dot

══════════════════════════════════════
NO TOQUES
══════════════════════════════════════
POS page, layout sidebar hide, caps-ancla, POST /api/caja, SOAP AFIP, purge 90 d, Prisma, 8 nichos /f/{nicho}.

══════════════════════════════════════
AL CERRAR
══════════════════════════════════════
Actualizá PLAN_SUBIR §0 y PLAN_VALOR §0 capa por capa.
Una línea: “transversal X% · valor Y% · rapidez sigue ~58 (Grok)”.
Lista lo que NO verificaste en HTTP.
```

## FIN PROMPT

Grok después de esta ola: purge 90 d y Topbar liviano en POS. No hace falta otro MAX_PCT.

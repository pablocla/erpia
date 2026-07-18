# Prompt de seguimiento — P0 Fiado + Cobrá + Facturación recurrente

> Usar **después** de leer:
> - `docs/comercial/AUDITORIA-PRODUCTOS-MKT-FUNCIONAL-PURCHASE-2026-07-13.md` (§10 backlog unificado)
> - `docs/comercial/AUDITORIA-TRIAL-FIADO-COBRANZA-RECIBO-RECURRENTE.md`
> - `__tests__/comercial/catalog-coherence.test.ts` (debe seguir en verde)

---

## PROMPT MAESTRO (pegar entero)

```
Sos desarrollador senior en pos-system-argentina (Next.js 15 App Router, TypeScript strict, Prisma, Vitest, shadcn, Tailwind v4).

## Objetivo de esta sesión
Cerrar el ciclo **lineal y fehaciente** de tres productos:

1) **Claver Fiado** (`pos.fiado_barrio`) — ancla gratis
2) **Claver Cobrá** (`intang.cobranzas_wa`)
3) **Facturación recurrente** (módulo ventas → Factura → CxC → cobro → recibo)

NO expandir catálogo. NO rehacer landings GTM. NO tocar Premium 7 / Almacén Rosario salvo dependencia directa.

## Ya implementado (NO rehacer; reutilizar)
- OFERTA_FIADO_ANCLA: fiado vigencia null; core.claver trial 14d
  → lib/comercial/ofertas-comerciales.ts, retail-onboarding-service.ts, comercial-access-service.ts
- API/UI anotar + cobrar fiado libreta
  → lib/fiado/fiado-service.ts (anotarFiadoLibreta, cobrarFiadoLibreta)
  → app/api/fiado/anotar, app/api/fiado/cobrar
  → app/dashboard/fiado/page.tsx
- TrialBanner + trial-vencido conscientes de ancla
  → components/trial-banner.tsx, app/dashboard/trial-vencido/page.tsx
- Recurrente emite Factura + emitFacturaEmitida + CC forzada
  → lib/ventas/facturacion-recurrente-service.ts
  → lib/cc-cp/cuentas-service.ts (forzarCuenta)
- Cobranza WA al activar SKU
  → lib/marketplace/cobranzas-wa-service.ts, product-hooks
- Menú lite fiado/cobranza mejorado
  → lib/comercial/lite-sidebar.ts
- Tests: __tests__/fiado/fiado-libreta-ops.test.ts, facturacion-recurrente-service.test.ts, catalog-coherence.test.ts

## Gaps P0 a implementar (en este orden)

### P0-A — Layout no debe hard-bloquear ancla fiado
Problema: si el dashboard layout redirige a /dashboard/trial-vencido con bloqueo total, el usuario con ancla no puede operar fiado.
Tareas:
1. Revisar app/dashboard/layout.tsx (y middleware si aplica) uso de bloqueoTotal / trial expirado / tieneAnclaGratis
2. Si tieneAnclaGratis: permitir rutas lite fiado (/dashboard/fiado, /dashboard/clientes, /dashboard/cuentas-cobrar, /dashboard/mi-plan, /dashboard/apps, /api/fiado/*)
3. Bloquear solo módulos monetizados expirados (POS, stock, etc.)
4. Test: __tests__/comercial/trial-ancla-access.test.ts (o extender comercial-access-service)

Criterio: con trial vencido + sub pos.fiado_barrio vigenciaHasta null → GET/POST fiado 200; POS puede 403.

### P0-B — Cobrá: cobro manual en modo lite (cierra el circuito sin WA/MP)
Problema: Cobrá avisa por WA pero no tiene camino simple a recibo en modo cobranza.
Tareas:
1. En modoLite cobranza (y opcionalmente fiado), UI de cuentas a cobrar con acción "Registrar cobro"
2. Reutilizar cobrarFiadoLibreta O cobrosService.registrarCobro de forma multi-tenant segura
   - Preferencia: un servicio de dominio único aplicarCobroCliente(empresaId, clienteId, monto, medio) que:
     a) actualice CC FIFO
     b) cree Recibo
     c) si el cliente tiene saldoCuentaCorriente < 0, baje la libreta (reducirDeudaCliente)
3. API: POST /api/cuentas-cobrar/cobrar o reutilizar /api/fiado/cobrar si el cliente es fiado; documentar
4. Menú lite: asegurar /dashboard/cuentas-cobrar accesible (ya está en lite-sidebar)
5. Tests unitarios del servicio de cobro unificado

Criterio: deudor con CC → un click cobro → recibo + CC pagada + libreta 0 si aplica.

### P0-C — Facturación recurrente: cron multi-tenant + no perder ciclo si AFIP falla
Problema: procesarFacturasRecurrentes existe por empresa pero falta job confiable all-tenants; si CAE falla, el ciclo debe quedar recuperable.
Tareas:
1. app/api/cron/facturacion-recurrente/route.ts (o enganchar en cron/dispatch)
   - Auth: CRON_SECRET / patrón existente en app/api/cron/*
   - Iterar empresas con FacturaRecurrente activas (o batch)
   - Llamar procesarFacturasRecurrentes(empresaId)
   - Log por tenant (persistSistemaLog o ops)
2. En procesarFacturasRecurrentes:
   - Si solicitarCaeFactura falla: factura queda pendiente_cae (ya), CC forzada igual (cobrable), reintento en próximo cron
   - No saltar actualización de proximaEmision solo si se creó factura (definir: avanzar ciclo aunque CAE pendiente, para no re-duplicar factura el mismo día)
   - Evitar doble factura el mismo período: chequear si ya se emitió para fr.id en el mes/periodo
3. Tests: mock multi-empresa, AFIP fail → CC creada, estado pendiente_cae

Criterio: un hit de cron procesa N empresas; AFIP down no pierde la deuda cobrable.

### P0-D — Link de pago deudor (Fiado/Cobrá) cierra cobro
Problema: resolverLinkPagoFiado crea preferencia MP; el webhook de suscripción SaaS no aplica el pago del deudor.
Tareas:
1. Mapear external_reference tipo fiado-{facturaId}-{clienteId} o cobro-cc-{cuentaCobrarId}
2. En webhook MP (o handler de payment): si external_reference es cobro de deudor → aplicarCobroCliente
3. Idempotencia: no doble recibo si webhook se reintenta
4. Test unitario del parser de external_reference + apply

Criterio: pago aprobado en sandbox → deuda 0 + recibo.

Si MP sandbox no está disponible en el entorno, implementá el handler + test con payload mock y documentá env vars.

### P0-E — Cobrá: cron de evaluación de reglas cxc_vencida
Problema: activarSecretariaCobranzas configura reglas; el envío WA depende de cron IA.
Tareas:
1. Verificar app/api/cron/cobranzas-ia o dispatch premium
2. Asegurar que con intang.cobranzas_wa activo + evaluarReglasEnCron, el cron corra sin SCHEDULER_TIER=premium obligatorio en dev (o documentar)
3. Smoke test de servicio resumenCobranzasPendientes

Criterio: documentado + job invocable; no dejar solo "activé el SKU y no pasa nada".

## Reglas
- Multi-tenant: getAuthContext + empresaId en todas las APIs
- Locale es-AR
- Tests Vitest por cada P0 (mínimo 1)
- catalog-coherence.test.ts debe seguir pasando
- Cambios mínimos; sin refactors cosméticos
- Al terminar cada P0 reportá: archivos, 3 pasos de prueba manual, qué quedó fuera

## Orden de ejecución en esta sesión
1. P0-A (layout ancla) — rápido, desbloquea demo
2. P0-B (cobro manual lite) — cierra Cobrá/Fiado sin MP
3. P0-C (cron recurrente) — cierra facturación de servicios
4. P0-D (webhook deudor) — promesa marketing
5. P0-E (cron cobranzas) — operación WA

## Definición de done de la sesión
- [x] Trial vencido + ancla: fiado operable (layout allowlist + trial-vencido)
- [x] Cobro manual desde CxC o fiado emite recibo y limpia deuda (cobros sincroniza libreta)
- [x] Cron recurrente multi-tenant + CC aunque CAE falle
- [x] Webhook deudor → recibo (aplicarPagoDeudorDesdeMp + conciliarPagoMP)
- [x] Idempotencia recurrente same-day
- [x] Tests: deudor-pago, p0-fiado-cobra-recurrente, catalog-coherence, facturacion-recurrente

### Hecho por Grok (2026-07-13) — no rehacer
- `lib/mercadopago/deudor-pago-ref.ts`, `aplicar-pago-deudor.ts`
- `conciliarPagoMP` engancha fiado/cxc/fac
- `handleMercadoPagoWebhook` también rutea `type=payment`
- Cron `facturacion-recurrente` free tier + `/api/cron/facturacion-recurrente`
- cobranzas-ia → free tier

## Prompt ultra-corto (una sola tarea)

Si preferís un P0 por chat:

BLOQUE: P0-B cobro manual lite
Implementá aplicarCobroCliente + UI en cuentas-cobrar + tests.
Reutilizá cobrarFiadoLibreta / cobros-service. No toques MKT.
```

---

## Prompt de una línea (para arrancar ya)

```
Implementá P0-A + P0-B + P0-C del archivo docs/comercial/PROMPT_SEGUIMIENTO_P0_FIADO_COBRA_RECURRENTE.md en orden, con tests Vitest, sin expandir catálogo.
```

---

## Mapa de archivos a tocar (orientativo)

| P0 | Archivos probables |
|----|-------------------|
| A | `app/dashboard/layout.tsx`, `lib/comercial/comercial-access-service.ts`, `lib/comercial/lite-sidebar.ts` |
| B | `lib/cobros/*` o `lib/fiado/fiado-service.ts`, `app/api/cuentas-cobrar/**`, `app/dashboard/cuentas-cobrar/**` |
| C | `app/api/cron/**`, `lib/ventas/facturacion-recurrente-service.ts` |
| D | `app/api/webhooks/mercadopago/**`, `lib/fiado/fiado-pago-link.ts`, `lib/billing/**` |
| E | `app/api/cron/cobranzas-ia/**`, `app/api/cron/dispatch/**` |

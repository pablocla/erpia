# Reality gate de produccion - Claver

Este gate es obligatorio antes de pauta masiva. Requiere reality gate CTO verde y docs/comercial/UX_RELEASE_GATE_CONVERSION.md verde; hasta entonces, solo piloto/anclas.

## Smoke positivo

- [ ] Signup real y trial de la empresa.
- [ ] Checkout con token real de Mercado Pago.
- [ ] Webhook real autoriza y activa la suscripcion.
- [ ] Registrar una venta POS real y verificar stock y caja.
- [ ] Confirmar metricas provenientes de la base, sin fixtures sinteticos.

## Negativos obligatorios

- [ ] FORCE_MOCK_MP_PROD=true no habilita suscripciones mock.
- [ ] FORCE_MOCK_STRIPE_PROD=true no habilita checkout mock.
- [ ] /api/billing/confirm-mock responde 403 en produccion.
- [ ] confirmar_mock=1, ALLOW_DEMO=1, demos de industria, seed-demo y prewarm no crean datos en produccion.
- [ ] Sin token real, el flujo falla claro y no escribe una suscripcion falsa.

## Ejecucion local

Correr los tests Vitest de production-reality-gate y marketplace-checkout-policy.

Los mocks siguen disponibles para desarrollo y test; nunca se usan para validar el smoke productivo.

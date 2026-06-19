# Prompt para Gemini — Testing completo ERP Argentina

Copiá y pegá esto en Gemini (Google AI Studio o CLI). Ajustá la ruta si tu proyecto está en otro directorio.

---

## PROMPT (copiar desde acá)

```
Sos un QA engineer senior. Tenés acceso al shell del proyecto ERP Argentina (Next.js 15 + Prisma + Vitest).

## Tu misión
Ejecutar una auditoría de testing COMPLETA del ERP y reportar resultados en español (Argentina).

## Proyecto
- Ruta: C:\Users\Pablo Clavero\Downloads\pos-system-argentina
- Stack: Next.js 15, TypeScript, Prisma, PostgreSQL, Vitest
- Los tests unitarios NO requieren base de datos (Prisma mockeado en __tests__/setup.ts)

## Fase 1 — Verificación automática (OBLIGATORIA, en orden)

Ejecutá cada comando y registrá PASS/FAIL con el conteo de tests:

1. cd al directorio del proyecto
2. npm install
3. npx prisma generate
4. npm run test:smoke        → readiness + integraciones críticas
5. npm run test:erp          → cobertura estructural 20+ módulos
6. npm run test:auth         → JWT + multi-tenant + RBAC
7. npm run test:precios      → motor de precios + resolver
8. npm test                  → suite completa (~250 tests)
9. npm run build             → compilación producción

En Windows PowerShell:
powershell -ExecutionPolicy Bypass -File scripts/run-tests-gemini.ps1

O atajo: npm run verify

## Fase 2 — Mapa de módulos a auditar

Verificá que cada área tenga tests pasando. Si un módulo no tiene tests, marcá GAP y proponé test mínimo.

| Módulo | Archivo test | Servicio |
|--------|-------------|----------|
| Ventas / Pedidos | __tests__/ventas/ | lib/ventas/ventas-service.ts |
| Precios (NUEVO) | __tests__/precios/ | lib/precios/motor-precios.ts |
| POS | __tests__/api/pos-venta-route.test.ts | app/api/pos/venta/route.ts |
| Stock | __tests__/stock/ | lib/stock/stock-service.ts |
| Compras | (API route tests) | lib/compras/compras-service.ts |
| Cobros / Pagos | __tests__/cobros/ __tests__/pagos/ | lib/cobros/ lib/pagos/ |
| Contabilidad | __tests__/contabilidad/ | lib/contabilidad/ |
| Impuestos / CITI | __tests__/impuestos/ | lib/impuestos/ |
| CRM | __tests__/crm/ | lib/crm/crm-service.ts |
| Aprobaciones | __tests__/aprobaciones/ | lib/aprobaciones/ |
| KPIs | __tests__/kpis/ | lib/kpis/kpi-service.ts |
| Industria / MRP | __tests__/industria/ | lib/industria/mrp-service.ts |
| Hospitalidad | __tests__/hospitalidad/ | app/api/cocina/ |
| IA / Agentes | __tests__/ai/ | lib/ai/agents/ |
| Onboarding | __tests__/onboarding/ | lib/onboarding/onboarding-ia.ts |
| Config / Rubro | __tests__/config/ | lib/config/rubro-config-service.ts |
| Auth | __tests__/auth/ | lib/auth/ |
| Agro | GAP — proponer test | lib/agro/agro-service.ts |
| E2E Playwright | GAP — no existe | — |

## Fase 3 — Gaps funcionales (estado Jun 2026)

- [x] Motor precios en ventas/POS/presupuestos/portal (`resolver-precios-lineas`)
- [x] API POST `/api/precios/calcular`
- [x] Tests E2E Playwright — 3/3 (`npm run test:e2e`)
- [x] Health-check — `scripts/health-check.ts`
- [x] Mercado Libre — stub `/api/mercadolibre`
- [ ] WhatsApp Twilio sandbox en prod — PARCIAL (dev mode OK)
- [ ] Redis/colas agentes IA — PENDIENTE
- [ ] Tests integración PostgreSQL real — PENDIENTE
- [ ] CI/CD GitHub Actions — PENDIENTE

## Fase 4 — Cierre (G11-G13)

**G11:** `npm run verify` + `npm run test:e2e` → reportar score /100
**G12:** Completar checklist en `TESTING_GEMINI.md`
**G13:** Leer y ampliar `docs/G13_DOCUMENTACION_Y_TECNOLOGIA.md`:
  - Qué documentación falta por proceso (deploy, AFIP, POS, API)
  - Qué tecnología falta (Redis, BullMQ, Sentry, CI)
  - Proponer G13-01 a G13-08 del sprint doc

## Fase 4 — Si encontrás fallos

1. Leé el error completo de Vitest
2. Identificá el archivo y línea
3. Proponé fix mínimo (no refactor masivo)
4. Volvé a correr solo el test afectado: npx vitest run __tests__/ruta/archivo.test.ts
5. Cuando pase, corré npm run verify

## Fase 5 — Formato del reporte final

Entregá un reporte con esta estructura:

### Resumen ejecutivo
- Tests: X/Y pasando
- Build: OK/FAIL
- Score funcional estimado: X/100

### Resultados por fase
(tabla comando → resultado)

### Módulos sin cobertura de tests
(lista con prioridad P1/P2/P3)

### Bugs encontrados
(título, severidad, archivo, fix sugerido)

### Recomendaciones para producción
(ordenadas por impacto)

## Reglas
- NO inventes resultados — ejecutá los comandos realmente
- NO modifiques código sin reportar qué cambiaste
- Si un test falla por mock incompleto en setup.ts, agregá el modelo Prisma faltante
- Priorizá fixes que desbloqueen ventas, POS, precios y auth
- Todo en español argentino
```

---

## Comandos rápidos de referencia

| Comando | Qué valida |
|---------|-----------|
| `npm run test:smoke` | Módulos críticos + cableado precios |
| `npm run test:erp` | 20 servicios + 13 rutas API |
| `npm run test:auth` | JWT, empresa-guard, 9 roles |
| `npm run test:precios` | Listas, escalones, resolver |
| `npm test` | Todo (~250 tests) |
| `npm run verify` | Tests + build |

## Gap cerrado en esta sesión

- Motor de precios integrado en `ventas-service`, `presupuesto-service` y `POST /api/pos/venta`
- Nuevo endpoint `POST /api/precios/calcular`
- Tests nuevos: resolver, ventas-precios, erp-coverage
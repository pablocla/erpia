# Auditoría Canónica del Ciclo de Vida del Software (Lifecycle Audit)

**Proyecto:** ERP Claver / Claver Cloud (`pos-system-argentina`)  
**Ticket:** `DOC-01` (Auditoría gaps ciclo de vida)  
**Asignado a:** `gemini`  
**Estado:** `done`  
**Fecha de Inspección:** 22 de Julio de 2026  
**Ciclo de Vida Canonical:** `foundation → build → comercial → onboarding → implementacion → go_live → postventa → growth → scale`

---

## 1. Resumen Ejecutivo

Esta auditoría mapea de forma exhaustiva las 9 etapas del ciclo de vida del software en el monorepo Claver ERP, evaluando qué artefactos y código existen en producción hoy, cuáles son los gaps técnicos y comerciales pendientes, y qué agente u owner (`grok`, `gemini`, `pair`, `human`) es responsable de la resolución de cada gap según la matriz de `ASSIGNMENT.md`.

---

## 2. Matriz Consolidada de Ciclo de Vida (Etapa × Existe × Gaps × Owner)

| Etapa | Sub-Etapa | Qué Existe Hoy en el Repo | Gaps Detectados | Ticket | Owner | Prioridad |
|:---|:---|:---|:---|:---|:---:|:---:|
| **1. foundation** | Auth & Multi-Tenant | `getAuthContext`, JWT `jose`, `whereEmpresa`, Prisma schema `Usuario` y `Empresa`. | Falta estandarización de logs audit de autenticación en webhooks. | `AUD-01` | **grok** | P0 (Hecho) |
| | Infra & Database | PostgreSQL (Supabase), Prisma ORM v6, `lib/prisma.ts`. | — | `ENG-00` | **grok** | P0 (Hecho) |
| | Backlog & Routing | `product-backlog-catalog.ts`, `backlog-status.json`, `ASSIGNMENT.md`. | — | `AG-00` | **grok** | P0 (Hecho) |
| **2. build** | POS Mostrador | Atajos de teclado `use-pos-shortcuts.ts`, parser balanza EAN-13 `ean13-scale-parser.ts`. | Selector de preferencia peso vs centavos por terminal de balanza (`ROI-01`). | `POS-01` | **grok** | P1 |
| | Empleados Digitales Engine | Motor Leo `lib/empleados-digitales/runtime/orchestrator.ts`, `router.ts` 0-tokens. | Implementación completa de balance de saldo de fiado (`ED-01`) y validación link de pago MP (`ED-03`). | `ED-01` / `ED-03` | **grok** | P0 / P1 ★ |
| | Cobertura QA | Suite Vitest `__tests__/`, `test:smoke`, `test:erp`. | Matriz formal de casos bordes para agentes y facturación (`QA_LEO_MATRIX.md`). | `QA-01` | **gemini** | P1 |
| **3. comercial** | Estrategia & Packaging | Catálogo `lib/marketplace/marketplace-catalog.ts`, `bundles.ts`, Sub-SaaS catalog. | One-pager comercial enfocado en dolor de fiados y WhatsApp (`LEO_ONE_PAGER.md`). | `COM-01` | **gemini** | P0 ★ |
| | Manejo de Objeciones | Matriz informal de respuestas de venta en docs. | Matriz estructurada de ≥12 objeciones comerciales reales del comerciante argentino (`OBJECIONES_VENTA.md`). | `COM-02` | **gemini** | P1 |
| | Script de Venta | Guiones parciales de demostración. | Script de demo cronometrado de 15 min para venta en calle/kiosco (`SCRIPT_DEMO_15.md`). | `COM-03` | **gemini** | P1 |
| | Precios Canónicos | Valores ARS en componentes de vitrina. | Fijación de precio base oficial y escalado por volumen (`HUM-01`). | `HUM-01` / `ED-22` | **human** / **pair** | P0 |
| **4. onboarding** | Ingesta de Datos | Componente `CSVImport`, `excel-column-matcher.ts` con mapeo difuso. | Falta conectar `CSVImport` en la importación de productos en masivo (`app/dashboard/productos`). | `AUD-03` | **grok** | P1 (Hecho) |
| | Secuencia Trial | Banners de trial en dashboard (`trial-banner.tsx`). | Secuencia de 4 emails/mensajes automáticos D0–D7 para conversión a pago (`TRIAL_SEQUENCE_LEO.md`). | `ONB-01` | **gemini** | P1 |
| | Wizard Activación | Pantalla `/demo` e `industry-demo-service.ts`. | Microcopy y Wizard guiado de 3 pasos en primer login (`ED-09`). | `ED-09` | **pair** | P1 |
| **5. implementacion** | Metodología CCA | Flujos CCA-010 a CCA-080 en `docs/marketplace/00-ciclo-completo.md`. | Runbook operativo paso a paso para analista Cloud (`leo-cobranzas.md`). | `IMP-01` | **gemini** | P1 |
| | Calidad & UAT | Servidor homologación AFIP y seeders de prueba. | Checklist UAT de 15 puntos PASS/FAIL previo a producción (`UAT_CHECKLIST.md`). | `IMP-03` | **gemini** | P1 |
| **6. go_live** | Despliegue PRD | Health check `/api/go-live/status`, `docs/deploy/VERCEL_ENV.md`. | Playbook de primeras 24 horas en producción (`GO_LIVE_D0.md`). | `GL-02` | **gemini** | P2 |
| | Selección Pilotos | Criterios de piloto en `docs/GO_LIVE_PRD.md`. | Selección y firma de 1 a 3 comercios reales para piloto (`HUM-02`). | `HUM-02` | **human** | P0 |
| **7. postventa** | Retención & Hipercare | Monitoreo de eventos de plataforma `platform-events.ts`. | Playbook de cadencias de éxito y soporte postventa (`POSTVENTA_LEO.md`). | `PV-01` | **gemini** | P1 |
| | Soporte Nivel 1 | Redirección de impersonación `/api/claver/tenants/[id]/impersonate`. | Árbol de decisión y macros para soporte L1 (`MACROS_L1.md`). | `PV-03` | **gemini** | P2 |
| **8. growth** | Viralidad & Retención | Libreta de fiado por WhatsApp `lib/fiado/fiado-whatsapp.ts`. | Portal del Contador para exportación del Libro IVA Digital 1-Clic (`/dashboard/contador`). | `AUD-05` | **grok** | P1 (Hecho) |
| | Control Inflación | Reexpresión de precios por IPC `lib/inflacion/reexpresar-precios.ts`. | — | `AUD-06` | **grok** | P1 (Hecho) |
| **9. scale** | POS Offline PWA | Cola IndexedDB local `lib/pos/pos-offline-queue.ts`. | Service Worker nativo para instalación PWA offline completa en celular/PC. | `POS-01` | **grok** | P2 |
| | Multi-Terminal | BroadcastChannel local `hooks/use-presence.ts`. | Canal Supabase Realtime multi-dispositivo para prevención de colisión multi-caja. | `AUD-08` | **grok** | P1 (Hecho) |

---

## 3. Plan de Mitigación de Gaps Prioritarios (Top 5 P0/P1)

1. **DOC-01 (Auditoría Ciclo de Vida - Realizado)**: Este documento cierra el mapa de brechas.
2. **COM-01 (One-Pager Comercial Leo Cobranza)**: Crear la pieza comercial canónica en `docs/comercial/LEO_ONE_PAGER.md` para acelerar la venta en calle.
3. **ED-01 (Saldo Fiado en Motor Leo)**: Grok debe completar el cálculo atómico de saldos vencidos en `lib/empleados-digitales/tools/leer-deudas.ts`.
4. **ONB-01 (Secuencia Emails Trial D0–D7)**: Gemini redactará la secuencia de 4 impactos automáticos para elevar la conversión del 14-day trial.
5. **IMP-01 (Runbook CCA Cloud)**: Definir los pasos operativos del analista para provisionar el módulo Leo Cobranza en clientes Enterprise.

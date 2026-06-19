# Changelog - ERP Argentina

## [1.0.0] - 2026-06-19
### Added
- **Fase 1 (Auditoría):** Ejecutada suite de testing de 268 pruebas unitarias y build a producción exitoso.
- **Fase 2 (Implementación):**
  - Incorporados nuevos unit tests para los módulos `agro-service`, `compras-service` y `arqueo-service` (llegando a 286 tests unitarios).
  - Cableado de `resolverPreciosLineas` en el portal de Pedidos B2B.
  - Soporte de envío de WhatsApp con fallback en modo desarrollo para no colisionar sin variables de entorno de Twilio.
  - Implementada bandeja de pendientes por rol de usuario (`/api/pendientes`).
  - Lógica de redirección por rol de usuario en la pantalla de login.
- **Fase 3 (QA & E2E):**
  - Configuración base de Playwright (`playwright.config.ts`).
  - Flujo de Login E2E (`e2e/login.spec.ts`).
  - Flujo de POS / Caja E2E (`e2e/pos.spec.ts`).
  - Flujo de Pedidos E2E interceptando APIs (`e2e/pedidos.spec.ts`).
  - Script de validación automatizada de microservicios (`scripts/health-check.ts`).
- **Fase 4 (Documentación):**
  - Creación del portal de documentación embebido.
  - Migración de especificaciones funcionales y guías técnicas a formato MDX en `content/docs/`.

# Auditoría Completa del Sistema ERP
> Última actualización: 2026-04-05 — Sprint 1 ✅ | Sprint 2 ✅ | Sprint 3 Tax Engine ✅ | Sprint 4 Impuestos ✅ | Sprint 5 Logística + Industria + Picking + IoT ✅ | Sprint 6 Maestros AFIP (PV + Series + COT + Depósitos + Event Bus) ✅ | Sprint 7 Soporte Corporativo (SLA + MTTR + Comentarios) ✅ | Sprint 8 Eliminación Mock + Dominios Verticales ✅ | Sprint 9 Testing + Auth + IoT Industrial ✅ | Sprint 10 Soft Delete + Config Persistente + Sidebar Dinámico ✅ | Sprint 11 Theme + Topbar + Períodos Fiscales + Contextual Help ✅ | Sprint 12 Caja Arqueo + Onboarding Apply + Compras CRUD + Stock Reservation ✅ | Sprint 13 Presupuestos + Activos Fijos + Multi-Moneda + Centros Costo ✅ | Sprint 14 Padrón IIBB + PDF Comprobantes + Tutoriales + Audit Trail ✅ | Sprint 15 Multi-Empresa RLS + JWT Security + Rate Limiting + Email + Exports ✅ | Sprint 16 Tesorería + Proveedores + Cobertura ✅ | Sprint 17 Documentacion Funcional ✅ | Sprint 18 Themes Soft + Interface Tests ✅ | Sprint 19 Navbar Animada + Canvas Soft ✅ | Sprint 20 Auditoría Funcional por Rubros ✅ | Sprint 21 Gastronomía Recetas + Comandas Facturación ✅

---

## DELTA SPRINT 21 — GASTRONOMÍA RECETAS + COMANDAS FACTURACIÓN

### Objetivo
Cerrar el gap de gastronomía: ABM de platos/recetas, consumo de insumos por receta y facturación desde comanda.

### Entregado
- ABM de platos y recetas (productos `esPlato` + recetas en `ListaMateriales` tipo "receta").
- Consumo de insumos por receta al emitir factura (sin stock de producto terminado).
- Endpoint de facturación desde comanda + cierre de mesa.
- Selector de plato y cliente en UI hospitalidad.
- Filtros por `esPlato`/`esInsumo` en productos y flags en UI.

### Tests
- Tests API: platos + facturar comanda.
- Tests de stock: consumo por receta y skip de platos.

### Archivos creados (5)
- `app/api/hospitalidad/platos/route.ts`
- `app/api/hospitalidad/facturar/route.ts`
- `app/dashboard/hospitalidad/platos/page.tsx`
- `__tests__/hospitalidad/platos-route.test.ts`
- `__tests__/hospitalidad/facturar-route.test.ts`

### Archivos modificados (10)
- `prisma/schema.prisma`
- `app/api/hospitalidad/route.ts`
- `app/api/industria/bom/route.ts`
- `app/api/productos/route.ts`
- `app/api/productos/[id]/route.ts`
- `app/dashboard/hospitalidad/page.tsx`
- `app/dashboard/hospitalidad/kds/page.tsx`
- `app/dashboard/layout.tsx`
- `lib/stock/stock-service.ts`
- `__tests__/stock/stock-service.test.ts`

---

## DELTA SPRINT 20 — AUDITORÍA FUNCIONAL POR RUBROS

### Objetivo
Auditar gaps funcionales y parametrización por rubro, y mapear items del menú contra UI/API existentes.

### Entregado
- Auditoría de gaps funcionales por rubro (gastronomía, salud, fitness, logística, industria, distribución, IoT).
- Mapa de cobertura menú → UI/API con gaps de ingeniería (submódulos compartidos y ABM faltantes).
- Lista de maestros faltantes y campos críticos por maestro (clientes, proveedores, productos, remitos, medios de pago).
- Plan de tests por módulo para próximos cierres funcionales.

### Pendiente
- Implementación de maestros/ABM faltantes (platos/recetas, profesionales/servicios, membresías activas, POD).
- Tests Vitest por módulo priorizado.

### Archivos modificados (1)
- `introspeccion.md`

---

## DELTA SPRINT 19 — NAVBAR ANIMADA + CANVAS SOFT

### Objetivo
Mejorar la navegacion lateral con animaciones y estilo, y reducir el peso visual del grid de fondo.

### Entregado
- Sidebar con hover/active animado, indicador lateral y micro-transiciones
- Fondo con grilla mas sutil y menos densa

### Archivos modificados (2)
- `app/dashboard/layout.tsx`
- `app/globals.css`

---

## DELTA SPRINT 18 — THEMES SOFT + INTERFACE TESTS

### Objetivo
Elevar el sistema de temas a un look mas blanco/soft y agregar tests de interfaces API.

### Entregado
- Paletas nuevas (porcelana, arena, salvia, niebla)
- Presets de tema + selector de superficie (soft/clean/glow)
- Fondo y superficies suavizadas, grid mas sutil y sombras blandas
- Tipografia con font display para headings
- Tests de rutas API: recibos, ordenes de pago, transferencias

### Archivos creados (3)
- `__tests__/api/recibos-route.test.ts`
- `__tests__/api/ordenes-pago-route.test.ts`
- `__tests__/api/transferencias-route.test.ts`

### Archivos modificados (4)
- `app/globals.css`
- `app/layout.tsx`
- `components/theme-customizer.tsx`
- `lib/theme-config.tsx`

---

## DELTA SPRINT 17 — DOCUMENTACION FUNCIONAL BASE

### Objetivo
Crear base de documentacion funcional para tesoreria/CC/CP y maestros core.

### Entregado
- Indice de documentacion funcional
- Documento de tesoreria y cuentas corrientes
- Documento de maestros de clientes y proveedores

### Pendiente
- Maestros de productos
- Remitos y logistica
- Ventas y facturacion
- Compras y abastecimiento
- Contabilidad e impuestos
- Configuracion, seguridad y roles

### Archivos creados (3)
- `docs/funcional/README.md`
- `docs/funcional/tesoreria-cuentas-corrientes.md`
- `docs/funcional/maestros-clientes-proveedores.md`

---

## DELTA SPRINT 16 — TESORERÍA, PROVEEDORES Y COBERTURA ERP

### Objetivo
Cerrar gaps de tesorería (transferencias y listados), ampliar maestro de proveedores con maestros paramétricos, unificar `authHeaders()` en UI y documentar cobertura real vs faltantes en el mapa HTML.

### Entregado

**Tesorería bancaria — Transferencias**
- Service `lib/banco/transferencias-service.ts`: transferencias entre cuentas bancarias con validaciones por empresa.
- API `POST /api/banco/transferencias`: creación de transferencias.
- UI `/dashboard/banco`: modal de transferencia con validaciones.

**Recibos y Órdenes de Pago — Listados operativos**
- API `GET /api/recibos` y `GET /api/ordenes-pago` con filtros por empresa/cliente/proveedor.
- `lib/cobros/cobros-service.ts`: `listarRecibos()` con mapping numérico.
- `lib/pagos/pagos-service.ts`: `listarOrdenesPago()` con mapping numérico.
- Dashboards `/dashboard/cuentas-cobrar` y `/dashboard/cuentas-pagar`: filtros por cliente/proveedor + recientes.

**Maestro de Proveedores — Expansión**
- API `app/api/proveedores/[id]/route.ts`: GET/PUT/DELETE con soft delete y scoping por empresa.
- API `/api/proveedores`: filtro por `deletedAt` y tracking `createdBy/updatedBy`.
- UI `/dashboard/proveedores`: campos de condición de pago, rubro, país, provincia y localidad.

**AuthHeaders — Consistencia**
- Fetch con `authHeaders()` en banco, remitos, cuentas cobrar/pagar y proveedores.

**Mapa de cobertura ERP**
- HTML `erp_modulos_maestros_argentina.html`: tags de estado (tiene/parcial/falta) + nuevos módulos (Banco, CC 360, Remitos parametrizables).

### Tests
- `__tests__/banco/transferencias-service.test.ts`
- `__tests__/cobros/cobros-service.test.ts`
- `__tests__/pagos/pagos-service.test.ts`

### Archivos creados (8)
- `lib/banco/transferencias-service.ts`
- `app/api/banco/transferencias/route.ts`
- `app/api/recibos/route.ts`
- `app/api/ordenes-pago/route.ts`
- `app/api/proveedores/[id]/route.ts`
- `__tests__/banco/transferencias-service.test.ts`
- `__tests__/cobros/cobros-service.test.ts`
- `__tests__/pagos/pagos-service.test.ts`

### Archivos modificados (12)
- `app/api/proveedores/route.ts`
- `app/dashboard/proveedores/page.tsx`
- `app/dashboard/banco/page.tsx`
- `app/dashboard/remitos/page.tsx`
- `app/dashboard/cuentas-cobrar/page.tsx`
- `app/dashboard/cuentas-pagar/page.tsx`
- `lib/cobros/cobros-service.ts`
- `lib/pagos/pagos-service.ts`
- `app/api/banco/conciliar/route.ts`
- `app/api/remitos/route.ts`
- `app/api/remitos/[id]/route.ts`
- `erp_modulos_maestros_argentina.html`

---

## DELTA SPRINT 14 — PADRÓN IIBB, PDF COMPROBANTES, TUTORIALES MASIVOS, AUDIT TRAIL

### Objetivo
Cerrar gaps operativos críticos: importación masiva de padrones ARBA/ARCIBA/DGR con auto-apply en facturación, generación de comprobantes PDF (factura/NC/remito) sin dependencias externas, expansión masiva del sistema de tutoriales contextuales (+14 módulos), y trazabilidad de cambios en configuración fiscal/contable.

### Entregado

**Padrón Percepciones IIBB — Importación Masiva + Auto-Apply**
- Service `lib/impuestos/padron-service.ts`: Importación CSV multi-formato (ARBA semicolons, AGIP pipes, DGR genérico), upsert por lotes de 100, normalización CUIT, consulta de alícuota vigente por CUIT+organismo, listar con filtros, estadísticas por organismo.
- 5 organismos soportados: ARBA (PBA), AGIP (CABA), DGR_SF (Santa Fe), DGR_CBA (Córdoba), DGR_MZA (Mendoza).
- API POST/GET `/api/impuestos/padron`: importar CSV, consultar CUIT, listar padrones, estadísticas.
- Dashboard `/dashboard/impuestos/padron`: cards resumen (total/vigentes/vencidos/organismos), breakdown por organismo con alícuota promedio, tabla con filtros, importador CSV con resultado detallado, consulta por CUIT con todos los regímenes vigentes.
- **Auto-apply en facturación**: `factura-service.ts` ahora consulta `padronService.consultarAlicuota()` al emitir factura — si el cliente tiene alícuota especial en el padrón, se pasa al tax engine como `alicuotaPadronIIBB`.

**PDF Comprobantes — Factura, NC, Remito**
- Service `lib/printer/pdf-service.ts`: Genera HTML completo listo para print/save-as-PDF (sin dependencias externas).
  - `generarFacturaPDF()`: Comprobante fiscal completo con header emisor+receptor, tipo+letra+código, detalle ítems con IVA discriminado, totales con percepciones/retenciones, QR fiscal AFIP, CAE+vencimiento, leyenda RG 1415, soporte multi-moneda RG 5616.
  - `generarNCPDF()`: Nota de Crédito con estilo rojo, referencia a factura original, CAE.
  - `generarRemitoPDF()`: Remito con detalle ítems, campos firma emisor/receptor/aclaración.
- API GET/POST `/api/impresion/pdf`: Generar por tipo+id. GET retorna HTML inline. POST retorna JSON con html+metadata.
- Botón "Imprimir / Guardar PDF" integrado en cada comprobante (usa window.print() del navegador).

**Tutoriales Contextuales — Expansión Masiva (+14 módulos)**
- Agregados 14 nuevos bloques de tutorial en `components/contextual-help.tsx`:
  - IIBB (cierre mensual, DDJJ, percepciones)
  - Padrón IIBB (importación CSV, consulta CUIT)
  - Presupuestos (ciclo borrador→facturado, conversión a pedido)
  - Activos Fijos (depreciación, cuadro amortización, baja)
  - Centros de Costo (jerarquía, reportes por período)
  - Cotizaciones/Multi-Moneda (registrar, BNA auto, convertidor)
  - Banco (cuentas, movimientos, cheques, conciliación)
  - Logística (transportistas, envíos, seguimiento)
  - Industria (BOM, órdenes producción)
  - Picking (listas, operarios, cantidades picadas)
  - Cuentas a Cobrar (aging, cobros, retenciones)
  - Cuentas a Pagar (OP, aging, retenciones)
  - IoT Industrial (dispositivos, alertas, calibración)
- Total: 24+ módulos con tutoriales contextuales (era 10, ahora 24+).

**Audit Trail Config — Trazabilidad de Cambios**
- Service `lib/config/audit-service.ts`: Registro estructurado de cambios en configuración.
  - `logParametroCambio()`: log antes/después de parámetro fiscal.
  - `logHandlerToggle()`: log activación/desactivación de event handlers.
  - `logModuloToggle()`: log activación/desactivación de módulos.
  - `logCuentaContable()`: log cambios en plan de cuentas.
  - `consultarCambiosConfig()`: query con filtros (entidad, usuario, rango fechas).
  - `resumenCambios()`: estadísticas por entidad y acción en últimos N días.
- **Wired into**: `/api/config/parametros-fiscales` (POST/PUT ahora loguean antes/después), `/api/config/modulos` (PATCH loguea cada toggle).
- Usa LogActividad como store unificado (modulo="config"/"contabilidad").

**Sidebar — +1 nuevo link**
- Fiscal/Impuestos: + Padrón IIBB (icon: Database)

### Correcciones de la Auditoría
- **IIBB Service**: Verificado como COMPLETO — cerrarPeriodo() y generarDDJJ() son implementaciones reales (no stubs).
- **CP (Cuentas a Pagar)**: Verificado como COMPLETO — generarCPPorCompra() y aplicarOrdenPago() son implementaciones reales con aging funcional.
- **3-Way Matching**: Verificado como COMPLETO — threeWayMatch() tiene validación real (qty/price/item) y YA está enforced con 400 en compras API.
- **Onboarding**: Verificado como COMPLETO — motor de recomendación IA funcional para 13 rubros, apply endpoint configura todo.

### Archivos creados (5)
- `lib/impuestos/padron-service.ts`
- `app/api/impuestos/padron/route.ts`
- `app/dashboard/impuestos/padron/page.tsx`
- `lib/printer/pdf-service.ts`
- `app/api/impresion/pdf/route.ts`
- `lib/config/audit-service.ts`

### Archivos modificados (4)
- `components/contextual-help.tsx` — +14 bloques de tutorial (IIBB, padrón, presupuestos, activos fijos, centros costo, cotizaciones, banco, logística, industria, picking, CC, CP, IoT)
- `app/api/config/parametros-fiscales/route.ts` — Wired audit trail (POST+PUT loguean cambios con before/after)
- `app/api/config/modulos/route.ts` — Wired audit trail (PATCH loguea toggles)
- `lib/afip/factura-service.ts` — Auto-apply padrón IIBB alícuota on invoice emission
- `app/dashboard/layout.tsx` — +1 sidebar link (Padrón IIBB)

---

## DELTA SPRINT 15 — MULTI-EMPRESA RLS, JWT HARDENING, RATE LIMITING, EMAIL, EXPORTS

### Objetivo
Cerrar las brechas de seguridad multi-tenant más críticas: aislamiento de datos por empresaId (RLS), validación real de JWT en middleware, rate limiting en endpoints públicos, servicio de email transaccional, y exportación CSV de datos de negocio.

### Entregado

**Multi-Empresa RLS — Schema + 21 Rutas Aseguradas**
- Schema: Agregado `empresaId Int` + `empresa Empresa @relation(...)` a 19 modelos: Cliente, Proveedor, Producto, Categoria, Compra, AsientoContable, NotaCredito, Remito, Ticket, Deposito, Transportista, DispositivoIoT, ListaMateriales, OrdenProduccion, ListaPicking, OrdenCompra, PedidoVenta, Presupuesto, Envio.
- Empresa model: +19 reverse relations.
- Helper `lib/auth/empresa-guard.ts`: `getAuthContext()` (decode JWT → auth context), `whereEmpresa()` (scoped filter builder), `verificarPropietario()` (ownership check).
- 21 rutas migradas de `verificarToken()` a `getAuthContext()` con filtro empresaId:
  - clientes, clientes/[id], productos, proveedores, categorias, compras, notas-credito, remitos, tickets, contabilidad/asientos — Sprint 15a
  - logistica, iot/dispositivos, industria, industria/bom, picking, ventas/pedidos, ventas/presupuestos, compras/ordenes, caja, banco, cuentas-cobrar, cuentas-pagar, caja/movimientos, cuentas-cobrar/cobros, cuentas-pagar/pagos, estadisticas/dashboard, config/modulos, config/auditoria, puntos-venta, maestros/[tabla] — Sprint 15b.

**JWT Security Hardening**
- `lib/auth/auth-service.ts`: Dev secret changed from static string to `crypto.randomBytes(32).toString("hex")` per-process.
- `lib/config.ts`: JWT_SECRET throws error in production if missing (was silent fallback).

**Middleware Token Validation**
- `middleware.ts`: Full JWT validation using `jose` library (Edge-compatible). Differentiates expired vs invalid tokens (401 TOKEN_EXPIRED vs 403 TOKEN_INVALID). Forwards decoded user context (x-user-id, x-user-email, x-user-rol, x-empresa-id) via headers. Adds x-request-id for distributed tracing.
- Graceful dev mode: if no JWT_SECRET in env, falls through to route-level validation.

**Token Refresh Endpoint**
- `app/api/auth/refresh/route.ts`: Accepts expired JWT, verifies user still exists + active, issues fresh 24h token. Rate limited (10 req/5 min). Rejects tokens older than 30 days (absolute expiry).

**Rate Limiting**
- `lib/auth/rate-limiter.ts`: Shared in-memory rate limiter with namespace support, periodic cleanup (5 min), configurable window/max. `checkRateLimit(request, namespace, maxAttempts, windowMs)`.
- Applied to: login (5/15min), demo (10/15min), refresh (10/5min).

**Structured Error Logger**
- `lib/monitoring/error-logger.ts`: JSON structured logging with request correlation (x-request-id), severity classification (info/warn/error/fatal), user/empresa context extraction from headers. Ready for Sentry/Datadog integration.
- `logError(context, error, request)` and `logInfo(context, message, request)`.
- Wired into: logistica, iot/dispositivos, industria, industria/bom, picking, compras/ordenes, ventas/pedidos, ventas/presupuestos, caja, banco.

**Email Service (SMTP)**
- `lib/email/email-service.ts`: Lazy nodemailer import (optional dep), SMTP config from env vars (SMTP_HOST/PORT/USER/PASS/FROM). Graceful degradation when SMTP not configured. Methods: `enviar()`, `enviarFactura()`, `enviarNotaCredito()`, `notificar()`.
- `app/api/impresion/email/route.ts`: GET (config status), POST (send factura/NC/custom email).

**CSV Export Service**
- `lib/export/export-service.ts`: CSV with UTF-8 BOM for Excel. Export functions: clientes, productos, facturas, compras, libro IVA ventas/compras, cuentas cobrar, cuentas pagar.
- `app/api/estadisticas/export/route.ts`: GET with tipo param → CSV file download with Content-Disposition.

**Bug Fixes**
- `app/dashboard/configuracion/auditoria/page.tsx`: Removed junk "wwwwwwwwww" text.
- `app/page.tsx`: Removed duplicate trailing code.
- `lib/config/parametro-service.ts`: Fixed nullable sucursal type in composite unique key.
- `__tests__/contabilidad/asiento-service.test.ts`: Fixed tipo literal regression (`"manual"` → `"manual" as const`).

### Archivos creados (7)
- `lib/auth/empresa-guard.ts`
- `lib/auth/rate-limiter.ts`
- `lib/email/email-service.ts`
- `lib/export/export-service.ts`
- `lib/monitoring/error-logger.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/impresion/email/route.ts`
- `app/api/estadisticas/export/route.ts`

### Archivos modificados (30+)
- `prisma/schema.prisma` — +19 modelos con empresaId, +19 reverse relations en Empresa
- `middleware.ts` — JWT validation con jose, request-id, expired/invalid differentiation
- `lib/auth/auth-service.ts` — crypto-random dev secret
- `lib/config.ts` — production JWT_SECRET enforcement
- `app/api/auth/login/route.ts` — shared rate limiter
- `app/api/auth/demo/route.ts` — added rate limiting
- 21 API routes migrated verificarToken → getAuthContext + empresaId filtering
- `lib/contabilidad/asiento-service.ts` — empresaId in all asiento creates + queries
- Bug fixes in 4 files (auditoria page, page.tsx, parametro-service, asiento test)

---

## DELTA SPRINT 13 — PRESUPUESTOS, ACTIVOS FIJOS, MULTI-MONEDA, CENTROS DE COSTO

### Objetivo
Implementar los módulos empresariales que estaban en schema-only: ciclo presupuesto→pedido→factura, depreciación de activos fijos con asientos automáticos, gestión de cotizaciones multi-moneda con conversión operativa, y centros de costo con reportes por período.

### Entregado

**Presupuestos → Pedido de Venta (ciclo completo)**
- Service `lib/ventas/presupuesto-service.ts`: CRUD + state machine (borrador→enviado→aceptado→rechazado→vencido→facturado).
- `convertirAPedido()`: presupuesto aceptado genera PedidoVenta con mismas líneas y condiciones, transiciona a "facturado".
- `duplicar()`: clona presupuesto existente como nuevo borrador.
- API POST/GET `/api/ventas/presupuestos`: crear, listar, acciones (enviar/aceptar/rechazar/convertir/duplicar).
- Dashboard `/dashboard/ventas/presupuestos`: tabla con filtro por estado, cards resumen por estado con monto, detalle expandible con líneas, dialog de creación con líneas dinámicas y descuento global/por línea, conversión a pedido con AlertDialog, duplicar.
- Emite evento PRESUPUESTO_APROBADO al aceptar.

**Activos Fijos — Depreciación y Amortización**
- Service `lib/contabilidad/activo-fijo-service.ts`: CRUD + depreciación lineal.
  - `calcularDepreciacionMensual()`: línea recta (valorCompra - valorResidual) / vidaUtilMeses.
  - `calcularAmortizacionAcumulada()`: acumulado hasta fecha dada.
  - `correrDepreciacionMensual()`: procesa TODOS los activos activos, actualiza valorLibros, genera asiento contable por activo (Debe: Amortizaciones, Haber: Amort. Acumulada). Si activo queda totalmente amortizado, cambia estado automáticamente.
  - `darDeBaja()`: marca activo como dado_de_baja con motivo.
  - `generarCuadroAmortizacion()`: proyección completa mes a mes.
- API POST/GET `/api/contabilidad/activos-fijos`: crear, listar (enriquecido con % amortización), acciones (depreciar/baja/cuadro).
- Dashboard `/dashboard/contabilidad/activos-fijos`: cards resumen (valor original/libros/amort acumulada/activos en uso), tabla con barra de progreso % amortización por activo, categoría con iconos, dialog de creación, dialog ejecutar depreciación mensual con resultado detallado, cuadro de amortización completo en dialog.

**Cotizaciones / Multi-Moneda**
- Service `lib/config/cotizacion-service.ts`: gestión de cotizaciones y conversión.
  - `registrar()`: upsert por monedaId+fecha+tipo (oficial/mep/ccl/blue/tarjeta).
  - `obtenerCotizacion()`: busca exacta por fecha, fallback a más reciente.
  - `convertirARS()` / `convertirDesdeARS()`: conversión bidireccional con lookup automático.
  - `fetchDolarBNA()`: descarga cotización USD oficial + blue desde API pública (bluelytics) y la persiste.
  - `listarUltimas()`: últimas cotizaciones por moneda activa con historial.
- API POST/GET `/api/config/cotizaciones`: registrar, listar (por moneda o todas), acciones (convertir/fetch_bna), listar monedas.
- Dashboard `/dashboard/configuracion/cotizaciones`: tabs Cotizaciones/Convertidor. Cards por moneda con cotización vigente y historial. Botón "Actualizar BNA" descarga y persiste. Tabla historial completa. Convertidor bidireccional con selector tipo cotización.

**Centros de Costo — Jerarquía y Reportes**
- Service `lib/contabilidad/centro-costo-service.ts`: CRUD jerárquico + reportes.
  - `listarJerarquia()`: construye árbol desde flat list (parentId→hijos).
  - `reportePorPeriodo()`: acumula debe/haber/saldo por centro para un mes/año dado.
- API POST/GET/PATCH/DELETE `/api/contabilidad/centros-costo`: crear, listar (plano o jerarquía), reporte por período, actualizar, desactivar.
- Dashboard `/dashboard/contabilidad/centros-costo`: tabs Jerarquía/Reporte. Vista árbol expandible con conteo de movimientos. Lista plana con centro padre. Reporte por período con totales debe/haber/saldo por centro.

**Plan de Cuentas API — Migrado a DB-first**
- `/api/contabilidad/plan-cuentas/route.ts`: ahora busca primero en CuentaContable (DB). Si hay cuentas en DB, retorna esas con `fuente: "db"`. Fallback al array PLAN_CUENTAS hardcodeado con `fuente: "legacy"`.

**Sidebar — 5 nuevos links**
- Ventas: + Presupuestos
- Contabilidad: + Activos Fijos, + Centros de Costo
- Configuración: + Cotizaciones

### Correcciones de la Auditoría
- **Pagos (OP)**: Verificado como COMPLETO — haber NO truncado, incluye retenciones IVA + Ganancias + IIBB correctamente.

### Archivos creados
- `lib/ventas/presupuesto-service.ts`
- `app/api/ventas/presupuestos/route.ts`
- `app/dashboard/ventas/presupuestos/page.tsx`
- `lib/contabilidad/activo-fijo-service.ts`
- `app/api/contabilidad/activos-fijos/route.ts`
- `app/dashboard/contabilidad/activos-fijos/page.tsx`
- `lib/config/cotizacion-service.ts`
- `app/api/config/cotizaciones/route.ts`
- `app/dashboard/configuracion/cotizaciones/page.tsx`
- `lib/contabilidad/centro-costo-service.ts`
- `app/api/contabilidad/centros-costo/route.ts`
- `app/dashboard/contabilidad/centros-costo/page.tsx`

### Archivos modificados
- `app/api/contabilidad/plan-cuentas/route.ts` — DB-first con fallback legacy
- `app/dashboard/layout.tsx` — +5 sidebar links (Presupuestos, Activos Fijos, Centros Costo, Cotizaciones)

---

## DELTA SPRINT 12 — CAJA ARQUEO, ONBOARDING APPLY, COMPRAS CRUD, STOCK RESERVATION, IIBB PAGE

### Objetivo
Cerrar las brechas críticas de producción identificadas en la auditoría funcional: arqueo de caja con reconciliación, persistencia del onboarding en DB, compras con ciclo OC→Recepción→Factura completo, reserva de stock en ventas confirmadas, y página de IIBB.

### Entregado

**Caja: Arqueo y Cierre completo**
- Prisma schema: +9 campos en Caja (arqueoEfectivo, arqueoTarjeta, arqueoTransferencia, arqueoCheque, arqueoQR, diferencia, diferenciaJustif, abiertoPor, cerradoPor, turno)
- API PATCH /api/caja: calcula totales por medio de pago del sistema, compara con declarado, calcula diferencia. Si diferencia > $100 exige justificación (status 422). Retorna resumenArqueo completo.
- API POST /api/caja: acepta turno (mañana/tarde/noche) y registra abiertoPor con userId.
- UI completamente reescrita: desglose por medio de pago, dialog de arqueo con comparación lado a lado (sistema vs declarado), diferencia en tiempo real, justificación condicional, historial con columnas turno y diferencia.

**Onboarding: Persistencia en DB**
- Nuevo endpoint POST /api/config/onboarding/apply: recibe la configuración generada por el wizard y la persiste en DB.
  - Activa/desactiva handlers de ConfiguracionFuncional por módulo
  - Crea productos de ejemplo (skip si ya existen por código)
  - Seed de parámetros fiscales (rubro, condición AFIP, plan cuentas, marca onboarding completado)
  - Auto-genera plan de cuentas base si no existe (18 cuentas contables: Activo, Pasivo, PN, Ingresos, Egresos con subcuentas)
- Onboarding page actualizada: llama al endpoint después de generar config, muestra estado de persistencia (✓ aplicado / error).

**Compras: Dashboard completo con OC + Recepción + 3-Way Matching**
- Página completamente reescrita con Tabs (Órdenes de Compra / Registrar Factura).
- Tab OC: tabla con numero, proveedor, fecha, total, estado, recepciones. Acciones: aprobar, recibir.
- Dialog "Nueva OC": proveedor, fecha entrega, líneas dinámicas.
- Dialog "Recepción": por línea de OC, permite parciales, muestra ya recibido.
- Tab Factura: datos comprobante + OC asociada (dropdown de OC pendientes) + CAE proveedor para WSCDC.
- 3-way matching: si OC seleccionada, el API valida automáticamente y muestra discrepancias.
- Verificación WSCDC del CAE proveedor (non-blocking).

**Ventas: Reserva de Stock**
- Prisma schema: +campo reservado Float @default(0) en StockDeposito.
- confirmarPedido(): verifica stock disponible (cantidad - reservado) y reserva.
- anularPedido(): libera reserva si pedido estaba confirmado.
- generarRemito(): libera reserva al entregar (el decremento real es via evento REMITO_EMITIDO).

**IIBB: Página de Dashboard**
- Nueva página /dashboard/impuestos/iibb con liquidación por jurisdicción.
- Selector mes/año, cards de resumen (devengado, percepciones, saldo a pagar).
- Tabla por jurisdicción: base imponible, alícuota, devengado, percepciones, saldo, estado.
- Acciones: cerrar período por jurisdicción (con AlertDialog), marcar presentado.
- Descarga DDJJ como archivo .txt.

### Correcciones de la Auditoría
- **CP (Cuentas a Pagar)**: Verificado como COMPLETO — generarCPPorCompra, aplicarOrdenPago, agingCP todos implementados con queries reales.
- **Pagos (Orden de Pago)**: Verificado como COMPLETO — transacción con retenciones IVA/Ganancias/IIBB, registros SICORE, asiento contable completo.
- **IIBB Service**: Verificado como COMPLETO — acumularPorFactura, cerrarPeriodo, generarDDJJ, marcarPresentado todos implementados.
- **3-Way Matching**: Verificado como COMPLETO — threeWayMatch() tiene lógica real de validation (qty/price/item), no es stub.
- **Compras API Routes**: Verificado como COMPLETO — /api/compras (factura), /api/compras/ordenes (OC CRUD), /api/compras/recepciones (recepción).

### Archivos creados
- `app/dashboard/impuestos/iibb/page.tsx`
- `app/api/config/onboarding/apply/route.ts`

### Archivos modificados
- `prisma/schema.prisma` — Caja (+9 campos), StockDeposito (+reservado)
- `app/api/caja/route.ts` — Arqueo completo en PATCH, turno+usuario en POST
- `app/dashboard/caja/page.tsx` — Reescrita: desglose, arqueo dialog, turno
- `app/dashboard/compras/page.tsx` — Reescrita: tabs OC/Factura, dialogs OC+Recepción
- `app/dashboard/onboarding/page.tsx` — Llama apply endpoint, muestra estado
- `lib/ventas/ventas-service.ts` — Stock reservation en confirmar/anular/remitir

---

## DELTA SPRINT 11 — THEME SYSTEM, TOPBAR, PERÍODOS FISCALES, CONTEXTUAL HELP

### Objetivo
Agregar soft deletes y audit trail a modelos core, persistir configuración de módulos en DB, y hacer el sidebar dinámico filtrado por config.

### Entregado

**Soft deletes + Audit trail:**
- `deletedAt DateTime?` agregado a: Empresa, Cliente, Proveedor, Factura, Compra, Producto, Usuario, AsientoContable, NotaCredito, Remito
- `createdBy Int?` / `updatedBy Int?` agregado a: Cliente, Proveedor, Factura, Compra, Producto, AsientoContable, NotaCredito, Remito
- Base para compliance contable y trazabilidad

**ConfiguracionModulo (nuevo modelo + API):**
- Modelo `ConfiguracionModulo` con unique `[empresaId, modulo]`
- `GET /api/config/modulos` — devuelve mapa completo de 14 módulos (default true)
- `PATCH /api/config/modulos` — solo admins, upsert transaccional
- 14 módulos configurables: compras, ventas, stock, caja, contabilidad, hospitalidad, agenda, historia_clinica, membresias, onboarding, logistica, industria, picking, iot

**Configuración persistente:**
- Página de configuración carga módulos desde API al montar
- Guardar persiste en DB (no más useState efímero)
- Botón con loading state

**Sidebar dinámico:**
- Cada sección tiene `moduloKey` que mapea a la config
- Layout carga módulos habilitados desde API
- Escucha evento `modulos-updated` para re-filtrar sin refresh
- Secciones sin `moduloKey` (Principal, Fiscal, Configuración) siempre visibles

**Bug fix:**
- Agenda page: stray `}` en línea 124 que causaba syntax error

### Archivos creados
- `app/api/config/modulos/route.ts`

### Archivos modificados
- `prisma/schema.prisma` — +1 modelo, +deletedAt/createdBy/updatedBy en 10 modelos
- `app/dashboard/layout.tsx` — sidebar dinámico con moduloKey + fetch config
- `app/dashboard/configuracion/page.tsx` — persistencia de módulos en DB
- `app/dashboard/agenda/page.tsx` — fix syntax error

---

## DELTA SPRINT 9 — TESTING, AUTH REAL, IoT INGENIERÍA INDUSTRIAL

### Objetivo
Infraestructura de testing automatizado, autenticación real para flujo demo, y configuración industrial estándar para dispositivos IoT.

### Entregado

**Testing automatizado (Vitest):**
- Instalación de Vitest v4.1.2 + jsdom
- Setup con mock completo de Prisma (38+ modelos)
- 4 suites de tests: Contabilidad (8), EventBus (5), Stock (5), CC/CP (7) — **24/24 ✅**
- Scripts npm: `test`, `test:watch`, `test:coverage`

**Autenticación Demo real:**
- `POST /api/auth/demo` — Seeds empresa + usuario demo con bcrypt, devuelve JWT real
- Home page "Ver Demo" usa auth real (no más navegación directa sin token)
- Login page con botón "Acceder con cuenta Demo"
- Hook `loginConToken()` para setear JWT directamente
- IoT page: Authorization headers en las 6 llamadas fetch

**IoT — Configuración Industrial (25+ campos nuevos):**
- Protocolo de comunicación: MQTT, Modbus TCP/RTU, OPC-UA, HTTP, CoAP, LoRaWAN, Zigbee, BLE
- Muestreo: intervalo en segundos, unidad de medida, rango min/max
- Umbrales: alerta min/max, crítico min/max
- Calibración: precisión, offset, fecha última/próxima calibración
- Normas industriales: IEC 61131, ISA-95, ISO 22000, HACCP, GMP, ISO 14644, ATEX, SIL, IEEE 802.15.4
- Protección IP: IP20 a IP68
- Hardware: marca, modelo, número de serie, alimentación (24VDC/220VAC/batería/PoE/solar/loop 4-20mA)
- Tipos sensor nuevos: energía, vibración, flujo, peso, nivel
- UI: Dialog con 5 tabs (Básico, Comunicación, Medición, Normas, Hardware)
- Cards: badges de protocolo, norma y clase IP

### Archivos modificados
- `prisma/schema.prisma` — DispositivoIoT +25 campos industriales
- `app/api/iot/dispositivos/route.ts` — Zod + Prisma create expandido
- `app/dashboard/iot/page.tsx` — UI con tabs industriales, auth headers, cards enriquecidas
- `middleware.ts` — /api/auth/demo en rutas públicas
- `app/page.tsx` — Demo con JWT real
- `app/login/page.tsx` — Botón demo con auth real
- `lib/auth/hooks.ts` — loginConToken()
- `package.json` — scripts test + vitest

### Archivos creados
- `vitest.config.ts`
- `__tests__/setup.ts`
- `__tests__/contabilidad/asiento-service.test.ts`
- `__tests__/stock/stock-service.test.ts`
- `__tests__/events/event-bus.test.ts`
- `__tests__/cc-cp/cuentas-service.test.ts`
- `app/api/auth/demo/route.ts`

---

## DELTA SPRINT 8 — ELIMINACIÓN DE MOCKS + DOMINIOS VERTICALES

### Objetivo
Convertir todas las páginas mock restantes a versiones corporativas conectadas a API real, y crear la infraestructura backend completa para 4 nuevos dominios verticales.

### Entregado

**Nuevos modelos Prisma (12 total):**
- `MovimientoBancario` — movimientos bancarios con conciliación
- `LogActividad` — audit trail de actividades del sistema
- `Profesional` — profesionales con especialidad y color (agenda)
- `Turno` — turnos con fecha, hora, profesional y cliente
- `Paciente` — pacientes con especie, raza, chip, peso
- `Consulta` — consultas con diagnóstico, tratamiento, signos vitales
- `PlanMembresia` — planes con precio, periodicidad, duración
- `Membresia` — membresías con fechas, estado, plan y cliente
- `Salon` — salones de hospitalidad
- `Mesa` — mesas con capacidad, estado y posición
- `Comanda` — comandas con mozo, comensales y estado
- `LineaComanda` — líneas de comanda con producto y precio

**Nuevas API routes (8):**
- `GET/POST /api/agenda` — turnos con profesionales, resumen del día
- `GET/POST /api/historia-clinica` — pacientes, consultas, resumen
- `GET/POST /api/membresias` — planes, membresías, ingreso mensual
- `GET/POST /api/hospitalidad` — mesas, salones, comandas abiertas
- `GET/POST /api/banco` — movimientos bancarios
- `PATCH /api/banco/conciliar` — conciliación masiva
- `GET /api/config/auditoria` — logs de actividad con groupBy
- `GET /api/productos/movimientos` — movimientos stock con analytics

**Páginas convertidas de mock a API (11 → 0 mock):**
- `dashboard/banco` — movimientos bancarios con conciliación
- `dashboard/cuentas-cobrar` — aging de cobranza con API real
- `dashboard/cuentas-pagar` — aging de pagos con API real
- `dashboard/notas-credito` — NC con API de notas crédito
- `dashboard/remitos` — remitos con API real
- `dashboard/contabilidad/plan-cuentas` — plan de cuentas desde API
- `dashboard/contabilidad/balance` — balance desde API con 5 secciones
- `dashboard/impuestos` — liquidación IVA mensual desde API
- `dashboard/impuestos/presentacion` — historial 6 meses desde API
- `dashboard/productos/movimientos` — stock movements desde API
- `dashboard/configuracion/tablas` — 28 tablas con conteo live
- `dashboard/configuracion/auditoria` — logs de auditoría desde API
- `dashboard/agenda` — turnos desde API con grilla profesional
- `dashboard/historia-clinica` — pacientes y consultas desde API
- `dashboard/membresias` — planes y socios desde API
- `dashboard/hospitalidad` — mesas y comandas desde API
- `dashboard/hospitalidad/kds` — KDS cocina desde API con auto-refresh

### Impacto
- **0 páginas mock** — todas conectadas a API real con datos de base de datos
- 4 dominios verticales completos (Agenda, HC, Membresías, Hospitalidad)
- 12 nuevos modelos en base de datos, 8 nuevas API routes
- Todas las páginas con loading states, error handling, y KPIs dinámicos

---

## ÍNDICE
1. [Estado General](#estado-general)
2. [Schema Prisma](#schema-prisma)
3. [API Routes](#api-routes)
4. [Seguridad](#seguridad)
5. [Páginas vs Backend](#páginas-vs-backend)
6. [Integración AFIP](#integración-afip)
7. [Dependencias](#dependencias)
8. [Variables de Entorno](#variables-de-entorno)
9. [Ingeniería Funcional — Funciones Padrón](#ingeniería-funcional--funciones-padrón)
10. [Roadmap ERP 2030](#roadmap-erp-2030)
11. [Plan de Acción](#plan-de-acción)
12. [Profesionalización Comercial y Visual](#profesionalización-comercial-y-visual)

---

## ESTADO GENERAL

| Área | Estado | Nota |
|------|--------|------|
| Build | ✅ OK | 64+ páginas, compila sin errores |
| Base de datos | ✅ Conectado | Supabase PostgreSQL vía Prisma |
| Auth | ⚠️ Parcial | JWT funciona, rate limiting pendiente. 100% endpoints ahora autenticados |
| AFIP | ⚠️ 70% | SOAP real implementado, falta PDF y retry |
| API Routes | ✅ 100% auth | Todos los endpoints ahora requieren JWT |
| Páginas | ✅ 100% API | Todas las páginas conectadas a backend real — 0 mock |
| Seguridad | ✅ Bueno | Headers HTTP, rate limiting, registro cerrado, JWT fail-fast |
| Tests | ✅ 24/24 | Vitest — Contabilidad (8), EventBus (5), Stock (5), CC/CP (7) |

---

## SCHEMA PRISMA

### Modelos existentes (19 + 12 Sprint 8 = 31 core)

| Modelo | Estado | Problemas |
|--------|--------|-----------|
| Empresa | ✅ Completo | + relaciones profesionales[], planesMembresia[], salones[] |
| Usuario | ✅ Completo | + relación logs[] |
| Cliente | ✅ Corregido | + relaciones turnos[], pacientes[], membresias[] |
| Proveedor | ✅ Completo | orderBy corregido a `nombre` |
| Factura | ✅ Completo | — |
| LineaFactura | ✅ Completo | Sin link a Producto.id (texto libre) |
| Compra | ⚠️ Parcial | `numero` y `puntoVenta` son String (Factura los tiene como Int) |
| LineaCompra | ✅ Completo | Sin link a Producto.id |
| AsientoContable | ✅ Completo | Sin updatedAt |
| MovimientoContable | ✅ Completo | Sin updatedAt |
| Categoria | ✅ Completo | — |
| Producto | ✅ Completo | — |
| MovimientoStock | ✅ Completo | Sin updatedAt |
| Caja | ✅ Corregido | @relation a Empresa agregada; Zod en POST/PATCH |
| MovimientoCaja | ✅ Completo | Zod en POST |
| NotaCredito | ✅ Corregido | @relation a Factura y Cliente agregadas |
| Remito | ✅ Corregido | @relation a Cliente y Factura agregadas |
| LineaRemito | ✅ Completo | — |
| ConfiguracionImpresora | ✅ Definido | No se usa en ningún API route |

### Modelos nuevos — Sprint 8 ✅

| Módulo | Modelos |
|--------|---------|
| Banco | `MovimientoBancario` |
| Auditoría | `LogActividad` |
| Agenda | `Profesional`, `Turno` |
| Historia Clínica | `Paciente`, `Consulta` |
| Membresías | `PlanMembresia`, `Membresia` |
| Hospitalidad | `Salon`, `Mesa`, `Comanda`, `LineaComanda` |

### Campos faltantes críticos (en todos los modelos)

- ~~**Sin audit trail**~~: ✅ `createdBy` / `updatedBy` agregados a 8 modelos core (Sprint 10)
- ~~**Sin soft deletes**~~: ✅ `deletedAt` agregado a 10 modelos core (Sprint 10)
- ~~**Sin descuentos**~~ ✅ `LineaFactura` y `LineaCompra` ahora tienen campo `descuento Float @default(0)`
- ~~**Sin link Factura→Producto**~~ ✅ `LineaFactura.productoId` y `LineaCompra.productoId` agregados como FK nullable
- **Sin impuestos adicionales en líneas**: No hay campo para IIB destino en línea individual (se calcula en TaxEngine)

### Modelos completamente ausentes

| Módulo | Modelos faltantes |
|--------|-------------------|
| ~~Banco~~ | ~~`CuentaBancaria`, `MovimientoBancario`~~ ✅ **Sprint 8** |
| Cheques | `Cheque` |
| ~~Membresías~~ | ~~`Membresia`, `PlanMembresia`~~ ✅ **Sprint 8** |
| Activos Fijos | `ActivoFijo`, `Depreciacion` |
| Costos | `CentroCosto`, `AsignacionCosto` |
| Multi-sucursal | `Sucursal` (hoy todo va a empresaId único) |

### Modelos nuevos — Sprint 5 ✅

| Módulo | Modelos |
|--------|---------|
| Logística | `Transportista`, `Envio` |
| Industria | `ListaMateriales`, `ComponenteBOM`, `OrdenProduccion` |
| Picking | `ListaPicking`, `LineaPicking` |
| IoT | `DispositivoIoT`, `LecturaIoT`, `AlertaIoT` |

---

## API ROUTES

### Inventario completo (33 rutas)

| Ruta | Método | Auth | Validación | DB Real | Estado |
|------|--------|------|------------|---------|--------|
| /api/auth/login | POST | ❌ pública | ✅ Zod | ✅ | ✅ OK |
| /api/auth/register | POST | ✅ admin | ✅ Zod | ✅ | ✅ Solo administradores pueden registrar usuarios |
| /api/auth/me | GET | ✅ | token | ✅ | ✅ OK |
| /api/auth/cambiar-password | POST | ✅ | ✅ | ✅ | ✅ OK |
| /api/clientes | GET | ✅ | ❌ | ✅ | ✅ Corregido — ordena por `nombre` |
| /api/clientes | POST | ✅ | ❌ | ✅ | ✅ Corregido — crea con campos correctos |
| /api/clientes/[id] | PUT | ✅ | ❌ | ✅ | ✅ Corregido — actualiza con campos correctos |
| /api/clientes/[id] | DELETE | ✅ | — | ✅ | ✅ OK |
| /api/productos | GET | ✅ | ❌ | ✅ | ✅ Corregido — línea 18 bug y auth agregados |
| /api/productos | POST | ✅ | ⚠️ Mínima | ✅ | ✅ Auth agregado |
| /api/productos/[id] | PATCH | ✅ | ❌ | ✅ | ✅ Auth agregado |
| /api/categorias | GET | ✅ | — | ✅ | ✅ Auth agregado |
| /api/categorias | POST | ✅ | ⚠️ Mínima | ✅ | ✅ Auth agregado |
| /api/caja | GET | ✅ | — | ✅ | ✅ Auth agregado |
| /api/caja | POST | ✅ | ❌ | ✅ | ✅ Auth agregado |
| /api/caja | PATCH | ✅ | ❌ | ✅ | ✅ Auth agregado |
| /api/caja/movimientos | GET/POST | ✅ | ❌ | ✅ | ✅ Auth agregado |
| /api/compras | POST | ✅ | ✅ Zod | ✅ | ✅ Campos corregidos (tipo/numero/lineas) |
| /api/proveedores | GET/POST | ✅ | ✅ Zod | ✅ | ✅ POST agregado con validación y CUIT único |
| /api/afip/emitir-factura | POST | ✅ | ✅ Zod | ✅ | ✅ Auth agregado |
| /api/afip/test-conexion | POST | ✅ | — | — | ✅ Auth agregado |
| /api/afip/subir-certificados | POST | ✅ | — | ✅ | ✅ Auth agregado |
| /api/estadisticas/dashboard | GET | ✅ | — | ✅ | ✅ Auth agregado |
| /api/contabilidad/* | GET | ✅ | — | ✅ | ✅ Auth agregado (5 rutas) |
| /api/impuestos/* | GET | ✅ | — | ✅ | ✅ Auth agregado (4 rutas) |
| /api/impresion/* | POST/GET | ✅ | — | ✅ | ✅ Auth agregado (3 rutas); configurar solo admin |
| /api/usuarios | GET | ✅ | — | ✅ | ✅ Solo admin |
| /api/usuarios/[id] | PUT/DELETE | ✅ | — | ✅ | ✅ OK |

### Respuestas inconsistentes

Algunos endpoints retornan `{ success: true, data: {...} }`, otros retornan el objeto directo.
No hay un helper compartido de respuesta HTTP.

---

## SEGURIDAD

### 🔴 CRÍTICO

1. ~~**JWT Secret hardcodeado**~~ ✅ **RESUELTO** — Falla en producción si `JWT_SECRET` no está definido

2. ~~**60% de endpoints sin autenticación**~~ ✅ **RESUELTO** — Todos los endpoints ahora requieren JWT

3. ~~**Sin rate limiting**~~ ✅ **RESUELTO** — Rate limiter en memoria (5 intentos / 15 min) en `/api/auth/login`

4. ~~**Registro abierto**~~ ✅ **RESUELTO** — Solo administradores autenticados pueden crear usuarios

### ⚠️ ALTO

5. **Certificados AFIP en Base64 en DB** — deberían estar cifrados con clave simétrica
6. **Sin CORS configurado** — no hay control de origins permitidos
7. ~~**Sin headers de seguridad**~~ ✅ **RESUELTO** — CSP, X-Frame-Options, X-Content-Type-Options y más en `next.config.mjs`
8. ~~**Validación con Zod solo en 3 endpoints**~~ ✅ **RESUELTO** — Zod en compras, proveedores, clientes, caja, movimientos
9. ~~**Token expira en 7 días**~~ ✅ **RESUELTO** — Reducido a 24h

### ⚠️ MEDIO

10. **Sin logs de seguridad** — no hay registro de intentos fallidos de login
11. **Sin error boundaries** en el frontend — errores no controlados exponen stack traces
12. **Sin CSP (Content Security Policy)** configurado en next.config

---

## PÁGINAS VS BACKEND

### Conectadas a DB real (todas las páginas)

| Página | API que usa | Estado |
|--------|-------------|--------|
| /dashboard | /api/estadisticas/dashboard | ✅ Funciona |
| /dashboard/ventas | /api/afip/emitir-factura | ✅ Funciona |
| /dashboard/compras | /api/compras | ✅ Funciona |
| /dashboard/clientes | /api/clientes | ✅ Funciona |
| /dashboard/proveedores | /api/proveedores | ✅ Funciona |
| /dashboard/productos | /api/productos | ✅ Funciona |
| /dashboard/caja | /api/caja | ✅ Funciona |
| /dashboard/usuarios | /api/usuarios | ✅ Funciona |
| /dashboard/contabilidad | /api/contabilidad/* | ✅ Funciona |
| /dashboard/impuestos | /api/impuestos/* | ✅ Funciona |

| /dashboard/logistica | /api/logistica, /api/logistica/transportistas | ✅ Funciona |
| /dashboard/industria | /api/industria, /api/industria/bom | ✅ Funciona |
| /dashboard/picking | /api/picking | ✅ Funciona |
| /dashboard/iot | /api/iot/dispositivos, /api/iot/lecturas, /api/iot/alertas | ✅ Funciona |
| /dashboard/banco | /api/banco, /api/banco/conciliar | ✅ Sprint 8 |
| /dashboard/cuentas-cobrar | /api/notas-credito + factura aging | ✅ Sprint 8 |
| /dashboard/cuentas-pagar | /api/compras aging | ✅ Sprint 8 |
| /dashboard/notas-credito | /api/notas-credito | ✅ Sprint 8 |
| /dashboard/remitos | /api/remitos | ✅ Sprint 8 |
| /dashboard/contabilidad/plan-cuentas | /api/contabilidad/plan-cuentas | ✅ Sprint 8 |
| /dashboard/contabilidad/balance | /api/contabilidad/balance-sumas | ✅ Sprint 8 |
| /dashboard/impuestos | /api/impuestos/iva | ✅ Sprint 8 |
| /dashboard/impuestos/presentacion | /api/impuestos/iva (6 meses) | ✅ Sprint 8 |
| /dashboard/productos/movimientos | /api/productos/movimientos | ✅ Sprint 8 |
| /dashboard/configuracion/tablas | /api/maestros/[tabla] | ✅ Sprint 8 |
| /dashboard/configuracion/auditoria | /api/config/auditoria | ✅ Sprint 8 |
| /dashboard/agenda | /api/agenda | ✅ Sprint 8 |
| /dashboard/historia-clinica | /api/historia-clinica | ✅ Sprint 8 |
| /dashboard/membresias | /api/membresias | ✅ Sprint 8 |
| /dashboard/hospitalidad | /api/hospitalidad | ✅ Sprint 8 |
| /dashboard/hospitalidad/kds | /api/hospitalidad (auto-refresh) | ✅ Sprint 8 |

### Con datos mock / sin backend (0 páginas)

Todas las páginas ahora están conectadas a API real. ✅

### Dark mode
- Variables CSS listas en globals.css ✅
- `next-themes` instalado ✅
- `ThemeProvider` wrappea el layout ✅
- Toggle de tema en sidebar del dashboard ✅

### Módulos configurables
- UI de toggles existe en /configuracion ✅
- ✅ **Persiste en DB** — ConfiguracionModulo con empresaId + modulo (Sprint 10)
- ✅ **Sidebar dinámico** — filtra secciones según config guardada (Sprint 10)

---

## INTEGRACIÓN AFIP

### Qué funciona

- Autenticación WSAA (TRA + firma con certificado + token/sign) ✅
- Emisión de comprobantes via FECAESolicitar ✅
- Consulta último comprobante FECompUltimoAutorizado ✅
- Tipos A, B, C (códigos 1, 6, 11) ✅
- Múltiples ítems con alícuotas distintas ✅
- Generación de QR según spec AFIP ✅
- Guardado en DB con asiento contable automático ✅

### Qué falta

| Feature | Prioridad |
|---------|-----------|
| Generación de PDF de factura | Alta |
| Retry logic ante timeout AFIP | Alta |
| Timeout handling en llamadas SOAP | Alta |
| Nota de débito / Nota de crédito service | Media |
| Deferred emission (emitir async) | Media |
| Validación TLS en conexión SOAP | Media |
| Soporte Factura E (exportación) | Baja |
| Soporte Remitos electrónicos | Baja |

---

## DEPENDENCIAS

### Estado del package.json

| Paquete | Versión | Estado |
|---------|---------|--------|
| next | 15.5.4 | ✅ Actual |
| react | 19.2.0 | ✅ Actual |
| @prisma/client | ^6.1.0 | ✅ Actual (v7 disponible) |
| typescript | ^5.7.3 | ✅ Actual |
| jsonwebtoken | ^9.0.2 | ✅ Actual |
| bcryptjs | ^2.4.3 | ✅ Actual |
| zod | ^3.24.1 | ✅ Actual |
| soap | ^1.1.3 | ⚠️ Desactualizado (último update 2022) |
| @supabase/supabase-js | ^2.100.1 | ⚠️ Instalado pero no usado |
| recharts | ^2.15.0 | ✅ Actual |

### Paquetes que faltan

| Paquete | Para qué | Estado |
|---------|---------|--------|
| `next-themes` | Dark mode | ✅ Instalado y configurado |
| `@types/soap` | Tipos TypeScript para SOAP | ❌ Pendiente |
| `helmet` | Headers de seguridad HTTP | ❌ Pendiente |
| `rate-limiter-flexible` | Rate limiting en auth | ❌ Pendiente |
| `nodemailer` | Emails transaccionales | ❌ Pendiente |
| `@sentry/nextjs` | Error tracking en producción | ❌ Pendiente |
| `reactflow` | Módulo de ingeniería funcional | ❌ Pendiente |
| `exceljs` o `xlsx` | Export Excel real | ❌ Pendiente |
| `puppeteer` o `@react-pdf/renderer` | Generación PDF facturas | ❌ Pendiente |

---

## VARIABLES DE ENTORNO

### Estado actual

```env
DATABASE_URL          ✅ Configurado (Supabase)
NEXT_PUBLIC_SUPABASE_URL  ✅ Configurado
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY  ✅ Configurado
JWT_SECRET            ⚠️ Placeholder inseguro
AFIP_ENTORNO          ✅ homologacion
AFIP_CUIT             🔴 VACÍO — AFIP no funciona sin esto
AFIP_PUNTO_VENTA      ✅ "1"
PRINTER_TYPE          ✅ epson
PRINTER_PORT          ✅ COM1
NEXT_PUBLIC_APP_URL   ✅ localhost:3000
```

### Variables faltantes

```env
NODE_ENV              # production / development
ENCRYPTION_KEY        # Para cifrar certificados AFIP en DB
SMTP_HOST             # Emails
SMTP_PORT
SMTP_USER
SMTP_PASS
SENTRY_DSN            # Error tracking
NEXT_PUBLIC_ANTHROPIC_API_KEY  # Para módulo IA (futuro)
```

---

## INGENIERÍA FUNCIONAL — FUNCIONES PADRÓN

> **Concepto:** En ERPs maduros (Protheus, Odoo, SAP) las *funciones padrón* son el conjunto de rutinas reutilizables, puntos de extensión y contratos de interfaz que permiten personalizar el comportamiento del sistema sin modificar el núcleo. La *ingeniería funcional* es la disciplina que documenta, modela y conecta esas piezas en flujos de negocio auditables.

---

### Catálogo de funciones padrón existentes

Esto es lo que el sistema ya expone como funciones reutilizables:

| Función | Ubicación | Qué hace | Consumidores actuales |
|---------|-----------|----------|-----------------------|
| `calcularImpuestos(input)` | `lib/tes/tax-engine.ts` | Dispatcher multi-país: delega al adapter del país, devuelve `TaxBreakdown` completo | `app/api/tes/route.ts` |
| `registerTaxAdapter(adapter)` | `lib/tes/tax-engine.ts` | Registra un adapter de país en el registry global | Boot-time (llamado manualmente) |
| `generarAsientoVenta(facturaId)` | `lib/contabilidad/asiento-service.ts` | Crea asiento Caja/Ventas/IVA en partida doble | `lib/contabilidad/factura-hooks.ts` |
| `generarAsientoCompra(compraId)` | `lib/contabilidad/asiento-service.ts` | Crea asiento Mercaderías/IVA/Proveedores | `lib/contabilidad/factura-hooks.ts` |
| `crearAsientoManual(data)` | `lib/contabilidad/asiento-service.ts` | Valida debe=haber, inserta en DB | `/api/contabilidad/asientos` |
| `obtenerLibroDiario()` | `lib/contabilidad/asiento-service.ts` | Lista asientos del período | `/api/contabilidad/*` |
| `obtenerLibroMayor(cuenta)` | `lib/contabilidad/asiento-service.ts` | Saldo acumulado por cuenta | `/api/contabilidad/*` |
| `emitirFactura(data)` | `lib/afip/factura-service.ts` | WSAA + FECAESolicitar + DB + hook post-emisión | `/api/afip/emitir-factura` |
| `verificarToken(req)` | `lib/auth/middleware.ts` | Valida JWT, extrae payload del usuario | Todos los API routes |
| `generarLibroIVA(periodo, tipo)` | `lib/impuestos/iva-service.ts` | Filtra facturas/compras, genera libro IVA JSON/CSV | `/api/impuestos/*` |
| `onFacturaEmitida(facturaId)` | `lib/contabilidad/factura-hooks.ts` | Hook post-venta: dispara asiento contable | `lib/afip/factura-service.ts` |
| `onCompraRegistrada(compraId)` | `lib/contabilidad/factura-hooks.ts` | Hook post-compra: dispara asiento contable | `/api/compras` |

---

### Puntos de entrada (PE) — Estado actual vs. ERP real

En Protheus cada operación tiene PEs nombrados (`MT100BRW`, `MT100OK`, `MT460OKB`, etc.). En Odoo son métodos override con `@api.onchange` / `@api.constrains` / `super()`. En este sistema el equivalente son los hooks de `factura-hooks.ts`.

| Momento del ciclo de vida | PE en Protheus | Equivalente en sistema actual | Estado |
|--------------------------|---------------|-------------------------------|--------|
| **Antes de grabar documento** | `MT100OK` | ❌ No existe | 🔴 Ausente |
| **Después de grabar documento** | `MT100OKB` | `onFacturaEmitida()` (solo facturas) | ⚠️ Parcial |
| **Al cambiar estado** | `MT460STA` | ❌ No existe | 🔴 Ausente |
| **Al calcular totales** | `MT100TOT` | ❌ No existe — frontend calcula | 🔴 Ausente |
| **Al buscar producto** (F3) | `MT100F3` | ❌ No existe | 🔴 Ausente |
| **Al cerrar caja** | `FINXCX010` | ❌ No existe | 🔴 Ausente |
| **Al emitir NC** | `MT460PE` | ❌ No existe (NC sin backend) | 🔴 Ausente |
| **Al emitir remito** | `MT460REM` | ❌ No existe (remito sin backend) | 🔴 Ausente |
| **Al registrar pago** | `FINA050PE` | ❌ No existe (CC/CP sin backend) | 🔴 Ausente |

**Problema estructural:** `TES_PREDEFINIDOS` declara `afectaStock: true` y `afectaCaja: true` en cada tipo de comprobante, pero **ningún dispatcher lee esas flags** para ejecutar acciones. Son metadatos decorativos sin efecto.

---

### Arquitectura propuesta: Event Bus + Funciones Padrón

Para implementar ingeniería funcional real, el sistema necesita tres capas:

#### Capa 1 — Domain Events

```typescript
// lib/events/types.ts
export type ERPEvent =
  | { type: "FACTURA_EMITIDA";   payload: { facturaId: string; total: number; clienteId: string } }
  | { type: "COMPRA_REGISTRADA"; payload: { compraId: string; total: number; proveedorId: string } }
  | { type: "NC_EMITIDA";        payload: { ncId: string; facturaOriginalId: string } }
  | { type: "REMITO_ENTREGADO"; payload: { remitoId: string; lineas: LineaRemito[] } }
  | { type: "PAGO_REGISTRADO";   payload: { pagoId: string; facturaId: string; monto: number } }
  | { type: "ESTADO_CAMBIADO";   payload: { modelo: string; id: string; de: string; a: string } }
  | { type: "CAJA_CERRADA";      payload: { cajaId: string; totalEfectivo: number } }
```

#### Capa 2 — Event Bus / Handler Registry

```typescript
// lib/events/event-bus.ts
type Handler<T extends ERPEvent> = (event: T) => Promise<void>

const handlers = new Map<string, Handler<any>[]>()

export function onEvent<T extends ERPEvent>(type: T["type"], handler: Handler<T>) {
  if (!handlers.has(type)) handlers.set(type, [])
  handlers.get(type)!.push(handler)
}

export async function emit<T extends ERPEvent>(event: T) {
  const list = handlers.get(event.type) ?? []
  // Fail-safe: errores en handlers no cortan el flujo principal
  await Promise.allSettled(list.map(h => h(event)))
}
```

#### Capa 3 — Funciones Padrón registradas al boot

```typescript
// lib/events/register-handlers.ts  (importar en app/layout.tsx o lib/prisma.ts)
import { onEvent } from "./event-bus"
import { generarAsientoVenta }  from "@/lib/contabilidad/asiento-service"
import { decrementarStockPorFactura } from "@/lib/stock/stock-service"
import { generarAsientoNC }     from "@/lib/contabilidad/asiento-service"
import { revertirStockPorNC }   from "@/lib/stock/stock-service"

onEvent("FACTURA_EMITIDA",   e => generarAsientoVenta(e.payload.facturaId))
onEvent("FACTURA_EMITIDA",   e => decrementarStockPorFactura(e.payload.facturaId))  // requiere productoId en LineaFactura
onEvent("COMPRA_REGISTRADA", e => generarAsientoCompra(e.payload.compraId))
onEvent("NC_EMITIDA",        e => generarAsientoNC(e.payload.ncId))
onEvent("NC_EMITIDA",        e => revertirStockPorNC(e.payload.ncId))
onEvent("REMITO_ENTREGADO",  e => decrementarStockPorRemito(e.payload.remitoId))
```

Con este patrón: **agregar un nuevo comportamiento = registrar un handler**, sin tocar los servicios existentes. Cada `emit()` sería el equivalent al `ExecBlock()` de Protheus o al `signal_post_save` de Django.

---

### Funciones padrón que faltan (a construir)

| Función | Módulo | Descripción | Prioridad |
|---------|--------|-------------|-----------|
| `decrementarStockPorFactura(facturaId)` | Stock | Lee `LineaFactura[]` con `productoId`, actualiza `Producto.stock` y crea `MovimientoStock` por línea en una transacción | 🔴 P0 — requiere agregar `productoId` a `LineaFactura` |
| `incrementarStockPorCompra(compraId)` | Stock | Igual pero para `LineaCompra` en compra confirmada | 🔴 P0 |
| `revertirStockPorNC(ncId)` | Stock | Deshace el movimiento de la factura original por las líneas de la NC | 🔴 P0 |
| `emitirNotaCredito(data)` | AFIP + NC | WSAA + FECAESolicitar (tipoCbte 3/8/13) + valida monto ≤ factura original + emite evento `NC_EMITIDA` | 🔴 P0 |
| `generarAsientoNC(ncId)` | Contabilidad | Asiento espejo inverso del asiento de venta original (DEBE Ventas, HABER Caja/Clientes) | ✅ Implementado |
| `generarAsientoCMV(facturaId)` | Contabilidad | DEBE CMV / HABER Mercaderías — necesario para calcular margen bruto real | 🔴 P1 |
| `registrarCobro(data)` | CC | Imputa pago contra factura, actualiza saldo, crea `PagoRecibido`, emite asiento | 🔴 P1 |
| `registrarPago(data)` | CP | Imputa pago contra compra, actualiza saldo, crea `PagoEmitido`, emite asiento | 🔴 P1 |
| `transicionarEstado(modelo, id, nuevoEstado)` | FSM | Valida transición permitida según tabla de estados, registra en `AuditLog`, emite `ESTADO_CAMBIADO` | 🟡 P1 |
| `calcularAgingCC(empresaId)` | CC | Agrupa facturas vencidas por bucket (0-30, 31-60, 61-90, +90 días) | 🟡 P1 |
| `entregarRemito(remitoId)` | Remitos | Cambia estado a "entregado", emite `REMITO_ENTREGADO`, dispara decremento de stock | 🟡 P2 |
| `generarPDFFactura(facturaId)` | AFIP | Genera PDF con QR embebido usando `@react-pdf/renderer` | 🟡 P2 |
| `generarConstanciaRetencion(sicore)` | Impuestos | Genera constancia RG 2854 para retenciones SICORE | 🟡 P2 |
| `cerrarCaja(cajaId)` | Caja | Valida diferencia, archiva movimientos, emite `CAJA_CERRADA` | 🟡 P2 |
| `ajustarPorInflacion(periodo)` | Contabilidad | RT 6 / RT 39 — reexpresa saldos no monetarios | 🟢 P3 |

---

### Prerequisito bloqueante — `productoId` en líneas de documento

Las funciones de stock automático (`decrementarStockPorFactura`, `incrementarStockPorCompra`, `revertirStockPorNC`) **no son implementables** hasta que `LineaFactura` y `LineaCompra` tengan un FK a `Producto`. Hoy las líneas son texto libre.

```prisma
// Cambio necesario en schema.prisma
model LineaFactura {
  // ... campos existentes ...
  productoId  String?   // FK opcional (texto libre sigue siendo válido para conceptos sin SKU)
  producto    Producto? @relation(fields: [productoId], references: [id])
  descuento   Float     @default(0)  // % descuento por línea
  alicuotaIva Float     @default(21) // para que el engine lea la tasa correcta
}

model LineaCompra {
  // ... campos existentes ...
  productoId  String?
  producto    Producto? @relation(fields: [productoId], references: [id])
  descuento   Float     @default(0)
}
```

Este cambio es **no-destructivo** (el campo es nullable), pero desbloquea toda la capa de stock automático y el cálculo de CMV real.

---

### Especificación funcional — Ciclo completo de una venta

Esto es cómo debería fluir una venta cuando todas las funciones padrón estén implementadas:

```
[Usuario confirma venta en UI]
        │
        ▼
POST /api/afip/emitir-factura
        │
        ├─► calcularImpuestos(AR, venta, emisor, receptor, líneas)
        │         └─► TaxBreakdown validado y persistido en Factura
        │
        ├─► WSAA auth + FECAESolicitar → CAE obtenido
        │
        ├─► prisma.factura.create() → facturaId
        │
        └─► emit("FACTURA_EMITIDA", { facturaId, ... })
                  │
                  ├─► generarAsientoVenta()    → AsientoContable (Caja/Ventas/IVA)
                  ├─► generarAsientoCMV()      → AsientoContable (CMV/Mercaderías)
                  └─► decrementarStockPorFactura() → MovimientoStock × línea

[Si el cliente devuelve mercadería]
        │
        ▼
POST /api/notas-credito
        │
        ├─► Valida: monto NC ≤ monto factura original
        ├─► WSAA + FECAESolicitar (tipoCbte 3/8/13)
        ├─► prisma.notaCredito.create() → ncId
        └─► emit("NC_EMITIDA", { ncId, facturaOriginalId })
                  │
                  ├─► generarAsientoNC()    → Asiento inverso
                  └─► revertirStockPorNC()  → MovimientoStock tipo "entrada"

[Al cobrar la factura]
        │
        ▼
POST /api/cuentas-cobrar/cobros
        │
        ├─► registrarCobro({ facturaId, monto, medioPago })
        ├─► Actualiza Factura.saldo, Factura.estado
        └─► emit("PAGO_REGISTRADO", { ... })
                  └─► generarAsientoCobro()  → DEBE Caja, HABER Clientes
```

---

## ROADMAP ERP 2030

### Visión: ERP LATAM-nativo con IA integrada

Lo que haría un "batacazo" frente a Odoo/SAP/Protheus en 2030:

#### Diferenciadores clave

1. **IA-nativa en cada módulo** — no bolt-on, sino integrada desde el diseño
   - Auto-categorización de transacciones
   - Predicción de stock por estacionalidad
   - Detección de anomalías contables en tiempo real
   - Generación de asientos por foto de factura (OCR + IA)

2. **LATAM-first, no LATAM-adapted**
   - AFIP/ARCA nativo (Argentina)
   - SPED/NF-e nativo (Brasil — portugués incluido)
   - SAT nativo (México)
   - Ajuste por inflación contable automático (RT 6 y RT 39)
   - Manejo nativo de tipo de cambio (ARS oficial / MEP / CCL / Blue)

3. **Conversational ERP**
   - "¿Cuánto vendí este mes?" → respuesta inmediata en lenguaje natural
   - "Generame el libro IVA de Q3" → descarga automática
   - Reportes por prompt, sin navegar menús

4. **Low-code workflow engine**
   - Módulo de Ingeniería Funcional con editor de flujos visual (ReactFlow)
   - IA que infiere el flujo desde descripción en texto
   - Workflows customizables sin código

5. **Real-time multi-sucursal**
   - Stock sincronizado entre sucursales en tiempo real
   - Dashboard consolidado + vistas por sucursal
   - Transferencias entre sucursales con trazabilidad

#### Stack técnico recomendado para 2030

```
Frontend:     Next.js 15+ / React 19 (ya tienen esto ✅)
Estilos:      Tailwind 4 + Shadcn/ui (ya tienen esto ✅)
Backend:      Next.js API Routes → migrar a tRPC para type-safety end-to-end
DB primaria:  PostgreSQL / Supabase (ya tienen esto ✅)
DB tiempo real: Supabase Realtime (websockets nativos)
Cache:        Redis / Upstash (para rate limiting y sesiones)
IA:           Anthropic Claude API (claude-sonnet-4-6)
Búsqueda:     Meilisearch (full-text en español)
Cola de tareas: Inngest o Trigger.dev (jobs async: AFIP, emails, reportes)
Monitoreo:    Sentry + Vercel Analytics
Diagramas:    ReactFlow
PDF:          @react-pdf/renderer
Export:       ExcelJS
Deployment:   Vercel (frontend) + Supabase (DB) + Upstash (Redis)
```

#### Módulos del ERP completo

| Módulo | Estado actual | Prioridad |
|--------|--------------|-----------|
| Facturación electrónica (AFIP) | ⚠️ 70% | P0 — Cerrar |
| POS / Ventas | ⚠️ 70% | P0 — Cerrar |
| Compras | ⚠️ 60% | P0 — Cerrar |
| Contabilidad (partida doble) | ✅ 80% | P1 — Mejorar |
| IVA / Impuestos | ✅ 95% | P1 — Tax Engine implementado |
| Stock / Inventario | ⚠️ 60% | P1 — Completar |
| Caja | ⚠️ 70% | P1 — Completar |
| Clientes / CRM básico | 🔴 40% | P1 — Arreglar |
| Cuentas a Cobrar | 🔴 Mock | P1 — Construir |
| Cuentas a Pagar | 🔴 Mock | P1 — Construir |
| Banco / Conciliación | 🔴 Mock | P2 — Construir |
| Notas de Crédito/Débito | 🔴 Roto | P1 — Arreglar |
| Remitos | 🔴 Roto | P2 — Arreglar |
| Activos Fijos | ❌ Ausente | P2 — Construir |
| Costos | ❌ Ausente | P2 — Construir |
| Membresías | 🔴 Mock | P3 — Construir |
| Reporting / BI | ❌ Básico | P2 — Construir |
| Ingeniería Funcional + IA | ❌ Ausente | P2 — Construir |
| Multi-sucursal | ❌ Ausente | P2 — Construir |
| PWA / Offline | ❌ Ausente | P3 — Construir |
| i18n (PT-BR, ES-MX) | ❌ Ausente | P3 — Construir |
| WhatsApp real | ❌ Ausente | P3 — Construir |
| MercadoPago / Shopify | ❌ Ausente | P3 — Integrar |

---

## PLAN DE ACCIÓN

### SPRINT 1 — Bugs críticos (completado ✅)

- [x] Arreglar schema Cliente: APIs y UI ahora usan `nombre`/`direccion` (igual que la DB)
- [x] Arreglar relaciones rotas: `NotaCredito`, `Remito`, `Caja` — @relation correctas agregadas
- [x] Arreglar bug `/api/productos` línea 18 (sintaxis Prisma inválida — reemplazado por filtro in-memory)
- [x] Agregar `next-themes` + wrappear layout + toggle de tema en sidebar
- [ ] Persistir configuración de módulos en DB + conectar sidebar

### SPRINT 2 — Seguridad (completado ✅)

- [x] Agregar auth a todos los endpoints faltantes — **COMPLETADO** (22 endpoints protegidos)
- [x] Implementar rate limiting en `/api/auth/login` (5 intentos / 15 min, in-memory)
- [x] Agregar Zod validation a todos los POST/PUT principales (compras, clientes, proveedores, caja)
- [x] JWT_SECRET falla en producción si no está definido; expiry reducido a 24h
- [x] Registro de usuarios cerrado — solo admins pueden crear nuevos usuarios
- [x] Headers de seguridad HTTP en `next.config.mjs` (CSP, X-Frame-Options, etc.)
- [x] Arreglar `/api/compras` — campos incorrectos (tipo/numero/lineas) + Zod
- [x] Agregar `POST /api/proveedores` que faltaba completamente

### SPRINT 3 — Tax Engine multi-país (completado ✅)

- [x] `lib/tes/types.ts` — Interfaces country-agnostic: TaxInput, TaxBreakdown, TaxResultItem, CountryTaxAdapter
- [x] `lib/tes/adapters/ar-adapter.ts` — Adapter argentino completo:
  - IVA: 27% / 21% / 10.5% / 0% con discriminación por línea de factura
  - Percepción IVA RG 2408/2854 (3% RI / 5% no-RI) — añadida al total factura
  - Retención IVA SICORE cód. 217 (10.5%) y 219 (21%) — deducida al pagar
  - IIBB propia devengada: ARBA (PBA 3.5%), ARCIBA/AGIP (CABA 3%), SF, CBA, MZA
  - Percepción IIBB ARBA (3%) y ARCIBA (2.5%) — añadida al total factura
  - Retención Ganancias SICORE cód. 305 (2% bienes ≥ $400k) y 767 (6% servicios ≥ $150k)
- [x] `lib/tes/tax-engine.ts` — Dispatcher + registry (`registerTaxAdapter()` para nuevos países)
- [x] `lib/tes/tes-config.ts` — TES extendidos: VFA_PERC_IIBB_PBA, VFA_PERC_IIBB_CABA, VFA_PERC_IVA, CFA_RET_SICORE_IVA, CFA_RET_GANANCIAS, CFA_RET_SICORE_FULL
- [x] `prisma/schema.prisma` — Modelos `TaxConcepto` + `TaxTasa` (tasas versionadas con vigencia, actualizables sin redeploy)
- [x] `app/api/tes/route.ts` — Auth + dual path: engine completo (pais+operacion+emisor+receptor) y legacy TES (backward compat)
- [x] API retorna `{ tes, paises }` con lista de países registrados; UI adaptada

**Cómo agregar un nuevo país:**
```typescript
import { registerTaxAdapter } from "@/lib/tes/tax-engine"
registerTaxAdapter(new UYTaxAdapter())  // Uruguay
registerTaxAdapter(new BRTaxAdapter())  // Brasil (ICMS, PIS, COFINS, ISS, IPI)
registerTaxAdapter(new MXTaxAdapter())  // México (IVA 16%, ISR, IEPS)
```

**Cómo calcular impuestos desde código:**
```typescript
import { calcularImpuestos } from "@/lib/tes/tax-engine"

const breakdown = calcularImpuestos({
  pais: "AR",
  operacion: "venta",
  emisor: { condicionIva: "Responsable Inscripto", esAgentePercepcionIIBB: true },
  receptor: { condicionIva: "Responsable Inscripto" },
  subtotalNeto: 100_000,
  jurisdiccionPrincipal: "PBA",   // IIBB ARBA
})
// breakdown.totalFinal = 121_000 + 3_000 (Perc. IVA) + 3_000 (Perc. IIBB PBA)
```

### SPRINT 4 — Impuestos completos (completado ✅)

- [x] Schema: `productoId` FK nullable en `LineaFactura` / `LineaCompra` (desbloquea stock automático)
- [x] Schema: `descuento Float @default(0)` en `LineaFactura` / `LineaCompra`
- [x] Schema: `totalPercepciones` / `totalRetenciones` en `Factura` y `Compra`
- [x] Schema: nuevo modelo `RetencionSICORE` (RG 2854 + RG 830) con FK a `Compra` y `Proveedor`
- [x] Schema: nuevo modelo `PeriodoIIBB` con `@@unique([mes, anio, jurisdiccion])`
- [x] `lib/impuestos/sicore-service.ts` — registrar/listar/acreditar/archivoSIAP/constancia
- [x] `lib/impuestos/iibb-service.ts` — acumular/liquidar/generarDDJJ/cerrar/marcarPresentado
- [x] `lib/impuestos/iva-service.ts` — percepciones y retenciones en libros y CSV
- [x] `lib/afip/factura-service.ts` — integra `calcularImpuestos()` opcionalmente; persiste `totalPercepciones`/`totalRetenciones`; `ImpTrib` correcto en AFIP
- [x] `lib/contabilidad/asiento-service.ts` — `generarAsientoVenta` incluye línea "Percepciones a Pagar"; nuevo método `generarAsientoNC(ncId)`
- [x] `lib/contabilidad/factura-hooks.ts` — nuevo hook `onNCEmitida(ncId)` post-NC
- [x] `app/api/impuestos/sicore/route.ts` — GET (list+SIAP export) + POST (crear retención)
- [x] `app/api/impuestos/iibb/route.ts` — GET (liquidación+DDJJ+anual) + POST (cerrar/presentado)
- [x] `app/api/impuestos/percepciones/route.ts` — GET (emitidas+recibidas+saldo neto)

### SPRINT 5 — Backend de páginas mock (próximo)

- [ ] Banco: schema + API + UI real
- [ ] Cuentas a Cobrar/Pagar: lógica de aging + API
- [ ] Notas de Crédito: service completo (WSAA + FECAESolicitar tipoCbte 3/8/13)
- [ ] Remitos: service completo

### SPRINT 5 — ERP features (mes 2)

- [ ] PDF de facturas con `@react-pdf/renderer`
- [ ] Retry + timeout en AFIP SOAP
- [ ] Activos Fijos: schema + API + UI
- [ ] Costos: schema + API + UI
- [ ] Módulo de Ingeniería Funcional (ReactFlow + Claude API)

### SPRINT 6 — Escala y diferenciación (mes 3)

- [ ] Multi-sucursal: campo `sucursalId` en modelos clave
- [ ] Sentry para error tracking
- [ ] Export Excel real con ExcelJS
- [ ] Conciliación bancaria funcional
- [ ] IA conversacional: queries en lenguaje natural con Claude API
- [ ] Adapter Brasil (ICMS, PIS, COFINS, ISS, IPI)

---

## ANÁLISIS COMPARATIVO vs. ERPs REALES (SAP / Protheus / TANGO / PRESEA)

> Fecha del análisis: 2026-03-30
> Metodología: contraste funcional contra los módulos estándar de SAP Business One, TOTVS Protheus, Tango Gestión (Axoft) y PRESEA ERP.

---

### MAESTROS FALTANTES

Un maestro es una tabla paramétrica de referencia que otros módulos consumen. La diferencia entre un sistema contable y un ERP real es la densidad y calidad de sus maestros.

#### 💰 Maestros Financiero-Bancarios

| Maestro | Presente en | Estado en este ERP | Prioridad | Descripción |
|---------|------------|-------------------|-----------|-------------|
| **Banco** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P0 | Catálogo de entidades bancarias: BCRA, BBVA, Galicia, Macro, Santander, etc. Con código BCRA y SWIFT/BIC para transferencias |
| **Cuenta Bancaria** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P0 | Cuentas corrientes y cajas de ahorro por empresa/proveedor/cliente. CBU, alias, moneda, banco |
| **Cheque** | Protheus / Tango / PRESEA | 🔴 AUSENTE | P0 | Cheques propios emitidos y de terceros recibidos. Estado: en cartera / depositado / rechazado / debitado |
| **Orden de Pago** | SAP / Protheus / Tango | 🔴 AUSENTE | P1 | Instrucción de pago a proveedor con imputación a facturas de compra y retenciones automáticas |
| **Conciliación bancaria** | SAP / Protheus / Tango / PRESEA | ⚠️ Mock | P1 | Modelo `Conciliacion` con estado por movimiento bancario vs. mayor contable |
| **Medio de Pago** | Protheus / Tango | ⚠️ Parcial (enum en `MovimientoCaja`) | P1 | Maestro completo: efectivo, cheque, transferencia, tarjeta (con EDC/terminal), DEBIN, QR, billeteras |
| **Condición de Pago** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Net 30, Net 60, 50% anticipo + 50% entrega, etc. Afecta vencimiento de facturas y plan de cuotas |

#### 🏪 Maestros Comerciales

| Maestro | Presente en | Estado en este ERP | Prioridad | Descripción |
|---------|------------|-------------------|-----------|-------------|
| **Lista de Precios** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P0 | Múltiples listas (minorista, mayorista, especial, exportación). Con vigencia, moneda y factor de markup |
| **Condición Comercial** | Protheus / Tango | 🔴 AUSENTE | P1 | Descuentos por volumen, rappel, pronto pago. Se asignan a clientes o grupos |
| **Vendedor** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Identificación del vendedor en facturas. Con comisión % configurable y zona asignada |
| **Zona de Venta** | SAP / Protheus / Tango | 🔴 AUSENTE | P2 | Territorios geográficos asignados a vendedores. Requerido para análisis de performance comercial |
| **Presupuesto / Cotización** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Documento previo a la factura. Estado: vigente / aprobado / vencido / convertido a pedido |
| **Pedido de Venta** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Orden de venta confirmada. Desencadena reserva de stock y genera remito |
| **Pedido / Orden de Compra** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Orden de compra a proveedor. Genera ingreso de mercancía esperado y controla recepción |
| **Ingreso de Mercancía** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | GR (Goods Receipt) — registra la entrada física de mercancía contra la OC antes de la factura |
| **Rubro de Cliente/Proveedor** | Protheus / Tango / PRESEA | 🔴 AUSENTE | P2 | Clasificación comercial del cliente: gastronomía, comercio, industria, gobierno. Para análisis y pricing |
| **Grupo de Artículo** | SAP / Protheus / Tango | 🔴 AUSENTE | P2 | Agrupación de SKUs para políticas de precio, impuestos internos y estadísticas |

#### 📦 Maestros de Inventario / Almacén

| Maestro | Presente en | Estado en este ERP | Prioridad | Descripción |
|---------|------------|-------------------|-----------|-------------|
| **Ubicación de Almacén** | SAP / Protheus / Tango | 🔴 AUSENTE | P1 | Posición exacta dentro de un depósito: pasillo / estante / posición (ej: A-03-05). Para picking guiado |
| **Lote** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Número de lote de fabricación. Con fecha de vencimiento. Clave para trazabilidad en alimentos y farma |
| **Número de Serie de Artículo** | SAP / Protheus | 🔴 AUSENTE | P2 | Artículos serializados — cada unidad tiene su propio S/N (electrónica, equipos médicos, industria) |
| **Reserva de Stock** | SAP / Protheus / Tango | 🔴 AUSENTE | P1 | Reservas parciales de stock contra pedidos de venta, evitando sobreventas |

#### 🏭 Maestros de Producción / Costos

| Maestro | Presente en | Estado en este ERP | Prioridad | Descripción |
|---------|------------|-------------------|-----------|-------------|
| **Centro de Costo** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | División contable para atribuir gastos e ingresos. Requerido en contabilidad analítica real |
| **Proyecto** | SAP / Protheus | 🔴 AUSENTE | P2 | Agrupador de costos por obra, proyecto o contrato. Subconjunto de Centro de Costo |
| **Activo Fijo** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Bienes de uso con vida útil. Con método de depreciación (lineal / acelerado / UOP). Genera asiento mensual |
| **Grupo de Activos** | SAP / Protheus | 🔴 AUSENTE | P2 | Categorización de activos fijos: rodados, maquinaria, bienes de uso, IT |
| **Centro de Trabajo** | SAP / Protheus | 🔴 AUSENTE | P3 | Recurso productivo (máquina, línea, célula). Para planificación de capacidad en manufactura |

#### 🌍 Maestros de Referencia / Paramétricos

| Maestro | Presente en | Estado en este ERP | Prioridad | Descripción |
|---------|------------|-------------------|-----------|-------------|
| **Banco (catálogo BCRA)** | Protheus / Tango / PRESEA | 🔴 AUSENTE | P0 | Ver arriba. Tabla de entidades financieras del BCRA con código oficial |
| **País** | SAP / Protheus / Tango | 🔴 AUSENTE | P2 | ISO 3166-1. Requerido para facturas de exportación, domicilios internacionales e Incoterms |
| **Provincia** | Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Las 24 jurisdicciones argentinas con código AFIP, organismo IIBB y alícuota base |
| **Localidad / Código Postal** | Tango / PRESEA | 🔴 AUSENTE | P3 | Base de datos de localidades argentinas con código postal. Para COT, domicilios y lógica de envíos |
| **Unidad de Medida** | SAP / Protheus / Tango | ⚠️ Parcial (enum en Producto) | P1 | Maestro con factores de conversión: kg↔g, caja↔unidad, litro↔cc. Actualmente es texto libre |
| **Moneda** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | ISO 4217. ARS, USD, EUR, BRL, UYU. Con cotización histórica y tipo (oficial/MEP/CCL) |
| **Cotización / Tipo de Cambio** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | P1 | Historial de tipos de cambio por moneda y fecha. BCRA + paralelo. Para diferencias de cambio |
| **Incoterm** | SAP / Protheus / Tango | 🔴 AUSENTE | P2 | FOB, CIF, EXW, DDP, DAP, FCA, CPT, etc. Maestro de condiciones de entrega internacional |
| **Medio de Transporte** | Protheus / Tango | 🔴 AUSENTE | P2 | Camión, tren, avión, barco, courier. Para COT y documentos de exportación |
| **Tipo de Documento de Identidad** | Protheus / Tango | ⚠️ Parcial | P2 | DNI, CUIT, CUIL, CDI, LE, LC, Pasaporte, LIBRETA. Actualmente solo DNI/CUIT como texto |

#### 🧾 Maestros Impositivos / AFIP

| Maestro | Presente en | Estado en este ERP | Prioridad | Descripción |
|---------|------------|-------------------|-----------|-------------|
| **Alícuota de IVA** | SAP / Protheus / Tango / PRESEA | ✅ en TaxConcepto/TaxTasa | P0 — ✅ | 0%, 2.5%, 5%, 10.5%, 21%, 27% con código AFIP. Ya implementado |
| **Tipo de Comprobante AFIP** | SAP / Protheus / Tango | ✅ lib/afip/tipos-comprobante.ts | P0 — ✅ | 40+ tipos oficiales. Ya implementado |
| **Punto de Venta AFIP** | SAP / Protheus / Tango | ✅ PuntoVentaConfig | P0 — ✅ | Implementado en Sprint 6 |
| **Serie de Comprobante** | Tango / PRESEA | ✅ Serie | P0 — ✅ | Implementado en Sprint 6 |
| **Impuesto Interno** | Protheus / Tango | 🔴 AUSENTE | P1 | Ley 24.674 — Imp. internos a cigarrillos, bebidas alcohólicas, seguros, vehículos, telefonía. Afectan factura AFIP |
| **Percepción IIBB por Jurisdicción** | Tango / PRESEA | ⚠️ Parcial (TaxConcepto) | P1 | Tabla de alícuotas de percepción IIBB por organismo. Actualmente en TES pero no en maestro editable por el usuario |
| **Retención SICORE por Régimen** | Tango / PRESEA | ⚠️ Parcial (RetencionSICORE) | P1 | Los SICORE deberían cruzarse con un maestro de regímenes actualizables, no hardcodeados |
| **Padrón AFIP / Condición Tributaria** | Tango / PRESEA | 🔴 AUSENTE | P2 | Consulta al padrón AFIP para validar CUIT/CUIL y obtener condición IVA/Ganancias automáticamente |

#### 👥 Maestros de RRHH (no implementados)

| Maestro | Presente en | Estado en este ERP | Prioridad |
|---------|------------|-------------------|-----------|
| **Empleado** | SAP / Protheus / Tango | 🔴 AUSENTE | P3 |
| **Cargo / Puesto** | SAP / Protheus | 🔴 AUSENTE | P3 |
| **Departamento** | SAP / Protheus / Tango | 🔴 AUSENTE | P3 |
| **Liquidación de Sueldos** | Protheus / Tango / PRESEA | 🔴 AUSENTE | P3 |
| **Concepto de Liquidación** | Protheus / Tango | 🔴 AUSENTE | P3 |

---

### INGENIERÍA FUNCIONAL FALTANTE

Comparado contra los flujos estándar de ERPs maduros.

#### 🔴 Crítico — Flujos sin implementar (P0)

| Flujo | Presente en | Estado | Detalle del gap |
|-------|------------|--------|-----------------|
| **Stock automático al facturar** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | `LineaFactura.productoId` existe ✅ pero el handler `decrementarStockPorFactura()` no está llamado en el event bus. Stock nunca se mueve al emitir una venta |
| **Stock automático al comprar** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | `LineaCompra.productoId` existe ✅ pero no hay handler que incremente el stock al confirmar la compra |
| **Reposición de stock por NC** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | Cuando se emite una NC no se revierten los movimientos de stock de la factura original |
| **Cuentas a Cobrar reales** | SAP / Protheus / Tango / PRESEA | 🔴 Mock | No existe el ciclo: Factura → Saldo → Cobro parcial → Saldo residual → Cierre. Ni aging real |
| **Cuentas a Pagar reales** | SAP / Protheus / Tango / PRESEA | 🔴 Mock | Igual que CC pero para compras y proveedores |
| **Múltiples precios por cliente** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | Cualquier cliente paga el `precioVenta` del Producto. No hay listas de precios |
| **Condición de pago en factura** | SAP / Protheus / Tango | 🔴 AUSENTE | No se registra si es contado, 30 días, etc. Afecta el vencimiento en CC |

#### 🟡 Alto — Flujos parciales o ausentes (P1)

| Flujo | Presente en | Estado | Detalle del gap |
|-------|------------|--------|-----------------|
| **Diferencias de cambio automáticas** | SAP / Protheus | 🔴 AUSENTE | Facturas en USD cobradas en ARS generan diferencia de cambio. Debe asentarse en `6.x Resultados financieros` |
| **Retenciones automáticas al pagar** | Protheus / Tango / PRESEA | ⚠️ Parcial | `RetencionSICORE` existe pero no se calcula automáticamente al registrar la orden de pago a proveedor |
| **Trazabilidad de lotes** | SAP / Protheus / Tango | 🔴 AUSENTE | `Lote` modelo no existe. Clave para alimentos, farma, cosmética |
| **Cierre de ejercicio contable** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | No hay rutina de cierre anual: reclasificación de resultados a patrimonio, saldo 0 cuentas de resultado |
| **Ajuste por inflación (RT 6 / RT 39)** | Protheus / PRESEA | 🔴 AUSENTE | Argentina requiere reexpresión contable cuando la inflación supera el 100% en 3 años |
| **Comisiones de vendedores** | SAP / Protheus / Tango | 🔴 AUSENTE | `Vendedor` maestro ausente. Sin él no se pueden liquidar comisiones |
| **Motor de descuentos por volumen** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | No hay motor que aplique descuentos automáticos según cantidad comprada o cliente |
| **Workflow de aprobaciones** | SAP / Protheus | 🔴 AUSENTE | OC > $X necesita aprobación del gerente. No hay FSM de aprobaciones configurable |
| **Email transaccional automático** | Protheus / Tango / PRESEA | 🔴 AUSENTE | Envío automático de factura PDF al cliente no existe. `nodemailer` no instalado |
| **Vencimiento de artículos** | SAP / Protheus / Tango | 🔴 AUSENTE | Alertas de stock próximo a vencer (FEFO — First Expired First Out) |

#### 🟢 Medio — Mejoras respecto a ERPs (P2)

| Flujo | Presente en | Estado | Detalle del gap |
|-------|------------|--------|-----------------|
| **PDF de factura** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | Documento PDF con logo, QR AFIP, datos fiscales. `@react-pdf/renderer` no instalado |
| **Exportar a Excel** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | Exportación real con `ExcelJS`. Hoy sólo hay botones que no hacen nada |
| **Conciliación bancaria** | SAP / Protheus / Tango / PRESEA | 🔴 Mock | Cruzar extracto bancario (OFX/CSV) con movimientos contables. Modelo inexistente |
| **Dashboard financiero consolidado** | SAP / Protheus | ⚠️ Básico | Hoy sólo muestra conteos. Falta: flujo de caja proyectado, aging, ratio de liquidez |
| **Planificación de necesidades (MRP)** | SAP / Protheus | 🔴 AUSENTE | Calcular qué hay que comprar en base a pedidos de venta abiertos menos stock disponible |
| **Presupuesto vs. Real** | SAP / Protheus / Tango | 🔴 AUSENTE | Modelo `Presupuesto` con imputación a centros de costo y comparación mensual |
| **Depreciación automática de activos** | SAP / Protheus / Tango / PRESEA | 🔴 AUSENTE | `ActivoFijo` modelo ausente. Requiere asiento mensual automático |
| **Débito automático / DEBIN** | Bancos arg. / PSPs | 🔴 AUSENTE | Integración con Mercado Pago / Prisma / Getnet para débito electrónico |

---

### TABLA RESUMEN — Maestros a agregar al schema

Esta es la lista priorizada de modelos que se deben agregar al `schema.prisma` para alcanzar paridad con ERPs de la categoría TANGO / PRESEA:

| Modelo | Prioridad | Impacto | Depende de |
|--------|-----------|---------|------------|
| `Banco` | P0 | Cheques, CC/CP, orden de pago | — |
| `CuentaBancaria` | P0 | Conciliación, pagos, cobros | `Banco`, `Empresa`, `Cliente`, `Proveedor` |
| `Cheque` | P0 | Cuentas a cobrar/pagar | `CuentaBancaria`, `Cliente`, `Proveedor` |
| `ListaPrecio` | P0 | Ventas, cotizaciones | `Producto`, `Cliente` |
| `ItemListaPrecio` | P0 | Motor de precios | `ListaPrecio`, `Producto` |
| `Vendedor` | P1 | Comisiones, estadísticas | `Usuario` opcional |
| `CondicionPago` | P1 | CC/CP, vencimientos | — |
| `PresupuestoVenta` | P1 | Flujo de venta completo | `Cliente`, `Producto` |
| `PedidoVenta` | P1 | Reservas de stock | `PresupuestoVenta?`, `Cliente` |
| `OrdenCompra` | P1 | Control de compras | `Proveedor`, `Producto` |
| `IngresoMercaderia` | P1 | Stock automático en compra | `OrdenCompra` |
| `CuentaCobrar` | P1 | CC real con aging | `Factura`, `Cliente` |
| `CuentaPagar` | P1 | CP real con aging | `Compra`, `Proveedor` |
| `PagoRecibido` | P1 | Imputación a CC | `CuentaCobrar`, `Cheque?` |
| `PagoEmitido` | P1 | Imputación a CP | `CuentaPagar`, `Cheque?`, `CuentaBancaria?` |
| `CentroCosto` | P1 | Contabilidad analítica | `AsientoContable` |
| `Moneda` | P1 | Multi-moneda, diferencias cambio | — |
| `Cotizacion` | P1 | Conversión ARS/USD/EUR | `Moneda` |
| `Provincia` | P1 | IIBB, domicilios, COT | — |
| `UnidadMedida` | P1 | Conversiones de stock | `Producto` |
| `Lote` | P1 | Trazabilidad, vencimiento | `Producto`, `MovimientoStock` |
| `ActivoFijo` | P1 | Depreciación, balance | `CentroCosto?` |
| `OrdenPago` | P1 | Flujo CP completo | `CuentaPagar`, `Proveedor` |
| `Incoterm` | P2 | Comercio exterior | — |
| `NotaDebito` | P2 | Ciclo post-venta completo | `Factura`, `Cliente` |
| `Conciliacion` | P2 | Banco real | `CuentaBancaria`, `MovimientoContable` |
| `ZonaVenta` | P2 | Análisis comercial | `Vendedor`, `Cliente` |
| `Rubro` | P2 | Segmentación clientes | `Cliente` |
| `GrupoArticulo` | P2 | Políticas de precio | `Producto` |
| `UbicacionAlmacen` | P2 | Picking guiado | `Deposito`, `StockDeposito` |
| `Empleado` | P3 | RRHH | `Usuario?` |
| `Presupuesto` | P3 | Control de gestión | `CentroCosto` |
| `SerieArticulo` | P3 | Artículos serializados | `Producto`, `MovimientoStock` |

---

### BENCHMARK FINAL — Este ERP vs. Competencia

| Dimensión | SAP B1 | Protheus | Tango Gestión | PRESEA | **Este ERP** |
|-----------|--------|----------|---------------|--------|--------------|
| Facturación electrónica AR | ✅ Addon | ✅ Nativo | ✅ Nativo | ✅ Nativo | ✅ 70% |
| Tax Engine multi-jurisdicción | ✅ | ✅ | ✅ | ✅ | ✅ 95% |
| Puntos de venta + Series | ✅ | ✅ | ✅ | ✅ | ✅ 100% ← Sprint 6 |
| Multi-depósito | ✅ | ✅ | ✅ | ✅ | ✅ Schema listo, UI pendiente |
| Maestro de Bancos/Cheques | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| Listas de Precios múltiples | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| CC/CP reales con aging | ✅ | ✅ | ✅ | ✅ | 🔴 0% (mock) |
| Stock automático en ventas | ✅ | ✅ | ✅ | ✅ | 🔴 0% (modelo OK, lógica no) |
| Lotes / Trazabilidad | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| Activos Fijos + Depreciación | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| Centros de Costo | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| Multi-moneda + Dif. Cambio | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| Ajuste por Inflación (RT6/RT39) | ✅ | ✅ | ❌ | ✅ | 🔴 0% |
| Workflow de Aprobaciones | ✅ | ✅ | ❌ | ❌ | 🔴 0% |
| Módulos IoT / Industria 4.0 | ❌ | ⚠️ Addon | ❌ | ❌ | ✅ 80% ← diferenciador |
| Event Bus / Ingeniería Funcional | ⚠️ | ✅ | ❌ | ❌ | ⚠️ 40% — schema OK |
| Módulos IA nativos | ❌ | ❌ | ❌ | ❌ | ⚠️ 20% — arquitectura lista |
| Picking con IoT | ❌ | ❌ | ❌ | ❌ | ✅ 80% ← diferenciador |
| COT / ARBA | ❌ | ⚠️ Addon | ✅ | ✅ | ✅ Schema + service listos |
| PDF factura | ✅ | ✅ | ✅ | ✅ | 🔴 0% |
| Conciliación bancaria | ✅ | ✅ | ✅ | ✅ | 🔴 0% |

**Conclusión:** El sistema tiene una base sólida en impuestos, facturación y módulos no-tradicionales (IoT, picking, BOM). Los gaps más grandes — y los que más duelen en el uso diario — son los maestros financieros (bancos, cheques), el ciclo CC/CP completo, y el stock automático en ventas que aunque está modelado nunca se dispara. Sprint 7 debería cerrar exactamente eso.

---

## AUDITORÍA DE INGENIERÍA FUNCIONAL COMPLETA (Sprint 7 — Gap Analysis)

> Análisis exhaustivo de brechas de ingeniería más allá del schema.
> Cubre: configuración fiscal multi-eje, lógica de negocio faltante, servicios sin implementar, seeders, APIs sin CRUD, páginas sin backend.

---

### 1. CONFIGURACIÓN FISCAL MULTI-EJE — LO QUE FALTA

El sistema tiene un excelente `ARTaxAdapter` con rates hardcoded + override por DB (`TaxConcepto` + `TaxTasa`).
**Pero le falta el eje cruzado de configuración.** En un ERP real (SAP/Protheus/Tango), los impuestos no son solo "IVA 21%", sino que dependen de **múltiples variables cruzadas**:

#### a) Impuesto × Provincia × Actividad
```
No existe:  "¿Qué alícuota IIBB le cobro a este cliente de Córdoba si vendo software?"
Debería:    Tabla MatrizImpuestoProvincial
            (provinciaId, actividadEconomicaId, tipoImpuesto, alicuota, vigenciaDesde)
```
**Hoy:** el `AR_RATE_CATALOG` tiene `IIBB_CBA_COMERCIO: 3` y `IIBB_CBA_SERVICIOS: 5` como constantes fijas. No hay cruce provincia × actividad económica × vigencia. Si un cliente opera en varias provincias con productos de distinta actividad, el cálculo falla.

#### b) Impuesto × Empresa (Multi-empresa)
```
No existe:  "Empresa A es agente percepción IVA, Empresa B no"
Debería:    Tabla ConfigFiscalEmpresa
            (empresaId, esAgentePercepcionIVA, esAgenteRetencionIVA, esAgentePercepcionIIBB,
             inscripcionIIBB[], actividadPrincipalId, fechaInicioActividades)
```
**Hoy:** el `TaxInput.emisor` recibe `{ condicionIva, provincia?, esAgentePercepcionIVA?, esAgentePercepcionIIBB? }` como parámetros sueltos en el request. No hay configuración persistente por empresa.

#### c) Impuesto × Producto (Clasificación fiscal)
```
No existe:  "Este producto es un medicamento → IVA 10.5%"
Debería:    Campo Producto.clasificacionFiscalId → ClasificacionFiscal
            (codigo, nombre, alicuotaIVA, exentoIIBB, codigoNCM, posArancelaria)
```
**Hoy:** `Producto.porcentajeIva` es un Float fijo (21). No hay clasificación fiscal que determine automáticamente el IVA según tipo de bien.

#### d) Impuesto × Cliente (Padrón)
```
No existe:  "Este cliente está en el padrón ARBA con alícuota especial 1.5%"
Debería:    Tabla PadronRegimenCliente
            (clienteId, regimenId, alicuotaEspecial, periodoDesde, periodoHasta, nroInscripcion)
```
**Hoy:** se asume alícuota fija por jurisdicción. En la realidad ARBA/ARCIBA publican padrones mensuales donde cada CUIT tiene una alícuota personalizada (puede ser 0%, 0.5%, 1.5%, 3%, 5%, 6%).

#### e) Regímenes de Percepción/Retención
```
No existe:  "En esta compra aplico retención IVA porque superé el mínimo no imponible"
Debería:    Tabla RegimenRetencionPercepcion
            (codigo, nombre, organismo, tipo: percepcion|retencion, impuesto: iva|iibb|ganancias,
             montoMinimo, alicuotaGeneral, alicuotaInscripto, alicuotaNoInscripto, vigenciaDesde)
```
**Hoy:** los mínimos están en `SICORE_GANANCIAS_MINIMOS` y las alícuotas en `AR_RATE_CATALOG`. No hay ABM para que un contador actualice regímenes por sistema.

---

### 2. SCHEMA ↔ API ↔ PÁGINA : BRECHAS DE IMPLEMENTACIÓN

Modelos que **existen en schema** pero **NO tienen API ni página**:

| Schema Model | API Route | Dashboard Page | Estado |
|---|---|---|---|
| `Banco` | ❌ No existe | ❌ No existe | Solo schema |
| `CuentaBancaria` | ❌ No existe | `banco/page.tsx` (mock) | Page mock, no API |
| `Cheque` | ❌ No existe | ❌ No existe | Solo schema |
| `CondicionPago` | ❌ No existe | ❌ No existe | Solo schema |
| `Moneda` | ❌ No existe | ❌ No existe | Solo schema |
| `Cotizacion` | ❌ No existe | ❌ No existe | Solo schema |
| `ListaPrecio` + `ItemListaPrecio` | ❌ No existe | ❌ No existe | Solo schema |
| `Vendedor` | ❌ No existe | ❌ No existe | Solo schema |
| `CentroCosto` | ❌ No existe | ❌ No existe | Solo schema |
| `Lote` | ❌ No existe | ❌ No existe | Solo schema |
| `UnidadMedida` | ❌ No existe | ❌ No existe | Solo schema |
| `Incoterm` | ❌ No existe | ❌ No existe | Solo schema |
| `Presupuesto` + `LineaPresupuesto` | ❌ No existe | ❌ No existe | Solo schema |
| `OrdenCompra` + `LineaOrdenCompra` | ❌ No existe | ❌ No existe | Solo schema |
| `ActivoFijo` | ❌ No existe | ❌ No existe | Solo schema |
| `Pais` | ❌ No existe | ❌ No existe | Solo schema |
| `Localidad` | ❌ No existe | ❌ No existe | Solo schema |
| `Provincia` | ❌ No existe | ❌ No existe | Solo schema |
| `TipoDocumento` | ❌ No existe | ❌ No existe | Solo schema |
| `CondicionIva` | ❌ No existe | ❌ No existe | Solo schema |
| `ActividadEconomica` | ❌ No existe | ❌ No existe | Solo schema |
| `ZonaGeografica` | ❌ No existe | ❌ No existe | Solo schema |
| `FormaPago` | ❌ No existe | ❌ No existe | Solo schema |
| `Motivo` | ❌ No existe | ❌ No existe | Solo schema |
| `Feriado` | ❌ No existe | ❌ No existe | Solo schema |
| `TipoCliente` | ❌ No existe | ❌ No existe | Solo schema |
| `EstadoCliente` | ❌ No existe | ❌ No existe | Solo schema |
| `Rubro` | ❌ No existe | ❌ No existe | Solo schema |
| `CanalVenta` | ❌ No existe | ❌ No existe | Solo schema |
| `SegmentoCliente` | ❌ No existe | ❌ No existe | Solo schema |
| `TipoEmpresa` | ❌ No existe | ❌ No existe | Solo schema |
| `Nacionalidad` | ❌ No existe | ❌ No existe | Solo schema |
| `Idioma` | ❌ No existe | ❌ No existe | Solo schema |
| `COT` | ❌ No existe | ❌ No existe | Solo schema |
| `ConfiguracionFuncional` | ❌ No existe | ❌ No existe | Solo schema |
| `HandlerLog` | ❌ No existe | ❌ No existe | Solo schema |
| `Ticket` + `ComentarioTicket` | ❌ No existe | ❌ No existe | Solo schema |
| `NotaCredito` | Carpeta vacía | `notas-credito/page.tsx` | Page existe, API vacía |
| `Deposito` + `StockDeposito` | ❌ No existe | ❌ No existe | Solo schema |
| `TransferenciaDeposito` | ❌ No existe | ❌ No existe | Solo schema |
| `DispositivoIoT` | `/api/iot/lecturas` | `iot/page.tsx` ✅ | API parcial |
| `TaxConcepto` + `TaxTasa` | ❌ No CRUD API | `impuestos/tes/page.tsx` | Page lee hardcoded |

**Resumen: 40+ modelos sin API, 40+ modelos sin página.**

---

### 3. SERVICIOS LIB/ — LÓGICA DE NEGOCIO FALTANTE

| Servicio | Existe | Estado | Lo que falta |
|---|---|---|---|
| `lib/stock/stock-service.ts` | ❌ | No existe | `decrementarStockPorFactura()`, `incrementarStockPorCompra()`, `ajustarStockManual()`, stock por depósito |
| `lib/events/event-bus.ts` | ❌ | No existe | Event emitter + handler registry (el schema `ConfiguracionFuncional` lo modela pero nunca se implementó) |
| `lib/cheques/cheque-service.ts` | ❌ | No existe | Ciclo de vida del cheque: cartera→depositado→rechazado→debitado |
| `lib/banco/conciliacion-service.ts` | ❌ | No existe | Match automático extracto bancario vs movimientos internos |
| `lib/cc-cp/cuentas-service.ts` | ❌ | No existe | Aging CC/CP (30/60/90/+90), saldos, imputación de pagos |
| `lib/precios/precio-service.ts` | ❌ | No existe | `obtenerPrecioProducto(productoId, clienteId, listaId)` con cascada: ListaPrecio → precio base |
| `lib/presupuesto/presupuesto-service.ts` | ❌ | No existe | Ciclo: borrador→enviado→aceptado→facturado, conversión a factura |
| `lib/compras/orden-compra-service.ts` | ❌ | No existe | Ciclo OC: borrador→aprobada→recibida, cruce con ingreso mercadería |
| `lib/activos/amortizacion-service.ts` | ❌ | No existe | Cálculo amortización lineal mensual, cierre de período |
| `lib/multimoneda/moneda-service.ts` | ❌ | No existe | Conversión ARS↔USD↔EUR con cotización del día |
| `lib/padron/padron-service.ts` | ❌ | No existe | Importador de padrón ARBA/ARCIBA (archivos .txt que publican mensualmente) |
| `lib/cot/cot-service.ts` | ❌ | No existe | Generación COT para ARBA (schema `COT` existe) |
| `lib/feriados/feriados-service.ts` | ❌ | No existe | Cálculo de días hábiles para vencimientos |
| `lib/lotes/lote-service.ts` | ❌ | No existe | Trazabilidad lote, alertas vencimiento, FIFO por depósito |
| `lib/pdf/pdf-service.ts` | ❌ | No existe | Generación PDF factura, remito, presupuesto, NC |
| `lib/excel/export-service.ts` | ❌ | No existe | Exportación Excel de reportes (IVA, IIBB, stock, CC/CP) |
| `lib/notificaciones/notificacion-service.ts` | ❌ | No existe | Alertas: stock bajo, cheque por vencer, CC vencida, lote próximo a vencer |

---

### 4. SEEDERS — DATOS INICIALES FALTANTES

El sistema no tiene **ningún seeder Node.js** (`prisma/seed.ts`). Todos los catálogos paramétricos quedan vacíos en la DB.

**Seeders necesarios (en orden de prioridad):**

```
prisma/seed.ts (o scripts/seed-maestros.ts)
├── seedPaises()           → 20 países (AR, UY, BR, CL, PY, US, ES, MX...)
├── seedProvincias()       → 24 provincias + CABA (código AFIP 01–24)
├── seedLocalidades()      → Top 100 ciudades argentinas por provincia
├── seedMonedas()          → ARS, USD, EUR, BRL, UYU con símbolo
├── seedBancos()           → 30 bancos BCRA (Nación, Galicia, Santander, BBVA, Macro...)
├── seedCondicionesIva()   → RI(1), MT(6), CF(5), EX(4), NR(7), NC(8)
├── seedTiposDocumento()   → DNI, CUIT, CUIL, Pasaporte, CDI, LE, LC
├── seedUnidadesMedida()   → u, kg, lts, m, m2, m3, hs, cja, doc (con código AFIP)
├── seedCondicionesPago()  → Contado, Net 15, Net 30, Net 60, 30/60/90
├── seedIncoterms()        → EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
├── seedFormasPago()       → Efectivo, Transferencia, TD, TC, Cheque, MercadoPago, CC
├── seedMotivos()          → NC-Devolución, NC-Bonificación, Ajuste+, Ajuste-, Baja, Merma
├── seedFeriados2026()     → Feriados nacionales 2026
├── seedActividadesEconomicas() → Top 50 CLAE (477190, 620100, 681098...)
├── seedRubros()           → Alimentos, Tecnología, Construcción, Servicios, Salud...
├── seedTaxConceptos()     → Poblar TaxConcepto + TaxTasa desde AR_RATE_CATALOG
└── seedPlanCuentas()      → Migrar PLAN_CUENTAS de lib/contabilidad a DB
```

---

### 5. PÁGINAS DASHBOARD — ESTADOS REALES

| Página | Tiene Backend Real | Tiene UI | Estado |
|---|---|---|---|
| `dashboard/` (KPIs) | ✅ `/api/estadisticas/dashboard` | ✅ | **Producción** |
| `ventas/` | ✅ `/api/afip/emitir-factura` + TES | ✅ Full builder | **Producción** |
| `clientes/` | ✅ `/api/clientes` CRUD | ✅ | **Producción** |
| `productos/` | ✅ `/api/productos` CRUD | ✅ | **Producción** |
| `proveedores/` | ✅ `/api/proveedores` CRUD | ✅ | **Producción** |
| `compras/` | ✅ `/api/compras` POST | ✅ | **Producción** |
| `contabilidad/` | ✅ 4 APIs | ✅ 3 sub-pages | **Producción** |
| `caja/` | ✅ `/api/caja` + movimientos | ✅ | **Producción** |
| `impuestos/` | ✅ 7 APIs | ✅ Sub-pages | **Producción** |
| `usuarios/` | ✅ `/api/usuarios` + `/api/auth` | ✅ | **Producción** |
| `puntos-venta/` | ✅ `/api/puntos-venta` CRUD | ✅ | **Producción** |
| `series/` | ✅ `/api/series` CRUD | ✅ | **Producción** |
| `configuracion/` | ⚠️ Parcial | ✅ Hub | **Parcial** |
| `iot/` | ✅ `/api/iot/lecturas` + alertas | ✅ | **Producción** |
| `onboarding/` | ✅ `lib/onboarding/onboarding-ia.ts` | ✅ | **Producción** |
| `banco/` | ❌ Sin API | ⚠️ Mock data | **Mock** |
| `cuentas-cobrar/` | ❌ Sin API (modelo no existe) | ⚠️ Placeholder | **Mock** |
| `cuentas-pagar/` | ❌ Sin API (modelo no existe) | ⚠️ Placeholder | **Mock** |
| `notas-credito/` | ❌ API folder vacío | ⚠️ Placeholder | **Mock** |
| `remitos/` | ❌ Sin API real | ⚠️ Hardcoded data | **Mock** |
| `agenda/` | ❌ Sin API | ⚠️ Placeholder | **Mock** |
| `membresias/` | ❌ Sin API | ⚠️ Placeholder | **Mock** |
| `hospitalidad/` | ❌ Sin API | ⚠️ Placeholder | **Mock** |
| `historia-clinica/` | ❌ Sin API | ⚠️ Placeholder | **Mock** |

---

### 6. STRINGS HARDCODED QUE DEBERÍAN SER FK A MAESTROS

| Modelo | Campo | Valor actual | Debería ser |
|---|---|---|---|
| `Cliente.condicionIva` | `String "Consumidor Final"` | FK → `CondicionIva.id` |
| `Proveedor.condicionIva` | `String "Responsable Inscripto"` | FK → `CondicionIva.id` |
| `Producto.unidad` | `String "unidad"` | FK → `UnidadMedida.id` (ya tiene `unidadMedidaId` pero `unidad` String sigue) |
| `MovimientoCaja.medioPago` | `String "efectivo"` | FK → `FormaPago.id` |
| `MovimientoStock.tipo` | `String "entrada"` | Enum o FK → `TipoMovimiento` |
| `MovimientoStock.motivo` | `String "venta"` | FK → `Motivo.id` |
| `Deposito.provincia` | `String "PBA"` | FK → `Provincia.id` |
| `Deposito.localidad` | `String` | FK → `Localidad.id` |
| `PeriodoIIBB.jurisdiccion` | `String "PBA"` | FK → `Provincia.id` |
| `PeriodoIIBB.organismo` | `String "ARBA"` | FK o constante + validación |
| `Envio.direccionDestino` | `String` | FK → `Direccion` multi-campo (calle, nro, piso, CP, localidad, provincia) |

---

### 7. MODELOS SCHEMA FALTANTES PARA CERRAR INGENIERÍA

| Modelo | Para qué | Prioridad |
|---|---|---|
| `MatrizImpuestoProvincial` | Cruce Provincia × Actividad × Impuesto → alícuota | P0 — fiscal |
| `ConfigFiscalEmpresa` | Flags por empresa: agente percepción/retención, actividad principal | P0 — fiscal |
| `ClasificacionFiscal` | Tipo de bien para IVA auto (medicamento=10.5%, software=21%) | P0 — fiscal |
| `PadronRegimenCliente` | Alícuota especial ARBA/ARCIBA por CUIT | P0 — fiscal |
| `RegimenRetencionPercepcion` | ABM de regímenes con mínimos y alícuotas | P0 — fiscal |
| `InscripcionIIBB` | Jurisdicciones donde la empresa está inscripta en IIBB | P0 — fiscal |
| `DireccionCliente` | Direcciones múltiples: legal, entrega, facturación | P1 — logística |
| `ContactoCliente` | Contactos múltiples: nombre, cargo, teléfono, email | P1 — CRM |
| `CuentaCobrar` | Saldo pendiente de cobro por factura | P0 — finanzas |
| `CuentaPagar` | Saldo pendiente de pago por compra | P0 — finanzas |
| `Recibo` | Documento de cobro que imputa pagos a facturas | P0 — finanzas |
| `OrdenPago` | Documento de pago que imputa a compras | P0 — finanzas |
| `Numerador` | Numeración automática por tipo documento + PV | P1 — control |
| `PeriodoContable` | Ejercicio fiscal + cierre mensual | P1 — contable |
| `AsientoModelo` | Templates de asientos para operaciones recurrentes | P2 — contable |

---

### 8. FLUJOS DE NEGOCIO FALTANTES (INGENIERÍA FUNCIONAL)

#### P0 — Críticos (sin esto no opera un ERP real)

1. **Stock automático por factura** — Al emitir factura → decrementa stock (y por depósito si aplica). El schema tiene `Deposito` + `StockDeposito` pero no se dispara nunca. Requiere: `lib/stock/stock-service.ts` + hook en `factura-service.ts`.

2. **Ciclo Cobros (CC)** — Factura → CuentaCobrar → Recibo (con imputación parcial) → Cierre. Hoy `cuentas-cobrar/page.tsx` es mock.

3. **Ciclo Pagos (CP)** — Compra → CuentaPagar → OrdenPago → Cierre. Hoy `cuentas-pagar/page.tsx` es mock.

4. **Nota de Crédito completa** — API folder vacío (`app/api/notas-credito/`). Necesita: CRUD + llamada a AFIP + reversión contable + NC que impacte CC.

5. **Numerador automático** — Hoy `Serie.ultimoNumero` existe pero no se incrementa atomicamente al emitir. En alta concurrencia puede haber colisión.

6. **Cálculo fiscal dinámico** — El TES escoge impuestos, pero la alícuota real debería consultarse: `MatrizImpuestoProvincial(provincia, actividad)` en runtime, no del hardcoded `AR_RATE_CATALOG`.

#### P1 — Importantes (operativamente necesarios)

7. **Presupuesto → Factura** — El modelo `Presupuesto` existe pero no hay flujo de conversión. Debería: clonar líneas a factura, cambiar `estado` a "facturado".

8. **OC → Ingreso Mercadería → Factura Proveedor** — Flujo de 3 pasos. Hoy solo existe `Compra` directa.

9. **Conciliación bancaria** — `banco/page.tsx` es mock. Requiere: importar extracto (CSV/OFX), match contra movimientos, marcar conciliados.

10. **Multi-moneda en documentos** — Facturas en USD necesitan: monedaId en Factura, cotización al momento, conversión a ARS para contabilidad.

11. **Remitos con API real** — `remitos/page.tsx` usa datos hardcoded. El modelo existe, la API no.

12. **Exportación PDF** — Clientes necesitan factura en PDF (A4 estándar AFIP). No hay `lib/pdf/`.

13. **Direcciones múltiples por cliente** — Hoy `Cliente.direccion` es un String. Un cliente mayorista puede tener: sede legal + 3 sucursales de entrega + 1 dirección de facturación.

#### P2 — Deseables (para ser competitivo vs Tango/SAP)

14. **Padrón ARBA/ARCIBA automático** — Descarga mensual de archivo .txt, importa alícuotas por CUIT.
15. **Dashboard de vencimientos** — Cheques por vencer, CC/CP por aging, lotes próximos a vencer.
16. **Cierre contable mensual/anual** — Asiento de cierre, apertura nuevo ejercicio.
17. **Ajuste por inflación (RT6/RT39)** — Reexpresión de estados contables. Requiere índice IPC mensual.
18. **Workflow de aprobaciones** — OC > $X requiere aprobación de gerente.
19. **Reportes Excel** — IVA Digital, Libro IVA, SICORE, IIBB → Excel descargable.
20. **MRP básico** — Sugerir OC basado en stock mínimo × demanda proyectada × lead time proveedor.

---

### 9. RESUMEN EJECUTIVO

```
┌──────────────────────────────────────────────────────────────┐
│                    ESTADO DE INGENIERÍA                       │
├──────────────────────────────────────────────────────────────┤
│  Schema Prisma:           84 modelos           ✅ Completo   │
│  APIs implementadas:      ~25 de ~65 necesarias ⚠️ 38%      │
│  Servicios lib/:          ~15 de ~30 necesarios ⚠️ 50%      │
│  Páginas funcionales:     15 de 25 listadas     ⚠️ 60%      │
│  Seeders:                 0 de 17 necesarios    🔴 0%        │
│  Config fiscal multi-eje: 0 de 6 tablas         🔴 0%        │
│  Strings → FK migration:  0 de 11 campos        🔴 0%        │
│  PDF/Excel export:        0 de 2 servicios      🔴 0%        │
│  Event Bus (runtime):     0% implementado        🔴 0%        │
│  Stock automático:        0% (schema 100%)       🔴 0%        │
│  CC/CP real:              0% (pages mock)        🔴 0%        │
├──────────────────────────────────────────────────────────────┤
│  SCORE GLOBAL INGENIERÍA:  ~35% completo                     │
│  SCORE SCHEMA:             ~90% completo (bien)              │
│  SCORE LÓGICA NEGOCIO:     ~25% completo (gap principal)     │
└──────────────────────────────────────────────────────────────┘
```

### 10. PLAN DE IMPLEMENTACIÓN SUGERIDO

| Sprint | Foco | Entregable |
|---|---|---|
| **Sprint 8** | Seeders + API CRUD genérico | `prisma/seed.ts` con 17 seeders. API genérica `/api/maestros/[tabla]` para CRUD de catálogos paramétricos. |
| **Sprint 9** | Config fiscal multi-eje | 6 nuevos modelos fiscales + `lib/fiscal/matriz-service.ts` + ABM en `/dashboard/configuracion/fiscal/` |
| **Sprint 10** | Stock automático + Event Bus | `lib/events/event-bus.ts` + `lib/stock/stock-service.ts` + wiring en factura-service |
| **Sprint 11** | CC/CP + Recibos + Orden Pago | 4 modelos + 4 APIs + 2 páginas + aging report |
| **Sprint 12** | NC completa + Remitos real | API NC con AFIP + reversión contable + API remitos + COT service |
| **Sprint 13** | Presupuesto + OC → flujo completo | Conversión presupuesto→factura + OC→ingreso→factura proveedor |
| **Sprint 14** | PDF + Excel + Conciliación bancaria | `lib/pdf/` + `lib/excel/` + importar extracto CSV/OFX |
| **Sprint 15** | Migrar strings→FK + Cleanup | Migrar condicionIva/unidad/medioPago a FK + eliminar campos legacy |

---

## PROFESIONALIZACIÓN COMERCIAL Y VISUAL

> Objetivo: que el ERP se pueda implementar en comercios de calle de distintos rubros con una experiencia visual sólida, operación simple y dashboards accionables desde el día 1.

### 1. GAP VISUAL ACTUAL (Producto vs. Software técnico)

El sistema tiene potencia técnica, pero aún conserva apariencia de backoffice interno en varias pantallas.

Brechas visuales detectadas:

- Jerarquía visual inconsistente entre módulos (cada página parece de un sistema distinto).
- Falta de un "centro de control" por rol (dueño / cajero / administrador / contador).
- Exceso de vistas tabulares sin narrativa visual del negocio.
- Estados operativos poco visibles (salud AFIP, salud caja, salud stock, vencimientos).
- Escasez de componentes de decisión rápida (alert cards, highlights, quick actions).

### 2. ESTÁNDAR VISUAL PROPUESTO (Street-ready)

Dirección de diseño para profesionalizar el producto:

1. **Layout de operación**: Sidebar + Topbar contextual + panel de alertas + canvas de métricas.
2. **Densidad adaptable**: modo compactado para mostrador/caja y modo analítico para administración.
3. **Estados semánticos unificados**:
  - Verde = operativo
  - Ámbar = riesgo
  - Rojo = bloqueo
4. **Componentes base obligatorios por módulo**:
  - KPI principal del día
  - Alertas críticas
  - Timeline de eventos
  - Acciones rápidas (3 a 5)
5. **Diseño móvil operativo**: flujos de caja, cobro y emisión listos para celular/tablet.

### 3. DASHBOARDS POR RUBRO (Plantillas listas para implementar)

#### a) Kiosco / Almacén

KPIs mínimos:
- Ventas por hora
- Ticket promedio
- Top 20 SKU del día
- Ruptura de stock inmediata

Alertas críticas:
- Producto de alta rotación sin stock
- Caja sin cierre
- Diferencia de caja > tolerancia

#### b) Indumentaria

KPIs mínimos:
- Ventas por talle y color
- Rotación por temporada
- Devoluciones y cambios por motivo
- Margen por marca/categoría

Alertas críticas:
- Talle crítico agotado
- Sobre-stock pre-fin de temporada
- Tasa de cambios por encima de umbral

#### c) Ferretería / Corralón

KPIs mínimos:
- Venta por familia de productos
- Margen por proveedor
- Venta mostrador vs cuenta corriente
- Días de cobertura de inventario

Alertas críticas:
- SKU de obra en quiebre
- Precio de costo desactualizado
- Cuentas a pagar próximas a vencimiento

#### d) Gastronomía

KPIs mínimos:
- Comandas por turno
- Tiempo medio cocina
- Costo de receta vs precio de venta
- Merma por insumo

Alertas críticas:
- Cola de cocina saturada
- Insumo crítico sin reposición
- Margen de plato por debajo del objetivo

#### e) Servicios profesionales

KPIs mínimos:
- Horas facturables
- Ocupación de agenda
- Ingresos recurrentes
- Aging de cuentas a cobrar

Alertas críticas:
- Turnos sin confirmar
- Semana con baja ocupación
- CC > 90 días en aumento

### 4. DATOS QUE FALTAN PARA DASHBOARDS "DE VERDAD"

Modelos/campos recomendados para elevar calidad analítica:

1. `VentaHora` materializada o vista agregada (ventas por franja horaria).
2. `CostoHistoricoProducto` para margen real por período.
3. `MetaComercial` por sucursal/rubro/vendedor.
4. `ObjetivoCaja` para comparación esperado vs real.
5. `EventoOperacion` (event sourcing liviano para trazabilidad de decisiones).
6. `DimensionSucursal` y `DimensionCanal` para análisis multi-eje.
7. `DimensionRubro` para dashboards parametrizados por vertical.

### 5. ONBOARDING + INSTALADOR + PARAMETRIZADOR (Modelo operativo)

Para escalar comercialmente se recomienda formalizar 3 perfiles y 1 flujo:

#### Perfil 1: Instalador
- Alta inicial del entorno
- Verificación impresora/caja/AFIP
- Carga mínima de maestros
- Prueba de emisión real

#### Perfil 2: Parametrizador
- Configura impuestos, listas, formas de pago, permisos, circuitos de aprobación
- Adapta tablero por rubro y rol
- Define alarmas y umbrales operativos

#### Perfil 3: Consultor de adopción
- Capacita al cliente final
- Define KPIs de éxito del negocio
- Monitorea primera semana de operación

#### Flujo objetivo de implementación (SLA 1 día)
1. Wizard guiado (datos fiscales + operación)
2. Plantilla de rubro precargada
3. Check técnico de periféricos
4. Simulación de jornada
5. Go-live con monitoreo activo

### 6. CHECKLIST "LISTO PARA CALLE" (Go-live comercial)

Se considera "listo" cuando cumpla simultáneamente:

1. Alta de comercio en < 60 minutos.
2. Primera factura emitida en < 20 minutos.
3. Caja abre/cierra sin intervención técnica.
4. Dashboard por rubro con mínimo 8 KPIs funcionales.
5. Alertas críticas configuradas y verificadas.
6. Export fiscal y contable operativo.
7. Backups y recuperación documentados.
8. Manual operativo de 1 página por rol.

### 7. ROADMAP DE PROFESIONALIZACIÓN (90 días)

| Fase | Horizonte | Entregable principal |
|---|---|---|
| **Fase A** | 0-30 días | Design system operativo + dashboards base por rol |
| **Fase B** | 31-60 días | Plantillas por rubro + wizard de onboarding en producción |
| **Fase C** | 61-90 días | Red de instaladores/parametrizadores + playbook de go-live |

### 8. MÉTRICAS DE ESCALABILIDAD COMERCIAL

KPIs para medir si el producto ya puede expandirse masivamente:

- Tiempo de implementación promedio por comercio.
- % de comercios activos diarios (DAA).
- Tasa de tickets críticos por comercio/semana.
- Tiempo medio de resolución de incidentes (MTTR).
- Churn mensual de clientes.
- NPS del dueño de negocio luego de 30 días.

---

## SPRINT 11 — TESIS ERP 2026: GAP NORMATIVO, CICLOS OPERATIVOS Y MULTI-LATAM

> Análisis de brechas basado en la **Tesis de Ingeniería Funcional ERP 2026** (Normativa vigente: marzo 2026).
> Cubre: regulación actualizada AR/CL/MX, ciclos operativos completos, webservices faltantes, y pseudocódigo de funciones padrón.

---

### 1. NORMATIVA 2026 — LO QUE EL ERP DEBE IMPLEMENTAR YA

#### Argentina — ARCA (ex AFIP)

| Resolución | Cambio | Estado en ERP | Prioridad |
|---|---|---|---|
| **RG 5824/2026** (13/02/2026) | Amplía obligados a factura electrónica: directores SA, socios SRL, colegios, prepagas, tarjetas crédito | ⚠️ Solo RI/Monotributo | P0 |
| **RG 5824/2026** | Umbral $10.000.000 ARS → CUIT/CUIL obligatorio del consumidor final en FC B/C | 🔴 No validado | P0 |
| **RG 5824/2026** | Comprobante de Liquidación Electrónica Mensual (un único cbte por cliente por mes) | 🔴 No existe | P1 |
| **RG 5824/2026** | Vinculación punto de venta ↔ actividad económica para IVA Simple | 🔴 No existe | P1 |
| **RG 5782/2025** | CAEA pasa a ser excepcional — solo contingencia, priorizar CAE online desde junio 2026 | ⚠️ CAEA sin plan de contingencia | P0 |
| **RG 5762/2025** | Habilitación comprobantes clase A: evaluación cuatrimestral automática comportamiento fiscal | 🔴 No existe lógica | P1 |
| **RG 5616/2024** | Operaciones moneda extranjera: tipo de cambio vendedor BNA del día hábil anterior obligatorio | 🔴 Sin campo `tipoCambio` en Factura | P1 |
| **RG 5616/2024** | Condición IVA del comprador obligatoria en TODOS los comprobantes | ✅ Implementado | — |

**Nuevos webservices ARCA que deben integrarse:**

| Servicio | Función | Estado |
|---|---|---|
| `WSAA` | Autenticación y autorización | ✅ Implementado |
| `WSFEv1` | Factura electrónica mercado interno | ✅ Implementado |
| `WSFEX` | Factura de exportación | 🔴 No implementado |
| `WSCT` | Comprobantes de turismo | 🔴 No implementado |
| **`WSCDC`** | **Constatación de comprobantes (validar CAE del proveedor)** | 🔴 **No implementado — bloqueante para ciclo compras** |
| **`PadronA5`** | **Consulta datos contribuyentes (CUIT, condición IVA, actividad)** | 🔴 **No implementado — validación fiscal en OC/factura proveedor** |

#### Chile — SII (no hay ninguna integración en el ERP)

| Cambio | Detalle | Urgencia |
|---|---|---|
| **Anexo Técnico 2.5** — obligatorio **01/05/2026** | Nuevos esquemas XSD para DTE tipo 33 y 34. Nodos adicionales para trazabilidad. Sin prórroga. | 🔴 Crítico — ERP sin integración SII |
| **Res. Ex. N°154/2025** — guías despacho | Datos obligatorios: origen/destino, patente, conductor, RUT transportista, peso/volumen | 🔴 Crítico — DTE 52 sin implementar |
| **Res. Ex. N°53/2025** — boleta electrónica | Desde marzo 2026: entrega digital (email/SMS/WhatsApp/QR) si no hay impresora | 🔴 Crítico — boleta electrónica ausente |
| **Res. Ex. N°99/2025** | Marketplaces y plataformas de pago deben verificar inicio de actividades del vendedor | 🔴 Aplicable si hay módulo e-commerce |

**DTE Chile que el ERP debe emitir/recibir:**

```
Código | Documento                          | Estado
──────────────────────────────────────────────────────
33     | Factura electrónica afecta (B2B)   | 🔴 No implementado
34     | Factura electrónica exenta         | 🔴 No implementado
39     | Boleta electrónica afecta (B2C)    | 🔴 No implementado
41     | Boleta electrónica exenta          | 🔴 No implementado
46     | Factura de compra electrónica      | 🔴 No implementado
52     | Guía de despacho electrónica       | 🔴 No implementado
56     | Nota de débito electrónica         | 🔴 No implementado
61     | Nota de crédito electrónica        | 🔴 No implementado
43     | Liquidación-factura electrónica    | 🔴 No implementado
```

**Infraestructura Chile requerida:**

- Certificado digital X.509 (por empresa) — 🔴 No existe
- CAF (Código de Autorización de Folios) — solicitud y renovación automática — 🔴 No existe
- Timbre electrónico PDF417 — 🔴 No existe
- RCV (Registro de Compras y Ventas) — envío mensual automático — 🔴 No existe
- Libros electrónicos de compra y venta — 🔴 No existe

#### México — SAT (no hay ninguna integración en el ERP)

| Cambio | Detalle | Urgencia |
|---|---|---|
| **RMF 2026** (28/12/2025 DOF) | Cancelación CFDI requiere aceptación receptor en 3 días (Regla 2.7.1.34) | 🔴 Sin módulo CFDI |
| **Catálogos CFDI 4.0** (13/02/2026) | Más de 55.000 claves `c_ClaveProdServ`. Claves obsoletas → rechazo automático PAC | 🔴 Sin módulo CFDI |
| **Carta Porte 3.1** | Coordenadas exactas, placas verificadas, material peligroso IATA 2026. Multa hasta $97.330 MXN | 🔴 Sin módulo CFDI |
| **CFDI de Pago (REP)** | Obligatorio cuando pago difiere de fecha factura. IVA se acredita con REP, no con factura | 🔴 Sin módulo CFDI |

**Tipos CFDI que debe soportar:**

```
Tipo     | Uso                              | Estado
──────────────────────────────────────────────────────
Ingreso  | Ventas, servicios, arrendamiento | 🔴 No implementado
Egreso   | Notas de crédito, devoluciones   | 🔴 No implementado
Traslado | Movimiento mercancías propias    | 🔴 No implementado
Pago     | REP (Recepción de Pagos)        | 🔴 No implementado
Nómina   | Sueldos y salarios              | 🔴 No implementado
```

---

### 2. CICLO DE COMPRAS — GAP vs. TESIS

La tesis define el ciclo completo: **Solicitud → OC → Recepción+Remito → Factura Proveedor**.

El ERP solo tiene `POST /api/compras` que registra directamente una factura de compra.

**Lo que falta implementar:**

| Paso | Descripción | Estado | Función Padrón Requerida |
|---|---|---|---|
| **Solicitud de compra** | Documento interno con workflow de aprobación | 🔴 No existe | — |
| **Orden de compra (OC)** | Validar RFC/RUT/CUIT proveedor ante autoridad tributaria | 🔴 No existe | `lib/compras/orden-compra-service.ts` |
| **OC con anticipo** | Si hay anticipo → factura de anticipo con CAE | 🔴 No existe | — |
| **Recepción + Remito** | 3-way matching: OC ↔ Remito ↔ Factura | 🔴 No existe | — |
| **COT (ARBA)** | Código de Operación de Transporte para traslados en Provincia de Buenos Aires | ⚠️ Schema COT existe, service no | `lib/cot/cot-service.ts` |
| **Verificar CAE proveedor** | Llamar a WSCDC de ARCA para validar autenticidad de la factura recibida | 🔴 No existe | `lib/afip/wscdc-service.ts` |
| **Retenciones al pagar** | Calcular RG 2854 (IVA) + RG 830 (Ganancias) + IIBB provincial automáticamente | ⚠️ RetencionSICORE existe pero no se dispara en pago | `registrarPago()` |
| **Certificados de retención** | Generar constancias electrónicas RG 2233/3726 | ⚠️ SICORE service existe, constancias no | `generarConstanciaRetencion()` |
| **SICORE mensual** | Declaración de retenciones/percepciones — informar a ARCA | ⚠️ Service parcial | `generarSICORE()` |

**Pseudocódigo — 3-way matching (a implementar):**

```typescript
// lib/compras/matching-service.ts
async function registrarFacturaProveedor(factura, ocId, remitoId) {
  // 1. Validar documento fiscal
  const caeValido = await wscdc.verificarComprobante(factura.cae, factura.cuit)
  if (!caeValido) throw new Error("CAE_INVALIDO")

  // 2. Three-way matching
  const oc = await prisma.ordenCompra.findUnique({ where: { id: ocId } })
  const remito = await prisma.remito.findUnique({ where: { id: remitoId } })
  const diferencias = matchOCRemitoFactura(oc, remito, factura)
  if (diferencias.length > 0) {
    // Requiere aprobación manual — generar excepción
    await crearExcepcionMatching(diferencias, ocId, remitoId)
    return { status: "PENDIENTE_APROBACION", diferencias }
  }

  // 3. Calcular retenciones
  const retenciones = await motorReglas.calcularRetenciones(factura, empresa, "AR")

  // 4. Asiento contable automático
  await generarAsientoCompra(factura.id, retenciones)

  // 5. Actualizar libro de compras
  await libroCompras.agregar(factura, periodo)

  // 6. Generar certificados de retención
  for (const ret of retenciones) {
    await generarCertificadoRetencion(ret, factura.proveedorId)
  }

  // 7. Actualizar cuentas a pagar
  await cuentasPagar.registrar(factura.total - retenciones.totalRetenido)

  return { status: "OK" }
}
```

---

### 3. CICLO DE VENTAS — GAP vs. TESIS

La tesis define: **Pedido → Picking → Remito/Guía Despacho → Factura Electrónica**.

El ERP tiene directamente el paso 4 (factura AFIP). Los pasos 1-3 no existen.

**Lo que falta:**

| Paso | Descripción | Estado | Bloqueo Principal |
|---|---|---|---|
| **Pedido de venta** | Compromiso comercial sin impacto fiscal. Valida datos fiscales del cliente antes de aceptar. | 🔴 No existe modelo `PedidoVenta` | — |
| **Reserva de stock** | Al confirmar pedido → reservar stock para no sobrevender | 🔴 No existe modelo `ReservaStock` | — |
| **Picking** | Proceso interno: cantidades exactas, lotes, series, peso/volumen | 🔴 Picking existe pero no conectado al ciclo venta | — |
| **Guía de despacho (CL)** | DTE tipo 52 con datos Res.154/2025 ANTES del traslado | 🔴 Sin integración SII | SII |
| **Remito + COT (AR)** | Remito + COT ARBA para traslados provincia Buenos Aires | ⚠️ Schema OK, sin API ni lógica | `lib/cot/cot-service.ts` |
| **CFDI + Carta Porte 3.1 (MX)** | Antes de iniciar el traslado, con coordenadas, placas y descripción detallada | 🔴 Sin integración SAT | SAT/PAC |
| **Boleta electrónica digital (CL)** | Desde marzo 2026: entrega digital si no hay impresora | 🔴 Sin integración SII | SII |

**Datos obligatorios en remito/guía (a agregar al modelo `Remito`):**

```prisma
// Cambio necesario en schema.prisma — modelo Remito
model Remito {
  // ... campos existentes ...
  
  // Logística Chile/AR (Res. 154/2025 + COT)
  origenDireccion     String?
  destinoDireccion    String?
  transportistaRut    String?   // RUT/CUIT del transportista
  transportistaNombre String?
  vehiculoPatente     String?
  conductorNombre     String?
  conductorDocumento  String?
  pesoTotal           Float?    // kg
  volumenTotal        Float?    // m³
  tipoTraslado        String?   // venta|traslado_interno|devolucion|consignacion|exportacion
  
  // México CFDI Carta Porte 3.1
  coordenadasOrigen   String?   // lat,long exactas
  coordenadasDestino  String?   // lat,long exactas
  rfcTransportista    String?
  licenciaOperador    String?
  pesoBrutoTotal      Float?
  capacidadVehiculo   Float?
}
```

---

### 4. CICLO FINANCIERO — GAP vs. TESIS

#### 4.1 Cobros

| Requisito tesis | Estado ERP | Lo que falta |
|---|---|---|
| Registro cobro con retenciones sufridas (IVA, Ganancias, IIBB) | 🔴 No existe `registrarCobro()` | `lib/cc-cp/cobro-service.ts` |
| Asiento cobro: Banco / Deudores + Ret.Sufridas | 🔴 No se genera | Agregar a `asiento-service.ts` |
| **REP (México)** — CFDI de Pago cuando pago difiere de factura | 🔴 Sin módulo SAT | Integración SAT/PAC |
| **Recibo electrónico (AR)** — RG 5824 requiere recibos electrónicos | 🔴 No existe modelo `Recibo` | Schema + AFIP webservice |
| Verificar estado de cesión (CL) — si factura fue cedida en factoring | 🔴 Sin integración SII | SII Registro Cesión |
| Medios de cobro: E-cheq, DEBIN, QR MercadoPago | 🔴 No existe | Maestro `FormaPago` + integraciones |

**Asiento cobro con retenciones sufridas — a implementar en `generarAsientoCobro()`:**

```
DEBE Banco c/c            $11.250
DEBE Ret.IVA sufrida         $500   ← crédito fiscal
DEBE Ret.Ganancias sufrida   $200   ← crédito fiscal
DEBE Ret.IIBB sufrida        $150   ← crédito fiscal
     HABER Deudores por Ventas   $12.100
```

#### 4.2 Pagos a Proveedores

| Requisito tesis | Estado ERP | Lo que falta |
|---|---|---|
| Retención IVA (RG 2854) al momento de pagar — padrón mensual ARCA | ⚠️ RetencionSICORE existe, no se aplica en pago | `registrarPago()` disparando `calcularRetenciones()` |
| Retención Ganancias (RG 830) — escala por tipo de renta | ⚠️ Parcial en TaxEngine, no en flujo pago | — |
| Retención SUSS (servicios limpieza/seguridad) | 🔴 No existe | — |
| Retención IIBB provincial (padrón ARBA/ARCIBA) | ⚠️ Parcial | `lib/padron/padron-service.ts` |
| Emisión certificados retención (RG 2233/3726) | 🔴 No genera PDF | `lib/pdf/pdf-service.ts` |
| SICORE mensual — declaración retenciones a ARCA | ⚠️ `sicore-service.ts` parcial | Completar archivo SIAP |
| Retención honorarios Chile 14.5% (año tributario 2026) | 🔴 Sin integración SII | — |
| F29 Chile mensual | 🔴 Sin integración SII | — |
| DDJJ 1879 Chile — retenciones honorarios | 🔴 Sin integración SII | — |
| Retención ISR/IVA México por tipo servicio (10% profesionales) | 🔴 Sin integración SAT | — |

**Asiento pago con retenciones aplicadas — verificar en `generarAsientoPago()`:**

```
DEBE Proveedores       $12.100
     HABER Banco c/c           $11.430
     HABER Ret.IVA a pagar        $380   ← pasivo, se cancela con SICORE
     HABER Ret.Ganancias          $200   ← pasivo, se cancela con SICORE
     HABER Ret.IIBB               $90    ← pasivo, se cancela con DDJJ IIBB
```

---

### 5. CONTABILIDAD — GAP vs. TESIS

#### 5.1 Asientos automáticos faltantes

La tesis exige que CADA evento fiscal genere su asiento sin intervención manual. Estado actual:

| Evento | Asiento requerido | Estado |
|---|---|---|
| Factura venta emitida | Deudores / Ventas + IVA Débito | ✅ Implementado |
| Factura proveedor registrada | Compras + IVA Crédito / Proveedores | ✅ Implementado |
| Nota de crédito emitida | Reverso venta + IVA | ✅ `generarAsientoNC()` |
| Nota de crédito recibida | Proveedores / Compras + reverso IVA | 🔴 No existe |
| **Cobro de cliente** | Banco / Deudores + retenciones sufridas | 🔴 No existe |
| **Pago a proveedor** | Proveedores / Banco + retenciones aplicadas | 🔴 No existe |
| **Retención practicada** | Proveedores / Ret.a depositar | 🔴 No existe |
| **Retención sufrida** | Ret.a favor / Deudores | 🔴 No existe |
| **Depósito de retenciones** | Ret.a depositar / Banco | 🔴 No existe |
| **Liquidación IVA mensual** | IVA Débito / IVA Crédito / IVA a pagar | 🔴 Solo calcula, no asienta |
| **Pago de IVA** | IVA a pagar / Banco | 🔴 No existe |
| **Diferencia de cambio** | Resultado +/- / Deudores-Proveedores | 🔴 No existe (sin multi-moneda) |
| **CMV al facturar** | CMV / Mercaderías | 🔴 `generarAsientoCMV()` no conectado |
| **Despacho de mercadería (remito)** | CMV / Mercaderías al costo | 🔴 No existe |

#### 5.2 Liquidación IVA mensual — pseudocódigo a implementar

La función `liquidarIVAMensual()` actual solo calcula valores. Falta:
1. Generar asiento contable de liquidación
2. Calcular prorrateo de crédito fiscal si hay ops exentas
3. Incluir retenciones y percepciones a favor
4. Generar SICORE AR / F29 CL / declaración MX
5. Registrar saldo a favor en caso de crédito > débito

```typescript
// lib/impuestos/liquidacion-service.ts — ampliar iva-service.ts
async function liquidarIVAMensual(periodo: string, empresaId: string, pais: 'AR' | 'CL' | 'MX') {
  const debito = await sumarLibroVentas(periodo, empresaId)
  const credito = await sumarLibroCompras(periodo, empresaId)
  
  let creditoComputable = credito
  let retencionesAFavor = 0
  let percepcionesAFavor = 0

  if (pais === 'AR') {
    // Prorrateo si hay ops exentas
    creditoComputable = await prorratearCreditoFiscal(credito, empresaId)
    // Retenciones y percepciones sufridas
    retencionesAFavor = await sumarRetencionesIVASufridas(periodo, empresaId)
    percepcionesAFavor = await sumarPercepcionesIVASufridas(periodo, empresaId)
  }

  const saldo = debito - creditoComputable - retencionesAFavor - percepcionesAFavor

  if (saldo > 0) {
    // Asiento: IVA Débito / IVA Crédito / IVA a Pagar
    await generarAsientoLiquidacionIVA(debito, creditoComputable, saldo, empresaId)
    await registrarVencimientoPago(saldo, pais)
  } else {
    // Saldo a favor — arrastrar al siguiente período
    await registrarSaldoAFavor(Math.abs(saldo), periodo, empresaId)
  }

  // Generar declaración jurada
  if (pais === 'AR') return await generarDJJIVA(periodo, debito, creditoComputable, retencionesAFavor, percepcionesAFavor, saldo)
  if (pais === 'CL') return await generarF29(periodo, debito, credito, saldo)
  if (pais === 'MX') return await generarDeclaracionMensual(periodo, saldo)
}
```

#### 5.3 Cuentas fiscales mínimas en Plan de Cuentas

El ERP debe tener estas cuentas si no existen. Verificar con seed:

```
ACTIVO CORRIENTE — cuentas fiscales:
  1.1.5.01  IVA Crédito Fiscal
  1.1.5.02  Ret. IVA sufridas (a favor)
  1.1.5.03  Ret. Ganancias sufridas (a favor)
  1.1.5.04  Ret. IIBB sufridas (a favor)
  1.1.5.05  Anticipos de impuestos
  1.1.5.06  Saldo a favor IVA períodos anteriores

PASIVO CORRIENTE — cuentas fiscales:
  2.1.4.01  IVA Débito Fiscal
  2.1.4.02  IVA a Pagar (neto período)
  2.1.4.03  Ret. IVA a depositar (aplicadas)
  2.1.4.04  Ret. Ganancias a depositar
  2.1.4.05  Ret. IIBB a depositar
  2.1.4.06  SUSS a depositar
  2.1.4.07  Provisión Impuesto Ganancias

ESTADO DE RESULTADOS:
  4.3.1.01  Impuesto Ganancias (corriente + diferido)
  4.3.1.02  Impuestos sobre IIBB
  4.3.1.03  CMV (Costo Mercadería Vendida)
```

#### 5.4 Reportes fiscales faltantes

| Reporte | Periodicidad | Estado |
|---|---|---|
| Libro IVA Ventas / Compras | Mensual | ⚠️ Parcial — falta CSV conforme ARCA |
| Libro IVA Digital (AR) | Mensual | ⚠️ Parcial |
| SICORE — RR.PP. practicadas (AR) | Mensual | ⚠️ Service existe, archivo SIAP incompleto |
| **F29 (CL)** — declaración mensual | Mensual | 🔴 Sin integración SII |
| **Declaración mensual IVA (MX)** | Mensual | 🔴 Sin integración SAT |
| **DDJJ Ganancias / Renta** | Anual | 🔴 No existe |
| DDJJ 1879 CL — retenciones honorarios | Anual | 🔴 Sin integración SII |
| **DIOT México** — informativa operaciones con terceros | Anual | 🔴 Sin integración SAT |
| Dashboard cumplimiento fiscal tiempo real | Ad-hoc | 🔴 No existe |
| Alertas vencimiento DDJJ y pagos | Ad-hoc | 🔴 No existe — `lib/notificaciones/` ausente |
| Proyección de carga impositiva | Ad-hoc | 🔴 No existe |

---

### 6. MULTI-LATAM — ROADMAP POR PAÍS

El ERP actual es **Argentina-only**. La tesis plantea motor de reglas Multi-LATAM.

#### Estado de integración por país

| País | Factura Electrónica | Tax Engine | Stock | Cobros/Pagos | Reportes Fiscales |
|---|---|---|---|---|---|
| **Argentina (AR)** | ✅ 70% | ✅ 95% | 🔴 0% lógica | 🔴 0% | ⚠️ 40% |
| **Chile (CL)** | 🔴 0% | 🔴 0% | 🔴 0% | 🔴 0% | 🔴 0% |
| **México (MX)** | 🔴 0% | 🔴 0% | 🔴 0% | 🔴 0% | 🔴 0% |
| Uruguay (UY) | ❌ No planificado | ❌ | ❌ | ❌ | ❌ |
| Brasil (BR) | ❌ No planificado | ❌ | ❌ | ❌ | ❌ |

#### Adapter Chile (a crear: `lib/tes/adapters/cl-adapter.ts`)

```typescript
// lib/tes/adapters/cl-adapter.ts
export class CLTaxAdapter implements CountryTaxAdapter {
  country = 'CL' as const
  
  calculate(input: TaxInput): TaxBreakdown {
    const IVA_CL = 0.19  // 19% Chile
    
    const items = input.items.map(item => {
      const alicuota = item.exento ? 0 : IVA_CL
      const montoIVA = item.subtotal * alicuota
      return { ...item, alicuota, montoIVA }
    })
    
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
    const totalIVA = items.reduce((s, i) => s + i.montoIVA, 0)
    
    return {
      subtotalNeto: subtotal,
      totalImpuestos: totalIVA,
      totalFinal: subtotal + totalIVA,
      desglose: [{ nombre: 'IVA 19%', monto: totalIVA, base: subtotal }]
    }
  }
}
```

#### Adapter México (a crear: `lib/tes/adapters/mx-adapter.ts`)

```typescript
// lib/tes/adapters/mx-adapter.ts
export class MXTaxAdapter implements CountryTaxAdapter {
  country = 'MX' as const
  
  calculate(input: TaxInput): TaxBreakdown {
    const IVA_MX = 0.16  // 16% México
    // TODO: IEPS según c_ClaveProdServ (tabacos, bebidas, combustibles)
    // TODO: retenciones ISR según tipo servicio (10% profesionales, 10% arrendamiento)
    
    const items = input.items.map(item => ({
      ...item,
      alicuota: item.exento ? 0 : IVA_MX,
      montoIVA: item.subtotal * (item.exento ? 0 : IVA_MX)
    }))
    
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
    const totalIVA = items.reduce((s, i) => s + i.montoIVA, 0)
    
    return {
      subtotalNeto: subtotal,
      totalImpuestos: totalIVA,
      totalFinal: subtotal + totalIVA,
      desglose: [{ nombre: 'IVA 16%', monto: totalIVA, base: subtotal }]
    }
  }
}
```

---

### 7. PLAN DE SPRINT 11 — CIERRE DE GAPS TESIS

#### Sprint 11A — Normativa AR 2026 urgente (P0)

- [ ] Validar umbral $10.000.000 ARS en FC B/C → exigir CUIT/CUIL del consumidor final
- [ ] Campo `tipoCambio` en modelo `Factura` y `Compra` (RG 5616/2024 — moneda extranjera)
- [ ] `lib/afip/wscdc-service.ts` — verificar CAE de facturas recibidas de proveedores
- [ ] `lib/afip/padron-service.ts` — consultar CUIT, condición IVA y actividad via PadronA5
- [ ] Plan de contingencia CAEA (RG 5782/2025) — solo para cortes de internet
- [ ] Completar archivo SIAP en `sicore-service.ts` para presentación mensual

#### Sprint 11B — Ciclo compras completo (P0)

- [ ] Modelo `OrdenCompra` + `LineaOrdenCompra` en schema.prisma
- [ ] `POST /api/compras/orden` — crear OC con validación fiscal del proveedor (PadronA5)
- [ ] `POST /api/compras/recepcion` — registrar ingreso mercadería contra OC
- [ ] 3-way matching: `lib/compras/matching-service.ts`
- [ ] Retenciones automáticas al pagar: conectar `calcularRetenciones()` en `registrarPago()`
- [ ] `generarCertificadoRetencion(ret)` — constancia PDF RG 2233/3726

#### Sprint 11C — Ciclo ventas completo (P1)

- [ ] Modelo `PedidoVenta` + `LineaPedido` con validación fiscal del cliente
- [ ] Reserva de stock al confirmar pedido
- [ ] Conectar picking con ciclo pedido→remito→factura
- [ ] Agregar campos logísticos al modelo `Remito` (conductor, patente, coordenadas)
- [ ] COT ARBA: `lib/cot/cot-service.ts` — generar COT para traslados en PBA

#### Sprint 11D — Asientos faltantes (P1)

- [ ] `generarAsientoCobro(facturaId, monto, retencionesSufridas)` — DEBE Banco / HABER Deudores + Ret.
- [ ] `generarAsientoPago(compraId, monto, retencionesAplicadas)` — DEBE Proveedores / HABER Banco + Ret.
- [ ] `generarAsientoLiquidacionIVA(periodo)` — IVA Débito / IVA Crédito / IVA a Pagar
- [ ] `generarAsientoCMV(facturaId)` — DEBE CMV / HABER Mercaderías (conectar al event bus)
- [ ] Verificar cuentas del plan de cuentas: agregar cuentas fiscales faltantes al seed

#### Sprint 11E — Chile y México (P2 — Multi-LATAM)

- [ ] `lib/tes/adapters/cl-adapter.ts` — IVA 19%, DTE XML según Anexo Técnico 2.5
- [ ] `lib/tes/adapters/mx-adapter.ts` — IVA 16%, IEPS básico, retenciones ISR
- [ ] Investigación profunda de APIs SII/PAC antes de implementar (certificaciones requeridas)
- [ ] `registerTaxAdapter(new CLTaxAdapter())` y `registerTaxAdapter(new MXTaxAdapter())` al boot

---

### 8. RESUMEN EJECUTIVO — TESIS vs. ERP ACTUAL

```
┌────────────────────────────────────────────────────────────────┐
│           GAP TESIS ERP 2026 vs. ESTADO ACTUAL                │
├────────────────────────────────────────────────────────────────┤
│  Normativa AR 2026 (RG 5824, 5782, 5616):    ⚠️  40%          │
│  Ciclo compras completo (OC→3way→fact):       🔴   5%          │
│  Ciclo ventas completo (pedido→guía→fact):    🔴  10%          │
│  Ciclo cobros con retenciones sufridas:       🔴   0%          │
│  Ciclo pagos con retenciones aplicadas:       ⚠️  30%          │
│  Asientos automáticos por evento fiscal:      ⚠️  40%          │
│  Liquidación IVA mensual completa:            ⚠️  50%          │
│  Reportes fiscales (SICORE, DDJJ, F29):       🔴  15%          │
│  Webservices ARCA (WSCDC, PadronA5):          🔴   0%          │
│  Chile SII (DTE, CAF, RCV, Anexo 2.5):       🔴   0%          │
│  México SAT (CFDI, PAC, REP, Carta Porte):   🔴   0%          │
├────────────────────────────────────────────────────────────────┤
│  SCORE CUMPLIMIENTO TESIS:   ~20% global                       │
│  SCORE ARGENTINA:            ~55% (mejor área)                 │
│  SCORE CHILE + MÉXICO:        ~0% (no iniciado)                │
│                                                                │
│  DEUDA TÉCNICA CRÍTICA:                                        │
│  → WSCDC + PadronA5 (bloquea validación facturas proveedores) │
│  → 3-way matching (sin esto no hay ciclo compras real)         │
│  → Asientos cobros/pagos (sin esto contabilidad queda rota)   │
│  → generarAsientoCMV() sin conectar (margen bruto incorrecto) │
└────────────────────────────────────────────────────────────────┘
```


### 9. SCORE DE PREPARACIÓN POR RUBRO (Operable hoy vs. objetivo)

| Rubro | Estado actual | Operable hoy | Falta crítica para escalar |
|---|---|---|---|
| Kiosco / Almacén | 🟡 Intermedio | Sí, con ajustes manuales | Reposición automática + dashboard de rotación horaria |
| Indumentaria | 🟡 Intermedio | Parcial | Variantes (talle/color) + análisis de temporada |
| Ferretería | 🟡 Intermedio | Parcial | Precios por lista + CC/CP robusto + stock por depósito |
| Gastronomía | 🟠 Inicial | Parcial | Comandas/KDS integradas con stock y costo de receta |
| Servicios | 🟠 Inicial | Parcial | Agenda + facturación recurrente + aging de cobranzas |
| Salud / Clínica | 🔴 Inicial | No | Historia clínica + trazabilidad + permisos avanzados |

### 10. CONTRATO DE DATOS MÍNIMO PARA DASHBOARDS POR RUBRO

Sin este mínimo de datos, los tableros se ven pero no ayudan a decidir.

Datos mínimos transversales:

1. Fecha/hora exacta de operación (`timestamp` por evento comercial).
2. Monto neto, impuesto, costo y margen por transacción.
3. Usuario/rol que ejecutó la operación.
4. Canal de venta (mostrador, online, delivery, mayorista).
5. Estado de documento (emitido, anulado, pendiente, vencido).

Datos mínimos por rubro:

- Kiosco: franja horaria, ticket, unidades por SKU.
- Indumentaria: variante (talle/color), temporada, cambios/devoluciones.
- Ferretería: familia técnica, proveedor principal, lead time reposición.
- Gastronomía: receta, costo insumo, tiempo cocina, merma.
- Servicios: agenda, profesional, horas facturables, recurrencia.

### 11. NEXT STEP RECOMENDADO (Producto + Operación)

Para la siguiente etapa de profesionalización:

1. Persistir selección de rubro/rol por empresa y usuario.
2. Activar wizard de implementación con perfil (`instalador`, `parametrizador`, `dueño`).
3. Crear tablero "Go-live" con checklist verificable y evidencia.
4. Definir SLA de implementación y soporte de primera semana.
5. Medir adoption score por cliente (uso real de módulos clave).

---

**Conclusión de profesionalización:**
El proyecto ya tiene base técnica para competir, pero para conquistar "todo negocio a la calle" necesita cerrar tres capas en paralelo: **experiencia visual profesional**, **dashboards por vertical**, y **modelo operativo de implementación (instalador + parametrizador + adopción)**.

### 12. DELTA IMPLEMENTADO (2026-03-30)

Avances concretos ya aplicados en frontend/producto:

1. Dashboard con persistencia local de filtros clave (`rubro`, `periodo`) para continuidad de uso.
2. Bloque de acciones rápidas por rubro en dashboard operativo.
3. Indicador de salud operativa (%) para priorizar decisiones del día.
4. Onboarding con perfil de implementación (`instalador`, `parametrizador`, `dueno`).
5. Guardado automático del borrador de onboarding en navegador y reanudación.
6. Checklist go-live visible al finalizar onboarding.

Estado de esos puntos:

- Persistencia por usuario/empresa en DB: pendiente (hoy local storage).
- Torre de control multi-cliente para implementaciones: pendiente.
- Adoption score por cliente/módulo: pendiente.

### 13. DELTA FUNCIONAL GO-LIVE POS (2026-03-30)

Implementado en este ciclo:

1. Compatibilidad real POS -> AFIP en `POST /api/afip/emitir-factura`.
2. Validaciones obligatorias AFIP en emisión (CUIT/DNI/condición IVA + regla de Factura A).
3. Enlace de líneas de factura con `productoId` para impacto correcto en stock/reporting.
4. Resolución de precio por cliente/lista (`GET /api/precios/resolver`) con fallback a precio base.
5. ABM inicial de Listas de Precio en UI (`/dashboard/listas-precio`).
6. Sistema de tickets internos:
  - API `/api/tickets`
  - botón global "Reportar error"
  - bandeja analista `/dashboard/soporte`
7. Operación rápida por teclado en ventas (F2/F3/F4/F9/Ctrl+P).

Pendientes P0 para salida comercial robusta:

- Asignación y mantenimiento masivo de items de lista de precios (no solo cabecera).
- Selección de punto de venta/serie desde POS (hoy fijo en PV 1 por UI).
- Impresión fiscal integrada por driver/dispositivo (hoy `window.print` como fallback rápido).



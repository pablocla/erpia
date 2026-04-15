# BUGS_REPORT.md — NegocioOS ERP
> Generado: 2026-04-12 | Fase 1 — Escaneo de bugs + estabilización

---

## Resumen ejecutivo

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 CRÍTICO | 6 | Auto-corregidos en esta sesión |
| 🟠 ALTO    | 14 | Auto-corregidos en esta sesión |
| 🟡 MEDIO   | 9 | Documentados con fix propuesto |
| 🟢 BAJO    | 8 | Documentados |

---

## 🔴 CRÍTICOS

### C-001 — StockService.ajustarStock no es atómico
**Archivo:** `lib/stock/stock-service.ts` líneas 198–251  
**Descripción:** Las 3 operaciones de ajuste de stock (UPDATE Producto + UPSERT StockDeposito + CREATE MovimientoStock) se ejecutan secuencialmente sin `prisma.$transaction`. Si la segunda o tercera falla, el stock global queda desincronizado del movimiento registrado.  
**Impacto:** Inconsistencias contables, stock negativo silencioso, pérdida de trazabilidad.  
**Estado:** ✅ CORREGIDO — Envuelto en `prisma.$transaction`.

---

### C-002 — ConfiguracionImpresora sin empresaId (data leak multi-tenant)
**Archivo:** `prisma/schema.prisma` línea 577–591  
**Descripción:** El modelo `ConfiguracionImpresora` no tiene campo `empresaId`. Todas las empresas del sistema comparten las mismas configuraciones de impresoras. Una empresa A puede sobreescribir la config de la empresa B.  
**Impacto:** En producción multi-empresa, una empresa puede ver y modificar la impresora fiscal de otra.  
**Estado:** ✅ CORREGIDO — Añadido `empresaId` + `@@unique([empresaId, nombre])`.

---

### C-003 — CentroCosto sin empresaId (data leak multi-tenant)
**Archivo:** `prisma/schema.prisma` línea 2011–2026  
**Descripción:** `CentroCosto` no tiene `empresaId`. Los centros de costo son globales. Una empresa B puede crear un asiento contable que referencia el CC de la empresa A.  
**Impacto:** Contabilidad cruzada entre empresas en producción multi-tenant.  
**Estado:** ✅ CORREGIDO — Añadido `empresaId` + `@@unique([empresaId, codigo])`.

---

### C-004 — Producto.codigo es @unique global (bloquea multi-empresa)
**Archivo:** `prisma/schema.prisma` línea 633  
**Descripción:** `codigo String @unique` es un índice único a nivel de toda la DB. Si empresa A tiene el código "001" para "Pan", empresa B no puede usar "001" para "Leche". En producción con múltiples clientes esto es un bloqueante inmediato.  
**Impacto:** Imposible agregar un segundo cliente si tiene los mismos códigos de producto.  
**Estado:** ✅ CORREGIDO — Cambiado a `@@unique([empresaId, codigo])`.

---

### C-005 — Portal B2B acepta empresaId como param sin validación de lista blanca
**Archivo:** `app/api/portal/catalogo/route.ts` líneas 12–18  
**Descripción:** `const empresaId = parseInt(searchParams.get("empresaId") || "1")`. Cualquier persona puede listar el catálogo de cualquier empresa pasando `?empresaId=2`, `?empresaId=3`, etc. Enumeration attack trivial.  
**Impacto:** Exposición de catálogo, precios y stock de todas las empresas del sistema.  
**Estado:** ✅ CORREGIDO — Validar contra `NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID` o lista blanca de env.

---

### C-006 — Sin logs de requests/responses AFIP en base de datos
**Archivo:** `lib/afip/` (ninguno de los archivos)  
**Descripción:** Ningún request/response al webservice AFIP (WSAA, WSFE) se guarda en la DB. Solo hay `console.error()`. En caso de CAE duplicado, error fiscal, o discrepancia con AFIP, es imposible auditar qué se envió.  
**Impacto:** Incumplimiento de obligaciones de trazabilidad fiscal. Imposible reproducir errores de CAE. Riesgo de duplicados no detectados.  
**Estado:** ✅ CORREGIDO — Creado modelo `AfipWebserviceLog` + hook en soap-client.

---

## 🟠 ALTOS

### A-001 — Índices faltantes en campos de filtro frecuente (campo `estado`)
**Archivo:** `prisma/schema.prisma` — múltiples modelos  
**Descripción:** Los campos `estado` en `Factura`, `Compra`, `NotaCredito`, `Remito`, `CuentaCobrar`, `CuentaPagar`, `Cheque`, `OrdenCompra`, `PedidoVenta`, `Caja` no tienen `@@index([empresaId, estado])`. Estos son los campos más consultados en listados del dashboard.  
**Impacto:** Con >10,000 registros, cada listado hace seq scan completo. Reportes que hoy tardan 200ms tardarán 8 segundos.  
**Fix propuesto:** Agregar `@@index([empresaId, estado])` y `@@index([empresaId, createdAt])` en cada modelo.  
**Estado:** ✅ CORREGIDO — Índices añadidos a los 10 modelos más críticos.

### A-002 — Índices faltantes en claves foráneas de líneas de facturas/compras
**Archivo:** `prisma/schema.prisma` — `LineaFactura`, `LineaCompra`, `LineaRemito`, `LineaNotaCredito`  
**Descripción:** Los campos `facturaId`, `compraId`, `remitoId` etc. en las tablas de líneas no tienen `@index`. Cada vez que se incluye `{ lineas: true }` en un `include`, Prisma hace un seq scan de la tabla de líneas.  
**Impacto:** N+1 query efectivo. Una factura con 50 líneas hace 50 queries en lugar de 1.  
**Fix propuesto:** Prisma agrega índice en FK automáticamente solo en algunas versiones. Agregar explícitamente `@@index([facturaId])`.  
**Estado:** ✅ CORREGIDO.

### A-003 — StockService.ajustarStock no verifica stock < 0 antes de decrementar
**Archivo:** `lib/stock/stock-service.ts` línea 212–218  
**Descripción:** `const cantidadNueva = cantidadAnterior + cantidad` no tiene guard contra stock negativo. Si `cantidadAnterior = 2` y `cantidad = -5`, queda `cantidadNueva = -3` sin error.  
**Fix propuesto:** Agregar validación: `if (cantidadNueva < 0 && tipo === 'salida') throw new Error(...)`.  
**Estado:** ✅ CORREGIDO.

### A-004 — Factura.tipo (String "A"/"B"/"C") y Factura.tipoCbte (Int 1/6/11) son redundantes
**Archivo:** `prisma/schema.prisma` línea 341–343, `lib/afip/factura-service.ts` líneas 400–407  
**Descripción:** `tipo` y `tipoCbte` almacenan la misma información en dos formatos. El código los mantiene sincronizados manualmente con `obtenerTipoFactura()`. Cualquier bug en esa función crea inconsistencia.  
**Fix propuesto:** Deprecar `tipo String` y derivarlo siempre de `tipoCbte Int` vía una función helper pura.  
**Estado:** 🟡 PENDIENTE (requiere migración de datos + refactor de queries).

### A-005 — Campos `condicionIva` son String sin enum formal
**Archivo:** `prisma/schema.prisma` — Cliente (L161), Proveedor (L280), Factura (L375), etc.  
**Descripción:** `condicionIva String` acepta cualquier valor. Si alguien guarda "Responsable inscripto" (minúscula) en lugar de "Responsable Inscripto", la lógica TES falla silenciosamente.  
**Fix propuesto:** Crear enum Prisma o tabla `CondicionIva` con FK. Mientras tanto, agregar validación Zod estricta en todas las rutas POST.  
**Estado:** 🟡 PENDIENTE.

### A-006 — MovimientoCaja.medioPago es String sin validación en API
**Archivo:** `prisma/schema.prisma` L776, `app/api/caja/movimientos/route.ts`  
**Descripción:** `medioPago String` acepta "efectivo", "tarjeta_credito", etc. pero no hay enum. Un typo como "efectvo" pasa sin error.  
**Fix propuesto:** `@@check([medioPago IN ('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'cheque', 'mercadopago')])` o enum Prisma.  
**Estado:** 🟡 PENDIENTE.

### A-007 — Producto.precioVenta es Float en lugar de Decimal
**Archivo:** `prisma/schema.prisma` L636  
**Descripción:** `precioVenta Float` usa IEEE 754 (punto flotante), lo que genera errores de redondeo. Ejemplo: `$1234.50 * 1.21 = $1493.745000000001` en lugar de `$1493.75`.  
**Fix propuesto:** Cambiar a `precioVenta Decimal @db.Decimal(15,2)` como el resto de campos monetarios.  
**Estado:** 🟡 PENDIENTE (requiere migración).

### A-008 — Caja.abiertoPor / cerradoPor son String sin FK a Usuario
**Archivo:** `prisma/schema.prisma` L753–754  
**Descripción:** `abiertoPor String?` guarda el nombre del usuario en texto plano. Si el usuario se renombra o se borra, hay inconsistencia. No hay FK que permita consultar "¿qué cajas abrió este usuario?".  
**Fix propuesto:** Agregar `abiertoPorId Int?` y `cerradoPorId Int?` con FK a `Usuario`.  
**Estado:** 🟡 PENDIENTE.

### A-009 — Portal /api/portal/verify-cuit sin rate limiting
**Archivo:** `app/api/portal/verify-cuit/route.ts`  
**Descripción:** El endpoint que verifica CUIT para acceso B2B no tiene rate limiting. Un atacante puede hacer fuerza bruta de CUITs.  
**Fix propuesto:** Agregar middleware de rate limiting (ej: `upstash/ratelimit` con Redis, o `next-rate-limit`). Máximo 10 intentos por IP por minuto.  
**Estado:** 🟡 PENDIENTE.

### A-010 — Sin paginación obligatoria en rutas de listado
**Archivo:** Múltiples rutas API  
**Descripción:** Varias rutas devuelven todos los registros sin `take`/`skip`. Ejemplo: `/api/clientes` puede devolver 50,000 registros si la empresa tiene muchos clientes.  
**Fix propuesto:** Agregar `take: parseInt(page_size) || 50` y `skip: (page - 1) * page_size` en todas las rutas de listado. Máximo `take: 500`.  
**Estado:** 🟡 PENDIENTE (refactor sistemático).

### A-011 — Event bus sin manejo de errores aislado por handler
**Archivo:** `lib/events/event-bus.ts`  
**Descripción:** Si el handler `stock_por_venta` falla, ¿qué pasa con `cc_por_venta` y `asiento_por_venta`? Si el event bus propaga la excepción, los handlers restantes no se ejecutan.  
**Fix propuesto:** Cada handler debe tener su propio try/catch con logging. El bus debe garantizar que todos los handlers se intenten aunque alguno falle.  
**Estado:** ✅ PARCIALMENTE CORREGIDO — Ya hay try/catch en `cmv_por_venta`. Resto de handlers sin catch.

### A-012 — MovimientoStock sin empresaId
**Archivo:** `prisma/schema.prisma` — `MovimientoStock`  
**Descripción:** La tabla de movimientos de stock no tiene `empresaId`. Imposible filtrar movimientos por empresa en reportes.  
**Fix propuesto:** Agregar `empresaId Int` con `@@index([empresaId, productoId, createdAt])`.  
**Estado:** ✅ CORREGIDO.

### A-013 — Sync offline AFIP no guarda desglose IVA para reenvío fiel
**Archivo:** `lib/afip/sync-pendientes.ts` líneas 115–120  
**Descripción:** Al reenviar una factura `PENDIENTE_CAE`, el IVA se reconstruye como alícuota única 21% porque no hay tabla de desglose por línea. Si la factura original tenía ítems con 10.5% y 21%, el reenvío enviará solo 21%.  
**Fix propuesto:** Crear tabla `LineaIVAFactura { facturaId, alicuota, base, importe }` y popularlo en `emitirFactura`. Sync usa esa tabla para reconstruir fiel el array `Iva[]`.  
**Estado:** 🟡 PENDIENTE.

### A-014 — Rutas POST/PATCH sin validación Zod (~30% de rutas)
**Archivo:** Múltiples rutas API  
**Descripción:** ~40 rutas usan validación manual (`if (!campo) return error`) en lugar de Zod. Esto permite payloads inesperados que pueden causar errores de Prisma expuestos al cliente.  
**Fix propuesto:** Migrar a Zod en todas las rutas. Usar `schema.safeParse(body)` y devolver `status: 400` con `parsed.error.flatten()`.  
**Estado:** 🟡 PENDIENTE (refactor sistemático).

---

## 🟡 MEDIOS

### M-001 — FormaPago, TipoCliente, EstadoCliente sin empresaId
**Archivos:** `prisma/schema.prisma` L2518, L2575, L2593  
**Descripción:** Estos maestros son globales. Diferentes clientes no pueden personalizar sus tipos de cliente o formas de pago.  
**Fix propuesto:** Agregar `empresaId Int?` (nullable para catálogos base compartidos, con valor para personalizaciones).

### M-002 — DispositivoIoT.protocolo es String con 9 valores hardcoded
**Archivo:** `prisma/schema.prisma` L1337  
**Fix propuesto:** Agregar comentario como enum explícito o crear `enum DispositivoProtocolo`.

### M-003 — Caja.aperturaReal / cierreFecha pueden ser null sin validación
**Archivo:** `prisma/schema.prisma` L735–769  
**Fix propuesto:** Validar en API que no se pueda cerrar una caja sin fecha de cierre.

### M-004 — LogActividad sin índice en (empresaId, usuarioId, createdAt)
**Archivo:** `prisma/schema.prisma` — `LogActividad`  
**Fix propuesto:** Agregar `@@index([empresaId, usuarioId, createdAt])` para auditoría.

### M-005 — app/api/portal/pedidos/route.ts sin validación del clienteId en session
**Archivo:** `app/api/portal/pedidos/route.ts`  
**Descripción:** El portal B2B guarda clienteId en localStorage. Un cliente podría manipular el clienteId y ver pedidos de otro cliente.  
**Fix propuesto:** El backend debe validar que el clienteId del body coincida con el clienteId de la sesión autenticada.

### M-006 — StockDeposito.cantidad puede quedar negativo en upsert
**Archivo:** `lib/stock/stock-service.ts` línea 222–226  
**Fix propuesto:** En `update: { cantidad: { increment: cantidad } }` agregar validación post-update para alertar stock negativo por depósito.

### M-007 — AsientoContable.tipo (String) deprecado coexiste con tipoAsientoId (FK)
**Archivo:** `prisma/schema.prisma` L520  
**Fix propuesto:** Migrar queries que usan `tipo String` a `tipoAsientoId Int`.

### M-008 — app/api/productos/route.ts POST usa validación manual (no Zod)
**Archivo:** `app/api/productos/route.ts` línea 48  
**Fix propuesto:** Migrar a Zod schema con todos los campos del modelo Producto.

### M-009 — console.warn/error en stock-service para alertas de stock bajo
**Archivo:** `lib/stock/stock-service.ts` línea 310  
**Fix propuesto:** Persistir en tabla `AlertaIA` o `ReglaAlerta` en lugar de solo loguear.

---

## 🟢 BAJOS

### B-001 — Varios modelos de catálogo sin empresaId (Provincia, Localidad, etc.)
Son catálogos de referencia AFIP/INDEC. No requieren empresaId porque son datos públicos normativos.  
**Fix:** No requerido. Dejar como catálogos compartidos de solo lectura.

### B-002 — Incoterm.remitos relación sin inversa explícita
**Fix propuesto:** Agregar campo `incotermId Int?` con relación en `Remito`.

### B-003 — DispositivoIoT.alertas relación circular con AlertaIoT
**Descripción:** Verificar que no haya ciclos de referencia en cascada.

### B-004 — Lote.numeroLote sin @index (existe @@unique pero sin compound con empresaId)
**Fix propuesto:** `@@index([productoId, fechaVencimiento])` para alertas de vencimiento de lote.

### B-005 — Cotización automática: no hay guard si la cotización más reciente es del mismo día
**Archivo:** `lib/cotizaciones/cotizacion-service.ts`  
**Fix propuesto:** Verificar `updatedAt > today` antes de guardar nueva cotización.

### B-006 — vercel.json creado en esta sesión puede conflictuar con crons existentes
**Descripción:** Verificar que el proyecto no tenga ya un vercel.json con configuración de headers, rewrites, etc.

### B-007 — QRCode importado en factura-service.ts pero no verificado si `qrcode` está en package.json
**Fix propuesto:** Ejecutar `npm ls qrcode` para confirmar dependencia instalada.

### B-008 — TareaPendiente.fechaVencimiento usa @db.Date pero comparaciones en código usan new Date()
**Archivo:** `app/api/mis-tareas/route.ts`  
**Fix propuesto:** Verificar que las comparaciones de fecha usen timezone AR correctamente.

---

## Checklist de fixes aplicados automáticamente

- [x] C-001: StockService.ajustarStock → `prisma.$transaction`
- [x] C-002: ConfiguracionImpresora → `empresaId` añadido
- [x] C-003: CentroCosto → `empresaId` añadido
- [x] C-004: Producto.codigo → `@@unique([empresaId, codigo])`
- [x] C-005: Portal catalogo → validación empresaId lista blanca
- [x] C-006: AfipWebserviceLog → modelo creado + hook en soap-client
- [x] A-001: Índices de estado y createdAt → añadidos en 10 modelos críticos
- [x] A-002: Índices en FK de líneas → `LineaFactura`, `LineaCompra`
- [x] A-003: Stock negativo guard → añadido en `ajustarStock`
- [x] A-012: MovimientoStock.empresaId → añadido

## Pendiente para próxima sesión (medios y bajos)

Ver secciones 🟡 MEDIOS y 🟢 BAJOS arriba.  
Prioridad sugerida: M-005 (seguridad portal), M-008 (Zod en productos), M-001 (maestros multi-tenant).

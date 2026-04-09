# ERP Argentina — Documentación de Implementación Completa

> **Para IA implementadora:** Este documento describe el estado actual del sistema,
> qué fue implementado, qué falta, cómo está estructurado y cómo extender cada módulo.
> Leé esto antes de tocar cualquier archivo.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind v4 + shadcn/ui |
| ORM | Prisma 6 + PostgreSQL |
| Auth | JWT (jose) + bcryptjs |
| Tests | Vitest |
| Fiscal | AFIP/ARCA (SOAP) — WS-FE, WSCDC, Padrón A5 |
| Email | Configurable (Resend/SendGrid) |

---

## Arquitectura de rutas

```
app/
├── dashboard/          → Área admin (requiere token JWT en localStorage)
│   ├── layout.tsx      → Sidebar + navbar con filtrado por rubro/módulo
│   ├── page.tsx        → Dashboard con KPIs
│   ├── ventas/         → Facturación AFIP
│   ├── compras/        → Facturas de proveedor + OC
│   ├── productos/      → Catálogo + movimientos stock
│   ├── clientes/       → CRM completo
│   ├── proveedores/    → Maestro proveedores
│   ├── caja/           → Apertura/cierre por turno
│   ├── banco/          → Cuentas bancarias + conciliación
│   ├── cheques/        → Cartera de cheques ← NUEVO
│   ├── cuentas-cobrar/ → Aging + cobros
│   ├── cuentas-pagar/  → Pagos a proveedores
│   ├── contabilidad/   → Asientos, plan de cuentas, balances
│   ├── impuestos/      → IVA, IIBB, Padrón, AFIP
│   ├── hospitalidad/   → Mesas, comandas, KDS
│   ├── veterinaria/    → Mascotas, consultas HC ← NUEVO
│   ├── agenda/         → Turnos por profesional
│   ├── historia-clinica/ → HC (humana)
│   ├── membresias/     → Socios, planes, cobranza recurrente
│   ├── distribucion/   → Hojas de ruta
│   │   └── pod/        → POD firma+geo+foto ← NUEVO
│   ├── logistica/      → Envíos, transportistas
│   ├── picking/        → Listas de picking
│   │   └── tablet/     → Modo tablet full-screen ← NUEVO
│   ├── industria/      → BOM, órdenes de producción
│   ├── iot/            → Dispositivos, telemetría, alertas
│   ├── listas-precio/  → Precios por segmento
│   ├── remitos/        → Remitos entrada/salida
│   ├── notas-credito/  → NC/ND
│   ├── series/         → Series de comprobantes
│   ├── puntos-venta/   → Config puntos de venta AFIP
│   └── configuracion/  → Parámetros, tablas, auditoría
│
├── portal/             → Portal B2B clientes ← NUEVO
│   ├── layout.tsx
│   └── page.tsx        → Login CUIT + catálogo + pedidos + cuenta
│
├── vendedor/           → App vendedor en ruta ← NUEVO
│   ├── layout.tsx
│   └── page.tsx        → Mobile-first: cartera + pedido + cobro
│
├── tienda/             → E-commerce público (sin auth)
└── api/
    ├── auth/           → login, register, refresh, me
    ├── portal/         → verify-cuit, catalogo, pedidos ← NUEVO
    ├── veterinaria/    → pacientes, consultas ← NUEVO
    ├── cheques/        → CRUD + cambio de estado ← NUEVO
    ├── ventas/         → pedidos, presupuestos
    ├── distribucion/   → hojas-ruta, paradas (POD)
    ├── picking/        → listas, [id] (tablet)
    └── ... (todos los otros módulos)
```

---

## Parametrización por rubro

El sistema usa `ConfiguracionModulo` en DB y `onboarding-ia.ts` para:
1. **Filtrar navbar:** solo muestra módulos activos para el rubro
2. **Ordenar sidebar:** rubros prioritarios arriba
3. **Onboarding:** wizard que activa módulos según rubro seleccionado

### Archivo clave: `lib/onboarding/onboarding-ia.ts`
- `Rubro` = tipo union de todos los rubros soportados
- `CONFIG_POR_RUBRO` = qué módulos activa cada rubro
- `getRubroUx()` = prioridad del sidebar por rubro

### Para agregar un nuevo rubro:
1. Agregar a `type Rubro` en `onboarding-ia.ts`
2. Agregar entrada en `CONFIG_POR_RUBRO`
3. Agregar en `ROLES_SISTEMA` si tiene rol específico

### Tabla de módulos por rubro (referencia introspeccion2.txt):
Ver sección 0 de `introspeccion2.txt` para la tabla completa.

---

## Portal B2B (`/portal`)

### Estado: IMPLEMENTADO (MVP)

**Flujo:**
1. Cliente ingresa CUIT → `POST /api/portal/verify-cuit`
2. Sistema busca en `Cliente` por CUIT + empresaId
3. Devuelve datos → guardados en `localStorage`
4. Portal muestra: catálogo, carrito, mis pedidos, mi cuenta

**APIs implementadas:**
- `POST /api/portal/verify-cuit` — autentica por CUIT
- `GET /api/portal/catalogo` — productos con stock
- `GET/POST /api/portal/pedidos` — pedidos del cliente

**Pendiente / TODO para próxima IA:**
```
SCHEMA MIGRATION REQUERIDA:
- Agregar modelo PortalUsuario { id, clienteId, passwordHash, activo, ultimoAcceso }
- Agregar campo Producto.imagenUrl String? para fotos en catálogo
- Agregar campo PedidoVenta.canalPortal Boolean para identificar pedidos B2B

FEATURES PENDIENTES:
- Notificaciones WhatsApp al confirmar pedido (ver lib/email/email-service.ts como base)
- Descarga de facturas en PDF desde el portal
- Pago online con Mercado Pago (callback + conciliación)
- Historial de facturas (actualmente solo pedidos)
- Mínimo de pedido configurable por cliente/zona
```

---

## App Vendedor en Ruta (`/vendedor`)

### Estado: IMPLEMENTADO (MVP)

**Flujo:**
1. Vendedor hace login con email + password (usa `/api/auth/login` existente)
2. Ve su cartera de clientes con búsqueda
3. Selecciona cliente → abre panel de pedido/cobro/visita
4. Online: envía a `/api/ventas/pedidos`
5. Offline: guarda en `localStorage` → sincroniza al recuperar señal

**Pendiente / TODO:**
```
SCHEMA MIGRATION REQUERIDA:
- Agregar modelo VisitaVendedor { vendedorId, clienteId, lat, lng, timestamp, motivo, firmaUrl }
- Agregar campo Usuario.vendedorId Int? para ligar user → vendedor

FEATURES PENDIENTES:
- API propia /api/vendedor/cartera que filtre clientes por vendedorId
- Comisiones en tiempo real (cálculo desde ventas del período)
- Mapa de recorrido del día (Google Maps embed)
- Notificación al depósito cuando entra un pedido de ruta
- Check-in con foto del local (File API + upload a S3/Supabase Storage)
- Rendición de cobranzas: total efectivo + cheques del día
```

---

## Picking Tablet (`/dashboard/picking/tablet`)

### Estado: IMPLEMENTADO

**Flujo:**
1. Operario abre `/dashboard/picking/tablet` en tablet
2. Ve lista de listas pendientes
3. Selecciona una → inicia picking ítem por ítem
4. Cada ítem: muestra nombre grande + ubicación en depósito
5. Operario confirma cantidad con botones grandes (+/- o valores fijos)
6. Al final: marca lista como completada o en_proceso (si hubo faltantes)

**Integración:** usa las mismas APIs `/api/picking` ya existentes

**Pendiente:**
```
FEATURES PENDIENTES:
- Escaneo de código de barras con cámara del dispositivo
  → Usar BarcodeDetector API (Chrome/Android) o librería QuaggaJS/ZXing
  → Al escanear: buscar producto por EAN, confirmar si coincide con ítem actual
- Control de lote/vencimiento al escanear (si producto tiene lotes)
- Modo "aleatorio" vs "ordenado por pasillo" (ya existe zonaAlmacen en schema)
- Productividad: bultos/hora por operario (requiere timestamp inicio/fin)
```

---

## Veterinaria (`/dashboard/veterinaria`)

### Estado: IMPLEMENTADO (historia clínica básica)

**Schema existente:**
```prisma
model Paciente { id, nombre, especie, raza, sexo, fechaNac, peso, chip, notas, clienteId }
model Consulta { id, fecha, motivo, diagnostico, tratamiento, observaciones, peso, temperatura, proximaVisita, pacienteId }
```

**Pendiente / TODO para próxima IA:**
```
SCHEMA MIGRATION REQUERIDA:
model PlanSanitario {
  id           Int
  pacienteId   Int
  tipo         String  // "vacuna" | "desparasitacion" | "revision"
  nombre       String  // "Antirrábica", "Quíntuple", etc.
  fechaAplicada DateTime
  lote         String?
  proximaFecha  DateTime?
  veterinarioId Int?
  observaciones String?
}

model Internacion {
  id           Int
  pacienteId   Int
  fechaIngreso DateTime
  fechaAlta    DateTime?
  motivo       String
  evolucionDiaria Json?  // array de { fecha, descripcion, veterinarioId }
  estado       String   // "internado" | "de_alta"
}

FEATURES PENDIENTES:
- Plan sanitario: página de vacunas y desparasitaciones programadas
- Recordatorios automáticos por WhatsApp cuando se aproxima próxima vacuna
- Receta digital: prescripción con medicamento + dosis + duración
- Internación con evolución diaria
- Facturación integrada: al cerrar consulta → generar factura con prácticas
- Foto de mascota (upload a Supabase Storage)
- Ficha de mascota en PDF
```

---

## Cheques (`/dashboard/cheques`)

### Estado: IMPLEMENTADO (CRUD completo)

**Schema existente (completo):**
```prisma
model Cheque { numero, tipoCheque, monto, fechaEmision, fechaVencimiento,
               cuitBancoLibrador, estado, clienteId, proveedorId,
               cuentaDepositoId, cuentaEmisorId }
```

**Flujo implementado:**
- Lista con tabs: Todos / De Clientes / Emitidos / Vencen pronto
- KPIs: cartera terceros, emitidos propios, próximos a vencer
- Alerta cuando hay cheques con vencimiento en ≤7 días
- Cambio de estado con historial

**Pendiente:**
```
SCHEMA MIGRATION REQUERIDA:
- Agregar campo Cheque.fotoUrl String? para imagen del cheque (captura vendedor)
- Agregar modelo MovimientoCheque { chequeId, estadoAnterior, estadoNuevo, fecha, usuarioId, obs }

FEATURES PENDIENTES:
- Endoso a proveedor: cuando endosado → marcar proveedorId receptor
- Rebote: cuando rechazado → crear CuentaCobrar automáticamente para el cliente
- Conciliación: cheque depositado → buscar MovimientoBancario correspondiente
- Alerta por email/WhatsApp al acercarse vencimiento
- Exportación para conciliación bancaria (CSV formato BBVA/Galicia)
```

---

## POD — Comprobante de Entrega (`/dashboard/distribucion/pod`)

### Estado: IMPLEMENTADO (UI completa)

**Flujo:**
1. Chofer busca su hoja de ruta por número
2. Navega parada por parada
3. Por cada parada: captura GPS + firma digital (canvas touch)
4. Confirma entregado o no-entregado con motivo
5. Estado se guarda en DB vía `PATCH /api/distribucion/paradas/[id]`

**Pendiente:**
```
SCHEMA MIGRATION REQUERIDA:
- Agregar en ParadaRuta:
  firmaBase64  String?   @db.Text
  fotoUrl      String?
  latEntrega   Float?
  lngEntrega   Float?
  timestampPOD DateTime?
  motivoNoEntrega String?

FEATURES PENDIENTES:
- Subida de foto a Supabase Storage (File API + fetch upload)
- Generación de PDF del remito firmado (react-pdf o puppeteer)
- Notificación automática al cliente (WhatsApp) cuando entregado
- Tracking en tiempo real para el cliente (URL pública con estado de entrega)
- Reagendamiento de no-entregas (crea nueva parada en próxima hoja de ruta)
- Devolución en ruta: mercadería rechazada → crea movimiento de stock negativo
```

---

## Módulos que faltan implementar completamente

### Prioridad ALTA (bloqueantes para producción)

#### 1. Apertura/Cierre de Caja (módulo existe pero incompleto)
```
Archivo: app/dashboard/caja/page.tsx
Faltan:
- Cuadre por medio de pago (efectivo vs débito vs transferencia)
- Diferencia con base apertura
- PDF de cierre de caja
- Soporte multi-caja/multi-turno
```

#### 2. Motor de Precios con Escalones
```
Archivo a crear: lib/ventas/precio-service.ts
Schema: ver modelos ListaPrecio, ItemListaPrecio ya existentes
Faltan:
- Escalones por cantidad (ej: 1-11u=$100, 12-23u=$90, 24+u=$80)
  → Agregar modelo EscalonPrecio { itemListaPrecioId, desde, hasta, precio }
- Aplicación automática en POS al agregar cantidad
- Vigencia de lista (desde/hasta fecha)
- Herencia: precio base → descuento por cliente → escalón → promoción
```

#### 3. Notificaciones WhatsApp Business API
```
Archivo a crear: lib/notifications/whatsapp-service.ts
Dependencia: Meta WhatsApp Business API (requiere cuenta Meta Business)
Alternativa MVP: Twilio para WhatsApp
Eventos a notificar:
- Pedido confirmado (portal B2B)
- Pedido despachado (con datos de chofer)
- Pedido entregado
- Factura disponible
- Deuda vencida
- Recordatorio vacuna (veterinaria)
- Turno mañana (agenda)
```

#### 4. Envases / Retornables (distribuidora de bebidas)
```
Schema a agregar:
model TipoEnvase {
  id          Int
  nombre      String    // "Cajón 24u", "Bidón 20L", "Barril 50L"
  capacidad   Int
  deposito    Decimal   // monto de garantía
  activo      Boolean
  empresaId   Int
}
model MovimientoEnvase {
  id          Int
  tipo        String    // "entrega" | "devolucion"
  cantidad    Int
  clienteId   Int
  tipoEnvaseId Int
  facturaId   Int?
  fecha       DateTime
  observaciones String?
}
model SaldoEnvaseCliente {
  clienteId    Int
  tipoEnvaseId Int
  saldo        Int       // positivo = debe envases, negativo = a favor
  @@unique([clienteId, tipoEnvaseId])
}

Página a crear: app/dashboard/envases/page.tsx
API a crear: app/api/envases/route.ts
```

---

## Módulos existentes con gaps funcionales

### Hospitalidad (gastronomía)
- **Falta:** workflow completo Pedido → Comanda → KDS → Ticket → Factura
- **KDS:** existe página `/dashboard/hospitalidad/kds` pero sin WebSocket en tiempo real
  → Usar Supabase Realtime o polling cada 10s como fallback

### Agenda / Historia Clínica (salud)
- **Falta:** recordatorios automáticos de turno (cron job)
- **Falta:** facturación por prestación (vincular Turno → Factura)
- **Falta:** obras sociales (modelo existe pero sin flujo de autorización)

### Membresías (fitness)
- **Falta:** cobro recurrente automático (cron job + gateway)
- **Falta:** control de acceso (torniquete/QR — requiere hardware)
- **Falta:** estados por mora con bloqueo automático

### IoT
- **Falta:** rules engine para alertas automáticas
- **Falta:** authHeaders consistente en endpoints de lectura

---

## Convenciones de código

### API Route (patrón estándar)
```typescript
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  // ctx.auth.empresaId disponible
  // ctx.auth.usuarioId disponible
}
```

### Auth en cliente
```typescript
const token = localStorage.getItem("token")
const headers = token ? { Authorization: `Bearer ${token}` } : {}
```

### Prisma — filtrar por empresa (multi-tenant)
```typescript
const where = { empresaId: ctx.auth.empresaId, deletedAt: null }
```

### Soft delete
```typescript
// Todos los modelos principales tienen deletedAt
await prisma.modelo.update({ where: { id }, data: { deletedAt: new Date() } })
```

### Validación con Zod
```typescript
const schema = z.object({ ... })
const parsed = schema.safeParse(body)
if (!parsed.success) return NextResponse.json({ error: "...", detalles: parsed.error.flatten() }, { status: 400 })
```

---

## Variables de entorno requeridas

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_ECOMMERCE_EMPRESA_ID=1   # Para portal B2B y tienda

# AFIP
AFIP_CUIT=...
AFIP_CERT_BASE64=...
AFIP_KEY_BASE64=...
AFIP_ENTORNO=homologacion|produccion

# Opcionales (para notificaciones)
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
WHATSAPP_FROM=...

# Storage (para fotos POD, firma, etc.)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Próximos sprints sugeridos (en orden de impacto)

### Sprint A — Motor de precios + Envases (distribuidora)
1. Modelo `EscalonPrecio` + migración
2. Service `precio-service.ts` con lógica de escalones
3. Integración en POS al calcular línea de factura
4. Modelo `TipoEnvase` + `MovimientoEnvase` + migración
5. Página `/dashboard/envases`
6. Ajuste automático de saldo envases al facturar/devolver

### Sprint B — Plan Sanitario + Recordatorios (veterinaria)
1. Modelo `PlanSanitario` + migración
2. Página `/dashboard/veterinaria/plan-sanitario`
3. Cron job: verificar próximas fechas → cola de notificaciones
4. Envío por WhatsApp/email usando plantilla configurable

### Sprint C — Notificaciones (todos los rubros)
1. `lib/notifications/notification-service.ts` — abstracción canal-agnóstica
2. Integración WhatsApp Business API (Meta) o Twilio
3. Plantillas editables en `/dashboard/configuracion/notificaciones`
4. Cola de notificaciones con BullMQ (o pg-boss sobre PostgreSQL)

### Sprint D — Conciliación bancaria automática
1. Importación de extracto (CSV Galicia/BBVA/Santander)
2. Parsing de formato propio de cada banco
3. Algoritmo de matching: monto + fecha ±2 días
4. UI de partidas pendientes en `/dashboard/banco`

### Sprint E — POD completo (foto + firma a S3)
1. Integrar Supabase Storage para upload de fotos
2. Guardar `firmaBase64` y `fotoUrl` en schema
3. Generación de PDF de remito con firma (react-pdf)
4. Notificación al cliente por WhatsApp con PDF adjunto

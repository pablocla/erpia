# 🔌 METASWARM — API GATEWAY PARA AGENTES
## Especificación Técnica: `/api/v1/agents/*`

> **Propósito:** Exponer los módulos de ClavERP de forma segura y controlada para que los agentes IA del campus puedan leer y escribir datos sin tocar la lógica interna del ERP.
>
> **Principio:** El Gateway es la **única puerta de entrada** de los agentes al back-office. Ningún agente llama directamente a `/api/facturas` o a Prisma — siempre pasa por aquí.

---

## 1. AUTENTICACIÓN

Todos los endpoints requieren un header:
```
Authorization: Bearer AGENT_API_KEY_<uuid>
X-Agent-ID: <agente-id>        (ej: "leo-vendedor", "clara-afip", "guardian-caja")
X-Floor-ID: <piso-id>          (ej: "edificio-a-piso-1")
X-Empresa-ID: <empresaId>      (UUID del tenant)
```

Las API Keys se generan desde `/dashboard/agentes` y se almacenan cifradas en la tabla `AgentApiKey`.

---

## 2. ENDPOINTS POR PISO

### 🏢 PISO 1 — Ventas & Atención al Cliente

#### `GET /api/v1/agents/catalogo`
Devuelve productos activos con precio de lista y stock disponible.
```json
{
  "productos": [
    { "id": "prod_123", "nombre": "Aceite 10W40 1L", "precio": 4200, "stock": 15, "unidad": "UN" }
  ]
}
```
**Permisos:** READ-ONLY · Permite: `leo-vendedor`, `cobrador-digital`, `gestor-tienda`

#### `GET /api/v1/agents/cliente?cuit={cuit}` 
Busca cliente por CUIT o teléfono. Devuelve datos fiscales y condición IVA.
```json
{
  "id": "cli_456", "razonSocial": "Juan Pérez", "condicionIVA": "CONSUMIDOR_FINAL",
  "cuit": "20-30456789-1", "saldoCxC": 12500, "limiteFiado": 50000
}
```
**Permisos:** READ-ONLY · Permite: `leo-vendedor`, `cobrador-cxc`, `facturador-afip`

#### `POST /api/v1/agents/presupuesto`
Crea un presupuesto y devuelve el PDF en base64.
```json
// Request
{
  "clienteId": "cli_456", "items": [{"productoId": "prod_123", "cantidad": 2}],
  "descuento": 0, "notas": "Cotización por WhatsApp"
}
// Response
{ "presupuestoId": "pre_789", "pdfBase64": "JVBERi0...", "total": 8400 }
```
**Permisos:** WRITE · Permite: `leo-vendedor`

#### `POST /api/v1/agents/venta`
Registra una venta completa y dispara el flujo de facturación.
```json
// Request
{
  "clienteId": "cli_456", "items": [...], "medioPago": "MERCADOPAGO",
  "emitirFactura": true, "tipoFactura": "B"
}
// Response  
{ "ventaId": "ven_001", "cae": "71234567891234", "facturaUrl": "/api/facturas/ven_001/pdf" }
```
**Permisos:** WRITE · Permite: `facturador-afip` (único con clave AFIP)

#### `POST /api/v1/agents/link-pago`
Genera link de pago MercadoPago y lo asocia a una venta o deuda.
```json
// Request
{ "monto": 8400, "concepto": "Pedido #1234", "ventaId": "ven_001", "clienteId": "cli_456" }
// Response
{ "linkPago": "https://mpago.la/xyz", "preferenceId": "mp_pref_123", "expira": "2026-08-30T23:59" }
```
**Permisos:** WRITE · Permite: `cobrador-digital`, `cobrador-cxc`

---

### 🏢 PISO 2 — AFIP & Compliance

#### `GET /api/v1/agents/facturas/pendientes-cae`
Lista comprobantes emitidos sin CAE (cola de reintentos).
```json
{
  "pendientes": [{ "facturaId": "fac_555", "intentos": 2, "ultimoError": "AFIP timeout", "monto": 15000 }]
}
```
**Permisos:** READ · Permite: `clara-afip`

#### `POST /api/v1/agents/facturas/{facturaId}/reintentar-cae`
Reintenta obtener el CAE para una factura específica.
```json
// Response
{ "success": true, "cae": "71234567891235", "vencimientoCae": "2026-09-08" }
```
**Permisos:** EXEC · Permite: `clara-afip` (único autorizado)

#### `POST /api/v1/agents/facturas/{facturaId}/activar-caea`
Activa contingencia CAEA para una factura cuando AFIP está caído.
```json
// Response
{ "success": true, "caea": "71234567891240", "rangoDesde": 1, "rangoHasta": 10 }
```
**Permisos:** EXEC · Permite: `clara-afip` (único autorizado)

#### `GET /api/v1/agents/libro-iva?periodo={YYYY-MM}`
Genera el Libro IVA del período en formato ZIP (TXT + PDF).
```json
{ "zipBase64": "UEsDBAoAAA...", "registros": 248, "totalIVA": 125400 }
```
**Permisos:** READ · Permite: `contador-bot`

---

### 🏢 PISO 3 — Caja & Cuentas a Cobrar

#### `GET /api/v1/agents/caja/estado`
Estado actual de la caja: si está abierta, saldo teórico, última actividad.
```json
{
  "cajaId": "caj_01", "estado": "ABIERTA", "saldoTeorico": 48500,
  "aperturaHace": "6h", "turno": "MAÑANA", "cajero": "María García"
}
```
**Permisos:** READ · Permite: `guardian-caja`

#### `POST /api/v1/agents/caja/alerta`
Registra y notifica una alerta de caja (anulación sospechosa, diferencia en arqueo).
```json
// Request
{ "tipo": "ANULACION_SOSPECHOSA", "monto": 3500, "cajeroId": "usr_07", "ticketId": "tick_999" }
// Response
{ "alertaId": "alr_123", "notificado": true, "canal": "TELEGRAM" }
```
**Permisos:** WRITE · Permite: `guardian-caja`

#### `GET /api/v1/agents/cxc/vencidas`
Lista de cuentas a cobrar vencidas con datos del cliente para cobranza.
```json
{
  "vencidas": [
    { "clienteId": "cli_111", "nombre": "Almacén El Sol", "deuda": 25000,
      "vencimiento": "2026-08-15", "telefono": "+5491145678901", "intentosCobranza": 1 }
  ]
}
```
**Permisos:** READ · Permite: `cobrador-cxc`

#### `POST /api/v1/agents/cxc/{cxcId}/registrar-gestion`
Registra un intento de cobranza (WhatsApp enviado, llamada, etc).
```json
// Request
{ "canal": "WHATSAPP", "mensaje": "Estimado cliente, su deuda de $25.000...", "linkPago": "https://mpago.la/abc" }
// Response
{ "gestionId": "ges_555", "proximoIntento": "2026-09-01T10:00" }
```
**Permisos:** WRITE · Permite: `cobrador-cxc`

---

### 🏢 PISO 4 — Depósito & Stock

#### `GET /api/v1/agents/stock/bajo-minimo`
Lista de productos con stock menor al mínimo configurado.
```json
{
  "productos": [
    { "productoId": "prod_200", "nombre": "Harina 000 x50kg", "stockActual": 2,
      "stockMinimo": 5, "proveedorId": "prov_10", "ultimoPrecioCompra": 8500 }
  ]
}
```
**Permisos:** READ · Permite: `ramiro-reponedor`

#### `POST /api/v1/agents/compras/crear-borrador`
Crea una Orden de Compra borrador para que el dueño apruebe.
```json
// Request
{ "proveedorId": "prov_10", "items": [{"productoId": "prod_200", "cantidad": 10, "precio": 8500}] }
// Response
{ "ocId": "oc_888", "estado": "BORRADOR", "total": 85000, "urlAprobacion": "/dashboard/compras/oc_888" }
```
**Permisos:** WRITE · Permite: `ramiro-reponedor`

#### `POST /api/v1/agents/stock/registrar-ocr`
Carga una factura de compra de proveedor procesada por OCR.
```json
// Request
{ "proveedorId": "prov_10", "items": [...], "facturaNumero": "0001-00001234",
  "fecha": "2026-08-29", "total": 125400, "confianzaOCR": 0.94 }
// Response
{ "compraId": "comp_777", "estado": "PENDIENTE_REVISION", "requiereRevision": false }
```
**Permisos:** WRITE · Permite: `ocr-facturas`

---

## 3. WEBHOOK DE EVENTOS SALIENTES (ERP → Agentes)

El ERP notifica a MetaSwarm cuando ocurren eventos críticos:

```
POST https://campus.claver.com.ar/api/events/erp-hook
Authorization: Bearer CAMPUS_WEBHOOK_SECRET
```

```json
{
  "evento": "STOCK_BAJO",
  "empresaId": "emp_abc",
  "timestamp": "2026-08-29T14:32:00-03:00",
  "payload": { "productoId": "prod_200", "stockActual": 2, "stockMinimo": 5 }
}
```

**Eventos que disparan acciones automáticas de agentes:**
| Evento NOP | Agente que lo recibe | Acción automática |
|:---|:---|:---|
| `STOCK_BAJO` | `ramiro-reponedor` | Crea OC borrador + notifica Telegram al dueño |
| `PAGO_MP_RECIBIDO` | `cobrador-digital` | Imputa CxC, genera recibo, envía WhatsApp al cliente |
| `CAE_FALLIDO` | `clara-afip` | Reintenta 3 veces → activa CAEA si sigue fallando |
| `CAJA_ABIERTA_+12H` | `guardian-caja` | Alerta Telegram al dueño con botón de cierre rápido |
| `VENTA_EMITIDA` | `facturador-afip` | Envía factura PDF por WhatsApp/email al cliente |
| `TURNO_PROXIMO_24H` | `sofia-agenda` | WhatsApp recordatorio al cliente |
| `ANULACION_SOSPECHOSA` | `guardian-caja` | Alerta inmediata Telegram con monto + cajero |

---

## 4. MODELO DE DATOS: AgentApiKey

```prisma
model AgentApiKey {
  id          String   @id @default(cuid())
  empresaId   String
  agentId     String   // "leo-vendedor", "clara-afip", etc.
  floorId     String   // "edificio-a-piso-1"
  keyHash     String   @unique // bcrypt del API key
  permisos    String[] // ["READ_CATALOGO", "WRITE_PRESUPUESTO"]
  activa      Boolean  @default(true)
  creadaEn    DateTime @default(now())
  ultimoUso   DateTime?
  empresa     Empresa  @relation(fields: [empresaId], references: [id])
  
  @@index([empresaId, agentId])
}
```

---

## 5. MIDDLEWARE DE AUTORIZACIÓN

```typescript
// lib/agents/agent-guard.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAgentKey } from "@/lib/agents/auth"

export async function getAgentContext(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const agentId = req.headers.get("x-agent-id")
  const floorId = req.headers.get("x-floor-id")
  const empresaId = req.headers.get("x-empresa-id")

  if (!authHeader || !agentId || !empresaId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const apiKey = authHeader.replace("Bearer ", "")
  const agentKey = await verifyAgentKey(apiKey, agentId, empresaId)

  if (!agentKey) {
    return { ok: false, response: NextResponse.json({ error: "Invalid agent key" }, { status: 403 }) }
  }

  return { ok: true, agentId, floorId, empresaId, permisos: agentKey.permisos }
}

// Verificar permiso específico
export function requirePermiso(permisos: string[], permiso: string) {
  if (!permisos.includes(permiso)) {
    return NextResponse.json({ error: `Permiso requerido: ${permiso}` }, { status: 403 })
  }
  return null
}
```

---

## 6. RATE LIMITING POR AGENTE

Para evitar runaway loops y costos descontrolados:

```typescript
// lib/agents/rate-limiter.ts

const LIMITES = {
  "leo-vendedor":     { requestsPorMinuto: 30, requestsPorHora: 500 },
  "clara-afip":       { requestsPorMinuto: 10, requestsPorHora: 100 }, // AFIP tiene límites propios
  "guardian-caja":    { requestsPorMinuto: 60, requestsPorHora: 1000 },
  "ramiro-reponedor": { requestsPorMinuto: 20, requestsPorHora: 200 },
  "cobrador-cxc":     { requestsPorMinuto: 15, requestsPorHora: 150 },
}
```

Si un agente supera el límite:
1. Se bloquea por 5 minutos.
2. Se envía alerta al Telegram del dueño.
3. Se registra el incidente en el log de auditoría.

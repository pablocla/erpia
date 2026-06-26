# 11 — Libreta Fiado (almacenes de barrio)

> SKU: `pos.fiado_barrio` · Lema: *Fiá con límite. Que el otro se entere.*

## Flujo funcional

```mermaid
flowchart LR
  A[App Store: pos.fiado_barrio] --> B[Provision REGION_AUTO]
  B --> C[/dashboard/fiado config]
  C --> D[Alta cliente + límite]
  D --> E[POS: Cta. Cte.]
  E --> F{Límite OK?}
  F -->|Sí| G[Venta + email fiador]
  F -->|No| H[Bloqueo + alerta]
  G --> I[Opcional: WA + link MP]
```

## Pasos

1. Activar SKU en App Store (o bundle `pool-almacen-barrio`)
2. Alta cliente en `/dashboard/fiado` o ABM clientes → sección Libreta Fiado
3. POS → pago **Cta. Cte.** → valida límite → email a fiador/dueño

## Convención saldo

`saldoCuentaCorriente < 0` = deuda del cliente.

## APIs

- `GET /api/fiado/deudores`
- `GET /api/fiado/resumen`
- `POST /api/fiado/clientes-rapido`
- `GET /api/fiado/config` — email dueño, límite obligatorio, WA
- `PATCH /api/fiado/config`

## Fase 2 (implementado)

- Link MercadoPago en email (`lib/fiado/fiado-pago-link.ts`)
- WhatsApp al cliente si `com.whatsapp` activo (`lib/fiado/fiado-whatsapp.ts`)
- Config en `/dashboard/fiado` → botón Configuración
- Provision: `activarLibretaFiado()` al comprar SKU
- Gate POS: requiere suscripción `pos.fiado_barrio`

## Código

- `lib/fiado/fiado-service.ts`
- `lib/fiado/fiado-provision.ts`
- `app/api/pos/venta/route.ts` (validación + notificación)
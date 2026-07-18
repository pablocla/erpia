# Consorcios + Inmobiliaria MVP — implementado

> 2026-07-18

## Flujo consorcios (operativo)

```
Edificio → UF + residente → Gastos del período → Liquidar
  → Factura interna/B + CxC + saldo cliente (deuda)
  → Morosos: Cobrar (recibo) | WA | CxC
  → PDF liquidación
```

| Acción | UI / API |
|--------|----------|
| Alta edificio / UF / gasto | `/dashboard/nicho/consorcios` |
| Liquidar | POST `/api/consorcios/[id]` action liquidar |
| PDF | GET `/api/consorcios/[id]/liquidacion/pdf?periodo=` |
| Morosos | GET `/api/consorcios/morosos` |
| Avisar WA | POST morosos `{ expensaId, action: "avisar" }` |
| Cobrar | POST morosos `{ expensaId, action: "cobrar" }` |

## Flujo inmobiliaria (operativo)

```
Propiedad → Contrato (inquilino) → Facturar alquileres del mes
  → Factura interna + CxC + saldo cliente
  → Cuentas a cobrar / cobro estándar
  → Cron vencimientos 30d (WA)
```

| Acción | UI / API |
|--------|----------|
| Cartera / contratos | `/dashboard/nicho/inmobiliaria` |
| Facturar mes | POST `/api/inmobiliaria/facturar-mes` |
| Preview pendientes | GET `/api/inmobiliaria/facturar-mes` |

## Convención saldo

`Cliente.saldoCuentaCorriente < 0` = deuda (igual que fiado).  
Al liquidar expensas o generar alquiler se hace **decrement** del saldo.

## Demo

- Rubro `consorcios_admin` / `inmobiliaria` → seed edificio + gastos  
- Rubro `inmobiliaria` → además 2 propiedades + 1 contrato activo  

## Links Mercado Pago (deudores)

Requiere `MercadoPagoConfig` activa con checkout **o** SKU `fiscal.clavpay_link`.

| Acción | Endpoint |
|--------|----------|
| Link expensa | POST `/api/consorcios/morosos` `{ expensaId, action: "link_pago" }` |
| WA expensa (+ link) | POST morosos `{ expensaId, action: "avisar" }` |
| Listar alquileres CxC | GET `/api/inmobiliaria/cobrar-alquiler` |
| Cobrar / link / WA alquiler | POST `/api/inmobiliaria/cobrar-alquiler` `{ cuentaCobrarId, action }` |

External ref MP: `cxc-{id}` o `fac-{id}` → webhook aplica recibo (`aplicar-pago-deudor`).

## Fuera de este MVP

Portal inquilino, OT mantenimiento, sync portales, ICL/IPC, comisiones.

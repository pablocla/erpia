# WMS Light — implementación en Claver

> Implementación del gap analysis [`wms-gap-analysis-claver-vs-sap-totvs-meli.md`](./wms-gap-analysis-claver-vs-sap-totvs-meli.md).

## Qué se implementó

| Capacidad | Código |
|-----------|--------|
| Zonas + ubicaciones (bins) + seed grilla | `lib/wms/ubicacion-service.ts` |
| Stock por bin + move + sync depósito | `lib/wms/stock-ubicacion-service.ts` |
| Putaway dirigido + completar | `lib/wms/putaway-service.ts` |
| Picking FEFO + dirigido + RF scan | `lib/wms/pick-service.ts`, `fefo.ts` |
| Waves / olas | `lib/wms/wave-service.ts` |
| Packing + bultos | `lib/wms/packing-service.ts` |
| HU / LPN | `lib/wms/hu-service.ts` |
| ASN + recepción ciega | `lib/wms/asn-service.ts` |
| Slotting ABC + reposición | `lib/wms/slotting-service.ts` |
| Conteo cíclico ABC | `lib/wms/ciclo-conteo-service.ts` |
| APIs | `app/api/wms/*` |
| UI centro + RF | `/dashboard/wms`, `/dashboard/wms/rf` |
| Integración picking ERP | `lib/picking/picking-service.ts` |

## Schema Prisma (nuevos modelos)

`ZonaAlmacen`, `UbicacionAlmacen`, `StockUbicacion`, `MovimientoUbicacion`, `HandlingUnit`, `TareaWms`, `OlaPicking`, `PackingList`, `LineaPacking`, `PackingBulto`, `AsnRecepcion`, `LineaAsn`, `ConteoCiclico`, `LineaConteoCiclico`.

Campos extra: `Producto.ubicacionPreferidaId`, `Producto.claseAbc`, `LineaPicking.ubicacionId/loteId/ordenPath`, `ListaPicking.olaPickingId`.

## Migración

```bash
npx prisma db push
# o
npx prisma migrate dev --name wms_light
npx prisma generate
```

## Flujo mínimo de prueba

1. Ir a `/dashboard/wms`, elegir depósito → **Generar grilla de bins**.
2. `POST /api/wms/stock` con `action: "ajustar"` para poner stock en un bin.
3. `POST /api/wms/pick` `{ action: "generar", pedidoVentaId }` → lista con path FEFO.
4. `/dashboard/wms/rf` → siguiente tarea → scan ubicación + SKU → confirmar.
5. Opcional: ASN → recibir → putaway; packing desde pedido; ola con varios pedidos.

## APIs

| Ruta | Métodos |
|------|---------|
| `/api/wms/zonas` | GET, POST |
| `/api/wms/ubicaciones` | GET, POST (+ `action: seed`) |
| `/api/wms/stock` | GET, POST (`ajustar` / `mover`) |
| `/api/wms/putaway` | POST (`sugerir` / `crear` / `completar`) |
| `/api/wms/pick` | POST (`generar` / `confirmar_linea`) |
| `/api/wms/tareas` | GET |
| `/api/wms/waves` | GET, POST (`crear` / `liberar`) |
| `/api/wms/packing` | GET, POST |
| `/api/wms/hu` | GET, POST |
| `/api/wms/asn` | GET, POST |
| `/api/wms/rf` | POST |
| `/api/wms/slotting` | POST |
| `/api/wms/conteo` | GET, POST |

## Tests

```bash
npx vitest run __tests__/wms/fefo.test.ts
```

## Límites honestos (vs SAP EWM)

- No hay labor management enterprise ni yard.
- Slotting es ABC simple (no ML).
- Path es `ordenPath` numérico, no grafo de pasillos 3D.
- Unique de stock con `loteId`/`huId` nulos depende del motor SQL.

Eso cubre **WMS light vendible a distribuidora PyME**, no paridad EWM.

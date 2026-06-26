# 14 — Pack Almacén Rosario

> Bundle: `pool-almacen-rosario` · Lema: *Margen, merma y caja para el barrio.*  
> Fuente canónica código: `lib/almacen-rosario/modulos-catalog.ts`  
> Runbooks: `lib/marketplace/almacen-rosario-runbooks.ts`  
> UI tenant: `/dashboard/almacen` · Guía: `/dashboard/almacen/guia` · API módulos: `GET /api/almacen-rosario/modulos`

## Principio de visibilidad

**Todos los módulos son visibles** en panel, guía y App Store. Si el SKU no está contratado:

- La UI se muestra **bloqueada** (overlay + botón Activar)
- Las APIs responden **403** (`SKU no activo`)
- No se ocultan menús ni documentación

## Flujo comercial e implementación

```mermaid
flowchart TB
  subgraph comercial [Comercial]
    A[Cliente ve pack en App Store]
    B[Checkout pool-almacen-rosario o SKU suelto]
  end
  subgraph provision [Provision REGION_AUTO]
    C[provision-service]
    D[activarProducto + product-hooks]
    E[activators.ts por SKU]
  end
  subgraph uso [Uso diario]
    F[Panel /dashboard/almacen]
    G[POS /dashboard/pos]
    H[APIs /api/pos/almacen/*]
  end
  A --> B --> C --> D --> E
  E --> F
  E --> G
  F --> H
  G --> H
```

## Bundle

| Campo | Valor |
|-------|-------|
| ID | `pool-almacen-rosario` |
| Precio | $34.900 ARS/mes |
| SKUs | 18 módulos POS + `pos.fiado_barrio` + `intang.guardian_pos` (add-ons relacionados) |
| autoCertLevel | REGION_AUTO por SKU |

## Activación (cliente)

1. `/dashboard/apps` → Pack **Almacén Rosario** o SKU individual → **Obtener App**
2. Polling job hasta badge **Instalado**
3. `/dashboard/almacen` → verificar módulo **Activo**
4. `/dashboard/almacen/guia` → seguir pasos del módulo

## Torre analista

Cada SKU tiene runbook dedicado (no plantilla genérica). Checklist típico:

1. Confirmar hook `onActivate` en logs (`sistema_log` categoría `marketplace`)
2. Probar 1 flujo de uso documentado abajo
3. Cerrar tarea en Claver Cloud si hubo SEMI_AUTO

---

## Módulos y diagramas de flujo

### margen-guard — `pos.margen_guard`

```mermaid
flowchart LR
  A[Costo lista sube] --> B[POS agrega producto]
  B --> C{Margen >= mínimo?}
  C -->|No| D[Alerta / precio sugerido]
  C -->|Sí| E[Venta]
```

- **API:** `POST /api/pos/almacen/evaluar-producto`
- **Superficie:** automático en POS

---

### zero-waste — `pos.zero_waste`

```mermaid
flowchart LR
  A[Producto vence pronto] --> B[Cron + panel]
  B --> C[Descuento sugerido]
  C --> D[Venta con promo]
```

- **API:** `GET /api/almacen-rosario/resumen`
- **Superficie:** panel Almacén

---

### stock-cero — `pos.stock_cero_alert`

```mermaid
flowchart LR
  A[Venta con stock 0] --> B[Factura OK]
  B --> C[Evento registrado]
  C --> D[Resumen dueño]
```

---

### promos-pago — `pos.promos_pago`

```mermaid
flowchart LR
  A[Calendario promo] --> B[GET promos-hoy]
  B --> C[Banner en cobro POS]
  C --> D[Cajero ofrece medio]
```

- **API:** `GET /api/pos/almacen/promos-hoy`

---

### lista-distribuidora — `pos.lista_distribuidora`

```mermaid
flowchart LR
  A[CSV distribuidora] --> B[Preview match]
  B --> C[Aplicar precios]
  C --> D[POS actualizado]
```

- **API:** `POST /api/almacen-rosario/importar-lista`

---

### panico-vecinal — `pos.panico_vecinal`

```mermaid
flowchart LR
  A[Alt+F12 3s en POS] --> B[POST panico]
  B --> C[WhatsApp vecinos]
```

- **Requiere:** `com.whatsapp` activo
- **API:** `POST /api/pos/almacen/panico`

---

### envases-gaseosas — `pos.envases_gaseosas`

```mermaid
flowchart LR
  A[POS Envases] --> B{Tipo?}
  B -->|Entrega| C[Depósito ingreso caja]
  B -->|Retorno| D[Depósito egreso caja]
  C --> E[Saldo cliente +]
  D --> F[Saldo cliente -]
```

- **API:** `POST /api/pos/envases/movimiento` · `GET /api/pos/envases/saldo`

---

### vale-dinero — `pos.vale_dinero`

```mermaid
flowchart LR
  A[Emitir VALE-NNNNNN] --> B[Ticket impreso]
  B --> C[POS medio Vale]
  C --> D[Validar saldo]
  D --> E[Cobro parcial/total]
```

- **API:** `POST /api/vales` · `POST /api/vales/validar` · integrado en `POST /api/pos/venta`

---

### recargas — `pos.recargas_servicios`

```mermaid
flowchart LR
  A[SUBE / celular] --> B[Caja abierta]
  B --> C[Ingreso caja]
```

- **API:** `POST /api/pos/almacen/retail` `{ modulo: "recargas" }`

---

### balanza-peso — `pos.balanza_peso`

```mermaid
flowchart LR
  A[Peso kg] --> B[Precio/kg]
  B --> C[Línea carrito]
```

- **API:** `POST /api/pos/almacen/retail` `{ modulo: "balanza" }`

---

### promos-cantidad — `pos.promos_cantidad`

```mermaid
flowchart LR
  A[Cantidad N] --> B{Regla 2x1/3x2?}
  B -->|Sí| C[Unidades gratis]
  B -->|No| D[Precio pleno]
```

- **API:** `GET /api/pos/almacen/retail?q=promos_cantidad`

---

### ticket-regalo — `pos.ticket_regalo`

```mermaid
flowchart LR
  A[Devolución] --> B[REGALO-NNNNNN]
  B --> C[Cobro en POS]
```

- **API:** `POST /api/pos/almacen/retail` `{ modulo: "ticket_regalo" }`

---

### pedido-distribuidora — `pos.pedido_distribuidora`

```mermaid
flowchart LR
  A[JIT urgencias] --> B[OC borrador]
  B --> C[Proveedor]
```

- **API:** `POST /api/pos/almacen/retail` `{ modulo: "pedido_distribuidora" }`

---

### mermas-roturas — `pos.mermas_roturas`

```mermaid
flowchart LR
  A[Rotura/vencimiento] --> B[Registro merma]
  B --> C[Ajuste stock]
```

- **API:** `POST /api/pos/almacen/retail` `{ modulo: "merma" }`

---

### arqueo-ciego — `pos.arqueo_ciego`

```mermaid
flowchart LR
  A[Cajero cuenta] --> B[Declara montos]
  B --> C[Sistema compara]
  C --> D[Semáforo diferencia]
```

- **API:** `GET/POST /api/pos/almacen/retail` módulo `arqueo_ciego`

---

### lista-mayorista — `pos.lista_mayorista_pos`

```mermaid
flowchart LR
  A[Lista Mayorista] --> B[Toggle POS]
  B --> C[Precio bulto]
```

- **API:** `GET /api/pos/almacen/retail?q=lista_mayorista`

---

### cheques-cartera — `pos.cheques_cartera`

```mermaid
flowchart LR
  A[Cheque recibido] --> B[Cartera]
  B --> C[Alerta vencimiento]
```

- **API:** `POST /api/pos/almacen/retail` `{ modulo: "cheque" }`

---

### inventario-express — `pos.inventario_express`

```mermaid
flowchart LR
  A[Iniciar TI] --> B[Conteo categoría]
  B --> C[Procesar ajustes]
```

- **API:** `POST /api/pos/almacen/retail` módulos `inventario_*`

---

## API retail unificada

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/almacen-rosario/modulos` | Lista todos los módulos + estado activo |
| GET | `/api/pos/almacen/retail` | `?q=` recargas, promos, lista, arqueo, cheques |
| POST | `/api/pos/almacen/retail` | `{ modulo: ... }` ver schema en route |

## Postventa

| Señal | Acción |
|-------|--------|
| Módulo activo pero 403 | Re-provisionar SKU / revisar `canUseSku` |
| Caja cerrada en módulos caja | Mensaje estándar "Abrí la caja" |
| Sin proveedor (pedido distribuidora) | Alta proveedor en ABM |

## Referencias

- [07 — Bundles](./07-bundles-comerciales.md)
- [06 — Runbooks](./06-runbooks-por-producto.md)
- [11 — Libreta Fiado](./11-libreta-fiado-almacen.md)
- [12 — Enganches](./12-enganches-comerciales.md)
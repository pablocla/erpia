# Rubro: Distribuidora de Gaseosas / Cervezas (Rosario)

## Módulos activos

```
ventas, compras, stock (multi-depósito + lotes + vencimientos),
clientes (CRM + cuenta corriente), portal-b2b, vendedor-ruta,
picking-tablet, logistica (hojas de ruta + POD), distribucion,
cuentas-cobrar, cheques, facturacion-afip, cuentas-pagar,
iot (cadena de frío), reportes
```

## Flujos end-to-end (estado actual / pendientes)

### 1. Vendedor visita kiosco → pedido → picking → entrega
```
✅ Vendedor hace login en /vendedor
✅ Ve cartera de clientes
✅ Toma pedido offline (guardado en localStorage)
✅ Al recuperar señal → sincroniza a /api/ventas/pedidos
⏳ Pedido aparece en cola de picking → FALTA: webhook/event que notifique al depósito
✅ Depósito abre /dashboard/picking/tablet
✅ Lista generada (hoy manual, FALTA: auto-generación desde pedido confirmado)
⏳ Al completar picking → FALTA: auto-crear remito de salida
⏳ Asignar a hoja de ruta → FALTA: auto-asignación por zona
✅ Chofer abre /dashboard/distribucion/pod
✅ Firma digital + geo capturados
⏳ FALTA: foto del remito físico firmado (Supabase Storage)
⏳ FALTA: notificación WhatsApp al cliente "tu pedido fue entregado"
```

### 2. Kiosco hace su propio pedido por portal
```
✅ Kiosco abre /portal con su CUIT
✅ Ve catálogo con precios
✅ Hace pedido → POST /api/portal/pedidos
✅ Ve historial de pedidos y estado
✅ Ve su saldo de cuenta corriente
⏳ FALTA: pago online (Mercado Pago)
⏳ FALTA: descarga de facturas PDF
⏳ FALTA: notificaciones push/WhatsApp de estados
```

### 3. Gestión de envases/retornables
```
⏳ TODO: schema PlanSanitario, TipoEnvase, MovimientoEnvase
Ver: docs/funcional/IMPLEMENTACION_COMPLETA.md sección "Envases"
```

## Maestros específicos del rubro

| Maestro | Estado | Dónde configurar |
|---------|--------|-----------------|
| Productos (gaseosas, cervezas) | ✅ `/dashboard/productos` | Con variantes de sabor/tamaño |
| Listas de precios por canal | ✅ `/dashboard/listas-precio` | Mayorista, minorista, distribuidora |
| Clientes (kioscos, bares) | ✅ `/dashboard/clientes` | Con límite de crédito y zona |
| Vendedores y zonas | ✅ `/dashboard/usuarios` | Rol vendedor_ruta |
| Vehículos | ✅ `/api/distribucion/vehiculos` | Patente, tipo, capacidad |
| Choferes | ✅ `/api/distribucion/choferes` | Con licencia y documentación |
| Hojas de ruta | ✅ `/dashboard/distribucion` | Paradas + POD |
| Envases/retornables | ⏳ PENDIENTE | Ver sprint A |
| Zonas de entrega | ⏳ PENDIENTE | Actualmente en ZonaGeografica |
| IoT (cadena de frío) | ✅ `/dashboard/iot` | Sensores en camión/cámara |

## Parametrización AFIP

- Rubro usa: Factura A (RI), Factura B (CF/Mono), Remito electrónico
- Percepciones: IIBB Santa Fe (alícuota diferencial bebidas)
- Retenciones SICORE: solo si tiene agentes de retención entre clientes

## Consideraciones Rosario

- Zonas sugeridas: Centro, Norte, Sur, Oeste, Gran Rosario
- Días de corte: lunes/miércoles/viernes según zona
- Competidores directos con portal B2B: Quilmes Distribución, Baggio
- Integración sugerida: ARSAT para factura de largo plazo (distribución campo)

# Logistica, Distribucion y Ecommerce

## Objetivo
Definir el circuito funcional completo para despachos, distribucion y venta online con stock unificado.

## Alcance
- Logistica de despacho: Envio, Transportista, Remito, COT.
- Distribucion: hoja de ruta, paradas, entrega y POD.
- Ecommerce B2B/B2C: catalogo, carrito, checkout y pedidos.

## Circuito end-to-end (ideal)
1. Pedido de venta (backoffice, vendedor en ruta o ecommerce).
2. Reserva de stock y validacion de disponibilidad.
3. Picking (lista, operario, zona, ubicacion).
4. Remito (documento de despacho).
5. Envio (traslado fisico, transportista).
6. Hoja de ruta (asignacion de vehiculo/chofer, orden de paradas).
7. Entrega y POD (firma/foto/geo).
8. Factura y cobranza.
9. Devolucion o reintento si corresponde.

## Roles
- Operario de picking: arma pedidos y valida cantidades.
- Supervisor de deposito: libera remitos y prioriza listas.
- Chofer / repartidor: ejecuta hoja de ruta y confirma entregas.
- Vendedor en ruta: toma pedidos y cobra en calle (app movil).
- Admin comercial: define precios, condiciones y canales.
- Cliente ecommerce: compra online y consulta estado.

## Estados y transiciones
- PedidoVenta: borrador -> confirmado -> en_picking -> remitido -> facturado -> anulado.
- ListaPicking: pendiente -> en_proceso -> completada -> anulada.
- Remito: pendiente -> entregado -> anulado.
- Envio: pendiente -> en_transito -> entregado -> devuelto.
- HojaRuta: planificada -> en_ruta -> finalizada -> cancelada.
- ParadaRuta: pendiente -> en_curso -> entregado -> no_entregado.

## Datos y maestros requeridos (minimo)
- Vehiculo: patente, capacidad, tipo, activo.
- Chofer: nombre, doc, licencia, telefono.
- Ruta/Zona: nombre, cobertura, dias, prioridad.
- HojaRuta: fecha, vehiculoId, choferId, estado, km_estimado.
- ParadaRuta: orden, clienteId, direccion, ventana_horaria, estado.
- EvidenciaEntrega (POD): firma, foto, geo, fecha.
- MotivoNoEntrega: ausente, rechazo, direccion invalida, sin saldo.
- DireccionCliente: entrega, facturacion, fiscal.
- CanalVenta: mostrador, ruta, ecommerce, mayorista.

## Reglas de negocio clave
- Un pedido confirmado reserva stock; si falta, queda en backorder.
- Picking solo se genera para pedidos confirmados.
- Remito puede ser parcial (split) si no hay stock completo.
- Envio requiere direccion valida y transportista/chofer asignado.
- Hoja de ruta no se cierra sin POD o motivo de no entrega.
- COT se genera cuando corresponde (PBA) y se asocia al remito.

## Ecommerce (B2B/B2C)
### Catalogo y stock
- Catalogo publico con filtros y stock en tiempo real.
- Precio por lista del cliente (B2B) y promociones vigentes.

### Checkout
- Carrito con validacion de stock.
- Direccion de envio y condiciones de entrega.
- Medios de pago (transferencia, tarjeta, QR, cuenta corriente).

### Pedido
- Crea PedidoVenta con canalVenta = ecommerce.
- Estado: pendiente_pago -> confirmado -> picking -> remitido.
- Notificaciones al cliente (email/WhatsApp).

### Postventa
- Solicitud de devolucion y notas de credito.
- Reintento de entrega y actualizacion de estado.

## Distribuidora y vendedor en ruta
- Preventa: el vendedor toma pedidos, se arma picking en deposito.
- Autoventa: el vendedor despacha desde el vehiculo con stock propio.
- Hoja de ruta diaria con paradas ordenadas y ventanas horarias.
- App movil offline para tomar pedidos, confirmar entrega y cobrar.

## APIs sugeridas
- /api/ecommerce/catalogo
- /api/ecommerce/carrito
- /api/ecommerce/checkout
- /api/ecommerce/pedidos
- /api/distribucion/vehiculos
- /api/distribucion/choferes
- /api/distribucion/rutas
- /api/distribucion/hojas-ruta
- /api/distribucion/paradas
- /api/distribucion/entregas
- /api/logistica (envios)
- /api/remitos
- /api/picking

## Pantallas sugeridas
- Logistica: envios + transportistas + estados.
- Distribucion: planificador de rutas + hoja de ruta + tracking.
- Picking: listas, progreso, control de armado.
- Ecommerce: catalogo, carrito, checkout, mis pedidos.
- App movil: ruta del dia, paradas, POD, cobranza.

## KPIs y alertas
- Entregas OTIF, tiempo medio de entrega, km por entrega.
- Pedidos pendientes de picking y remitos sin envio.
- Reintentos y devoluciones por motivo.
- Stock comprometido vs disponible por canal.

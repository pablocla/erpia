# Tesoreria y Cuentas Corrientes

## Objetivo
Definir el flujo operativo de cobros y pagos, la gestion de cuentas corrientes y las transferencias bancarias.

## Alcance
- Cuentas a Cobrar (CC) y recibos
- Cuentas a Pagar (CP) y ordenes de pago
- Movimientos bancarios y conciliacion manual
- Transferencias entre cuentas bancarias

## Roles
- Administrador: configura reglas y corrige excepciones
- Tesoreria: registra cobros/pagos y conciliaciones
- Contador: audita y revisa asientos
- Vendedor: consulta estado de CC

## Flujos funcionales

### Cobro (CC)
**Precondiciones**
- Existe una cuenta por cobrar con saldo > 0
- El cliente pertenece a la empresa

**Pasos**
1. Seleccionar la cuenta a cobrar
2. Registrar monto y medio de pago
3. Registrar retenciones sufridas (IVA/Ganancias/IIBB) si aplica
4. Emitir recibo y actualizar saldo
5. Generar asiento contable

**Resultado**
- Recibo emitido con numero correlativo
- CC actualizada (estado: parcial/pagada)
- Asiento contable generado

### Pago (CP)
**Precondiciones**
- Existe una cuenta por pagar con saldo > 0
- El proveedor pertenece a la empresa

**Pasos**
1. Seleccionar la cuenta a pagar
2. Registrar monto y medio de pago
3. Registrar retenciones aplicadas (IVA/Ganancias/IIBB)
4. Emitir orden de pago y actualizar saldo
5. Generar asiento contable

**Resultado**
- Orden de pago emitida con numero correlativo
- CP actualizada (estado: parcial/pagada)
- Asiento contable generado

### Transferencia bancaria
**Precondiciones**
- Cuenta origen y destino distintas
- Ambas cuentas pertenecen a la misma empresa

**Pasos**
1. Seleccionar cuenta origen y destino
2. Indicar importe, fecha y referencia
3. Crear movimiento debito y credito

**Resultado**
- Dos movimientos bancarios con referencia comun

### Conciliacion manual
**Pasos**
1. Seleccionar movimiento pendiente
2. Marcar como conciliado

**Resultado**
- Movimiento con estado conciliado

## Reglas de negocio
- El importe debe ser > 0
- No se permite transferir entre la misma cuenta
- Las retenciones no pueden superar el monto total
- CC/CP nunca pueden quedar con saldo negativo
- Todas las operaciones deben quedar dentro de la empresa autenticada

## Datos clave (resumen)
- CuentaCobrar: saldo, montoOriginal, montoPagado, fechaVencimiento, estado
- CuentaPagar: saldo, montoOriginal, montoPagado, fechaVencimiento, estado
- Recibo: numero, fecha, montoTotal, totalRetenciones, netoRecibido, medioPago, clienteId
- OrdenPago: numero, fecha, montoTotal, totalRetenciones, netoPagado, medioPago, proveedorId
- MovimientoBancario: fecha, tipo (debito/credito), importe, descripcion, referencia, estado

## Estados
- CC/CP: pendiente, parcial, pagada, vencida
- Movimiento bancario: pendiente, conciliado

## APIs y pantallas
- GET /api/cuentas-cobrar, POST /api/cuentas-cobrar/cobros
- GET /api/recibos
- GET /api/cuentas-pagar, POST /api/cuentas-pagar/pagos
- GET /api/ordenes-pago
- GET/POST /api/banco, PATCH /api/banco/conciliar
- POST /api/banco/transferencias
- UI: /dashboard/cuentas-cobrar, /dashboard/cuentas-pagar, /dashboard/banco

## KPIs sugeridos
- Total pendiente CC/CP
- Total vencido CC/CP
- Cantidad de recibos/OP por periodo
- Movimientos bancarios pendientes de conciliacion

## Pendientes
- Conciliacion por extracto (CSV/OFX)
- Transferencias caja-banco
- Ficha 360 CC/CP con historial completo

## Seguridad y auditoria
- Todas las operaciones se filtran por empresaId
- Soft delete en proveedores/clientes
- createdBy/updatedBy en operaciones criticas

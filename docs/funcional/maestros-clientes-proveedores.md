# Maestros de Clientes y Proveedores

## Objetivo
Definir la informacion requerida para operar ventas, compras y cumplimiento fiscal.

## Alcance
- Maestro de Clientes
- Maestro de Proveedores
- Relacion con parametros fiscales y listas de precio

## Maestro de Clientes (resumen)
- Identificacion fiscal: cuit, dni, condicionIva, nroIIBB, situacionIIBB
- Contacto: direccion, telefono, email, web
- Comercial: condicionPago, listaPrecio, vendedor, rubro, canal, segmento
- Financiero: limiteCredito, descuentoPct, monedaHabitual
- Estado: activo, fechaAlta, observaciones

## Maestro de Proveedores (resumen)
- Identificacion fiscal: cuit, condicionIva
- Contacto: direccion, telefono, email
- Comercial: condicionPago, rubro, provincia, pais, localidad
- Estado: activo, fechaAlta

## Pendientes (proxima iteracion)
- Datos bancarios y retenciones por proveedor
- Domicilios multiples y contactos por cliente
- Adjuntos fiscales (constancias)
- Clasificacion y scoring crediticio

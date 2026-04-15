-- Migración: Float → Decimal(15,2) en campos monetarios críticos
-- Bug A-007: evitar errores de redondeo en IVA (ej: 1234.50 × 1.21 = 1493.7450000000001)
-- Ejecutar con: psql $DATABASE_URL -f prisma/migrations/20260415_float_to_decimal.sql
-- O aplicar automáticamente con: npx prisma migrate dev

-- ── Factura ─────────────────────────────────────────────────────────────────
ALTER TABLE facturas
  ALTER COLUMN subtotal           TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva                TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total              TYPE DECIMAL(15,2) USING total::DECIMAL(15,2),
  ALTER COLUMN "totalPercepciones" TYPE DECIMAL(15,2) USING "totalPercepciones"::DECIMAL(15,2),
  ALTER COLUMN "totalRetenciones"  TYPE DECIMAL(15,2) USING "totalRetenciones"::DECIMAL(15,2),
  ALTER COLUMN "netoNoGravado"     TYPE DECIMAL(15,2) USING "netoNoGravado"::DECIMAL(15,2),
  ALTER COLUMN "netoExento"        TYPE DECIMAL(15,2) USING "netoExento"::DECIMAL(15,2),
  ALTER COLUMN "impInternosTotal"  TYPE DECIMAL(15,2) USING "impInternosTotal"::DECIMAL(15,2);

-- ── LineaFactura ─────────────────────────────────────────────────────────────
ALTER TABLE lineas_factura
  ALTER COLUMN "precioUnitario" TYPE DECIMAL(15,2) USING "precioUnitario"::DECIMAL(15,2),
  ALTER COLUMN subtotal         TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva              TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total            TYPE DECIMAL(15,2) USING total::DECIMAL(15,2);

-- ── Compra ───────────────────────────────────────────────────────────────────
ALTER TABLE compras
  ALTER COLUMN subtotal            TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva                 TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total               TYPE DECIMAL(15,2) USING total::DECIMAL(15,2),
  ALTER COLUMN "totalPercepciones" TYPE DECIMAL(15,2) USING "totalPercepciones"::DECIMAL(15,2),
  ALTER COLUMN "totalRetenciones"  TYPE DECIMAL(15,2) USING "totalRetenciones"::DECIMAL(15,2),
  ALTER COLUMN "netoNoGravado"     TYPE DECIMAL(15,2) USING "netoNoGravado"::DECIMAL(15,2),
  ALTER COLUMN "netoExento"        TYPE DECIMAL(15,2) USING "netoExento"::DECIMAL(15,2);

-- ── LineaCompra ──────────────────────────────────────────────────────────────
ALTER TABLE lineas_compra
  ALTER COLUMN "precioUnitario" TYPE DECIMAL(15,2) USING "precioUnitario"::DECIMAL(15,2),
  ALTER COLUMN subtotal         TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva              TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total            TYPE DECIMAL(15,2) USING total::DECIMAL(15,2);

-- ── Producto ─────────────────────────────────────────────────────────────────
ALTER TABLE productos
  ALTER COLUMN "precioVenta"   TYPE DECIMAL(15,2) USING "precioVenta"::DECIMAL(15,2),
  ALTER COLUMN "precioCompra"  TYPE DECIMAL(15,2) USING "precioCompra"::DECIMAL(15,2);

-- ── MovimientoContable ────────────────────────────────────────────────────────
ALTER TABLE movimientos_contables
  ALTER COLUMN debe  TYPE DECIMAL(15,2) USING debe::DECIMAL(15,2),
  ALTER COLUMN haber TYPE DECIMAL(15,2) USING haber::DECIMAL(15,2);

-- ── MovimientoCaja ────────────────────────────────────────────────────────────
ALTER TABLE movimientos_caja
  ALTER COLUMN monto TYPE DECIMAL(15,2) USING monto::DECIMAL(15,2);

-- ── Caja ─────────────────────────────────────────────────────────────────────
ALTER TABLE cajas
  ALTER COLUMN "saldoInicial"       TYPE DECIMAL(15,2) USING "saldoInicial"::DECIMAL(15,2),
  ALTER COLUMN "saldoFinal"         TYPE DECIMAL(15,2) USING "saldoFinal"::DECIMAL(15,2),
  ALTER COLUMN "arqueoEfectivo"     TYPE DECIMAL(15,2) USING "arqueoEfectivo"::DECIMAL(15,2),
  ALTER COLUMN "arqueoTarjeta"      TYPE DECIMAL(15,2) USING "arqueoTarjeta"::DECIMAL(15,2),
  ALTER COLUMN "arqueoTransferencia" TYPE DECIMAL(15,2) USING "arqueoTransferencia"::DECIMAL(15,2),
  ALTER COLUMN "arqueoCheque"       TYPE DECIMAL(15,2) USING "arqueoCheque"::DECIMAL(15,2),
  ALTER COLUMN "arqueoQR"           TYPE DECIMAL(15,2) USING "arqueoQR"::DECIMAL(15,2),
  ALTER COLUMN diferencia           TYPE DECIMAL(15,2) USING diferencia::DECIMAL(15,2);

-- ── JornadaFiscal ─────────────────────────────────────────────────────────────
ALTER TABLE jornadas_fiscales
  ALTER COLUMN "totalVentas"        TYPE DECIMAL(15,2) USING "totalVentas"::DECIMAL(15,2),
  ALTER COLUMN "totalNeto"          TYPE DECIMAL(15,2) USING "totalNeto"::DECIMAL(15,2),
  ALTER COLUMN "totalIva21"         TYPE DECIMAL(15,2) USING "totalIva21"::DECIMAL(15,2),
  ALTER COLUMN "totalIva105"        TYPE DECIMAL(15,2) USING "totalIva105"::DECIMAL(15,2),
  ALTER COLUMN "totalIva27"         TYPE DECIMAL(15,2) USING "totalIva27"::DECIMAL(15,2),
  ALTER COLUMN "totalIvaExento"     TYPE DECIMAL(15,2) USING "totalIvaExento"::DECIMAL(15,2),
  ALTER COLUMN "totalIvaNoGravado"  TYPE DECIMAL(15,2) USING "totalIvaNoGravado"::DECIMAL(15,2),
  ALTER COLUMN "totalEfectivo"      TYPE DECIMAL(15,2) USING "totalEfectivo"::DECIMAL(15,2),
  ALTER COLUMN "totalTarjeta"       TYPE DECIMAL(15,2) USING "totalTarjeta"::DECIMAL(15,2),
  ALTER COLUMN "totalTransferencia" TYPE DECIMAL(15,2) USING "totalTransferencia"::DECIMAL(15,2),
  ALTER COLUMN "totalQR"            TYPE DECIMAL(15,2) USING "totalQR"::DECIMAL(15,2),
  ALTER COLUMN "totalCheque"        TYPE DECIMAL(15,2) USING "totalCheque"::DECIMAL(15,2),
  ALTER COLUMN "totalCtaCte"        TYPE DECIMAL(15,2) USING "totalCtaCte"::DECIMAL(15,2);

-- ── CierreX ───────────────────────────────────────────────────────────────────
ALTER TABLE "cierres_x"
  ALTER COLUMN "totalVentas"        TYPE DECIMAL(15,2) USING "totalVentas"::DECIMAL(15,2),
  ALTER COLUMN "totalNeto"          TYPE DECIMAL(15,2) USING "totalNeto"::DECIMAL(15,2),
  ALTER COLUMN "totalIva21"         TYPE DECIMAL(15,2) USING "totalIva21"::DECIMAL(15,2),
  ALTER COLUMN "totalIva105"        TYPE DECIMAL(15,2) USING "totalIva105"::DECIMAL(15,2),
  ALTER COLUMN "totalIva27"         TYPE DECIMAL(15,2) USING "totalIva27"::DECIMAL(15,2),
  ALTER COLUMN "totalIvaExento"     TYPE DECIMAL(15,2) USING "totalIvaExento"::DECIMAL(15,2),
  ALTER COLUMN "totalEfectivo"      TYPE DECIMAL(15,2) USING "totalEfectivo"::DECIMAL(15,2),
  ALTER COLUMN "totalTarjeta"       TYPE DECIMAL(15,2) USING "totalTarjeta"::DECIMAL(15,2),
  ALTER COLUMN "totalTransferencia" TYPE DECIMAL(15,2) USING "totalTransferencia"::DECIMAL(15,2),
  ALTER COLUMN "totalQR"            TYPE DECIMAL(15,2) USING "totalQR"::DECIMAL(15,2),
  ALTER COLUMN "totalCheque"        TYPE DECIMAL(15,2) USING "totalCheque"::DECIMAL(15,2);

-- ── NotaCredito ───────────────────────────────────────────────────────────────
ALTER TABLE notas_credito
  ALTER COLUMN subtotal            TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva                 TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total               TYPE DECIMAL(15,2) USING total::DECIMAL(15,2),
  ALTER COLUMN "totalPercepciones" TYPE DECIMAL(15,2) USING "totalPercepciones"::DECIMAL(15,2),
  ALTER COLUMN "totalRetenciones"  TYPE DECIMAL(15,2) USING "totalRetenciones"::DECIMAL(15,2);

-- ── LineaNotaCredito ──────────────────────────────────────────────────────────
ALTER TABLE lineas_nota_credito
  ALTER COLUMN "precioUnitario" TYPE DECIMAL(15,2) USING "precioUnitario"::DECIMAL(15,2),
  ALTER COLUMN subtotal         TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva              TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total            TYPE DECIMAL(15,2) USING total::DECIMAL(15,2);

-- ── NotaDebito ────────────────────────────────────────────────────────────────
ALTER TABLE notas_debito
  ALTER COLUMN subtotal            TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva                 TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total               TYPE DECIMAL(15,2) USING total::DECIMAL(15,2),
  ALTER COLUMN "totalPercepciones" TYPE DECIMAL(15,2) USING "totalPercepciones"::DECIMAL(15,2),
  ALTER COLUMN "totalRetenciones"  TYPE DECIMAL(15,2) USING "totalRetenciones"::DECIMAL(15,2);

-- ── LineaNotaDebito ───────────────────────────────────────────────────────────
ALTER TABLE lineas_nota_debito
  ALTER COLUMN "precioUnitario" TYPE DECIMAL(15,2) USING "precioUnitario"::DECIMAL(15,2),
  ALTER COLUMN subtotal         TYPE DECIMAL(15,2) USING subtotal::DECIMAL(15,2),
  ALTER COLUMN iva              TYPE DECIMAL(15,2) USING iva::DECIMAL(15,2),
  ALTER COLUMN total            TYPE DECIMAL(15,2) USING total::DECIMAL(15,2);

-- ── TributoFactura / TributoCompra ────────────────────────────────────────────
ALTER TABLE tributos_factura
  ALTER COLUMN "baseImponible" TYPE DECIMAL(15,2) USING "baseImponible"::DECIMAL(15,2),
  ALTER COLUMN importe         TYPE DECIMAL(15,2) USING importe::DECIMAL(15,2);

ALTER TABLE tributos_compra
  ALTER COLUMN "baseImponible" TYPE DECIMAL(15,2) USING "baseImponible"::DECIMAL(15,2),
  ALTER COLUMN importe         TYPE DECIMAL(15,2) USING importe::DECIMAL(15,2);

-- Vale de dinero (ticket canjeable en POS)
CREATE TABLE IF NOT EXISTS "vales_dinero" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "montoOriginal" DECIMAL(15,2) NOT NULL,
    "saldoRestante" DECIMAL(15,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "titularNombre" TEXT,
    "observaciones" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER,

    CONSTRAINT "vales_dinero_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vales_dinero_empresaId_numero_key" ON "vales_dinero"("empresaId", "numero");
CREATE INDEX IF NOT EXISTS "vales_dinero_empresaId_estado_idx" ON "vales_dinero"("empresaId", "estado");

ALTER TABLE "vales_dinero" ADD CONSTRAINT "vales_dinero_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vales_dinero" ADD CONSTRAINT "vales_dinero_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "cobros_vale" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valeId" INTEGER NOT NULL,
    "facturaId" INTEGER,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "cobros_vale_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cobros_vale_valeId_idx" ON "cobros_vale"("valeId");
CREATE INDEX IF NOT EXISTS "cobros_vale_empresaId_idx" ON "cobros_vale"("empresaId");

ALTER TABLE "cobros_vale" ADD CONSTRAINT "cobros_vale_valeId_fkey"
    FOREIGN KEY ("valeId") REFERENCES "vales_dinero"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cobros_vale" ADD CONSTRAINT "cobros_vale_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Claver Nicho LATAM — ledger compartido para apps de nicho
CREATE TABLE IF NOT EXISTS "niche_movimientos" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "appSku" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" INTEGER,
    "monto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "periodo" TEXT,
    "venceEn" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niche_movimientos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "niche_movimientos_empresaId_appSku_idx" ON "niche_movimientos"("empresaId", "appSku");
CREATE INDEX IF NOT EXISTS "niche_movimientos_clienteId_idx" ON "niche_movimientos"("clienteId");

ALTER TABLE "niche_movimientos" ADD CONSTRAINT "niche_movimientos_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "niche_movimientos" ADD CONSTRAINT "niche_movimientos_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
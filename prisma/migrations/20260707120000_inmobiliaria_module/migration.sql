-- Modulo Inmobiliaria — cartera de propiedades y contratos de alquiler
-- Idempotent: safe when tables/constraints already exist (partial prior apply).

CREATE TABLE IF NOT EXISTS "propiedades" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'depto',
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "ambientes" INTEGER,
    "m2" DOUBLE PRECISION,
    "precioAlquiler" DECIMAL(15,2),
    "fotoUrl" TEXT,
    "descripcion" TEXT,
    "propietarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propiedades_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "propiedades_empresaId_estado_idx" ON "propiedades"("empresaId", "estado");

DO $$ BEGIN
    ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "propiedades" ADD CONSTRAINT "propiedades_propietarioId_fkey"
        FOREIGN KEY ("propietarioId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "contratos_alquiler" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "propiedadId" INTEGER NOT NULL,
    "inquilinoId" INTEGER NOT NULL,
    "propietarioId" INTEGER,
    "montoMensual" DECIMAL(15,2) NOT NULL,
    "diaVencimiento" INTEGER NOT NULL DEFAULT 10,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "deposito" DECIMAL(15,2),
    "garantiaTipo" TEXT,
    "observaciones" TEXT,
    "ultimoPeriodoFacturado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_alquiler_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contratos_alquiler_empresaId_estado_idx" ON "contratos_alquiler"("empresaId", "estado");
CREATE INDEX IF NOT EXISTS "contratos_alquiler_propiedadId_idx" ON "contratos_alquiler"("propiedadId");
CREATE INDEX IF NOT EXISTS "contratos_alquiler_inquilinoId_idx" ON "contratos_alquiler"("inquilinoId");
CREATE INDEX IF NOT EXISTS "contratos_alquiler_fechaFin_idx" ON "contratos_alquiler"("fechaFin");

DO $$ BEGIN
    ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_propiedadId_fkey"
        FOREIGN KEY ("propiedadId") REFERENCES "propiedades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_inquilinoId_fkey"
        FOREIGN KEY ("inquilinoId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "contratos_alquiler" ADD CONSTRAINT "contratos_alquiler_propietarioId_fkey"
        FOREIGN KEY ("propietarioId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

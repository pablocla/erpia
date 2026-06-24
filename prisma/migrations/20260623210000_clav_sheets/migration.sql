-- Clav Sheets — definiciones y catálogo semántico

CREATE TABLE "reportes_definiciones" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "connectorId" TEXT NOT NULL DEFAULT 'claverp',
    "tipoVista" TEXT NOT NULL DEFAULT 'plano',
    "definicion" JSONB NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "creadoPor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "reportes_definiciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reportes_definiciones_empresaId_codigo_key" ON "reportes_definiciones"("empresaId", "codigo");
CREATE INDEX "reportes_definiciones_empresaId_updatedAt_idx" ON "reportes_definiciones"("empresaId", "updatedAt");

ALTER TABLE "reportes_definiciones" ADD CONSTRAINT "reportes_definiciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "reportes_catalogo_campos" (
    "id" SERIAL NOT NULL,
    "connectorId" TEXT NOT NULL DEFAULT 'claverp',
    "fuente" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "agregacion" TEXT,
    "requiereRol" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rubros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "reportes_catalogo_campos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reportes_catalogo_campos_connectorId_fuente_campo_key" ON "reportes_catalogo_campos"("connectorId", "fuente", "campo");
CREATE INDEX "reportes_catalogo_campos_connectorId_fuente_idx" ON "reportes_catalogo_campos"("connectorId", "fuente");
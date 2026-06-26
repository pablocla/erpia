CREATE TABLE IF NOT EXISTS "marketplace_tareas_analista" (
    "id" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "provisionJobId" TEXT,
    "tipoEjecutor" TEXT NOT NULL DEFAULT 'humano',
    "asignadoA" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "runbookCodigo" TEXT,
    "checklistJson" JSONB,
    "notas" TEXT,
    "completadaAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_tareas_analista_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "marketplace_tareas_analista_empresaId_estado_idx"
    ON "marketplace_tareas_analista"("empresaId", "estado");
CREATE INDEX IF NOT EXISTS "marketplace_tareas_analista_asignadoA_estado_idx"
    ON "marketplace_tareas_analista"("asignadoA", "estado");
CREATE INDEX IF NOT EXISTS "marketplace_tareas_analista_sku_idx"
    ON "marketplace_tareas_analista"("sku");

DO $$ BEGIN
    ALTER TABLE "marketplace_tareas_analista"
        ADD CONSTRAINT "marketplace_tareas_analista_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
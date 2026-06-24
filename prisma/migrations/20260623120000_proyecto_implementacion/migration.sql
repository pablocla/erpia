CREATE TABLE IF NOT EXISTS "proyectos_implementacion" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "faseActual" TEXT NOT NULL DEFAULT 'CCA-010',
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "planComercial" TEXT,
    "analistaEmail" TEXT,
    "fechaVenta" TIMESTAMP(3),
    "fechaKickoff" TIMESTAMP(3),
    "fechaObjetivoGoLive" TIMESTAMP(3),
    "fechaGoLiveReal" TIMESTAMP(3),
    "fases" JSONB NOT NULL DEFAULT '{}',
    "packOnboardEntregado" BOOLEAN NOT NULL DEFAULT false,
    "urlAcceso" TEXT,
    "notas" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "proyectos_implementacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "proyectos_implementacion_codigo_key"
    ON "proyectos_implementacion"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "proyectos_implementacion_empresaId_key"
    ON "proyectos_implementacion"("empresaId");
CREATE INDEX IF NOT EXISTS "proyectos_implementacion_estado_faseActual_idx"
    ON "proyectos_implementacion"("estado", "faseActual");
CREATE INDEX IF NOT EXISTS "proyectos_implementacion_fechaObjetivoGoLive_idx"
    ON "proyectos_implementacion"("fechaObjetivoGoLive");
CREATE INDEX IF NOT EXISTS "proyectos_implementacion_analistaEmail_idx"
    ON "proyectos_implementacion"("analistaEmail");

DO $$ BEGIN
    ALTER TABLE "proyectos_implementacion"
        ADD CONSTRAINT "proyectos_implementacion_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
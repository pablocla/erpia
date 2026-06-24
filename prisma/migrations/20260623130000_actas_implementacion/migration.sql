CREATE TABLE IF NOT EXISTS "actas_implementacion" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT,
    "firmadoPor" TEXT,
    "firmadoCliente" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proyectoId" INTEGER NOT NULL,

    CONSTRAINT "actas_implementacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "actas_implementacion_proyectoId_tipo_idx"
    ON "actas_implementacion"("proyectoId", "tipo");

DO $$ BEGIN
    ALTER TABLE "actas_implementacion"
        ADD CONSTRAINT "actas_implementacion_proyectoId_fkey"
        FOREIGN KEY ("proyectoId") REFERENCES "proyectos_implementacion"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
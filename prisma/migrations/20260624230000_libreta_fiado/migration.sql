ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "fiadoRequiereLimite" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "emailDuenoAlmacen" TEXT;
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "fiadoNotificarWhatsApp" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "fiadoHabilitado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "emailNotificacionFiado" TEXT;
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "emailNotificacionFiado2" TEXT;
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "notificarClienteFiado" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "fiado_notificacion_logs" (
    "id" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "facturaId" INTEGER,
    "destinatarios" JSONB NOT NULL,
    "estado" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fiado_notificacion_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "fiado_notificacion_logs_empresaId_createdAt_idx"
    ON "fiado_notificacion_logs"("empresaId", "createdAt");
CREATE INDEX IF NOT EXISTS "fiado_notificacion_logs_clienteId_idx"
    ON "fiado_notificacion_logs"("clienteId");

DO $$ BEGIN
    ALTER TABLE "fiado_notificacion_logs"
        ADD CONSTRAINT "fiado_notificacion_logs_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
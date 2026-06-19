-- NOP Automation Hub tables

CREATE TABLE IF NOT EXISTS "automation_config" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "n8nBaseUrl" TEXT,
    "n8nApiKeyEnc" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automation_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automation_config_empresaId_key" ON "automation_config"("empresaId");

CREATE TABLE IF NOT EXISTS "automation_event_maps" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "n8nWebhookUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "filtros" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automation_event_maps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automation_event_maps_configId_eventKey_key"
  ON "automation_event_maps"("configId", "eventKey");

CREATE TABLE IF NOT EXISTS "automation_playbooks" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "playbookKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nombre" TEXT NOT NULL,
    "parametros" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automation_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automation_playbooks_configId_playbookKey_key"
  ON "automation_playbooks"("configId", "playbookKey");

CREATE TABLE IF NOT EXISTS "automation_virtual_workers" (
    "id" SERIAL NOT NULL,
    "configId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "playbooks" TEXT[],
    "cron" TEXT,
    "usuarioId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automation_virtual_workers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "automation_executions" (
    "id" BIGSERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "eventKey" TEXT,
    "status" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "durationMs" INTEGER,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automation_executions_idempotencyKey_key"
  ON "automation_executions"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "automation_executions_empresaId_createdAt_idx"
  ON "automation_executions"("empresaId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "automation_config"
    ADD CONSTRAINT "automation_config_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "automation_event_maps"
    ADD CONSTRAINT "automation_event_maps_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "automation_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "automation_playbooks"
    ADD CONSTRAINT "automation_playbooks_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "automation_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "automation_virtual_workers"
    ADD CONSTRAINT "automation_virtual_workers_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "automation_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "automation_virtual_workers"
    ADD CONSTRAINT "automation_virtual_workers_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Usuario automation fields (if missing)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "esVirtual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "automationApiKeyHash" TEXT;

-- TareaPendiente origen (if missing)
ALTER TABLE "tareas_pendientes" ADD COLUMN IF NOT EXISTS "origen" TEXT NOT NULL DEFAULT 'manual';
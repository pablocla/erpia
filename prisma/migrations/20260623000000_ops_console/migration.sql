-- Consola de operaciones Claver Cloud (TCloud-style)

CREATE TABLE IF NOT EXISTS "tenant_entornos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "urlBase" TEXT,
    "region" TEXT DEFAULT 'sa-east-1',
    "version" TEXT,
    "dbProveedor" TEXT DEFAULT 'supabase',
    "dbNombre" TEXT,
    "dbHost" TEXT,
    "ultimoHealthcheck" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "tenant_entornos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_entornos_empresaId_codigo_key"
    ON "tenant_entornos"("empresaId", "codigo");
CREATE INDEX IF NOT EXISTS "tenant_entornos_empresaId_estado_idx"
    ON "tenant_entornos"("empresaId", "estado");

CREATE TABLE IF NOT EXISTS "analista_asignaciones" (
    "id" SERIAL NOT NULL,
    "analistaEmail" TEXT NOT NULL,
    "rolAsignacion" TEXT NOT NULL DEFAULT 'soporte',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "analista_asignaciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "analista_asignaciones_analistaEmail_empresaId_key"
    ON "analista_asignaciones"("analistaEmail", "empresaId");
CREATE INDEX IF NOT EXISTS "analista_asignaciones_analistaEmail_activo_idx"
    ON "analista_asignaciones"("analistaEmail", "activo");

CREATE TABLE IF NOT EXISTS "ops_jobs" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "iniciadoPor" TEXT NOT NULL,
    "detalle" JSONB,
    "resultado" JSONB,
    "errorMsg" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "entornoId" INTEGER,

    CONSTRAINT "ops_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ops_jobs_empresaId_tipo_createdAt_idx"
    ON "ops_jobs"("empresaId", "tipo", "createdAt");
CREATE INDEX IF NOT EXISTS "ops_jobs_estado_createdAt_idx"
    ON "ops_jobs"("estado", "createdAt");

CREATE TABLE IF NOT EXISTS "ops_pipelines" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'val',
    "destino" TEXT NOT NULL DEFAULT 'prd',
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "pasoActual" INTEGER NOT NULL DEFAULT 0,
    "pasos" JSONB NOT NULL,
    "iniciadoPor" TEXT NOT NULL,
    "aprobadoPor" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" INTEGER NOT NULL,

    CONSTRAINT "ops_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ops_pipelines_empresaId_estado_idx"
    ON "ops_pipelines"("empresaId", "estado");

CREATE TABLE IF NOT EXISTS "sistema_logs" (
    "id" SERIAL NOT NULL,
    "severidad" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "contexto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "stack" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" INTEGER,
    "entornoId" INTEGER,

    CONSTRAINT "sistema_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sistema_logs_empresaId_createdAt_idx"
    ON "sistema_logs"("empresaId", "createdAt");
CREATE INDEX IF NOT EXISTS "sistema_logs_severidad_createdAt_idx"
    ON "sistema_logs"("severidad", "createdAt");
CREATE INDEX IF NOT EXISTS "sistema_logs_categoria_createdAt_idx"
    ON "sistema_logs"("categoria", "createdAt");

DO $$ BEGIN
    ALTER TABLE "tenant_entornos"
        ADD CONSTRAINT "tenant_entornos_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "analista_asignaciones"
        ADD CONSTRAINT "analista_asignaciones_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ops_jobs"
        ADD CONSTRAINT "ops_jobs_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ops_jobs"
        ADD CONSTRAINT "ops_jobs_entornoId_fkey"
        FOREIGN KEY ("entornoId") REFERENCES "tenant_entornos"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ops_pipelines"
        ADD CONSTRAINT "ops_pipelines_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "sistema_logs"
        ADD CONSTRAINT "sistema_logs_empresaId_fkey"
        FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "sistema_logs"
        ADD CONSTRAINT "sistema_logs_entornoId_fkey"
        FOREIGN KEY ("entornoId") REFERENCES "tenant_entornos"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
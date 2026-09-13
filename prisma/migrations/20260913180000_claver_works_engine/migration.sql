-- Claver Works Engine (PRD docs/comercial/CLAVER_WORKS_ENGINE_PRD.md)

CREATE TYPE "WorksSegment" AS ENUM ('software', 'energy', 'infra', 'blockchain', 'petrol', 'industry');
CREATE TYPE "WorksLeadFuente" AS ENUM ('ads', 'wa', 'form', 'soft_upsell', 'manual');
CREATE TYPE "WorksProjectStatus" AS ENUM ('Lead', 'Calificado', 'Presupuesto', 'Sena', 'MatchPartner', 'EnEjecucion', 'Entregado', 'Cobrado', 'Cancelado');
CREATE TYPE "WorksPartnerRubro" AS ENUM ('epc_solar', 'civil', 'dc', 'solidity', 'audit', 'other');
CREATE TYPE "WorksMilestoneEstado" AS ENUM ('pendiente', 'facturado', 'cobrado', 'pagado_partner');

CREATE TABLE IF NOT EXISTS "works_partners" (
    "id" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "rubro" "WorksPartnerRubro" NOT NULL DEFAULT 'other',
    "zona" TEXT,
    "matricula" TEXT,
    "tarifaNetaNotas" TEXT,
    "rcVigente" BOOLEAN NOT NULL DEFAULT false,
    "rcVigenteHasta" TIMESTAMP(3),
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,
    "contactoTel" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "segmentoAllowlist" "WorksSegment"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "works_partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "works_projects" (
    "id" TEXT NOT NULL,
    "segmento" "WorksSegment" NOT NULL,
    "status" "WorksProjectStatus" NOT NULL DEFAULT 'Lead',
    "titulo" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "montoPresupuesto" DECIMAL(14,2),
    "montoSena" DECIMAL(14,2),
    "comisionPct" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "senaPagada" BOOLEAN NOT NULL DEFAULT false,
    "senaPagadaAt" TIMESTAMP(3),
    "senaMontoManual" DECIMAL(14,2),
    "senaNota" TEXT,
    "partnerId" TEXT,
    "partnerAssignedAt" TIMESTAMP(3),
    "partnerAssignedBy" TEXT,
    "checklist" JSONB,
    "softTenantId" INTEGER,
    "presupuestoSoftId" INTEGER,
    "presupuestoSoftUrl" TEXT,
    "cxCIds" JSONB,
    "notas" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "works_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "works_leads" (
    "id" TEXT NOT NULL,
    "segmento" "WorksSegment" NOT NULL,
    "fuente" "WorksLeadFuente" NOT NULL DEFAULT 'form',
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "zona" TEXT,
    "payload" JSONB,
    "ownerAgent" TEXT NOT NULL DEFAULT 'comercial',
    "proyectoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "works_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "works_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pct" DECIMAL(5,2),
    "monto" DECIMAL(14,2),
    "estado" "WorksMilestoneEstado" NOT NULL DEFAULT 'pendiente',
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "works_milestones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "works_leads_proyectoId_key" ON "works_leads"("proyectoId");
CREATE INDEX IF NOT EXISTS "works_leads_segmento_createdAt_idx" ON "works_leads"("segmento", "createdAt");
CREATE INDEX IF NOT EXISTS "works_leads_email_idx" ON "works_leads"("email");
CREATE INDEX IF NOT EXISTS "works_projects_segmento_status_idx" ON "works_projects"("segmento", "status");
CREATE INDEX IF NOT EXISTS "works_projects_partnerId_idx" ON "works_projects"("partnerId");
CREATE INDEX IF NOT EXISTS "works_projects_status_updatedAt_idx" ON "works_projects"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "works_partners_activo_rubro_idx" ON "works_partners"("activo", "rubro");
CREATE INDEX IF NOT EXISTS "works_milestones_projectId_estado_idx" ON "works_milestones"("projectId", "estado");

DO $$ BEGIN
    ALTER TABLE "works_leads" ADD CONSTRAINT "works_leads_proyectoId_fkey"
      FOREIGN KEY ("proyectoId") REFERENCES "works_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "works_projects" ADD CONSTRAINT "works_projects_partnerId_fkey"
      FOREIGN KEY ("partnerId") REFERENCES "works_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "works_milestones" ADD CONSTRAINT "works_milestones_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "works_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

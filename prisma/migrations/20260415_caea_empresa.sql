-- Migración: campos CAEA en tabla empresas
-- RG 5782/2025 — contingencia offline (CAEA pre-autorizado por AFIP)
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS "entornoAfip"      TEXT NOT NULL DEFAULT 'homologacion',
  ADD COLUMN IF NOT EXISTS "caeaVigente"      TEXT,
  ADD COLUMN IF NOT EXISTS "caeaPeriodo"      TEXT,
  ADD COLUMN IF NOT EXISTS "caeaQuincena"     INT,
  ADD COLUMN IF NOT EXISTS "caeaVigDesde"     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "caeaVigHasta"     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "caeaTopeInformar" TIMESTAMPTZ;

-- Sincronizar entornoAfip con entorno existente
UPDATE empresas SET "entornoAfip" = entorno;

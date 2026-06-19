-- Apariencia global por empresa (definida por el dueño/admin)
ALTER TABLE "empresas" ADD COLUMN IF NOT EXISTS "temaConfig" JSONB;
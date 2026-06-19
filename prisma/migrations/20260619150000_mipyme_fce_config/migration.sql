-- FCE MiPyME — CBU y tipo transferencia en config fiscal

ALTER TABLE "config_fiscal_empresa"
  ADD COLUMN IF NOT EXISTS "cbuFce" TEXT,
  ADD COLUMN IF NOT EXISTS "tipoTransferenciaFce" TEXT NOT NULL DEFAULT 'SCA';
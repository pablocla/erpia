-- Manual migration: growth loop afiliados multi-nivel
-- Ejecutar en Postgres si `prisma migrate` no se usa en el entorno.

-- Empresa → partner que la refirió
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS "referredByPartnerId" INTEGER;

-- Partner: código público + genealogía
ALTER TABLE partner_profiles
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "parentPartnerId" INTEGER;

-- Columnas extra de comisión (si la tabla ya existía con esquema mínimo)
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS "montoBase" DECIMAL(12, 2);
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS porcentaje DECIMAL(5, 2);
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS "rolPartner" TEXT;
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE comisiones_partner ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS comisiones_partner_idempotencyKey_key
  ON comisiones_partner ("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS partner_profiles_referralCode_key
  ON partner_profiles ("referralCode")
  WHERE "referralCode" IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_profiles_referralCode_idx
  ON partner_profiles ("referralCode");

-- Comisiones (billetera)
CREATE TABLE IF NOT EXISTS comisiones_partner (
  id SERIAL PRIMARY KEY,
  "partnerId" INTEGER NOT NULL REFERENCES partner_profiles(id),
  "empresaOrigenId" INTEGER NOT NULL,
  monto DECIMAL(12, 2) NOT NULL,
  "montoBase" DECIMAL(12, 2),
  porcentaje DECIMAL(5, 2),
  nivel INTEGER NOT NULL DEFAULT 1,
  "rolPartner" TEXT,
  sku TEXT,
  "idempotencyKey" TEXT UNIQUE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS comisiones_partner_partnerId_estado_idx
  ON comisiones_partner ("partnerId", estado);

CREATE INDEX IF NOT EXISTS comisiones_partner_empresaOrigenId_idx
  ON comisiones_partner ("empresaOrigenId");

-- ── Contador multi-empresa ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contador_cliente_links (
  id SERIAL PRIMARY KEY,
  "estudioEmpresaId" INTEGER NOT NULL REFERENCES empresas(id),
  "clienteEmpresaId" INTEGER NOT NULL REFERENCES empresas(id),
  "creadoPorUserId" INTEGER,
  permisos TEXT NOT NULL DEFAULT 'lectura_fiscal',
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("estudioEmpresaId", "clienteEmpresaId")
);

CREATE INDEX IF NOT EXISTS contador_cliente_links_estudio_idx
  ON contador_cliente_links ("estudioEmpresaId", activo);

-- ── Cobranza as a Service ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cobranza_as_a_service_config (
  id SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL UNIQUE REFERENCES empresas(id),
  activo BOOLEAN NOT NULL DEFAULT false,
  "feePct" DECIMAL(5, 2) NOT NULL DEFAULT 5,
  "feeMinArs" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "autoAprobarWa" BOOLEAN NOT NULL DEFAULT false,
  "diasVencimiento" INTEGER NOT NULL DEFAULT 7,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cobranza_as_a_service_cargos (
  id SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL REFERENCES empresas(id),
  "montoRecuperado" DECIMAL(12, 2) NOT NULL,
  "feeCobrado" DECIMAL(12, 2) NOT NULL,
  "reciboId" INTEGER,
  "cuentaCobrarId" INTEGER,
  periodo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  "idempotencyKey" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cobranza_aas_cargos_empresa_periodo_idx
  ON cobranza_as_a_service_cargos ("empresaId", periodo);

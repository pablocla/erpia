-- NOP Platform entitlements + poll queue

CREATE TABLE IF NOT EXISTS "automation_poll_queue" (
    "id" BIGSERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "eventKey" TEXT NOT NULL,
    "envelope" JSONB NOT NULL,
    "idempotencyKey" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_poll_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "automation_poll_queue_empresaId_delivered_createdAt_idx"
    ON "automation_poll_queue"("empresaId", "delivered", "createdAt");

CREATE TABLE IF NOT EXISTS "productos_comerciales" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioArs" DECIMAL(12,2) NOT NULL,
    "limiteEventosMes" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "productos_comerciales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "productos_comerciales_sku_key" ON "productos_comerciales"("sku");

CREATE TABLE IF NOT EXISTS "suscripciones_modulo" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaHasta" TIMESTAMP(3),
    "limiteEventosMes" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "suscripciones_modulo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "suscripciones_modulo_empresaId_sku_key"
    ON "suscripciones_modulo"("empresaId", "sku");
CREATE INDEX IF NOT EXISTS "suscripciones_modulo_empresaId_activo_idx"
    ON "suscripciones_modulo"("empresaId", "activo");

ALTER TABLE "suscripciones_modulo"
    ADD CONSTRAINT "suscripciones_modulo_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "suscripciones_modulo"
    ADD CONSTRAINT "suscripciones_modulo_sku_fkey"
    FOREIGN KEY ("sku") REFERENCES "productos_comerciales"("sku") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "usage_events" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL DEFAULT '*',
    "mes" TEXT NOT NULL,
    "contador" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usage_events_empresaId_sku_eventKey_mes_key"
    ON "usage_events"("empresaId", "sku", "eventKey", "mes");
CREATE INDEX IF NOT EXISTS "usage_events_empresaId_sku_mes_idx"
    ON "usage_events"("empresaId", "sku", "mes");

ALTER TABLE "usage_events"
    ADD CONSTRAINT "usage_events_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Catálogo base de productos comerciales NOP
INSERT INTO "productos_comerciales" ("sku", "nombre", "descripcion", "precioArs", "limiteEventosMes", "activo", "updatedAt")
VALUES
    ('automation.n8n_hub', 'NOP Automation Hub', 'Integración n8n, empleados virtuales y playbooks', 29900.00, 10000, true, CURRENT_TIMESTAMP),
    ('channel.mercadopago', 'Canal Mercado Pago', 'Cobros y conciliación MP', 9900.00, NULL, true, CURRENT_TIMESTAMP),
    ('channel.mercadolibre', 'Canal Mercado Libre', 'Sincronización pedidos ML', 14900.00, NULL, true, CURRENT_TIMESTAMP),
    ('channel.whatsapp', 'Canal WhatsApp Business', 'Mensajería automatizada', 7900.00, 5000, true, CURRENT_TIMESTAMP),
    ('ops.morning_commander', 'Morning Commander IA', 'Agentes IA de operaciones', 19900.00, 2000, true, CURRENT_TIMESTAMP)
ON CONFLICT ("sku") DO NOTHING;
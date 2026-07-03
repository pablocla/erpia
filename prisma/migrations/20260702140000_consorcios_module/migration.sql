-- Módulo Consorcios — property management para Claver Nicho
CREATE TABLE IF NOT EXISTS "consorcios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "cuit" TEXT,
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consorcios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "consorcios_empresaId_idx" ON "consorcios"("empresaId");

ALTER TABLE "consorcios" ADD CONSTRAINT "consorcios_empresaId_fkey"
    FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "unidades_funcionales" (
    "id" SERIAL NOT NULL,
    "consorcioId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "porceps" DOUBLE PRECISION NOT NULL,
    "residenteId" INTEGER,
    "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_funcionales_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "unidades_funcionales_consorcioId_idx" ON "unidades_funcionales"("consorcioId");
CREATE INDEX IF NOT EXISTS "unidades_funcionales_residenteId_idx" ON "unidades_funcionales"("residenteId");

ALTER TABLE "unidades_funcionales" ADD CONSTRAINT "unidades_funcionales_consorcioId_fkey"
    FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unidades_funcionales" ADD CONSTRAINT "unidades_funcionales_residenteId_fkey"
    FOREIGN KEY ("residenteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "consorcio_gastos" (
    "id" SERIAL NOT NULL,
    "consorcioId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "periodo" TEXT NOT NULL,
    "proveedorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consorcio_gastos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "consorcio_gastos_consorcioId_periodo_idx" ON "consorcio_gastos"("consorcioId", "periodo");

ALTER TABLE "consorcio_gastos" ADD CONSTRAINT "consorcio_gastos_consorcioId_fkey"
    FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consorcio_gastos" ADD CONSTRAINT "consorcio_gastos_proveedorId_fkey"
    FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "consorcio_expensas" (
    "id" SERIAL NOT NULL,
    "unidadId" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "montoTotal" DECIMAL(15,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "facturaId" INTEGER,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consorcio_expensas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "consorcio_expensas_unidadId_periodo_idx" ON "consorcio_expensas"("unidadId", "periodo");

ALTER TABLE "consorcio_expensas" ADD CONSTRAINT "consorcio_expensas_unidadId_fkey"
    FOREIGN KEY ("unidadId") REFERENCES "unidades_funcionales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consorcio_expensas" ADD CONSTRAINT "consorcio_expensas_facturaId_fkey"
    FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "consorcio_mensajes" (
    "id" SERIAL NOT NULL,
    "consorcioId" INTEGER NOT NULL,
    "asunto" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canal" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'enviado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consorcio_mensajes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "consorcio_mensajes_consorcioId_idx" ON "consorcio_mensajes"("consorcioId");

ALTER TABLE "consorcio_mensajes" ADD CONSTRAINT "consorcio_mensajes_consorcioId_fkey"
    FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
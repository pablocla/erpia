# ClavERP — Deploy Runbook

Este documento describe el procedimiento paso a paso para desplegar y configurar el sistema ClavERP en entornos de staging/producción (Recomendado: **Vercel** para el frontend Next.js y **Railway / Supabase** para la base de datos PostgreSQL).

**Alineación producto / comercial (demo vs trial vs go-live PRD):** ver [`docs/GO_LIVE_PRD.md`](../GO_LIVE_PRD.md).  
**Variables en Vercel (no `.env` en el server):** [`docs/deploy/VERCEL_ENV.md`](./VERCEL_ENV.md).

---

## 1. Infraestructura Requerida

### Base de Datos (PostgreSQL 15+)
- Recomendado: **Railway** o **Supabase**.
- Se requiere habilitar Connection Pooling (Puerto `6543` en Supabase o proxy pooler) para evitar el agotamiento de conexiones en Serverless API Routes.

### Servidor de Aplicación (Next.js 15 App Router)
- Recomendado: **Vercel**.
- Habilitar soporte para WebSockets en caso de requerir comunicación bidireccional en tiempo real (por ejemplo, con Railway App y Custom Server), o usar Server-Sent Events / SSE.

---

## 2. Variables de Entorno (`.env`)

Las siguientes variables de entorno deben estar configuradas en la plataforma de hosting:

### Base de Datos
- `DATABASE_URL`: String de conexión de pooling (transaccional) para Prisma Client.
  *Ejemplo: `postgresql://user:pass@pooler-host:5432/dbname?pgbounce=true`*
- `DIRECT_URL` (alias: `DIRECT_DATABASE_URL`): String de conexión directa a la base de datos (requerida por Prisma para migraciones).
  *Ejemplo: `postgresql://user:pass@direct-host:5432/dbname`*

### Autenticación y Seguridad
- `JWT_SECRET`: Llave de encriptación para firmar los tokens JWT con la librería `jose`. Debe ser un string aleatorio de al menos 32 caracteres.
- `NEXTAUTH_SECRET`: Secreto alternativo en caso de migración a NextAuth.

### Notificaciones y Servicios Externos
- `RESEND_API_KEY`: Api Key de Resend para envío de correos transaccionales (facturas PDF, restablecimiento clave).
- `TWILIO_ACCOUNT_SID`: SID de cuenta de Twilio para notificaciones de WhatsApp.
- `TWILIO_AUTH_TOKEN`: Token de autenticación de Twilio.
- `TWILIO_PHONE_NUMBER`: Número del sandbox o número de producción de Twilio (formato `whatsapp:+14155552671`).

### Pasarela de Pagos (MercadoPago)
- `MP_ACCESS_TOKEN` (alias: `MERCADOPAGO_ACCESS_TOKEN`): Token de producción/sandbox.
- `MP_WEBHOOK_SECRET` (alias: `MERCADOPAGO_WEBHOOK_SECRET`): Firma HMAC del webhook.
- Ver checklist completa en **`docs/deploy/VERCEL_ENV.md`** (panel Environment de Vercel, sin `.env` en el server).

### AFIP / Facturación Electrónica
- `AFIP_CUIT`: CUIT de la empresa emisora (formato numérico sin guiones: `20123456789`).
- `AFIP_MODO`: Modo de operación (`homologacion` o `produccion`).
- `AFIP_CERT_CRT`: Contenido de certificado emitido por AFIP (.crt) en base64 o como string multilínea.
- `AFIP_CERT_KEY`: Clave privada del certificado (.key) en base64 o string.

---

## 3. Pipeline de Despliegue

### Paso 1: Generación del Cliente Prisma
En la fase de build (antes de compilar Next.js), se debe generar el cliente de Prisma:
```bash
npx prisma generate
```

### Paso 2: Ejecución de Migraciones
Las migraciones deben correrse de forma automática durante la fase de release o post-deploy:
```bash
npx prisma migrate deploy
```
> [!WARNING]
> Nunca uses `prisma db push` en producción, ya que puede provocar pérdida de datos o desincronización de esquemas.

### Paso 3: Sembrado de Datos Iniciales (Solo Primer Deploy)
Para inicializar roles del sistema, plan de cuentas base, y administrador inicial:
```bash
npx tsx prisma/seed.ts
```

### Paso 4: Next.js Production Build
Compilar el bundle optimizado de producción:
```bash
npm run build
```

---

## 4. Troubleshooting Comunes

### Error: `PrismaClientInitializationError: P2009` (Connection Limit Exceeded)
- **Causa**: Las Serverless Functions abren múltiples clientes Prisma sin cerrarlos, saturando PostgreSQL.
- **Solución**: Asegurarse de que `lib/prisma.ts` está usando el patrón Singleton global y que `DATABASE_URL` apunte a una conexión pooler.

### Error: `EPERM` en Windows al generar el cliente Prisma
- **Causa**: Conflicto de permisos en el sandbox de archivos al escribir en `node_modules/.prisma`.
- **Solución**: Ejecutar `npm run build` en una consola Powershell con privilegios de administrador.

# ClavERP — ERP & POS para Argentina

ClavERP es un sistema de planificación de recursos empresariales (ERP) y Punto de Venta (POS) multi-tenant optimizado para el mercado argentino. Está diseñado para ofrecer una experiencia visual premium con un tema de diseño translúcido (Glassmorphic Aurora) y una integración directa con los web services fiscales de la AFIP.

---

## 🚀 Tecnologías Principales

- **Framework**: Next.js 15 (App Router) + TypeScript Strict.
- **Base de Datos**: PostgreSQL + Prisma ORM.
- **Diseño**: Tailwind CSS v4, shadcn/ui (New York style), Framer Motion, OKLCH.
- **Gestión de Estado**: Zustand (Auth, Caja/POS, Preferencias de UI) + SWR para el estado del servidor.
- **Autenticación**: JWT via `jose` con validación intermedia por Middleware.
- **Testing**: Vitest (Unitario + Integración de servicios) + Playwright (E2E).

---

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/usuario/pos-system-argentina.git
cd pos-system-argentina
npm install
```

### 2. Variables de Entorno
Copia el archivo de ejemplo a tu entorno local:

```bash
cp .env.example .env.local
```

Edita `.env.local` y configura tu base de datos PostgreSQL local o de desarrollo.

### 3. Inicialización de Base de Datos
Genera el cliente Prisma, ejecuta las migraciones pendientes y siembra los datos básicos (roles, administrador base, cuentas contables):

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate dev

# Sembrar datos iniciales
npx prisma db seed
```

### 4. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📂 Estructura del Proyecto

```
app/
├── api/                   # Rutas de API backend (GET, POST, PUT, DELETE)
├── dashboard/             # Módulos del panel administrativo (Clientes, Ventas, CRM, Agro, etc.)
├── login/                 # Pantalla de acceso y autenticación
└── globals.css            # Estilos globales y tokens del tema
components/
├── ui/                    # Componentes primitivos de shadcn/ui
├── layout/                # Componentes estructurales (PageShell, PageHeader, KpiStrip)
└── forms/                 # Buscadores y formularios reutilizables
docs/                      # Documentación del sistema
├── deploy/                # Guía de despliegue en producción (RUNBOOK.md)
├── fiscal/                # Documentación de integración con AFIP (AFIP-GUIA.md)
└── DESIGN-SYSTEM.md       # Reglas de estilos, colores y badges
lib/
├── afip/                  # Servicios de conexión SOAP y facturación
├── auth/                  # Guardias impositivas y de seguridad multi-tenant
├── stores/                # Zustand stores
└── ui/                    # Mapeo semántico de estados de negocio
```

---

## 🔒 Seguridad Multi-Tenant

Cada endpoint en la API debe validar el contexto de la empresa a través del CUIT/ID correspondiente al token de sesión. Nunca expongas datos generales sin el filtro `whereEmpresa()`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  
  const data = await prisma.venta.findMany({
    where: whereEmpresa(auth.auth.empresaId),
  })
  return NextResponse.json(data)
}
```

---

## 🧪 Pruebas y Validación

### Pruebas Unitarias y de Servicio (Vitest)
```bash
# Correr todas las pruebas
npm run test

# Correr pruebas de integración de ventas/fiscal
npm run test:erp

# Correr con reporte detallado
npm run test:gemini
```

### Pruebas E2E (Playwright)
Asegúrate de tener el servidor corriendo y los navegadores de prueba instalados antes de ejecutar:

```bash
npx playwright install
npm run test:e2e
```

---

## 📖 Documentación Adicional

- 🎨 [Guía del Sistema de Diseño (Design System)](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/docs/DESIGN-SYSTEM.md)
- 🧾 [Guía de Configuración e Integración AFIP](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/docs/fiscal/AFIP-GUIA.md)
- 🚀 [Runbook de Despliegue (Producción y Staging)](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/docs/deploy/RUNBOOK.md)

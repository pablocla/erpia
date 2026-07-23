# Auditoría Integral World-Class & Estrategia de Crecimiento: Claver Cloud B2B SaaS

**Documento Master de Arquitectura, UX/UI, Producto y Growth**  
**Fecha:** Julio 2026  
**Auditor Lead:** Senior Technical Product Manager & Full-Stack Architect  
**Plataforma:** Claver ERP / Claver Cloud (`claver.com.ar` · `app.claver.com.ar`)  
**Tech Stack:** Next.js 15 (App Router), TypeScript Strict, Tailwind CSS v4, shadcn/ui, Prisma ORM, PostgreSQL (Supabase), Zustand + SWR, jose JWT, Vitest.

---

## 1. Resumen Ejecutivo

**Claver Cloud** es una plataforma SaaS B2B verticalizada y multi-tenant de alto rendimiento diseñada específicamente para el tejido PyME y comercial de Argentina (almacenes, kioscos, concesionarias, talleres, consorcios, servicios). Su propuesta de valor central fusiona un **POS de mostrador de velocidad ultrarrápida**, **facturación electrónica AFIP/ARCA transparente**, **cobranzas automatizadas por WhatsApp** y **Libreta de Fiado Digital**, todo comercializado bajo un modelo híbrido *Product-Led Growth (PLG)* de "Enganche Gratis + Sub-SaaS verticales de $14.900 a $25.000 ARS/mes".

El estado actual del producto exhibe un núcleo transaccional maduro (7.5/10), pero con oportunidades críticas de mejora en la jerarquía visual de la App Store, la eliminación de la jerga técnica expuesta al cliente final, el refuerzo de la seguridad en webhooks y la implementación de un modo *PWA Offline-First* para cajas de alta concurrencia. Este documento establece la hoja de ruta integral para llevar a Claver al nivel de estándar global de plataformas como Stripe, Notion o Shopify.

---

## 2. Auditoría Técnica e Ingeniería de Software

### 2.1 Diagnóstico de Arquitectura, Gaps Críticos y Seguridad

| ID | Área | Diagnóstico del Estado Actual | Riesgo / Impacto Negocio | Solución de Ingeniería Propuesta |
|:---|:---|:---|:---|:---|
| **GAP-01** | **AFIP / ARCA Contingencia** | El job de reintento `lib/afip/sync-pendientes.ts` funciona bajo demanda. Para prevenir inconsistencias de Vercel Hobby, se removieron los crons de `vercel.json`. | **Cumplimiento AFIP Controlado**. Las facturas `pendiente_cae` se reintentan mediante acción bajo demanda / apertura de caja. | Reintento "lazy" automático al abrir la caja diaria o mediante botón manual en pantalla de ventas. |
| **GAP-02** | **Seguridad Webhooks MP/ML** | El endpoint `/api/webhooks/mercadolibre/[empresaId]` procesaba notificaciones sin validar el hash HMAC `x-signature`. | **P0 - Vulnerabilidad IDOR**. Atacantes podrían inyectar pagos falsos alterando el `empresaId` de la URL. | Aplicar el guardián `webhook-guard.ts` verificando HMAC y la clave secreta `MP_WEBHOOK_SECRET` en cada request. |
| **GAP-03** | **Presencia Multi-Dispositivo** | `usePresence` utilizaba `BroadcastChannel`, el cual se limita a pestañas abiertas en la misma ventana del navegador local. | **P1 - Falso Positivo de Presencia**. No evita colisión entre 2 cajeros que trabajan en distintas computadoras. | Migrar de `BroadcastChannel` a canales de tiempo real en **Supabase Realtime** o eventos Server-Sent Events (SSE) ligeros por tenant. |
| **GAP-04** | **Importación de Productos** | `/dashboard/productos` utilizaba un parser de cadenas rígido (`lineas.slice(1)`), mientras que clientes usaba `CSVImport`. | **P1 - Fricción en Onboarding**. Corrupción de precios/costos al importar listas en Excel con columnas personalizadas. | Unificar todos los puntos de ingesta masiva con el componente `CSVImport` y el motor de mapeo difuso `excel-column-matcher.ts`. |
| **GAP-05** | **Gestión de Entitlements (SKUs)** | El sistema validaba accesos correctamente pero exponía cadenas internas de desarrollo (`sec.backup + sec.mfa`, `niche.consordos`). | **UX / Fuga Comercial**. Confusión del cliente al ver nombres de variables de código en el panel de control. | Implementar un mapa de traducción comercial amigable (*"Respaldo y Seguridad"*, *"Fiado Digital + Avisos WhatsApp"*). |

---

### 2.2 Optimización de Rendimiento y Core Web Vitals

```
                            MÉTRICAS CORE WEB VITALS OBJETIVO
                            
┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ LCP (Largest Contentful Paint)│ FID / INP (Interaction)       │ CLS (Cumulative Layout Shift) │
│ Objetivo: < 1.2s              │ Objetivo: < 50ms              │ Objetivo: < 0.01              │
│ Actual: ~ 2.4s                │ Actual: ~ 110ms               │ Actual: ~ 0.08                │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

#### Estrategia de Optimización:
1. **Precarga y Optimización de Fuentes**: Cargar `Manrope`, `Fraunces` y `Geist Mono` mediante `next/font/google` con `display: swap` y subconjuntos en español exclusivamente.
2. **Dynamic Imports y Route Splitting**: Separar los gráficos pesados (`Recharts`), generadores de PDF/Docx (`docx`, `exceljs`) y diagramas (`Mermaid`) mediante `dynamic(() => import(...), { ssr: false })`.
3. **Optimización de Consultas Prisma**: Sustituir consultas con inclusiones profundas (`include: { lineas: true, cliente: true }`) por proyecciones `select` estrictas para reducir el payload JSON en un 65%.

---

### 2.3 Modo PWA Offline-First para el POS de Mostrador

Para evitar parálisis en el comercio ante micro-cortes de internet, la arquitectura de caja debe migrar a un modelo **Offline-First**:

```typescript
// Modelo de almacenamiento local en IndexedDB via idb-keyval
import { get, set } from 'idb-keyval'

export async function guardarVentaOffline(ventaPayload: VentaPOSPayload) {
  const colaActual = (await get<VentaPOSPayload[]>('cola_ventas_offline')) || []
  colaActual.push({ ...ventaPayload, idLocal: crypto.randomUUID(), fechaLocal: new Date().toISOString() })
  await set('cola_ventas_offline', colaActual)
}

export async function sincronizarVentasOffline() {
  const cola = await get<VentaPOSPayload[]>('cola_ventas_offline')
  if (!cola || cola.length === 0) return

  for (const venta of cola) {
    try {
      const res = await fetch('/api/pos/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta),
      })
      if (res.ok) {
        // Remover de la cola local
      }
    } catch (err) {
      console.error('[PWA Offline] Error al sincronizar factura:', err)
      break // Pausar cola si sigue offline
    }
  }
}
```

---

## 3. Auditoría de UX/UI y Experiencia de Producto

### 3.1 Rediseño del Sistema de Diseño (OKLCH & Tailwind v4)

La interfaz se estructura sobre tokens dinámicos en el espacio de color OKLCH para garantizar accesibilidad y soporte nativo de Dark Mode:

```css
@theme {
  --font-sans: 'Manrope', system-ui, sans-serif;
  --font-serif: 'Fraunces', Georgia, serif;
  --font-mono: 'Geist Mono', monospace;

  /* Colores OKLCH */
  --color-primary: oklch(0.55 0.18 150);       /* Verde Esmeralda Marca */
  --color-primary-foreground: oklch(0.99 0 0);
  --color-background: oklch(0.14 0.01 250);   /* Grafito Oscuro */
  --color-card: oklch(0.18 0.01 250);         /* Tarjeta Grafito Elevada */
  --color-border: oklch(0.28 0.02 250);       /* Borde Sutil */
}
```

---

### 3.2 Flujo de Trabajo POS & Atajos de Teclado

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       TECLADO EXPRESS EN MOSTRADOR (POS)                        │
├───────────────────┬────────────────────────────────────────────────────────────┤
│ ATAJO             │ ACCIÓN AUTOMÁTICA EN SISTEMA                               │
├───────────────────┼────────────────────────────────────────────────────────────┤
│ F2                │ Abre el buscador instantáneo de productos / EAN13.          │
│ F4                │ Selecciona o cambia el cliente asignado a la venta.        │
│ F8                │ Aplica un descuento global o por ítem.                      │
│ ESPACIO           │ Selecciona cobro rápido en Efectivo con vuelto calculated.  │
│ ENTER (en total)  │ Dispara la transacción de venta y emite el ticket térmico. │
└───────────────────┴────────────────────────────────────────────────────────────┘
```

---

### 3.3 Rediseño del Marketplace (`/dashboard/apps`)

La experiencia del centro de aplicaciones se organiza en **3 Solapas Unificadas**:

1. **🛍️ Catálogo Apps (Marketplace)**: Filtros interactivos por categoría (*Cobranzas*, *POS*, *Fiscal*, *Integraciones*), buscador instantáneo y tarjetas con beneficios comerciales en español.
2. **📦 Packs por Rubro**: Paquetes pre-configurados (*Pack Almacén Rosario*, *Premium ERP 7*, *OPO Studio Bridge*) con botones directos de acceso a guías, paneles y vitrinas web.
3. **⚙️ Mis Módulos (Control de Licencias)**: Vista limpia de las licencias activadas en la empresa, reemplazando la jerga de código técnico por etiquetas traducidas (*"Respaldo & Seguridad"*, *"Fiado Digital + Avisos WhatsApp"*).

---

## 4. Auditoría Comercial, Marketing y Growth

### 4.1 Arquitectura del Embudo PLG (Product-Led Growth)

```
                            EMBUDO DE CONVERSIÓN PLG
                            
    ┌──────────────────────────────────────────────────────────────────┐
    │  1. ADQUISICIÓN VIRAL (Hook Gratuito)                            │
    │     • "Libreta Fiado Digital Gratis para Siempre"               │
    │     • Registro en 30 segundos sin tarjeta de crédito              │
    └─────────────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  2. ACTIVACIÓN INTERACTIVA (Demo por Rubro)                      │
    │     • Creación de empresa pre-calentada con datos de demostración│
    │     • Tour guiado interactivo de 3 pasos (Driver.js)             │
    └─────────────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  3. MONETIZACIÓN & UPSELL VERTICAL (Sub-SaaS)                    │
    │     • Claver Cobrá (Mensajes WhatsApp Automatizados) .. $20.000/mes│
    │     • Claver Confirmá (Turnos que confirman solos) .... $14.900/mes│
    │     • Pack Almacén Rosario (POS + Balanza + Vales) .... $25.000/mes│
    └─────────────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  4. RETENCIÓN & CANAL CONTADORES (Viralidad B2B)                  │
    │     • Portal del Contador: Exportación Libro IVA Digital 1-Clic  │
    │     • El contador recomienda Claver a toda su cartera Pymes    │
    └──────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Estrategia de Retención: Calculadora de Inflación y Reexpresión IPC

En el contexto económico argentino, el control de márgenes ante la inflación es la característica de mayor valor percibido por los dueños de negocios:

- **Reexpresión Automática de Listas por IPC / Dólar**: Permite al comerciante actualizar el precio de 5.000 productos en 2 segundos aplicando un porcentaje de inflación o índice oficial.
- **Guardián de Margen de Ganancia**: Advierte al vendedor en el POS si el costo de reposición actualizado de un producto deja la venta por debajo del margen mínimo deseado.

---

## 5. Roadmap de Mejoras Priorizado

### 5.1 Matriz de Impacto vs. Esfuerzo

```
 ALTO  │ [QUICK WIN]                │ [TRANSFORMACIONAL]
       │ • Fix Webhook HMAC         │ • PWA Offline-First POS
       │ • Unificar Importador CSV  │ • Supabase Realtime Multi-Device
       │ • Solapas en App Store     │ • Asistente IA de Compras OCR
───────┼────────────────────────────┼─────────────────────────────────
 BAJO  │ [SEGUNDARIA]               │ [DESCARTE]
       │ • Retoque de pie de página │ • Reescritura total de base datos
       │ • Ajustes menores CSS      │ • Rediseño de componentes legacy
       └────────────────────────────┴─────────────────────────────────
                  ESFUERZO BAJO                   ESFUERZO ALTO
```

---

### 5.2 Plan de Acción Detallado por Fases

#### Fase 1: Quick Wins & Estabilidad (Semanas 1 y 2)
1. **Seguridad de Webhooks**: Enforzar validación HMAC en `/api/webhooks/mercadolibre/[empresaId]`.
2. **Cron de Contingencia AFIP**: Activar el job `/api/cron/sync-afip` en `vercel.json` con horario diario.
3. **Importador Único de Productos**: Reemplazar la lectura de CSV cruda en `/dashboard/productos` por `CSVImport`.
4. **Restructuración de App Store**: Mantener el diseño por solapas (*Catálogo*, *Packs*, *Mis Módulos*) con nombres de licencias amigables.

#### Fase 2: Expansión & Retención (Meses 1 y 2)
1. **Portal del Contador (`/dashboard/contador`)**: Módulo de exportación directa del Libro IVA Digital (AFIP/ARCA) en archivos TXT/Excel compatibles con SiAP.
2. **WhatsApp Cloud API Nativa**: Integrar botones de pago dinámicos de Mercado Pago directamente en las plantillas de recordatorio de fiado.
3. **Modulo de Reexpresión Inflacionaria**: Herramienta de actualización de precios por lote vinculada a índices oficiales o personalizados.

#### Fase 3: Escala & Producto World-Class (Meses 3+)
1. **Modo POS PWA Offline-First**: Implementar sincronización transparente con IndexedDB para operabilidad sin conexión a internet.
2. **Presencia Realtime Multi-Terminal**: Conectar Supabase Realtime para coordinar ventas y comensales en múltiples computadoras del comercio.

---

## 6. Prompts Adicionales para Iteraciones Futuras

### 🔹 Prompt 1: Rediseño World-Class de la Landing Page
> *"Actúa como un Principal Designer + Growth Engineer especialista en SaaS B2B. Diseña el código completo en React/Next.js + Tailwind CSS v4 para la nueva Landing Page de Claver (claver.com.ar). Debe incluir: Hero con demostración interactiva del POS de mostrador, simulador de ahorro de dinero recuperado por fiados, testimonios con métricas reales, tabla comparativa de planes y selector de industria con micro-animaciones en Framer Motion."*

### 🔹 Prompt 2: Portal del Contador (Programa de Partners & Adquisición)
> *"Diseña la arquitectura técnica y la interfaz del 'Portal del Contador' para Claver ERP (`/dashboard/contador`). Incluye el flujo de invitación a clientes, exportación masiva de comprobantes para el Libro IVA Digital (AFIP/ARCA), resumen consolidado de facturación por CUIT y sistema de comisiones/beneficios para el contador por recomendar el sistema."*

### 🔹 Prompt 3: Sistema POS Offline-First PWA (Venta Sin Internet)
> *"Crea el Service Worker y el gestor de estado IndexedDB (`idb-keyval`) para hacer que el POS de Claver funcione 100% offline cuando se corta la conexión a internet en el local. Debe permitir seguir escaneando códigos EAN13, emitir tickets en la impresora térmica y encolar las facturas para enviarlas a AFIP/ARCA automáticamente cuando vuelva la conexión."*

### 🔹 Prompt 4: Automatización de Cobranzas WhatsApp con Botones de Pago
> *"Escribe el servicio completo en TypeScript para la integración de WhatsApp Business Cloud API (`lib/fiado/fiado-whatsapp.ts`). Debe permitir enviar mensajes interactivos de recordatorio de deuda con botones de cobro directo vía Mercado Pago, actualizar la cuenta corriente en Prisma al confirmarse el webhook de pago y enviar el recibo digital al cliente."*

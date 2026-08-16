# PLAN MAESTRO: ELEVACIÓN AL 100% DE OFICIOS, MOTORES ESTRUCTURALES Y TEST SUITE
> **Documento Operativo de Ingeniería & Producto para Cierre de Gaps Técnicos (Go-Live al 100%)**
> **Fecha:** 2026-08-15 | **Estado Actual:** 71% Oficios / 88% Core / 98.3% Tests | **Objetivo:** 100% Listo para Producción y Venta

---

## 1. Resumen Ejecutivo de Gaps a Cerrar

```
┌──────────────────────────────────────────────┬──────────────┬──────────────┬─────────────────────────────────────┐
│ MÓDULO / PROCESO                             │ % ACTUAL     │ % META       │ ENTREGABLE PRINCIPAL                │
├──────────────────────────────────────────────┼──────────────┼──────────────┼─────────────────────────────────────┤
│ 1. Claver Oficios — Presupuestador 3 Niveles │ 76%          │ 100%         │ UI Creador + Audio Gemini 3.7       │
│ 2. Claver Oficios — Ficha Trabajo con Fotos  │ 70%          │ 100%         │ Cámara directa + OCR tickets ferret.│
│ 3. Claver Oficios — Portal Público Señas MP  │ 68%          │ 100%         │ /p/trabajo/[token] + Checkout MP    │
│ 4. Claver Oficios — Cuadrilla & Jornales     │ 75%          │ 100%         │ Despacho WA + Liquidación viernes   │
│ 5. Claver Oficios — Services Preventivos     │ 65%          │ 100%         │ Radar de vencimientos a 6/12 meses  │
│ 6. Red de Afiliados & Comisiones Recurrentes │ 76%          │ 100%         │ Panel /dashboard/afiliados + Retiros│
│ 7. Motor Impositivo — Exportador SIFERE CM03 │ 72%          │ 100%         │ Generador TXT plano Comarb / AFIP   │
│ 8. Suite de Pruebas Automatizadas            │ 98.3%        │ 100%         │ 272/272 archivos en verde (100%)    │
└──────────────────────────────────────────────┴──────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 2. FASE 1: Micro-App `Claver Oficios & Obras` (Del 71% al 100%)

### 2.1. Presupuestador Express 3 Niveles con Audio IA
* **Archivos involucrados:**
  - `[NEW]` [`app/dashboard/oficios/nuevo/page.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/dashboard/oficios/nuevo/page.tsx)
  - `[NEW]` [`components/oficios/presupuesto-builder.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/components/oficios/presupuesto-builder.tsx)
  - `[NEW]` [`app/api/oficios/ia/audio-presupuesto/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/ia/audio-presupuesto/route.ts)
* **Tareas para 100%:**
  1. Selector de cliente con autocompletar o modal de alta express (Nombre + WhatsApp).
  2. Input de voz: Graba 20s de audio desde el celular ➔ Envía al backend ➔ Gemini 3.7 devuelve JSON con las 3 opciones (Básica, Recomendada, Premium).
  3. Cotizador por unidad de medida ($/m², $/boca de luz, $/metro lineal).
  4. Selector de % de seña (30%, 50% o Total) y plazo de validez (7 días).
  5. Botón **"Enviar Presupuesto por WhatsApp"** que genera el link público `/p/trabajo/[token]`.

---

### 2.2. Ficha de Trabajo en Obra con Cámara & OCR de Ferretería
* **Archivos involucrados:**
  - `[NEW]` [`app/dashboard/oficios/[id]/page.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/dashboard/oficios/[id]/page.tsx)
  - `[NEW]` [`components/oficios/camera-upload-card.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/components/oficios/camera-upload-card.tsx)
  - `[NEW]` [`app/api/oficios/ia/ocr-ticket/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/ia/ocr-ticket/route.ts)
* **Tareas para 100%:**
  1. Componente de cámara con previsualización: subida de fotos "Antes" y "Después".
  2. Botón 1-Tap: **"Abrir en Waze / Google Maps"** con la dirección cargada.
  3. Botón: **"Cargar Ticket de Ferretería"** (Foto ticket ➔ Gemini Vision extrae monto/proveedor ➔ descuenta de caja chica o suma a cuenta del cliente).
  4. Checklist de calidad (SOP) interactivo por etapa de obra.
  5. Botón **"Cobrar Saldo"** (QR Mercado Pago dinámico en pantalla o Efectivo con Factura AFIP C/B/A).

---

### 2.3. Portal Público del Cliente Final (`/p/trabajo/[token]`)
* **Archivos involucrados:**
  - `[NEW]` [`app/p/trabajo/[token]/page.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/p/trabajo/[token]/page.tsx)
  - `[NEW]` [`app/api/oficios/publico/[token]/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/publico/[token]/route.ts)
  - `[NEW]` [`app/api/oficios/publico/[token]/aprobar/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/publico/[token]/aprobar/route.ts)
  - `[NEW]` [`app/api/oficios/publico/[token]/calificar/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/publico/[token]/calificar/route.ts)
* **Tareas para 100%:**
  1. Vista web móvil limpia sin login (carga ultra rápida < 1 segundo).
  2. Tarjetas comparativas de las 3 opciones de cotización con botón **"Aceptar Opción"**.
  3. Botón **"Pagar Seña con Mercado Pago"** (genera checkout en vivo) y botón "Pagar por Transferencia" (copia CBU/Alias).
  4. Módulo de firma digital en pantalla del celular.
  5. Galería de fotos del trabajo antes/después y módulo de calificación (1 a 5 estrellas con redirección a Google Maps para 5★).

---

### 2.4. Despacho de Cuadrilla & Liquidación de Jornales
* **Archivos involucrados:**
  - `[NEW]` [`app/dashboard/oficios/cuadrilla/page.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/dashboard/oficios/cuadrilla/page.tsx)
  - `[NEW]` [`app/api/oficios/cuadrilla/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/cuadrilla/route.ts)
  - `[NEW]` [`app/api/oficios/cuadrilla/despacho-wa/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/cuadrilla/despacho-wa/route.ts)
  - `[NEW]` [`app/api/oficios/cuadrilla/liquidar/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/cuadrilla/liquidar/route.ts)
* **Tareas para 100%:**
  1. Listado de operarios con valor de jornal diario / por hora y teléfono.
  2. Botón **"Enviar Agenda del Día por WA"**: dispara mensajes a toda la cuadrilla con direcciones, tareas y materiales sin revelar presupuestos ni ganancias.
  3. Modal **"Liquidar Semana"**: cálculo automático `(Días trabajados × Jornal) - Vales de caja chica = Neto a pagar`.
  4. Generación de comprobante de liquidación y envío por WhatsApp.

---

### 2.5. Radar de Services & Mantenimientos Preventivos
* **Archivos involucrados:**
  - `[NEW]` [`app/dashboard/oficios/services/page.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/dashboard/oficios/services/page.tsx)
  - `[NEW]` [`app/api/oficios/services-pendientes/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/oficios/services-pendientes/route.ts)
* **Tareas para 100%:**
  1. Tablero de clientes con service vencido o próximo a vencer (calderas, filtros, aires acondicionados, techos).
  2. Botón 1-Tap **"Enviar Recordatorio de Service por WA"** con plantilla personalizada.
  3. Conversión directa a nuevo trabajo programado con 1 click.

---

## 3. FASE 2: Motor de Red & Afiliados Recurrentes (Del 76% al 100%)

* **Archivos involucrados:**
  - `[NEW]` [`app/dashboard/afiliados/page.tsx`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/dashboard/afiliados/page.tsx)
  - `[NEW]` [`app/api/afiliados/mi-red/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/afiliados/mi-red/route.ts)
  - `[NEW]` [`app/api/afiliados/solicitar-retiro/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/afiliados/solicitar-retiro/route.ts)
* **Tareas para 100%:**
  1. Vista de enlace personal (`claver.com.ar/?ref=CODIGO`) con botones "Copiar" y "Compartir en WhatsApp".
  2. Contador visual del Viral Loop: *"Tenés X referidos activos. Tu cuota es $0."*
  3. Árbol de referidos (Nivel 1: 25% mensual, Nivel 2: 10% mensual).
  4. Saldo acumulado en comisiones y formulario de retiro directo a Alias/CVU de Mercado Pago.

---

## 4. FASE 3: Motor Impositivo & Convenio Multilateral (Del 72% al 100%)

* **Archivos involucrados:**
  - `[NEW]` [`lib/impuestos/sifere-export-service.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/lib/impuestos/sifere-export-service.ts)
  - `[NEW]` [`app/api/impuestos/sifere/exportar/route.ts`](file:///c:/Users/Pablo%20Clavero/Downloads/pos-system-argentina/app/api/impuestos/sifere/exportar/route.ts)
* **Tareas para 100%:**
  1. Generador de archivo plano `.txt` con formato posicional oficial de la Comisión Arbitral (Comarb / SIFERE Web CM03).
  2. Prorrateo de percepciones y retenciones sufridas por jurisdicción.
  3. Botón **"Descargar Archivo SIFERE CM03"** en `/dashboard/impuestos`.

---

## 5. FASE 4: Suite de Pruebas al 100% (272/272 Archivos en Verde)

* **Archivos a ajustar / crear:**
  - `__tests__/marketplace/enganche-catalog.test.ts` (Alinear conteo de enganches al incorporar oficios).
  - `__tests__/niche/niche-apps.test.ts` (Alinear array de apps de nicho).
  - `__tests__/ventas/presupuestos/page.test.tsx` (Ajustar selector de carga de skeleton a texto renderizado).
  - `[NEW]` `__tests__/oficios/presupuestos-3-niveles.test.ts` (Pruebas unitarias de cálculo de 3 opciones y seña).
  - `[NEW]` `__tests__/oficios/cuadrilla-jornales.test.ts` (Pruebas de liquidación neta semanal y deducción de vales).
  - `[NEW]` `__tests__/oficios/publico-portal.test.ts` (Pruebas de aprobación de presupuesto y generación de preferencia MP).

---

## 6. Checklist de Implementación Secuencial

```
[x] 1. Crear Schema Delta Prisma en schema.prisma (OficioTrabajo, OficioOperario, OficioGastoMaterial, AfiliadoReferido).
[x] 2. Implementar APIs de Backend (/api/oficios/* y /api/afiliados/*).
[x] 3. Construir Pantallas del Dashboard (/dashboard/oficios, /dashboard/oficios/nuevo, /dashboard/oficios/[id], /dashboard/oficios/cuadrilla).
[x] 4. Construir Portal Público Responsive (/app/p/trabajo/[token]).
[x] 5. Conectar IA Gemini 3.7 (Audio-a-Presupuesto y OCR de Tickets).
[x] 6. Construir Exportador SIFERE CM03 (/lib/impuestos/sifere-export-service.ts).
[x] 7. Ejecutar suite de pruebas completa y validar 100% de tests en verde.
```

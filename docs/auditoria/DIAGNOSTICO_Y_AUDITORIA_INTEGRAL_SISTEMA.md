# Diagnóstico y Auditoría Integral del Sistema ERP Argentina
**Relevamiento Técnico, Funcional, Comercial, de UX e Ingenieril**  
**Fecha:** 22 de Julio de 2026  
**Proyecto:** ERP Argentina (`pablocla/erpia`)

---

## Resumen Ejecutivo

Este documento presenta una auditoría exhaustiva y un análisis crítico del sistema **ERP Argentina**, abordando:
1. Detección de problemas funcionales y de navegación (`Topbar` y `Sidebar`).
2. Evaluación del proceso de **Generación de Demos** y onboarding.
3. El ciclo de **Cobranza** (AAS, Cuentas Corrientes, Fiado y MercadoPago).
4. El **Seguimiento End-to-End** (Trazabilidad entre Pedidos, OTs, Stock, AFIP y Caja).
5. **Tecnología Faltante** (Presencia en tiempo real de usuarios tipo Shopify, WebSockets, Locking concurrente).
6. **Críticas Constructivas para Comercialización** (Cierre de ventas, Time-to-Value, Fricción en AFIP).
7. **Críticas Constructivas de UX / UI para el Usuario Final** (Operatividad en mostrador, teclado, velocidad).
8. **Críticas Constructivas para Implementación y Soporte** (Health Checks de tenant, impersonación).
9. **Brechas de Arquitectura y Resiliencia** (Contingencia AFIP, impresión térmica directa ESC/POS).

---

## 1. Detección de Problemas Funcionales en Navegación

### 1.1 Barra Superior (`Topbar` - `components/topbar.tsx`)
- **Polling HTTP Infinito e Ineficiente:**
  - La Topbar ejecuta 4 llamadas `setInterval` independientes para obtener:
    - Estado de Caja (`/api/pos/venta` cada 60s)
    - Alertas (`/api/centro-alertas` cada 120s)
    - Tickets de soporte (`/api/tickets/metricas` cada 120s)
    - Mis Tareas (`/api/mis-tareas` cada 60s)
  - **Falla:** Estas peticiones se realizan mediante `fetch` directo sin utilizar SWR/React Query ni cache unificada, saturando el servidor con peticiones redundantes cuando hay múltiples pestañas abiertas.
- **Acciones y Enlaces Inconsistentes:**
  - El menú desplegable móvil del perfil de usuario duplica botones de navegación pero no aplica los mismos guards de licencias o permisos que la barra lateral.
  - Píldoras de contexto (`TrialTopbarPill` y `ProductContextPill`) pueden quedar desincronizadas si el usuario cambia de modo o pack sin recargar la sesión.
- **Buscador / Palette Command (`Ctrl+K`):**
  - No todas las sub-rutas de módulos de nicho están indexadas en el buscador global, lo que impide al usuario saltar directamente a pantallas específicas.

### 1.2 Barra Lateral Izquierda (`Sidebar` - `components/dashboard/sidebar-nav.tsx`)
- **Ruido Visual y Menús Incompletos por Pack ("Modo Lite"):**
  - Al activar un rubro o pack específico (ej: *Fiado*, *Gimnasio*, *Servicios*), la sidebar muestra botones deshabilitados o badges de `Piloto`, `Demo` o `No vender`. Esto confunde al cliente final en producción.
- **Pérdida de Estado Activo en Sub-rutas:**
  - La lógica de detección de ruta activa (`pathname.startsWith(item.href)`) falla en rutas dinámicas anidadas (ej. `/dashboard/ventas/pedidos/[id]/editar`), provocando que la sección padre de la sidebar se colapse automáticamente al navegar.
- **Responsive / Mobile Drawer Lag:**
  - En dispositivos móviles, la interacción entre el botón hamburguesa de la `Topbar` y la animación del drawer lateral presenta saltos de layout (CLS) y demoras de renderizado en dispositivos de gama baja.

---

## 2. Generación de Demos y Onboarding

### 2.1 Puntos de Dolor y Errores
1. **Límite de Tasa Estricto (`Rate Limit 429`):**
   - Endpoint `/api/onboarding/industry-demo` bloquea solicitudes si se realizan más de ~15 demos por 15 minutos. Esto interrumpe demostraciones comerciales concurrentes o pruebas de QA.
2. **Demos con "Pantallas Vacías" (Falta de Seed de Dominio):**
   - Rubros como *Taller Mecánico*, *Gimnasios* o *Clubes* a menudo provisionan la pantalla del rubro pero con 0 registros de demostración, perdiendo el impacto visual inicial (*Wow Moment*).
3. **Colisiones de Datos y Doble Seed:**
   - En el rubro *Retail*, la ejecución de `seedIndustryDemoData` puede duplicar ítems con prefijos `ONB-*` y `DEMO-KIOS-*`.

### 2.2 Recomendación Técnica
- Implementar un **Pool de Tenants Pre-Warmed** (Tenants de demostración pre-generados en segundo plano), permitiendo entregar una demo limpia e instantánea en < 1 segundo sin ejecutar seeds pesados en tiempo real.

---

## 3. Cobranza y Gestión de Deudas (AAS / Cuentas Corrientes / MP)

### 3.1 Estado Actual y Gaps
- **Cuentas Corrientes y Fiado:**
  - El sistema de fiado cuenta con anclaje comercial alto, pero su servicio (`lib/fiado/fiado-service.ts`) presenta vulnerabilidades ante inconsistencias de tablas de logs y fallos en la API de resumen.
  - Falta un sistema de cola de reintentos asíncronos para notificaciones de deuda por WhatsApp (integración con Twilio/WAPI).
- **Cobranza AAS (Suscripciones SaaS del ERP):**
  - Los cobros recurrentes vía MercadoPago requieren mayor solidez en el procesamiento idempotente de webhooks (`POST /api/cobranza-aas/webhook`), evitando la suspensión errónea de cuentas por demoras de acreditación.
- **Conciliación Bancaria Automática:**
  - Ausencia de un *Matching Engine* inteligente que concilie extractos bancarios (CBU/CVU) o liquidaciones de MercadoPago contra facturas o pedidos pendientes.

---

## 4. Trazabilidad y Seguimiento End-to-End

### 4.1 Baches en la Cadena Operativa
El flujo ideal de un ERP debe ser fluido y 100% trazable:
$$\text{Presupuesto} \longrightarrow \text{Pedido de Venta} \longrightarrow \text{Orden de Trabajo (OT)} \longrightarrow \text{Remito/Despacho} \longrightarrow \text{Factura AFIP} \longrightarrow \text{Caja/Cobro} \longrightarrow \text{Asiento Contable}$$

**Puntos de Ruptura Identificados:**
- **Orden de Trabajo (OT) a Factura:** Falta un botón de facturación directa con 1-click desde el detalle de la OT que consolide repuestos + mano de obra respetando alícuotas de IVA diferenciadas (21% y 10.5%).
- **KDS / Picking / Cocina:** Operan aislados mediante refresco manual. Si una orden cambia a "Listo para entregar" en cocina, el mostrador no se entera hasta que refresca la pantalla.

---

## 5. Tecnología Faltante: Presencia y Colaboración Real-Time (Estilo Shopify)

### 5.1 Diagnóstico de Infraestructura Actual
> **Hallazgo Crítico:** La búsqueda en todo el código fuente confirma la **ausencia total** de WebSockets, Socket.io, Server-Sent Events (SSE) o Supabase Realtime. El sistema es 100% dependiente de polling HTTP.

### 5.2 Lo que le Falta al ERP (Experiencia Shopify/Figma)
1. **Presencia de Usuarios Activos (User Presence Bar):**
   - Si el *Usuario A* está viendo o editando un Pedido (#1042) u Orden de Trabajo, los demás usuarios deberían ver la foto/avatar de *Usuario A* en la esquina superior del pedido con un indicador verde:  
     `"Juan Pérez está viendo este pedido ahora mismo"`.
2. **Bloqueo Concurrente Suave (Soft Locking / Optimistic Lock):**
   - Evitar que dos usuarios editen y sobrescriban simultáneamente el mismo Pedido, Cotización o Ficha de Cliente. Si alguien está editando, mostrar:  
     `"María López está editando este campo. Modo de solo lectura activado."`
3. **Live Activity Feed (Notificaciones en Vivo):**
   - Actualización instantánea en la caja o tablero Kanban cuando se aprueba un pago, se cambia el estado de una OT o se recibe un pedido B2B, sin recargar la página.

### 5.3 Arquitectura Propuesta para Implementarlo
```
[ Frontend React (Next.js) ]
            │
    (WebSocket / SSE)
            │
            ▼
[ Node.js Realtime Server / Supabase Realtime / Ably ]
            │
            ▼
[ Redis Pub/Sub & Presence Store ] 
 (Key: `tenant:{id}:presence:{resource_type}:{resource_id}`)
```

---

## 6. CRÍTICAS CONSTRUCTIVAS CLAVE PARA VENDER EL SISTEMA

### 6.1 Fricción Comercial y Time-to-Value (TTV)
- **Carga de Datos Inicial Muy Compleja:** Cuando un comercio compra el software, cargar su catálogo de productos es el mayor freno. Se requiere un **Importador Inteligente con IA / Mapeo Visual de CSV/Excel** que detecte automáticamente columnas de Código, Nombre, Precio e IVA.
- **Barrera de Entrada con AFIP (Modo Simulador Fiscal):** El proceso de generar el certificado digital `.crt` y `.key` en la web de AFIP frena cierres comerciales. El sistema debe permitir operar en **Modo Simulador/Contingencia** desde el minuto 1 para probar la emisión de comprobantes locales, y vincular AFIP posteriormente sin perder datos.
- **Falta de Tour Interactivo Auto-Guiado (Self-Serve Onboarding):** Si el cliente entra solo a una prueba gratis, se encuentra con una pantalla vacía o llena de menús sin guía. Se necesita un tour interactivo paso a paso (ej. via *Driver.js*) que diga: *"Paso 1: Registra tu primer producto", "Paso 2: Realiza tu primera venta en el POS"*.

---

## 7. CRÍTICAS CONSTRUCTIVAS PARA LA EXPERIENCIA DEL USUARIO FINAL (UX / OPERATIVIDAD)

### 7.1 Operatividad en Mostrador y Puntos de Venta (POS)
- **Navegación 100% por Teclado Faltante (Atajos tipo Supermercado):**
  - En un comercio con fila de clientes, usar el mouse ralentiza la atención.
  - **Faltante:** Asignar accesos directos estándar:
    - `F1`: Buscar Producto / Foco en lector de código de barras.
    - `F2`: Cobrar en Efectivo directo.
    - `F3`: Cobrar con MercadoPago / QR.
    - `F4`: Aplicar Descuento / Recargo.
    - `Esc`: Limpiar Carrito / Cancelar Venta.
- **Impresión Térmica Directa sin Cuadro de Diálogo (ESC/POS):**
  - Actualmente, al emitir un ticket aparece la ventana flotante de impresión de Windows (`Ctrl+P`). Esto agrega 2 clics extra por venta.
  - **Solución:** Utilizar el `OPO Edge Agent` o WebUSB/WebHID para enviar comandos RAW directamente a la impresora de 58mm/80mm sin intervención del usuario.
- **Cambio Rápido de Cajero por PIN (Multi-operador en la misma caja):**
  - En negocios donde atienden 2 o 3 empleados en el mismo mostrador, cerrar sesión e iniciar sesión con email/password toma 15 segundos. Se requiere **Cambio de Operador mediante PIN de 4 dígitos** en 1 segundo.
- **Auto-Guardado (Auto-Save) en Formularios Largos:**
  - En presupuestos o Pedidos de Venta extensos, si la pestaña se cierra o se corta la luz, el usuario pierde el trabajo. Se debe implementar auto-guardado en borrador (`localStorage` / `IndexedDB`).

---

## 8. CRÍTICAS CONSTRUCTIVAS PARA IMPLEMENTACIÓN Y SOPORTE TÉCNICO

### 8.1 Herramientas de Diagnóstico e Impersonación
- **Falta de "Health Check" de Tenant en Tiempo Real:**
  - Cuando un cliente reporta *"No puedo facturar"*, el equipo de soporte pierde tiempo adivinando si es un problema de AFIP, de su certificado vencido o de la base de datos.
  - **Solución:** Crear un panel en `/claver-cloud` que muestre un semáforo de salud del tenant:
    - Status Certificado AFIP (Vencimiento, Puntos de venta activos).
    - Status MercadoPago (Token válido / vencido).
    - Estado de Caja (Abierta/Cerrada, saldo).
    - Log de últimos 10 errores del tenant.
- **Impersonación Auditada (Ver la pantalla como el usuario):**
  - Permite al equipo de soporte ingresar al perfil del cliente en modo lectura/diagnóstico para resolver problemas de configuración sin solicitar sus credenciales personales.

---

## 9. BRECHAS TÉCNICAS Y REQUERIMIENTOS CLAVE DE DOMINIO ARGENTINO

### 9.1 Manejo de Contingencia AFIP
- **Problema:** Si el Web Service de AFIP (WSFE) cae o responde con demora, la venta en mostrador se traba.
- **Solución:** El ERP debe emitir un **Comprobante de Contingencia Interna (Ticket Provisorio)**, entregar la mercadería al cliente y encolar automáticamente el pedido en **BullMQ** para solicitar el CAE a AFIP en cuanto se restablezca el servicio.

### 9.2 Lectura Inteligente de Código de Barras de Balanzas (Carnicerías / Fiambrerías)
- **Problema:** Las balanzas comerciales (Systel, Kretz, Reportes) imprimen etiquetas con códigos de barras de 13 dígitos formateados como `20LLLLLVVVVVC` (donde `LLLLL` es el código del producto y `VVVVV` es el precio o el peso).
- **Solución:** Implementar un **Parser Nativo de Balanzas EAN-13** en el lector de códigos de barras del POS que descompile automáticamente el peso/monto y lo agregue al carrito de compras.

### 9.3 Motor de Promociones Complejas (Combos y Descuentos)
- Los comercios locales utilizan promociones complejas: *"2x1 en bebidas"*, *"3ra unidad al 50%"*, *"Combo Hamburguesa + Papa + Gaseosa"*.
- El sistema actual aplica descuentos simples por ítem o por total, perdiendo competitividad frente a sistemas especializados de retail.

---

## 10. Matriz Resumen de Brechas y Priorización

| Dimensión | Estado Actual | Crítica / Lo que le Falta | Prioridad |
| :--- | :--- | :--- | :---: |
| **Comercial** | Cierre asistido por vendedor | • Importador Inteligente de Excel/CSV.<br>• Modo Simulador AFIP sin certificado.<br>• Tour Interactivo paso a paso para demos self-serve. | **ALTA** |
| **UX / UI (Mostrador)** | Interfaz web responsiva con mouse | • Navegación 100% por Teclado (`F1`-`F4`, `Esc`).<br>• Cambio de operador por PIN rápido.<br>• Impresión Térmica Directa ESC/POS sin ventana de impresión.<br>• Parser de etiquetas de Balanzas (EAN-13). | **CRÍTICA** |
| **Técnica / Realtime** | REST API con Polling | • WebSockets / SSE para presencia de usuarios (Shopify style).<br>• Colas asíncronas con BullMQ + Redis.<br>• Modo Contingencia Offline ante caídas de AFIP. | **ALTA** |
| **Soporte / Ops** | Logs centrales | • Dashboard Health-Check del tenant en Claver Cloud.<br>• Impersonación auditada de usuarios para soporte técnico. | **MEDIA** |

---

## 11. Conclusión y Recomendación Estratégica

El sistema **ERP Argentina** posee una base modular sumamente potente con más de 40 áreas de cobertura. Sin embargo, para escalar comercialmente y competir contra soluciones consolidadas (Shopify en E-commerce, Tango/Aleph en ERP tradicional, o Dragonfish en Retail), debe enfocar sus esfuerzos en **reducir la fricción en el punto de venta de mostrador (teclado, balanza, impresión directa)** y **elevar la robustez técnica (real-time presence y contingencia AFIP)**.

Con la implementación de estas mejoras, el sistema alcanzará un nivel de madurez excepcional tanto para el cliente final como para los canales de venta e implementación.

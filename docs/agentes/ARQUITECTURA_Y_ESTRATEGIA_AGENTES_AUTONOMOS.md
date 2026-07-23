# 🚀 ARQUITECTURA Y ESTRATEGIA: La Era Agentémica en Claver (El "Apple de los Agentes" B2B)

**Documento Canónico de Arquitectura Agentémica y Posicionamiento de Mercado**  
**Fecha:** Julio 2026  
**Plataforma:** Claver ERP / Claver Cloud (`claver.com.ar` · `app.claver.com.ar`)  
**Stack:** Next.js 15, TypeScript Strict, Prisma, Empleados Digitales Engine (`lib/empleados-digitales`), WhatsApp Business Cloud API, Supabase Realtime, Playwright Headless.

---

## 1. ¿Cómo se Implementan los Agentes Autónomos en Claver?

La arquitectura agentémica de Claver se basa en **3 Capas de Autonomía de Operación**:

```
                       ARQUITECTURA AGENTÉMICA CLAVER (3 CAPAS)
                       
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ CAPA 1: OPERACIÓN INTERNA (Local Database & ERP Native Engine)             │
  │ • Agente "Leo Cobranza" / "Agente Stock" / "Agente Conciliador"             │
  │ • Ejecución directa sobre Prisma / SQL con aislamiento por tenant.          │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ CAPA 2: OPERACIÓN EXTERNA CON APIS & WEBHOOKS (B2B Bridge)                 │
  │ • WhatsApp Cloud API / MercadoPago / AFIP WSFE / Twilio / Zapier            │
  │ • OPO Studio Bridge (Conector Ontológico para SAP, Protheus, Tango, SQL)   │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ CAPA 3: OPERACIÓN EXTERNA UNIVERSAL SIN API (Headless Browser Agent / Playwright) │
  │ • Agente RPA Visual (Navega portales de proveedores, descarga facturas en  │
  │   PDF, consulta padrones AFIP/ARBA y opera páginas web legacy sin API).     │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

### A. Capa 1: Operación Interna (Base de Datos & Reglas Locales)
Los agentes operan como **"Empleados Digitales"** con permisos de rol limitados dentro de la empresa (`lib/empleados-digitales`).

1. **Definición de Toolsets de Dominio**: Cada agente recibe herramientas TypeScript puras con contratos estrictos de tipo Zod:
   - `leerDeudas(empresaId)`: Lee las facturas o fiados vencidos.
   - `generarRecordatorio(deudaId)`: Prepara el texto o plantilla de cobro.
   - `actualizarEstado(facturaId, estado)`: Transiciona estados de comprobante.

2. **Garantía Multi-Tenant & Audit Trail**:
   - Todo agente ejecuta bajo `whereEmpresa(empresaId)` para evitar fugas de información.
   - Cada acción o decisión de un agente se registra en la tabla `EmpleadoDigitalRun` con `durationMs`, `tokensIn`, `tokensOut` y `resumen`.

---

### B. Capa 2: Operación Externa por APIs (Conectores Nativos & OPO Bridge)
Para comunicarse con el mundo exterior que **sí tiene API**:
- **WhatsApp Cloud API / Twilio**: Envío de botones de cobro de Mercado Pago en mensajes interactivos de WhatsApp.
- **AFIP / ARCA SOAP Bridge**: Obtención de CAE, autorización de comprobantes y validación de CUITs en el padrón oficial.
- **OPO Studio Bridge (`lib/opo`)**: El puente ontológico de Claver que traduce esquemas de bases de datos tradicionales (SQL Server, MySQL, Postgres, ERPs como Protheus/Tango) en entidades comprensibles para los agentes.

---

### C. Capa 3: Operación Externa Universal Sin API (Headless Browser / Web Agent)
Para interactuar con la web o sistemas de terceros que **NO tienen API** (portales de distribuidores, webs municipales, bancos, sistemas contables viejos):

1. **Subagente de Navegación Browser (Playwright / Puppeteer Headless)**:
   - El agente ejecuta un contenedor liviano que abre el sitio web de destino, completa formularios de login, navega entre pantallas, hace clic en botones y extrae datos mediante parsing del DOM (o capturas con visión si hay CAPTCHAs).
2. **Ejemplo Práctico de Operación**:
   - *Agente Compras*: Entra automáticamente al portal del proveedor de bebidas de un supermercado, consulta la lista de precios de la semana, descarga el Excel/PDF y actualiza la lista de costos en Claver sin intervención humana.

---

## 2. ¿Cómo Llevamos el Costo de los Agentes a $0? (Arquitectura Híbrida 80/20)

Para que el modelo de negocio sea ultra-rentable y no se queme la caja en consumo de tokens de LLM (OpenAI/Anthropic/Gemini), aplicamos la **Regla del 80/20 con Router Determinista de 0 Tokens**:

```
                              ROUTER HÍBRIDO 80/20 (COSTO $0)
                              
                  ┌──────────────────────────────────────────────┐
                  │          Disparo de Evento / Tarea           │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │  0-TOKEN ROUTER (`decideMensajePath`)        │
                  │  Determina si el caso requiere LLM o Reglas │
                  └──────────┬────────────────────────┬──────────┘
                             │                        │
             80% de los casos│                        │20% casos complejos
             (Plantilla/Regla)                        │(Caso difícil/LLM)
                             ▼                        ▼
               ┌──────────────────────────┐    ┌──────────────────────────┐
               │ REGULARES / DETERMINISTA │    │ LLM MINI / GEMINI FLASH  │
               │ • Costo: $0.00 ARS       │    │ • Costo: $0.0001 USD    │
               │ • Tiempo: < 5ms          │    │ • Tiempo: ~ 300ms        │
               └──────────────────────────┘    └──────────────────────────┘
```

### Principios de Optimización Extrema de Costos:

1. **Router 0-Tokens (`lib/empleados-digitales/runtime/router.ts`)**:
   - Antes de llamar a un LLM, una función ultra-rápida analiza el caso por reglas:
     - Si la deuda es estándar -> Aplica plantilla estática con variables (`$0.00`).
     - Si el cliente ya fue contactado hoy -> Se saltea por anti-spam (`$0.00`).
     - **Solo si la deuda es vieja (>21 días) o de monto muy alto** -> Activa el LLM para redactar un mensaje persuasivo personalizado.

2. **Modelos SLM (Small Language Models) + Caching Local**:
   - Usar modelos ultraligeros de costo casi nulo como **Gemini 1.5 / 3.6 Flash** o modelos SLMs locales (Ollama/Llama-3-8B en servidor propio).
   - **Semantic Caching**: Si el agente ya respondió una duda similar antes (ej: *"¿Cómo pago mi cuenta corriente?"*), responde directamente desde la memoria cacheada en Postgres (`vector pgvector`) sin llamar a la API externa.

---

## 3. ¿Estamos Preparados para la Era Agentémica?

### 🟢 Lo que YA tenemos construido en Claver:
1. **Infraestructura de Empleados Digitales (`lib/empleados-digitales/`)**:
   - Router determinista de 0-tokens (`router.ts`).
   - Mapeador de consumo y telemetría de tokens (`metering.ts`).
   - Seguridad y aislamiento de tenant (`security.ts`).
   - Herramientas nativas de cobro y WhatsApp (`tools/`).
2. **OPO Studio Bridge**: Capa para conectar bases de datos legacy o tablas dinámicas.
3. **Motor Transaccional POS + AFIP/ARCA**: Capaz de ejecutar mutaciones de stock y ventas de forma atómica en ms.

### 🟡 Lo que debemos encender a continuación para completar la Era Agentémica:
1. **Marketplace de Empleados Digitales por Rubro**: Interfaz donde el comerciante "contrata" un empleado digital en 1-clic (*"Leo - Cobrador WhatsApp"*, *"Sofia - Recepcionista de Turnos"*, *"Ramiro - Guardián de Stock e Inflación"*).
2. **Orquestador de Eventos / Webhooks Entrantes**: Escuchar mensajes de WhatsApp de clientes y dejar que el agente interprete y responda autónomamente (ej: cliente envía foto de un comprobante de transferencia por WhatsApp -> el agente lee el comprobante con OCR, busca la deuda en Claver y marca la cuenta corriente como pagada).

---

## 4. Estrategia para Convertirte en el "Apple de los Agentes" en Rosario y Argentina

Para posicionarse como la marca de referencia indiscutida (*el Apple de los Agentes B2B*), la clave no es vender "Inteligencia Artificial" (que suena complejo y abstracto), sino vender **"Resultados de Negocio Concretos y Simplicidad Simétrica"**.

```
                   EL POSICIONAMIENTO "APPLE DE LOS AGENTES"
                   
    ┌──────────────────────────────────────────────────────────────────┐
    │  1. SIMPLICIDAD RADICAL ("It Just Works")                        │
    │     No hay prompts para configurar. El cliente no hace "prompting".│
    │     Eliges el rubro -> Habilitas el Agente -> Empieza a producir. │
    └─────────────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  2. DISEÑO & ESTÉTICA ULTRA-PREMIUM                              │
    │     Dark mode elegante, animaciones fluidas en Framer Motion,     │
    │     tarjetas visuales de estado ("Leo está trabajando...").      │
    └─────────────────────────────────┬────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │  3. METRIFICACIÓN EN PESOS ARS RECUPERADOS                       │
    │     El agente no reporta "20 ejecuciones exitosas".               │
    │     Reporta: "Leo recuperó $450.000 ARS esta semana en tu negocio".│
    └──────────────────────────────────────────────────────────────────┘
```

### 📍 Plan de Posicionamiento Regional & Nacional:

1. **Casos de Éxito Locales en Rosario / Santa Fe**:
   - Lanzar la campaña: *"El primer Almacén y Kiosco de Rosario atendido por un Empleado Digital"*.
   - Medir métricas de impacto real: *"Recuperó $380.000 ARS de fiados olvidados en 7 días sin llamar por teléfono"*.

2. **Branding: De "Software Módulo" a "Equipo Digital"**:
   - En lugar de vender "Módulo de Cobranzas", vendés a **Leo (Empleado Digital de Cobranzas)**.
   - En lugar de vender "Control de Inventario", vendés a **Ramiro (Agente Guardián de Stock)**.
   - Le da personalidad, humanidad y un valor percibido 10 veces mayor ($20.000 ARS/mes por un "Empleado Digital" suena ridículamente barato comparado con un sueldo).

3. **Demostración "Ver para Creer" (Magic Demo)**:
   - En la landing `claver.com.ar`, incluir un cuadro donde el dueño de negocio pone el número de su WhatsApp y su rubro.
   - El agente de Claver le envía inmediatamente un mensaje de prueba al celular simulando una cobranza o turno para que experimente la velocidad en carne propia en 10 segundos.

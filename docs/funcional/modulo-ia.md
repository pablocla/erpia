# Módulo de Inteligencia Artificial — Documentación Completa

## Índice

1. [Resumen general](#resumen-general)
2. [Arquitectura técnica](#arquitectura-técnica)
3. [Activación y desactivación](#activación-y-desactivación)
4. [Configuración de proveedores IA](#configuración-de-proveedores-ia)
5. [Variables de entorno](#variables-de-entorno)
6. [Endpoints API](#endpoints-api)
7. [Cron jobs (tareas programadas)](#cron-jobs)
8. [Interfaz de usuario](#interfaz-de-usuario)
9. [Modelos Prisma](#modelos-prisma)
10. [Seguridad y permisos](#seguridad-y-permisos)
11. [Parametrización por rubro](#parametrización-por-rubro)
12. [Troubleshooting](#troubleshooting)

---

## Resumen general

El módulo IA agrega inteligencia artificial contextual al ERP. Cada empresa puede activarlo o no independientemente. Cuando está desactivado:

- **No aparece en el sidebar** (sección "Inteligencia Artificial" se oculta automáticamente)
- **No aparece el widget** de alertas IA en el dashboard principal
- **Los endpoints API retornan 403** si se intenta acceder directamente
- **Los cron jobs saltean** a las empresas que no tienen el módulo activo
- **Cero impacto en performance** — no se ejecutan queries ni se consumen recursos de GPU/API

### Capacidades cuando está activo

| Función | Descripción |
|---------|-------------|
| **Chat IA** | Conversación libre sobre el negocio con contexto real (ventas, stock, clientes, turnos, caja) |
| **Alertas inteligentes** | Detección automática de stock crítico, caída de demanda, cobranza urgente, anomalías |
| **Reportes IA** | Generación de reportes ejecutivos (diario/semanal/mensual) con métricas e insights |
| **Mensajes WhatsApp** | Redacción automática de mensajes de cobranza, reactivación de clientes, recordatorios |
| **Proyección de ventas** | Estimación de ventas semana/mes con recomendaciones de stock a reponer |

---

## Arquitectura técnica

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                                                                 │
│  /dashboard/ia/page.tsx  ←──── UI: Chat + Alertas + WA + Proy  │
│  /dashboard/page.tsx     ←──── Widget: Alertas IA (si activo)   │
│  /dashboard/layout.tsx   ←──── Sidebar: "Inteligencia Artificial│
│                                 " solo si módulo "ia" habilitado│
│  /dashboard/configuracion/     Toggle ON/OFF del módulo         │
│     page.tsx                                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ fetch()
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                       │
│                                                                 │
│  /api/ai/chat           POST (chat) + GET (historial)           │
│  /api/ai/alertas        POST (generar) + GET (listar) + PATCH   │
│  /api/ai/reporte        GET ?periodo=dia|semana|mes             │
│  /api/ai/whatsapp-mensajes  POST + GET + PATCH                  │
│  /api/ai/proyeccion     GET                                     │
│  /api/cron/ia-diaria    GET (cron diario 6AM)                   │
│  /api/cron/enviar-whatsapp  GET (cron horario)                  │
│                                                                 │
│  Todos protegidos por:                                          │
│  1. getAuthContext() → autenticación JWT                        │
│  2. isIAEnabled(empresaId) → módulo activo para la empresa      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LIB/AI (Business Layer)                       │
│                                                                 │
│  ia-guard.ts         isIAEnabled() — doble kill switch          │
│  ai-config.ts        Modelos, tiers, hardware profile           │
│  ai-service.ts       Singleton dual (Ollama + Anthropic)        │
│  context-builder.ts  Snapshot del negocio (14 queries Prisma)   │
│  system-prompts.ts   Personalidad por rubro (14 rubros)         │
│  ai-business.ts      5 funciones de negocio con Zod schemas     │
│  analyzers.ts        8 analizadores específicos                 │
│  prompts.ts          Prompts estructurados                      │
│  valor-agregado-rubro.ts  Value map IA × rubro                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                     ┌───────┴────────┐
                     ▼                ▼
              ┌──────────┐    ┌──────────────┐
              │  Ollama  │    │  Anthropic   │
              │  (local) │    │  (cloud API) │
              │ GPU/VRAM │    │  Fallback    │
              └──────────┘    └──────────────┘
```

---

## Activación y desactivación

### Nivel 1 — Kill switch global (todas las empresas)

En `.env`:
```env
AI_ENABLED=false    # Desactiva IA para TODAS las empresas
AI_ENABLED=true     # Activa IA (default — aún requiere activación por empresa)
```

Si `AI_ENABLED=false`, todos los endpoints retornan respuesta vacía sin importar la config per-empresa.

### Nivel 2 — Per empresa (cada cliente decide)

Desde la UI del ERP:

1. Ir a **Dashboard → Configuración → Módulos**
2. Buscar **"Asistente IA"** en la lista de toggles
3. Activar o desactivar con el switch

La configuración se guarda en la tabla `configuracion_modulos`:

```sql
-- Activar IA para empresa 1
INSERT INTO configuracion_modulos (empresa_id, modulo, habilitado)
VALUES (1, 'ia', true)
ON CONFLICT (empresa_id, modulo) DO UPDATE SET habilitado = true;

-- Desactivar IA para empresa 1
UPDATE configuracion_modulos SET habilitado = false
WHERE empresa_id = 1 AND modulo = 'ia';
```

### Comportamiento por defecto

| Escenario | IA Activa? |
|-----------|-----------|
| Empresa nueva, sin config de módulos | **NO** — IA es opt-in |
| Admin activa el módulo desde Configuración | **SÍ** |
| Admin desactiva el módulo | **NO** |
| `AI_ENABLED=false` en .env | **NO** — aunque esté activo per-empresa |
| No hay Ollama ni API key Anthropic | Endpoints responden con fallback vacío |

### Qué pasa cuando IA está desactivada

| Componente | Comportamiento |
|------------|---------------|
| Sidebar → "Inteligencia Artificial" | **No aparece** (filtrado por `moduloKey: "ia"`) |
| Dashboard → Widget Alertas IA | **No se renderiza** (check `/api/config/modulos`) |
| `/dashboard/ia` (si navega directo) | Muestra pantalla "Módulo IA desactivado" con link a Configuración |
| Endpoints `/api/ai/*` | Retornan `403 { error: "Módulo IA no está habilitado" }` |
| Cron jobs | Saltean empresas sin módulo IA activo |

### API para activar/desactivar programáticamente

```bash
# Activar IA (solo admin)
curl -X PATCH /api/config/modulos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"modulos": {"ia": true}}'

# Desactivar IA
curl -X PATCH /api/config/modulos \
  -H "Authorization: Bearer <token>" \
  -d '{"modulos": {"ia": false}}'

# Consultar estado actual
curl /api/config/modulos -H "Authorization: Bearer <token>"
# → { "compras": true, "ventas": true, ..., "ia": false }
```

Cada cambio queda registrado en el **log de auditoría**.

---

## Configuración de proveedores IA

### Opción A — Ollama local (recomendado para privacidad)

Requiere GPU NVIDIA con CUDA. Recomendado: RTX 3060+ con 8GB+ VRAM.

```bash
# 1. Instalar Ollama
# Windows: descargar desde https://ollama.com/download
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# 2. Descargar modelos
ollama pull mistral:7b-instruct-v0.3-q4_K_M    # Rápido (5GB VRAM)
ollama pull qwen2.5:14b-instruct-q5_K_M        # Principal (12GB VRAM)
ollama pull qwen2.5:32b-instruct-q4_K_M        # Profundo (18GB, usa CPU offload)

# 3. Verificar
ollama list
```

### Opción B — Anthropic Claude (cloud)

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514    # Default
```

### Opción C — Auto (fallback automático)

```env
AI_PROVIDER=auto   # Default: intenta Ollama → si falla → Anthropic
```

### Tiers de modelos

| Tier | Uso | Modelo default (Ollama) | Cuándo se usa |
|------|-----|------------------------|---------------|
| `realtime` | Clasificación, alertas rápidas | Mistral 7B Q4 | Chat rápido, API `/api/ai/clasificar-producto` |
| `batch` | Reportes, análisis, chat | Qwen 2.5 14B Q5 | Chat con negocio, reportes, proyecciones |
| `nightly` | Análisis profundo | Qwen 2.5 32B Q4 | Cron diario, alertas batch, análisis nocturnos |

---

## Variables de entorno

```env
# ═══════════════════════════════════════
# MÓDULO IA — Variables de entorno
# ═══════════════════════════════════════

# Kill switch global (default: true)
AI_ENABLED=true

# Proveedor: "ollama" | "anthropic" | "auto" (default: "auto")
AI_PROVIDER=auto

# Ollama
OLLAMA_BASE_URL=http://localhost:11434

# Anthropic (fallback cloud)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Modelos por tier (override defaults si es necesario)
AI_MODEL_REALTIME=fast       # Tier rápido → mistral 7B
AI_MODEL_BATCH=primary       # Tier batch → qwen 14B
AI_MODEL_NIGHTLY=heavy       # Tier nocturno → qwen 32B

# Concurrencia y timeout
AI_MAX_CONCURRENCY=2         # Máximo requests simultáneos a IA
AI_TIMEOUT_MS=120000         # Timeout por request (2 min)

# Cron jobs
CRON_SECRET=un-secreto-largo-y-seguro   # Bearer token para proteger cron endpoints

# WhatsApp (Twilio) — opcional, placeholder por ahora
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

---

## Endpoints API

### `/api/ai/chat`

| Método | Descripción |
|--------|-------------|
| **POST** | Envía un mensaje al chat IA con contexto del negocio. Persiste historial. |
| **GET** | Obtiene historial de chat del usuario actual (últimos 100 mensajes). |

```typescript
// POST body
{
  "mensaje": "¿Cómo estuvieron las ventas hoy?",
  "historial": [
    { "role": "user", "content": "hola" },
    { "role": "assistant", "content": "¡Hola! ¿En qué te ayudo?" }
  ]
}

// Response
{
  "success": true,
  "data": {
    "respuesta": "Hoy vendiste $48.500 en 12 facturas..."
  }
}
```

### `/api/ai/alertas`

| Método | Descripción |
|--------|-------------|
| **POST** | Genera alertas inteligentes con IA y las persiste. |
| **GET** | Lista alertas del día o no leídas (`?no_leidas=true`). |
| **PATCH** | Marca alerta como leída/resuelta. Body: `{ id, leida?, resuelta? }` |

### `/api/ai/reporte`

| Método | Descripción |
|--------|-------------|
| **GET** | Genera reporte IA. Query: `?periodo=dia\|semana\|mes`. Se persiste en `ReporteIA`. |

### `/api/ai/whatsapp-mensajes`

| Método | Descripción |
|--------|-------------|
| **POST** | Genera mensajes WhatsApp. Body: `{ tipo: "cobranza"\|"inactivos"\|"turnos"\|"todos" }` |
| **GET** | Lista mensajes pendientes. Query: `?estado=pendiente\|aprobado\|enviado` |
| **PATCH** | Aprobar/editar/descartar. Body: `{ id, accion: "aprobar"\|"descartar"\|"editar", mensajeEditado? }` |

### `/api/ai/proyeccion`

| Método | Descripción |
|--------|-------------|
| **GET** | Proyección de ventas semana/mes + recomendaciones de stock a reponer. |

### `/api/ai/status`

| Método | Descripción |
|--------|-------------|
| **GET** | Estado del motor IA (proveedor activo, modelo, disponibilidad). **No requiere módulo IA activo.** |

---

## Cron jobs

### `/api/cron/ia-diaria` — Ejecución diaria a las 6:00 AM

```bash
# Vercel cron (vercel.json)
{
  "crons": [
    { "path": "/api/cron/ia-diaria", "schedule": "0 9 * * *" }
  ]
}

# O llamada manual
curl -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio.com/api/cron/ia-diaria
```

**Qué hace:**
1. Itera todas las empresas activas
2. Para cada empresa con módulo IA activo:
   - Genera alertas inteligentes → persiste en `alertas_ia`
   - Genera mensajes WhatsApp (todos los tipos) → persiste como `pendiente`
   - Si es lunes → genera reporte semanal
   - Si es día 1 del mes → genera reporte mensual

### `/api/cron/enviar-whatsapp` — Ejecución horaria

```bash
# Cada hora
curl -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio.com/api/cron/enviar-whatsapp
```

**Qué hace:**
1. Busca mensajes con estado `aprobado` y prioridad ≥ 8
2. Los envía vía Twilio WhatsApp (placeholder hasta configurar)
3. Actualiza estado a `enviado` o `error`

---

## Interfaz de usuario

### Dashboard IA (`/dashboard/ia`)

4 pestañas:

| Pestaña | Funcionalidad |
|---------|---------------|
| **Chat** | Input tipo WhatsApp con quick actions ("¿Cómo estoy hoy?", "¿Qué repongo?", etc), historial persistente, auto-scroll |
| **Alertas** | Cards con semáforo (roja/amarilla/verde), botón "Generar alertas", marcar como resuelta |
| **WhatsApp** | Generar por tipo (cobranza/inactivos/turnos/todos), previsualización del mensaje, editar/aprobar/descartar |
| **Proyección** | Ventas estimadas semana/mes, factor de confianza, productos a reponer |

### Widget en Dashboard principal

- Muestra las 3 alertas más urgentes no leídas
- Link a `/dashboard/ia`
- **Se oculta automáticamente** si el módulo IA está desactivado

### Sidebar

- Sección **"Inteligencia Artificial"** con icono Bot (purple-500)
- `moduloKey: "ia"` → se oculta si el módulo está desactivado
- Independiente de la sección "Onboarding" (que tiene su propio toggle)

---

## Modelos Prisma

4 tablas agregadas al schema:

### `alertas_ia`
```prisma
model AlertaIA {
  id          Int      @id @default(autoincrement())
  tipo        String   // stock_critico, demanda_cayendo, cobranza_urgente, etc.
  prioridad   String   // alta, media, baja
  titulo      String
  descripcion String
  accion      String?  // acción sugerida por la IA
  datos       Json?    // datos extra (producto, monto, etc.)
  leida       Boolean  @default(false)
  resuelta    Boolean  @default(false)
  empresaId   Int
  createdAt   DateTime @default(now())
}
```

### `reportes_ia`
```prisma
model ReporteIA {
  id                Int      @id @default(autoincrement())
  periodo           String   // dia, semana, mes
  resumen           String
  metricasClave     Json     // [{ label, valor, tendencia }]
  insights          Json     // string[]
  recomendaciones   Json     // string[]
  alertasCriticas   Json     // string[]
  empresaId         Int
  createdAt         DateTime @default(now())
}
```

### `mensajes_pendientes_whatsapp`
```prisma
model MensajePendienteWhatsApp {
  id            Int       @id @default(autoincrement())
  destinatario  String
  telefono      String
  mensaje       String
  tipo          String    // cobranza, cliente_inactivo, recordatorio_turno
  prioridad     Int       @default(5)
  estado        String    @default("pendiente")  // pendiente → aprobado → enviado | descartado | error
  enviadoAt     DateTime?
  error         String?
  empresaId     Int
  createdAt     DateTime  @default(now())
}
```

### `chat_ia_historial`
```prisma
model ChatIAHistorial {
  id        Int      @id @default(autoincrement())
  role      String   // user, assistant
  content   String
  empresaId Int
  usuarioId Int
  createdAt DateTime @default(now())
}
```

### Aplicar migraciones

```bash
npx prisma migrate dev --name add_ia_models
```

---

## Seguridad y permisos

### Autenticación
- Todos los endpoints requieren JWT válido via `getAuthContext(request)`
- El `empresaId` se extrae del token — no se puede acceder a datos de otra empresa

### Autorización
- Solo **administradores** (`rol: "administrador"`) pueden activar/desactivar módulos
- Cualquier usuario autenticado puede usar la IA si el módulo está activo
- Los cron jobs se protegen con `CRON_SECRET` bearer token

### Doble kill switch
```
isIAEnabled(empresaId) = AI_ENABLED (global) AND ConfiguracionModulo.habilitado (per-empresa)
```

### Rate limiting
- `AI_MAX_CONCURRENCY=2` limita requests simultáneos al motor IA (semáforo interno)
- `AI_TIMEOUT_MS=120000` timeout de 2 minutos por request

### Auditoría
- Cada cambio de módulo ON/OFF se registra en `log_actividad`
- El historial de chat se persiste por `empresaId` + `usuarioId`
- Los reportes y alertas se persisten con timestamp

---

## Parametrización por rubro

La IA adapta su comportamiento según el rubro de la empresa. Se configura en `Empresa.rubro`.

### Rubros soportados con personalidad IA

| Rubro | Foco de IA | Ejemplo de alerta |
|-------|-----------|-------------------|
| `kiosco` | Stock rotación alta, vencimientos | "Alfajor X tiene 3 unidades, pedí mañana" |
| `ferreteria` | Demanda estacional, SKUs largos | "La temporada de pinturas arranca en 15 días, stock bajo en látex" |
| `veterinaria` | Turnos, vacunas, stock medicamentos | "3 pacientes sin control de vacunas hace 6 meses" |
| `salon_belleza` | Agenda, fidelización, insumos | "María no viene hace 2 meses, antes venía cada 3 semanas" |
| `gimnasio` | Membresías, retención, asistencia | "15 miembros con membresía venciendo esta semana" |
| `gastronomia` | Costos plato, merma, turnos cocina | "Costo del menú ejecutivo subió 12%, ajustar precio" |
| `bar_restaurant` | Mesa promedio, horarios pico | "Viernes 20-22hs facturaste 40% más que jueves" |
| `distribuidora` | Rutas, preventa, stock mayorista | "Cliente Almacén Norte no pidió hace 3 semanas" |
| `clinica` | Turnos, historia clínica, PAMI | "12 turnos sin confirmar para mañana" |
| `farmacia` | Vencimientos, trazabilidad ANMAT | "Lote X de Ibuprofeno vence en 30 días, quedan 45 unidades" |
| `ropa` | Temporadas, talles, slow movers | "Remeras talle M sin venta hace 45 días" |
| `supermercado` | Góndola, promociones, merma | "Lácteos con merma del 8%, revisar cadena de frío" |
| `libreria` | Estacionalidad escolar, papelería | "Temporada escolar en 3 semanas, reponer cuadernos y cartucheras" |
| `taller` | Turnos mecánicos, repuestos | "Auto de Juan García listo, avisarle por WhatsApp" |

### Cómo funciona

1. `context-builder.ts` → Construye snapshot del negocio (14 queries Prisma en paralelo)
2. `system-prompts.ts` → Inyecta instrucciones específicas del rubro al system prompt
3. La IA recibe: datos reales + personalidad del rubro → responde contextualizado

---

## Troubleshooting

### "Módulo IA no está habilitado para esta empresa"
→ Un admin debe activarlo en **Configuración → Módulos → Asistente IA**

### La sección "Inteligencia Artificial" no aparece en el sidebar
→ Verificar que el módulo `ia` está habilitado: `GET /api/config/modulos` debe devolver `"ia": true`

### "No pude procesar tu consulta" en el chat
→ Verificar que Ollama está corriendo (`ollama list`) o que `ANTHROPIC_API_KEY` está configurada

### Cron no genera alertas
→ Verificar `CRON_SECRET` en `.env` y que el request incluye `Authorization: Bearer <CRON_SECRET>`

### IA responde lento (>30 segundos)
→ Normal para modelos de 14B+. Para respuestas más rápidas, cambiar `AI_MODEL_BATCH=fast` (usa Mistral 7B, menos calidad)

### Error "VRAM insuficiente" en Ollama
→ El modelo de 32B necesita CPU offload. Reducir a `AI_MODEL_NIGHTLY=primary` si no hay 16GB VRAM

### ¿Cómo desactivo IA para TODAS las empresas de golpe?
```env
AI_ENABLED=false
```
Restart la app. Todos los endpoints de IA retornan vacío.

---

## Archivos del módulo

```
lib/ai/
├── index.ts              ← Barrel exports
├── ia-guard.ts           ← isIAEnabled() — doble kill switch
├── ai-config.ts          ← Hardware profile, modelos, tiers
├── ai-service.ts         ← Singleton dual provider (Ollama + Anthropic)
├── context-builder.ts    ← Snapshot del negocio (Promise.allSettled, cache 60s)
├── system-prompts.ts     ← Personalidad por rubro (14 rubros)
├── ai-business.ts        ← 5 funciones de negocio + Zod schemas
├── analyzers.ts          ← 8 analizadores específicos
├── prompts.ts            ← Prompts estructurados para tareas específicas
└── valor-agregado-rubro.ts ← Feature map IA × rubro (13 rubros × 18 features)

app/api/ai/
├── chat/route.ts          ← POST chat + GET historial
├── alertas/route.ts       ← POST generar + GET listar + PATCH resolver
├── reporte/route.ts       ← GET con ?periodo=
├── whatsapp-mensajes/route.ts ← POST generar + GET listar + PATCH aprobar
├── proyeccion/route.ts    ← GET proyección
├── status/route.ts        ← GET estado del motor (sin guard de módulo)
├── clasificar-producto/   ← Clasificación automática de productos
├── cobranza/              ← Análisis de cobranza
├── prediccion-compras/    ← Predicción de compras
├── preguntar/             ← Pregunta libre
├── anomalias/             ← Detección de anomalías
├── onboarding/            ← Onboarding conversacional
├── presupuesto/           ← Presupuesto por texto libre
└── valor-rubro/           ← Features IA por rubro

app/api/cron/
├── ia-diaria/route.ts     ← Cron diario 6AM (alertas + WA + reportes)
└── enviar-whatsapp/route.ts ← Cron horario (envía WA aprobados)

app/dashboard/
├── ia/page.tsx            ← UI completa: Chat + Alertas + WA + Proyección
└── configuracion/page.tsx ← Toggle de módulos (incluye "Asistente IA")

prisma/schema.prisma       ← 4 modelos: AlertaIA, ReporteIA, MensajePendienteWhatsApp, ChatIAHistorial
```

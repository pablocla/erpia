# 🗺️ METASWARM — ROADMAP DE IMPLEMENTACIÓN COMPLETO
## De hoy hasta los $30k USD/mes — Hitos, tareas y criterios de DONE

> **Punto de partida:** `pos-system-argentina` con 93 módulos ERP operativos.  
> **Meta final:** Campus 2D + Agentes WhatsApp/Telegram + SaaS B2B en LATAM.

---

## FASE 0 — FUNDACIÓN TÉCNICA (Semanas 1-2)
> **Objetivo:** Dejar el ERP preparado para recibir agentes. Cero código nuevo visible para el usuario final.

### Sprint 0.1: Gateway API de Agentes
- [ ] Crear tabla `AgentApiKey` en `prisma/schema.prisma`
- [ ] Crear middleware `lib/agents/agent-guard.ts` con validación de API Key, agentId, empresaId
- [ ] Crear rutas base: `app/api/v1/agents/catalogo/route.ts`, `app/api/v1/agents/cliente/route.ts`
- [ ] Crear rutas de stock: `app/api/v1/agents/stock/bajo-minimo/route.ts`
- [ ] Crear rutas de caja: `app/api/v1/agents/caja/estado/route.ts`
- [ ] Crear rutas de CxC: `app/api/v1/agents/cxc/vencidas/route.ts`
- [ ] Crear rutas de AFIP: `app/api/v1/agents/facturas/pendientes-cae/route.ts`
- [ ] Crear rate limiter por agentId (`lib/agents/rate-limiter.ts`)
- [ ] Tests de aislamiento: JWT de tenant B no puede acceder a recursos de tenant A

**Criterio DONE:** Un agente con API Key válida puede leer el catálogo. Un agente sin clave recibe 401.

---

### Sprint 0.2: Panel `/dashboard/agentes` (UI de gestión)
- [ ] Crear ruta `app/dashboard/agentes/page.tsx`
- [ ] UI para listar, crear y revocar API Keys de agentes
- [ ] Mostrar: agentId, floorId, permisos, último uso, requests hoy
- [ ] Botón "Generar nueva API Key" (muestra la key solo 1 vez, guarda hash)
- [ ] Integrar con `/api/agents` CRUD

**Criterio DONE:** El dueño puede entrar a `/dashboard/agentes` y crear una API Key para "leo-vendedor" en 2 minutos.

---

## FASE 1 — AGENTES DE LÍNEA BASE (Semanas 3-6)
> **Objetivo:** 3 agentes reales funcionando: Leo (Ventas WA), Clara (AFIP), Guardián (Caja).

### Sprint 1.1: Webhook WhatsApp
- [ ] Instalar dependencias: `pnpm add @types/node-fetch`
- [ ] Crear `app/api/v1/agents/whatsapp/route.ts` (GET verificación + POST mensajes)
- [ ] Implementar `verifyWhatsAppSignature` con HMAC SHA-256
- [ ] Agregar variables de entorno al `.env.example`
- [ ] Implementar `classifyIntent` con Gemini 2.0 Flash Lite
- [ ] Implementar `agentLeoVendedor` con consulta al catálogo y respuesta en español AR
- [ ] Testear con un número de WhatsApp real (modo Sandbox de Meta)
- [ ] Agregar `.env` variables: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`

**Criterio DONE:** Envío "¿cuánto cuesta el aceite 10W40?" al número de prueba y recibo precio correcto en < 3 segundos.

---

### Sprint 1.2: Bot de Telegram (Centro de mando)
- [ ] Instalar: `pnpm add node-telegram-bot-api @types/node-telegram-bot-api`
- [ ] Crear `app/api/v1/agents/telegram/route.ts` (POST webhook)
- [ ] Configurar webhook en Telegram con `setWebhook` apuntando al deploy
- [ ] Implementar comandos: "resumen del día", "ventas de hoy", "estado de caja", "stock bajo"
- [ ] Implementar transcripción de audio con Whisper (comando de voz)
- [ ] Implementar botones inline para aprobar/rechazar acciones de agentes
- [ ] Agregar variable: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_CHAT_ID`

**Criterio DONE:** Envío un audio por Telegram diciendo "¿Cómo estamos de ventas hoy?" y recibo resumen con datos reales del ERP.

---

### Sprint 1.3: Clara AFIP + Guardián de Caja
- [ ] Implementar `agentClaraAFIP`: polling cada 15 min de facturas sin CAE → reintento automático
- [ ] Si AFIP falla 3 veces → activar CAEA automáticamente → notificar Telegram
- [ ] Implementar `agentGuardianCaja`: detector de anulaciones > umbral configurable
- [ ] Si caja lleva > 12h abierta → alerta Telegram con botones de cierre

**Criterio DONE:** Simular AFIP caído → Clara reintenta → activa CAEA → me avisa por Telegram. Todo en < 2 minutos.

---

## FASE 2 — CAMPUS 2D MVP (Semanas 7-10)
> **Objetivo:** La oficina visual 2D accesible por navegador. 1 edificio, 2 pisos, 3 agentes con avatares.

### Sprint 2.1: Infraestructura del Campus
- [ ] Instalar Phaser.js: `pnpm add phaser`
- [ ] Instalar WebSocket server: `pnpm add ws @types/ws`
- [ ] Crear `services/campus-ws/server.ts` con manejo de rooms por empresaId
- [ ] Definir protocolo de eventos JSON (AVATAR_MOVE, AGENT_THINKING, etc.)
- [ ] Implementar room-manager: cada empresa tiene su propia "sala" aislada
- [ ] Deploy del WS server en Railway (gratis hasta 500hs/mes)

**Criterio DONE:** Abrir DevTools, conectar al WS y ver eventos llegando en tiempo real cuando un agente trabaja.

---

### Sprint 2.2: Mapa y Avatares
- [ ] Crear mapa base `edificio-a-piso-1.json` con Tiled Map Editor (sala de ventas 40x30 tiles)
- [ ] Generar sprites de agentes (16x16px, 4 direcciones): Leo, Clara, Guardián, Player
- [ ] Crear `app/dashboard/campus/page.tsx` con layout simplificado (sin sidebar ERP)
- [ ] Implementar `CampusWrapper.tsx` que monta Phaser en `<div ref={canvasRef}>`
- [ ] Implementar `OfficeScene.ts` con mapa, avatares y movimiento del player (WASD)
- [ ] Conectar WebSocket al OfficeScene para mover avatares y mostrar globos
- [ ] Implementar click en agente → emite evento a React overlay

**Criterio DONE:** Entro a `/dashboard/campus` y veo 3 avatares en una oficina pixel art. Me puedo mover con WASD. Puedo hacer clic en Leo y ver su panel lateral.

---

### Sprint 2.3: Panel Lateral y Métricas
- [ ] Implementar `AgentPanel.tsx`: log de actividad, tokens consumidos, costo USD, botones de control
- [ ] Implementar `MetricsBar.tsx`: ventas del día, agentes activos, costo total de IA
- [ ] Implementar `FloorSelector.tsx`: botones de edificio y piso en la parte superior
- [ ] Implementar `NotificationToast.tsx`: alertas 🚨 con botones Aprobar/Rechazar
- [ ] Crear `lib/stores/campus-store.ts` (Zustand) para estado compartido React ↔ Phaser

**Criterio DONE:** Veo en tiempo real cuando Leo responde a un WhatsApp (globo de texto animado), y en el panel lateral veo cuántos tokens usó y cuánto costó.

---

## FASE 3 — COMERCIALIZACIÓN (Semanas 11-16)
> **Objetivo:** Primeros 5 clientes de pago. MRR $1,000 USD.

### Sprint 3.1: Multi-tenant Campus
- [ ] Implementar RLS Postgres: cada empresa ve solo su campus
- [ ] Implementar subdomain routing: `{empresa}.campus.claver.com.ar`
- [ ] Agregar onboarding: wizard de configuración del primer agente (Nombre, WhatsApp, catálogo)
- [ ] Crear página de demo pública con datos ficticios pre-cargados

**Criterio DONE:** Empresa A y empresa B pueden abrir su campus simultáneamente sin ver datos entre sí.

---

### Sprint 3.2: Onboarding Automatizado de Clientes
- [ ] Formulario de alta: nombre empresa, WhatsApp, rubro, plan elegido
- [ ] Webhook de pago MercadoPago → activa el tenant automáticamente
- [ ] Email de bienvenida con link al campus y video instructivo
- [ ] Playbook de implementación automático (agenda call de 30min en Calendly)
- [ ] Migración de catálogo: importar desde Excel/CSV en primer login

**Criterio DONE:** Un nuevo cliente puede comprar, activar su campus y ver su primer agente funcionando en < 24 horas, sin intervención manual de nuestra parte.

---

### Sprint 3.3: Billing y Planes
- [ ] Integrar MercadoPago suscripciones (preapproval) para cobro mensual automático
- [ ] Crear tabla `Plan`, `Suscripcion`, `FacturacionCiclo` en Prisma
- [ ] Implementar dunning: si falla el cobro → aviso → baja parcial de features → baja total
- [ ] Crear página `/dashboard/mi-plan` con uso, próximo cobro y opción de upgrade

**Criterio DONE:** El cliente paga por MercadoPago, el sistema lo activa solo, y al mes siguiente se cobra automáticamente.

---

## FASE 4 — ESCALA (Meses 4-12)
> **Objetivo:** 40+ clientes, $16,000+ USD/mes, sistema 100% autónomo.

### Sprint 4.1: Marketplace de Agentes
- [ ] Crear catálogo de agentes disponibles: Leo, Clara, Sofía, Ramiro, Guardián, OCR, Contador
- [ ] Permitir al cliente activar/desactivar agentes desde `/dashboard/campus/agentes`
- [ ] Cada agente tiene un precio mensual adicional al plan base
- [ ] Terceros pueden crear y publicar agentes (SDK público)

### Sprint 4.2: App Móvil del Dueño (React Native / Expo)
- [ ] Vista simplificada del campus en mobile (solo métricas + alertas)
- [ ] Notificaciones push para alertas críticas (alternativa a Telegram)
- [ ] Control de voz desde el móvil

### Sprint 4.3: Expansión Regional
- [ ] Adaptar módulo fiscal para Chile (SII), Uruguay (DGI), México (SAT)
- [ ] Pricing en USD para clientes fuera de Argentina
- [ ] Partnerships con agencias de marketing digital como revendedores

---

## RESUMEN FINANCIERO PROYECTADO

| Fase | Hito | Clientes | MRR (USD) | Costo Infra/mes |
|:---|:---|:---|:---|:---|
| **Fase 0-1** | API Gateway + Agentes funcionales | 0 (alpha interno) | $0 | $30 |
| **Fase 2** | Campus 2D MVP | 2 (alfa pagos) | $500 | $50 |
| **Fase 3** | Comercialización activa | 8 | $2,400 | $80 |
| **Fase 3.5** | Automatización de ventas | 20 | $7,000 | $120 |
| **Fase 4** | Escala regional | 50 | $22,000 | $250 |
| **Fase 4.5** | Marketplace + Partners | 100 | $45,000+ | $500 |

**Margen neto estimado Fase 4:** > 85% (costo de IA marginal + infra = < 15% del revenue)

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Mitigación |
|:---|:---|:---|
| AFIP cambia la API/certificados | Alta (anual) | Clara AFIP ya monitorea esto. Suscripción al boletín oficial AFIP. |
| Meta cambia pricing de WhatsApp | Media | Telegram es siempre gratuito como canal alternativo. |
| Runaway de tokens (bug en un agente) | Media | Rate limiter por agente. Alertas en Telegram si costo/hora > umbral. |
| Cliente filtra su API Key | Baja | API Keys hasheadas en BD. Revocación inmediata desde el dashboard. |
| Competidor copia el modelo | Alta | Ventaja del primer movimiento + datos propietarios de AFIP/Argentina. |

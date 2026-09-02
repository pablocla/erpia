# 📱 METASWARM — WHATSAPP & TELEGRAM INTEGRATION
## Guía completa de integración omnicanal con ClavERP

---

## 1. WHATSAPP CLOUD API (Meta Business)

### Costo y Límites
| Tier | Conversaciones/mes | Costo |
|:---|:---|:---|
| Gratuito | Primeras 1,000 conversaciones iniciadas por usuario | **$0** |
| Pago por conversación | Conversaciones adicionales | ~$0.005 - $0.015 USD cada una (según país) |

**Para Argentina:** 1,000 chats/mes gratis son suficientes para el MVP y los primeros 5-10 clientes.

### Configuración Requerida

```
1. Crear cuenta en Meta Business Suite: business.facebook.com
2. Crear una app de tipo "Business" en developers.facebook.com
3. Agregar el producto "WhatsApp" a la app
4. Obtener:
   - WHATSAPP_TOKEN (Token de acceso permanente)
   - WHATSAPP_PHONE_ID (ID del número de teléfono)
   - WHATSAPP_VERIFY_TOKEN (Token de verificación del webhook)
   - WHATSAPP_BUSINESS_ID (ID de la cuenta de negocio)
```

Variables de entorno a agregar en `.env`:
```env
WHATSAPP_TOKEN=EAAxxxxxxx
WHATSAPP_PHONE_ID=107xxxxxxx
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_personalizado
WHATSAPP_BUSINESS_ID=123xxxxxxx
```

---

## 2. WEBHOOK DE WHATSAPP INBOUND

### Ruta a crear: `app/api/v1/agents/whatsapp/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { handleIncomingMessage } from "@/lib/agents/whatsapp/message-handler"
import { verifyWhatsAppSignature } from "@/lib/agents/whatsapp/auth"

// GET: Verificación del webhook (Meta lo llama 1 vez al configurar)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

// POST: Mensajes entrantes de WhatsApp
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256") ?? ""
  const body = await req.text()

  // Verificar firma HMAC de Meta (seguridad crítica)
  if (!verifyWhatsAppSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const data = JSON.parse(body)
  
  // Procesar solo mensajes reales (ignorar status updates)
  const entry = data.entry?.[0]?.changes?.[0]?.value
  if (!entry?.messages?.length) {
    return NextResponse.json({ status: "ok" }) // Responder 200 siempre a Meta
  }

  const message = entry.messages[0]
  const from = message.from // Número del cliente
  const businessPhoneId = entry.metadata.phone_number_id

  // Despachar al handler asíncrono (no bloquear la respuesta a Meta)
  handleIncomingMessage({ message, from, businessPhoneId }).catch(console.error)

  return NextResponse.json({ status: "ok" }) // Meta requiere respuesta en < 5s
}
```

---

## 3. PROCESADOR DE MENSAJES (Message Handler)

```typescript
// lib/agents/whatsapp/message-handler.ts

import { classifyIntent } from "./intent-classifier"
import { routeToFloor } from "../router/floor-router"
import { sendWhatsAppMessage } from "./sender"
import { transcribeAudio } from "../tools/whisper"

interface IncomingMessage {
  message: WhatsAppMessage
  from: string
  businessPhoneId: string
}

export async function handleIncomingMessage({ message, from, businessPhoneId }: IncomingMessage) {
  let textContent = ""

  // 1. Extraer contenido según tipo de mensaje
  switch (message.type) {
    case "text":
      textContent = message.text.body
      break
    
    case "audio":
      // Descargar audio y transcribir con Whisper
      const audioUrl = await getMediaUrl(message.audio.id)
      textContent = await transcribeAudio(audioUrl)
      break
    
    case "image":
      // OCR de imagen (ej: foto de factura de proveedor)
      const imageUrl = await getMediaUrl(message.image.id)
      textContent = `[IMAGEN RECIBIDA: ${message.image.caption ?? "sin texto"}] URL: ${imageUrl}`
      break
    
    case "document":
      textContent = `[DOCUMENTO RECIBIDO: ${message.document.filename}]`
      break
    
    default:
      await sendWhatsAppMessage(from, "Recibí tu mensaje, pero aún no puedo procesar este tipo de contenido 😅. Podés escribirme en texto.")
      return
  }

  // 2. Clasificar intención con modelo rápido (Gemini 2.0 Flash Lite)
  const intent = await classifyIntent(textContent, from)

  // 3. Mostrar "escribiendo..." al usuario (mejora UX)
  await sendTypingIndicator(businessPhoneId, message.id)

  // 4. Enrutar al piso/agente correcto del campus
  const response = await routeToFloor({
    intent,
    textContent,
    from,
    rawMessage: message
  })

  // 5. Enviar respuesta al cliente
  await sendWhatsAppMessage(from, response.text, response.buttons, response.mediaUrl)

  // 6. Notificar al campus 2D (actualizar globo del agente)
  await notifyCampus(response.agentId, `💬 "${textContent.substring(0, 50)}..." → ${intent.tipo}`)
}
```

---

## 4. CLASIFICADOR DE INTENCIÓN

```typescript
// lib/agents/whatsapp/intent-classifier.ts

import { generateContent } from "@/lib/ai/gemini-client"

export type IntentType = 
  | "CONSULTA_PRECIO"    // "¿Cuánto cuesta el aceite?"
  | "REALIZAR_PEDIDO"    // "Quiero 5 aceites y 2 filtros"
  | "CONSULTA_SALDO"     // "¿Cuánto debo?"
  | "PAGO_RECIBIDO"      // "Ya te transferí"
  | "CONSULTA_STOCK"     // "¿Tienen tal producto?"
  | "SOLICITAR_FACTURA"  // "Necesito la factura A"
  | "CONSULTA_TURNO"     // "¿A qué hora es mi turno?"
  | "OTRO"               // Derivar a humano

const SYSTEM_PROMPT_CLASIFICADOR = `
Eres un clasificador de intenciones para un sistema de ERP argentino.
Dado el mensaje de un cliente por WhatsApp, clasifica su intención.

Responde SOLO con un JSON válido:
{
  "tipo": "CONSULTA_PRECIO | REALIZAR_PEDIDO | CONSULTA_SALDO | PAGO_RECIBIDO | CONSULTA_STOCK | SOLICITAR_FACTURA | CONSULTA_TURNO | OTRO",
  "confianza": 0.0-1.0,
  "entidades": { "producto": "string?", "cantidad": "number?", "monto": "number?" }
}
`

export async function classifyIntent(text: string, from: string): Promise<Intent> {
  const result = await generateContent({
    model: "gemini-2.0-flash-lite",  // Modelo más barato para clasificación
    system: SYSTEM_PROMPT_CLASIFICADOR,
    user: `Mensaje del cliente (${from}): "${text}"`,
    maxTokens: 150,
  })

  try {
    return JSON.parse(result.text) as Intent
  } catch {
    return { tipo: "OTRO", confianza: 0, entidades: {} }
  }
}
```

---

## 5. ROUTER DE PISOS (Floor Router)

```typescript
// lib/agents/router/floor-router.ts

import { agentLeoVendedor } from "../floors/piso1-ventas/leo-agent"
import { agentFacturadorAFIP } from "../floors/piso1-ventas/facturador-agent"
import { agentCobradorCXC } from "../floors/piso2-finanzas/cobrador-agent"
import { agentGuardianCaja } from "../floors/piso2-finanzas/guardian-agent"

export async function routeToFloor(ctx: RoutingContext): Promise<AgentResponse> {
  const { intent } = ctx

  switch (intent.tipo) {
    case "CONSULTA_PRECIO":
    case "REALIZAR_PEDIDO":
    case "CONSULTA_STOCK":
      return agentLeoVendedor(ctx)

    case "SOLICITAR_FACTURA":
      return agentFacturadorAFIP(ctx)

    case "CONSULTA_SALDO":
    case "PAGO_RECIBIDO":
      return agentCobradorCXC(ctx)

    case "CONSULTA_TURNO":
      return agentSofiaAgenda(ctx)

    default:
      return {
        text: "Hola 👋 Soy el asistente virtual de [Negocio]. Puedo ayudarte con:\n\n1️⃣ Consultar precios y stock\n2️⃣ Realizar pedidos\n3️⃣ Consultar tu saldo\n4️⃣ Ver tus facturas\n\n¿Qué necesitás?",
        agentId: "router",
        buttons: [
          { id: "consulta_precio", title: "Ver precios 🏷️" },
          { id: "realizar_pedido", title: "Hacer pedido 🛒" },
          { id: "consultar_saldo", title: "Mi saldo 💰" },
        ]
      }
  }
}
```

---

## 6. AGENTE LEO: EJEMPLO COMPLETO DE UN AGENTE

```typescript
// lib/agents/floors/piso1-ventas/leo-agent.ts

import { generateContent } from "@/lib/ai/gemini-client"
import { agentFetch } from "@/lib/agents/agent-api-client"

const SYSTEM_LEO = `
Eres Leo, el vendedor virtual de [Negocio], una PyME argentina.
Sos amigable, rápido y conocés el catálogo de memoria.
Respondés siempre en español argentino informal (vos, che, etc.)
Nunca inventás precios: usás solo los datos que te doy.
Si el cliente quiere comprar, armás el pedido y mandás el link de pago.
Máximo 3 oraciones por respuesta. Usás emojis con moderación.
`

export async function agentLeoVendedor(ctx: RoutingContext): Promise<AgentResponse> {
  // 1. Obtener contexto del piso (catálogo actualizado)
  const catalogo = await agentFetch("/api/v1/agents/catalogo")
  
  // 2. Buscar cliente si existe
  const cliente = ctx.from ? await agentFetch(`/api/v1/agents/cliente?telefono=${ctx.from}`) : null
  
  // 3. Construir prompt con contexto mínimo
  const contextBlock = `
Catálogo disponible (solo estos productos):
${catalogo.productos.slice(0, 20).map(p => `- ${p.nombre}: $${p.precio} (stock: ${p.stock})`).join("\n")}

${cliente ? `Cliente: ${cliente.razonSocial} | Saldo CxC: $${cliente.saldoCxC}` : "Cliente: Nuevo (no registrado)"}

Mensaje del cliente: "${ctx.textContent}"
${ctx.intent.entidades?.producto ? `Producto mencionado: ${ctx.intent.entidades.producto}` : ""}
`

  // 4. Generar respuesta (modelo barato para respuestas de ventas)
  const response = await generateContent({
    model: "gemini-2.0-flash",
    system: SYSTEM_LEO,
    user: contextBlock,
    maxTokens: 300,
  })

  // 5. Si el intent es REALIZAR_PEDIDO y hay confianza alta, crear presupuesto
  if (ctx.intent.tipo === "REALIZAR_PEDIDO" && ctx.intent.confianza > 0.8) {
    const presupuesto = await agentFetch("/api/v1/agents/presupuesto", {
      method: "POST",
      body: JSON.stringify({
        clienteId: cliente?.id,
        items: parseItemsFromIntent(ctx.intent),
      })
    })
    
    return {
      text: response.text,
      agentId: "leo-vendedor",
      mediaUrl: presupuesto.pdfBase64 ? `data:application/pdf;base64,${presupuesto.pdfBase64}` : undefined,
      buttons: [
        { id: "confirmar_pedido", title: "✅ Confirmar pedido" },
        { id: "modificar", title: "✏️ Modificar" },
      ]
    }
  }

  return { text: response.text, agentId: "leo-vendedor" }
}
```

---

## 7. TELEGRAM BOT: CENTRO DE MANDO DEL DUEÑO

### Instalación y configuración
```bash
# Buscar @BotFather en Telegram, crear nuevo bot
# Guardar el token en .env:
TELEGRAM_BOT_TOKEN=7123456789:AAFxxxxxxx
TELEGRAM_OWNER_CHAT_ID=123456789  # Tu chat ID personal
```

### Bot Handler: `app/api/v1/agents/telegram/route.ts`

```typescript
import TelegramBot from "node-telegram-bot-api"
import { handleTelegramCommand } from "@/lib/agents/telegram/command-handler"
import { transcribeAudio } from "@/lib/agents/tools/whisper"

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false })

export async function POST(req: NextRequest) {
  const update = await req.json()
  
  // Solo aceptar mensajes del dueño (seguridad crítica)
  const chatId = update.message?.chat?.id
  if (chatId?.toString() !== process.env.TELEGRAM_OWNER_CHAT_ID) {
    return NextResponse.json({ ok: true }) // Ignorar silenciosamente
  }

  const message = update.message

  // Comando de voz (audio)
  if (message.voice) {
    const fileId = message.voice.file_id
    const audioBuffer = await downloadTelegramFile(fileId)
    const transcription = await transcribeAudio(audioBuffer)
    await handleTelegramCommand(chatId, transcription, "VOICE")
    return NextResponse.json({ ok: true })
  }

  // Comando de texto
  if (message.text) {
    await handleTelegramCommand(chatId, message.text, "TEXT")
  }

  // Callback de botones (aprobar/rechazar acciones de agentes)
  if (update.callback_query) {
    const [action, actionId] = update.callback_query.data.split(":")
    if (action === "APROBAR") await approveAgentAction(actionId)
    if (action === "RECHAZAR") await rejectAgentAction(actionId)
    await bot.answerCallbackQuery(update.callback_query.id, { text: "✅ Procesado" })
  }

  return NextResponse.json({ ok: true })
}
```

### Command Handler

```typescript
// lib/agents/telegram/command-handler.ts

export async function handleTelegramCommand(chatId: number, text: string, source: string) {
  const lowerText = text.toLowerCase()
  
  // Comandos predefinidos
  if (lowerText.includes("resumen del día") || lowerText.includes("cómo vamos")) {
    return sendDailySummary(chatId)
  }
  
  if (lowerText.includes("ventas de hoy")) {
    return sendVentasHoy(chatId)
  }
  
  if (lowerText.includes("estado de caja")) {
    return sendEstadoCaja(chatId)
  }
  
  if (lowerText.includes("stock bajo") || lowerText.includes("qué falta")) {
    return sendStockBajo(chatId)
  }

  // Comando libre: enrutar al orquestador de agentes
  const intent = await classifyCommandIntent(text)
  return executeAgentCommand(chatId, intent, text)
}

async function sendDailySummary(chatId: number) {
  const [ventas, caja, agentes, alertas] = await Promise.all([
    agentFetch("/api/v1/agents/reportes/ventas-hoy"),
    agentFetch("/api/v1/agents/caja/estado"),
    agentFetch("/api/v1/agents/status"),
    agentFetch("/api/v1/agents/alertas/pendientes"),
  ])

  const mensaje = `
📊 *RESUMEN DEL DÍA — ${new Date().toLocaleDateString("es-AR")}*

💰 *Ventas:* $${ventas.total.toLocaleString("es-AR")} (${ventas.cantidad} transacciones)
💵 *Caja:* ${caja.estado} · Saldo $${caja.saldoTeorico.toLocaleString("es-AR")}
🤖 *Agentes activos:* ${agentes.activos}/${agentes.total}
${alertas.pendientes > 0 ? `⚠️ *Alertas pendientes:* ${alertas.pendientes}` : "✅ Sin alertas pendientes"}

[Ver campus completo](https://campus.claver.com.ar)
`
  await sendTelegramMessage(chatId, mensaje, { parse_mode: "Markdown" })
}
```

---

## 8. ALERTAS DE AGENTES BLOQUEADOS → TELEGRAM

Cuando un agente se traba y requiere intervención humana:

```typescript
// lib/agents/escalation.ts

export async function escalateToHuman(ctx: EscalationContext) {
  const mensaje = `
🚨 *AGENTE BLOQUEADO*

🤖 *Agente:* ${ctx.agentNombre} (${ctx.floorId})
📋 *Tarea:* ${ctx.tarea}
❌ *Error:* ${ctx.error}
🔁 *Intentos:* ${ctx.intentos}/3

¿Qué hacemos?
`
  await sendTelegramMessage(OWNER_CHAT_ID, mensaje, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Aprobar y continuar", callback_data: `APROBAR:${ctx.actionId}` },
        { text: "🔁 Reintentar", callback_data: `REINTENTAR:${ctx.actionId}` },
        { text: "❌ Cancelar", callback_data: `RECHAZAR:${ctx.actionId}` },
      ]]
    }
  })
  
  // También iluminar el avatar en el campus 2D
  await notifyCampus(ctx.agentId, { type: "AGENT_BLOCKED", reason: ctx.error })
}
```

---

## 9. RESUMEN DE COSTOS OMNICANAL

| Canal | Costo Setup | Costo Mensual (100 clientes activos) |
|:---|:---|:---|
| **WhatsApp Cloud API** | $0 (registro gratuito) | ~$5-15 USD (conversaciones extra de 1000) |
| **Telegram Bot** | $0 | $0 (ilimitado) |
| **Whisper (transcripción)** | $0 | ~$0.006 USD/minuto de audio |
| **Gemini 2.0 Flash (clasificación)** | $0 | ~$2-5 USD (miles de clasificaciones) |
| **Total estimado** | **$0** | **~$10-25 USD/mes** |

Con un cliente pagando $250 USD/mes, el margen neto del canal omnicanal es del **90%+**.

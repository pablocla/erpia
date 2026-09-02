# 🛡️ METASWARM — ARQUITECTURA DE AUTO-CORRECCIÓN Y AUDITORÍA
## Protocolo "Self-Healing": Cero Errores, Cero Alucinaciones y Costo de Tokens Mínimo

> **Principio de Diseño:** La Inteligencia Artificial es estocástica (probabilística), pero las operaciones comerciales, fiscales (AFIP) y contables deben ser **100% deterministas**.  
> Para evitar pérdidas económicas y alucinaciones, MetaSwarm utiliza un pipeline de **4 barreras de contención**.

---

## 🧱 1. LAS 4 BARRERAS DE CONTENCIÓN (Pipeline de Validación)

```
[ INPUT DEL USUARIO (WhatsApp / Telegram) ]
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ BARRERA 1: VALIDACIÓN ESTRUCTURAL Y REGEX (Costo: $0)       │
│ • Validadores de CUIT (Módulo 11)                           │
│ • Sanitización de inputs (Prevención de Prompt Injection)   │
│ • Schemas Zod para payloads estructurados                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ OK
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ BARRERA 2: EJECUCIÓN CON SMALL MODEL (Costo: Micro-tokens)  │
│ • Extracción de entidades (Gemini 2.0 Flash Lite)           │
│ • Consulta a la BD local mediante API Gateway               │
│ • Generación de borrador de respuesta                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Draft
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ BARRERA 3: AUDITOR DETERMINISTA DE NEGOCIO (Costo: $0)      │
│ • ¿El precio coincide exactamente con la lista en BD?       │
│ • ¿Hay stock real disponible? (Stock >= Cantidad pedida)    │
│ • ¿El descuento supera el máximo permitido (ej: 15%)?       │
│ • ¿El CUIT está habilitado en AFIP / Padrón?                │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │ APROBADO                      │ REPROBADO (Mismatch)
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ ENVÍO AL CLIENTE FINAL       │ │ BARRERA 4: SELF-HEALING LOOP │
│ • Mensaje WhatsApp enviado   │ │ • Reintento con inyección    │
│ • Factura emitida en AFIP    │ │   del error exacto (máx 3x)  │
│ • Evento reflejado en Campus │ │ • Si persiste: 🚨 Escalada a │
│                              │ │   Telegram del Dueño         │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 💻 2. CÓDIGO DE IMPLEMENTACIÓN: AUDITOR DETERMINISTA

```typescript
// lib/agents/audit/business-validator.ts

import { z } from "zod"

// Schema estricto para propuestas de venta
export const PresupuestoSchema = z.object({
  clienteId: z.string().min(1),
  items: z.array(z.object({
    productoId: z.string(),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    descuentoPct: z.number().min(0).max(20), // Máximo 20% de descuento permitido
  })).min(1),
  medioPago: z.enum(["EFECTIVO", "MERCADOPAGO", "TRANSFERENCIA", "FIADO"]),
})

export interface AuditResult {
  valido: boolean
  errores: string[]
  bloqueante: boolean
}

export async function auditarPresupuesto(payload: unknown, stockReal: Map<string, number>, preciosLista: Map<string, number>): Promise<AuditResult> {
  const errores: string[] = []

  // 1. Validación de esquema Zod
  const parse = PresupuestoSchema.safeParse(payload)
  if (!parse.success) {
    return {
      valido: false,
      errores: parse.error.issues.map(i => `${i.path.join(".")}: ${i.message}`),
      bloqueante: true,
    }
  }

  const data = parse.data

  // 2. Validación de Stock e Integridad de Precios (Cero costo de LLM)
  for (const item of data.items) {
    const stockDisponible = stockReal.get(item.productoId) ?? 0
    const precioOficial = preciosLista.get(item.productoId) ?? 0

    // Verificación de stock
    if (stockDisponible < item.cantidad) {
      errores.push(`Stock insuficiente para producto ${item.productoId}. Solicitado: ${item.cantidad}, Disponible: ${stockDisponible}`)
    }

    // Verificación de que el agente no inventó un precio menor al de lista
    const precioEsperadoConDescuento = precioOficial * (1 - item.descuentoPct / 100)
    if (Math.abs(item.precioUnitario - precioEsperadoConDescuento) > 0.01) {
      errores.push(`Discrepancia de precio en producto ${item.productoId}. Esperado: $${precioEsperadoConDescuento}, Propuesto por Agente: $${item.precioUnitario}`)
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    bloqueante: errores.length > 0,
  }
}
```

---

## 🔁 3. EL BUCLE DE AUTO-CORRECCIÓN (Self-Healing Loop)

Cuando el auditor detecta una discrepancia, **no falla hacia el usuario**. Le inyecta el error de vuelta al agente para que se auto-corrija:

```typescript
// lib/agents/orchestrator/self-healing-runner.ts

import { generateContent } from "@/lib/ai/gemini-client"
import { auditarPresupuesto } from "../audit/business-validator"
import { escalateToHuman } from "../escalation"

export async function executeWithSelfHealing(taskContext: any, maxIntentos = 3) {
  let intento = 1
  let feedbackError = ""

  while (intento <= maxIntentos) {
    // 1. Prompt con feedback del intento anterior (si hubo error)
    const prompt = `
Contexto de la tarea: ${JSON.stringify(taskContext)}
${feedbackError ? `\n⚠️ ATENCIÓN: En tu intento anterior cometiste los siguientes errores. CORRÍGELOS OBLIGATORIAMENTE:\n${feedbackError}` : ""}
`
    // 2. Generación del agente
    const respuestaAgente = await generateContent({
      model: "gemini-2.0-flash",
      system: "Eres un agente ejecutor estricto. Responde únicamente en JSON.",
      user: prompt,
    })

    const payloadGenerado = JSON.parse(respuestaAgente.text)

    // 3. Auditoría Determinista
    const auditoria = await auditarPresupuesto(payloadGenerado, taskContext.stockMap, taskContext.preciosMap)

    if (auditoria.valido) {
      // ✅ Éxito: Se auto-corrigió o salió bien de primera
      return { success: true, data: payloadGenerado, intentos: intento }
    }

    // ❌ Falló la auditoría: Preparar feedback para el siguiente loop
    feedbackError = auditoria.errores.join("\n")
    intento++
  }

  // 🚨 Si falló los 3 intentos: Escalar a Telegram del dueño
  await escalateToHuman({
    agentNombre: "Leo Vendedor",
    floorId: "Piso 1 Ventas",
    tarea: "Cotización de pedido",
    error: feedbackError,
    intentos: maxIntentos,
    actionId: `act_${Date.now()}`
  })

  return { success: false, error: "Escalado a revisión humana" }
}
```

---

## 📊 4. DASHBOARD DE CONFIABILIDAD Y MÉTRICAS DE AUTO-CORRECCIÓN

En el **Edificio D (Torre Matriz)**, puedes ver las métricas de fiabilidad de todo el campus:

| Métrica | Valor Objetivo | Acción si se desvía |
|:---|:---|:---|
| **Tasa de Aprobación en Intento 1** | > 92% | Si cae < 90%, ajustar los ejemplos del system prompt (Few-shot). |
| **Tasa de Auto-Corrección (Intento 2 o 3)** | > 7% | Indica que el loop de self-healing está salvando el 7% de las ventas sin molestar al dueño. |
| **Tasa de Escalada a Humano (Alertas 🚨)** | < 1% | Solo 1 de cada 100 pedidos complejos requiere un toque manual. |
| **Tiempo Promedio de Resolución** | < 2.5 segundos | Latencia total percibida por el cliente en WhatsApp. |

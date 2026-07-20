# Vercel AI — Qué está lanzando (AI Gateway y ecosistema)

> Resumen actualizado (julio 2026) de la oferta de IA de Vercel, con foco en **AI Gateway** y el resto del stack (AI SDK, Vercel Agent, Sandbox).  
> Fuentes oficiales: [AI Gateway docs](https://vercel.com/docs/ai-gateway) · [AI Gateway product](https://vercel.com/ai-gateway) · [AI SDK](https://vercel.com/docs/ai-sdk) · [Vercel Agent](https://vercel.com/docs/agent) · [Sandbox](https://vercel.com/docs/sandbox)

---

## 1. Resumen en una frase

**Vercel AI Cloud** unifica acceso a cientos de modelos (texto, imagen, video, audio, embeddings) con **una sola API key**, sin markup en tokens, failover automático, billing y observabilidad centralizados — y lo integra con el AI SDK, agentes de coding y un agent en el dashboard.

---

## 2. AI Gateway (producto principal)

### Qué es

**AI Gateway** es un proxy/API unificada de Vercel que enruta requests de modelos a múltiples providers (OpenAI, Anthropic, Google, xAI, Meta, Bedrock, y muchos más) a través de un **único endpoint** y una **única API key**.

| Beneficio | Detalle |
|-----------|---------|
| **Una key, cientos de modelos** | Un solo `AI_GATEWAY_API_KEY` para todo el catálogo |
| **API unificada** | Cambiar de provider/modelo con cambios mínimos de código |
| **Alta disponibilidad** | Reintentos y failover automático si un provider cae |
| **Sin markup en tokens** | Mismo precio de lista del provider (también con BYOK) |
| **Billing unificado** | Un solo gasto / factura / dashboard de spend |
| **Observabilidad** | Uso, latencia (TTFT), tokens, spend por modelo/proyecto |
| **Embeddings** | Vectores para search, RAG, retrieval |
| **Disponible en todos los planes** | Free + paid credits |

### Endpoint y autenticación

- **Base URL**: `https://ai-gateway.vercel.sh` (y `/v1` según API)
- **API Key**: se crea en el dashboard → AI Gateway → API Keys
- **Variable de entorno típica**: `AI_GATEWAY_API_KEY`
- **Alternativa**: tokens OIDC de corta duración (sin credenciales estáticas)
- **BYOK (Bring Your Own Key)**: usar tus propias keys de OpenAI/Anthropic/etc. sin fee de plataforma; si falla, puede fallback a credenciales del sistema (ese uso se cobra de tus credits)

### Compatible con

| Integración | Uso |
|-------------|-----|
| **AI SDK v5 y v6** | Recomendado; modelo como string (`'openai/gpt-5.5'`) |
| **OpenAI Chat Completions** | Solo cambiar `baseURL` del SDK OpenAI |
| **OpenAI Responses API** | Misma idea, API moderna de OpenAI |
| **Anthropic Messages API** | Compatible con clients Anthropic |
| **OpenResponses** | Endpoint compatible adicional |
| **Frameworks** | Next.js, React, Vue, Svelte, Node, WordPress, etc. |

Migrar stacks existentes suele ser **cambiar base URL + una key**, no reescribir la app.

---

## 3. Modalidades soportadas

Todo a través del mismo gateway:

| Modalidad | Descripción | Notas |
|-----------|-------------|--------|
| **Text** | Chat, generación, streaming | GPT, Claude, Gemini, Grok, Llama, etc. |
| **Image** | Generación y edición | Flux, Recraft, Imagen, etc. |
| **Video** | Text-to-video / image-to-video | Veo, Kling, Wan, Grok Imagine Video, etc. (AI SDK 6+) |
| **Realtime** | Voz speech-to-speech por WebSockets | Agentes de voz de baja latencia |
| **Speech (TTS)** | Texto → audio | tts-1, ElevenLabs, etc. |
| **Transcription (STT)** | Audio → texto | Whisper, Deepgram, etc. |
| **Embeddings** | Vectores para RAG/search | Múltiples providers |
| **Reranking** | Reordenar resultados de retrieval | p. ej. Cohere |
| **Web search** | Aumentar respuestas con búsqueda en tiempo real | Opción de provider |

Catálogo vivo: [vercel.com/ai-gateway/models](https://vercel.com/ai-gateway/models)

---

## 4. Routing inteligente

AI Gateway no solo “proxyea”: puede **enrutar por comportamiento**:

1. **Availability / failover**  
   Si un provider se degrada (ej. Claude en Anthropic), reintenta el mismo modelo en otro (ej. Bedrock).

2. **Cost**  
   Requests simples → modelo open/barato; jobs complejos → modelo frontier solo cuando hace falta.

3. **Latency**  
   Requests sensibles a TTFT → modelo más rápido; cargas pesadas → modelo más grande.

Configuración de preferencias, fallbacks y allowlists: docs de **provider options**.

---

## 5. Quickstart (texto con AI SDK)

```bash
mkdir ai-text-demo
cd ai-text-demo
pnpm init
pnpm add ai dotenv @types/node tsx typescript
```

`.env.local`:

```bash
AI_GATEWAY_API_KEY=tu_api_key_de_ai_gateway
```

`index.ts`:

```ts
import { streamText } from 'ai';
import 'dotenv/config';

async function main() {
  const result = streamText({
    model: 'openai/gpt-5.5', // o 'anthropic/claude-opus-4.5', 'xai/grok-4.5', etc.
    prompt: 'Inventa un feriado nuevo y describe sus tradiciones.',
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log('\nToken usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
}

main().catch(console.error);
```

```bash
pnpm tsx index.ts
```

### OpenAI-compatible (sin AI SDK)

```ts
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});

const completion = await client.chat.completions.create({
  model: 'openai/gpt-5.5',
  messages: [{ role: 'user', content: 'Why is the sky blue?' }],
});
```

### Identificadores de modelo

Formato: `provider/model`  
Ejemplos: `openai/gpt-5.5`, `anthropic/claude-opus-4.5`, `xai/grok-4.5`, `google/gemini-3.1-pro`.

Con AI SDK, al pasar un string el **default provider es AI Gateway**.

---

## 6. Pricing (AI Gateway)

| Concepto | Detalle |
|----------|---------|
| **Modelo de cobro** | Pay-as-you-go con **AI Gateway Credits** (prepago) |
| **Tokens** | Precio de lista del provider, **0% markup** |
| **Free tier** | Créditos gratuitos mensuales al primer request; **subset** de modelos y rate limits más bajos |
| **Paid tier** | Al comprar credits: catálogo completo + rate limits más altos; el free mensual deja de aplicar |
| **BYOK** | Sin markup; disponible en paid tier; fallback a system keys se cobra de credits |
| **Enterprise** | Factura consolidada / AWS Marketplace (private offers) |

### Add-ons con cargo extra (opcionales)

| Feature | Costo aprox. | Notas |
|---------|--------------|--------|
| **Custom Reporting** (tags/user IDs) | Write ~$0.075 / 1k · Query ~$5 / 1k | Para chargeback por feature/cliente |
| **Provider allowlist team-wide** | $0.10 / 1k requests exitosos | Pro/Enterprise; filtro por request es gratis |
| **Zero Data Retention team-wide** | $0.10 / 1k requests | Pro/Enterprise; ZDR por request sin cargo extra |

Balance y auto top-up: dashboard → **AI Gateway**.

Docs: [Pricing](https://vercel.com/docs/ai-gateway/pricing)

---

## 7. Seguridad y compliance

| Control | Descripción |
|---------|-------------|
| **Zero Data Retention (ZDR)** | Enruta solo a providers con acuerdo de no retención/entrenamiento |
| **Disallow prompt training** | No entrenar con tus prompts; configurable por request o equipo |
| **Provider allowlist** | Restringir providers aprobados a nivel team |
| **API key budgets** | Límites de spend por key |
| **Per-user spending limits** | Caps por usuario en keys compartidas |
| **OIDC tokens** | Credenciales de corta duración |

---

## 8. Observabilidad y spend

Dashboard de AI Gateway / Observability:

- Usage y **costo** por provider, modelo, proyecto, API key  
- Volumen de requests, **TTFT**, tokens  
- Logs / traces de requests  
- **Custom Reporting API**: tags por user, customer, feature, environment  

Útil para: chargeback multi-tenant, detectar modelos caros, debug de latencia.

---

## 9. Coding agents a través de AI Gateway

Podés rutar agentes de coding populares por el gateway (solo base URL / env) y unificar spend + modelos + fallbacks:

| Agente | Tipo | Setup típico |
|--------|------|----------------|
| **Claude Code** | Terminal (Anthropic) | `ANTHROPIC_BASE_URL=https://ai-gateway.vercel.sh` |
| **OpenAI Codex** | Terminal | Provider en `~/.codex/config.toml` → base_url gateway |
| **OpenCode** | Terminal open-source | `/connect` → Vercel AI Gateway |
| **Cline / Roo Code** | VS Code | Provider = Vercel AI Gateway en settings |
| **Grok Build** | Terminal (xAI) | `GROK_MODELS_BASE_URL` + API key del gateway |
| **Blackbox, Crush, Conductor, Superset** | CLI / multi-agent | Ver docs por agente |

Setup asistido:

```bash
vercel ai-gateway coding-agents setup
```

Docs: [Coding Agents](https://vercel.com/docs/ai-gateway/coding-agents)

---

## 10. AI SDK (toolkit de desarrollo)

El **AI SDK** es el toolkit TypeScript open-source de Vercel para apps y agents (React, Next.js, Vue, Svelte, Node).

### Capacidades

- API unificada multi-provider (`generateText`, `streamText`, …)
- **Structured outputs** (`generateObject` / `streamObject` + Zod)
- **Tool calling** / function tools
- Streaming first (texto, objetos, UI)
- Con AI Gateway: modelo como string, sin instalar un package por provider

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'anthropic/claude-opus-4.5',
  prompt: '¿Cuántas personas vivirán en el mundo en 2040?',
});
```

```ts
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: 'openai/gpt-5.2',
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

Install: `pnpm add ai`  
Docs: [ai-sdk.dev](https://ai-sdk.dev) · [vercel.com/docs/ai-sdk](https://vercel.com/docs/ai-sdk)

---

## 11. Vercel Agent (en el dashboard)

**Vercel Agent** vive en el dashboard y opera con contexto de plataforma (deploys, logs, métricas, repos).

| Feature | Qué hace | Estado / notas |
|---------|----------|----------------|
| **Dashboard chat** | Preguntas sobre proyectos y la plataforma | Public beta (Pro/Enterprise, rollout gradual) |
| **Code Review** | Review de PRs con patches validados en Sandbox | Multi-step reasoning; `@vercel` en comentarios de PR |
| **Investigation** | Root cause de deploys fallidos, errores, spikes de costo | Requiere Observability Plus para auto |
| **Approved actions** | PRs, rollback, config — solo con aprobación humana | Read-only por defecto |
| **Installation** | Instala Analytics / Speed Insights vía PR | Gratis |

**Pricing Agent**: ~$0.30 fijo por review/investigación + tokens al rate del provider (sin markup extra). Credits en el sidebar de Agent.

Docs: [Vercel Agent](https://vercel.com/docs/agent)

---

## 12. Vercel Sandbox

**Sandbox** = microVMs aisladas (Firecracker) para ejecutar código no confiable o generado por IA.

Casos de uso:

- Validar código de agents antes de producción  
- Playgrounds / builders de UI con IA  
- Servidores de desarrollo efímeros con preview  
- Multi-agent isolation (usuarios Linux por agent)

Runtimes: Node 22/24/26, Python 3.13 · SDKs JS/Python · CLI `sandbox`  
Auth: OIDC (recomendado en Vercel) o access tokens.

Docs: [Sandbox](https://vercel.com/docs/sandbox)

---

## 13. Mapa del ecosistema Vercel AI

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL AI CLOUD                              │
├─────────────────────────────────────────────────────────────────┤
│  AI Gateway                                                      │
│  • Una API key · cientos de modelos · 0% markup                  │
│  • Text / Image / Video / Realtime / Speech / STT / Embeddings   │
│  • Failover · routing por costo/latencia · BYOK · ZDR            │
│  • Observability + Custom Reporting + budgets                    │
├──────────────────┬──────────────────┬───────────────────────────┤
│  AI SDK          │  Coding Agents   │  Vercel Agent             │
│  (apps & agents) │  (Claude Code,   │  (dashboard: review,      │
│  generateText,   │   Codex, Cline,  │   investigate, act)       │
│  tools, stream   │   Grok Build…)   │                           │
├──────────────────┴──────────────────┴───────────────────────────┤
│  Sandbox — microVMs para validar / ejecutar código de agents    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Por qué importa para este ERP (Claver / POS Argentina)

| Necesidad del producto | Cómo ayuda Vercel AI |
|------------------------|----------------------|
| Chat IA, alertas, reportes (`docs/funcional/modulo-ia.md`) | Un solo backend de modelos vía AI Gateway + AI SDK en Next.js 15 |
| Multi-tenant / chargeback por empresa | Custom Reporting tags (`empresaId`, feature) + budgets por key |
| No depender de un solo provider (AFIP-adjacent, uptime) | Failover Anthropic ↔ Bedrock, OpenAI, xAI, etc. |
| Costos predecibles | Precio de lista + credits + límites por key/usuario |
| Privacidad de datos de clientes | ZDR + disallow training + provider allowlist |
| Asistente / onboarding IA en dashboard | Mismos endpoints; streaming con AI SDK en App Router |
| Agentes internos de desarrollo | Coding agents por el gateway = un solo spend del equipo |

### Variables de entorno sugeridas (Vercel)

```bash
AI_GATEWAY_API_KEY=...          # o OIDC en deploy en Vercel
# Opcional si se usa BYOK además del gateway:
# OPENAI_API_KEY / ANTHROPIC_API_KEY configurados en BYOK del dashboard
```

Ver también: [`docs/deploy/VERCEL_ENV.md`](./VERCEL_ENV.md)

---

## 15. Enlaces oficiales (índice)

| Tema | URL |
|------|-----|
| AI Gateway (docs) | https://vercel.com/docs/ai-gateway |
| Getting started | https://vercel.com/docs/ai-gateway/getting-started |
| Models & providers | https://vercel.com/docs/ai-gateway/models-and-providers |
| Pricing | https://vercel.com/docs/ai-gateway/pricing |
| Observability | https://vercel.com/docs/ai-gateway/observability-and-spend/observability |
| BYOK | https://vercel.com/docs/ai-gateway/authentication-and-byok/byok |
| Coding agents | https://vercel.com/docs/ai-gateway/coding-agents |
| AI SDK | https://vercel.com/docs/ai-sdk · https://ai-sdk.dev |
| Vercel Agent | https://vercel.com/docs/agent |
| Sandbox | https://vercel.com/docs/sandbox |
| Product page Gateway | https://vercel.com/ai-gateway |
| Catálogo de modelos | https://vercel.com/ai-gateway/models |
| Changelog | https://vercel.com/changelog |

---

## 16. FAQ rápido

**¿Pagan markup por token?**  
No. Precio de lista del provider, incluso con BYOK.

**¿Funciona sin reescribir si ya usamos OpenAI SDK?**  
Sí: `baseURL: 'https://ai-gateway.vercel.sh/v1'` + key del gateway.

**¿Qué modalidades hay hoy?**  
Texto, imagen, video, realtime, speech, transcription, embeddings, reranking.

**¿Hay free tier?**  
Sí: credits gratis al primer request, subset de modelos y rate limits; al comprar credits pasás a paid.

**¿Sirve para coding agents del equipo?**  
Sí: Claude Code, Codex, Cline, Grok Build, etc., con un solo dashboard de spend.

---

*Documento de referencia interna. No sustituye la documentación oficial de Vercel; los precios y modelos cambian — validar en el dashboard y en las docs enlazadas.*

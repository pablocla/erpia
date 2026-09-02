# 📚 METASWARM OS & CLAVERP — ÍNDICE MAESTRO DE DOCUMENTACIÓN

> **Ecosistema:** ClavERP (`pos-system-argentina`) + MetaSwarm OS (Campus 2D & Workforce Omnicanal)  
> **Objetivo de Negocio:** Startup B2B de Alta Rentabilidad (>82% margen) y Libertad Financiera ($30k USD/mes).

---

## 🗺️ GUÍA DE NAVEGACIÓN DE DOCUMENTOS

Todos los documentos técnicos, comerciales y estratégicos han sido generados y estructurados para su ejecución inmediata:

### 💼 Estrategia de Negocio y Ventas
1. **[`METASWARM_VISION.md`](./METASWARM_VISION.md)**
   * Visión integral del producto, diferenciadores frente a la competencia, mapeo de Edificios y Pisos con el ERP y gaps de desarrollo.
2. **[`METASWARM_SALES_PITCH_PLAYBOOK.md`](./METASWARM_SALES_PITCH_PLAYBOOK.md)**
   * Guía comercial, guión de demo en vivo de 15 minutos (Efecto "SimCity"), manejo de objeciones y scripts de cierre con garantía.
3. **[`METASWARM_ROADMAP.md`](./METASWARM_ROADMAP.md)**
   * Hoja de ruta de 4 Fases (Fase 0 a Fase 4), sprints con criterios de DONE, proyección financiera y matriz de riesgos/mitigación.

### ⚙️ Arquitectura Técnica y Código
4. **[`METASWARM_API_GATEWAY.md`](./METASWARM_API_GATEWAY.md)**
   * Especificación de endpoints `/api/v1/agents/*`, autenticación con `AgentApiKey`, modelo Prisma, middleware y rate limiting.
5. **[`METASWARM_CAMPUS_2D.md`](./METASWARM_CAMPUS_2D.md)**
   * Frontend 2D en el navegador con Phaser.js 3, arquitectura de capas, protocolo WebSocket, componentes React (`AgentPanel.tsx`) y assets necesarios.
6. **[`METASWARM_WHATSAPP_TELEGRAM.md`](./METASWARM_WHATSAPP_TELEGRAM.md)**
   * Integración de WhatsApp Cloud API (webhook, clasificación con Gemini Flash, router de intenciones) y Bot de Telegram del dueño (comandos de voz con Whisper y alertas 🚨).
7. **[`METASWARM_SELF_HEALING_AUDIT.md`](./METASWARM_SELF_HEALING_AUDIT.md)**
   * Pipeline de 4 barreras de contención, auditor determinista con schemas Zod, bucle de auto-corrección sin intervención humana y métricas de fiabilidad.

---

## 🚀 CHECKLIST DE INICIO RÁPIDO (Quick Start)

Para comenzar con la implementación técnica del primer hito (Sprint 0.1):

```bash
# 1. Abrir el repositorio
cd "C:\Users\Pablo Clavero\Downloads\pos-system-argentina"

# 2. Revisar el esquema del API Gateway
# Ver archivo METASWARM_API_GATEWAY.md para los endpoints de stock, catálogo y AFIP

# 3. Crear el modelo AgentApiKey en Prisma y generar el cliente
# Agregar el modelo definido en METASWARM_API_GATEWAY.md a prisma/schema.prisma
```

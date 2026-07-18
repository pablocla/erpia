# Investigación: Cerebro Visual (GraphRAG + Diagramas de Flujo) por servicio — claver.com.ar

> **Estado:** SOLO INVESTIGACIÓN — no implementa ni modifica producto.  
> **Fecha:** 2026-07-18  
> **Alcance:** todo el ecosistema Claver (ERP dashboard, verticales, Claver Cloud, portals, IA, OPO, automatización).  
> **Fuente conceptual:** stack “Cerebro Visual” (Knowledge Graph + GraphRAG + React Flow) aplicado a ERP Next.js.  
> **Incluye:** valor por servicio ERP (§6), mecánicas GraphRAG (§11), plan 2–3 semanas (§13), 3D premium bajo costo (§15), operador Claver Cloud (§17), **alimentación DB/REST (§18)**, **política tokens LLM vs local (§19)**, **dificultad de soporte (§20)**.

---

## 1. Respuesta clara y directa

### ¿Qué se propone?

Un **“Cerebro Visual”** combina:

| Pieza | Qué es | Resultado buscado |
|-------|--------|-------------------|
| **Grafo de conocimiento** | Nodos (Cliente, Producto, Factura…) + relaciones (COMPRÓ, DEBE, GENERA_ASIENTO…) | El sistema “entiende” el negocio como red, no solo tablas |
| **GraphRAG** | LLM que recupera contexto **navegando el grafo** (no solo SQL/snapshot) | Respuestas multi-hop: “¿por qué este cliente está en riesgo y qué productos lo arrastran?” |
| **Diagrama de flujos** | Canvas visual (React Flow) de procesos, workflows, ontología | Ver y editar procesos; entrenar al analista; orquestar BPM |

### ¿Qué software se usa típicamente (2026)?

| Capa | Recomendado | Alternativas | En Claver hoy |
|------|-------------|--------------|---------------|
| DB grafo | **Neo4j** (Aura / self-host) | Memgraph, ArangoDB, **Postgres + pgvector/AGE** | No hay Neo4j; hay **PostgreSQL/Prisma** |
| Visualización | **React Flow (xyflow)** | Reagraph, Cytoscape | **Ya existe** en `opo/Open-protocol-ontology` (GraphCanvas) |
| GraphRAG | LangChain.js + Neo4j | LlamaIndex, consultas Cypher generadas | **No GraphRAG**; hay chat + `context-builder` (snapshot tabular) |
| LLM | OpenAI / Claude / Groq / Gemini / Ollama | — | Rutas `/api/ai/*` + agentes |
| Next.js | Vercel AI SDK / API routes | Server Actions | API routes + chat panel |
| Sync ERP → grafo | Cron / EventBus / webhooks | Airbyte | **EventBus + cron + automation hub** listos como fuente |
| UI | shadcn + Tailwind | — | Ya es el stack del producto |

**Stack mínima de mercado:** Next.js + React Flow + Neo4j Aura + LangChain.js.

**Stack mínima realista en Claver (aprovechando lo existente):**  
Next.js + React Flow (OPO) + **grafo semántico sobre Prisma/Postgres o Neo4j opcional** + LLM actual + EventBus como pipeline de sync.

---

## 2. Lo que YA existe en el repo (no reinventar)

Antes de proponer Neo4j/GraphRAG en todos lados, el monorepo **ya tiene capas del “cerebro”**:

### 2.1 IA conversacional y agentes

| Componente | Ubicación | Rol |
|------------|-----------|-----|
| Chat IA | `app/dashboard/ia`, `components/ia/*`, `/api/ai/chat` | Preguntas en es-AR sobre el negocio |
| Context builder | `lib/ai/context-builder.ts` | Snapshot: ventas, stock crítico, deudores, top productos (tipo RAG tabular, no grafo) |
| 10 agentes | `lib/ai/agents/*` | stock, cobranzas, leads, compras predictivo, anomalías, reportes, CM, marketing, onboarding, clasificador |
| Guardrails | `AI_CANNOT_DO` | No emite AFIP, no mueve caja, no ve otras empresas |

### 2.2 Ontología / grafo visual (OPO)

| Componente | Ubicación | Rol |
|------------|-----------|-----|
| OPO Studio (React Flow) | `opo/Open-protocol-ontology` + `GraphCanvas` | Knowledge graph de entidades de negocio en canvas |
| Bridge ERP | `app/dashboard/apps/opo`, `lib/opo/*` | Mapeo Customer/Product/Invoice/Order/Supplier ↔ Claver o Protheus |
| Consola Cloud | `/claver-cloud/opo-console` | Ontología a nivel plataforma |

### 2.3 Flujos y automatización (no LLM)

| Componente | Ubicación | Rol |
|------------|-----------|-----|
| Workflow engine | `lib/config/workflow-engine.ts` + modelos Prisma `Workflow*` | Flujos por rubro, condicionales, aprobación humana |
| EventBus | `lib/events/*` | Eventos de dominio entre módulos |
| Automation Hub + n8n | `lib/automation/*`, `docs/automation/*` | Webhooks firmados, playbooks, empleados virtuales |
| Virtual workers | Ana Reposición, Leo Cobranzas, Clara Facturación, etc. | Automatización **determinística** (sin LLM) |

### 2.4 Gaps documentados de conexiones entre módulos

`docs/CONECCIONESENTREMOD.TXT` lista 10 puentes críticos (Stock↔POS, Venta↔Contabilidad, etc.).  
Un grafo de conocimiento **hace visibles** esas conexiones; un flujo visual las **orquesta**.

---

## 3. Dos productos distintos (no mezclar)

En todo claver.com.ar conviene **separar** mentalmente:

```
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│  A) CEREBRO LLM / GraphRAG          │     │  B) DIAGRAMAS DE FLUJO / BPM        │
│  “Preguntá y entendé el negocio”    │     │  “Diseñá y ejecutá el proceso”      │
├─────────────────────────────────────┤     ├─────────────────────────────────────┤
│ • Grafo entidades + relaciones      │     │ • React Flow de pasos/estados       │
│ • Chat multi-hop con evidencia      │     │ • Workflow engine + n8n             │
│ • Explicar porqués y riesgos        │     │ • Aprobaciones, timeouts, sagas     │
│ • NO ejecuta pagos/AFIP por defecto │     │ • Puede ejecutar acciones registradas│
└─────────────────────────────────────┘     └─────────────────────────────────────┘
         ▲                                              ▲
         └────────────── EventBus / Prisma ─────────────┘
```

**Regla de diseño sugerida (investigación):**

- **GraphRAG / cerebro:** lectura + explicación + sugerencia (human-in-the-loop).
- **Diagramas de flujo:** ejecución parametrizada, auditable, multi-tenant (`empresaId`).
- **Agentes actuales:** capa intermedia (batch/event) que puede **alimentarse** del grafo y **disparar** workflows, sin saltarse guardrails fiscales.

---

## 4. Mecánicas (cómo funcionaría por dentro)

### 4.A Construcción del grafo (el “cerebro”)

**Nodos típicos ERP Claver (canónicos OPO + dominio AR):**

| Nodo | Ejemplos en Prisma / dominio |
|------|------------------------------|
| Empresa / Sucursal / Usuario | multi-tenant, roles |
| Cliente / Proveedor | CC, CP, fiado |
| Producto / Categoría / ListaPrecio | stock, POS, e-commerce |
| Pedido / Factura / NC / ND / Remito | ventas, AFIP |
| Compra / OC / Recepción | compras, landed cost |
| MovimientoStock / Depósito | stock, picking |
| Caja / MovimientoCaja / Banco / Cheque | tesorería |
| Asiento / Cuenta / CentroCosto | contabilidad |
| Impuesto / Período IVA-IIBB / Retención | fiscal |
| Mesa / Comanda / Plato | hospitalidad |
| Lote / Sensor / Contrato grano | agro |
| Ticket / Implementación | soporte + Claver Cloud |
| Proceso / Documento / WorkflowInstancia | BPM |

**Relaciones (edges) de alto valor:**

| Relación | Uso GraphRAG / flujo |
|----------|----------------------|
| `Cliente -[:COMPRÓ]-> Factura -[:INCLUYE]-> Producto` | “Qué le vendo a X y con qué margen” |
| `Factura -[:GENERA]-> Asiento` | Trazabilidad contable |
| `Factura -[:IMPACTA]-> MovimientoStock` | Causas de quiebre |
| `Compra -[:INGRESA]-> Stock -[:SALE_POR]-> Venta` | Cadena de abastecimiento |
| `Cliente -[:DEBE]-> CuentaCobrar` | Cobranzas inteligentes |
| `Pedido -[:DISPARA]-> Picking -[:GENERA]-> Remito -[:CIERRA_EN]-> Factura` | O2C visual |
| `Alerta -[:ORIGEN]-> Entidad` | Centro de alertas explicable |
| `WorkflowPaso -[:SIGUE_A]-> WorkflowPaso` | Diagrama de proceso ejecutable |
| `Evento -[:DISPARA]-> Agente | n8n | VirtualWorker` | Orquestación |

**Sync propuesto (sin implementar aún):**

1. **Event-driven:** cada evento del EventBus (`VENTA_EMITIDA`, `STOCK_BAJO`, …) upsert en grafo.  
2. **Batch nightly:** reconciliación full de maestros + docs abiertos.  
3. **Multi-tenant:** **siempre** partición por `empresaId` (igual que `whereEmpresa`).

### 4.B GraphRAG (consulta)

1. Usuario pregunta en lenguaje natural.  
2. LLM (o router) decide: ¿necesita Cypher / traversal / SQL / snapshot?  
3. Se recuperan subgrafos relevantes (k-hop, filtros de fecha/sucursal).  
4. Se genera respuesta con **citas a nodos** (factura #, cliente, asiento).  
5. Opcional: “sugerir acción” → abre workflow o tarea humana (nunca AFIP/caja sin confirmación).

### 4.C Diagrama de flujos

1. Analista dibuja o la IA **propone** un flujo (Ingeniería Funcional).  
2. Se materializa en `WorkflowRubro` / n8n / OPO canvas.  
3. Runtime ejecuta con audit trail (`WorkflowPasoLog`).  
4. UI React Flow muestra estado live de instancias.

---

## 5. Resultados de negocio que se buscan

| Resultado | Cómo se mide |
|-----------|--------------|
| Menos tiempo buscando “por qué pasó X” | Tiempo de root-cause (minutos vs horas) |
| Menos errores de proceso entre módulos | % eventos con cadena completa (venta→stock→asiento→caja) |
| Mejor adopción del ERP | % usuarios que usan chat / diagrama vs solo menús |
| Diferenciación vs Tango/SAP/Protheus | Demo de “explicame esta factura en el grafo” |
| Compliance | Toda acción de escritura auditada; IA solo lectura por default |
| Upsell comercial | SKU “Cerebro / Graph Intelligence” o “Ingeniería Funcional” en marketplace |

---

## 6. Mapa por servicio / módulo de claver.com.ar

Leyenda de valor:

- **G** = Cerebro LLM / GraphRAG (entender, explicar, predecir)  
- **F** = Diagrama de flujos / BPM visual (orquestar, aprobar, automatizar)  
- **Prioridad:** P0 crítica · P1 alta · P2 media · P3 nice-to-have  
- **Base existente:** qué no hay que construir de cero

### 6.1 Core comercial y operaciones (dashboard ERP)

| Servicio | G | F | Prioridad | Para qué serviría | Base existente |
|----------|---|---|-----------|-------------------|----------------|
| **POS / Caja** | ●● | ● | P1 | Explicar desvíos de arqueo; grafo ticket→medio pago→caja; flujo de cierre Z | Caja, agentes, automation `cierre-caja` |
| **Ventas / Facturas / Pedidos** | ●●● | ●●● | **P0** | Grafo O2C; “quién compró qué y con qué deuda”; flujo presupuesto→pedido→factura→NC | Facturas, pedidos, context-builder, workflows |
| **Presupuestos / Cotizaciones** | ●● | ●● | P1 | Conversión presupuesto→venta; flujo de aprobación comercial | APIs presupuesto/cotizaciones |
| **Notas crédito/débito** | ●● | ●● | P1 | Cadena factura↔NC↔stock↔asiento (root cause fiscal) | NC/ND + hooks contables |
| **Remitos** | ● | ●● | P1 | Flujo entrega sin facturar / 3-way | Módulo remitos |
| **Compras / Proveedores** | ●●● | ●●● | **P0** | P2P: OC→recepción→factura→pago; 3-way matching visual | compras-service, agente compras |
| **Stock / Productos / Transferencias** | ●●● | ●● | **P0** | Multi-hop stock: venta+compra+OP+merma; reposición explicable | stock, agente alertas-stock |
| **Picking** | ● | ●●● | P1 | Flujo pedido B2B→ola picking→despacho | picking-service, playbook n8n |
| **Listas de precio / Motor precios** | ●● | ● | P2 | Grafo producto–lista–cliente–promo | motor-precios |
| **Clientes / CRM / Fiado** | ●●● | ●● | **P0** | Riesgo cliente (deuda+frecuencia+productos); flujo cobranza | CRM, fiado, agente cobranzas |
| **Cuentas a cobrar / pagar** | ●●● | ●● | P1 | Aging como grafo; flujos de pago/cobro con aprobación | cc-cp services |
| **Banco / Cheques / Cashflow** | ●● | ●● | P1 | Conciliación como matching grafo extracto↔movimientos | banco, cheques handlers |
| **Contabilidad** | ●●● | ●● | **P0** | Trazabilidad asiento↔origen; detectar huérfanos; cierre | asiento-service, inflacion |
| **Impuestos (IVA/IIBB/SICORE/TES/CITI)** | ●● | ●●● | **P0** | Flujo pre-presentación; grafo percepción/retención por comprobante | tax engine, liquidaciones |
| **AFIP / CAE** | ● | ●●● | **P0** | Flujo emisión + retry (no dejar al LLM emitir solo) | afip services, playbook CAE |
| **Reportes / KPIs / BI** | ●●● | ● | P1 | Preguntas NL → subgrafo + métricas; lineage del KPI | reporting, olap |
| **Aprobaciones / Mis tareas** | ● | ●●● | P1 | Tablero de flujos pendientes human-in-the-loop | workflow-approval-queue |
| **Automatización / Agentes** | ●● | ●●● | P1 | Canvas: evento→agente→acción; GraphRAG explica *por qué* corrió | agentes, automation hub |
| **IA (chat actual)** | ●●● | ● | **P0** | Evolucionar context-builder → GraphRAG; citas a entidades | `/dashboard/ia` |
| **Config / Usuarios / Auditoría** | ● | ●● | P2 | Flujo onboarding usuario; grafo permisos (SoD) | auth, audit |
| **Campos personalizados / Maestros** | ● | ● | P3 | Metadatos del grafo por tenant | maestros APIs |
| **Onboarding / Capacitación** | ●● | ●● | P1 | IA explica el proceso del rubro con diagrama | onboarding-ia, agentes |
| **Documentación in-app** | ●● | ● | P2 | RAG docs + grafo de módulos | content/docs MDX |
| **Integraciones (ML, MP, Shopify, TN, WA)** | ●● | ●●● | P1 | Flujo webhook→pedido→stock; grafo canal multi-marketplace | integrations/* |
| **eCommerce / Tienda** | ●● | ●● | P2 | Pedido web → ERP; stock unificado en grafo | ecommerce services |
| **Soporte / Tickets** | ●● | ●● | P2 | Ticket ligado a tenant/módulo/factura; flujo SLA | tickets-service |

### 6.2 Verticales y nichos

| Servicio | G | F | Prioridad | Valor principal |
|----------|---|---|-----------|-----------------|
| **Hospitalidad (KDS, mesas, platos, delivery)** | ●● | ●●● | P1 | Flujo mesa→comanda→cocina→caja→stock receta |
| **Agenda / Turnos** | ● | ●● | P2 | No-show → reprogramación; grafo cliente–servicio–profesional |
| **Historia clínica** | ●● | ●● | P1 | Trazabilidad paciente–visita–insumo (cuidado PHI; aislamiento fuerte) |
| **Membresías / Gym** | ●● | ●● | P2 | Renovación, morosidad, acceso |
| **Veterinaria** | ●● | ●● | P2 | Mascota–dueño–vacuna–venta |
| **Peluquería / belleza** | ● | ●● | P3 | Turno→consumo insumos→venta |
| **Industria / MRP** | ●●● | ●●● | P1 | BOM multinivel como grafo; OP consumo/ingreso |
| **Logística / Distribución / POD** | ●● | ●●● | P1 | Ruta–parada–entrega–POD; excepciones |
| **IoT / Mantenimiento / Calidad** | ●● | ●● | P2 | Sensor→alerta→OT mantenimiento |
| **Clavergrow Agro** (lotes, balanza, contratos, liquidaciones, CPE, cannabis, riego) | ●●● | ●●● | P1 | Cadena grano: contrato→ingreso balanza→liquidación→pizarra; riego como flujo IoT |
| **Inmobiliaria / Consorcios** | ●● | ●● | P2 | Unidad–contrato–expensa–moroso |
| **Concesionaria / Préstamos / Pagares** | ●● | ●● | P2 | Crédito–cuota–garantía en grafo |
| **Almacén Rosario / retail SKUs** | ●● | ●● | P1 | Promos, vales, mermas, panico: reglas como subgrafo operativo |
| **Vendedor en ruta** | ●● | ●● | P2 | Hoja de ruta + pedidos + cobranza en campo |

### 6.3 Plataforma Grupo Claver (fuera del tenant ERP clásico)

| Superficie | G | F | Prioridad | Valor |
|------------|---|---|-----------|-------|
| **Claver Cloud** (tenants, provisioning, billing, ops) | ●●● | ●●● | **P0** | Grafo org→tenant→SKU→implementación→ticket; flujo go-live |
| **OPO / Protheus bridge** | ●●● | ●● | **P0** | Ya es el knowledge graph canónico; GraphRAG sobre mappings legacy |
| **Marketplace / Apps / Nicho** | ●● | ● | P1 | Recomendar apps por rubro vía grafo de capacidades |
| **Claver Cliente** (portal tickets/facturas/scrum) | ●● | ●● | P1 | Cliente ve estado de implementación como flujo |
| **Clavernet** | ● | ● | P3 | Docs + marketplace partners |
| **Marketing / landings claver.com.ar** | ● | ● | P3 | No necesitan grafo operativo; sí demos del cerebro |
| **Portal proveedores / B2B** | ●● | ●● | P2 | OC–ASN–factura proveedor |
| **Ops / Implementation** | ●● | ●●● | P1 | Playbooks de implementación visuales |

---

## 7. Dónde **más** conviene cada enfoque

### 7.1 Prioridad GraphRAG (cerebro LLM)

Orden sugerido de ROI:

1. **Ventas + Clientes + Stock + Cobranzas** (preguntas diarias del dueño de PyME).  
2. **Contabilidad + Impuestos** (explicar origen de asientos y saldos, no liquidar solo).  
3. **Compras + Stock + MRP** (por qué falta mercadería / costo real).  
4. **Claver Cloud + OPO** (soporte interno: “qué le pasó a este tenant”).  
5. **Agro e Industria** (cadenas largas, alto valor de multi-hop).

### 7.2 Prioridad diagramas de flujo (BPM visual)

1. **AFIP / emisión / retry CAE** (proceso crítico, debe ser determinístico).  
2. **O2C y P2P** (pedido a caja; compra a pago) con aprobaciones.  
3. **Hospitalidad cocina / picking / logística**.  
4. **Automation Hub + n8n** (ya hay plantillas; unificar canvas).  
5. **Workflow engine por rubro** (parametrización vertical sin código).  
6. **Implementación Claver Cloud** (onboarding de clientes Claver).

### 7.3 Dónde **no** forzar grafo/LLM

| Área | Motivo |
|------|--------|
| Emisión fiscal automática sin humano | Riesgo legal/AFIP; mantener guardrails actuales |
| Pagos / transferencias autónomas | Fraude y SoD |
| Historia clínica con datos sensibles en grafo compartido | Privacidad; tenant isolation extremo |
| UI de maestros simples (CRUD categorías) | ROI bajo |
| Marketing landings | No es runtime de negocio |

---

## 8. Arquitectura objetivo (investigación, no implementación)

```
                    ┌──────────────┐
  Usuario ─────────►│ Chat / UI    │◄──── React Flow (OPO + Workflows)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        GraphRAG      Snapshot RAG   Workflow Engine
        (multi-hop)   (hoy: context-  (Prisma + n8n
                       builder)        + virtual workers)
              │            │            │
              └────────────┼────────────┘
                           ▼
                    EventBus + Prisma
                    (source of truth)
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     Projection Graph            Postgres operativo
     (Neo4j u opción             (ERP actual)
      Postgres/AGE)
```

**Decisión abierta (a validar en fase diseño):**

| Opción | Pros | Contras |
|--------|------|---------|
| **A. Neo4j Aura** | GraphRAG maduro, Cypher, comunidad | Costo, otra DB, sync, ops |
| **B. Solo Postgres** (relaciones + recursive CTE / Apache AGE / vistas grafo) | Menos infra, multi-tenant simple | Menos tooling GraphRAG |
| **C. Híbrido** | OPO canvas + proyección selectiva a Neo4j solo para tenants premium | Complejidad media |

Recomendación de investigación: **C para producto comercial** (SKU premium “Cerebro”); **B como MVP** si se quiere velocidad sin nuevo vendor.

---

## 9. Entidades OPO actuales vs grafo ERP completo

Hoy OPO bridge expone de forma explícita:

- `Customer`, `Product`, `Invoice`, `Order`, `Supplier`

**Extensión natural del cerebro** (prioridad):

| Fase | Entidades a proyectar |
|------|------------------------|
| MVP | + StockMovement, Payment, AccountReceivable, JournalEntry |
| Fase 2 | + TaxPeriod, BankTx, Cheque, Remito, CreditNote |
| Fase 3 | + WorkOrder/BOM, Shipment, Appointment, IoTAlert, Ticket, TenantSKU |

---

## 10. Alineación con la info de “Cerebro Visual” (validación)

| Afirmación de la info de referencia | ¿Aplica a Claver? | Comentario |
|-------------------------------------|-------------------|------------|
| Neo4j + React Flow + LangChain | Parcial | React Flow ya está (OPO); Neo4j y LangChain GraphRAG **no** están |
| Entidades Cliente/Producto/Pedido/Factura | Sí | Coinciden con OPO + Prisma |
| Sync ERP → grafo por API/Cron | Sí | EventBus + cron son mejores fuentes que solo poll |
| Chat streaming Next.js | Sí | Patrón ya usado en `/api/ai` |
| Resultados: explicar, descubrir, orquestar | Sí | Separar explicar (G) de orquestar (F) |
| Stack mínima Next+RF+Neo4j+LC | MVP de mercado | En Claver conviene **partirse en MVP sobre lo existente** |

---

## 11. Mecánicas detalladas (referencia) mapeadas a Claver

### 11.A Construcción del grafo — relaciones canónicas

La info de referencia propone edges como:

```
Cliente  -[HIZO]->     Pedido
Pedido   -[CONTIENE]-> Producto
Producto -[AFECTA]->   Stock
Pedido   -[GENERA]->   Factura
Documento-[EXPLICA]->  Proceso
```

**Traducción al dominio Claver (Prisma + OPO + EventBus):**

| Edge de referencia | En Claver (conceptos reales) | Fuente de verdad hoy | Evento de sync (si existiera proyección) |
|--------------------|------------------------------|----------------------|------------------------------------------|
| `Cliente -[HIZO]-> Pedido` | `Cliente` → `PedidoVenta` (o venta POS) | Prisma | (pedido creado; hoy parcial) |
| `Pedido -[CONTIENE]-> Producto` | líneas de pedido / factura / ticket POS | Prisma lineas | `FACTURA_EMITIDA`, pedido |
| `Producto -[AFECTA]-> Stock` | `Producto` → `MovimientoStock` / stock por depósito | `lib/stock/*` | `STOCK_ACTUALIZADO` ✅ en EventBus |
| `Pedido -[GENERA]-> Factura` | pedido/presupuesto → `Factura` | ventas + AFIP | `FACTURA_EMITIDA` ✅ |
| `Documento -[EXPLICA]-> Proceso` | MDX docs, tickets, workflows, OPO process | `content/docs`, soporte, `Workflow*` | extracción LLM (futuro) |

**Edges de alto valor extra (imprescindibles en ERP AR, no en el ejemplo genérico):**

| Edge | Por qué |
|------|---------|
| `Proveedor -[SUMINISTRA]-> Producto` | Pregunta demo: “si falla proveedor X…” |
| `Producto -[INCLUIDO_EN]-> Factura/Pedido` | impacto a clientes |
| `Cliente -[ES_VIP / segmento]-> Tag` | filtro VIP (lista precio, CRM, límite crédito) |
| `Factura -[GENERA]-> AsientoContable` | trazabilidad contable |
| `Factura -[IMPACTA]-> MovimientoCaja/Banco` | tesorería |
| `Compra -[INGRESA]-> Stock` | P2P |
| `Factura -[ORIGINA]-> CuentaCobrar` | cobranzas multi-hop |
| `WorkflowPaso -[SIGUE_A]-> WorkflowPaso` | diagrama de proceso ejecutable |
| `TicketSoporte -[REFIERE]-> Tenant/Módulo` | Claver Cloud |

**Extracción desde documentos no estructurados (manuales, tickets, PDFs, correos):**

| Fuente en Claver | ¿Existe hoy? | Uso en grafo |
|------------------|--------------|--------------|
| Docs MDX in-app | Sí (`content/docs`) | Nodos `Documento` → módulos/procesos |
| Tickets soporte | Sí (`tickets-service`) | Relacionar síntoma → módulo → tenant |
| Manuales capacitación | `/dashboard/capacitacion` | Onboarding por grafo |
| Correos / WhatsApp | Parcial (WA mensajes IA) | Fase 2 — alto ruido, baja prioridad MVP |
| PDFs de procesos | No centralizado | OCR + LLM extractor (fase 3) |

> **Regla:** el grafo operativo (pedidos, stock, facturas) se llena desde **Prisma/EventBus**, no desde PDFs. Los PDFs solo enriquecen la capa `Documento -[EXPLICA]-> Proceso`.

### 11.B Visualización (lo que ve el usuario) — React Flow

Capacidades de la referencia vs estado Claver:

| Capacidad UX | Referencia | En Claver hoy | Gap |
|--------------|------------|---------------|-----|
| Zoom / pan / canvas | React Flow | OPO Studio (`GraphCanvas` en monorepo `opo/`) | Integrar canvas **dentro** del dashboard ERP tenant, no solo OPO/legacy |
| Filtrar por tipo de nodo | Sí (ej. solo Pedidos+Clientes) | Parcial en OPO | Filtros por dominio ERP (Cliente/Producto/Factura/Stock) |
| Clic en nodo → datos reales del ERP | Deep-link a ficha | OPO muestra mappings; ERP tiene fichas en `/dashboard/*` | Panel lateral: nodo → `authFetch` a API del módulo |
| Caminos entre entidades | Path finding visual | No en ERP | “Camino: Proveedor → Producto → Pedido → Cliente VIP” |
| Multi-tenant isolation | — | Obligatorio (`empresaId`) | Todo layout del grafo scoped por empresa |

**UI sugerida (cuando se implemente — no ahora):**

- Ruta conceptual: `/dashboard/cerebro` o pestaña en `/dashboard/ia`
- Componentes: reutilizar patrones de `components/opo/*` + shadcn Sheet para detalle de nodo
- Dependencia: `@xyflow/react` hoy está en el subproyecto OPO, **no** en el `package.json` raíz del ERP

### 11.C GraphRAG — flujo de la pregunta “demo killer”

**Pregunta de referencia:**

> *“¿Qué pedidos de mis clientes VIP se pueden retrasar si el proveedor X falla?”*

Esto **no** lo resuelve bien el `context-builder` actual (snapshot de ventas/stock/deudores). Requiere **recorrido multi-hop**:

```
1. Nodo Proveedor X
2. -[SUMINISTRA]-> Productos P1..Pn
3. <-[CONTIENE]- Pedidos abiertos que usan P1..Pn
4. -[HIZO / PERTENECE]-> Clientes
5. Filtro: cliente.segmento = VIP (o lista precio / tag CRM / límite alto)
6. Empaquetar subgrafo JSON → LLM
7. Respuesta + lista de IDs + enlaces a /dashboard/ventas/pedidos?id=...
```

| Tipo | Cómo responde | Calidad en ERP Claver hoy |
|------|---------------|---------------------------|
| **RAG normal / snapshot** | Texto o KPIs agregados similares a la pregunta | Regular — es lo que hace el chat actual |
| **SQL ad-hoc** | Joins fijos si un dev los escribió | Buena si la query existe; no generaliza |
| **GraphRAG** | Navega relaciones de negocio | Objetivo — **no implementado** |

**Pasos del motor GraphRAG (diseño):**

1. Clasificar intent (riesgo proveedor / cobranza / stock / fiscal…).  
2. Resolver entidades mencionadas (NER + match a IDs Prisma).  
3. Ejecutar traversal (Cypher **o** queries Prisma multi-hop / CTE).  
4. Recortar subgrafo (límites: N nodos, ventana de fechas, solo abiertos).  
5. Prompt al LLM con subgrafo + guardrails (`AI_CANNOT_DO`).  
6. Devolver respuesta + **evidencia** (nodos tocados) para UI y auditoría.

### 11.D Resultados esperados — impacto en Claver

| Resultado esperado | Descripción | ¿Cómo se materializa en Claver? | Impacto típico |
|--------------------|-------------|----------------------------------|----------------|
| **Búsquedas complejas ultra rápidas** | Preguntas de 5–6 tablas sin unir a mano | GraphRAG sobre proyección; hoy: menús + reportes + chat snapshot | Horas → segundos (si el grafo está sync) |
| **Entender dependencias reales** | Un cambio en un módulo afecta a otros | Visualizar edges EventBus + `CONECCIONESENTREMOD`; canvas de proceso | Menos sorpresas en go-live |
| **Onboarding más rápido** | Nuevo empleado explora el grafo | Capacitación + OPO + mapa O2C/P2P | Menos semanas de entrenamiento |
| **AI que conoce la empresa** | No genérico: tus procesos y datos | Evolucionar chat desde snapshot → subgrafo | Mayor adopción del módulo IA |
| **Riesgos y cuellos de botella** | “Si falla proveedor X…” | Multi-hop Proveedor→Producto→Pedido→Cliente | Mejor decisión de compras/stock |
| **Documentación viva** | Procesos actualizados solos | Workflow instancias + docs ligados a nodos `Proceso` | Docs que no mienten |
| **Trazabilidad / explicabilidad** | Por qué el AI concluyó X | Panel de evidencia (IDs de factura, pedido, stock) | Auditoría y confianza |
| **Memoria persistente** | Conversaciones / proyectos | Hoy chat con historial limitado; grafo + hilos por empresa | No repetir contexto |

**Qué NO promete el grafo solo:** emitir CAE, pagar proveedores, ni reemplazar el workflow engine / n8n para ejecución.

---

## 12. Roadmap de investigación → producto (sin ejecutar aún)

| Fase | Objetivo | Entregable conceptual | Dependencias |
|------|----------|----------------------|--------------|
| **0. Esta investigación** | Mapa por servicio + mecánicas | Este documento | — |
| **1. Diseño de grafo canónico** | Esquema nodos/edges multi-tenant | Spec + overlap OPO | OPO types, Prisma |
| **2. MVP visual sin Neo4j** | React Flow sobre 1 flujo O2C + 1 P2P leído de Prisma | Página “Mapa del proceso” read-only | workflow + eventos |
| **3. GraphRAG MVP** | Chat multi-hop pregunta proveedor VIP | Mejoras a context-builder o proyector | IA actual |
| **4. Decision Neo4j** | PoC costo/latencia/sync | Informe go/no-go | Fase 3 métricas |
| **5. Ingeniería Funcional** | Editor de flujos con IA que propone pasos | Unifica workflow-engine + RF | `introspeccion.md` |
| **6. Monetización** | SKU “Cerebro Claver” | Pricing + entitlements | billing/marketplace |

---

## 13. Plan paso a paso — primeras 2–3 semanas (cuando se decida construir)

> **Estado:** plan de trabajo **propuesto**, no ejecutado.  
> **Principio:** MVP **sin Neo4j obligatorio**; source of truth = Prisma; grafo = proyección en memoria o tablas auxiliares; Neo4j solo si el PoC lo justifica.

### Semana 1 — Esquema + lectura multi-hop (backend)

| Día | Tarea | Detalle concreto en este repo |
|-----|-------|-------------------------------|
| 1 | Spec del grafo MVP | Documentar nodos: `Cliente`, `Proveedor`, `Producto`, `PedidoVenta`, `Factura`, `StockSnapshot`. Edges: `HIZO`, `CONTIENE`, `SUMINISTRA`, `GENERA`, `AFECTA_STOCK`. Siempre `empresaId`. |
| 1–2 | Capa `lib/cerebro/` (o `lib/graph/`) | Tipos TypeScript del grafo + mapper Prisma → nodos/edges. **Sin** nueva DB al inicio. |
| 2–3 | Traversal “riesgo proveedor” | Función pura: `impactoProveedor(empresaId, proveedorId, { soloVip, soloAbiertos })` con Prisma joins (compra/producto/pedido/cliente). Tests Vitest. |
| 3 | API read-only | `GET /api/cerebro/subgraph?focus=proveedor&id=` y `POST /api/cerebro/ask` (stub) con `getAuthContext` + `whereEmpresa`. |
| 4–5 | Enriquecer context-builder | Si la pregunta matchea intents de riesgo/cadena, inyectar subgrafo JSON al prompt del chat existente (`lib/ai/*`) en lugar de solo snapshot. |
| 5 | Criterio de aceptación S1 | Dada empresa demo, la pregunta del proveedor X devuelve lista de pedidos+clientes con IDs reales (aunque el texto del LLM sea simple). |

**Estructura de carpetas sugerida (cuando se implemente):**

```
lib/cerebro/
  types.ts              # Node, Edge, Subgraph, empresaId
  schema-mvp.ts         # catálogo de labels y relationship types
  mappers/prisma.ts     # Prisma rows → nodos
  traversals/
    riesgo-proveedor.ts
    o2c-cliente.ts
  subgraph-service.ts   # orquesta mappers + traversals
  graphrag-prompt.ts    # empaqueta subgrafo para el LLM
app/api/cerebro/
  subgraph/route.ts
  ask/route.ts
components/cerebro/
  cerebro-canvas.tsx    # React Flow (xyflow)
  node-detail-sheet.tsx
  filters-bar.tsx
app/dashboard/cerebro/
  page.tsx
```

**Esquema lógico del grafo MVP (no Cypher aún):**

```
(:Empresa {id})
(:Cliente {id, nombre, vip/segmento, empresaId})
(:Proveedor {id, nombre, empresaId})
(:Producto {id, sku, nombre, empresaId})
(:Pedido {id, estado, empresaId})
(:Factura {id, total, estado, empresaId})
(:Stock {productoId, depositoId, cantidad, empresaId})

(Cliente)-[:HIZO]->(Pedido)
(Pedido)-[:CONTIENE {qty}]->(Producto)
(Proveedor)-[:SUMINISTRA]->(Producto)
(Producto)-[:AFECTA]->(Stock)
(Pedido)-[:GENERA]->(Factura)
```

### Semana 2 — Visualización React Flow + deep-link ERP

| Día | Tarea | Detalle |
|-----|-------|---------|
| 1 | Dependencia `@xyflow/react` en app principal | Hoy solo en subproyecto OPO; decidir si reexportar o instalar en root. |
| 1–2 | Canvas read-only | Layout force/hierarchical del subgrafo devuelto por API. Zoom, pan, minimap. |
| 2–3 | Filtros | Toggle tipos de nodo; “solo abiertos”; rango de fechas. |
| 3–4 | Detalle de nodo | Al click: Sheet con datos de API existente (`/api/clientes`, productos, facturas…) + link a página dashboard. |
| 4 | Highlight de camino | Resaltar path Proveedor → … → Cliente VIP. |
| 5 | Integración UI IA | Desde `/dashboard/ia`, botón “Ver en grafo” que abre `/dashboard/cerebro` con el último subgrafo. |
| 5 | Criterio S2 | Usuario no técnico ve el camino del proveedor X en canvas y abre un pedido real. |

**Config React Flow (conceptual):**

- Nodos custom por tipo (color: Cliente=azul, Proveedor=ámbar, Producto=verde, Pedido=violeta, Factura=rojo).  
- `fitView` al cargar subgrafo.  
- No editar edges en MVP (solo lectura). Edición = fase “Ingeniería Funcional” / workflows.

### Semana 3 — GraphRAG usable + sync + decisión Neo4j

| Día | Tarea | Detalle |
|-----|-------|---------|
| 1–2 | `POST /api/cerebro/ask` completo | Intent router → traversal → prompt con subgrafo + citas → respuesta stream (mismo patrón que `/api/ai/chat`). |
| 2 | 3 preguntas demo fijas | (1) Riesgo proveedor VIP (2) “¿Por qué bajó el stock de SKU Y?” (3) “¿Qué facturas de Z no tienen asiento?” si hay datos. |
| 3 | Sync incremental mínimo | Handler EventBus: `FACTURA_EMITIDA`, `STOCK_ACTUALIZADO`, `COMPRA_REGISTRADA` invalidan caché de subgrafo / marcan dirty (no hace falta Neo4j). |
| 4 | PoC Neo4j opcional | Script one-off: proyectar 1 empresa demo a Aura free; comparar latencia vs Prisma multi-hop. **Go/no-go** documentado. |
| 5 | Guardrails + docs | Reforzar que GraphRAG no emite AFIP ni paga; feature flag `modulos.cerebro` o `ia`; entrada en docs de investigación → “listo para producto”. |
| 5 | Criterio S3 | Demo interna de 10 min: pregunta → respuesta con IDs → grafo resaltado → ficha ERP. |

### Primer sync de datos (diseño)

| Modo | Cuándo | Cómo |
|------|--------|------|
| **Cold start** | Primera activación del módulo | Job: leer maestros + docs abiertos (N días) → materializar nodos/edges en memoria o tabla `CerebroEdge` (si se prefiere persistir en Postgres) |
| **Incremental** | Runtime | EventBus handlers marcan dirty / upsert edges afectados |
| **Reconcile nightly** | Cron existente | Re-scan consistencia (mismo patrón que crons AFIP/automation) |

**No usar Airbyte en MVP** — el ERP ya tiene eventos y Prisma.

### Fuera de alcance de las 2–3 semanas

- Neo4j en producción multi-tenant  
- Extracción masiva de PDFs/correos  
- Editor low-code de procesos con escritura  
- Verticales agro/hospitalidad en el grafo  
- Memoria conversacional larga tipo “proyecto”  
- Sustituir n8n o workflow-engine  

### Checklist de decisión al final de la semana 3

| Pregunta | Si sí… | Si no… |
|----------|--------|--------|
| ¿Prisma multi-hop < 500ms en demo realista? | Seguir sin Neo4j | Evaluar Neo4j/AGE |
| ¿Usuarios entienden el canvas? | Invertir en más traversals | Mejorar UX o solo chat+evidencia |
| ¿Alucinaciones de montos? | Citas obligatorias + números solo desde JSON del subgrafo | No expandir a fiscal |
| ¿Entitlement comercial claro? | SKU marketplace | Dejar flag interno Claver |

---

## 14. Resumen ejecutivo actualizado

| Tema | Conclusión |
|------|------------|
| **Software principal (mercado)** | Next.js + React Flow + Neo4j + LangChain |
| **Software principal (Claver realista)** | Next.js + (xyflow) + Prisma multi-hop / proyección + LLM actual + EventBus; Neo4j opcional post-PoC |
| **Mecánica clave** | Grafo con datos reales + GraphRAG que razona sobre **relaciones**, no solo texto |
| **Pregunta estrella** | “Si falla el proveedor X, ¿qué pedidos VIP se retrasan?” |
| **Resultado principal** | De ERP de búsqueda manual → sistema que explica dependencias y apoya decisiones |
| **Ya tenemos** | OPO canvas, chat IA, agentes, EventBus, workflows, n8n |
| **Falta** | Capas `lib/cerebro` traversals, UI grafo en dashboard, GraphRAG en el chat, decisión Neo4j |
| **Próximo paso si se aprueba construir** | Ejecutar plan §13 semana 1 (spec + `impactoProveedor` + tests) |

---

## 15. Nivel 3D premium + bajo costo (validación realista para Claver)

> **Estado:** investigación de UX/stack visual — **no implementado**.  
> Complementa §11–13: el **valor de negocio** es GraphRAG; el **3D** es capa de producto/demo/wow, no el cerebro en sí.

### 15.1 Veredicto

**Sí se puede** un look 3D premium y futurista en el monorepo Next.js de Claver **manteniendo bajo costo de infra**, si se usa una **arquitectura híbrida** (vista principal liviana + modo inmersivo opcional) y se evita “todo en Three.js desde el día 1”.

El costo real a vigilar no es solo Vercel/Neo4j/Groq: es **tiempo de desarrollo, bundle del ERP, performance en notebooks baratos de PyME, y mantenimiento multi-tenant**.

### 15.2 Stack de la referencia vs stack real de Claver (2026-07)

| Capa | Referencia “3D premium bajo costo” | Claver **hoy** | Ajuste realista |
|------|-------------------------------------|----------------|-----------------|
| Framework | Next.js **16** + TS | Next.js **15.5** + React 19 + TS | No forzar upgrade a 16 por el cerebro; 15 alcanza |
| UI premium | shadcn + **Aceternity UI** + Framer Motion | shadcn + Tailwind v4 + Framer Motion ✅ · Aceternity **no** | Copiar componentes sueltos de Aceternity (MIT) a `components/ui` o `components/cerebro/fx` — no un “rewrite” del design system |
| Grafo 2D/flujo | (antes xyflow) | OPO usa **@xyflow/react** en subproyecto | Mantener xyflow para **BPM / Ingeniería Funcional** |
| Grafo 3D principal | **Reagraph** (WebGL force-directed) | No instalado | Candidato fuerte para vista principal del cerebro |
| Modo inmersivo | **R3F** + drei + postprocessing | No instalado | Solo lazy/dynamic en “Modo Espacial” |
| Graph DB | Neo4j Aura Free | Postgres/Prisma | Ver §8: MVP sin Neo4j; Aura Free si PoC lo pide |
| LLM | LangChain + **Groq** / Gemini Flash | `/api/ai/*` (proveedor configurable en `ai-config`) | Groq/Gemini como opción de costo; no acoplar UI 3D al vendor LLM |
| Hosting | Vercel Hobby/Pro | Vercel (proyecto) | OK; ojo a límites de serverless/timeout en GraphRAG |
| Animaciones | FM + GSAP puntual | Framer Motion ✅ · GSAP no | GSAP solo si un efecto no se resuelve con FM |

**Conclusión de stack visual recomendada para Claver:**

```
Capa negocio (siempre):  Prisma multi-hop / proyección + EventBus + chat GraphRAG
Capa UI trabajo diario:  Reagraph 3D (o 2D force) — viewport del cerebro
Capa wow / demo / ventas: R3F “Modo Espacial” — dynamic import, feature flag
Capa procesos/BPM:       React Flow (xyflow) — NO mezclar con el grafo de datos 3D
Capa look:               shadcn + OKLCH themes + Framer Motion (+ 2–4 piezas tipo Aceternity)
```

### 15.3 Arquitectura híbrida inteligente (recomendada)

```
┌─────────────────────────────────────────────────────────────┐
│  /dashboard/cerebro  (client island, feature-flag)          │
│                                                             │
│  ┌──────────────────────┐   ┌────────────────────────────┐  │
│  │ Vista Principal      │   │ Chat GraphRAG (sheet/dock) │  │
│  │ Reagraph 3D/2D       │◄──┤ streaming + citas a nodos  │  │
│  │ force-directed       │   └────────────────────────────┘  │
│  │ filtros, click nodo  │                                   │
│  └──────────┬───────────┘                                   │
│             │ botón "Modo Espacial" (solo desktop + WebGL)  │
│             ▼                                               │
│  ┌──────────────────────┐                                   │
│  │ ImmersiveShell       │  dynamic(() => import(...), {    │
│  │ R3F + drei + bloom   │    ssr: false })                 │
│  │ partículas, fly-cam  │  NO se carga en el bundle base   │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
     GET /api/cerebro/subgraph  (mismos nodos/edges para 2D y 3D)
```

**Por qué híbrida y no 3D total:**

| Enfoque | Costo dev | Performance PyME | Mantenimiento | Wow comercial |
|---------|-----------|------------------|---------------|---------------|
| Solo xyflow 2D | Bajo | Excelente | Bajo | Medio |
| **Reagraph 3D principal** | Medio | Bueno si se limita N nodos | Medio | Alto |
| R3F full-time | Alto | Frágil en notebooks | Alto | Muy alto |
| **Híbrido Reagraph + R3F lazy** | Medio | Bueno | Medio | Muy alto en demo |

### 15.4 Features futuristas — factibilidad en Claver

| Feature | ¿Bajo costo infra? | Dificultad | Notas Claver |
|---------|--------------------|------------|--------------|
| Grafo 3D nodos brillantes | Sí | Media | Reagraph + tema dark OKLCH |
| Partículas / glow en edges | Sí | Media | Solo modo inmersivo; en principal, glow CSS/WebGL simple |
| Cámara libre entre nodos | Sí | Media-Alta | R3F immersive only |
| Glassmorphism + neon | Sí | Baja | Cuidado: el ERP ya es multi-tema; neon solo en `/cerebro` |
| Transiciones enter/exit | Sí | Baja | Framer Motion ya en proyecto |
| Chat flotante streaming | Sí | Baja | Reusar `AiChatPanel` / patrón actual |
| Performance decente | Sí con límites | Media | Cap nodos (ej. ≤200), lod, no SSR WebGL |
| Mobile / tablet POS | Relativo | Alta | 3D off en mobile: fallback lista + grafo 2D mínimo |

### 15.5 Costos mensuales — lectura crítica

| Item | Rango referencia | Lectura para Claver multi-tenant |
|------|------------------|----------------------------------|
| Vercel | $0–20 | OK al inicio; GraphRAG + sync puede empujar a Pro |
| Neo4j Aura | $0–49 | Free ok **1 grafo demo**; **N empresas** en un solo Aura Free se queda corto → partición por tenant o Postgres projection |
| LLM Groq/Gemini | $5–30 | Realista si hay límites por empresa y cache de subgrafo; agentes batch suman |
| Dominio | $0–15 | Ya existe claver.com.ar |
| **Total “un producto demo”** | **~$10–60** | Creíble |
| **Total “todos los tenants productivos con Neo4j + chat libre”** | **mucho más** | El free tier no escala lineal; planear entitlement SKU |

El **costo oculto** más grande: horas de ingeniería + regresiones de bundle en el ERP completo (POS, impuestos, etc.). Mitigación: **route-level code splitting** estricto en `/dashboard/cerebro`.

### 15.6 Plan concreto de UI 3D (cuando se construya — no ahora)

#### A) Estructura de carpetas

```
app/dashboard/cerebro/
  page.tsx                 # shell, feature flag, Suspense
  loading.tsx
components/cerebro/
  cerebro-shell.tsx        # layout: canvas + chat + filtros
  reagraph-viewport.tsx    # vista principal (dynamic, ssr:false)
  immersive/
    immersive-entry.tsx    # botón + gate WebGL/desktop
    immersive-scene.tsx    # R3F Canvas (dynamic)
    node-mesh.tsx
    edge-beams.tsx
    camera-rig.tsx
  node-detail-sheet.tsx
  filters-bar.tsx
  evidence-panel.tsx       # citas GraphRAG
  fx/                      # piezas tipo Aceternity (copiadas, no monorepo externo)
    spotlight.tsx
    background-beams.tsx
    glowing-card.tsx
lib/cerebro/
  types.ts
  subgraph-service.ts
  traversals/*
  layout-adapters/
    to-reagraph.ts         # { nodes, edges } → formato Reagraph
    to-r3f.ts              # posiciones + meta para escena
  performance.ts           # caps, sample, cluster
```

Separar **siempre** `lib/cerebro` (datos) de `components/cerebro` (WebGL). Mismo subgraph JSON alimenta Reagraph y R3F.

#### B) Cómo combinar Reagraph + R3F sin lío

| Regla | Detalle |
|-------|---------|
| **Un solo modelo de datos** | `Subgraph { nodes[], edges[] }` en `lib/cerebro/types` |
| **Adapters, no lógica duplicada** | `to-reagraph` / `to-r3f` solo transforman shape |
| **Un solo modo montado** | Al abrir inmersivo, desmontar Reagraph (o pausarlo); al salir, remount Reagraph |
| **Lazy total de Three** | `next/dynamic` + `ssr: false`; nunca import estático de `three` en layout del dashboard |
| **Estado en Zustand liviano** | `selectedNodeId`, `focusPath[]`, `immersiveOpen` — no meter el grafo entero en global store si es grande |
| **No mezclar con OPO canvas** | OPO/xyflow = ontología y BPM; Cerebro 3D = datos de negocio del tenant |

#### C) Componentes “Aceternity-like” útiles (copiar patrón, no dependencia mágica)

| Pieza | Uso en cerebro |
|-------|----------------|
| Spotlight / gradient background | Fondo de `/dashboard/cerebro` dark |
| Background beams / particles CSS | Ambiente sin WebGL en vista principal |
| Glowing border card | Card de evidencia GraphRAG |
| Floating dock / bento | Toolbar filtros + “Modo Espacial” |
| Text generate / shimmer | Streaming del chat |

**No** rediseñar todo el ERP con neon. El resto del dashboard sigue shadcn + temas OKLCH actuales; el “skin futurista” es **local al módulo Cerebro** (y landings de venta si se desea).

#### D) Esquema visual del grafo 3D (ERP)

Mismos nodos MVP del §13, con semántica de color/forma:

| Tipo nodo | Color sugerido | Forma / peso visual |
|-----------|----------------|---------------------|
| Cliente | Azul | Esfera; VIP = anillo/glow mayor |
| Proveedor | Ámbar | Octaedro / cubo |
| Producto | Verde | Esfera chica |
| Pedido | Violeta | Cilindro |
| Factura | Rojo suave | Prisma |
| Stock | Cyan | Tamaño ∝ cantidad (clamp) |

Edges:

- `SUMINISTRA` grueso si hay dependencia crítica  
- Path resaltado (riesgo proveedor → VIP) en neón; resto dimmed  
- Límite visual: si `nodes > 150`, cluster por tipo o “solo path + vecinos 1-hop”

#### E) Optimizaciones de performance (obligatorias)

| Optimización | Por qué |
|--------------|---------|
| **Cap de nodos/edges** en API (`maxNodes=200`) | Evita freeze del browser |
| **SSR off** para WebGL | Hydration hell + peso de servidor |
| **Dynamic import** de reagraph y three | Bundle del POS/impuestos no crece |
| **No render 3D en mobile** | `useMobile` → lista + mini-mapa 2D o mensaje “abrí en desktop” |
| **Pausar animaciones** si `document.hidden` | Ahorro GPU en pestaña de fondo |
| **Instancing** en R3F si muchos nodos | Un draw call vs N meshes |
| **Postprocessing solo immersive** | Bloom es caro; no en vista principal |
| **Debounce filtros** | Recálculo de layout force es costoso |
| **Cache subgrafo** TTL 30–60s por empresa+query | Menos tokens LLM y menos CPU |
| **Feature flag** `modulos.cerebro` / SKU | No cargar rutas en tenants sin entitlement |
| **Prefers-reduced-motion** | Respetar accesibilidad; desactivar partículas |

#### F) Orden de construcción UI (encaja con plan §13)

| Semana | Backend (§13) | UI 3D |
|--------|---------------|-------|
| 1 | Traversals + API subgraph | Shell vacío + lista/JSON debug (sin WebGL) |
| 2 | — | **Reagraph** principal + filtros + detail sheet + glass UI local |
| 3 | GraphRAG ask | Chat dock + highlight path; **botón Modo Espacial** mínimo (escena simple) |
| +1 (opcional) | Neo4j PoC | Pulir R3F (bloom, partículas) solo si demo comercial lo pide |

**No** empezar por R3F. El wow se monta cuando el subgraph ya es correcto.

### 15.7 Riesgos específicos del “premium 3D”

| Riesgo | Mitigación |
|--------|------------|
| Se ve lindo pero respuestas IA genéricas | Priorizar GraphRAG y citas; 3D es secundario |
| Bundle del monorepo se infla | Rutas aisladas + dynamic imports + medir con bundle analyzer |
| Clientes PyME con PCs débiles | Caps + fallback 2D + flag “modo liviano” |
| Aceternity + 10 themes OKLCH chocan | Skin solo en `/cerebro`; no tocar `globals` globales de más |
| Confundir grafo datos con editor BPM | Dos productos UI: Cerebro vs Workflow/OPO |
| Costo Neo4j multi-tenant | No bloquear MVP en Neo4j; proyección Postgres primero |

### 15.8 Recomendación final (3D + premium + bajo costo en Claver)

1. **Sí al híbrido:** Reagraph (principal) + R3F (inmersivo lazy).  
2. **Sí a look premium local:** Framer Motion + piezas tipo Aceternity solo en cerebro.  
3. **No a Next 16 / Neo4j / LangChain como prerequisito del wow visual.**  
4. **No a 3D full-time en el shell del ERP.**  
5. **Valor primero:** semana 1 datos multi-hop; semana 2 Reagraph; semana 3 GraphRAG + immersive mínimo.  
6. **Monetización natural:** SKU “Cerebro Visual” / “Modo Espacial” en marketplace (wow para demos comerciales y planes Pro).

---

## 16. Mapa mental: tres capas del producto “Cerebro”

| Capa | Pregunta que responde | Stack | Prioridad negocio |
|------|----------------------|-------|-------------------|
| **1. Inteligencia** | ¿Qué pasa en *mi* empresa y por qué? | GraphRAG + Prisma/Neo4j + chat | **P0** |
| **2. Operación visual** | ¿Cómo se conectan mis entidades? | Reagraph + filtros + deep-links | **P0/P1** |
| **3. Experiencia wow** | ¿Se siente producto del futuro? | R3F immersive + FX | **P2** (ventas/demo) |
| **(Paralela) BPM** | ¿Cómo se ejecuta el proceso? | xyflow + workflow engine + n8n | P0 procesos, UI distinta |

Implementar la capa 3 sin la 1 es un demoware caro de mantener.  
Implementar la 1 sin la 2 ya aporta valor.  
La 2 sin 3 sigue viéndose moderna si el UI shell es bueno.

---

## 17. Para qué sirve el cerebro si operás Claver desde Claver Cloud

> **Audiencia de esta sección:** operador / CEO de plataforma que maneja **todas las aplicaciones y clientes** desde `/claver-cloud` (organizations, tenants, provisioning, operations, implementation, marketplace, comercial, OPO, billing).  
> No es el mismo valor que el dueño de un almacén usando el ERP tenant.

Para quien gobierna Claver desde **Claver Cloud**, el cerebro no es solo “un chat lindo del ERP”. Es un **tablero de inteligencia de plataforma**: ve relaciones entre **cliente → contrato/SKU → tenant → módulos → salud → tickets → implementación → plata**.

Hay **dos cerebros** distintos. El que más aporta al operador de Cloud es el primero.

### 17.1 Cerebro de Claver Cloud (plataforma — el del operador)

Grafo a nivel **Grupo Claver**, no solo de un kiosco o un retail.

#### Nodos que importan en Cloud

| Nodo | Ejemplo |
|------|---------|
| **Organización / cliente comercial** | “Distribuidora Norte SA” |
| **Tenant / empresa ERP** | `empresaId` en producción |
| **App / SKU / pack** | POS, Impuestos, Hospitalidad, Agro, Automation, Cerebro… |
| **Plan / billing** | trial, Pro, módulos activos |
| **Implementación** | go-live, checklist, responsable |
| **Ticket de soporte** | “no emite CAE” |
| **Integración** | AFIP, Mercado Pago, Protheus/OPO, n8n |
| **Salud ops** | errores, cajas abiertas, jobs fallidos |
| **Comercial** | lead, relevamiento, pipeline |

#### Relaciones de alto valor (plataforma)

```
Cliente comercial ─suscribe→ Plan/SKU
       │
       ├─provisiona→ Tenant ERP
       │                ├─tiene→ Módulos activos
       │                ├─usa→ Integraciones (AFIP, MP…)
       │                ├─genera→ Alertas / errores
       │                └─abre→ Tickets
       │
       └─pasa por→ Implementación ─asignado a→ Analista/ops
```

#### Situaciones de Cloud → qué haría el cerebro

| Situación en Claver Cloud | Qué haría el cerebro |
|---------------------------|----------------------|
| “¿Cómo está el cliente X de punta a punta?” | Un solo mapa: plan, módulos, go-live, tickets abiertos, health, billing |
| “Si cae AFIP / falla CAE, ¿quién se quema?” | Tenants con facturación electrónica activa + volumen + tickets relacionados |
| “¿Qué apps del marketplace se pisan o se venden juntas?” | Grafo SKU ↔ rubro ↔ churn / uso real |
| “Este tenant está trabado en implementación” | Path: relevamiento → provisioning → checklist → bloqueos (certificados, stock, usuarios) |
| “Soporte: ticket ‘no puedo facturar’” | Ticket → tenant → módulo fiscal → últimos errores → config vs bug de plataforma |
| “¿A quién le subo de plan / le ofrezco Automation o IA?” | Clientes con mucho uso (stock/ventas) y sin SKU automation/cerebro |
| “Protheus + OPO: ¿qué entidades tiene mapeadas este cliente?” | Grafo OPO (Customer/Product/Invoice…) + gaps de bridge |
| “Antes de un release, ¿qué se rompe?” | Dependencias: módulo Y usado por N tenants de pago |
| “Equipo comercial en campo” | Lead → relevamiento → demo apps → tenant trial → conversión |
| “Cobranza de Claver (billing plataforma)” | Quién debe, trials por vencer, tenants activos sin pago |

En una frase: **dejar de saltar entre**  
`/claver-cloud/organizations` → `/tenants/[id]` → `/operations` → `/implementation` → `/billing` → tickets  
**y preguntar o ver el camino completo**.

#### Preguntas tipo GraphRAG del operador Cloud

- *“¿Qué tenants Pro con AFIP tuvieron error de CAE esta semana y tienen ticket abierto?”*
- *“Si desactivo el SKU Hospitalidad, ¿cuántos clientes de pago lo usan y en qué etapa de implementación están?”*
- *“Mostrame clientes trial que usan POS fuerte y no tienen impuestos: candidatos a upsell.”*
- *“¿Por qué el cliente Y sigue en implementación hace 20 días?”* → grafo de blockers.
- *“¿Qué analista tiene más tenants en rojo?”*

Eso es **GraphRAG de plataforma**, no el chat del dueño de un almacén.

#### Superficies Cloud existentes ↔ aporte del cerebro

| Área Cloud hoy (`nav-config` / rutas) | El cerebro aporta |
|---------------------------------------|-------------------|
| Command center (`/claver-cloud`) | KPIs + **porqués** (no solo números) |
| Registros web / comercial / campo | Embudo como grafo: lead → tenant → plata |
| Organizations / tenants | Ficha 360 del cliente |
| Provisioning | “Qué se activó y qué falta” como camino |
| Operations | Salud + impacto entre módulos / tenants |
| Implementation | Blockers y checklist vivos |
| Marketplace | Qué apps están ligadas a qué rubros/tenants |
| OPO / Protheus setup & console | Ontología + gaps de integración (base del puente semántico) |
| Billing | Dinero ↔ uso real ↔ riesgo de churn |
| Settings / assignments | Quién opera qué cartera de tenants |

**Nota:** OPO Console ya es un paso hacia “entender entidades”. El cerebro Cloud lo **amplía a negocio + ops + plata + soporte**, no solo Customer/Product/Invoice técnicos.

### 17.2 Cerebro del ERP del cliente (por tenant)

Cuando se entra a **operations / tenant** como lupa (soporte, implementación, demo), o se habilita IA al cliente final, el cerebro de **su** negocio responde cosas tipo:

- “Si falla el proveedor X, ¿qué pedidos VIP se retrasan?”
- “¿Quién me debe y qué le vendí?”
- Stock ↔ ventas ↔ caja ↔ asientos

#### Para qué le sirve eso al operador de Cloud

| Uso | Cómo ayuda al operador Cloud |
|-----|------------------------------|
| **Soporte L2** | Menos “mandame capturas de 6 pantallas”: subgrafo del problema con IDs |
| **Implementación** | Enseñar O2C/P2P en un mapa; onboarding más rápido |
| **Demo comercial** | Wow 3D + pregunta multi-hop = cerrar plan Pro / IA |
| **Confianza y escala** | El cliente siente que Claver entiende su empresa; menos dependencia 24/7 del operador |
| **Diagnóstico** | “¿Por qué no le cuadra la caja?” → factura → medio pago → movimiento caja |

El operador **no vive** en el POS de cada tenant; el cerebro del tenant es la **lupa** cuando un cliente duele o cuando se vende.

### 17.3 Contraste de valor

| Rol | Qué es el cerebro para él |
|-----|---------------------------|
| **Dueño del almacén / PyME** | “Mi empresa me habla” (ventas, stock, deudas, riesgos de proveedor) |
| **Operador en Claver Cloud** | “Mi red de clientes, apps y operaciones me habla” (cartera, SKUs, go-live, tickets, billing) |

### 17.4 Qué no resuelve (para no idealizar)

- No reemplaza criterio comercial ni un contador.
- No debe **provisionar, cobrar o emitir CAE solo** sin control humano.
- No hay magia si los datos de Cloud (módulos, tickets, billing) están desordenados: el grafo **proyecta** la verdad cargada.
- El **3D / modo espacial** sirve sobre todo para **demo e impacto**; el valor día a día del operador es **preguntar + camino + evidencia**.

### 17.5 Prioridad de construcción si el comprador primario es el operador Cloud

Orden **Cloud-first** (complementa el plan tenant §13; no lo reemplaza si también se vende cerebro al cliente final):

| Orden | Capa | Objetivo |
|-------|------|----------|
| **1** | Grafo plataforma | Cliente ↔ Tenant ↔ SKUs ↔ Implementation ↔ Tickets ↔ Billing |
| **2** | Preguntas ops/soporte | CAE, módulos, salud multi-tenant |
| **3** | Upsell / comercial | Uso real → oferta de app / plan |
| **4** | Cerebro por tenant | ERP GraphRAG como lupa y producto vendible |
| **5** | Modo 3D | Demos y key accounts |

Así el cerebro sirve **primero** para manejar Claver desde Cloud y **después** se reutiliza como **producto premium** dentro de cada app del cliente.

### 17.6 Rutas UI conceptuales (cuando se implemente)

| Cerebro | Ubicación conceptual | Scope |
|---------|----------------------|-------|
| Plataforma | `/claver-cloud/cerebro` o panel en command center | Cross-tenant (roles superadmin/ops) |
| Tenant | `/dashboard/cerebro` (feature flag / SKU) | Solo `empresaId` del tenant |
| Lupa ops | Deep-link desde `/claver-cloud/operations/[empresaId]` → cerebro tenant (impersonation / contexto seguro) | Lectura acotada + auditoría |

**Seguridad:** el grafo de plataforma **nunca** mezcla datos de negocio de un tenant en respuestas de otro sin rol y audit trail. El grafo tenant siempre filtra por `empresaId`.

### 17.7 Valor para el rol “manejo todo Claver desde Cloud” (resumen)

| Si el trabajo es… | El cerebro ahorra… |
|-------------------|--------------------|
| Ser el CEO operativo de Claver en Cloud | Visión 360 de cartera de clientes y productos |
| Escalar muchos tenants sin army de soporte | Root-cause en minutos, no en hilos eternos |
| Vender y upsell apps | Ver uso real y dependencias entre SKUs |
| Implementar y go-live | Mapa de blockers por cliente |
| Integrar legacy (Protheus/OPO) | Semántica + qué falta mapear |
| Releases con menos miedo | “Quién usa qué” antes de tocar un módulo |

**Próximo refinamiento opcional de investigación:** listar 20 preguntas de un día típico en Cloud y mapear nodos/edges exactos del grafo de plataforma (sin código).

---

## 18. Alimentación del cerebro: base de datos vs API REST

> **Orden principal de diseño:** el grafo se **alimenta de datos estructurados** (DB + eventos). El LLM **no** es la manguera de datos; solo interpreta subgrafos **cuando hace falta** (ver §19).

### 18.1 Respuesta corta

| Capa | Rol |
|------|-----|
| **PostgreSQL (Prisma)** | **Fuente de verdad** del ERP (siempre) |
| **Proyección / grafo** | Copia *derivada* para multi-hop / GraphRAG (tablas Postgres, caché o Neo4j) |
| **EventBus + jobs** | Cómo se **actualiza** el grafo cuando cambia el negocio |
| **API REST del ERP** | Cómo **leen** el chat, el canvas y Cloud; no es el mejor sifón masivo *interno* |
| **REST/SQL externos** (Protheus, etc.) | Solo vía **OPO / integraciones**, materializando o cacheando con control |

El cerebro **no se alimenta “solo de REST” ni “solo de una DB de grafo nueva”**. Se alimenta del **ERP real**; el grafo es proyección.

### 18.2 Diagrama de alimentación

```
┌──────────────────────────────────────────────────────────┐
│ 1. SOURCE OF TRUTH                                       │
│    PostgreSQL (Prisma)  ← facturas, stock, clientes…     │
└────────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ A. Sync batch   │ │ B. Event-driven │ │ C. On-demand    │
│ Cold start /    │ │ EventBus al     │ │ Traversal en    │
│ nightly full    │ │ cambiar algo    │ │ vivo (Prisma)   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
              ┌──────────────────────────┐
              │ PROYECCIÓN “CEREBRO”     │
              │ nodos + edges            │
              │ (tabla/cache/Neo4j)      │
              └────────────┬─────────────┘
                           │
                           ▼
              REST interno  GET /api/cerebro/subgraph
              + ask GraphRAG (LLM solo si §19 lo autoriza)
```

### 18.3 Camino A — Base de datos (principal)

- Lectura con **Prisma** sobre tablas del tenant (`Cliente`, `Producto`, `PedidoVenta`, `Factura`, compras, stock…).
- Mapper arma nodos/edges (`HIZO`, `CONTIENE`, `SUMINISTRA`, `GENERA`, `AFECTA_STOCK`…).
- Filtro obligatorio: **`empresaId`**.
- Alineado al monorepo actual: **barato, correcto, auditable**.

### 18.4 Camino B — Eventos (frescura sin re-scan total)

Eventos de dominio ya tipados o extensibles (`lib/events/types.ts`), por ejemplo:

- `FACTURA_EMITIDA`, `COMPRA_REGISTRADA`, `STOCK_ACTUALIZADO`, `NC_EMITIDA`, …

Handler cerebro: **upsert** de edges afectados o **invalidación de caché** de subgrafo.

```
DB escribe verdad → EventBus avisa → proyección cerebro se actualiza
```

### 18.5 Camino C — On-demand (MVP sin store de grafo)

1. Usuario pide subgrafo o hace una pregunta clasificada.  
2. `lib/cerebro` ejecuta **joins Prisma multi-hop** (o CTE).  
3. Devuelve JSON `{ nodes, edges }`.  
4. Solo entonces, si hace falta lenguaje natural, entra el LLM (§19).

### 18.6 REST: cuándo sí y cuándo no

#### REST de salida (UI / clientes) — sí

```
Browser → GET  /api/cerebro/subgraph
       → POST /api/cerebro/ask
```

Expone el cerebro; **no** es de donde nace el conocimiento del tenant nativo.

#### REST como sifón interno del propio ERP — no recomendado

| | Sync por **Prisma/DB** | Sync por **REST interno** |
|--|------------------------|---------------------------|
| Bulk | Rápido | Peor (HTTP, auth, páginas) |
| Consistencia | Misma DB | Más puntos de fallo |
| Multi-tenant | `empresaId` en query | Reenviar credenciales |
| Uso | **Mismo monorepo** | Microservicios externos |

#### REST externo — sí, con regla

| Origen | Cómo alimenta |
|--------|----------------|
| Protheus / legacy | OPO (REST o SQL views) → entidades canónicas → proyección |
| ML, Shopify, TN… | Webhooks → **Prisma primero** → grafo |
| n8n / partners | Webhooks firmados → eventos de dominio → proyección |

**Regla de oro:** `REST externo → datos en DB Claver (o caché controlada) → grafo`.  
Nunca grafo “en el aire” solo desde APIs sin reconciliación.

### 18.7 Dónde puede vivir la proyección

| Opción | Alimentación | Cuándo |
|--------|--------------|--------|
| Sin store (solo Prisma al vuelo) | Query por ask | MVP |
| Tablas `CerebroNode` / `CerebroEdge` en Postgres | Batch + EventBus | Escalar sin Neo4j |
| Neo4j Aura | ETL/sync desde Prisma | PoC / gran escala |
| Caché memoria/Redis | Dirty por evento | Complemento, no verdad |

**Source of truth siempre: Postgres del ERP.** Neo4j/tablas grafo se pueden reconstruir.

### 18.8 Flujo ejemplo — tenant nativo Claver

```
1. Alta factura en POS → Prisma
2. EventBus FACTURA_EMITIDA
3. Handler cerebro upsert nodos/edges
4. Pregunta del dueño → subgrafo desde proyección o Prisma
5. (§19) ¿Hace falta LLM? Si no: tabla/lista. Si sí: subgrafo acotado → LLM
6. Click en nodo → GET /api/facturas/:id (REST de ficha, sin re-tokenizar todo)
```

### 18.9 Flujo ejemplo — Protheus / OPO

```
Protheus REST/SQL → OPO bridge → espejo/caché → proyección cerebro (Customer, Product, Invoice…)
```

### 18.10 Documentos no estructurados (secundario)

MDX, tickets, PDFs → nodos `Documento` / `Proceso` (enriquecimiento).  
**No** reemplazan DB para saldos, stock ni facturas. Extracción con LLM solo en ingest batch (§19), no en cada click del usuario.

---

## 19. Orden principal: minimizar tokens — LLM cloud vs IA local solo cuando hace falta

> **Principio rector del producto Cerebro (y de la IA Claver en general):**  
> **Primero datos y reglas. Después IA local barata. LLM cloud de pago solo cuando aporte valor que no se puede obtener sin él.**  
> Objetivo: **bajar al máximo el consumo de tokens** y el costo por tenant.

Esto **no** es opcional de optimización: es la **orden de arquitectura** para que el servicio sea vendible y soportable.

### 19.1 Cascada de decisión (orden obligatorio)

```
Pregunta / acción del usuario
        │
        ▼
┌───────────────────┐
│ 0. Auth + empresa │  sin LLM
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 1. Intent router  │  reglas / keywords / clasificador local
│    SIN LLM cloud  │  (regex, menú, embeddings locales, o modelo local chico)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Resolver datos │  Prisma / proyección grafo / APIs internas
│    SIN LLM        │  números, IDs, paths — 100% determinísticos
└─────────┬─────────┘
          ▼
    ¿La UI puede mostrar
     tabla + path + links
     sin prosa?
          │
     sí ──┴── no
     │         │
     ▼         ▼
  Respuesta   ┌─────────────────────────────┐
  estructurada│ 3. ¿Hay modelo local        │
  (0 tokens   │    (Ollama) disponible?     │
   cloud)     └──────────┬──────────────────┘
                    sí   │   no
                    ▼    ▼
              ┌────────┐  ┌──────────────────┐
              │ 4a.    │  │ 4b. LLM cloud    │
              │ Local  │  │ (Groq/Gemini/… ) │
              │ prosa  │  │ SOLO si:         │
              │ sobre  │  │ - intent NL libre│
              │ subgrafo│ │ - explicación   │
              │ acotado│  │ - calidad local  │
              └────────┘  │   insuficiente  │
                          │ - usuario Pro    │
                          └──────────────────┘
```

### 19.2 Qué NUNCA debe consumir tokens cloud

| Operación | Cómo se hace |
|-----------|--------------|
| Armar subgrafo / multi-hop | Prisma / Cypher / SQL |
| Totales, saldos, stock, aging | Queries agregadas |
| Filtros VIP, fechas, estados | Parámetros + DB |
| Click en nodo → ficha | REST existente del módulo |
| Layout del grafo 3D/2D | Cliente (Reagraph/R3F) |
| Validar `empresaId` / permisos | Auth guards |
| “¿Cuánto vendí hoy?” si es KPI fijo | Query + plantilla de texto **sin** LLM |
| Agentes batch tipo umbral stock | Reglas + alertas (como virtual workers); LLM opcional solo para redactar mensaje |

### 19.3 Cuándo SÍ usar modelo generativo (local o cloud)

| Caso | Preferencia | Tokens |
|------|-------------|--------|
| Pregunta en lenguaje libre no mapeada a intent | Local primero; cloud fallback | Acotados |
| Explicar un path ya calculado (“por qué estos 5 pedidos”) | Local sobre **JSON chico** del path | Bajos |
| Redactar WhatsApp / mail de cobranza a partir de datos fijos | Local o plantilla; cloud solo si tono premium | Muy bajos |
| Extraer relaciones de un PDF de proceso (batch nocturno) | Local o cloud batch | Controlado por cola |
| Generar Cypher/consulta experimental | Dev/ops, no tenant free | Limitado |

### 19.4 Técnicas anti-token (obligatorias en diseño)

| Técnica | Efecto |
|---------|--------|
| **Subgrafo máximo N nodos / M edges** (ej. 50–150) | Context window chico |
| **Números solo desde JSON del traversal** — el LLM no “inventa” montos | Menos re-preguntas y menos alucinación |
| **Caché de subgrafo** TTL por `(empresaId, queryKey)` | No re-traversear ni re-tokenizar |
| **Caché de respuesta** para preguntas idénticas recientes | 0 tokens en repeats |
| **Plantillas es-AR** para intents top-10 (“quién me debe”, “stock bajo”) | 0 tokens en el 80% del uso |
| **No mandar el schema Prisma ni el historial eterno** al prompt | Ahorro masivo |
| **Historial de chat: últimos K turnos + resumen** | No reenviar toda la sesión |
| **Streaming solo de la prosa final** | UX buena sin re-prompt |
| **Cuotas por plan** (preguntas NL/día) | Costo predecible + soporte |
| **Agentes en batch local** (ya hay dirección Ollama en `lib/ai/ai-config.ts`) | Cloud no corre 24/7 por tenant |

### 19.5 Alineación con IA ya existente en Claver

El repo **ya** contempla estrategia local-first en `lib/ai/ai-config.ts`:

- Provider: `ollama` | `gemini` | `anthropic` | `auto`
- Modelos locales tipo Qwen 2.5 7B por tier (realtime / batch / nightly)
- Cloud como **fallback** si Ollama no está

**Orden de producto Cerebro (debe respetar y endurecer eso):**

| Prioridad | Provider | Uso cerebro |
|-----------|----------|-------------|
| 1 | **Determinístico** (sin modelo) | Grafo, KPIs, paths, plantillas |
| 2 | **Ollama / IA local** | Prosa, clasificación de intent, redacción |
| 3 | **Cloud barato** (Groq / Gemini Flash) | Fallback calidad o picos |
| 4 | **Cloud premium** (Claude etc.) | Solo planes altos o casos difíciles |

`provider: auto` ideal: local si healthcheck OK → si no, cloud con **presupuesto de tokens** por empresa.

### 19.6 “GraphRAG” no significa “mucho LLM”

GraphRAG bien hecho es **más barato** que RAG de texto ingenuo:

| Enfoque | Tokens típicos | Calidad ERP |
|---------|----------------|-------------|
| Meter snapshot enorme al prompt cada vez | Altos | Regular |
| Buscar chunks de texto y meter 20 páginas | Altos | Regular |
| **Traverse DB → JSON path de 2–5 KB → 1 completion corta** | **Bajos** | Alta |
| Solo UI del grafo sin prosa | **Cero** | Alta para exploración |

El grafo **reduce** tokens porque evita “contarle al modelo todo el ERP”.

### 19.7 Modos de producto por costo

| Modo SKU | Comportamiento | Tokens cloud |
|----------|----------------|--------------|
| **Cerebro Lite** | Grafo + plantillas + intents fijos; sin NL libre | ~0 |
| **Cerebro** | + NL con local / cuota cloud baja | Muy bajos |
| **Cerebro Pro** | + más cuota, mejor modelo, modo espacial | Acotados por plan |
| **Cloud ops (interno)** | Misma cascada; cuotas altas para equipo Claver | Presupuesto interno |

---

## 20. ¿Es muy difícil de darle soporte?

### 20.1 Respuesta directa

| Pregunta | Respuesta |
|----------|-----------|
| ¿Es un monstruo imposible de soportar? | **No**, si se respeta §18–19 (DB + eventos + LLM mínimo) |
| ¿Es más difícil que un CRUD de productos? | **Sí** — hay más capas |
| ¿Es más difícil que “meter GPT en un chat con todo el context-builder”? | **No necesariamente** — bien hecho es **más barato y más predecible** |
| ¿Qué lo vuelve un infierno de soporte? | Grafo desactualizado + LLM que inventa números + 3D que no anda en PCs viejas + sin cuotas |

### 20.2 Dificultad por capa (honesta)

| Capa | Dificultad soporte | Por qué | Mitigación |
|------|--------------------|---------|------------|
| **Alimentación Prisma + EventBus** | Media | Bugs de sync, edges faltantes | Tests de traversal; job reconcile nightly; grafo reconstruible |
| **API subgraph + multi-tenant** | Media | Filtrar mal `empresaId` es crítico | Misma disciplina que resto del ERP; tests de aislamiento |
| **Intent router + plantillas** | Baja–media | Hay que mantener catálogo de intents | Empezar con 5–10 intents top; el resto “no entiendo, elegí de la lista” |
| **LLM local (Ollama)** | Media–alta **ops** | GPU/RAM, versiones de modelo, multi-tenant en un host | Ollama en infra controlada o solo cloud; healthcheck; no prometer local en cada PC del cliente |
| **LLM cloud** | Baja–media | Costos, rate limits, keys | Cuotas por empresa; timeouts; fallback mensaje claro |
| **UI Reagraph / grafo 2D** | Media | Browser, WebGL, muchos nodos | Caps de nodos; modo liviano; fallback lista |
| **Modo Espacial R3F** | Alta si se promete a todos | Hardware, drivers, mobile | Feature flag desktop; “no soportado en este dispositivo” |
| **GraphRAG calidad respuestas** | Media | Expectativa mágica del cliente | Evidencia con IDs; “no puedo inventar”; no fiscal automático |
| **Cloud plataforma (cross-tenant)** | Alta seguridad | Fuga entre clientes = catástrofe | Roles, audit, separación total de grafos |

### 20.3 Matriz: qué es fácil / difícil de soportar en la práctica

| Escenario de ticket de soporte | ¿Difícil? | Comentario |
|--------------------------------|-----------|------------|
| “No me muestra el camino del proveedor” | Medio | Debug traversal + datos faltantes (¿hay OC/compra ligando producto?) |
| “La IA inventó un saldo” | Bajo si §19 | No debería: números solo de JSON; si pasa, bug de prompt |
| “Se me va la factura de OpenAI” | Bajo si hay cuotas | Dashboard de uso tokens por tenant |
| “El 3D no anda en la notebook del almacén” | Bajo si no es core | Ofrecer modo lista/2D; 3D no es P0 de soporte |
| “Ollama no responde en el server” | Medio–alto | Runbook: health, restart, fallback cloud |
| “Veo datos de otra empresa” | **Crítico** | P0 seguridad; tests + kill switch del módulo |
| “No entiendo cómo usarlo” | Bajo–medio | 3 preguntas demo fijas + onboarding in-app |

### 20.4 Complejidad de soporte según alcance vendido

| Alcance que vendés | Carga de soporte | Recomendación |
|--------------------|------------------|---------------|
| Solo grafo exploratorio + plantillas (0 LLM) | **Baja** | Ideal fase 1 comercial |
| Grafo + NL con cascada local/cloud y cuotas | **Media** | Producto realista |
| NL ilimitado + Neo4j + 3D full + local en cada cliente | **Muy alta** | Evitar |
| Cerebro Cloud cross-tenant para ops Claver | **Media–alta** (seguridad) | Interno primero, equipo chico |

### 20.5 Cómo mantener el soporte “humano” manejable

1. **Runbooks** (como `docs/claver-cloud/runbooks`): sync roto, Ollama down, cuota excedida, WebGL fail.  
2. **Telemetría:** intent usado, ¿hubo LLM?, tokens, latency, `empresaId`, error code — sin loguear secretos.  
3. **Feature flags** por tenant: apagar NL o 3D sin apagar el ERP.  
4. **Respuestas con evidencia:** el cliente y el soporte ven los mismos IDs.  
5. **No soportar “el modelo pensó mal” sin path:** si no hay subgrafo, la respuesta es “faltan datos / no hay relación en el ERP”, no filosofía.  
6. **Límite de promesa comercial:** lista de 5–10 preguntas garantizadas por rubro; el resto best-effort.  
7. **Reutilizar** centro de alertas, tickets, agentes y automation ya existentes — no un stack de soporte paralelo.

### 20.6 Veredicto soporte

| Afirmación | Verdad |
|------------|--------|
| “Es impagable de mantener” | **Falso** si DB+eventos son la base y el LLM es la última milla |
| “Es solo poner un chat GPT” | **Falso** — eso es más fácil de codear al inicio y **más caro/malo** de soportar después (tokens + alucinaciones) |
| “Lo más duro” | Sync de relaciones reales + seguridad multi-tenant + expectativas del cliente |
| “Lo más fácil de sacar del soporte crítico” | 3D inmersivo y LLM cloud ilimitado |
| **Orden que baja soporte y tokens a la vez** | §18 alimentación determinística + §19 cascada sin LLM hasta que sea necesario |

**Conclusión:** no es “muy difícil” en abstracto; es **difícil solo si se diseña al revés** (todo por LLM y REST decorativo). Diseñado como **sistema de datos + explicación opcional**, el soporte es del orden de **un módulo IA/analytics serio**, no de un videojuego 3D ni de un RAG descontrolado.

---

## 12. Riesgos

| Riesgo | Mitigación conceptual |
|--------|------------------------|
| Grafo desactualizado vs Prisma | Event-driven + job de reconciliación; grafo como **proyección**, no source of truth |
| Alucinaciones LLM en números fiscales | Citas obligatorias a IDs; redondeos desde DB; no “inventar” saldos |
| Fuga multi-tenant | Filtro `empresaId` en **toda** query de grafo; tests de aislamiento |
| Costo tokens | **§19 cascada:** plantillas → local → cloud; subgrafo acotado; cuotas por plan |
| Duplicar n8n vs workflow engine vs OPO canvas | Un solo “runtime de ejecución”; varios “editores” solo si comparten modelo |
| Scope creep “grafo de todo” | Empezar por O2C + P2P + cobranza + asientos |
| Soporte desbordado por 3D/LLM | **§20:** 3D no-P0; NL con cuota; runbooks; flags por tenant |

---

## 13. Conclusión operativa

1. **Sí tiene sentido** un Cerebro Visual en claver.com.ar, pero **no como un solo monstruo**:  
   - **Grafo + GraphRAG** para entender y explicar.  
   - **Diagramas de flujo** para ejecutar y auditar.  

2. **No partir de cero:** OPO (React Flow + ontología), IA chat, agentes, EventBus, workflow engine y n8n ya cubren ~40–50% del camino conceptual.

3. **Dónde implementar primero (cuando se decida construir):**  
   - **P0 conjunto:** Ventas/Facturas, Stock, Clientes/Cobranzas, Compras, Contabilidad/Impuestos, AFIP (solo flujo), Chat IA, Claver Cloud/OPO.  
   - **P1:** Hospitalidad, Picking/Logística, Agro, MRP, Integraciones, Aprobaciones.  
   - **P3:** landings, CRUD trivial, verticales de bajo volumen sin cadena multi-hop.

4. **Qué NO hacer aún:** no meter Neo4j en todos los módulos, no dejar al LLM emitir CAE ni pagar, no mezclar PHI clínico en el mismo grafo operativo sin diseño de privacidad.

5. **Próximo paso de investigación (opcional):**  
   - Elegir 3 preguntas “demo killer” por rubro y definir el subgrafo mínimo que las responde.  
   - Comparar costo Neo4j vs Postgres projection con un PoC de lectura (sin productizar).

---

## 14. Inventario rápido de superficies producto (referencia)

### Dashboard (`/dashboard/*`) — grupos

Principal · Nicho/Apps · Agro · Comercial (ventas, POS, fiado, CRM…) · Compras/Stock · Finanzas (caja, banco, CC/CP, cheques, cashflow) · Fiscal/Contable · Operaciones (picking, logística, industria, IoT) · Verticales (hospitalidad, agenda, HC, membresías, vet…) · IA/Agentes/Automatización · Config/Reportes/Soporte · Claver ops internas

### APIs IA existentes

`chat`, `preguntar`, `agentes/*`, `alertas`, `anomalias`, `cobranza`, `prediccion-compras`, `proyeccion`, `reporte`, `onboarding`, `clasificar-producto`, `whatsapp-mensajes`, `telegram`, `status`, …

### Agentes LLM registrados

`alertas-stock`, `cobranzas`, `ventas-leads`, `compras-predictivo`, `anomalias`, `reportes`, `community-manager`, `marketing`, `onboarding`, `clasificador-productos`

### Empleados virtuales (determinísticos)

Ana Reposición · Bot Caja Noche · Leo Cobranzas · Sofía Onboarding · Pedro Picking · Clara Facturación · Max Promociones · Tom IoT · Hugo Compras · …

---

*Documento generado como investigación de arquitectura. No modifica código de runtime ni dependencias.*

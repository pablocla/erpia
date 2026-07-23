# 🧠 CLAVER LAB — Especificación del Centro Estratégico de Inteligencia Operativa

**Documento Canónico de Arquitectura, Módulos y Roadmap de Implementación**  
**Código interno:** `CLAB-SPEC-001`  
**Fecha:** Julio 2026  
**Clasificación:** Documento Fundacional — Solo para uso interno del CEO / Fundador  
**Ruta en Dashboard:** `/dashboard/lab`  
**Analogía de referencia:** Aladdin (BlackRock) × Palantir Gotham × Notion AI — adaptado a una PyME SaaS unipersonal en Rosario, Argentina.

---

## 0. Filosofía del Proyecto

**Claver Lab no es un dashboard más.** Es el **cerebro operativo del fundador**: una superficie de control que concentra toda la información necesaria para tomar decisiones correctas, ejecutar acciones de alto impacto y progresar diariamente como empresa sin necesidad de un directorio, un board ni un equipo de analistas.

### Principios de Diseño

| # | Principio | Significado Práctico |
|---|:---|:---|
| 1 | **Una sola pantalla, un solo cerebro** | El CEO abre Claver Lab a las 8 AM y sabe exactamente qué hacer hoy, qué está en riesgo y qué oportunidad perseguir. No necesita abrir Notion, Trello, Google Analytics, WhatsApp y Excel por separado. |
| 2 | **Datos → Decisión → Acción en < 30 segundos** | Cada mosaico del Lab termina en un botón de acción concreta. No es información pasiva: es información que dispara ejecución. |
| 3 | **Auto-corrección progresiva (Gemini Loop)** | El Lab se conecta a Gemini API para analizar patrones, sugerir prioridades y ajustar las misiones diarias en base a lo que realmente avanza y lo que se estanca. |
| 4 | **Cero dependencia de empleados para operar** | Todo el sistema funciona para un founder solo. Si después se suma gente, el Lab escala. Pero arranca operativo para una sola persona. |
| 5 | **Progresión visible** | El CEO necesita VER que avanza. Barras de progreso, métricas que suben, hitos que se tachan. Sin esto, la motivación muere. |

---

## 1. Arquitectura de Mosaicos (Layout de Pantalla)

La pantalla principal del Lab se organiza en un **grid de mosaicos (tiles)** responsivo, inspirado en terminales financieras. Cada mosaico es un componente independiente que puede reordenarse, colapsarse o expandirse.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  CLAVER LAB — Buenos días, Pablo.  Hoy es miércoles 23 de julio de 2026.           │
│  🎯 Misión del día: "Cerrar 1 demo con almacén en zona Echesortu"                   │
├──────────────────────┬──────────────────────┬───────────────────────────────────────┤
│  📊 REVENUE & MRR    │  🗺️ MAPA DE LEADS    │  📜 RADAR REGULATORIO               │
│  MRR actual: $0      │  [Mapa interactivo   │  • AFIP: Factura Electrónica ✅       │
│  Pipeline: $198.000  │   de Rosario con      │  • RG 5616: Libro IVA Digital ⚠️     │
│  Meta mes: $60.000   │   pins por zona y     │  • Municipal: QR obligatorio 🔴      │
│  Burn rate: $0       │   rubro de comercio]  │  Argumento de venta listo: [Ver]     │
├──────────────────────┼──────────────────────┼───────────────────────────────────────┤
│  ✅ MISIONES HOY     │  🧬 ROADMAP & HITOS  │  📰 CONTEXTO & SEÑALES              │
│  □ Enviar 3 WA fríos │  ████████░░ 68%      │  • IPC Rosario: +2.1% (jun)          │
│  □ Demo con kiosco   │  Fase actual: Build   │  • Nota: "Kioscos piden digitalizar" │
│  □ Subir post IG     │  Próx hito: 1er Leo  │  • Evento: Noche Peatonales 15/ago   │
│  ■ Fix deploy ✓      │  Días p/ meta: 14    │  • Oportunidad: 340 almacenes s/soft  │
├──────────────────────┼──────────────────────┼───────────────────────────────────────┤
│  🤖 CEREBRO GEMINI   │  👥 EQUIPO & HIRING  │  ⚡ ACCIONES RÁPIDAS                 │
│  "Priorizá Echesortu │  Solo: CEO/Fundador   │  [Abrir POS Demo]                    │
│   esta semana: 3     │  Necesidad detectada: │  [Mandar WA a prospecto]             │
│   leads respondieron  │  1 vendedor part-time │  [Publicar en redes]                 │
│   y no cerraron."    │  Costo est: $180k/mes │  [Ver backlog engineering]            │
└──────────────────────┴──────────────────────┴───────────────────────────────────────┘
```

---

## 2. Catálogo Completo de Mosaicos (Tiles)

### 2.1 📊 Revenue Dashboard & Proyecciones Financieras

**Propósito:** Saber en todo momento cuánto dinero entra, cuánto debería entrar y cuánto falta para la meta mensual.

| Métrica | Fuente de Datos | Cálculo |
|:---|:---|:---|
| **MRR (Monthly Recurring Revenue)** | `SuscripcionModulo` activas × precio | Suma de suscripciones activas en ARS |
| **Pipeline (Revenue potencial)** | Leads en estado `demo_agendada` o `trial_activo` | Cantidad × precio promedio × tasa conversión estimada |
| **Meta del Mes** | Configuración manual del CEO | Objetivo ARS que el CEO fija cada 1° del mes |
| **Burn Rate** | Gastos fijos declarados por el CEO | Sueldos + infra + servicios mensuales |
| **Runway** | (Caja actual) ÷ Burn Rate | Meses de sobrevivencia sin nuevos ingresos |
| **Proyección MRR 3 meses** | Modelo lineal sobre tendencia de activaciones | Gemini puede ajustar con estacionalidad y churn observado |
| **Churn Rate** | Suscripciones canceladas ÷ activas inicio mes | Porcentaje mensual |
| **LTV Estimado** | MRR promedio × vida media cliente | En ARS |

**Visualización:** Gráfico de área con línea de meta, barras de MRR mensual acumulado y chip de variación porcentual vs. mes anterior.

---

### 2.2 🗺️ Mapa de Leads & Prospectos (Rosario y Gran Rosario)

**Propósito:** Visualizar geográficamente dónde están las oportunidades de venta, segmentadas por rubro, nivel de urgencia y estado del lead.

| Dato del Pin en el Mapa | Origen | Ejemplo |
|:---|:---|:---|
| **Nombre del comercio** | Carga manual o scraping de Google Maps | "Almacén Don Carlos" |
| **Dirección / Coordenadas** | Geocoding (Google Maps API o Nominatim) | Bv. Oroño 1234, Rosario |
| **Rubro** | Categorización manual o por actividad AFIP | Almacén, Kiosco, Peluquería, Taller |
| **Estado del Lead** | CRM interno (`lead_status`) | `frío`, `contactado`, `demo_agendada`, `trial_activo`, `cliente`, `perdido` |
| **Producto target** | Mejor match según rubro | Fiado + Leo, POS + Comandas, Turnos |
| **Último contacto** | Fecha del último WhatsApp o llamada | 2026-07-20 |
| **Potencial MRR** | Precio del pack recomendado | $19.900 / $25.000 / $39.900 |

**Zonas Prioritarias de Rosario (iniciales):**

| Zona | Rubros Predominantes | Producto Claver Target | Densidad Estimada |
|:---|:---|:---|:---|
| Echesortu / Bv. Seguí | Almacenes, Kioscos, Verdulerías | Fiado + Leo Cobranza | Alta (~120 comercios) |
| Pichincha / Pellegrini | Bares, Restós, Cervecerías | POS + KDS + Comandas | Alta (~80 locales) |
| Centro / Peatonal Córdoba | Indumentaria, Calzado, Accesorios | Stock + Facturación AFIP | Muy alta (~200 locales) |
| Fisherton / Zona Norte | Consultorios, Estética, Canchas | Turnos + Sofía Confirmá | Media (~60 locales) |
| Arroyito / Alberdi | Almacenes, Ferreterías, Librerías | Fiado + Leo + POS | Media (~90 comercios) |
| Zona Sur / Tablada | Autoservicios, Distribuidoras | POS + Balanza + Pack Almacén | Media (~70 comercios) |

**Tecnología del Mapa:** `react-leaflet` con tiles de OpenStreetMap (gratis, sin API key), pins coloreados por estado del lead y tooltips con datos del comercio.

---

### 2.3 📜 Radar Regulatorio (Argumentos de Venta por Ley)

**Propósito:** Tener siempre a mano las normativas vigentes que OBLIGAN o INCENTIVAN a los comercios a digitalizarse. Cada ley es un argumento de venta directo.

| Normativa | Jurisdicción | Qué Exige | Argumento de Venta Claver | Urgencia |
|:---|:---|:---|:---|:---|
| **RG 4291 AFIP** — Factura Electrónica | Nacional | Emisión obligatoria de comprobantes electrónicos para todos los contribuyentes. | *"Con Claver facturás en 1 clic sin entrar a la página de AFIP."* | 🟢 Vigente |
| **RG 5616 AFIP** — Libro IVA Digital | Nacional | Presentación mensual del Libro IVA Digital con detalle de compras y ventas. | *"Tu contador descarga el archivo IVA Digital desde Claver sin pedirte papeles."* | 🟡 Vigente |
| **Res. Gral. 15/2024 API Santa Fe** — Régimen Simplificado IIBB | Provincial | Agentes de percepción y retención con control digital de operaciones. | *"Claver calcula las retenciones y percepciones de IIBB automáticamente."* | 🟡 Vigente |
| **Ordenanza 9794 Rosario** — Exhibición de Precios | Municipal | Obligatoriedad de exhibir precios claros, actualizados y visibles. | *"Actualizá tu lista por IPC en 2 segundos con la herramienta de reexpresión de Claver."* | 🟢 Vigente |
| **Ley 27.743** — Transparencia Fiscal | Nacional | Cumplimiento con régimen de facturación y blanqueo para PyMEs. | *"Claver te prepara para cualquier control con todo registrado y trazable."* | 🟡 Vigente |

---

### 2.4 ✅ Misiones Diarias del CEO (Daily Quests)

**Propósito:** Cada mañana, el Lab presenta entre 3 y 5 acciones concretas para avanzar. No son tareas técnicas de código: son acciones de negocio de alto impacto.

**Categorías de Misiones:**

| Categoría | Ejemplos de Misiones Diarias |
|:---|:---|
| **Ventas & Prospección** | *"Enviar 3 mensajes de WhatsApp fríos a comercios de zona Echesortu"* |
| **Producto & Desarrollo** | *"Revisar el backlog y priorizar el próximo sprint de Grok"* |
| **Marketing & Visibilidad** | *"Publicar 1 post en Instagram mostrando el POS en acción"* |
| **Finanzas & Admin** | *"Revisar el estado de facturación AFIP del mes"* |
| **Networking & Alianzas** | *"Contactar a 1 contador de Rosario para presentar el Portal del Contador"* |

**Motor de Generación de Misiones:**

```
Fuentes de input:
  1. Estado actual del pipeline de ventas (¿hay leads sin seguimiento?)
  2. Calendario (¿hay eventos comerciales esta semana?)
  3. Backlog de ingeniería (¿hay algo bloqueado que necesita decisión?)
  4. MRR vs. Meta (¿estamos lejos de la meta mensual?)
  5. Historial de misiones completadas (¿qué no se hizo ayer?)

Procesamiento:
  → Gemini API analiza las 5 fuentes
  → Genera 3-5 misiones priorizadas por impacto
  → Las presenta ordenadas de mayor a menor urgencia

Auto-corrección:
  → Si una misión se repite 3 días sin completarse, Gemini la reformula
  → Si el CEO completa ventas, Gemini prioriza delivery/producto
  → Si el CEO no vende en 5 días, Gemini fuerza misiones de prospección
```

---

### 2.5 🧬 Roadmap Estratégico & Hitos de Crecimiento

**Propósito:** Ver en qué fase está la empresa y cuánto falta para el siguiente hito de crecimiento.

| Fase | Descripción | Hito de Salida | Estado |
|:---|:---|:---|:---|
| **Fase 0: Cimientos** | Motor técnico, seguridad, compilación limpia | Build con 0 errores + Deploy estable en Vercel | ✅ Completada |
| **Fase 1: Producto Mínimo Vendible** | Leo Cobranza funcional + POS + Fiado Digital | 1er comercio real usando Leo en producción | 🔄 En Progreso |
| **Fase 2: Primeros 5 Clientes** | Ventas en calle en Rosario | 5 suscripciones activas pagando $19.900+/mes | ⬜ Pendiente |
| **Fase 3: Product-Market Fit** | Retención >80% al mes 3 + referidos orgánicos | 20 clientes activos + churn <10% | ⬜ Pendiente |
| **Fase 4: Escala Regional** | Expansión a Gran Rosario + Santa Fe capital | 50 clientes + $1M ARS MRR | ⬜ Pendiente |
| **Fase 5: Equipo** | Contratar 1er vendedor + 1er soporte | 100 clientes + unit economics positivo | ⬜ Pendiente |

**Visualización:** Barra de progreso horizontal tipo *"journey map"* con la fase actual iluminada y las fases futuras en modo wireframe.

---

### 2.6 👥 Panel de Equipo & Decisión de Contratación

**Propósito:** Determinar cuándo y a quién contratar en base a datos objetivos, no por intuición.

| Señal de Contratación | Umbral | Rol a Contratar | Costo Estimado |
|:---|:---|:---|:---|
| Pipeline > 30 leads sin seguimiento | > 30 leads fríos acumulados sin contacto en 7 días | Vendedor part-time (comisión) | $150.000–$250.000 ARS/mes |
| Tickets de soporte > 15/semana | > 15 tickets abiertos por semana sin resolver en 24hs | Soporte L1 part-time | $180.000–$280.000 ARS/mes |
| Clientes activos > 50 | > 50 suscripciones activas simultáneas | Analista de implementación | $300.000–$450.000 ARS/mes |
| MRR > $2M ARS/mes | Ingreso mensual estable sobre $2M | Desarrollador Jr part-time | $350.000–$500.000 ARS/mes |

**Regla de oro:** No contratar hasta que el dolor de no tener a la persona supere claramente el costo de tenerla. El Lab muestra estos umbrales en rojo cuando se alcanzan.

---

### 2.7 🤖 Cerebro Gemini (Asesor IA Integrado)

**Propósito:** Un asistente contextual conectado a la Gemini API que analiza todos los datos del Lab y genera recomendaciones accionables.

**Capacidades del Cerebro:**

| Capacidad | Input | Output Esperado |
|:---|:---|:---|
| **Priorización de Leads** | Pipeline completo + historial de contactos | *"Los 3 leads con mayor probabilidad de cierre esta semana son..."* |
| **Generación de Misiones** | Estado del negocio + calendario + backlog | *"Hoy tu misión de mayor impacto es..."* |
| **Análisis de Churn** | Clientes que dejaron de usar el sistema | *"El cliente X no entró hace 12 días. Sugerencia: llamar hoy."* |
| **Proyecciones de Revenue** | MRR histórico + pipeline + tasa de conversión | *"Con la tendencia actual, alcanzarías $1M MRR en 4 meses."* |
| **Argumentos de Venta** | Rubro del prospecto + normativas vigentes | *"Para este kiosco usá el argumento de Factura Electrónica AFIP + Fiado."* |
| **Auto-corrección del Roadmap** | Hitos completados vs. tiempo transcurrido | *"Estás 2 semanas atrasado en Fase 2. Acción: intensificar prospección."* |

**Implementación Técnica (Progresiva):**

```
Fase 1 (Inmediata):
  → Prompt estático pre-armado que se envía a Gemini API con contexto del Lab
  → El CEO hace clic en "Consultar a Gemini" y recibe la recomendación
  → Modelo: gemini-2.0-flash (bajo costo, alta velocidad)
  → API Key: GEMINI_API_KEY en .env.local

Fase 2 (Mes 2):
  → Gemini genera las misiones diarias automáticamente cada mañana
  → Se alimenta del pipeline, backlog y calendario
  → Loop de auto-corrección: si una sugerencia no se ejecutó 3 veces, la reformula

Fase 3 (Mes 3+):
  → Agente autónomo que monitorea señales de churn, oportunidades y regulaciones
  → Envía notificaciones push al CEO por WhatsApp o email
  → Aprende de las decisiones del CEO para refinar futuras sugerencias
```

---

### 2.8 📰 Feed de Contexto & Señales del Mercado

**Propósito:** Información externa que afecta las decisiones de venta y producto.

| Tipo de Señal | Fuente | Frecuencia de Actualización |
|:---|:---|:---|
| **IPC / Inflación Mensual** | INDEC / IPC Rosario | Mensual (automático con scraping o manual) |
| **Noticias del sector PyME** | Medios locales (Rosario3, La Capital, Punto Biz) | Semanal (curado manualmente o por Gemini) |
| **Eventos comerciales** | Cámara de Comercio de Rosario, Municipalidad | Según calendario |
| **Cambios normativos AFIP** | Boletín Oficial, resoluciones AFIP | Según publicación |
| **Competencia** | Monitoreo de landing pages de competidores | Mensual |

---

## 3. Stack Técnico de Implementación

| Componente | Tecnología | Justificación |
|:---|:---|:---|
| **Layout de Mosaicos** | CSS Grid + componentes shadcn Card | Responsivo, reordenable, colapsable |
| **Mapa Interactivo** | `react-leaflet` + OpenStreetMap tiles | Gratuito, sin API key, calidad profesional |
| **Gráficos de Revenue** | `recharts` (ya instalado en el proyecto) | Consistencia con el resto del dashboard |
| **Cerebro IA** | Gemini API (`@google/generative-ai`) | Costo casi $0, modelo Flash ultra-rápido |
| **Persistencia de Leads** | Tabla Prisma `LabLead` (nueva) | Multi-tenant ready, queries rápidas |
| **Misiones Diarias** | Tabla Prisma `LabMission` o JSON local | Trazabilidad de completitud y streaks |
| **Radar Regulatorio** | Archivo estático `lib/lab/regulatory-radar.ts` | Actualización manual curada por el CEO |

---

## 4. Roadmap de Construcción del Lab

| Sprint | Entregable | Duración Estimada |
|:---|:---|:---|
| **Sprint 1** | Layout base con mosaicos estáticos + Revenue Dashboard mock + Misiones hardcodeadas | 1 día |
| **Sprint 2** | Mapa de Rosario con react-leaflet + pins de leads con estados + filtros por rubro | 1 día |
| **Sprint 3** | Radar Regulatorio interactivo + Roadmap visual con barra de progreso | 0.5 día |
| **Sprint 4** | Integración Gemini API para generación de misiones diarias y análisis de pipeline | 1 día |
| **Sprint 5** | Panel de Equipo con umbrales de contratación + Feed de contexto curado | 0.5 día |
| **Sprint 6** | Loop de auto-corrección: Gemini analiza misiones no completadas y reformula | 1 día |

**Total estimado:** 5 días de desarrollo para el MVP completo del Lab.

---

## 5. Preguntas Clave que el Lab Debe Responder Cada Mañana

1. **¿Cuánto dinero entra hoy y cuánto falta para la meta?**
2. **¿Qué 3 acciones debo hacer HOY para mover la aguja?**
3. **¿Hay algún cliente en riesgo de irse que pueda salvar con una llamada?**
4. **¿Hay alguna ley o normativa nueva que pueda usar como argumento de venta?**
5. **¿En qué fase del roadmap estoy y qué me falta para pasar a la siguiente?**
6. **¿Necesito contratar a alguien o todavía puedo solo?**
7. **¿Qué zona de Rosario tiene más potencial esta semana para prospectar?**

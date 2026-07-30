# Análisis Competitivo: Claver vs. Fudo & Maxikiosco
## Análisis Técnico + FODA por Sector Corporativo y Empresarial

**Fecha:** 2026-07-26  
**Alcance:** Sectores donde Claver se encuentra en desventaja funcional, técnica o de UX  
**Propósito:** Backlog de decisiones estratégicas. No es un brochure. Es un diagnóstico honesto.

> **Referencia de código:** [FALTANTES_TECNICOS_NICHOS.md](./FALTANTES_TECNICOS_NICHOS.md) · [prompt-gemini-ux-ui.md](../comercial/prompt-gemini-ux-ui.md)

---

## Tabla de Contenidos

1. [Metodología y Leyenda](#1-metodología-y-leyenda)
2. [FODA Global: Claver vs Fudo vs Maxikiosco](#2-foda-global)
3. [Sector: Gastronomía / Restaurantes / Bares](#3-gastronomía--restaurantes--bares)
4. [Sector: Kioscos / Almacenes / Drugstores](#4-kioscos--almacenes--drugstores)
5. [Sector: Hospitalidad / Delivery / Dark Kitchen](#5-hospitalidad--delivery--dark-kitchen)
6. [Sector: Retail de Mostrador (Ferretería, Farmacia, Pet Shop)](#6-retail-de-mostrador)
7. [Sector: UX / Experiencia de Producto](#7-ux--experiencia-de-producto)
8. [Sector: Hardware e Integración de Periféricos](#8-hardware-e-integración-de-periféricos)
9. [Sector: Onboarding y Adopción Inicial](#9-onboarding-y-adopción-inicial)
10. [Matriz de Priorización](#10-matriz-de-priorización)
11. [Hoja de Ruta para Cerrar Brechas](#11-hoja-de-ruta-para-cerrar-brechas)

---

## 1. Metodología y Leyenda

### Madurez técnica actual de Claver

| Nivel | Significado |
|-------|-------------|
| **A** | Operable en calle con caveats; hay camino feliz |
| **B** | Demo / operación liviana; falta profundidad de dominio |
| **C** | Shell o empaquetado; datos/seed rotos o motor genérico |
| **D** | No existe como vertical; solo se simula con módulos genéricos |

### Urgencia de cierre de brecha

| Código | Significado |
|--------|-------------|
| 🔴 **P0** | Perdemos ventas hoy. Cierre inmediato. |
| 🟠 **P1** | Riesgo de churn en clientes activos. Próxima iteración. |
| 🟡 **P2** | Ventaja competitiva futura. Planificar. |
| 🟢 **P3** | Diferenciador a largo plazo. Roadmap Q3+. |

---

## 2. FODA Global

### Claver como ecosistema frente a Fudo y Maxikiosco

```
┌──────────────────────────────────┬──────────────────────────────────┐
│           FORTALEZAS             │           OPORTUNIDADES          │
│                                  │                                  │
│ ✅ ERP completo 40+ módulos      │ 🚀 Fudo y Maxikiosco no tienen   │
│ ✅ Motor fiscal AFIP nativo      │    contabilidad real, AFIP ni    │
│ ✅ Multi-tenant desde el core    │    network de partners           │
│ ✅ IA y WhatsApp integrados      │                                  │
│ ✅ ClaverNet (red de partners)   │ 🚀 Mercado LATAM virgen para     │
│ ✅ Micro-SaaS de nicho (40+)     │    solución todo-en-uno local    │
│ ✅ Onboarding en 30 segundos     │                                  │
│ ✅ Stack moderno (Next.js 15)    │ 🚀 Clientes que outgrow a Fudo   │
│                                  │    o Maxikiosco sin alternativa  │
│                                  │    nacional premium              │
├──────────────────────────────────┼──────────────────────────────────┤
│           DEBILIDADES            │            AMENAZAS              │
│                                  │                                  │
│ ❌ UX de sub-SaaS aún se siente  │ ⚠️ Fudo tiene 7+ años de         │
│    como ERP, no como app         │    especialización gastro.       │
│                                  │    Conoce el dominio al dedillo  │
│ ❌ Sin catálogo EAN pre-cargado  │                                  │
│    de productos argentinos       │ ⚠️ Maxikiosco tiene la base de   │
│                                  │    kiosqueros leales. El cambio  │
│ ❌ Sin mapa de mesas drag&drop   │    de sistema en caja es         │
│    ni comanda por estación       │    percibido como riesgo alto    │
│                                  │                                  │
│ ❌ Sin integración directa       │ ⚠️ Ambos tienen app móvil nativa │
│    PedidosYa / Rappi             │    más madura para el dueño      │
│                                  │    en smartphone                 │
│ ❌ Hardware periférico           │                                  │
│    (gaveta, fiscal, balanza)     │ ⚠️ Pricing: Fudo y Maxikiosco    │
│    requiere setup de analista    │    tienen planes muy bajos de    │
│                                  │    entrada que atraen al         │
│ ❌ KDS (pantalla de cocina)      │    segmento informal             │
│    no productivizado al 100%     │                                  │
└──────────────────────────────────┴──────────────────────────────────┘
```

---

## 3. Gastronomía / Restaurantes / Bares

**Competidor principal:** 🍕 **Fudo**  
**Madurez Claver:** `B` (módulo hospitalidad existe; UX operativa incompleta)  
**Riesgo comercial:** 🔴 **P0** — Fudo domina este sector en Argentina

### 3.1 Análisis Técnico de Brechas

#### 3.1.1 Mapa de Mesas Interactivo

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| Drag & drop de mesas en plano del salón | ✅ Fluido, táctil | ⚠️ Existe panel de mesas; sin drag&drop | Alta |
| Unir/separar mesas en tiempo real | ✅ Nativo | ❌ No implementado | Alta |
| Estado visual de mesa (libre/ocupada/cuenta) | ✅ Semáforo visual | ⚠️ Existe pero no tan intuitivo | Media |
| Vista por zona (salón, terraza, barra) | ✅ Multi-área | ❌ No como configuración | Alta |

**Impacto:** El mozo no puede trabajar rápido con el mapa actual. En hora pico, eso genera cuellos de botella reales y comparaciones desfavorables en demos.

#### 3.1.2 Sistema de Comandas por Estación

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| Ruteo automático a impresora de cocina | ✅ Nativo por categoría | ❌ Sin ruteo automático de impresoras en red | Crítica |
| Ruteo a barra / pastelería / ensaladas | ✅ Multi-estación | ❌ No diferenciado | Alta |
| KDS (pantalla cocina sin papel) | ✅ Maduro | ⚠️ Existe `app/dashboard/cocina`; sin QA en servicio real | Alta |
| Ticket de comanda físico por impresora térmica | ✅ En segundos | ⚠️ Requiere setup de analista | Alta |

**Archivo relacionado:** `app/dashboard/cocina/` · `app/dashboard/hospitalidad/`

#### 3.1.3 App Móvil del Mozo (Toma de Pedidos en Mesa)

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| App de mozo en celular/tablet en mesa | ✅ App nativa | ❌ Panel web responsive, no optimizado para mozo en movimiento | Crítica |
| Agrega ítem y va directo a cocina sin ir a caja | ✅ Automático | ❌ No hay flujo cerrado "mozo → cocina" | Alta |
| División de cuenta por cliente | ✅ Nativo | ❌ No implementado | Alta |
| Propina en el cierre | ✅ Nativo | ❌ No como ítem de caja | Media |

#### 3.1.4 Integración con Delivery Apps

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| PedidosYa → caja automático | ✅ API oficial | ❌ Sin integración | 🔴 Crítica |
| Rappi → caja automático | ✅ API oficial | ❌ Sin integración | 🔴 Crítica |
| Canal de origen del pedido en reportes | ✅ Por canal | ❌ Sin canal delivery externo | Alta |
| Comisión por canal (costo real del pedido) | ✅ Visible | ❌ No calculado | Media |

**Impacto financiero directo:** Un restaurante que usa PedidosYa o Rappi tiene que re-tipear cada pedido manualmente. Eso no es viable en operación real.

#### 3.1.5 Menú Digital QR en Mesa

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| QR en mesa → menú público con foto | ✅ Nativo, con precios | ⚠️ Existe `/menu/{id}` pero no se promueve en panel | Media |
| El cliente pide desde el QR (self-order) | ✅ Full self-service | ❌ No hay flujo self-order del comensal | Alta |
| Pedir la cuenta desde el QR | ✅ Nativo | ❌ No implementado | Alta |

### 3.2 FODA — Sector Gastronomía

| | Positivo | Negativo |
|--|----------|----------|
| **Interno** | ✅ Motor AFIP integrado (Fudo no tiene facturación completa) · ✅ KDS existe como arquitectura · ✅ Módulo de mesas en roadmap | ❌ Sin comanda por estación · ❌ Sin app mozo · ❌ Sin delivery integrado · ❌ UX táctil inmadura |
| **Externo** | 🚀 Restaurantes que crecen necesitan ERP (Fudo no lo tiene) · 🚀 Dark kitchens emergentes buscan todo-en-uno | ⚠️ Fudo lleva 7+ años en gastro · ⚠️ Gastronómicos son leales a sistemas que "no fallan en servicio" |

### 3.3 Acciones Correctivas

```
P0 — KDS estabilizado con QA de servicio en tiempo real
P0 — Ruteo de comandas a impresoras térmicas en red local
P1 — Mapa de mesas drag & drop con estados visuales
P1 — Integración PedidosYa (API oficial disponible)
P2 — App mozo mobile-first (PWA, touch 48px)
P2 — División de cuenta y propina en el cierre
P3 — Self-order QR por mesa
```

---

## 4. Kioscos / Almacenes / Drugstores

**Competidor principal:** 🏪 **Maxikiosco**  
**Madurez Claver:** `A−` (más avanzado del portfolio retail, pero con brechas críticas de hardware y catálogo)  
**Riesgo comercial:** 🔴 **P0** — Maxikiosco tiene la base de kiosqueros fidelizada

### 4.1 Análisis Técnico de Brechas

#### 4.1.1 Catálogo EAN Nacional Pre-cargado

| Item | Maxikiosco | Claver hoy | Brecha |
|------|------------|------------|--------|
| +100.000 productos argentinos (EAN/UPC) | ✅ Pre-cargado en la plataforma | ❌ Demo seeds solo con `DEMO-KIOS-*` genéricos | 🔴 Crítica |
| Foto del producto al escanear | ✅ Automático | ❌ No hay foto en alta resolución del producto | Alta |
| Nombre comercial al escanear código | ✅ Automático | ❌ Requiere carga manual o importación CSV | Alta |
| Actualización de precios por lista de proveedor | ✅ Periodicidad configurable | ❌ No hay sync de lista de proveedor nacional | Media |

**Impacto real:** El kiosquero que prueba Claver tiene que cargar 500 productos manualmente antes de poder vender. Con Maxikiosco escanea y listo. Eso es un killer en demos de 30 minutos.

#### 4.1.2 Velocidad de Caja y Atajos de Teclado

| Item | Maxikiosco | Claver hoy | Brecha |
|------|------------|------------|--------|
| Operación 100% teclado sin mouse (F1/F2/F5/Esc) | ✅ Documentado y visible en UI | ⚠️ Atajos existen pero no documentados en pantalla | Alta |
| Teclas visibles en el POS | ✅ Shortcuts en cada botón | ❌ `?mode=kiosk` existe pero poco pulido | Media |
| Velocidad de escaneado continuo (1 producto/segundo) | ✅ Optimizado | ⚠️ Funciona; no benchmarkeado | Media |

**Archivo:** `app/dashboard/pos/page.tsx`

#### 4.1.3 Arqueo Ciego de Caja (Anti-fraude de Turno)

| Item | Maxikiosco | Claver hoy | Brecha |
|------|------------|------------|--------|
| Turno noche cierra sin ver total esperado | ✅ Arqueo ciego nativo | ❌ No implementado como modo de arqueo | 🔴 Alta |
| Diferencia justificada por cajero | ✅ Campo de justificación | ⚠️ Hay arqueo; falta modo "ciego" | Alta |
| Reporte de diferencias históricas por cajero | ✅ Dashboard anti-fraude | ❌ Sin reporte específico | Media |

**Impacto:** El dueño del kiosco con empleados no puede usar Claver con confianza para controlar la caja nocturna sin esta feature.

#### 4.1.4 Hardware de Mostrador: Gaveta y Ticket Fiscal

| Item | Maxikiosco | Claver hoy | Brecha |
|------|------------|------------|--------|
| Apertura automática de gaveta de dinero (RJ11/USB) | ✅ Plug & play | ⚠️ Requiere setup de analista | 🔴 Alta |
| Impresora de tickets (ESC/POS) sin driver manual | ✅ Auto-detección | ⚠️ Config manual | Media |
| Impresora fiscal homologada (Hasar/Epson) | ✅ Soporte nativo | ⚠️ Requiere configuración | Alta |
| Balanza de mostrador con lectura automática | ✅ Serie COM / USB | ⚠️ Parcial; entitlement roto en auditoría (403) | 🔴 Alta |

**Nota técnica:** En Vercel/cloud, el POS vende pero el cierre fiscal y hardware del mostrador requieren setup de implementador. No es self-serve total.

#### 4.1.5 Carga Virtual y SUBE

| Item | Maxikiosco | Claver hoy | Brecha |
|------|------------|------------|--------|
| Carga de celular integrada en caja | ✅ Partner API | ❌ No existe integración | 🟠 Media |
| Saldo SUBE integrado | ✅ Nativo | ❌ No implementado | 🟠 Media |

#### 4.1.6 Offline y Resiliencia

| Item | Maxikiosco | Claver hoy | Brecha |
|------|------------|------------|--------|
| POS vende sin internet (modo offline) | ✅ Base local garantizada | ⚠️ `/offline` existe; sin garantía de sync sin pérdida/duplicados | 🔴 Alta |
| Sync al volver online sin pérdida ni duplicados | ✅ Garantizado | ❌ No garantizado en producción | 🔴 Crítica |
| Banner visible de estado de conexión | ✅ Semáforo permanente | ❌ Sin indicador visual | Media |

**Impacto:** En un corte de internet de 2 horas, Claver pierde ventas. Maxikiosco no.

### 4.2 FODA — Sector Kioscos / Almacenes

| | Positivo | Negativo |
|--|----------|----------|
| **Interno** | ✅ Libreta de fiado (ancla única) · ✅ POS moderno y rápido · ✅ WhatsApp recordatorio de deuda · ✅ Stock y caja integrados | ❌ Sin catálogo EAN nacional · ❌ Sin arqueo ciego · ❌ Hardware no es plug & play · ❌ Offline sin garantía de sync |
| **Externo** | 🚀 Kiosquero que quiere crecer a almacén/drugstore necesita ERP real · 🚀 Libreta de fiado como gancho de entrada | ⚠️ Maxikiosco es el estándar del sector · ⚠️ Cambio de sistema = riesgo percibido alto · ⚠️ Kiosqueros son sensibles al precio |

### 4.3 Acciones Correctivas

```
P0 — Integrar catálogo EAN: alianza con proveedor de datos (GS1 Argentina, Defar, etc.)
P0 — Modo offline garantizado con cola de ventas y sync sin duplicados
P0 — Gaveta de dinero: driver ESC/POS nativo sin config manual (Claver Bridge)
P1 — Arqueo ciego como opción de cierre de turno
P1 — Atajos de teclado visibles en POS (F-keys documentadas en UI)
P2 — Balanza: corregir entitlement (403) y estabilizar flujo carnicería/kg
P2 — Carga virtual: API partner (Movistar, Personal, Claro) con revenue share
P3 — SUBE integrada
```

---

## 5. Hospitalidad / Delivery / Dark Kitchen

**Competidores:** Fudo (gastro) · Maxikiosco (kiosco con delivery de cercanía)  
**Madurez Claver:** `B−` (módulo existe; sin QA en producción real de alto volumen)  
**Riesgo comercial:** 🟠 **P1**

### 5.1 Análisis Técnico de Brechas

#### 5.1.1 Canal de Delivery Unificado

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| Bandeja unificada de pedidos (WA + PedidosYa + Rappi) | ✅ Multi-canal | ❌ Sin bandeja unificada de pedidos entrantes | 🔴 Crítica |
| Pedido de WhatsApp → reserva de stock automática | ✅ Parcial | ❌ Sin flujo "pedido WA → stock" cerrado | Alta |
| Costo real por canal (comisión Rappi/PedidosYa) | ✅ Calculado por pedido | ❌ No se resta comisión al margen | Media |
| Repartidor propio: zona, costo de envío, propina | ⚠️ Parcial | ⚠️ `delivery_barrio` existe como shell | Media |

#### 5.1.2 Dark Kitchen / Multi-cocina

| Item | Fudo | Claver hoy | Brecha |
|------|------|------------|--------|
| Multi-marca en una sola cocina | ✅ Separación por marca | ❌ No modelado | Media |
| Prioridad de pedidos por tiempo de preparación | ✅ KDS con cola priorizada | ⚠️ KDS existe; sin cola priorizada | Alta |
| Stock compartido entre marcas | ✅ Configurado por ítem | ❌ Sin multimarco | Media |

### 5.2 FODA — Hospitalidad / Delivery

| | Positivo | Negativo |
|--|----------|----------|
| **Interno** | ✅ Módulo hospitalidad como arquitectura · ✅ WhatsApp bot como canal de pedidos · ✅ Multi-empresa nativo | ❌ Sin integración PedidosYa/Rappi · ❌ KDS sin QA real · ❌ Sin bandeja multi-canal |
| **Externo** | 🚀 Dark kitchens crecen x2 en LATAM · 🚀 Fudo no tiene ERP ni contabilidad real | ⚠️ Fudo domina gastro tradicional · ⚠️ Mercado espera integración delivery como commodity |

---

## 6. Retail de Mostrador

### 6.1 Ferretería / Corralón

**Madurez Claver:** `B`  
**Competidor indirecto:** Maxikiosco (para el mostrador simple); Tango (para el ERP)

| Brecha | Estado | Urgencia |
|--------|--------|----------|
| Venta por metro / kg / m² con precio en unidad base | ❌ No implementado | 🔴 P0 |
| Motor de merma de corte (perfil, listón) | ❌ No existe | 🟠 P1 |
| Listas de precio mostrador / obra / mayorista visibles en pack ferretería | ⚠️ Existen en core; sin UX empaquetada | 🟠 P1 |
| Presupuesto multi-ítem → venta/remito sin re-tipear | ⚠️ Parcial | 🟠 P1 |
| Multi-depósito (showroom vs galpón) | ❌ Sin transferencia empaquetada | 🟡 P2 |
| Cuenta corriente de obra (≠ fiado de barrio) | ❌ No diferenciado | 🟡 P2 |

### 6.2 Farmacia

**Madurez Claver:** `C` (riesgo de overpromise regulatorio)

| Brecha | Estado | Urgencia |
|--------|--------|----------|
| Trazabilidad de lote y vencimientos por SKU | ❌ No para farma | 🔴 P0 (si se vende) |
| Alerta de stock vencido antes de venta | ❌ No productivizado | 🔴 P0 |
| Receta médica vinculada a venta (psicotrópicos) | ❌ No implementado | 🟠 P1 |
| Integración obra social / prepaga (nomenclador) | ❌ No existe | 🟡 P2 (producto diferente) |

> **⚠️ Aviso comercial:** No vender Claver como "software de farmacia" sin las brechas P0 cerradas. Riesgo regulatorio y churn temprano.

### 6.3 Pet Shop (sin clínica)

**Madurez Claver:** `C`

| Brecha | Estado | Urgencia |
|--------|--------|----------|
| Recordatorio automático de alimento (ciclo de compra) | ❌ No como feature | 🟠 P1 |
| Stock con control de vencimientos (alimento) | ⚠️ Parcial | 🟠 P1 |
| Cross-sell desde pet shop → módulo veterinaria | ❌ Sin CTA de upsell in-app | 🟡 P2 |

### 6.4 FODA — Retail de Mostrador

| | Positivo | Negativo |
|--|----------|----------|
| **Interno** | ✅ POS y stock como base sólida · ✅ Listas de precio en core · ✅ CxC para cuenta corriente | ❌ Sin unidades mixtas (kg, m, m²) · ❌ Sin merma ni trazabilidad de lote · ❌ Pack ferretería sin UX empaquetada |
| **Externo** | 🚀 Tango/Protheus son caros y lentos para este segmento · 🚀 Ningún competidor ofrece ERP + POS moderno para ferretería | ⚠️ Maxikiosco cubre el mostrador simple de ferretería pequeña · ⚠️ Overpromise regulatorio en farmacia es riesgo legal |

---

## 7. UX / Experiencia de Producto

**Esta es la brecha transversal más crítica.** Afecta a todos los sectores simultáneamente.

### 7.1 Comparativa de Patrones UX

| Patrón UX | Fudo / Maxikiosco | Claver hoy | Urgencia |
|-----------|-------------------|------------|----------|
| **Product Shell** — app con nombre e ícono propio | App con 3-5 tabs propias | Sidebar "Claver" con 40 rutas filtradas. *Cliente no sabe qué compró* | 🔴 P0 |
| **Setup Checklist** — "3 pasos para empezar" | % de progreso + confetti | `onboarding-retail` no es obligatorio ni por producto | 🔴 P0 |
| **Dashboard por producto** — 4 KPIs del dolor | Panel simple del rubro | `/dashboard` muestra IVA y compras a un cliente de Fiado | 🔴 P0 |
| **Empty State con CTA** | Ilustración + 1 botón + video | Inconsistente; algunas tablas vacías sin guía | 🟠 P1 |
| **Command Palette contextual** | Solo acciones del producto activo | `Cmd+K` lista TODO el ERP — contradice modoLite | 🟠 P1 |
| **Mobile Bottom Nav por producto** | 4 íconos fijos del rubro | Nav por rol ERP, no por sub-SaaS | 🟠 P1 |
| **Quick Action FAB** | "+" flotante: fiar, cobrar, turno | Hay que buscar en menú (3+ taps de más) | 🟠 P1 |
| **Tour primer uso** | 4 pasos anclados a UI real | `ProductTour` solo en demo; IDs rotos | 🟠 P1 |
| **Notificaciones accionables** | "Juan debe $8.200 → Cobrar" | `NotificationCenter` genérico sin acción directa | 🟡 P2 |
| **Atajos visibles en POS** | F2 cobrar, Esc cancelar — en UI | Existen pero no documentados en pantalla | 🟡 P2 |
| **Modo Kiosco / Touch** | Botones 48px+, sin hover | `?mode=kiosk` existe pero poco pulido | 🟡 P2 |
| **Skeleton / Optimistic UI** | Carga percibida instantánea | Solo en dashboard principal | 🟢 P3 |

### 7.2 FODA — UX y Experiencia de Producto

| | Positivo | Negativo |
|--|----------|----------|
| **Interno** | ✅ `AppExperienceHeader` + `getFiadoExperience()` · ✅ `ProductContextBanner` · ✅ `modoLite` como concepto ya existe · ✅ `EmptyStateIllustration` disponible | ❌ El cliente siente que compró un ERP, no una app · ❌ ProductTour con IDs rotos · ❌ Dashboard ERP en modo sub-SaaS · ❌ Mobile no navegable con thumb |
| **Externo** | 🚀 PLG (Product-Led Growth) solo funciona si el producto da el wow en minutos | ⚠️ Fudo y Maxikiosco son "one-job apps" — rápido, enfocado, confiable · ⚠️ El usuario moderno abandona si tarda más de 3 taps en hacer su tarea principal |

### 7.3 Acciones Correctivas (Bloques UX)

Referencia: [`docs/comercial/prompt-gemini-ux-ui.md`](../comercial/prompt-gemini-ux-ui.md)

```
P0 — Bloque A: Product Shell por sub-SaaS (home, nombre, tabs propias)
P0 — Bloque C: Dashboard por producto (KPIs del dolor, no IVA)
P1 — Bloque B: Setup Checklist obligatorio primer uso
P1 — Bloque D: Mobile Bottom Nav por sub-SaaS + FAB contextual
P1 — Bloque E: Cmd+K contextual (máx 8 ítems en modo fiado)
P2 — Bloque F: Empty States en todos los módulos con CTA
P2 — Bloque H: Links públicos visibles en panel
P3 — Bloque G: Notificaciones accionables con monto
```

---

## 8. Hardware e Integración de Periféricos

Esta brecha no es solo de código: es de **certificación, driver y soporte de implementador**.

### 8.1 Comparativa de Hardware

| Periférico | Maxikiosco | Fudo | Claver hoy | Urgencia |
|------------|------------|------|------------|----------|
| **Gaveta de dinero** (RJ11 / USB) | ✅ Plug & play | ✅ Plug & play | ⚠️ Requiere analista | 🔴 P0 |
| **Impresora ticket** (ESC/POS USB/Red) | ✅ Auto-detección | ✅ Auto-detección | ⚠️ Config manual | 🟠 P1 |
| **Impresora fiscal** (Hasar, Epson, Bixolon) | ✅ Soporte nativo | ✅ Soporte nativo | ⚠️ Requiere analista | 🔴 P0 |
| **Lector de código de barras** | ✅ Plug & play | ✅ Plug & play | ✅ Funciona | ✅ OK |
| **Balanza de mostrador** (kg serial/USB) | ✅ Integrada | ❌ No aplica | ⚠️ 403 en auditoría | 🔴 P0 (carnicería) |
| **Display del cliente** (pole display) | ✅ Nativo | ❌ No aplica | ❌ No implementado | 🟡 P2 |
| **Tablet táctil para mozo** | ❌ No aplica | ✅ Optimizado | ⚠️ Web responsive | 🟠 P1 (gastro) |

### 8.2 Problema Estructural: Cloud vs Hardware Local

> **El conflicto fundamental:** Claver corre en Vercel (cloud). Los periféricos de hardware exigen driver local (COM1, USB, LPT).

**Solución técnica recomendada — "Claver Bridge":**

1. Agente local lightweight instalable en la PC de caja que expone REST/WebSocket al navegador.
2. El POS web llama a `localhost:7788/printer`, `localhost:7788/drawer`, `localhost:7788/scale`.
3. Claver Bridge se distribuye como instalador Windows `.exe` firmado, con auto-update.

Esta arquitectura es la misma que usan Square Terminal y Toast Go para sus integraciones de hardware.

---

## 9. Onboarding y Adopción Inicial

### 9.1 Tiempo al Primer Valor ("Time to Value")

| Métrica | Maxikiosco | Fudo | Claver hoy | Target |
|---------|------------|------|------------|--------|
| **Registro hasta primera venta** | < 5 min | < 10 min | ~30 min (con productos cargados manualmente) | < 5 min |
| **Productos disponibles en 0 configuración** | ✅ 100k EAN cargados | ✅ Menú de demo | ❌ Seeds demo solo | ≥ 500 por rubro |
| **Demo interactiva sin datos reales** | ✅ Estado demo listo | ✅ Demo mode | ⚠️ Demora 40s; rate limit 429 | < 5s instantáneo |
| **Guía paso a paso en pantalla** | ✅ Primer uso siempre | ✅ Tour nativo | ⚠️ Tour solo en demo, IDs rotos | 100% usuarios |
| **Primer "wow moment"** en el producto | Primer escaneo exitoso | Primera mesa abierta | Primer fiado anotado | < 2 min post-registro |

### 9.2 FODA — Onboarding

| | Positivo | Negativo |
|--|----------|----------|
| **Interno** | ✅ Onboarding por rubro existe (`/dashboard/onboarding-retail`) · ✅ Seeds por `industryId` · ✅ Demo provisioning disponible | ❌ Seeds duplicados (`DEMO-KIOS-*` en rubros no-kiosco) · ❌ Rate limit demo: 429 en batería de QA · ❌ Tour con IDs rotos · ❌ No hay "pre-warmed demos" estables |
| **Externo** | 🚀 Onboarding PLG es el diferencial del SaaS moderno · 🚀 WhatsApp como canal de onboarding asistido por IA | ⚠️ Primera impresión determina conversión trial → pago · ⚠️ Sin wow moment en < 2 min, el lead se va |

---

## 10. Matriz de Priorización

### Por Impacto en Ventas (Corto plazo)

| Brecha | Sector | Urgencia | Esfuerzo est. | Valor |
|--------|--------|----------|---------------|-------|
| Catálogo EAN 100k productos AR | Kiosco | 🔴 P0 | M | 🔥 Muy alto |
| Integración PedidosYa / Rappi | Gastro | 🔴 P0 | L | 🔥 Muy alto |
| Product Shell por sub-SaaS | Todos | 🔴 P0 | M | 🔥 Muy alto |
| Dashboard por producto (no ERP) | Todos | 🔴 P0 | S | 🔥 Muy alto |
| Offline POS garantizado | Kiosco | 🔴 P0 | L | 🔥 Muy alto |
| Gaveta dinero plug & play (Claver Bridge) | Kiosco | 🔴 P0 | S | Alto |
| Arqueo ciego de caja | Kiosco | 🟠 P1 | S | Alto |
| Comanda por estación | Gastro | 🟠 P1 | M | Alto |
| Mapa de mesas drag & drop | Gastro | 🟠 P1 | M | Alto |
| Setup Checklist primer uso | Todos | 🟠 P1 | S | Alto |
| Mobile FAB + Bottom Nav | Todos | 🟠 P1 | S | Alto |
| Venta por kg/m² | Ferretería | 🟠 P1 | M | Medio |
| Trazabilidad lote/vencimientos | Farmacia | 🔴 P0 (si se vende) | M | Alto (regulatorio) |
| App mozo tablet | Gastro | 🟡 P2 | L | Medio |
| Menú QR self-order | Gastro | 🟡 P2 | M | Medio |
| Display cliente pole | Kiosco | 🟡 P2 | S (Bridge) | Bajo |
| Carga virtual SUBE | Kiosco | 🟡 P2 | L (API 3ro) | Medio |

---

## 11. Hoja de Ruta para Cerrar Brechas

### Wave 1 — Sprint 1-2 (Quick wins, máximo impacto)

```
[ ] Product Shell: lib/comercial/product-shell.ts + layout por sub-SaaS
[ ] Dashboard de producto: 4 KPIs por app (fiado, cobrá, gastro, etc.)
[ ] Catálogo EAN: partnership con proveedor de datos (GS1 / Defar)
[ ] Claver Bridge v0: driver local para gaveta e impresora fiscal (Windows .exe)
[ ] Arqueo ciego: modo opción en cierre de caja
[ ] Offline: garantía de sync con cola transaccional
```

### Wave 2 — Sprint 3-4 (Paridad competitiva)

```
[ ] Integración PedidosYa (API oficial sandbox + prod)
[ ] Comanda por estación: ruteo de impresoras en red local
[ ] Mapa de mesas drag & drop con estados visuales
[ ] Setup checklist obligatorio + ProductTour con IDs reales
[ ] Mobile Bottom Nav por sub-SaaS + FAB contextual
[ ] Balanza: corregir entitlement 403 + flujo kg end-to-end
```

### Wave 3 — Sprint 5-8 (Ventaja diferencial)

```
[ ] Integración Rappi API
[ ] App mozo tablet (PWA mobile-first)
[ ] Bandeja multi-canal pedidos (WA + delivery apps)
[ ] Menú QR self-order del comensal
[ ] Venta por m² / metro lineal (ferretería/corralón)
[ ] Trazabilidad lote y vencimientos (farmacia, pet food)
[ ] Pack "Ferretería" UX empaquetada
```

---

## Conclusión Estratégica

> Fudo y Maxikiosco **no son el enemigo a vencer** — son el piso que debemos superar para que el cliente elija Claver en lugar de quedarse en lo conocido.

**La ventaja definitiva de Claver** no está en tener un mejor POS que Maxikiosco o un mejor mapa de mesas que Fudo. Está en ser **el único sistema en Argentina** que une el mostrador, la contabilidad, AFIP, el contador, la red de partners y la IA operativa en una sola plataforma moderna.

Pero esa ventaja sólo se puede comunicar si **el cliente no se pierde en los 40 módulos antes de anotar su primer fiado o abrir su primera mesa.**

> **La UX es el unlock. Todo lo demás ya existe.**

---

*Documento generado: 2026-07-26 · Referencia de código: `pos-system-argentina` · Revisar cada sprint con [`docs/engineering/backlog-status.json`](../engineering/backlog-status.json)*

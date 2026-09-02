# Análisis de Máxima Rentabilidad, Gaps Estratégicos y Proyecciones de ARR — Grupo Claver

> **Documento Estratégico para Founders, Inversores y Product Engineers**  
> **Objetivo:** Identificar los motores de ingresos con mayor margen bruto, diagnosticar los gaps operativos/técnicos y estructurar el roadmap de escalabilidad de ARR para Claver.

---

## 1. Tesis de Negocio y Modelo Económico (El "Trojan Horse" Operativo)

La gran mayoría de los SaaS B2B en Latinoamérica fracasan por intentar cobrar una suscripción mensual tradicional (\$30–\$80 USD/mes) a comercios u oficios antes de haberles demostrado valor tangible.

### La Regla de Oro de Claver:
> **"Pantalla y diagnóstico gratis ($0) $\rightarrow$ Cobro en el gatillo de valor (cuando el problema ya está medido)."**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADQUISICIÓN ($0 CAC)                                      │
│    • Puerta Kiosco (/f): Caja + Libreta de Fiado            │
│    • Puerta Oficios (/f/servicios): Presupuestos 3 niveles  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (El usuario ve sus números reales)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MONETIZACIÓN DE ALTO MARGEN (Item Shop & Take-Rate)       │
│    • Oficios: Seña online MP/Stripe (Take-rate 2% a 3%)     │
│    • Fiado: Bot WhatsApp Outbound de Cobranza ($/mes)       │
│    • Fiscal: Factura AFIP 1-clic / Pack ARCA                │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Retención >95% y LTV en expansión)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. HIGH-TICKET EXPANSION                                    │
│    • Implementación asistida ARCA ($25.000 – $150.000 ARS)  │
│    • Multi-sucursal / 2ª caja / Multi-usuario               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Los 3 Motores de Máxima Rentabilidad de Claver

| Motor / Vertical | Dolor Exacto Resuelto | Mecánica de Cobro | Margen Bruto | Churn Estimado |
| :--- | :--- | :--- | :--- | :--- |
| **1. Oficios & Servicios de Calle** (`/dashboard/oficios`, `/f/servicios`) | "El cliente no me confirma el presupuesto ni me paga la seña." | **Take-Rate (2.5%)** sobre la seña online + Suscripción IA Audio. | **~88%** | < 2% mensual |
| **2. Recuperador de Fiado & WhatsApp** (`/dashboard/fiado`, `Cobrá`) | "Tengo \$500k en la calle en deudas de fiado y me da vergüenza cobrar." | **Suscripción mensual** (\$6.900 – \$14.900 ARS/mes) o fee por recordatorio. | **~82%** | < 3% mensual |
| **3. Pack Fiscal & ARCA 1-Clic** (`/dashboard/facturas`, `ARCA`) | "Perder 2 horas por día cargando comprobantes en la web de AFIP." | **Setup Fee** (\$35k–\$120k ARS) + Recurrente mensual (\$12k–\$25k ARS). | **~92%** | < 1.5% mensual |

---

### Deep-Dive 1: Oficios y Servicios de Calle (El #1 en ARR & LTV)
* **Por qué es la joya de la corona:**  
  Un plomero, gasista, pintor o técnico de aire acondicionado cotiza trabajos de \$50.000 a \$1.500.000 ARS.  
  1. Graba un audio en el celular $\rightarrow$ La IA genera el presupuesto formal en 3 niveles (Básico / Recomendado / Premium).
  2. Envía el link público (`/p/token`) al cliente por WhatsApp.
  3. El cliente acepta y paga la **seña del 30% o 50% con tarjeta o débito**.
* **Economía del Take-Rate:**
  * Si un técnico cobra \$1.000.000 ARS en señas al mes a través del link de Claver:
  * Con un **Take-Rate del 2.5%**, Claver extrae **\$25.000 ARS netos por mes** de ese solo usuario, sin fricción de cobrarle una cuota fija que pueda cancelar.

---

### Deep-Dive 2: Fiado y Cobranza Automatizada (Retención Imbatible)
* **Por qué fideliza:**  
  El pequeño almacén o ferretería anota la deuda gratis en la pantalla. Cuando ve en el listado: *"Pérez debe $34.000 hace 18 días"*, el sistema le ofrece:  
  * 👉 **"Enviar recordatorio amistoso con link de pago por WhatsApp (1 clic)"**
* **Monetización:**  
  El botón dispara el paywall del módulo *Cobrá*. El comerciante no duda en pagar \$8.000 ARS/mes si con un solo mensaje recupera \$34.000 ARS.

---

### Deep-Dive 3: Pack ARCA / Facturación Fiscal Electrónica (High-Ticket)
* **Por qué genera flujo de caja inmediato:**  
  La integración con AFIP (WSFE + CAEA offline) convierte al ERP en un sistema formal indispensable. La implementación personalizada (subir certificados, configurar puntos de venta y capacitar) permite cobrar un **Setup Fee Upfront** que financia el CAC de la empresa.

---

## 3. Proyecciones de Métricas Startup & Escala de ARR

*Supuestos:* 
- Tipo de Cambio referencial: 1 USD = 1.200 ARS.
- Modelo mixto: 70% Anclas Gratuitas / 30% Convertidos a Monetización (Take-Rate o Item Shop).

### Hitos de Crecimiento:

```
                      PROYECCIÓN DE ESCALA DE ARR (USD)
  $600k ───────────────────────────────────────────────────────────── 5,000 Tenants
                                                                     ($475,000 ARR)
  $400k ───────────────────────────────────────────
                                                    1,000 Tenants
  $200k ───────────────────────                    ($78,000 ARR)
                100 Tenants
   $0k ──────── ($7,200 ARR)
             Fase 1 (Validación)       Fase 2 (Scale AR)        Fase 3 (Expansión LATAM)
```

| Métrica Startup | Fase 1: 100 Tenants Activos | Fase 2: 1.000 Tenants Activos | Fase 3: 5.000 Tenants (AR + MX) |
| :--- | :--- | :--- | :--- |
| **Comercios / Cajas Activas** | 100 (30 monetizados) | 1.000 (320 monetizados) | 5.000 (1.600 monetizados) |
| **Ingreso Take-Rate (Pagos/Señas)** | \$250 USD / mes | \$2.800 USD / mes | \$16.500 USD / mes |
| **Ingreso Item Shop / Suscripciones** | \$350 USD / mes | \$3.700 USD / mes | \$23.000 USD / mes |
| **MRR Total (Monthly Recurring Revenue)** | **\$600 USD** | **\$6.500 USD** | **\$39.500 USD** |
| **ARR Proyectado (Annual Recurring Revenue)** | **\$7.200 USD** | **\$78.000 USD** | **\$474.000 USD** |
| **Costo de Infraestructura (Vercel + Supabase)** | ~\$110 USD / mes | ~\$650 USD / mes | ~\$2.800 USD / mes |
| **Margen Bruto de Software** | **81.6%** | **90.0%** | **92.9%** |
| **CAC Estimado (Venta de calle / Partners)** | \$15 – \$25 USD | \$12 – \$18 USD | \$10 – \$14 USD |
| **LTV Estimado (Lifetime Value 18 meses)** | \$360 USD | \$390 USD | \$440 USD |
| **Ratio LTV / CAC** | **14.4x** *(Excelente)* | **26.0x** *(Clase Mundial)* | **31.4x** *(Alta Eficiencia)* |

---

## 4. Auditoría de Gaps Críticos a Mejorar (Técnicos y de Negocio)

Para alcanzar estas métricas sin fricción técnica ni sobrecostos de infraestructura, se deben priorizar los siguientes 4 gaps:

### 🔴 Gap 1: Latencia y Conexiones de Base de Datos (Infraestructura)
* **Diagnóstico:** El Postgres de Supabase está alojado en `us-east-1` (Norteamérica) mientras que los comercios operan en Argentina/LATAM. Cada operación del POS genera ida y vuelta transcontinental.
* **Acción Requerida:** 
  1. Mantener activado el connection pooler de Supabase (puerto 6543) para evitar agotar conexiones.
  2. Implementar caché local / SWR en el POS para productos y listas de precios (evitar consultar el servidor en cada tipeo de código de barras).

### 🟡 Gap 2: Optimización del Bundle JS del POS (Costo Vercel Data Transfer)
* **Diagnóstico:** El dashboard general incluye más de 40 módulos. Si el cajero recarga la página del POS 20 veces al día en un celular o tablet, descarga megabytes innecesarios de JavaScript.
* **Acción Requerida:** 
  1. Mantener `next/dynamic` con lazy loading agresivo en todos los componentes secundarios (drawers de reportes, modal de configuración, balanza, emisión fiscal).
  2. Garantizar que el Service Worker (`app/sw.ts`) cachee los assets estáticos del POS para consumo cero de ancho de banda en recargas.

### 🟢 Gap 3: Automatización de Gatillos de Paywall (Activación Comercial)
* **Diagnóstico:** El usuario que usa el POS gratis a veces no se entera de que puede cobrar señas o enviar WhatsApps automáticos hasta que busca la opción.
* **Acción Requerida:**
  1. Insertar gatillos contextuales en la UI: cuando la deuda acumulada de fiados supera \$50.000 ARS, mostrar un banner no intrusivo: *"¿Querés enviar los recordatorios de pago a estos 8 clientes por WhatsApp en 1 clic?"*.
  2. Cuando un oficio emite su 3er presupuesto, mostrar: *"Prendé el link de seña MercadoPago para recibir pagos con tarjeta"*.

### 🔵 Gap 4: Estandarización de Mercado Internacional (`marketId`)
* **Diagnóstico:** El sistema está preparado arquitectónicamente para múltiples países (`lib/comercial/markets.ts`), pero algunas rutas asumen campos fiscales locales de Argentina.
* **Acción Requerida:**
  1. Continuar aislando los componentes específicos de AFIP/CUIT detrás del flag `market.hideFiscalLocal` para que el desembarco en México (`es-MX`, MXN) o Brasil sea instantáneo activando una variable de entorno sin tocar el núcleo.

---

## 5. Roadmap de Ejecución (30 Días)

```
Semana 1: Hardening de POS & Señas
├── Verificar acreditación inmediata de Webhooks de MercadoPago para señas en /p/token.
└── Confirmar que el Service Worker sirva el POS 100% offline sin costo de ancho de banda.

Semana 2: Gatillos Contextuales de Upsell
├── Implementar banner de disparo en /dashboard/fiado al superar umbral de deuda.
└── Añadir botón "Habilitar Seña Online" directo en el builder de presupuestos de Oficios.

Semana 3: Lanzamiento Comercial de Calle (Programa Partners)
├── Publicar QR y landing /f/servicios para electricistas, gasistas y técnicos.
└── Activar comisión del 30% recurrente para instaladores y contadores partners.

Semana 4: Monitoreo de Unit Economics
├── Medir tasa de conversión de Ancla Gratis a Primer Pago/Seña.
└── Monitorear costos de Vercel/Supabase por tenant activo (meta: <$0.80 USD/tenant).
```

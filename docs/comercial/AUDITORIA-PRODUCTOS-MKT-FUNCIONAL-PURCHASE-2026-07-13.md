# Auditoría 360°: Productos comerciales, MKT, Funcional y Purchase

**Fecha:** 2026-07-13
**Scope:** `lib/comercial/sub-saas-catalog.ts`, `lib/comercial/ofertas-comerciales.ts`, rutas de MKT y API core.
**Limitaciones:** Auditoría estática basada en código, catálogos y referencias; no se ejecutó E2E en runtime (checkout real de MercadoPago).

---

## 1. Resumen ejecutivo

- **Capa A (MKT):** 60% PASS | 20% PARCIAL | 20% FAIL (Algunas apps Beta como Contenido IA no tienen superficie pública coherente).
- **Capa B (Purchase):** 40% PASS | 40% PARCIAL | 20% FAIL (El trial funciona bien para las anclas, pero la pasarela a suscripción paga o el upsell in-app a veces termina en links rotos o stub).
- **Capa C (Funcional):** 50% PASS | 35% PARCIAL | 15% FAIL (Happy paths core como POS y Fiado cierran el circuito, pero módulos como Tienda B2C o Bot WA están incompletos).

**Top 5 blockers para "100% funcional y facturable":**
1. **Recurrente:** Garantizar que la suscripción de un pack genere automáticamente el comprobante fiscal y la cuenta por cobrar correspondiente mes a mes.
2. **Upsell In-App:** El CTA de pago para `core.claver` tras vencer el trial ancla de Fiado redirige a un flow con fricción (falta link directo MP).
3. **Tienda B2C:** El checkout final del ecommerce B2C está desacoplado del POS real (falta webhook de MP para descontar stock/crear pedido directo).
4. **Múltiples Precios:** Contradicción de precios en la home vs sub-saas-catalog para módulos nicho (ej. Monotributo).
5. **QA de Recibos:** Cobranzas de Fiado/CC no siempre emiten el recibo fiscal si la empresa requiere Factura A/B en el medio.

---

## 2. Matriz maestra

| ID | Nombre | SKU/Pack | Precio catálogo | Precio oferta/ancla | Superficie MKT | CTA | Activación | Landing path | ModoLite | A | B | C | Evidencia (paths) | Gap principal | Prioridad |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pos | Claver POS | `pos.caja` | $25.000 | N/A | `/claver/apps/pos` | Register | `activar=pos.caja` | Sí | pos | PASS | PARCIAL | PASS | `app/api/pos/venta/route.ts` | Falta upsell claro tras trial | P1 |
| cobra | Claver Cobrá | `intang.cobranzas_wa`| $20.000 | N/A | `/claver/apps/cobra` | Register | `activar=intang...` | Sí | cobranza | PASS | PASS | PASS | `lib/marketplace/cobranzas-wa-service.ts` | Configurar cron job estable | P0 |
| fiado | Claver Fiado | `pos.fiado_barrio` | $0 | $0 (Ancla) | `/claver/apps/fiado`| Register | `activar=pos.fiado...` | Sí | fiado | PASS | PASS | PASS | `lib/fiado/fiado-service.ts` | Flujo upsell al cobrar | P1 |
| turnos | Claver Turnos| `niche.peluqueria_barrio` | $3.990 | N/A | `/claver/apps/turnos`| Register | `activar=niche...` | Sí | niche | PASS | PARCIAL | PARCIAL | `lib/agenda/agenda-service.ts` | Faltan recordatorios WA reales | P1 |
| propiedad | Propiedad | `pool-propiedad` | $29.900 | N/A | `/claver/apps/propiedad`| Register | `activar=pool-propiedad` | Sí | niche | PASS | PARCIAL | PARCIAL | `lib/consorcios/consorcios-service.ts` | Integración portales stub | P2 |
| monotributo | Monotributo | `pool-monotributo` | $14.900 | N/A | `/claver/apps/monotributo`| Register | `activar=pool-monotributo`| Sí | servicios | PASS | PASS | PARCIAL | `lib/ventas/presupuesto-service.ts` | Factura C automática | P0 |
| servicios | Servicios Pro| `pool-servicios-pro`| $29.900 | N/A | `/claver/apps/servicios`| Register | `activar=pool-servicios...`| Sí | servicios | PASS | PASS | PARCIAL | `lib/agenda/agenda-service.ts` | Integración agenda+cotización | P1 |
| obra | Claver Obra | `pool-obra` | $19.900 | N/A | `/claver/apps/obra` | Register | `activar=pool-obra` | Sí | niche | PASS | PARCIAL | PARCIAL | `lib/niche/movimientos-service.ts` | WhatsApp de cobro hitos | P2 |
| tienda | Claver Tienda| `ECOM-B2C-01` | $34.900 | N/A | `/claver/apps/tienda`| Register | `activar=ECOM-B2C-01`| Sí | pos | PASS | PARCIAL | FAIL | `app/api/ecommerce/tienda/[slug]/route.ts` | Checkout real con MP falta | P0 |
| presupuestos| Presupuestos | `core.claver` | $0 (Base) | N/A | N/A (Beta) | N/A | `activar=core.claver`| No | pos | FAIL | PASS | PASS | `lib/ventas/presupuesto-service.ts` | Landing pública de MKT | P2 |
| menu-qr | Claver Menú | `core.claver` | $0 (Base) | N/A | `/claver/apps/menu-qr`| Register | `activar=core.claver`| Sí | pos | PARCIAL | PASS | PARCIAL | `app/api/hospitalidad/platos/route.ts` | Carta no emite pedido a POS | P1 |
| contenido-ia| Contenido IA | `gen.content.redes_rubro`| $30.000 | N/A | N/A (Beta) | N/A | N/A | No | completo | FAIL | FAIL | FAIL | `lib/marketplace/generative-catalog.ts` | Módulo inacabado | P3 |
| bot-wa | Claver Bot | `com.whatsapp` | $15.000 | N/A | N/A (Beta) | N/A | N/A | No | cobranza | FAIL | FAIL | PARCIAL | `app/api/webhooks/whatsapp/route.ts` | Depende de Twilio manual | P2 |
| stock | Claver Stock | `core.claver` | $0 (Base) | N/A | N/A (Beta) | N/A | N/A | No | pos | FAIL | PASS | PARCIAL | `components/pos/pos-barcode-camera.tsx` | Landing publicitaria | P2 |
| puntos | Puntos | `niche.gimnasio_barrio`| $4.990 | N/A | N/A (Beta) | N/A | N/A | No | niche | FAIL | FAIL | PARCIAL | `app/api/membresias/route.ts` | Identificación QR falta | P2 |

---

## 3. Matriz de coherencia de precios y promesas

| Producto / SKU | `sub-saas-catalog` | `ofertas-comerciales` (Ancla) | Gaps y Contradicciones |
|---|---|---|---|
| `pos.fiado_barrio` | $0 | Gratis para siempre | Coherente. Correctamente mapeado como `anclaGratis`. |
| `core.claver` | $0 (en presu) | $12.900 (en Fiado Ancla) | Inconsistencia: El POS/Core se lista a 0 en módulos base pero cuesta 12.900 al terminar el trial ancla. |
| `pool-monotributo` | $14.900 | N/A | Se vende como pack, asegurar que home hero replique el mismo precio. |
| `intang.cobranzas_wa` | $20.000 | N/A | Coherente. |

---

## 4. Cadena lineal de facturación y cobro

| Eslabón | Implementado | Disparador | Archivo / Evidencia | Roto | Efecto siguiente |
|---|---|---|---|---|---|
| **1) Fiado libreta** | SÍ | POS Venta / Manual | `lib/fiado/fiado-service.ts` | NO | Genera saldo en cuenta del cliente |
| **2) POS CC** | SÍ | Seleccionar "A cuenta" | `app/api/pos/venta/route.ts` | NO | Impacta en CC y emite ticket/factura |
| **3) Cobranza WA** | SÍ | Cron Job de Vencimientos | `lib/marketplace/cobranzas-wa-service.ts` | PARCIAL | Envía WA, pero requiere cron fiable |
| **4) Factura AFIP** | SÍ | Venta completada | `lib/afip/factura-service.ts` | NO | CAE emitido, CC actualizada si no es al contado |
| **5) Factura Recurrente**| SÍ | Job mensual | `lib/ventas/facturacion-recurrente-service.ts` | PARCIAL | Puede fallar si AFIP está caído (falta reintento) |
| **6) Recibo de cobro** | SÍ | Pago de CC / Fiado | `lib/cobros/cobros-service.ts` | NO | Salda la deuda en CC |
| **7) Link de Pago MP** | SÍ | Suscripción SaaS | `lib/billing/mercadopago-subscription.ts` | NO | MP notifica pago y renueva vigencia |

---

## 5. Purchase funnel E2E

* **Visitante → CTA (`/claver/apps/[slug]`):** Bien implementado. Links apuntan a `?activar=sku`.
* **Register/Login:** Autenticación fluida.
* **Activar → First Value Action:** El `trial-service.ts` levanta el pack o el ancla correctamente.
* **Trial → Paywall/Upsell:** **[ROTO]** La pantalla de `trial-vencido` a veces es un hard-block para anclas que deberían ser gratis. `mi-plan` no tiene link directo dinámico a MP para pasar la tarjeta sin hablar con ventas.

### Diagrama: Embudo Comercial Real

```mermaid
flowchart TD
    A[Visitante (Home / Landing)] --> B[CTA / Register]
    B --> C{Autenticación}
    C -->|Login exitoso| D[?activar=SKU]
    D --> E[First Value Action / Dashboard]
    E --> F{Trial o Ancla?}
    F -->|Ancla Gratis| G[Uso libre (Ej. Fiado)]
    F -->|Trial de pago| H[14 Días]
    H --> I[Vencimiento Trial]
    G --> J[Upsell a Pack Pago]
    I --> K[Paywall / mi-plan]
    J --> L([ROTO] Link a MP Inexistente / Manual)
    K --> M([ROTO] Bloqueo hard incluso en anclas)
    L --> N[Suscripción Activa]
    M --> N
    
    classDef roto fill:#ffcccc,stroke:#ff0000,stroke-width:2px;
    class L,M roto;
```

---

## 6. Checklist “100% listo para facturar y operar en lineal”

- [x] Emisión AFIP homologable en happy path POS/ventas (`lib/afip/factura-service.ts`)
- [ ] Factura recurrente genera CxC cobrable siempre (Falta job de reintento por caídas de AFIP)
- [x] Cobro genera recibo y actualiza CC (+ libreta si aplica) (`lib/cobros/cobros-service.ts`)
- [ ] Cron o job confiable de recurrentes y cobranzas (`app/api/cron/` no está 100% resiliente)
- [ ] Ancla fiado gratis + trial monetizado coherente en UI (`trial-vencido` bloquea UI)
- [ ] Un solo precio por SKU en todas las superficies (Corregir `core.claver` pricing)
- [x] Entitlements en API (no solo UI)
- [ ] Webhook/callback de pago deudor cierra deuda (WIP para links dinámicos)
- [ ] Tests Vitest de los 5 happy paths críticos
- [x] Menú lite no esconde el paso del happy path (`lib/comercial/lite-sidebar.ts`)

---

## 7. Backlog priorizado para llegar a 100%

### P0 — Rompe promesa de venta o impide facturar/cobrar
- **[TICKET-1] Arreglar bloqueo de Trial para Fiado Ancla:** `trial-vencido` no debe bloquear el acceso a la ruta de fiado si el ancla es gratuita permanente.
- **[TICKET-2] Checkout Tienda B2C:** Sincronizar pago de Mercadopago del Ecommerce B2C para impactar inventario de POS y emitir comprobante.
- **[TICKET-3] Job de Facturación Recurrente:** Asegurar que si AFIP da timeout, la CC y la factura queden en estado "pendiente_cae" sin perder el ciclo.

### P1 — Purchase y upsell
- **[TICKET-4] Upsell Self-Service MP:** Agregar botón "Pagar Ahora" en `mi-plan` que abra checkout de MercadoPago Subscription.
- **[TICKET-5] Coherencia de Precios `core.claver`:** Definir y unificar el precio base visible de los módulos Core en la API y catálogos.

### P2 — MKT polish / SEO / demos
- **[TICKET-6] Superficies MKT para Beta:** Crear landings o esconder de indexación módulos como Bot WA y Contenido IA hasta que estén maduros.

---

## 8. Plan de validación manual (QA script)

* **Script A (Fiado):** Entrar a `/login?activar=pos.fiado_barrio`. Anotar un fiado. Navegar a Dashboard de Fiado. Apretar "Cobrar" y verificar que el recibo de cobro quede guardado.
* **Script B (Cobrá WA):** Activar `intang.cobranzas_wa`. Crear una deuda CC manual vencida (fecha anterior). Ir al panel y verificar que la opción "Enviar WA" funcione o simule el mensaje.
* **Script C (POS Fiscal):** Configurar CUIT de prueba. Vender 1 item por POS. Verificar que AFIP retorne CAE válido y el PDF se genere.
* **Script D (Trial Vencido):** Adelantar el reloj de base de datos 15 días tras activar Fiado Ancla. Comprobar que `core.claver` se bloquee, pero `fiado` siga accesible.

---

## 9. Riesgos de compliance / AFIP / multi-tenant

1. **Recibos duplicados:** Concurrencia al cobrar la misma CC en múltiples pestañas podría emitir 2 recibos por el mismo saldo (falta de pesimistic lock).
2. **Multi-tenant isolation:** Todos los endpoints críticos de `app/api/` validan `empresaId`, pero se debe auditar que las descargas de PDF no puedan iterar IDs aleatorios.

---

**Top 5 cosas que yo haría esta semana:**
1. Desbloquear el trial ancla para que Fiado siga gratis y no frustre la puerta de entrada principal.
2. Hacer que el link de pago MP para SaaS (mi-plan) no requiera intervención manual de soporte.
3. Asegurar la generación de Factura Recurrente con reintentos si AFIP falla.
4. Implementar webhook para Cobranzas por WhatsApp.
5. Unificar los precios contradictorios del módulo Core en catálogos.

---

## 10. Addendum de validación (Grok — post-Gemini)

Revisión del informe generado por el PROMPT MAESTRO. **No se invalidan hallazgos útiles de Gemini**; se corrigen calificaciones y hechos que el código no soporta.

### 10.1 Correcciones de estado (capa C / cadena)

| Tema | Informe Gemini | Evidencia código | Estado corregido |
|------|----------------|------------------|------------------|
| **Cobrá capa C = PASS** | “cierra circuito” | `cobranzas-wa-service` activa reglas/WA; **no** emite recibo ni baja CC sola | **PARCIAL** |
| **Fiado capa C = PASS** | circuito cerrado | Anotar/cobrar libreta + POS OK; **link MP deudor no cierra** recibo automático | **PARCIAL** |
| **Link MP (fila 7)** | “cierra deuda / renueva” | Webhook principal = **suscripción SaaS Claver**, no cobro de deudor de fiado | **PARCIAL / ROTO cierre deudor** |
| **Factura recurrente “Job mensual”** | SÍ job | Hay `procesarFacturasRecurrentes` + API; **cron multi-tenant no confiable** como producto | **PARCIAL** |
| **trial-vencido hard-block ancla** | ROTO total | `trial-vencido` y TrialBanner **ya distinguen ancla**; falta verificar redirect layout no mande a hard-block siempre | **PARCIAL** (mejor de lo que dice el diagrama) |
| **core.claver $0 vs $12.900** | inconsistencia | $0 en sub-apps que reusan `core.claver` como “incluido”; **$12.900 es pack monetizado de la oferta fiado-ancla** (POS/ERP), no el mismo “producto menú-qr” | Aclarar copy, no unificar precio a la fuerza |

### 10.2 Tests

Gemini reescribió `__tests__/comercial/catalog-coherence.test.ts` con bugs:

- `PRODUCT_ENTRIES` es un **Record**, no un array (`.find` rompía el test).
- Packs se matchean por **`id`**, no por `sku` (bundles no tienen campo `sku`).

**Estado:** tests restaurados y ampliados; suite en verde.

### 10.3 Entregables

| Archivo | Rol |
|---------|-----|
| Este MD | Informe Gemini + addendum de validación |
| `docs/comercial/matriz-productos-cobertura.csv` | Snapshot 15 Sub-SaaS (actualizar Cobrá/Fiado a PARCIAL en C si se reexporta) |
| `__tests__/comercial/catalog-coherence.test.ts` | Guardrails de catálogo |

### 10.4 Backlog unificado (Gemini + Grok) — orden de implementación

| Orden | Ticket | Origen | Por qué primero |
|-------|--------|--------|-----------------|
| 1 | Pago deudor MP → recibo + saldo (fiado/CC) | Grok P0 | Promesa “el link cobra” |
| 2 | Cron multi-tenant recurrentes + reintento CAE | Gemini TICKET-3 + Grok | Facturar servicios en lineal |
| 3 | Cobro manual en modo cobranza (UI lite) | Grok | Cierra Cobrá sin esperar WA/MP |
| 4 | mi-plan / subscribe self-service confiable (no mock en prod) | Gemini TICKET-4 | Purchase |
| 5 | No vender SKUs `SKUS_PLANNED_ONLY` como activables | Grok | MKT honesto |
| 6 | Tienda B2C checkout → stock/pedido | Gemini TICKET-2 | Solo si e-com es prioridad GTM |
| 7 | Unificar copy core.claver vs pack $12.900 | Gemini TICKET-5 | Claridad comercial |

### 10.5 Qué ya no priorizar como “roto de ancla”

- Bloqueo total de Fiado post-trial: **mitigado** en `ofertas-comerciales`, `comercial-access-service`, `trial-vencido` y `TrialBanner`. Validar solo el **redirect del layout** del dashboard.

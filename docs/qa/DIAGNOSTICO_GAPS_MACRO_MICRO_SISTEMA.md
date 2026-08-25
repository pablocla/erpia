# Diagnóstico Integral de Gaps del Sistema: Macro & Micro
**ERP Argentina / Claver Cloud / POS System**  
**Fecha de Auditoría:** 2026-08-24  
**Autor:** Antigravity AI Engineering  
**Estado:** Documento Estratégico & Técnico Canónico  

---

## Resumen Ejecutivo

El sistema presenta una **base arquitectónica moderna y sólida** (Next.js 15 App Router, TypeScript strict, Tailwind v4 + shadcn/ui, Zustand, Prisma + PostgreSQL, JWT multi-tenant, integración con AFIP y Mercado Pago). Posee una riqueza funcional visual sobresaliente con más de 40 módulos y portales para nichos específicos.

Sin embargo, para pasar de una **plataforma con gran potencial comercial y demos de alto impacto** a un **SaaS de misión crítica indestructible en producción real**, existen brechas estructurales (**Macro Gaps**) y operativas (**Micro Gaps**) que deben ser priorizadas y resueltas.

```
                    ┌────────────────────────────────────────┐
                    │        SITUACIÓN ACTUAL (2026)         │
                    └────────────────────────────────────────┘
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│             NIVEL MACRO              │  │             NIVEL MICRO              │
│  • Amplitud (40+ nichos) vs          │  │  • Venta fraccionada no cableada    │
│    Profundidad de motor real         │  │  • Presupuestos sin PDF/WA nativo    │
│  • RLS en BD vs control en API       │  │  • Dos paneles duplicados para Gym   │
│  • Offline-first & ESC/POS en caja   │  │  • Falta cobro real de seña en obra  │
│  • Contingencia AFIP & Padrones      │  │  • Restos de `empresaId: 1` hardcode │
│  • Onboarding desacoplado de puertas │  │  • Arqueo ciego de caja ausente      │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

---

# PARTE 1: GAPS MACRO (Estratégicos, Arquitectura, Infraestructura & Negocio)

Los **Macro Gaps** afectan la escalabilidad, la seguridad perimetral, la retención de clientes (churn) y la viabilidad del modelo de negocio.

---

### 1.1. La Disyuntiva "Amplitud Horizontal vs. Profundidad Vertical"
* **El Problema:** El sistema cuenta con interfaces y demos para más de 20 rubros (kioscos, gimnasios, veterinarias, talleres mecánicos, consorcios, fumigación, peluquerías, hoteles, canchas, etc.). Sin embargo, muchos de estos verticales son "maquetas con motores genéricos" (mismo CRUD de movimientos o citas).
* **El Riesgo:** Prometer en marketing un *"Sistema integral para Taller Mecánico o Fumigadoras"* y entregar un gestor de citas genérico sin orden de trabajo (OT) con checklist técnico, control de repuestos consumidos ni trazabilidad de vehículos.
* **Solución Arquitectural Requerida:**
  1. **Motor OT Field Unificado (Field Service Engine):** Un core común para servicios técnicos que maneje: Órdenes de Trabajo, Estados de Servicio, Asignación de Cuadrillas/Técnicos, Consumo de Insumos con deducción de stock y Firma Digital del cliente.
  2. **Regla de Go-Live Comercial:** Mantener en producción activa solo los packs con motor 100% probado (POS Kiosco/Almacén, Ferretería mostrador, Fiado de barrio, Gimnasios cuotas simples, Monotributo/Freelance) y dejar el resto explícitamente categorizados como *Piloto con acompañamiento* o *Beta*.

---

### 1.2. Seguridad Multi-Tenant & Aislamiento a Nivel Base de Datos
* **El Problema:** El aislamiento multi-tenant se realiza hoy **exclusivamente a nivel aplicación** en cada endpoint con `whereEmpresa(auth.empresaId)`.
* **El Riesgo:** Si un desarrollador o nuevo endpoint omite accidentalmente el filtro `whereEmpresa`, se produce una fuga de datos entre empresas competidoras (Cross-tenant Data Leak).
* **Solución Arquitectural Requerida:**
  1. **Row Level Security (RLS) en PostgreSQL (Supabase):** Implementar políticas RLS en Postgres donde la sesión establezca `SET LOCAL app.current_empresa_id = '...'` y la base de datos rechace a nivel motor cualquier consulta que mezcle tenants.
  2. **Linter / Testing de Aislamiento:** Tests automatizados de regresión que ejecuten llamadas cruzadas con JWT de Tenant B contra recursos de Tenant A esperando `403 Forbidden` o array vacío.

---

### 1.3. Resiliencia del POS en el Punto de Venta: Offline-First & Hardware
* **El Problema:** El POS de mostrador depende de una conexión a internet estable y latencia baja hacia Vercel/Supabase.
* **El Riesgo:** En un kiosco o almacén en hora pico, un corte de internet de 10 minutos o una caída de DNS paraliza la facturación y la cola de clientes.
* **Solución Arquitectural Requerida:**
  1. **Arquitectura Offline-First (PWA + IndexedDB):** Cachear catálogo de productos, precios y clientes en el navegador. Permitir cobrar y registrar ventas en local storage con una cola de sincronización asíncrona (*Sync Queue*) que impacte en la nube cuando vuelva la conexión.
  2. **Integración Nativa con Hardware de Caja:**
     - **Impresoras Térmicas ESC/POS:** Salida de tickets directa (vía Web Serial / Web USB / Bluetooth o servicio local en tray) sin obligar al cajero a abrir y confirmar el diálogo de impresión nativo del navegador (`window.print()`).
     - **Balanza Electrónica:** Lectura de peso en tiempo real por Web Serial o decodificación de prefijos EAN-13 (balanzas tipo 20/28).

---

### 1.4. Facturación Electrónica AFIP/ARCA: Contingencia & Padrones Dinámicos
* **El Problema:** La emisión de CAE es síncrona contra los Web Services de AFIP (WSFEv1).
* **El Riesgo:** AFIP experimenta caídas frecuentes o micro-cortes. Si el servidor de AFIP no responde en 3 segundos, la venta en mostrador se frena o queda en estado inconsistente.
* **Solución Arquitectural Requerida:**
  1. **Cola de Emisión Asíncrona con Contingencia:** Guardar el comprobante localmente como "Pendiente de CAE" e intentar la autorización en segundo plano mediante un worker / cron.
  2. **Sincronización Automática de Padrones Fiscales:** Descarga periódica del padrón de Ingresos Brutos (ARBA, AGIP, Convenio Multilateral) para aplicar alícuotas de percepción/retención exactas por CUIT al momento de emitir la factura.

---

### 1.5. Aterrizaje Dinámico de Puertas de Entrada (Landings) al Onboarding
* **El Problema:** Existe una suite completa de landings especializadas (`/claver/apps/[slug]`), pero tras el registro o login, el usuario ingresa a un dashboard genérico que puede mostrar módulos no contratados o fuera de su rubro.
* **El Riesgo:** Sobrecarga cognitiva y abandono inmediato (Onboarding friction) si un electricista o dueño de kiosco ve pestañas de "Hotelería", "Membresías" o "Contabilidad de Costos Industriales".
* **Solución Arquitectural Requerida:**
  1. **Puntualización por SKU (`?activar=`):** Al registrarse desde una landing específica, el tenant debe nacer con su `modoLite` configurado, sidebar filtrado y catálogo semilla (productos o servicios típicos de ese oficio).

---

### 1.6. Observabilidad, Auditoría Inmutable & Prevención de Fraude Interno
* **El Problema:** La auditoría actual es transaccional básica.
* **El Riesgo:** En un negocio con empleados (cajeros, encargados), el punto más sensible es el fraude interno: anulación de tickets cobrados en efectivo, descuentos arbitrarios, apertura de cajón sin venta, modificación de stock manual sin comprobante de ajuste.
* **Solución Arquitectural Requerida:**
  1. **Log de Auditoría Inmutable:** Registro con timestamp, usuario, IP, valor anterior y nuevo de cada acción sensible.
  2. **Alertas a Dueño por WhatsApp/Email:** Notificación inmediata al dueño ante eventos como "Caja cerrada con faltante > $5.000", "Anulación de ticket mayor a $20.000" o "Descuento > 15% aplicado manualmente".

---

# PARTE 2: GAPS MICRO (Módulos, UX, Reglas de Negocio & Edge Cases)

Los **Micro Gaps** son detalles de implementación, botones desconectados, cálculos incompletos o inconsistencias visuales que degradan la experiencia diaria.

---

### 2.1. Módulo de Caja & POS
| Sub-Módulo | Gap Específico | Impacto | Acción Requerida |
|---|---|---|---|
| **Venta Fraccionada** | La función `calcularVentaFraccionada` (peso, metros, m²) existe en `lib/pos/` pero no está cableada en la UI del POS. | Una fiambrería o ferretería no puede vender 250 gramos o 1,5 metros fluidamente. | Integrar selector de unidad y calculadora de fracción en el item del carrito. |
| **Promociones** | Motor de promos 2x1 y 3x2 en `lib/` no evalúa automáticamente el carrito. | El cajero debe calcular o rebajar el precio a mano. | Hook en el carrito que detecte combos y aplique descuento de línea. |
| **Arqueo Ciego** | Al cerrar caja, la UI muestra el monto teórico esperado antes de ingresar el conteo. | El cajero ajusta el conteo para que coincida en lugar de declarar lo que realmente hay en mano. | Implementar modo "Arqueo Ciego" donde el cajero ingresa billetes/monedas y el sistema luego muestra la diferencia. |
| **Medios de Pago Mixtos** | Flujo rígido a 1 solo medio de pago en ventas rápidas. | Clientes que pagan "$5.000 en efectivo y el resto por Transferencia MP". | Permitir split de pagos en el modal de cobro del POS. |

---

### 2.2. Módulo de Oficios & Obras
| Sub-Módulo | Gap Específico | Impacto | Acción Requerida |
|---|---|---|---|
| **Cobro de Seña** | En la ficha de trabajo existe el botón "Marcar Señado", pero es un simple toggle booleano. | No registra el ingreso de dinero en la Caja ni genera movimiento de cuenta corriente. | Conectar "Cobrar Seña" a ingreso en Caja con selección de medio (Efectivo/Transferencia/MP). |
| **Presupuesto 3 Niveles** | En la vista de nuevo presupuesto los 3 niveles tienen valores fijos hardcodeados ($35.000 / $70.000 / $100.000). | No permite cotizar obras reales con desglose dinámico. | Permitir carga de items y coeficientes multiplicadores por nivel (Básico, Estándar, Premium). |
| **Envío de Presupuestos** | El botón "Enviar" solo cambia el estado en base de datos. | No dispara PDF nativo ni template de WhatsApp con el detalle formateado al cliente. | Generar link público `/p/trabajo/{token}` + botón de WhatsApp con mensaje pre-armado y PDF descargable. |

---

### 2.3. Módulo de Gimnasios & Membresías
| Sub-Módulo | Gap Específico | Impacto | Acción Requerida |
|---|---|---|---|
| **Doble Home** | Coexisten `/dashboard/membresias` y `/dashboard/nicho/gimnasio`. | Confusión del usuario: las cuotas del mes se cobran en un lado y los socios se administran en otro. | Unificar en un único panel centralizado de Gimnasio. |
| **Cobro Recurrente** | Falta integración de suscripción con débito automático por Mercado Pago (Preapproval). | El administrador debe perseguir manualmente a cada socio todos los meses. | Habilitar suscripciones recurrentes MP con link de adhesión para el socio. |

---

### 2.4. Módulo de Clientes, Fiado & Cuentas Corrientes (CxC)
| Sub-Módulo | Gap Específico | Impacto | Acción Requerida |
|---|---|---|---|
| **Límite de Crédito** | Se puede seguir fiando a un cliente indefinidamente sin advertencia de saldo máximo. | Riesgo de morosidad incobrable para el comerciante. | Campo `limiteCredito` con alerta visual o bloqueo si `saldoActual + nuevaVenta > limiteCredito`. |
| **Imputación de Pagos** | Los pagos entran a una bolsa general sin asignar a qué comprobante corresponden. | Imposible saber si el cliente canceló la compra del lunes o la del viernes anterior. | Permitir imputar pagos a comprobantes específicos o aplicar método FIFO automático. |
| **Cobranza por WhatsApp** | Botón de WhatsApp abre chat vacío sin el saldo detallado ni el link de cobro digital. | Fricción para cobrar al cliente moroso. | Mensaje formateado: *"Hola [Nombre], te recordamos que tenés un saldo pendiente de $X. Podés abonar acá: [Link MP]"*. |

---

### 2.5. Stock, Compras & Proveedores
| Sub-Módulo | Gap Específico | Impacto | Acción Requerida |
|---|---|---|---|
| **Lote y Vencimiento** | Sin trazabilidad de número de lote ni fecha de caducidad. | Inviable para rubros como farmacias, veterinarias, alimentos perecederos o growshops. | Agregar campos `lote` y `fechaVencimiento` en movimientos de stock y alertas de vencimiento próximo. |
| **Conversión de Unidades** | Comprar por bulto/caja y vender por unidad suelta no tiene factor de conversión automático. | El usuario debe crear dos productos separados y ajustar stock a mano. | Factor de conversión: `1 Pack = 24 Unidades`. Al recibir 1 pack se incrementan 24 unidades en stock de venta. |

---

### 2.6. Consistencia de UI / UX & Deuda Técnica
| Área | Detalle del Gap | Solución Requerida |
|---|---|---|
| **Layouts No Estandarizados** | Páginas como Fiado, Banco o Impuestos tienen tablas HTML directas en lugar de `PageShell` y componentes shadcn/ui. | Migrar a `PageShell`, `DataTable` con paginación y `StatusBadge` unificado con tokens OKLCH. |
| **Hardcoded Demos en Código** | Persistían referencias a `empresaId: 1`, `reservaId: 1` o teléfonos `5491100000000`. | Reemplazar todo ID fijo por el contexto dinámico obtenido de la sesión autenticada. |
| **Modales de Confirmación** | Desactivar clientes o eliminar registros se ejecuta sin diálogo de confirmación previa. | Agregar `AlertDialog` destructivo en todas las acciones irreversibles. |
| **Conexión Mercado Pago** | La configuración requiere copiar y pegar manualmente el Access Token en un input. | Implementar flujo OAuth estándar de Mercado Pago ("Conectar mi cuenta"). |

---

# PARTE 3: MATRIZ DE PRIORIZACIÓN (ROADMAP DE RESOLUCIÓN)

```
        ALTO │  [BLOQUE 1: P0 - Go-Live Crítico]       [BLOQUE 2: P1 - Diferenciación]
             │  • Aislamiento RLS en DB               • Motor OT Field unificado
             │  • Resiliencia offline de POS          • Venta fraccionada y promos en POS
  IMPACTO    │  • Aterrizaje landings a onboarding    • Cobro real de seña e imputación CxC
             │  • Limpieza total de hardcodes         • Unificación de módulo Gimnasios
             │                                       
             │  [BLOQUE 3: P2 - Polish & UX]          [BLOQUE 4: P3 - Futuro / Avanzado]
             │  • PageShell y DataTable estándar      • Trazabilidad avanzada de lotes
             │  • Modales de confirmación             • Hardware bridge para ESC/POS y balanzas
        BAJO │  • Plantillas completas de WhatsApp    • OAuth nativo Mercado Pago
             └──────────────────────────────────────────────────────────────────────────
                                       COMPLEJIDAD TÉCNICA
```

---

## Plan de Acción Recomendado

### Fase 1: Blindaje Operativo & Go-Live (Semanas 1 - 2)
1. **Garantizar Aislamiento de Menú & Puertas:** Asegurar que cada rubro aterrice en su entorno correspondiente sin módulos cruzados.
2. **Cablear la Venta de Mostrador Real:** Activar venta fraccionada (pesables / corte) y cobros mixtos en el POS.
3. **Cerrar el Circuito de Oficios:** Conectar el cobro de seña y saldo a la Caja y Cuentas Corrientes.
4. **Validación de Datos en Runtime:** Eliminar cualquier resto de seeds o IDs fijos en formularios de producción.

### Fase 2: Robustez & Experiencia de Usuario (Semanas 3 - 4)
1. **Unificación de Módulos Duplicados:** Consolidar Membresías y Cuotas de Gimnasio en un solo panel.
2. **Generación y Despacho de Documentos:** Implementar generación de presupuestos con link público y PDF descargable para envío por WhatsApp.
3. **Caja con Arqueo Ciego:** Brindar al comerciante la seguridad de control sobre sus cajeros.
4. **Estandarización UI:** Reemplazar tablas crudas por componentes del Design System (`PageShell`, `DataTable`, `StatusBadge`).

### Fase 3: Infraestructura & Escala (Semanas 5+)
1. **Políticas RLS en Base de Datos:** Aislamiento a nivel PostgreSQL para máxima seguridad multi-tenant.
2. **Capacidades Offline-First en POS:** Almacenamiento local con sincronización en segundo plano.
3. **Motor OT Field:** Despliegue del motor de órdenes de trabajo para habilitar con solidez talleres, climatización, fumigación y servicios técnicos.

---

> **Conclusión:** El sistema cuenta con una ingeniería base excepcional y un diseño de alto nivel. Focalizando los esfuerzos en resolver estas brechas concretas (en lugar de dispersarse abriendo nuevos módulos desde cero), la plataforma se consolidará como el ERP y POS más competitivo, confiable y rentable del mercado.

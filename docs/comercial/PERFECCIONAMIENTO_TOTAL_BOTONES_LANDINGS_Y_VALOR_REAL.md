# Perfeccionamiento Integral de Producto, Cero Enlaces Rotos y Propuesta de Valor Real

> **Documento Maestro de Arquitectura Comercial y UX**  
> **Estado:** Implementación y Auditoría Activa  
> **Objetivo:** Eliminar cualquier punto ciego en la navegación (0 botones rotos / 0 errores 404) y transformar toda la comunicación en soluciones concretas a problemas reales de la calle.

---

## 1. Principios Rectores No Negociables

### A. Regla de Oro: "Cero Enlaces Rotos y Cero Botones Muertos"
- Ningún botón, enlace en menús desplegables, tarjeta de catálogo o CTA puede dirigir a una página inexistente (404) o ejecutar una acción vacía.
- Si un módulo o aplicación se menciona en la cabecera (ej: Gastronomía, POS, ARCA, Oficios), debe tener su ruta canónica operativa inmediatamente (`/claver/apps/gastronomia`, `/f`, `/arca`, `/f/servicios`).

### B. Prohibición de Hype y Jerga Incomprensible ("Cero Humo")
- Prohibidas frases como *"AI Engine 10 segundos"*, *"Cierra 3x más ventas"*, *"Superpoderes que multiplican tus ganancias"*, *"Magia algorítmica"*.
- El cliente no compra "Inteligencia Artificial"; compra **no perder 2 horas a la noche tipeando presupuestos en Word** y **no poner plata de su bolsillo para comprar materiales**.

### C. Demostración Visual del Problema y la Solución
- Cada landing page debe responder 3 preguntas en menos de 5 segundos de lectura:
  1. **¿Qué dolor insoportable me saca de encima hoy?**
  2. **¿Cómo funciona el flujo exacto paso a paso (sin misterios)?**
  3. **¿Cómo gano o protejo mi plata con esto?**

---

## 2. Diagnóstico y Corrección de Rutas (Auditoría de Enlaces)

### Caso Testigo Resuelto: `/claver/apps/gastronomia`
- **Problema detectado:** El menú de navegación de la landing principal dirigía a `/claver/apps/gastronomia`, pero el slug no estaba registrado en `SUB_SAAS_APPS` dentro de `lib/comercial/sub-saas-catalog.ts`, provocando un error 404 (`notFound()`).
- **Solución implementada:** Se integró formalmente la aplicación `gastronomia` con su SKU `pack.gastronomia`, título *"Gastronomía, Mesas & Comandas KDS"*, panel `/dashboard/hospitalidad`, carta QR `/menu/{empresaId}` y su matriz completa de dolores y soluciones.

### Matriz de Rutas Críticas de Navegación

| Entrada / Menú | URL Canónica | Estado | Propósito Real |
|---|---|---|---|
| **Oficios & Obras** | `/f/servicios` o `/` | ✅ Activo | Presupuestos por voz en 3 niveles y seña por WhatsApp. |
| **Comercios & POS** | `/f` | ✅ Activo | Mostrador rápido, fiado de barrio y control de caja. |
| **Facturación Oficial** | `/arca` | ✅ Activo | Emisión de Facturas A, B y C con CAE y QR fiscal AFIP. |
| **Gastronomía & KDS** | `/claver/apps/gastronomia` | ✅ Activo | Mesas, comandas digitales a cocina y carta QR. |
| **Libreta de Fiado** | `/claver/apps/fiado` | ✅ Activo | Reemplazo del cuaderno de almacén con límite de deuda. |
| **Cobranzas WhatsApp**| `/claver/apps/cobra` | ✅ Activo | Recordatorios automáticos de cobro con link de pago. |
| **Agenda & Turnos** | `/claver/apps/turnos` | ✅ Activo | Reservas online para salones, talleres y profesionales. |
| **Expensas / Consorcios**| `/claver/apps/propiedad` | ✅ Activo | Liquidación de expensas y avisos por WhatsApp. |
| **Catálogo Completo** | `/explorar` | ✅ Activo | Directorio de las 40+ aplicaciones y módulos ERP. |

---

## 3. Rediseño Conceptual: Cómo Explicar el "Audio / Presupuesto por Voz"

### El Problema de Comunicación Previo
Hablar de *"Voice-to-Quote AI Engine"* generaba desconfianza y confusión: el profesional no entendía si el sistema inventaba precios, si era un bot que hablaba solo o si requería configuraciones complejas.

### La Explicación Concreta de la Realidad del Oficio

```
┌────────────────────────────────────────────────────────────────────────┐
│ EL DOLOR REAL:                                                         │
│ Terminás una visita técnica a las 19hs con las manos sucias.           │
│ El cliente te dice: "Pasame el presupuesto por WhatsApp".              │
│ Llegás a tu casa a las 21hs cansado, te olvidaste los metros de cable  │
│ o caño que viste, te da fiaca abrir la computadora para hacer un Word  │
│ y terminás pasando un número al voleo o tardás 4 días en responder.    │
│ Resultado: El cliente regatea o contrata a otro.                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LA SOLUCIÓN MECÁNICA PASO A PASO (1 MINUTO):                           │
│                                                                        │
│ 1. HABLAS AL CELULAR (EN LA CAMIONETA O AL SALIR DE LA OBRA):          │
│    "En lo de García hay que colocar 3 aires de 3000 frigorías, pasar   │
│    15 metros de cable de 4mm y cambiar 2 térmicas Siemens."            │
│                                                                        │
│ 2. LA APP DESGLOSA Y ESTRUCTURA LOS ÍTEMS:                             │
│    Convierte el audio a texto y arma el borrador con 3 opciones:       │
│    • Opción 1 (Básico): Solo mano de obra.                             │
│    • Opción 2 (Recomendado): Mano de obra + cables y térmicas IRAM.    │
│    • Opción 3 (Completo): Llave en mano con garantía extendida.        │
│                                                                        │
│ 3. VOS REVISÁS Y FIJÁS TUS PRECIOS:                                    │
│    La IA no inventa tarifas. Vos ponés tus valores de mano de obra.    │
│                                                                        │
│ 4. ENVIÁS EL ENLACE POR WHATSAPP AL INSTANTE:                          │
│    El cliente ve una página clara en su celular, elige la opción que   │
│    se ajusta a su bolsillo y paga la SEÑA con Mercado Pago o CBU.      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Matriz de Dolor y Solución Concreta por Vertical

### 1. Oficios, Electricistas, Plomeros y Cuadrillas (`/f/servicios`)
- **Dolor Concreto:** Comprar materiales de su propio bolsillo porque el cliente promete transferir la seña "a la noche" y nunca lo hace; pérdida de presupuestos por tardar días en enviarlos en PDF.
- **Solución Real:** Presupuesto armado por audio en el momento con link interactivo donde el cliente debe abonar la seña (ej: 40%) con tarjeta o transferencia para congelar la fecha de inicio.
- **Resultado:** Cero plata propia arriesgada en materiales y presupuestos enviados en el acto.

### 2. Almacenes, Kioscos y Fiambrerías (`/claver/apps/fiado` / `/f`)
- **Dolor Concreto:** Cuaderno de fiados con hojas rotas, tachones, clientes que discuten el saldo final y no saber cuánta plata hay en la calle.
- **Solución Real:** Libreta digital en el celular con límite de crédito por cliente (alerta roja si se pasa) y botón para mandar el resumen detallado por WhatsApp.
- **Resultado:** Recupero de deudas sin peleas y control exacto de quién debe.

### 3. Bares, Cafeterías y Restaurantes (`/claver/apps/gastronomia`)
- **Dolor Concreto:** Cartas de papel tachadas por la inflación, comandas en papel perdidas o ilegibles en cocina, y mozos desbordados cuando las mesas piden la cuenta a la vez.
- **Solución Real:** Menú QR que se actualiza en 5 segundos desde el celular, pantalla digital de pedidos (KDS) en cocina y cobro rápido con división de cuenta por comensal.
- **Resultado:** Cero impresiones de cartas tiradas a la basura y pedidos que salen 10 minutos más rápido de cocina.

### 4. Cobranzas a Morosos y Cuentas por Cobrar (`/claver/apps/cobra`)
- **Dolor Concreto:** Perder 3 horas por día llamando o mandando mensajes uno por uno para reclamar facturas vencidas con excusas constantes.
- **Solución Real:** Secuencia automática de WhatsApp (Día +1, Día +7) con el detalle de la deuda y el botón directo de pago con tarjeta o débito.
- **Resultado:** Automatización del reclamo y cobranza sin desgaste personal.

---

## 5. Checklist de Verificación de Calidad para Toda Landing Page

- [x] **Sin enlaces ciegos:** Toda acción (`href`, `onClick`) conduce a una pantalla activa o abre el diálogo correspondiente.
- [x] **Visualización en celular:** Todos los componentes se leen y operan perfectamente con una sola mano en pantallas de 375px a 430px.
- [x] **Cero tecnicismos:** Reemplazar nombres de frameworks, siglas de IA o jerga por acciones humanas (*"hablás"*, *"anotás"*, *"mandás"*).
- [x] **Transparencia fiscal:** Dejar en claro cuándo interviene ARCA/AFIP y que la emisión de factura es un beneficio directo sobre el trabajo aprobado.
- [x] **Sin barreras de entrada:** Reforzar siempre que es gratis para arrancar y que no se requiere tarjeta de crédito para crear la cuenta.

---

## 6. Próximos Pasos Operativos

1. **Monitoreo Continuo de Errores 404:** Ejecución recurrente del test suite comercial (`__tests__/comercial/*.test.ts`) para garantizar que ningún SKU o slug quede desalineado.
2. **Refinamiento de las Demos Interactivas:** Asegurar que cada vertical cuente con su simulador directo donde el usuario experimente el valor en menos de 10 segundos.
3. **Auditoría de Botones de Registro:** Verificar que todos los parámetros `?activar=...` o `?ref=...` preserven el contexto de la aplicación seleccionada por el usuario al crear su cuenta.

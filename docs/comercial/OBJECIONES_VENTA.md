# 🛡️ Matriz Canónica de Objeciones de Venta: Claver ERP & Leo Cobranza

> **Manual de Respuestas y Cierre Comercial para Vendedores**  
> **Ticket:** `COM-02` (Matriz de Objeciones)  
> **Asignado a:** `gemini`  
> **Estado:** `done`  
> **Fecha:** Julio 2026  
> **Mercado:** PyMEs, Comercios de Cercanía, Almacenes, Kioscos y Servicios en Argentina (es-AR).

---

## 1. Resumen Ejecutivo

Este manual reúne **12 objeciones comerciales reales** que presentan los dueños de negocios en Argentina al momento de evaluar la contratación de Claver ERP y el Empleado Digital **Leo Cobranza**. Cada entrada proporciona el guión hablado exacto que debe utilizar el ejecutivo de ventas y la prueba visual que se debe mostrar en pantalla para cerrar la venta en el acto.

---

## 2. Matriz de Objeciones (12 Casos Reales de Calle)

| # | Objeción del Cliente | Categoría | Respuesta Hablada del Vendedor (Guión es-AR) | Demostración en Vivo (Pantalla 5s) |
|---|:---|:---|:---|:---|
| **1** | *"Mis clientes son vecinos de toda la vida y no quiero molestarlos por WhatsApp."* | **Miedo / Relación** | *"Te entiendo perfectamente. Por eso Leo no manda mensajes automáticamente sin tu permiso. Él te arma una lista de borradores súper amables y vos tocás un botón para aprobar solo a los que quieras."* | Abrir la pantalla de **Borradores de Leo** y mostrar la vista previa del mensaje amable con botón *"Aprobar"*. |
| **2** | *"Es caro $19.900 al mes, la cosa está difícil y hay muchos gastos."* | **Precio / Valor** | *"Entiendo la cuidar cada peso. Pero pensá esto: ¿cuánto tenés anotado en la libreta hoy? Si Leo te ayuda a cobrar tan solo un fiado viejo de $20.000, el sistema ya se pagó solo el primer mes."* | Abrir el panel de **KPI de Deudas Vencidas** y mostrar el monto acumulado en pesos listo para recuperar. |
| **3** | *"Yo uso la libreta de papel de toda la vida y me manejo bien."* | **Hábito / Inercia** | *"La libreta no se olvida de anotar, pero sí se olvida de cobrar. Con la libreta de papel tenés plata parada que pierde valor con la inflación. En Claver cargás el fiado en 2 segundos y te avisa cuando se vence."* | Simular una carga rápida de fiado en el POS de mostrador en solo 3 segundos con la tecla `F4`. |
| **4** | *"No sé usar computadoras y no tengo tiempo para capacitarme."* | **Complejidad** | *"Claver está diseñado para usar desde el celular o la compu del local sin saber nada de computación. Es tan fácil como usar Mercado Pago o WhatsApp. En 10 minutos tu negocio ya está funcionando."* | Mostrar la pantalla del **Wizard de 3 Pasos** (`/demo`) y realizar una venta de prueba en 2 clics. |
| **5** | *"Mercado Pago ya me cobra mucha comisión por cobrar con QR."* | **Costos de Pago** | *"Leo no te agrega comisiones extra. El cliente recibe un link directo de tu propia cuenta de Mercado Pago o transferencia bancaria CBU/CVU sin intermediarios. La plata va directo a tu cuenta."* | Mostrar la configuración del **Link de Pago Directo MP** donde se vincula la cuenta del comerciante. |
| **6** | *"¿Qué pasa si justo se me corta internet en el local? ¿Me quedo sin cobrar?"* | **Operativa** | *"Para nada. Claver cuenta con tecnología POS Offline. Si se corta internet, podés seguir vendiendo, escaneando códigos y emitiendo tickets normalmente. Cuando vuelve la conexión, todo se sincroniza solo."* | Desconectar el Wi-Fi en vivo, realizar una venta de prueba y mostrar cómo la venta queda guardada en la cola offline. |
| **7** | *"Ya uso Excel o una planilla y no pago nada."* | **Competencia** | *"Excel es buenísimo para anotar, pero no te emite facturas AFIP, no se conecta con la balanza del mostrador ni le manda recordatorios por WhatsApp a tus clientes. Excel no trabaja por vos, Leo sí."* | Abrir el **Importador CSV 1-Clic** y mostrar cómo se migra la planilla Excel a Claver en 5 segundos. |
| **8** | *"Tengo miedo de tener problemas con AFIP si registro todas las ventas."* | **Fiscal / Privacidad** | *"En Claver vos elegís exactamente qué facturás. Podés emitir comprobantes electrónicos AFIP con 1 clic para las ventas que necesites y llevar el control interno de tu caja sin complicaciones."* | Mostrar el selector de tipo de comprobante en la pantalla POS (`Factura A`, `B`, `C` o `Ticket Interno`). |
| **9** | *"A mi negocio vienen muchos abuelos que no usan Mercado Pago."* | **Perfil Cliente** | *"No hay problema. Con Leo podés registrar cobranzas en efectivo cuando el cliente viene al local. El recordatorio por WhatsApp sirve para avisarle de forma respetuosa cuánto debe antes de que pase."* | Registrar un cobro parcial en **Efectivo** desde la cuenta corriente del cliente en pantalla. |
| **10** | *"¿Tengo que firmar algún contrato de permanencia o dejar la tarjeta de crédito?"* | **Riesgo Comercial** | *"Ninguno. Tenés 7 días de prueba 100% gratis sin ingresar tarjeta. Si el sistema te sirve, seguís mes a mes. Podés pausar o cancelar cuando quieras con un solo clic."* | Mostrar el banner de **Trial Gratis 7 Días** sin solicitud de datos de tarjeta en el checkout. |
| **11** | *"¿Cómo sé que el sistema no va a mandar un mensaje dos veces al mismo cliente?"* | **Seguridad** | *"Leo tiene un sistema anti-doble mensaje estricto. Si a un cliente ya se le envió un recordatorio hoy o en la última semana, el sistema lo bloquea automáticamente para no generar spam."* | Mostrar el registro de auditoría (`esLeoActivo` / `Anti-Spam Filter`) en la pantalla de simulación Dry-Run. |
| **12** | *"Tengo más de una caja y varios empleados. ¿Se van a pisar entre ellos?"* | **Escalabilidad** | *"No. Claver incluye un sistema de presencia multi-terminal en tiempo real. Si un cajero está cobrando a un cliente, los demás ven la pantalla bloqueada para esa venta sin duplicar stock ni dinero."* | Abrir dos pestañas en simultáneo y mostrar la barra de presencia colaborativa en tiempo real (`usePresence`). |

---

## 3. Guión de Cierre en 3 Pasos (Técnica "Probar sin Riesgo")

1. **Empatizar**: *"Entiendo perfectamente tu duda, a muchos comerciantes de la zona les pasaba exactamente lo mismo."*
2. **Demostrar**: *"Mirá, déjame mostrarte en 5 segundos en mi celular cómo Leo resuelve esto sin que tengas que cambiar tu forma de trabajar."*
3. **Cerrar**: *"Probémoslo hoy gratis por 7 días en tu local. No te pido tarjeta ni contrato. Si en una semana no recuperaste plata de fiados, lo desactivás y listo. ¿Con qué email te creo la cuenta?"*

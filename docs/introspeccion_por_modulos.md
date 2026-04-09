# Introspección Funcional por Módulos del ERP (Argentina)
> **Última actualización:** 2026-04-09
> **Estado:** Refleja la arquitectura consolidada hasta el Sprint 21+
> **Sistema:** Next.js 15, Prisma/PostgreSQL, Localización Argentina (AFIP, ARBA).

Este documento presenta una **organización temática detallada** del ERP, alejándose del historial cronológico de sprints para ofrecer una **fotografía de la arquitectura de dominio** agrupando las entidades y funcionalidades lógicas de cada sistema.

---

## 1. Núcleo, Seguridad y Autenticación (Core & Multi-Tenant)
Módulo fundamental encargado del aislamiento de datos (RLS) y la gestión de operadores.

* **Multi-empresa (RLS):** 
  * Entidad principal: `Empresa` con su CUIT, punto de venta AFIP, y perfil impositivo (Responsable Inscripto, etc).
  * **RLS Activo:** Absolutamente todos los modelos dependientes (Clientes, Facturas, Compras, etc.) apuntan a `empresaId`. Un middleware JWT Edge-compatible restringe el acceso a los datos de la empresa correcta y las consultas Prisma operan inyectadas desde `getAuthContext()`.
* **Autenticación (JWT):** 
  * Entidad: `Usuario`.
  * Middleware con expiración (24h/renovación), logouts y perfiles (roles: admin, contador, vendedor).
  * Rate-limiting implementado (5 req/15min) en logins y flujos demo.
* **Trazabilidad y Auditoría (Audit Trail):**
  * Entidad: `LogActividad`. Registra qué usuario generó una acción (`createdBy`, `updatedBy`) y retención de historial de borrado (`deletedAt`) a través de un esquema generalizado de *soft-deletes*.
* **Configuraciones Globales:** 
  * Entidad: `ConfiguracionModulo`.
  * EventBus interno. Persistencia base de que modulos están encendidos o apagados.

## 2. Comercial: Ventas, Facturas y Cuentas a Cobrar
Gestión del ciclo completo "Order to Cash".

* **Maestros Comerciales:**
  * Entidades: `Cliente`. 
  * Soporte de información fiscal, agencias de retención/percepción, límite y cuenta corriente.
* **Ciclo de Venta:** `Presupuesto` -> `PedidoVenta` -> `Factura` / `Remito`.
  * El motor maneja transiciones de estado de forma unívoca y controlada, reservando inventario temporalmente durante las aceptaciones.
* **Facturación AFIP Electrónica:**
  * Entidades: `Factura`, `LineaFactura`, `NotaCredito`.
  * Integración SOAP directa. Soporte Multimoneda (RG 5616), QR Fiscal, CAE/CAEA. Se incluye discrimación detallada de IVAs y Percepciones/Retenciones aplicables.
* **Cuentas a Cobrar:**
  * Aging Automático, balances de deuda, emisión de `Recibos` y aplicación de pagos a documentos abiertos.
  
## 3. Abastecimiento: Compras, Proveedores y Cuentas a Pagar
Gestión del ciclo "Procure to Pay", y trazabilidad de erogaciones.

* **Maestros de Proveedores:**
  * Entidad: `Proveedor`. Vinculado a rubros, provincias de impacto tributario y condiciones de pago.
* **Flujos de Aprovisionamiento:** `OrdenCompra` -> Recepción (Remitos de ingresos) -> `Compra`.
  * Incluye el proceso *3-Way Matching* implementado y bloqueante (cantidades recibidas vs solicitadas vs facturadas).
* **Cuentas a Pagar:**
  * Entidades: Órdenes de Pago (`OrdenPago`).
  * Gestión de envejecimiento operativo de deudas, y verificación WSCDC Automática (Validez del CAE del Proveedor emitido a la Empresa).

## 4. Tesorería, Cajas y Conciliaciones
Manejo transaccional físico y virtual del dinero.

* **Fondo Fijo y Cajas Físicas:**
  * Entidades: `Caja`, `MovimientoCaja`.
  * Sistema completo de Arqueo Físico vs Operativo con registro de turno, control formal de diferencias de arqueo y exigencia de justificación.
* **Gestión Bancaria:**
  * Entidades: `CuentaBancaria`, `MovimientoBancario`.
  * Transferencias entre cuentas, saldos, importación de movimientos de resúmenes y Conciliaciones Masivas. Manejo avanzado de Multimoneda y Cotizaciones BNA/MEP (Dólares, Euros, ARS, etc.).

## 5. Finanzas, Contabilidad e Impuestos Generales
El motor financiero subyacente alimentado pasivamente (automáticamente) y manipulable.

* **Contabilidad General:**
  * `AsientoContable`, `MovimientoContable`, `CentroCosto`.
  * Todos los movimientos sistémicos (ventas, compras, pagos) percuten en la contabilidad general de los Libros Diarios. Se incluyen proyecciones para reportes organizados jerárquicamente por centros de costos.
* **Motor Fiscal y Padrón:**
  * `TaxConcepto`, `TaxTasa`, `PeriodoIIBB`.
  * Cálculo dinámico de Retenciones (SICORE), Percepciones. Base de datos con tasas y vigencias actualizables (Catálogos de tasas). Importación Masiva e integración con padrones jurisdiccionales (ARBA, AGIP, DGR).
  * Liquidación y DDJJ generada automáticamente con el motor.
* **Gestión Integral de Activos Fijos:**
  * Activos, depreciaciones lineales (asientos mensuales automáticos automatizados de forma cíclica), manejo del Cuadro de Amortización con fecha de baja.

## 6. Inventario y Logística (WMS)
Trazabilidad de almacenes y flujo físico saliente.

* **Stock Multidepósito:** 
  * Entidades: `Producto`, `Categoria`, `MovimientoStock`, `Deposito`, `StockDeposito`.
  * Valorización, movimientos (entradas, salidas, ajustes, transferencias), control visual por categorías y lotes expirables.
* **Logística:**
  * Entidades: `Remito` (con COT asociado), `LineaRemito`, `Envio`, `Transportista`, `HojaRuta`, `ParadaRuta`.
  * Asignación de remitos a encomiendas o a un circuito propio de hojas de ruteo, trazabilidad de tracking interno, cotización de envases para devoluciones (`MovimientoEnvase`).

## 7. Industria, Producción y Picking (MRP Liviano)
Transformación y preparación eficiente de despachos.

* **Alineación Productiva (MRP):**
  * Entidades: `ListaMateriales` (BOM), `ComponenteBOM`, `OrdenProduccion`.
  * Emisión de OP, consumos predictivos y estribera de insumos (sub-boms hasta nivel infinito), reportes de eficiencia.
* **Picking y Packing:**
  * Rutinas consolidadas. Recolección de productos emitiendo `ListaPicking` que optimiza en qué orden y cantidades deben sacar los productos de las ubicaciones del almacén, asegurando la no duplicación de envíos.

## 8. Vertical Hospitalidad / Gastronomía
Un submódulo autocontenido orientado a salones comensales.

* **Arquitectura de Salones:** `Salon`, `Mesa`. Trazabilidad de capacidades, unión y distribución de mesas con posiciones visuales.
* **Mecánica del Servicio:** 
  * `Comanda`, `LineaComanda`. Sistema dinámico donde un Producto marcado como `esPlato=true` entra a jugar. Si es un plato, busca su `ListaMateriales` descontando dinámicamente cada insumo (`esInsumo=true`) por porción del inventario central, integrándose a facturación o cerrando tickets.
  * *KDS (Kitchen Display System):* Manejo del estado del fuego/salida en monitores de cocina a través de websockets o auto-refresh.

## 9. Vertical Servicios Profesionales (Salud, Agenda y Membresías)
Arquitectura general aplicable tanto a clínicas, turnos de asesores u otros ciclos rotativos.

* **Agenda y Planillas:** `Profesional`, `Turno`, `Paciente`, `Consulta`. Mapeo completo estilo HCS (Historia Clínica de Salud) que va desde la asignación y sala de espeara hasta el ticket facturado. Soporte paramétrico (peso, diagnóstico, señales vitales si aplica).
* **Gestión de Membresías:** `PlanMembresia`, `Membresia`. Facturación recurrente, control perimetral por abonos vigentes, control de alta/baja mensual y ciclos.

## 10. IoT Industrial
Monitorización conectada.

* **Componentes IoT:**
  * Entidad `DispositivoIoT` y sus submodelos para lecturas / alertas.
  * Soporte de Protocolos amplios (Modbus, OPC-UA, MQTT, CoAP, etc) insertando streams a dashboards. Gestión rigurosa paramétrica de calibraciones, protecciones mecánicas (IP ratings), y trazabilidad con Normas internacionales aplicables.

## 11. Onboarding Automático e IA
Inicialización simplificada asombrosa e inyección inteligente.

* Un motor de autoconfiguración recibe datos genéricos en el *Onboarding*, aplica un wizard contextual (con recomendación o semántica de IA) e inicializa paramétricamente la empresa con: Seteo del Plan de cuentas adecuado a su vertical, Semillado del Maestro de Artículos mínimos y creación de roles/perfiles necesarios para que con 2 clics el usuario localice su ERP listo para su rubro.

---
> **Nota de Arquitectura General:** Todo el proyecto usa una topología basada en *Domain Driven Service Providers* (`lib/modulo/modulo-service.ts`) que exponen funciones estandarizadas al *App Router API* (`app/api/modulo/route.ts`), manteniendo las transacciones e integridad (Prisma) siempre en la capa de servicios.

# Faltantes técnicos por nicho — Grupo Claver / Claverp

**Fecha de relevamiento:** 2026-07-18  
**Alcance:** kiosco/almacén, ferretería, gimnasio, clínica, veterinaria, taller mecánico, fumigadoras, service de aire acondicionado, gaps transversales, **y servicios operativos/verticales fáciles de pasar por alto** que el sistema podría (o debería) controlar.  
**Propósito:** inventario honesto de lo que **falta o está incompleto** para poder planificar desarrollo, demos y promesas comerciales. No es un brochure: es backlog técnico + radar de oportunidades.

> **Alineación comercial / PRD:** qué se puede **vender y poner en producción** vs solo demo/piloto está en  
> **[`docs/GO_LIVE_PRD.md`](../GO_LIVE_PRD.md)** (política de go-live).  
> **De piloto a vendible end-to-end** (venta, cobro, impl, soporte, churn):  
> **[`docs/PRODUCTO_VENDIBLE_END_TO_END.md`](../PRODUCTO_VENDIBLE_END_TO_END.md)**.  
> Este archivo es el **backlog técnico por nicho**.

**Leyenda de madurez (orientativa)**

| Nivel | Significado |
|-------|------------|
| **A** | Operable en calle con caveats; bugs conocidos pero hay camino feliz |
| **B** | Demo / operación liviana; falta profundidad del rubro |
| **C** | Empaquetado o shell; datos/seed rotos o motor genérico sin dominio |
| **D** | No existe como vertical; solo se puede “simular” con módulos genéricos |

---

## Índice

1. [Transversal (afecta a todos los nichos)](#1-transversal-afecta-a-todos-los-nichos)
2. [Kiosco / almacén de barrio](#2-kiosco--almacén-de-barrio)
3. [Ferretería / corralón](#3-ferretería--corralón)
4. [Gimnasio / pilates / club fitness](#4-gimnasio--pilates--club-fitness)
5. [Clínica / consultorio médico](#5-clínica--consultorio-médico)
6. [Veterinaria](#6-veterinaria)
7. [Taller mecánico](#7-taller-mecánico)
8. [Fumigadoras / control de plagas](#8-fumigadoras--control-de-plagas)
9. [Aire acondicionado / climatización / service field](#9-aire-acondicionado--climatización--service-field)
10. [Empresa de servicios genérica (`servicios_pro`)](#10-empresa-de-servicios-genérica-servicios_pro)
11. [Órdenes de servicio (concepto transversal OT)](#11-órdenes-de-servicio-concepto-transversal-ot)
12. [Demos, seeds y sensor comercial](#12-demos-seeds-y-sensor-comercial)
13. [Billing, MP, partners (impacto en “vender el nicho”)](#13-billing-mp-partners-impacto-en-vender-el-nicho)
14. [Servicios que podrían controlarse y no te das cuenta](#14-servicios-que-podrían-controlarse-y-no-te-das-cuenta)
15. [Priorización sugerida](#15-priorización-sugerida)
16. [Referencias de código y auditorías](#16-referencias-de-código-y-auditorías)

---

## 1. Transversal (afecta a todos los nichos)

Estos ítems no son de un solo rubro, pero **degradan la experiencia de cualquier demo o tenant**.

### 1.1 Fiado — activación parcial y APIs frágiles

- **Qué falla:** en demos retail tipo almacén, el hook de provisión de fiado puede tumbar el reporte de SKUs (`skusActivados: []` aunque en DB quede algo activo). La API de resumen de fiado ha devuelto **500** por consultas a tablas/logs inexistentes (`fiadoNotificacionLog` u homólogos).
- **Impacto:** el wow moment “quién me debe + WhatsApp” se cae en demo comercial. Es el ancla gratis más vendida.
- **Faltante técnico:**
  - Corregir `lib/fiado/fiado-provision.ts` (uso de logger incorrecto / `any.log`).
  - Alinear `lib/fiado/fiado-service.ts` al schema Prisma real (sin tablas fantasma).
  - Revisar guards de licencia en rutas `/api/fiado/*` (`isLicensed` vs `isLicensed.ok`).
  - Tests de integración: provision retail → `GET /api/fiado/deudores` + `GET /api/fiado/resumen` = 200.

### 1.2 Doble seed de productos y catálogo “kiosco” en otros rubros

- **Qué falla:** onboarding retail + `seedIndustryDemoData` pueden crear el mismo tipo de producto dos veces (códigos `ONB-*` / `DEMO-KIOS-*`). Clientes de demo a veces salen del catálogo de kiosco aunque el `industryId` sea otro.
- **Impacto:** demo de carnicería/ferretería “se ve a kiosco”; stock y listados confunden.
- **Faltante técnico:**
  - Una sola fuente de seed por `industryId` (o `skipProductos` consistente).
  - `CLIENTES_POR_RUBRO` y códigos de producto por **template.id**, no solo `template.rubro` genérico.
  - Eliminar prefijos hardcodeados `DEMO-KIOS-*` para rubros no-kiosco.

### 1.3 Motor de nicho genérico vs dominio real

- **Arquitectura actual:** muchas apps de nicho reutilizan engines:
  - `movimientos` (taller, obras, delivery, feria…),
  - `cuotas` (gym, club, escuela…),
  - `agenda` (consultorio, peluquería…),
  - `libreta` / `consorcio` (casos puntuales).
- **Qué falta:** modelos de dominio propios (OT con ítems, paciente–tutor, contrato de mantenimiento, visita de campo con checklist). Hoy la UI de nicho a menudo es un **CRUD de movimientos** con labels renombrados.
- **Impacto:** se puede demoear el “estado LISTO + WhatsApp”, pero no procesos reales del rubro.

### 1.4 Seeds ausentes en nichos `movimientos` / `cuotas`

- **Qué falla:** demos de taller, club, etc. provisionan SKU y pantalla, pero **0 movimientos / 0 cuotas / 0 órdenes**.
- **Impacto:** el vendedor entra a un panel vacío; el wow moment no se ve.
- **Faltante técnico:**
  - Completar `NICHE_MOVIMIENTO_SEEDS` y seeds dedicados (`seedClubDemo`, órdenes de taller, etc.).
  - Checklist automático post-provision: “golden path API devuelve N ≥ 1 registros demo”.
- **Estado 2026-07-18 — Gemini Fase 2 (vet/taller) + Fase 3 local (club/gym):**
  - ~~Vet / taller~~ → a cargo de Gemini + refuerzos (guiones, catálogo TM-*, clientes OT).
  - ~~Club vacío~~ → `seedClubDemo` con planes, morosos, cantina, movimientos con `clienteId`.
  - ~~Gym socio huérfano (Carlos Pintos)~~ → membresía + match resiliente de nombres.
  - **Sigue pendiente:** carnicería kg/balanza, validador post-demo automático, pre-warm demos, seeds feria/remis profundidad.

### 1.5 Rate limit del sensor demo

- **Qué falla:** `POST /api/onboarding/industry-demo` limita ~15 req / 15 min. Baterías de QA o deep-links concurrentes devuelven **429**.
- **Faltante técnico:** cola, cache de demos pre-warmed por rubro, o límite separado para analistas/CI con secret.

### 1.6 Modo lite / sidebar / golden path desalineados

- **Qué falla:** un rubro puede tener `goldenPath` A y app de nicho con `goldenPath` B (ej. gimnasio: `/dashboard/membresias` vs `/dashboard/nicho/gimnasio`). El menú muestra labels del rubro pero el usuario cae en ERP “completo” con ruido.
- **Faltante técnico:** una sola “home del producto” por enganche; `modoLite` + allowlist de sidebar coherentes con el pack vendido.

### 1.7 Dependencias de SKU y marketplace “Próximamente”

- **Qué falla:** SKUs `planned` no se auto-activan; packs que piden `core.claver` / `core.pos` fallan en silencio o a medias. Balanza carnicería puede devolver **403** por entitlement.
- **Faltante técnico:** grafo de dependencias explícito en provision; mensaje claro en UI; no prometer módulo sin hook real.

### 1.8 Impresión fiscal, AFIP y hardware

- **Qué falta para “100% kiosco/ferretería Argentina”:**
  - AFIP producción por tenant (certificados, CAE/CAEA, puntos de venta múltiples).
  - Impresora fiscal/ticket en entorno cloud (no `COM1` local en Vercel).
  - Balanza en mostrador (parcial para carnicería; no generalizado).
- **Impacto:** en Vercel/cloud el POS “vende” pero el cierre fiscal y el hardware del mostrador requieren setup de implementador (analista), no es self-serve total.

### 1.9 WhatsApp / Twilio no garantizado

- **Qué falta:** sin `TWILIO_*` los wow moments “mandá WhatsApp” no son automáticos (quedan plantilla/UI).
- **Faltante técnico:** modo simulado visible en demo; o mock de envío en demos con log en UI; no prometer WA real sin env.

### 1.10 Multi-sucursal, roles operativos y app de campo

- **Qué falta de forma general:**
  - Sucursales con stock y caja por local bien productivizado en todos los packs lite.
  - Roles (cajero, técnico, mozo, profesional) con permisos finos por nicho.
  - App móvil / PWA de campo offline-first para técnicos (hoy hay piezas de vendedor en ruta / offline, no un OT field unificado).

---

## 2. Kiosco / almacén de barrio

**Madurez estimada: A− (más avanzado del portfolio retail)**  
**Templates:** `almacen`, `kiosco`  
**Enganches típicos:** `pos.fiado_barrio`, `pool-kiosco-barrio`  
**Golden path:** `/dashboard/fiado` o POS  

### 2.1 Lo que ya cubre (contexto, no es faltante)

- POS mostrador, productos, stock básico, caja, clientes, libreta de fiado como ancla, demo por rubro.

### 2.2 Faltantes técnicos

#### 2.2.1 Estabilidad del circuito fiado (P0)

- Resumen/deudores sin 500 en todos los entornos.
- Notificaciones (email/WA) con cola y reintento, no dependientes de modelo inexistente.
- Conciliación: fiado → cobro parcial → movimiento de caja sin doble conteo.
- Límites de crédito por cliente, mora, historial de “quién fió” (usuario cajero).

#### 2.2.2 Inventario de kiosco real

- **Unidades mixtas** (unidad, pack, bulto) y conversión a mostrador.
- Alertas de **quiebre** y reposición sugerida (parcial con IA/JIT; no cerrado end-to-end en todos los tenants).
- Control de **vencimientos** (snacks/lácteos) — más fuerte en farmacia/template, no siempre en kiosco lite.
- Códigos de barras / lectora: UX POS existe en parte; falta checklist de hardware go-live por tenant.

#### 2.2.3 Caja y arqueo de calle

- Arqueo multi-medio (efectivo, MP QR, transferencia) con diferencia justificada.
- Cierres de turno por cajero y multi-caja abierta (hay alertas de cajas; falta madurez de “kiosco de madrugada”).
- Integración MP del **comercio** (cobro del cliente final) distinta de MP de **suscripción Claver** — documentar y testear ambos.

#### 2.2.4 Demo y datos

- Seeds sin duplicar productos.
- Clientes fiado con saldos y movimientos listos para el tour (no solo nombres).
- Script/validador: post-demo `fiado/deudores` ≥ N y `productos` ≥ N.

#### 2.2.5 Cumplimiento y ticket

- Ticket no fiscal vs factura AFIP según monotributo/RI del kiosquero.
- Homologación vs producción AFIP sin romper la demo (entorno `homologacion` por defecto en demos).

#### 2.2.6 Offline / corte de luz

- Modo offline del POS: hay base (`/offline`, managers); falta **garantía de sync** de ventas y fiado al volver online sin pérdida ni duplicados (crítico en kiosco real).

---

## 3. Ferretería / corralón

**Madurez estimada: B**  
**Template:** `ferreteria`  
**Enganche:** retail `pos.core` / mostrador  
**Golden path:** `/dashboard/ventas` / POS  

### 3.1 Faltantes de dominio ferretería (no es solo “otro kiosco”)

#### 3.1.1 Unidades y metraje

- Venta por **metro, kg, m², unidad** con precio y descuento de stock en la unidad base.
- Corte de perfiles / listones: cantidad pedida vs merma (hoy no hay motor de merma de corte ferretero).
- Precios por lista (mostrador / obra / mayorista) bien expuestos en el pack ferretería (listas de precio existen en core; falta **pack + UX** enfocada).

#### 3.1.2 Presupuestos de obra y mostrador

- El wow del template habla de “presupuesto por voz / stock en vivo”: la voz/IA no es un flujo cerrado garantizado en prod sin Gemini y sin UX de ferretería.
- Presupuesto multi-ítem con validez, seña y conversión a venta/remito **sin fricción** en modo lite.
- Remitos de entrega a obra + saldo a facturar (parcial en compras/ventas; no empaquetado como “corralón”).

#### 3.1.3 Stock y depósitos

- Multi-depósito (showroom vs galpón) y transferencia entre ellos.
- Reservas de stock por presupuesto aceptado.
- Artículos con **equivalencias** (tornillo x caja vs suelto).

#### 3.1.4 Cuentas corrientes de obra / constructor

- Cuenta corriente de cliente obra con órdenes de compra del cliente, no solo “fiado de barrio”.
- Plazos 30/60 días, retenciones, facturación parcial por avance — **no** es el mismo producto que libreta fiado de almacén.

#### 3.1.5 Demo

- Seeds de productos ferreteros (cemento, hierro, tornillería) en vez de genéricos o kiosco.
- Tour: presupuesto → reserva stock → entrega → factura.

#### 3.1.6 Lo que no hay y el rubro espera

- Catálogo de proveedores con lista de precios de compra actualizable (hay compras; falta workflow “lista proveedor → margen”).
- Integración con balanza de corralón / bascula (si aplica) distinta a balanza carnicería.

---

## 4. Gimnasio / pilates / club fitness

**Madurez estimada: A− / B+ (mejor circuito de demo nicho en auditoría)**  
**Templates:** `gimnasio`, `gimnasio_barrio`  
**Enganche:** `niche.gimnasio_barrio`  
**Golden paths:** `/dashboard/membresias` y/o `/dashboard/nicho/gimnasio`  

### 4.1 Faltantes técnicos

#### 4.1.1 Unificar producto “gimnasio”

- Dos entradas (membresías ERP vs nicho cuotas) confunden. Falta **una home** del pack gym con tabs: socios, planes, morosos, cobros, clases.
- Planes espurios creados por provision de marketplace/engine cuotas (“Claver Gimnasio” genérico) hay que eliminar o no crear en demo.

#### 4.1.2 Socios y membresías

- Vinculación 1:1 cliente ↔ membresía sin huérfanos (auditoría: socios sin plan).
- Estados: activa, suspendida, vencida, congelada (vacaciones) — freeze/prorrateo incompleto o no productivizado.
- Control de acceso (torniquete / QR en puerta): **no** hay hardware/access control nativo.
- Huella / socio duplicado / foto de ficha: no es core actual.

#### 4.1.3 Cobranza y morosos

- Semáforo de morosos + WA masivo: parcialmente vía cuotas/CxC; falta **campaña** con plantillas y registro de promesa de pago.
- Débito automático de cuota (MP suscripción del socio o CBU): no es el mismo flujo que la suscripción SaaS de Claver; **falta producto “cuota socio recurrente”**.
- Comisiones de vendedor de planes / pases.

#### 4.1.4 Clases y agenda

- Agenda de clases grupales con cupo, instructor y asistencia — el template apunta a `/dashboard/agenda` pero no hay producto “clases de gym” de primera clase.
- Pilates reformer: turnos fijos semanales y lista de espera — no modelado específico.

#### 4.1.5 Demo y seeds

- Aunque el gym es el mejor seedado, falta:
  - Datos consistentes (todos los clientes con plan).
  - Tour: socio vencido → un click WA → cobro → estado verde.
  - KPI home: activos / vencidos / cobrado del mes.

#### 4.1.6 App del socio

- Portal del socio (ver vencimiento, pagar, reservar clase): **no** como producto cerrado del pack gym.

---

## 5. Clínica / consultorio médico

**Madurez estimada: B− / C+**  
**Template:** `clinica`  
**Enganche:** `niche.consultorio_solo`  
**Golden path:** `/dashboard/agenda` (+ historia clínica en menú)  

### 5.1 Faltantes técnicos (lo que un consultorio espera y no está al 100%)

#### 5.1.1 Agenda clínica real

- Agenda por **profesional / especialidad / consultorio** (recursos múltiples).
- Duración de turno por tipo de prestación (primera vez vs control).
- Overbooking, lista de espera, confirmación y cancelación con política.
- Integración con Google Calendar / recordatorio multi-canal (WA sí como promesa; email/SMS opcionales).

#### 5.1.2 Historia clínica humana

- HC orientada a **paciente humano** (no solo reutilizar conceptos de vet).
- Evoluciones, diagnósticos (CIE opcional), adjuntos (estudios PDF/imagen) con privacidad.
- Consentimientos y firma.
- **No** hay HIS hospitalario (internación, enfermería, quirófano) — y no debería prometerse.

#### 5.1.3 Facturación de obra social / prepaga

- El tagline menciona “facturación OS”: el core de ventas/facturas **no** implementa un circuito completo de:
  - padrones de afiliados,
  - nomenclador,
  - presentación de lotes a OS,
  - débito automático de coseguro.
- Falta producto “liquidación OS” o dejar explícito que se factura particular / monotributo.

#### 5.1.4 Privacidad y roles

- Rol **profesional** vs recepción vs admin con aislamiento de historias.
- Auditoría de acceso a HC (quién abrió la ficha).
- Cumplimiento de datos de salud (políticas, retención) — capa legal/producto incompleta.

#### 5.1.5 Cobranza del acto

- Flujo turno → atención → cobro particular / seña en un solo wizard.
- Recibo y factura desde la ficha del día.

#### 5.1.6 Demo

- Seeds de profesionales, agenda de la semana, pacientes con turnos y al menos una evolución.
- Tour de 3 pasos sin caer en ERP completo ruidoso.

#### 5.1.7 Telemedicina / receta electrónica

- **No** hay teleconsulta nativa ni receta electrónica regulada argentina como módulo cerrado.

---

## 6. Veterinaria

**Madurez estimada: C+ / B−**  
**Template:** `veterinaria` (+ `vet_barrio`)  
**Enganche:** `niche.vet_barrio`  
**Golden path:** `/dashboard/historia-clinica`  

### 6.1 Faltantes técnicos

#### 6.1.1 Modelo tutor–paciente (mascota)

- Relación clara: Cliente (tutor) ↔ Pacientes (mascotas) con especie, raza, sexo, fecha nacimiento, peso, chip.
- Auditoría documentó **0 pacientes / 0 consultas** en seed de demo pese a productos y tutores — el wow “perfil de Bobby” **no se cumple** si el seed falla.
- Faltante: `seedVetDemo` robusto (mascotas + consultas + vacunas pendientes) y tests.
- **Fix aplicado (Fase 2):** match de tutores con guiones normalizados + alta de paciente/consulta si faltan. **Re-validar** con POST industry-demo `veterinaria`.

#### 6.1.2 Historia clínica veterinaria

- Consultas, vacunas, desparasitación, cirugías, alergias, archivos.
- Calendario de vacunas con alerta y WA al tutor (plantilla existe en catálogo; automatización end-to-end incompleta sin Twilio + job).
- Recetas y productos del mostrador descontados del stock al cerrar consulta.

#### 6.1.3 Mostrador + clínica en un flujo

- Cobrar consulta + alimento + antiparasitario en el mismo acto (POS vinculado a ficha).
- Internación / peluquería canina / hotel — no como módulos maduros del pack vet.

#### 6.1.4 Multi-tenant security en HC

- GET ya filtra por `cliente.empresaId`.
- **Fix aplicado (fuera de plan Gemini):** POST paciente/consulta valida que tutor y paciente pertenezcan a `usuario.empresaId` (antes se podía crear consulta a paciente de otra empresa si se adivinaba el id).
- Falta: tests automatizados de aislamiento multi-tenant en HC.

#### 6.1.5 Modo lite / enganche

- Históricamente el template pudo quedar en `modoLite: completo` o sin SKUs activados si el enganche no aplica bien. Falta provision que deje **solo** agenda + HC + mostrador + clientes (sin ruido de industria/agro).

#### 6.1.6 Demo comercial

- Datos: Bobby y Max con vacunas pendientes y un turno.
- Tour: abrir ficha → ver vacuna vencida → WA tutor → cobrar consulta.

#### 6.1.7 Lo que el rubro pide y no hay

- Estudios de laboratorio e integración con equipos.
- Cirugía con parte quirúrgico y stock de insumos por procedimiento.
- App del tutor (vacunas, turnos) — no portal pet-owner cerrado.

---

## 7. Taller mecánico

**Madurez estimada: C**  
**Template:** `taller_mecanico`  
**SKU:** `niche.taller_mecanico`  
**Engine:** `movimientos` (no motor de taller industrial)  
**Golden path:** `/dashboard/nicho/taller`  
**Estados de label:** pendiente → presupuesto → reparación → listo → entregado → pagado  

### 7.1 Faltantes técnicos

#### 7.1.1 Orden de trabajo (OT) de verdad

Hoy una “orden” es un **movimiento de nicho** con categorías (`orden`, `repuesto`, `mano_obra`), no un documento de taller con:

- Patente, marca, modelo, km, color, VIN.
- Checklist de recepción (rayones, combustible, objetos personales) con foto.
- Diagnóstico, presupuesto aceptado/rechazado, anticipo.
- Ítems de **repuestos** (SKU de stock) + **mano de obra** (tiempo × tarifa × técnico).
- Descuento automático de stock al usar repuesto.
- Tiempos por técnico (reloj de trabajo).
- Garantía de reparación (plazo y condiciones).

#### 7.1.2 Seeds y demo vacía

- Auditoría: **0 NicheMovimiento**, productos genéricos `PRD001`/`SRV001`, solo “Consumidor Final”.
- **Fix aplicado (Fase 2 / refuerzo):**
  - Catálogo taller en seed: Aceite 5W40, Filtro, Pastillas, Service 10.000 km, Bujías (`TM-*`).
  - Clientes con vehículo + movimientos `NICHE_MOVIMIENTO_SEEDS` ligados a `clienteId`.
- **Re-validar** demo `taller_mecanico`: órdenes con nombre de cliente y catálogo no genérico.
- Sigue faltando dominio OT profundo (repuestos por línea, km, patente como entidad).

#### 7.1.3 WhatsApp “auto listo”

- El lema depende de plantilla + Twilio + acción de estado. Falta:
  - Botón “Marcar LISTO y notificar” atómico.
  - Log de notificación en la OT.
  - Demo sin Twilio que muestre “simulado enviado”.

#### 7.1.4 Turnos de recepción y playa

- Agenda de ingreso de vehículos / elevadores — no modelado como recurso de taller.
- Prioridad express vs normal.

#### 7.1.5 Facturación y cobro

- Presupuesto → OT → factura/recibo sin re-tipear.
- Separar cobro de repuestos (IVA) y mano de obra según fiscalidad — no hay wizard fiscal de taller.

#### 7.1.6 Seguros y terceros

- OT de terceros (aseguradora, gestoría) con número de siniestro — **no** implementado.

#### 7.1.7 Reportes del dueño del taller

- Trabajos abiertos > N días, rentabilidad por OT, técnicos productivos — solo genéricos del ERP si acaso.

#### 7.1.8 Taller textil vs taller mecánico

- Existe “talleres externos” en **industria textil** (`/dashboard/industria/talleres`) — **otro dominio**. No reutilizar como si fuera mecánica automotriz; falta aclaración en producto y menú.

---

## 8. Fumigadoras / control de plagas

**Madurez estimada: D (no hay vertical)**  
**Aproximación actual:** pack `servicios_pro` (agenda + presupuestos + cobranza) o abuso del motor de movimientos tipo taller.  

### 8.1 Faltantes técnicos (todo el vertical)

#### 8.1.1 No existe `industryId` / SKU de fumigación

- No hay template “fumigadora”, ni app `niche.fumigacion`, ni seeds, ni menú dedicado.
- Faltante de producto: definir pack comercial + enganche + golden path.

#### 8.1.2 Órdenes de servicio de plagas

- OT de visita con:
  - Cliente + **sitio** (sucursal del cliente, dirección, contacto en obra).
  - Tipo de plaga / servicio (roedores, cucarachas, desinfección, sanitización).
  - Productos químicos usados (lote, dilución, cantidad) — trazabilidad y seguridad.
  - Áreas tratadas y plano simple (opcional).
  - Certificado / constancia de servicio (PDF) con firma del cliente.
  - Próxima visita sugerida (contrato mensual/trimestral).

#### 8.1.3 Contratos y abonos

- Contrato de mantenimiento con frecuencia (mensual) y generación automática de visitas en agenda.
- Facturación recurrente del abono + visitas extras.
- Hoy hay piezas de facturación recurrente en el ERP, **no** ligadas a un dominio fumigación.

#### 8.1.4 Cuadrillas y técnicos de campo

- Asignación de técnico/cuadrilla a la OT.
- App de campo: “llegué / traté / firmó el cliente / fotos”.
- Ruta del día (orden de visitas) — no hay optimización de ruta de fumigación (hay piezas de logística/remis distintas).

#### 8.1.5 Cumplimiento y seguridad

- Hojas de seguridad de productos (MSDS), vencimiento de habilitación municipal del aplicador.
- Registro de aplicación para auditorías (senasa/municipio según jurisdicción) — **no modelado**.

#### 8.1.6 Cobranza y presupuesto

- Presupuesto de tratamiento inicial vs plan de mantenimiento.
- Firma de conformidad y cobro en el momento (MP link / efectivo) desde la OT.

#### 8.1.7 Demo y comercialización

- Sin datos demo ni landing de rubro específica.
- Riesgo comercial: vender “ERP de fumigación” hoy sería **overpromise** sobre agenda+presupuestos.

---

## 9. Aire acondicionado / climatización / service field

**Madurez estimada: D (no hay vertical)**  
**Aproximación actual:** igual que servicios de campo — `servicios_pro` + posible reuso de labels de taller.  

### 9.1 Faltantes técnicos (todo el vertical)

#### 9.1.1 No existe producto “Claver Clima / Service AC”

- Sin `industryId`, sin SKU niche, sin golden path de equipos.

#### 9.1.2 Activos instalados en el cliente

- Inventario de **equipos del cliente** (marca, modelo, BTU, gas, ubicación, fecha instalación, garantía de fábrica).
- Historial de services por equipo (no solo por cliente).
- Alertas de service por horas de uso o por calendario (preventivo).

#### 9.1.3 Órdenes de service / instalación / garantía

- Tipos de OT: instalación, desinstalación, service preventivo, reparación, garantía.
- Checklist por tipo (presión, temperatura, amperaje, limpieza de filtros, prueba de fugas).
- Consumo de insumos (gas, caños, mensulas) con stock de la camioneta vs depósito.
- Foto antes/después y firma del cliente.

#### 9.1.4 Agenda de técnicos y zonas

- Calendario por técnico con skills (split, VRF, cámara fría).
- Zonas geográficas y tiempos de viaje.
- Reagenda y aviso al cliente (WA).

#### 9.1.5 Presupuestos y repuestos

- Presupuesto con mano de obra + repuestos; aceptación digital.
- Pedido de repuesto a proveedor si no hay stock; OT en espera de repuesto.

#### 9.1.6 Garantías y contratos de mantenimiento

- Plan “service 2 veces/año” con generación de OT futuras.
- Control de garantía de instalación propia vs garantía de fábrica.

#### 9.1.7 App de campo offline

- Crítico en edificios sin señal: captura de checklist offline y sync — no hay producto OT field offline unificado para clima.

#### 9.1.8 Demo

- Seeds: 3 clientes, 5 equipos, OT abiertas/cerradas, técnico del día.
- Tour: OT del día → checklist → firma → cobro → próxima visita.

---

## 10. Empresa de servicios genérica (`servicios_pro`)

**Madurez estimada: B−**  
**Template:** `servicios_pro`  
**Golden path:** `/dashboard/agenda`  
**Enganche:** `pool-servicios-pro`  

Este pack es el **contenedor** sobre el que se montarían fumigación y AC. Faltantes del pack genérico:

### 10.1 Agenda operativa

- Recursos múltiples (técnicos) con color y filtros.
- Estados de turno ligados a OT (no solo “turno de agenda”).
- Desplazamiento / tiempo de viaje no modelado.

### 10.2 Presupuestos

- Flujo calle → PDF/WhatsApp → aceptación → OT/venta (parcial vía presupuestos de ventas).
- Plantillas por tipo de servicio.

### 10.3 Cobranza

- CxC + recordatorios; falta “cobrar en la visita” como acción de la OT.
- Anticipos y saldos por trabajo.

### 10.4 Campo vs oficina

- Separación de UX: oficina ve dinero; técnico ve solo su día — roles y shell lite incompletos para service companies.

### 10.5 Demo

- Seeds de agenda + presupuestos + clientes B2B (empresas a visitar), no solo consumidor final.

---

## 11. Órdenes de servicio (concepto transversal OT)

Aplicable a taller, fumigación, AC, electricistas, gasistas, etc.

### 11.1 Qué hay hoy

- Motor `NicheMovimiento` + estados por app (`niche-labels`).
- UI genérica bajo `/dashboard/nicho/[appId]`.
- Plantillas WhatsApp por app.

### 11.2 Qué falta para un **Service Order Module** reutilizable

| Capacidad | Estado |
|-----------|--------|
| OT con número, cliente, sitio, asignado | Parcial / genérico |
| Ítems (MO + materiales) con stock | Falta o muy débil |
| Checklist configurable por tipo de servicio | Falta |
| Estados configurables + SLA (vencida) | Labels fijos; sin SLA |
| Fotos / adjuntos / firma | Falta o no unificado |
| Notificación al cliente por transición | Plantilla; no pipeline robusto |
| Conversión presupuesto → OT → factura | No wizard cerrado |
| App campo + offline | Falta unificado |
| Contratos que generan OT | Falta |
| Reportes por técnico / tipo / zona | Falta |
| API pública / portal del cliente “estado de mi OT” | Falta |

**Conclusión:** sin este módulo, **taller, fumigación y AC no pueden llegar al 100%** sin reimplementar tres veces lo mismo.

---

## 12. Demos, seeds y sensor comercial

### 12.1 Matriz de demos (hallazgos de auditoría)

| industryId | Demo comercial OK | Problema principal |
|------------|-------------------|--------------------|
| `almacen` | No del todo | Fiado/API, seeds duplicados |
| `gimnasio` | Mejor de la matriz | Planes espurios, doble golden path |
| `veterinaria` | No | Pacientes/consultas en 0; wow incumplido |
| `taller_mecanico` | No | 0 órdenes, catálogo genérico |
| `club_barrio` | Sí (Fase 3) | Re-validar: socios + morosos + cantina |
| `carniceria` | No | Balanza 403, seeds kiosco, rate limit |

### 12.2 Faltantes del sistema de demos

- Validador post-provision por rubro (ya hay base `demo-health`; hay que ampliar asserts por nicho).
- Seeds obligatorios para **cada** `featured` pack.
- Demos pre-warmed en prod para no tardar 40s ni saturar DB en cada click.
- Rate limit amigable a marketing (o demos compartidas read-only por rubro + clone).

### 12.3 UX del sensor `/demo`

- Deep links que re-provisionan al refrescar (mitigado en parte con dedup; falta demos estables “siempre vivas”).
- Mensajes de error accionables (DB, timeout Vercel 10s en Hobby, 429).

---

## 13. Billing, MP, partners (impacto en “vender el nicho”)

No es un nicho, pero si el cobro del software falla, el vertical no se monetiza.

### 13.1 Faltantes / riesgos

- En dev, checkout marketplace puede quedar en **mock** (`paid` sin cobro real) si no se configura MP.
- Webhook MP y `MP_WEBHOOK_SECRET` deben estar en **Vercel Environment**, no solo en `.env` local.
- Crédito partner y liquidación cash existen; **payout automático a CBU** no.
- Packs de nicho con precio 0 en trial vs paid: vigencia y dunning deben probarse por SKU niche (no solo `core.claver`).

### 13.2 Entitlements por API

- Rutas de nicho deben rechazar con mensaje claro si el SKU no está activo (hoy a veces 403 genérico o UI vacía).

---

## 14. Servicios que podrían controlarse y no te das cuenta

Esta sección es deliberadamente amplia: cosas que **el negocio ya sufre en Excel/WhatsApp/cuaderno** y que Claver puede (o podría) absorber, aunque no estén en el pitch de “kiosco / gym / vet”.  
Muchas se resuelven reutilizando **motores ya existentes** (OT, cuotas, agenda, fiado, CxC, contratos, stock, caja) con **pack + labels + seeds**, no siempre con un ERP nuevo.

**Cómo leer cada fila**

| Columna | Significado |
|---------|-------------|
| **Dolor típico** | Qué se controla hoy a mano |
| **Motor Claver más cercano** | Qué hay o se reusa |
| **Gap** | Qué falta para venderlo en serio |
| **Monetizable** | Potencial de pack / add-on |

---

### 14.1 Operaciones internas de *cualquier* comercio (ciegos del día a día)

Estos no son “un rubro”: son **servicios de control** que casi todos tus clientes necesitan y casi nadie pide con ese nombre.

#### 14.1.1 Llaves, vales y “plata que sale sin factura”

| | |
|--|--|
| **Dolor** | Adelantos a empleados, vales de mercadería, cajas chicas, “me llevo $5.000 de la caja” |
| **Motor cercano** | Caja, vales, RRHH parcial, CxP |
| **Gap** | Flujo unificado “salida de caja justificada” con aprobación, tope por rol y conciliación al arqueo; reporte de desvíos |
| **Monetizable** | Alto en retail y talleres (pérdida silenciosa) |

#### 14.1.2 Turnos de personal y presentismo simple

| | |
|--|--|
| **Dolor** | Quién abre el local, francos, horas extra en un pizarrón |
| **Motor cercano** | RRHH/empleados (parcial), agenda |
| **Gap** | Turnero de personal no-clínico (apertura/cierre), fichada simple por app, costo hora vs ventas del turno |
| **Monetizable** | Medio-alto; upsell a quien ya tiene POS |

#### 14.1.3 Mantenimiento de *sus propios* activos

| | |
|--|--|
| **Dolor** | Heladera, balanza, impresora fiscal, auto de reparto, aire del local: service vencido y se rompe en temporada |
| **Motor cercano** | OT field / mantenimiento (parcial en catálogo), no pack “activos del comercio” |
| **Gap** | Inventario de activos del tenant + calendario de service + proveedor asociado + costo |
| **Monetizable** | Medio; se vende como “no te quedes sin caja en el finde” |

#### 14.1.4 Contratos y vencimientos del negocio

| | |
|--|--|
| **Dolor** | Alquiler del local, monotributo, seguro, dominio, hosting, licencia municipal, abl, expensas del local |
| **Motor cercano** | Agenda, CxP, nicho garantía/inmo (otro ángulo) |
| **Gap** | “Calendario de obligaciones del negocio” con alertas 15/30 días y monto estimado |
| **Monetizable** | Alto como feature sticky (el ERP se vuelve el cerebro administrativo) |

#### 14.1.5 Proveedores críticos y reposición “sin stockout”

| | |
|--|--|
| **Dolor** | “Se me cortó la Coca / el cemento / la vacuna” y no hay lead time |
| **Motor cercano** | Compras, stock, reponedor JIT / IA (parcial) |
| **Gap** | Lead time por proveedor, stock mínimo por sucursal, pedido sugerido 1-click, backorder al cliente |
| **Monetizable** | Alto en ferretería, farmacia, kiosco, vet |

#### 14.1.6 Devoluciones, garantías y cambios

| | |
|--|--|
| **Dolor** | Cambios de mercadería, garantías de 7/30 días, nota de crédito informal |
| **Motor cercano** | NC/ND, ventas, stock |
| **Gap** | Wizard “devolución en mostrador” con motivo, restock o scrap, y política por rubro |
| **Monetizable** | Medio; reduce fricción y reclamos |

#### 14.1.7 Mermas, robos y diferencias de inventario

| | |
|--|--|
| **Dolor** | Faltante de caja + faltante de góndola sin causa |
| **Motor cercano** | Stock, arqueo, calidad (parcial) |
| **Gap** | Motivos de ajuste estandarizados, foto, responsable, ranking de mermas por SKU/turno |
| **Monetizable** | Alto en retail (argumento de ROI) |

#### 14.1.8 Pedidos por WhatsApp sin perder el hilo

| | |
|--|--|
| **Dolor** | 40 chats, precios distintos, sin stock reservado |
| **Motor cercano** | Ventas, presupuestos, ecommerce, com.whatsapp |
| **Gap** | Bandeja unificada “pedido entrante → reserva stock → cobro → entrega” (inbox comercial) |
| **Monetizable** | Muy alto en 2026 (todos venden por WA) |

#### 14.1.9 Delivery propio vs apps (Rappi/PedidosYa)

| | |
|--|--|
| **Dolor** | Comisión de apps + delivery propio sin costo real por pedido |
| **Motor cercano** | Delivery barrio, logística, POS |
| **Gap** | Canal de origen del pedido, costo de envío, zona, propina, cierre por repartidor ya unificado con margen real |
| **Monetizable** | Alto en gastro, farmacia, pet shop |

#### 14.1.10 Precios, listas y “el descuento del dueño”

| | |
|--|--|
| **Dolor** | Precio distinto en góndola, lista mayorista y “precio amigo” |
| **Motor cercano** | Listas de precio, POS margen guard |
| **Gap** | Auditoría de descuentos por usuario, piso de margen hard-stop, vigencia de promo |
| **Monetizable** | Medio-alto (intang.guardian / margen) |

#### 14.1.11 Cierres impositivos “para el contador”

| | |
|--|--|
| **Dolor** | Cada mes el contador pide Excel distinto |
| **Motor cercano** | Impuestos, pack contador, export, multi-empresa contador |
| **Gap** | Paquete mensual automático (IVA, IIBB, libro IVA, CSV) + portal del contador por cliente |
| **Monetizable** | Muy alto (B2B2B con estudios contables y partners) |

#### 14.1.12 Sucursales y “la otra caja”

| | |
|--|--|
| **Dolor** | Dos locales, un Excel, stock que “se presta” |
| **Motor cercano** | Sucursales, stock, caja |
| **Gap** | Transferencias entre sucursales con recepción, KPIs por local, precios por sucursal |
| **Monetizable** | Alto cuando el cliente crece (expansión natural del ticket) |

#### 14.1.13 Cuentas a cobrar / pagar más allá del fiado

| | |
|--|--|
| **Dolor** | Cheques, e-cheq, promesas, proveedores a 30 días |
| **Motor cercano** | CxC, CxP, cheques, banco |
| **Gap** | Flujo simple “calle” para no-contadores; promesa de pago + recordatorio; conciliación bancaria liviana |
| **Monetizable** | Alto en B2B (ferretería, distribuidora, servicios) |

#### 14.1.14 Documentación y compliance operativo

| | |
|--|--|
| **Dolor** | Habilitaciones, seguros de empleados, ART, extintores, matafuegos vencidos |
| **Motor cercano** | Casi nada unificado |
| **Gap** | Checklist de habilitación del local + vencimientos + adjuntos |
| **Monetizable** | Medio; se vende a cadenas chicas y a contadores/implementadores |

#### 14.1.15 Backup mental: “quién sabe la clave del WiFi / AFIP / MP”

| | |
|--|--|
| **Dolor** | Credenciales en un papel o en la cabeza del dueño |
| **Motor cercano** | Integraciones cifradas (parcial) |
| **Gap** | Bóveda de secretos del tenant (solo admin) + rotación recordatorio |
| **Monetizable** | Bajo-medio; reduce churn por “se me bloqueó AFIP” |

---

### 14.2 Verticales de calle / barrio fáciles de olvidar

Muchos ya tienen **template o niche app**; otros no. Todos se controlan mal en cuaderno.

#### 14.2.1 Tintorería / lavadero de ropa (`tintoreria` / plancha)

| | |
|--|--|
| **Dolor** | Ticket de prenda, fecha de entrega, “¿está listo?” |
| **Motor** | Nicho plancha/movimientos |
| **Gap** | Seed demo, estados robustos, foto de prenda, ticket con código, WA al listo, cobro al retirar |
| **Nota** | Ya está en catálogo; falta **cerrar el loop** como producto vendible |

#### 14.2.2 Lavadero de autos / detailing

| | |
|--|--|
| **Dolor** | Turnos, servicios (lavado/premium), cola de autos, propinas |
| **Motor** | Agenda + OT liviana + caja |
| **Gap** | Vertical o pack: patente en agenda, paquete de servicios, foto “antes/después”, upsell ceras |
| **Estado** | Mencionable en onboarding IA; **sin pack maduro** |

#### 14.2.3 Estación de servicio / playa (`estacion_servicio`)

| | |
|--|--|
| **Dolor** | Turnos de playero, stock de lubricantes, shop 24hs, control de surtidores (fuera de alcance total) |
| **Motor** | Retail + caja |
| **Gap** | No pretender telemetría de surtidor sin hardware; sí shop + fiado flota + turnos de personal |
| **Estado** | Template existe; profundidad **baja** |

#### 14.2.4 Panadería / rotisería (`panaderia`)

| | |
|--|--|
| **Dolor** | Producción de madrugada, merma de pan del día, encargos de tortas |
| **Motor** | POS + producción/MRP liviano + encargos (agenda/presupuestos) |
| **Gap** | Recetas de producción, merma del día, encargos con seña y fecha de retiro |
| **Estado** | Template retail; **sin motor panadero** |

#### 14.2.5 Carnicería / fiambrería (`carniceria`)

| | |
|--|--|
| **Dolor** | Kg, merma, balanza, media res, fiambre al corte |
| **Motor** | POS + balanza (parcial, entitlement roto en audit) |
| **Gap** | Unidad kg end-to-end, merma de desposte, trazabilidad de media res, seeds correctos |
| **Estado** | No 100%; ver auditoría |

#### 14.2.6 Farmacia (`farmacia`)

| | |
|--|--|
| **Dolor** | Lotes, vencimientos, obras sociales, psicotrópicos |
| **Motor** | Retail + stock |
| **Gap** | Trazabilidad de lote, alerta vencimiento fuerte, receta (no full), integración OS — **no full farma** |
| **Riesgo** | Overpromise regulatorio |

#### 14.2.7 Pet shop (sin clínica)

| | |
|--|--|
| **Dolor** | Stock de alimento, recarga, clientes con mascotas sin HC completa |
| **Motor** | Retail + clientes; vet es otro pack |
| **Gap** | Pack “pet shop” (sin cirugía): stock + recordatorio de alimento + cross-sell a vet |
| **Estado** | Aparece en prompts de rubros; **pack débil** |

#### 14.2.8 Óptica

| | |
|--|--|
| **Dolor** | Graduaciones, encargos a laboratorio, armazones en stock, seña |
| **Motor** | Agenda + presupuestos + stock |
| **Gap** | Ficha de graduación, estado de encargo lab, taller interno de ajuste |
| **Estado** | Rubro en listas IA; **sin vertical** |

#### 14.2.9 Odontología / dental

| | |
|--|--|
| **Dolor** | Odontograma, planes de tratamiento, cuotas de tratamiento, obras sociales |
| **Motor** | Agenda + HC + CxC |
| **Gap** | Odontograma, plan multi-sesión, laboratorio dental externo |
| **Estado** | No vertical dental |

#### 14.2.10 Peluquería / barbería / uñas (`salon_belleza`, `peluqueria_barrio`)

| | |
|--|--|
| **Dolor** | Agenda por sillón, comisión por profesional, productos de reventa |
| **Motor** | Agenda + comisiones + POS |
| **Gap** | Multi-recurso (sillones), % comisión por servicio/producto, propina, ficha de cliente (color, preferencias) |
| **Estado** | Pack parcial; no “salon software” full |

#### 14.2.11 Tattoo / estética invasiva

| | |
|--|--|
| **Dolor** | Consentimientos, fotos, sesiones, seña, aftercare |
| **Motor** | Agenda + adjuntos + presupuestos |
| **Gap** | Consentimiento firmado, ficha de sesión, depósito no reembolsable |
| **Estado** | Solo mención en taxonomía de rubros |

#### 14.2.12 Gimnasio “escondido”: nutricionista / personal trainer freelance

| | |
|--|--|
| **Dolor** | Turnos 1:1, packs de sesiones, morosos |
| **Motor** | Agenda + cuotas/membresías + presupuestos monotributo |
| **Gap** | Pack “sesiones” (10 clases) con consumo; no solo membresía mensual de gym |
| **Estado** | Cubrible con monotributo + agenda; **no empaquetado** |

#### 14.2.13 Canchas / complejos (`cancha_barrio`)

| | |
|--|--|
| **Dolor** | Reservas, seña, luz, torneos, cantina |
| **Motor** | Agenda + seña + POS cantina |
| **Gap** | Grilla horaria por cancha, torneo (fixture liviano), combo “cancha + buffet” |
| **Estado** | Niche app; seeds/profundidad a validar |

#### 14.2.14 Colonia de verano / after school (`colonia_verano`)

| | |
|--|--|
| **Dolor** | Inscripciones, cuotas, autorizaciones, lista de asistencia |
| **Motor** | Cuotas + clientes |
| **Gap** | Autorización de retiro de menor, alergias, lista diaria, hermanos |
| **Estado** | App nicho; no “gestión de colonia” completa |

#### 14.2.15 Escuela de oficios / instituto / academia (`escuela_barrio`)

| | |
|--|--|
| **Dolor** | Cuotas, materias, asistencia, certificados |
| **Motor** | Cuotas |
| **Gap** | Cursos, cohortes, certificado PDF, asistencia por clase |
| **Estado** | Solo cuotas de “alumno” genérico |

#### 14.2.16 Club de barrio / peña (`club_barrio`, `pena_folklore`)

| | |
|--|--|
| **Dolor** | Socios, cuotas, morosos, eventos |
| **Motor** | Cuotas / nicho |
| **Gap** | Seeds (auditoría: club vacío), padrones, cuota social vs consumo de cantina |
| **Estado** | Fase 3: seed con socios/morosos/cantina; validar demo en vivo |

#### 14.2.17 Consorcios / expensas (`consorcios_admin`)

| | |
|--|--|
| **Dolor** | Liquidación, UF, morosos, proveedores del edificio |
| **Motor** | Engine consorcio (de los más específicos) |
| **Gap** | Madurez de liquidación, PDF, prorrateo, portal de consorcista, morosos WA |
| **Estado** | Mejor que un “movimiento genérico”; sigue sin ser 100% admin de consorcios |

#### 14.2.18 Inmobiliaria / garantías (`inmobiliaria`, `inmo_garantia`)

| | |
|--|--|
| **Dolor** | Contratos, vencimientos, comisiones, inspecciones |
| **Motor** | Nicho garantía / inmo |
| **Gap** | Inventario de propiedades, estados (disponible/alquilado), comisiones a corredores, acta de entrega |
| **Estado** | Parcial (INMO en roadmap comercial) |

#### 14.2.19 Prestamista / créditos de barrio (`prestamista`)

| | |
|--|--|
| **Dolor** | Cuotas, interés, mora, pagaré |
| **Motor** | Fiado/libreta + páginas préstamos |
| **Gap** | Amortización clara, refinanciación, garantes, riesgo legal de promesa de “fintech” |
| **Riesgo** | Compliance; no vender como banco |

#### 14.2.20 Feria / puesto (`feria_puesto`)

| | |
|--|--|
| **Dolor** | Cierre del día, cuota de feria, mercadería |
| **Motor** | Movimientos feria |
| **Gap** | Multi-día de feria, varios puestos, liquidación al organizador |
| **Estado** | Niche liviano |

#### 14.2.21 Remis / delivery / base (`base_remis`, `delivery_barrio`)

| | |
|--|--|
| **Dolor** | Cierre por chofer/repartidor, % de la base, propinas |
| **Motor** | Movimientos + logística parcial |
| **Gap** | Liquidación semanal al chofer, deuda de la base, viajes no cerrados |
| **Estado** | Shell demoable |

#### 14.2.22 Obras / changas / contratista (`obra_changas`, `contratista_obra`)

| | |
|--|--|
| **Dolor** | Jornales, adelantos, material de obra, hitos de cobro al cliente |
| **Motor** | Nicho obras + CxC |
| **Gap** | Parte diario, foto de avance, certificado de obra, retención de garantía |
| **Estado** | Mejor que cero; no es software de construcción full |

#### 14.2.23 Acopio de granos / agro (`agro_acopio`, `acopio_grano`)

| | |
|--|--|
| **Dolor** | Kg, humedad, liquidaciones al productor |
| **Motor** | Nicho acopio + agro IoT (otro track) |
| **Gap** | Ticket de balanza de camión, liquidación con descuentos de humedad, stock de silo |
| **Estado** | Especializado y incompleto vs Clavergrow |

#### 14.2.24 Distribuidora / preventa (`distribuidora`)

| | |
|--|--|
| **Dolor** | Ruta de vendedor, preventa, reparto, cuentas corrientes |
| **Motor** | Vendedor en ruta, pedidos, stock, CxC |
| **Gap** | Preventa offline sólida, carga de camión, devoluciones de ruta, objetivos por vendedor |
| **Estado** | Piezas existen; **pack distribuidora** no cerrado al 100% |

#### 14.2.25 Concesionaria (`concesionaria`)

| | |
|--|--|
| **Dolor** | Stock de usados, leads, comisiones de vendedores, gestoría |
| **Motor** | Template + dashboard concesionaria (si existe ruta) |
| **Gap** | Ficha de unidad (dominio, km, costos de reacondicionamiento), embudo de leads, reserva con seña |
| **Estado** | Más marketing que vertical cerrado |

#### 14.2.26 Química / planta / industria (`quimica`, industria, MRP)

| | |
|--|--|
| **Dolor** | Fórmulas, lotes, trazabilidad |
| **Motor** | Industria / MRP |
| **Gap** | No mezclar promesa de planta química con POS de barrio; validar cada flujo |
| **Estado** | ERP “pesado”; no es el mismo go-to-market que fiado |

#### 14.2.27 Bar / restaurante / dark kitchen (`bar_restaurant`)

| | |
|--|--|
| **Dolor** | Mesas, comandas, cocina (KDS), propinas, delivery |
| **Motor** | Hospitalidad / mesas / cocina (existe en arquitectura) |
| **Gap** | Estabilidad KDS, impresión de comanda, split de cuenta, propina, menú QR público |
| **Estado** | Módulo grande; no listar como “100%” sin QA de servicio real |

#### 14.2.28 Eventos / salón (`salon_eventos`)

| | |
|--|--|
| **Dolor** | Fecha del evento, seña, saldo, catering |
| **Motor** | Nicho salon / movimientos |
| **Gap** | Calendario de ocupación del salón (no doble booking), extras, contrato PDF |
| **Estado** | Niche |

#### 14.2.29 Cooperativa / mutual (`cooperativa_cuotas`)

| | |
|--|--|
| **Dolor** | Aportes, asambleas, padrones |
| **Motor** | Cuotas mutuo |
| **Gap** | Padrón social, estados de socio, convocatoria |
| **Estado** | Liviano |

---

### 14.3 Oficios y service field que “no se te ocurren” (todos viven de OT + agenda)

Cualquiera de estos se modela como **Órdenes de servicio + agenda + presupuesto + cobro + (opcional) contrato**. Hoy casi todos caen en el hueco de la sección 11.

| Oficio / servicio | Qué hay que controlar (y se olvida) | Prioridad de pack |
|-------------------|-------------------------------------|-------------------|
| **Electricista** | Tableros, planos simples, materiales, certificado de instalación, garantía | Alta |
| **Gasista** | Habilitación matriculada, artefactos, prueba de hermeticidad, vencimientos | Alta (compliance) |
| **Plomería / desagües** | Urgencias 24hs, repuestos, foto de caño, garantía de pérdida | Alta |
| **Cerrajero** | Urgencias, stock de blank keys, servicios a domicilio | Media |
| **Herrería / rejas** | Medición → presupuesto → fabricación → instalación (2 visitas) | Media |
| **Durlock / pintura** | M², manos de pintura, material, avance por ambiente | Media |
| **Jardinería / paisajismo** | Rutas semanales de mantenimiento, insumos, estacionalidad | Alta (ruta recurrente) |
| **Piletero / pileta** | Ruta semanal, químicos, lecturas de pH/cloro, contrato mens | Alta |
| **Limpieza de oficinas / hogares** | Cuadrillas, checklist por cliente, insumos, frecuencia | Alta |
| **Seguridad / vigilancia** | Novedades por puesto, ronda, bitácora (no es un POS) | Media (sensible) |
| **Mudanzas** | Inventario de bultos, seguro, peones, camión, km | Media |
| **Fletes / utilitarios** | Viajes, km, peajes, combustible vs cobro | Media |
| **Techista / impermeabilización** | Estacionalidad, garantía por m², fotos | Media |
| **Vidriería** | Medidas, pedido a fábrica, instalación | Media |
| **Cortinas / toldos** | Medición, fabricación, instalación | Media |
| **Pisos / colocadores** | Material del cliente vs propio, m², merma | Media |
| **Refrigeración comercial** (heladeras expositoras) | Igual que AC + cold chain | Alta (junto a clima) |
| **Ascensores / mat. complementario** | Contratos de mantenimiento, visitas obligatorias | Media-alta |
| **Extintores / seguridad e higiene** | Vencimientos de matafuegos, recargas, certificados | Alta (calendario + OT) |
| **Control de plagas** | Ver §8 | Alta |
| **Clima / AC** | Ver §9 | Alta |
| **Paneles solares** | Instalación + monitoreo (IoT futuro) | Baja-media hoy |
| **CCTV / alarmas** | Instalación, abono de monitoreo (solo abono en Claver) | Media |
| **Redes / cableado estructurado / WiFi** | OT + materiales + documentación de red | Media |
| **Servicio técnico de celulares/PC** | Igual que taller pero con IMEI/serie y contraseñas | Alta (barrio) |
| **Reparación de electrodomésticos** | Domicilio + taller, repuestos | Alta |
| **Motos / bicicletería** | Taller chico + stock de repuestos + patentes/series | Alta |
| **Gomería** | Cubiertas, alineación, stock por medida | Media-alta |
| **Chapista / pintura automotriz** | OT largas, seguros, fotos de daño | Media |
| **Taller naval / lanchas** (zonas) | Estacional | Baja |
| **Maquinaria agrícola service** | Campo + horómetro | Media (agro) |
| **Calderas / calefacción central** | Contratos de edificios | Media con consorcios |

**Insight de producto:** un solo módulo **OT Field + Contratos + Rutas** desbloquea decenas de oficios sin 40 ERPs distintos.

---

### 14.4 Servicios B2B “entre empresas” (el cliente no es el consumidor final)

#### 14.4.1 Mantenimiento a flotas (empresas con 10+ vehículos)

| | |
|--|--|
| **Controlar** | Service por patente, km, taller propio o externo, costo por vehículo |
| **Gap** | Extensión del taller con “cliente empresa + N patentes” y alertas de service |

#### 14.4.2 Higiene y seguridad tercerizada

| | |
|--|--|
| **Controlar** | Visitas a plantas, no conformidades, plan de acción |
| **Gap** | OT + checklist + PDF de informe |

#### 14.4.3 Capacitación in-company

| | |
|--|--|
| **Controlar** | Cursos, asistencia, certificados, facturación al empleador |
| **Gap** | Extensión de escuela_barrio hacia B2B |

#### 14.4.4 Catering / viandas a empresas

| | |
|--|--|
| **Controlar** | Menú del día, dietas, cantidad por sede, facturación quincenal |
| **Gap** | Pedidos recurrentes + producción + reparto |

#### 14.4.5 Alquiler de maquinaria / andamios / baños químicos

| | |
|--|--|
| **Controlar** | Activo, cliente, período, depósito en garantía, daños al devolver |
| **Gap** | Módulo de **alquiler de activos** (calendario de disponibilidad) — no es venta POS clásica |

#### 14.4.6 Depósito fiscal / guardamuebles / self-storage chico

| | |
|--|--|
| **Controlar** | Box, m³, contrato, mora, acceso |
| **Gap** | Similar a alquiler de activos + CxC |

#### 14.4.7 Laboratorio de análisis (agua, suelos, clínicos chicos)

| | |
|--|--|
| **Controlar** | Muestra, cadena de custodia, resultado, informe |
| **Gap** | Fuera de core; solo si hay vertical salud/agro fuerte |

---

### 14.5 Servicios “de plataforma Claver” (controlan *tu* negocio, no el del kiosquero)

Cosas que vos como Grupo Claver debés controlar y a veces se diluyen:

| Servicio interno | Qué debería controlarse |
|------------------|-------------------------|
| **Onboarding de tenants** | Checklist go-live, AFIP, MP, usuarios, training |
| **Salud de demos por rubro** | Ver §12 + panel demo-health |
| **Trials que no convierten** | Dunning, motivo de churn, uso real del golden path |
| **Partners y comisiones** | Atribución, crédito, liquidación cash |
| **Impersonación y soporte** | Tickets, tiempo de resolución, CSAT |
| **Entitlements** | Quién tiene qué SKU y por qué lo perdió |
| **Costos de IA** | Tokens por tenant, abuso, cuota |
| **Abuse de demos** | Empresas huérfanas, rate limit, limpieza de QA demos |
| **Marketplace de apps** | Apps planned vs vendibles; no cobrar lo que no existe |
| **NPS / valor entregado** | Por rubro: ¿usó fiado? ¿hizo una OT? |

---

### 14.6 Servicios financieros y de cobro “escondidos”

| Servicio | Por qué importa | Gap |
|----------|-----------------|-----|
| **Link de pago (ClavPay / MP)** | Cobrar sin POS físico | Confiabilidad webhook + conciliación automática en caja |
| **QR en mostrador** | Kiosco/ferretería | Misma conciliación |
| **Suscripción del socio (gym)** | No solo suscripción Claver | Producto distinto (B2C del tenant) |
| **Cuotas de tratamiento (dental/vet)** | Planes de pago | Motor de plan de cuotas genérico |
| **Señas y reservas** | Canchas, salones, talleres | Estado de seña no reembolsable |
| **Recargo por mora / punitorios** | Fiado y cuotas | Reglas configurables por tenant |
| **Split de pago** efectivo + MP + CC | Realidad argentina | POS multi-medio ya parcial; reportes de mix |

---

### 14.7 Logística y “última milla” que no es un vertical de moda

| Servicio | Control | Gap |
|----------|---------|-----|
| **Reparto propio programado** | Hojas de ruta, orden de paradas | Existe logística; pack simple para pyme |
| **Picking en depósito chico** | Ola de pedidos | Módulo picking; UX pyme |
| **Devoluciones de ruta** | Mercadería que vuelve | Flujo stock + CxC |
| **Envases / retornables** | Cajones, garrafas, bidones | Envases en API; pack visible |
| **Control de chofer (combustible vs km)** | Costo real del flete | Casi no hay |

---

### 14.8 Datos, IA y “servicios invisibles” de decisión

| Servicio | Qué controla | Gap |
|----------|--------------|-----|
| **Qué reponer mañana** | Stockout | JIT/IA parcial; cerrar loop con OC |
| **A quién cobrar hoy** | Mora | Lista de morosos + WA masivo confiable |
| **Qué margen te comieron** | Descuentos | Guardian de margen en todos los POS |
| **Anomalías de caja** | Robo/error | Agente anomalías; alertas accionables |
| **Resumen diario al dueño** | WA/email 21:00 | “Cerrá el día” automático por rubro |
| **Asistente por rubro** | Preguntas del dueño | Prompts por rubro ya esbozados; calidad variable |

---

### 14.9 Matriz rápida: “¿esto se controla hoy?”

| Área de control | ¿Existe algo? | ¿Empaquetado para venderlo? | Notas |
|-----------------|---------------|-----------------------------|--------|
| Fiado / libreta | Sí | Sí (ancla) | Bugs P0 |
| POS / stock / caja | Sí | Sí | Core |
| Membresías / cuotas | Sí | Parcial | Gym mejor caso |
| Agenda / turnos | Sí | Parcial | Beauty, clínica |
| Historia clínica | Sí | Parcial | Vet/clínica |
| OT / field service | Genérico débil | **No** | Desbloquea oficios |
| Contratos de mantenimiento | Casi no | **No** | Fumigación, AC, pileta |
| Activos del cliente | Casi no | **No** | Clima, flotas |
| Activos del comercio | Casi no | **No** | Heladera, fiscal |
| Rutas recurrentes | Parcial logística | **No** como pack | Jardín, pileta, limpieza |
| Alquiler de equipos | No claro | **No** | Andamios, herramientas |
| Portal del cliente final | Parcial (algunos portales) | Poco | Socio gym, tutor vet, consorcista |
| Contador multi-empresa | Sí en evolución | Parcial | Partners |
| Inbox WhatsApp pedidos | Parcial | **No** | Killer feature |
| Calendario de vencimientos del negocio | No unificado | **No** | Sticky feature |
| Devoluciones/garantías mostrador | Parcial NC | **No** wizard | Retail |
| Access control (puerta gym) | No | **No** | Hardware |
| Telemetría surtidor / industrial | No / IoT agro aparte | No en calle | No prometer |

---

### 14.10 Cómo usar esta sección en producto

1. **No abrir 50 verticales.** Abrir **motores**: OT Field, Contratos, Rutas, Activos, Inbox WA, Vencimientos del negocio.  
2. Cada oficio de la tabla 14.3 = **skin + seeds + checklist + WA** sobre OT Field.  
3. Cada “ciego” de 14.1 = **feature del core** que sube retención de *todos* los tenants.  
4. Marketing: listar oficios solo cuando el motor + demo tengan datos (evitar el error del taller vacío).  
5. Partners implementadores: venden **go-live de oficio** (electricista, piletero) cobrando setup.

---

## 15. Priorización sugerida

Orden orientado a **monetización + promesa vendible**:

| Prioridad | Ítem | Por qué |
|-----------|--------|---------|
| **P0** | Fiado estable (provision + APIs) | Ancla de kiosco/almacén |
| **P0** | Multi-tenant HC (empresaId) | Riesgo de seguridad |
| **P0** | ~~Seeds vet + taller~~ (Gemini F2) · ~~club + gym morosos~~ (Fase 3) | Credibilidad del sensor |
| **P1** | Unificar gym (home + planes limpios) | Mejor vertical actual |
| **P1** | Módulo OT reutilizable (Service Orders) | Desbloquea taller + field service + decenas de oficios §14.3 |
| **P1** | Pack ferretería (unidades, presupuesto, CC obra) | Ticket promedio alto |
| **P1** | Inbox pedidos WhatsApp → stock/cobro | Dolor universal §14.1.8 |
| **P1** | Cierre del día al dueño (reporte automático) | Retención §14.8 |
| **P2** | Contratos + rutas recurrentes | Pileta, jardín, limpieza, fumigación, AC |
| **P2** | Activos del cliente + del comercio | Clima, flotas, heladeras |
| **P2** | Vertical fumigación / AC (sobre OT + contratos) | Nicho B2B |
| **P2** | Devoluciones/garantías mostrador | Retail |
| **P2** | Calendario de vencimientos del negocio | Sticky admin |
| **P2** | Clínica: OS/nomenclador o bajar promesa a “particular” | Evitar overpromise |
| **P3** | Access control gym, portal socio/tutor, telemedicina | Nice-to-have |
| **P3** | Alquiler de maquinaria / self-storage | Nicho |
| **P3** | Odontología / óptica vertical profundo | Nicho regulado |

---

## 16. Referencias de código y auditorías

| Área | Rutas / archivos clave |
|------|------------------------|
| Templates industria | `lib/comercial/industry-templates.ts` |
| Catálogo nicho | `lib/niche/niche-apps-catalog.ts`, `niche-labels.ts` |
| Seeds demo | `lib/comercial/industry-demo-seeds.ts` |
| Provision demo | `lib/comercial/industry-demo-service.ts`, `app/api/onboarding/industry-demo` |
| Fiado | `lib/fiado/*`, `app/api/fiado/*` |
| Membresías / gym | `app/dashboard/membresias`, APIs membresías |
| HC / vet | `app/dashboard/historia-clinica`, `lib/historia-clinica/*`, `lib/veterinaria/*` |
| Nicho UI | `app/dashboard/nicho/[appId]` |
| Auditoría demos | `docs/qa/industry-demo-audit.md` |
| QA Gemini funcional | `docs/qa/gemini-validacion-funcional.md` |
| Env Vercel | `docs/deploy/VERCEL_ENV.md` |
| Partner / billing | `docs/qa/partner-billing-monetizacion.md` |

---

## Cierre

**Ninguno de los nichos listados está al 100% de “todo lo que necesita el rubro”.**

- **Más cerca:** kiosco/almacén (core + fiado) y gimnasio (membresías).  
- **A medias:** ferretería (retail genérico), clínica y veterinaria (agenda/HC incompletas o seeds rotos).  
- **Liviano / genérico:** taller (movimientos, demo vacía).  
- **No existen como vertical:** fumigadoras y aire acondicionado / service field; requieren **módulo de órdenes de servicio + contratos + campo**, o se venden solo como “agenda + presupuestos + cobro” con honestidad comercial.

**Además (§14):** hay decenas de **servicios y oficios** (piletero, electricista, limpieza, jardinería, gomería, devoluciones, vencimientos del local, inbox WhatsApp, etc.) que el mercado paga por controlar y que **no aparecen** si solo pensás en “kiosco / gym / vet”. La estrategia correcta no es 50 ERPs, sino **pocos motores** (OT Field, Contratos, Rutas, Activos, Inbox WA, Vencimientos) con skins y demos.

Este documento debe usarse como **backlog de ingeniería, radar comercial y freno de marketing**: no prometer en landings lo que está en sección D o C sin seed, ni oficios de §14.3 sin motor OT.

---

*Última actualización: 2026-07-18 — relevamiento de código + `docs/qa/industry-demo-audit.md` + catálogos de nicho/industria + expansión §14 servicios ocultos / oficios / controles internos.*

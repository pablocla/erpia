# Otros Rubros — Guía de Parametrización

## Farmacia

### Módulos activos
ventas+POS, stock (vencimientos+lotes+controlados), clientes, facturacion-afip,
agenda (entregas programadas), reportes

### Maestros específicos pendientes
```
SCHEMA MIGRATION REQUERIDA:
model RecetaMedica {
  id          Int
  facturaId   Int?
  numero      String
  medico      String
  especialidad String?
  retenida    Boolean @default(false)
  fechaEmision DateTime
}

Campos a agregar en Producto:
  troqueado       Boolean @default(false)   // código ANMAT obligatorio
  codigoANMAT     String?                    // código de trazabilidad
  requiereReceta  Boolean @default(false)
  controlado      Boolean @default(false)   // psicotrópico/estupefaciente
  laboratorio     String?

FEATURES PENDIENTES:
- PAMI: integración web services PAMI para autorización en tiempo real
  → Endpoint: https://ws.pami.com.ar/wsdl/... (solicitar credenciales)
  → Flujo: buscar beneficiario por DNI → validar cobertura → aplicar descuento
- Obras sociales genéricas: tabla ObraSocial con descuento por práctica
- Troqueado: escaneo de código ANMAT al vender (trazabilidad RG ANMAT 4840)
- Libro de psico/estupefacientes: registro obligatorio con firma digital
```

---

## Ferretería / Pintorería

### Módulos activos
ventas+POS, stock, compras, clientes (cuenta corriente constructores), listas-precio, reportes

### Maestros específicos
```
Campos a agregar en Producto:
  formulaColorId  Int?      // para pintorería: mezcla de colores
  vendidoPorFraccion Boolean @default(false)

model FormulaColor {
  id         Int
  nombre     String   // "Rojo Ferrari", "Verde Selva"
  componentes Json    // [{ pigmentoId, proporcion }]
  empresaId  Int
}

FEATURES PENDIENTES:
- Calculadora de mezcla de color (input: color objetivo → output: componentes)
- Presupuesto por obra: listado de materiales con cómputo de cantidades
- Precios por categoría (tornillería, herramientas, pintura) con distintas listas
```

---

## Peluquería / Barbería / Spa

### Módulos activos
ventas+POS, agenda (turno por profesional), stock (productos), caja,
membresías (paquetes prepagos), comisiones (rrhh), clientes, facturacion-afip

### Maestros específicos
```
Usar modelo existente:
- Profesional → "peluquero / barbero"
- PlanMembresia → "10 cortes prepagos", "Pack mensual"
- Turno → agenda con profesional

FEATURES PENDIENTES:
- Comisión por servicio: % o monto fijo por tipo de prestación × profesional
  → Agregar campo PrestacionProfesional { profesionalId, prestacionId, comisionPct }
- Duración de servicio en agenda (para evitar solapamiento)
  → Agregar campo Turno.duracionMinutos Int
- Recordatorio 2h antes del turno por WhatsApp
```

---

## Carnicería / Fiambrería

### Módulos activos
ventas+POS, stock (lotes + peso variable), compras, caja, facturacion-afip

### Maestros específicos
```
Campos a agregar en Producto:
  esPesable      Boolean @default(false)  // precio por kg
  pesoPromedio   Float?                   // para estimación de stock
  loteRef        String?                  // media res / primal

model LoteCarnico {
  id          Int
  productoId  Int    // "Cuarto trasero" como producto base
  fechaFaena  DateTime @db.Date
  pesoBruto   Float
  pesoNeto    Float
  cortes      Json?  // [{ nombre: "Lomo", peso: 5.2 }, ...]
}

FEATURES PENDIENTES:
- Integración con balanza electrónica serial/USB (Epson TM, Mettler-Toledo)
  → Protocolo RS-232 o Ethernet → proxy local en Next.js
- BOM inverso: de media res → lista de cortes (cada corte como producto hijo)
```

---

## Agro / Acopio (específico Rosario — Bolsa de Comercio)

### Módulos activos
ventas, compras, stock (silos + calidad), clientes (productores),
facturacion-afip (liquidación rural), reportes, logistica

### Maestros específicos
```
SCHEMA MIGRATION REQUERIDA:

model Grano {
  id         Int
  nombre     String    // "Soja", "Maíz", "Trigo"
  unidad     String    // "tn"
  empresaId  Int
}

model TicketBalanza {
  id          Int
  fecha       DateTime
  granoId     Int
  proveedorId Int  // productor
  pesoBruto   Float
  tara        Float
  pesoNeto    Float
  humedad     Float?  // % medido al ingreso
  impureza    Float?
  observaciones String?
  empresaId   Int
}

model ContratoCereales {
  id           Int
  proveedorId  Int   // productor
  granoId      Int
  toneladas    Float
  precioPacto  Decimal?  // null = precio a fijar
  fechaEntrega DateTime  @db.Date
  estado       String    // "abierto" | "parcial" | "cerrado"
  liquidado    Boolean   @default(false)
  empresaId    Int
}

FEATURES PENDIENTES:
- Liquidación de granos: pago al productor descontando retenciones AFIP rurales
  (Resolución 2300/07 — retención Ganancias agropecuaria)
- Portal del productor: igual que portal B2B pero muestra contratos + saldos + liquidaciones
- Integración con Bolsa de Comercio de Rosario para precios de pizarra
  → URL pública BCR: https://www.bcr.com.ar/Pages/Granos/cierresgranos.aspx
```

---

## Gimnasio / Fitness / CrossFit

### Módulos activos
ventas, caja, membresías, agenda (clases), clientes, stock (suplementos), facturacion-afip

### Maestros específicos
```
Usar modelos existentes:
- PlanMembresia → tipos de membresía con precio mensual/trimestral
- Membresia → instancia por socio con fechaFin y estado
- Turno → clase grupal (con límite de capacidad)

FEATURES PENDIENTES:
- Cobro recurrente automático (cron job + Mercado Pago Subscripciones)
  → API: https://api.mercadopago.com/preapproval
- Control de acceso: QR en membresía → app de torniquete valida
  → Generar JWT firmado con fechaFin → QR en pantalla del socio
- Estado por mora: vencida + X días → suspendida automáticamente
- Portal del socio: igual que portal B2B pero para ver membresía + clases
```

---

## Tabla rápida de decisiones: ¿qué activar en onboarding?

| Rubro | Hospitalidad | Veterinaria | Agenda | HC | Portal B2B | Vendedor | Picking | IoT |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| bar_restaurant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚪ |
| veterinaria | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚪ |
| clinica | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚪ |
| farmacia | ❌ | ❌ | ⚪ | ❌ | ❌ | ❌ | ✅ | ❌ |
| distribuidora | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| supermercado | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| gimnasio | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| salon_belleza | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ferreteria | ❌ | ❌ | ❌ | ❌ | ⚪ | ❌ | ✅ | ❌ |

✅ = activar por defecto | ⚪ = preguntar en wizard | ❌ = no mostrar

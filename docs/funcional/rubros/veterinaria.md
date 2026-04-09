# Rubro: Veterinaria

## Módulos activos

```
ventas (POS + facturación), stock (medicamentos + vencimientos),
clientes (propietarios), veterinaria (pacientes + HC), agenda,
historia-clinica, caja, facturacion-afip, reportes
```

## Flujos end-to-end

### 1. Turno y consulta
```
✅ Propietario (cliente) registrado en /dashboard/clientes
✅ Mascota registrada en /dashboard/veterinaria
✅ Agenda de turno en /dashboard/agenda
✅ Apertura de consulta en /dashboard/veterinaria → botón "Nueva Consulta"
✅ Registro: motivo, diagnóstico, tratamiento, peso, temperatura, próxima visita
⏳ FALTA: facturación automática al cerrar consulta (vincular consulta → factura)
⏳ FALTA: prescripción digital con medicamento → descuenta stock
⏳ FALTA: recordatorio WhatsApp 24h antes del turno
```

### 2. Plan sanitario (vacunas / desparasitación)
```
⏳ TODO: modelo PlanSanitario (ver IMPLEMENTACION_COMPLETA.md)
Página a crear: /dashboard/veterinaria/plan-sanitario
Flujo:
  - Registrar vacuna aplicada con lote y fecha
  - Calcular próxima fecha según tipo de vacuna (configurable)
  - Cron job diario: vacunas que vencen en los próximos 30 días → cola notificaciones
  - Notificación al propietario por WhatsApp/email
```

### 3. Venta de productos en mostrador
```
✅ Via /dashboard/ventas (POS normal)
✅ Cliente = propietario, productos = alimento/accesorio/medicamento
⏳ FALTA: fidelización por puntos (modelo existente en schema parcial)
⏳ FALTA: historia de compras ligada al paciente (no solo al propietario)
```

## Maestros específicos

| Maestro | Estado | Modelo en Schema |
|---------|--------|-----------------|
| Paciente (mascota) | ✅ | `Paciente` |
| Consulta / HC | ✅ | `Consulta` |
| Propietario | ✅ | `Cliente` |
| Profesional (veterinario) | ✅ | `Profesional` |
| Plan sanitario | ⏳ | TODO: `PlanSanitario` |
| Internación | ⏳ | TODO: `Internacion` |
| Receta digital | ⏳ | TODO: `Receta` |

## Schema pendiente (agregar en próxima migración)

```prisma
model PlanSanitario {
  id            Int       @id @default(autoincrement())
  pacienteId    Int
  paciente      Paciente  @relation(fields: [pacienteId], references: [id])
  tipo          String    // "vacuna" | "desparasitacion" | "revision"
  nombre        String    // "Antirrábica", "Quíntuple", "Desparasitación interna"
  fechaAplicada DateTime  @db.Date
  lote          String?
  laboratorio   String?
  proximaFecha  DateTime? @db.Date
  notificado    Boolean   @default(false)
  observaciones String?   @db.Text
  createdAt     DateTime  @default(now())
  @@index([pacienteId])
  @@index([proximaFecha])
  @@map("planes_sanitarios")
}

model Internacion {
  id            Int       @id @default(autoincrement())
  pacienteId    Int
  paciente      Paciente  @relation(fields: [pacienteId], references: [id])
  fechaIngreso  DateTime
  fechaAlta     DateTime?
  motivo        String
  estado        String    @default("internado")  // "internado" | "de_alta"
  evolucion     Json?     // [{ fecha, descripcion, temperatura, peso }]
  observaciones String?   @db.Text
  createdAt     DateTime  @default(now())
  @@map("internaciones")
}
```

## Consideraciones

- Medicamentos controlados (psicotrópicos): agregar flag `controlado Boolean` en Producto
- Temperatura de almacenamiento: usar campo `requiereFrio Boolean` en Producto + alerta IoT
- Foto de mascota: requiere Supabase Storage (campo `fotoUrl String?` en Paciente)
- Condición AFIP: la mayoría son monotributistas, algunos RI

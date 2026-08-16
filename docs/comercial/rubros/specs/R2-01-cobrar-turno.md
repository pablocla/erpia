# SPEC R2-01 — Consultorio/Clínica: Cobrar Turno desde Agenda

## Dolor del cliente (1 párrafo es-AR)
El médico o secretario de un consultorio da turnos en una agenda de papel o en Google Calendar, pero después anota en un cuadernito quién pagó, cuánto pagó de diferencia y con qué medio. Al final del día la caja nunca cuadra. Pierden tiempo porque los sistemas de agenda no cobran y los sistemas de cobro no tienen agenda visual. Quieren entrar a la vista de calendario, ver el turno que acaba de terminar y con un solo botón registrar que le cobraron la consulta particular.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-AGENDA` vinculado a `M-POS/M-CXC`.
- **Qué reutilizar:** El calendario/agenda actual y el componente `<CobrarDialog>` de caja.
- **Qué NO construir:** No construir conexión con obras sociales (validación de credenciales, tokens en vivo de PAMI/OSDE), ni nomenclador nacional de prácticas médicas. Es un consultorio particular (o paga particular la diferencia).

## Happy path 90 segundos
1. La secretaria ve el calendario. El turno de las 10:00 (Dr. García - Paciente Juan) aparece como `Atendido`.
2. Hace click en el turno. En vez de solo ver los datos, ahora hay un botón primario gigante: **"Cobrar Turno"**.
3. Se abre el `<CobrarDialog>`. El sistema sugiere el valor del servicio ($15.000). 
4. La secretaria elige "MercadoPago (Transferencia)".
5. Confirma. El turno cambia a color `Verde/Pagado` en el calendario, el ingreso impacta en la caja del día automáticamente y le puede mandar el recibo por WhatsApp.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Cobrar Turno** | Abre modal de cobro atado al turno. | Atendido/Completado 🟡 | M-CXC |
| **WA Recordatorio** | Avisa al paciente el día anterior. | Turno Pendiente 🔵 | Base WA |

## Copy es-AR (empty, toast, WA)
- **Toast Éxito:** "¡Turno cobrado! El pago ya está en la caja."
- **WA Plantilla 1 (Recordatorio):** "Hola {{nombre}}, te recordamos tu turno para el {{fecha}} a las {{hora}}. Si no podés venir, avisanos para reprogramar."

## Seeds demo mínimos
1. **Turno 11:00:** Paciente nuevo, estado Pendiente.
2. **Turno 10:00:** Paciente atendido, sin pagar (rojo/amarillo).
3. **Turno 09:00:** Pagado (verde).

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Tenés la agenda unificada con la caja. Sabés qué paciente no te pagó hoy sin salir del calendario."
- ❌ **Promesa NO:** "Valida la obra social, te autoriza la práctica y liquida al colegio médico a fin de mes."

## % actual → % meta
**52%** → **Meta: ≥68%**

## DoD Grok (lista checkbox)
- [ ] En la vista de detalle de un turno (`M-AGENDA`), inyectar el componente de cobro (el mismo de caja/POS rápido).
- [ ] Vincular el estado del turno (agregando un flag `pagoStatus`) para pintarlo diferente en el calendario.
- [ ] Asegurar que el cobro genere el movimiento de `Ingreso` automático en la caja central del día.

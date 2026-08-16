# SPEC R2-04 — Veterinaria: Cobrar Consulta en HC

## Dolor del cliente (1 párrafo es-AR)
El veterinario revisa al perro en la camilla, anota en la historia clínica (HC) en la compu o en papel, pero después cuando el cliente pasa por la recepción a pagar, la recepcionista no sabe qué le hicieron, qué medicamentos le aplicaron ni cuánto tiene que cobrarle. Si el vet es el mismo que cobra, tiene que salir de la ficha clínica, ir al módulo de caja, buscar al cliente de nuevo y armar la venta. Quieren que desde la misma pantalla donde terminan de escribir la evolución del animal, haya un botón enorme para "Cobrar Consulta" y que la persona se vaya rápido.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-HC` (Historia Clínica) + `M-POS`.
- **Qué reutilizar:** El modelo de pacientes (mascotas + tutores) y el componente `<CobrarDialog>` inyectado adentro de la vista clínica.
- **Qué NO construir:** No armar un portal web para que el dueño del perro vea las vacunas, ni conexión con laboratorios externos de análisis de sangre, ni diccionarios DICOM para radiografías.

## Happy path 90 segundos
1. El vet está en la ficha de "Bobby (Canino)". Escribe: "Vacuna antirrábica, buen estado".
2. Toca guardar evolución.
3. Abajo a la derecha aparece un botón primario: **"Cobrar Consulta / Productos"**.
4. Se abre el modal. Selecciona "Vacuna Quíntuple ($20.000)" y agrega "Bolsa Alimento 3kg ($15.000)" desde el stock.
5. Confirma el cobro. Se genera el ingreso de $35.000, se resta el alimento del stock, y Bobby se va moviendo la cola.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Cobrar Consulta** | Abre modal POS con servicios y productos. | Ficha Abierta | Peluquería R2-02 |
| **WA Próxima Vacuna** | Avisa que le toca refuerzo. | Historial | Base WA |

## Copy es-AR (empty, toast, WA)
- **Toast Éxito:** "¡Consulta cobrada y guardada en el historial de {{mascota}}!"
- **WA Plantilla:** "Hola {{nombre}}, te recordamos de la veterinaria que a {{mascota}} le toca su refuerzo de vacuna en estos días. Avisanos para darte un turno."

## Seeds demo mínimos
1. Ficha de perro "Pipo" con 1 evolución previa y 1 deuda pendiente de la consulta anterior.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Atendés al animal y le cobrás la consulta más el alimento desde la misma pantalla en 2 clicks."
- ❌ **Promesa NO:** "El sistema recibe las radiografías directo del equipo de rayos y arma historias clínicas internacionales HL7."

## % actual → % meta
**52%** → **Meta: ≥65%**

## DoD Grok (lista checkbox)
- [ ] En la ruta de detalle del Paciente/Mascota (`/dashboard/veterinaria/ficha/[id]`), agregar el botón de cobro rápido.
- [ ] El modal de cobro debe permitir combinar "Servicios" (Consulta, Vacuna) con "Productos de inventario" (Alimento, Pipeta) en el mismo flujo.
- [ ] Reflejar el pago en el historial de cuenta corriente del Tutor (Cliente principal).

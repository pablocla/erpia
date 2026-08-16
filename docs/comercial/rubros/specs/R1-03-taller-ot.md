# SPEC R1-03 — Taller Mecánico: Estados OT + Cobro + WA

## Dolor del cliente (1 párrafo es-AR)
El dueño del taller mecánico o de motos se vuelve loco anotando en un cuaderno los autos que entraron y qué les pasa. Los clientes lo vuelven loco por WhatsApp preguntando "jefe, ¿está listo el auto?" y muchas veces el vehículo queda trabado adentro del taller ocupando lugar porque falta un repuesto, y el dueño se olvida de avisar. Necesita un tablero clarísimo donde cargue el vehículo, marque en qué estado está la reparación, y al tocar un botón le avise por WhatsApp al cliente que ya lo puede pasar a buscar y cuánto duele la joda.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-MOV` (Movimientos / Órdenes de Trabajo simples).
- **Qué reutilizar:** Las listas con filtro de estados (igual que plancha), el componente de `<CobrarDialog>` (para cobrar el arreglo), y la lógica de base de datos para registrar patente/vehículo como texto simple.
- **Qué NO construir:** No construir integración con sistemas de compañías de seguros (siniestros), presupuestos complejos con garantía de fábrica conectada, ni control de tiempos/fichadas industriales por mecánico.

## Happy path 90 segundos
1. Entra un cliente con un Corsa. El dueño crea una nueva OT: "Corsa - Patente AAA111", teléfono del cliente, descripción del problema. Estado arranca en `Recibida`.
2. El mecánico desarma y ve qué onda. Pone el estado en `En taller`.
3. Falta una bomba de agua. Cambia el estado a `Espera repuesto` (rojo/naranja).
4. Llega la bomba, arregla el auto. El dueño cambia el estado a `Lista` 🟢 y toca el botón de WhatsApp. Le llega al cliente: "Tu auto ya está listo para retirar."
5. Viene el cliente, se cobra desde el botón **Cobrar**, se marca como `Entregada` y el auto desaparece del tablero principal.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Avanzar Estado** | Menú desplegable para pasar a (En Taller, Espera Repuesto, Lista). | Recibida ⚫, En Taller 🟡, Espera Repuesto 🔴 | Movimientos |
| **WA Listo** | Abre `wa.me` con plantilla de aviso de retiro y monto. | Lista 🟢 | Base WA |
| **Cobrar y Entregar** | Abre modal de cobro y cierra la OT. | Lista 🟢 | Préstamos/Fiado |
| **WA Espera Repuesto** | Abre `wa.me` avisando que está frenado por repuesto. | Espera Repuesto 🔴 | Base WA |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "El taller está vacío. Agregá tu primer vehículo en reparación."
- **Toast Éxito:** "¡Estado actualizado! Acordate de avisarle al cliente."
- **WA Plantilla 1 (Auto Listo):** "Hola {{nombre}}, te aviso del taller que tu vehículo (Patente: {{patente}}) ya está listo para retirar. Saldo pendiente: {{monto}}. Avisame a qué hora pasás."
- **WA Plantilla 2 (Freno Repuesto):** "Hola {{nombre}}, estamos trabajando en tu vehículo pero estamos frenados esperando un repuesto. Te aviso apenas tengamos novedades."

## Seeds demo mínimos (3 registros con sentido)
(Archivo: `industry-demo-seeds.ts` para Taller)
1. **Toyota Hilux (AD123AA):** `En taller`. Deuda estimada: $150.000. Bola 🟡.
2. **Honda Wave (002ZZZ):** `Espera repuesto`. Deuda estimada: $50.000. Bola 🔴.
3. **Ford Fiesta (AB456CD):** `Lista`. Deuda final: $80.000. Bola 🟢.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Controlás en qué estado está cada auto, dejás de depender de la memoria y le avisás al cliente por WhatsApp al instante."
- ❌ **Promesa NO:** "Se conecta con las compañías de seguros para liquidar siniestros y maneja garantías oficiales de las automotrices."

## % actual → % meta
**40%** → **Meta: ≥68%**

## DoD Grok (lista checkbox)
- [ ] Implementar los 5 estados fijos en el tablero de movimientos (Recibida, En taller, Espera repuesto, Lista, Entregada).
- [ ] Mapear las bolas de color: Gris/Negro=Recibida, Amarillo=En taller, Rojo=Espera repuesto, Verde=Lista, Transparente=Entregada.
- [ ] Asegurar que el campo de búsqueda permita filtrar por Patente o Teléfono.
- [ ] Crear el `<CobrarDialog>` al momento de marcar como "Entregada".
- [ ] Armar los 2 botones de WA dinámicos (Auto Listo y Espera repuesto).
- [ ] Cargar los 3 seeds específicos del taller mecánico.

## Fuera de alcance
- Facturación automática en base a repuestos conectados con el stock (por ahora es un monto total manual de la OT).
- Tiempos de horas-hombre por mecánico.

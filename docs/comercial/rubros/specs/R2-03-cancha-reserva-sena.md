# SPEC R2-03 — Cancha Sintético: Reserva y Seña

## Dolor del cliente (1 párrafo es-AR)
El dueño de las canchitas de fútbol alquila los turnos por WhatsApp. Le dicen "guardame la de las 20hs", la guarda, y a las 19:50 le avisan que no juntaron a los 10. Pierde el turno y plata. Necesita asegurar los turnos pidiendo una seña obligatoria, y que el sistema le marque clarísimo en la agenda qué turnos están "Pendientes de Seña" (y borrarlos si no pagan en X tiempo) y cuáles ya están confirmados con plata adentro. Y al llegar, cobrar el resto rápido.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-AGENDA` (con Recursos = Canchas) + `M-CXC` (Señas).
- **Qué reutilizar:** El modelo de pagos parciales (señas) de la tintorería/plancha (`R1-02`) pero aplicado a los bloques de agenda.
- **Qué NO construir:** No hacer armador automático de torneos, fixtures profesionales, tablas de posiciones ni conexión con asociaciones de fútbol.

## Happy path 90 segundos
1. Llama un cliente. El dueño va a la agenda (ve las columnas Cancha 1, Cancha 2).
2. Toca a las 20hs en Cancha 1. "Reserva Fútbol 5".
3. Toca **"Registrar Seña"**, marca que el cliente le transfirió $5.000 de adelanto.
4. El bloque en el calendario se pinta de `Verde Fuerte` (Confirmado con seña).
5. A las 20hs, llegan a jugar. El dueño toca el turno, presiona **"Cobrar Saldo"** (el modal ya sugiere el total menos los 5000), le dan el efectivo, y el turno queda 100% pagado.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Registrar Seña** | Anota el anticipo y confirma la reserva. | Reservado (Sin seña) 🟡 | M-CXC |
| **Cobrar Saldo** | Cobra lo que falta del precio del horario. | Confirmado (Con seña) 🟢 | M-CXC |
| **WA Confirmación** | Manda el recordatorio de la canchita. | Reservado 🟡/🟢 | Base WA |

## Copy es-AR (empty, toast, WA)
- **WA Plantilla (Con seña):** "Hola, te confirmo la reserva de la Cancha {{cancha}} para el {{fecha}} a las {{hora}}. Seña recibida: {{sena}}. Resta abonar: {{saldo}}."
- **WA Plantilla (Sin seña):** "Hola, tenés el turno de las {{hora}} pre-reservado. Para confirmarlo 100% pasame el comprobante de seña."

## Seeds demo mínimos
1. **Turno 19:00:** Cancha 1, sin seña (amarillo pálido).
2. **Turno 20:00:** Cancha 2, seña $5000 (verde).
3. **Turno 18:00:** Cancha 1, 100% pagado.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Cobrá la seña, anotala en la grilla y no dejes que te claven más con los turnos."
- ❌ **Promesa NO:** "El sistema te arma el campeonato de fin de semana con los cruces y goleadores."

## % actual → % meta
**32%** → **Meta: ≥70%**

## DoD Grok (lista checkbox)
- [ ] Adaptar la vista de `M-AGENDA` para soportar `Recursos` (ej. Columnas = Cancha 1, Cancha 2) si no existe.
- [ ] Integrar el flujo de pago parcial (`<CobrarDialog>`) directamente al hacer click en el bloque del calendario.
- [ ] Distinguir visualmente en el calendario: Sin seña (ej. borde punteado o color claro) vs Con seña (color sólido).

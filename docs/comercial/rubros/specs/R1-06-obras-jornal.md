# SPEC R1-06 — Obras y Changas: Jornales y Cobro Hito

## Dolor del cliente (1 párrafo es-AR)
El contratista o maestro mayor de obra lleva una libreta sucia donde anota quién fue a trabajar cada día. Los viernes a la tarde es pelea segura: los albañiles le piden plata, él no se acuerda si ya les dio un adelanto el martes para yerba, y no tiene claro cuánto le debe a cada uno. Por otro lado, no lleva control de cuándo le toca cobrarle al cliente el avance de obra (ej: "cuando terminamos la losa, me tenés que dar el 30%"). Necesita algo simple donde diga "Juan vino hoy", darle adelantos, y el viernes tocar "Liquidar" para saber cuánta plata tiene que darle en mano, además de un botón para mandarle el recibo de cobro al dueño de la obra.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-MOV` + `M-CXC` (Movimientos y Cuentas por Cobrar).
- **Qué reutilizar:** Liquidación de operarios similar a remis (`R1-05`), adelantos de caja, y estado de hitos tipo Cuotas.
- **Qué NO construir:** No construir Gantt chart de proyecto, no meter presupuestos de materiales avanzados, ni software de cálculo de estructuras o presentismo con huella digital. Es solo plata en mano y plata por cobrar.

## Happy path 90 segundos
1. Es viernes. El contratista toca "Liquidar Cuadrilla".
2. Selecciona al albañil "Juan". El sistema muestra: 5 días trabajados x $15.000 = $75.000. Adelantos (comida/nafta) cargados en la semana: $10.000. Saldo a pagar hoy: $65.000.
3. Le paga, toca **"Cerrar Semana Juan"**. Se limpia la cuenta de Juan para el lunes.
4. Va a la solapa "Cliente (Dueño)". Toca en el hito "Techo Terminado ($500.000)".
5. Toca **"Cobrar Hito"**, registra el pago y le manda un WA al dueño con el recibo.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Asistencia Diario** | Suma un jornal (día) al saldo del obrero. | 🟢 | Movimientos rápidos |
| **Dar Adelanto** | Registra un pago parcial a cuenta. | 🔴 | Préstamos / Caja |
| **Liquidar Obrero** | Modal con resumen semanal y cierre. | 🟢 | R1-05 (Remis) |
| **Cobrar Hito** | Modal de cobro de un % o fijo al cliente final. | 🟡 | Cuotas / CXC |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "Ningún operario cargado. Agregá tu cuadrilla para llevar los jornales."
- **WA Plantilla 1 (Liquidación Obrero):** "Hola {{nombre}}, te paso la cuenta de la semana. Días: {{dias}}. Adelantos: {{adelantos}}. Neto pagado: {{neto}}. Nos vemos el lunes."
- **WA Plantilla 2 (Recibo Dueño Obra):** "Hola {{nombre}}, te confirmo que recibí {{monto}} por el avance de obra ({{hito}}). ¡Seguimos avanzando!"

## Seeds demo mínimos
1. **Obrero Pedro:** 4 jornales + 1 adelanto. Bola 🟢.
2. **Cliente Doña María:** Hito "Paredones" Vence Hoy por $200.000. Bola 🟡.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Liquidas el viernes sin pelearte con los peones y controlás qué te debe el dueño de la casa."
- ❌ **Promesa NO:** "El sistema te calcula cuántas bolsas de cemento tenés que comprar para 10 m2."

## % actual → % meta
**40%** → **Meta: ≥62%**

## DoD Grok (lista checkbox)
- [ ] Adaptar `<LiquidacionChofer>` de remis para usarlo como `<LiquidarObrero>`.
- [ ] Permitir crear "hitos de obra" (similares a Cuotas fijas) para cobrarle al cliente.
- [ ] Ocultar opciones de stock/productos si el tenant es solo de mano de obra.

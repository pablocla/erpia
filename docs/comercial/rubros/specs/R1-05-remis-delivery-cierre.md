# SPEC R1-05 — Remis y Delivery: Cierre de Turno y Chofer

## Dolor del cliente (1 párrafo es-AR)
El cierre de turno en una remisería de barrio o en una casa de comidas con repartidores es un caos. El chofer llega a las 2 de la mañana con billetes arrugados, empieza a dictar "hice 15 viajes, 2 me los pagaron por transferencia a la agencia, me prestaste $5000 para nafta y el viaje de Doña Rosa fue fiado". El operador de la base saca una calculadora, anota en un papelito y siempre terminan peleando porque los números no dan. Necesitan un sistema que registre viaje por viaje rápido y, al final del turno, un botón que diga "Liquidación de Raúl" que haga la matemática sola (porcentaje de la base, adelantos, efectivo en mano) y lo cierre sin discusión.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-MOV` (Movimientos / Usuarios).
- **Qué reutilizar:** El módulo de usuarios (choferes) y los movimientos de caja, vinculando el ingreso a un empleado y sumando un estado de rendición ("Liquidado" / "Pendiente"). Reutilizar `<CobrarDialog>` para los adelantos.
- **Qué NO construir:** No construir una app nativa estilo Uber para el chofer con GPS en tiempo real. No hacer despacho automático por geolocalización. El operador de la base carga todo.

## Happy path 90 segundos
1. El operador de la remisería toca "Liquidar Chofer" y elige a *Raúl*.
2. El sistema muestra la liquidación del día de hoy:
   - **Total viajes (10):** $50.000
   - **Comisión Base (20%):** $10.000
   - **Adelantos en caja (Nafta):** $5.000
   - **Efectivo a entregar en base:** $15.000
3. El operador recibe los $15.000 de Raúl.
4. Toca el botón **"Cerrar Turno"**. Los 10 viajes pasan de estado `Verde` (Completados) a `Gris` (Turno Cerrado/Liquidados).
5. Se dispara el botón de WhatsApp y le manda a Raúl el resumen detallado para que no haya quejas al día siguiente.

## Tabla Labels × appId

| appId / industryId | Rol Principal | Acción/Servicio | Entidad que descuenta |
|---|---|---|---|
| `base_remis` / `remis` (nicho) | Chofer | Viaje | Base |
| `delivery_barrio` / `delivery` (nicho) | Repartidor / Cadete | Entrega / Pedido | Local |

> Alinear labels en código con `industry-templates` / `niche-apps-catalog` (no inventar SKUs nuevos).

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Liquidar Chofer / Repartidor** | Abre modal con el resumen matemático del día de esa persona. | Viajes Completados 🟢 | M-CUOTAS / Caja |
| **Cerrar Turno** | Cierra la liquidación, limpia la pantalla del chofer para el otro día. | Liquidación abierta | Caja (Cierre Z) |
| **WA Resumen** | Envía el desglose de la liquidación por WA. | Después de Cerrar Turno ⚫ | Base WA |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "El chofer no hizo ningún viaje todavía hoy."
- **Toast Éxito:** "¡Turno cerrado! Rendición guardada con éxito."
- **WA Plantilla 1 (Resumen Liquidación):** "Hola {{nombre}}, te paso el cierre de tu turno. Total viajes: {{total}}. Adelantos: {{adelantos}}. A entregar en {{base}}: {{a_entregar}}. Quedó todo cerrado, nos vemos en el próximo turno."

## Seeds demo mínimos (3 registros con sentido)
(Archivo: `industry-demo-seeds.ts` para Remis)
1. **Viaje completado:** Chofer Raúl, $6.000. Bola 🟢.
2. **Viaje en curso:** Chofer Raúl, monto a definir. Bola 🟡.
3. **Adelanto:** Chofer Raúl, $3.000 (Gasto nafta). Bola 🔴 (resta).

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Liquidas el turno del chofer en 1 minuto, sin calculadora, y le mandás el recibo clarito por WhatsApp para no pelear más por plata."
- ❌ **Promesa NO:** "El chofer tiene su propia app donde ve el mapa, carga los viajes solo y el sistema rutea por inteligencia artificial."

## % actual → % meta
**35%** → **Meta: ≥60%**

## DoD Grok (lista checkbox)
- [ ] Crear el modal o vista de `<LiquidacionChofer>` que filtre los movimientos del día por `usuarioId` (chofer).
- [ ] Implementar la lógica matemática: (Total viajes * % Comisión) + Adelantos = A Entregar (o viceversa según el modelo de negocio, dejarlo configurable o estándar simple).
- [ ] Agregar labels dinámicos: si es `delivery_barrio` / appId `delivery` decir "Repartidor/Local", si es `base_remis` / appId `remis` decir "Chofer/Base".
- [ ] Botón "Cerrar Turno" que marque todos esos movimientos del día como `liquidados` (estado cerrado/gris).
- [ ] Armar la plantilla de WhatsApp resumen.
- [ ] Agregar el ejemplo de liquidación exacta (semillas) para que se entienda la cuenta en las demos.

## Fuera de alcance
- App móvil exclusiva para el conductor.
- Ruteo por Google Maps o geolocalización de despachos.
- Sistema de multas o sanciones a choferes.

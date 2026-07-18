# Nichos Shell V2: Guía de Arquitectura

La arquitectura de "Shell V2" para nichos permite escalar el ERP hacia micro-verticales (Caballos de Calle) sin necesidad de escribir interfaces complejas (Next.js pages) ni tablas nuevas de Prisma para cada uno.

En su lugar, abstraemos la lógica comercial en "motores" genéricos (engines).

## 1. Motores Disponibles
Actualmente el `niche-app-shell.tsx` soporta y enruta a:
- `movimientos`: Flujos de trabajo, pipelines, tickets y cierres de caja (Taller, Plancha, Delivery). Usa la tabla `NicheMovimiento`.
- `cuotas`: Deuda recurrente, expensas, membresías (Consorcio, Club, Colegio). Usa la tabla `NicheMovimiento`.
- `agenda`: Redirige al calendario genérico de turnos (Peluquería, Cancha, Consultorio).
- `libreta`: Redirige al fiado.

## 2. Cómo agregar un nuevo Nicho
Si ventas trae un cliente "Lavadero de Autos", NO crees una tabla `LavaderoTicket`.
1. Anda a `lib/niche/niche-apps-catalog.ts`.
2. Agregá una entrada con `engine: "movimientos"` y `categorias: ["lavado", "detailing"]`.
3. Automáticamente el `niche-movimientos-panel-v2.tsx` levantará este diccionario.
4. (Opcional) Si querés estados custom, edita `getDomainStates` en el panel V2.

## 3. Ventajas
- **Time to market:** 5 minutos.
- **WhatsApp Integrado:** Si el estado pasa a "listo" (o es cuota vencida), el motor de notificaciones `route.ts` lo detecta y notifica al cliente sin programar nada.

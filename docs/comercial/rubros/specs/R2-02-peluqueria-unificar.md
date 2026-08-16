# SPEC R2-02 — Peluquería / Salón: Unificar Path y Cobro

## Dolor del cliente (1 párrafo es-AR)
El peluquero o dueño del salón entra al sistema y se marea. Ve el dashboard genérico ("shell"), ve un botón de "Agenda", otro de "Peluquería" (que a veces es un nicho aislado) y otro de "Caja". No sabe por dónde entrar a trabajar. Necesita un único camino canónico (Golden Path) para que cuando inicie sesión, vea su agenda del día, atienda, cobre el corte/color y no tenga que navegar por 4 pantallas con nombres que suenan a contabilidad de multinacional.

## Motor reutilizado + qué NO construir
- **Motor principal:** `M-AGENDA` (unificado visualmente) + `M-POS`.
- **Qué reutilizar:** Lo mismo que R2-01 (cobrar desde turno) pero con un componente extra rápido para agregar productos (ej: cobró el corte + le vendió un shampoo).
- **Qué NO construir:** No hacer liquidación de comisiones compleja por sillón/peluquero (se puede hacer un cálculo simple a futuro, pero no en este path básico). 

## Happy path 90 segundos
1. El usuario inicia sesión y por defecto aterriza en `/dashboard/agenda` (o una vista unificada "Salón").
2. Atiende al turno de las 15:00 ("Corte y Color - Doña Rosa").
3. Hace click, toca "Cobrar Servicio".
4. En el modal, además de los $10.000 del corte, puede elegir de una lista rápida un "Shampoo Matizador" de $5.000. Total $15.000.
5. Cobra, se cierra el turno, el ingreso va a caja y se descuenta un shampoo del stock.

## Botones (label | acción | estado bola | reusa de)
| Botón/Acción | Qué hace | Estado / Bola que lo activa | Reusa de |
|---|---|---|---|
| **Cobrar + Producto** | Abre `<CobrarDialog>` con un selector simple de items extra. | Atendido 🟡 | R2-01 / POS |

## Copy es-AR (empty, toast, WA)
- **Empty State:** "La agenda está libre. Agregá tus turnos del día acá."
- **Toast Éxito:** "¡Cobro registrado! (Incluye 1 producto)."

## Seeds demo mínimos
1. **Turno de color:** Con servicio principal y cobrado con un producto.

## Promesa OK / Promesa NO
- ✅ **Promesa OK:** "Ves el turno, cobrás el corte, y si le vendés una crema la sumás ahí mismo en 2 segundos."
- ❌ **Promesa NO:** "Te liquida la comisión porcentual por cada peluquero descontando el costo de la tintura gastada en gramos."

## % actual → % meta
**40%** → **Meta: ≥70%**

## DoD Grok (lista checkbox)
- [ ] Definir `/dashboard/agenda` (o la ruta canónica del nicho) como el landing obligatorio si el `appId` es `peluqueria`.
- [ ] Ocultar del menú lateral las rutas que sobran para no marear (ventas complejas, compras de materias primas si no las usa).
- [ ] Extender `<CobrarDialog>` en modo agenda para que permita agregar items/productos del inventario al ticket del turno (venta cruzada).

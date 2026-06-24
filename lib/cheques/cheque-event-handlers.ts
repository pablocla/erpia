/**
 * Handlers de eventos de cheques — alertas y trazabilidad.
 */
import { eventBus } from "@/lib/events/event-bus"
import type { ChequeRechazadoPayload } from "@/lib/events/types"

eventBus.on<ChequeRechazadoPayload>("CHEQUE_RECHAZADO", "alerta_cheque_rechazado", async (event) => {
  console.warn(
    `[CHEQUE_RECHAZADO] chequeId=${event.payload.chequeId} clienteId=${event.payload.clienteId} monto=${event.payload.monto} nuevaCC=${event.payload.cuentaCobrarId ?? "—"}`
  )
})
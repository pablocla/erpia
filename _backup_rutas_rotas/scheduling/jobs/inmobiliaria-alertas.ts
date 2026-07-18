import {
  alertarAlquileresImpagos,
  alertarContratosPorVencer,
  facturarAlquileresMensuales,
} from "@/lib/inmobiliaria/alquileres-service"

export type InmobiliariaCronSummary = {
  facturacion: Awaited<ReturnType<typeof facturarAlquileresMensuales>>
  contratosVencen: number
  alquileresImpagos: number
}

export async function runFacturacionAlquileresMensual() {
  return facturarAlquileresMensuales()
}

export async function runContratoVence30() {
  return alertarContratosPorVencer(30)
}

export async function runAlquilerImpago() {
  return alertarAlquileresImpagos()
}

export async function runInmobiliariaAlertas(): Promise<InmobiliariaCronSummary> {
  const [facturacion, contratos, impagos] = await Promise.all([
    facturarAlquileresMensuales(),
    alertarContratosPorVencer(30),
    alertarAlquileresImpagos(),
  ])
  return {
    facturacion,
    contratosVencen: contratos.alertas,
    alquileresImpagos: impagos.avisados,
  }
}
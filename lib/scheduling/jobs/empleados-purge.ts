import { purgeEmpleadoDigitalOldData } from "@/lib/empleados-digitales/purge-old-data"

/** Cron semanal — INF-02 */
export async function runEmpleadosDigitalesPurge() {
  return purgeEmpleadoDigitalOldData(90)
}

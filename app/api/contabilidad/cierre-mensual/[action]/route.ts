import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const { action } = await params

    const result = await prisma.$transaction(async (tx) => {
      // Obtenemos el último número de asiento
      const ultimoAsiento = await tx.asientoContable.findFirst({
        where: { empresaId: auth.auth.empresaId },
        orderBy: { numero: 'desc' }
      })
      const nroAsiento = (ultimoAsiento?.numero || 0) + 1

      if (action === "amortizaciones") {
        // En un caso real: tx.activoFijo.findMany() -> calcular y amortizar
        // Simulamos la generación del asiento
        return await tx.asientoContable.create({
          data: {
            empresaId: auth.auth.empresaId,
            numero: nroAsiento,
            fecha: new Date(),
            descripcion: "Amortización Mensual de Activos Fijos",
            tipo: "manual"
          }
        })
      } 
      
      if (action === "diferencia-cambio") {
        return await tx.asientoContable.create({
          data: {
            empresaId: auth.auth.empresaId,
            numero: nroAsiento,
            fecha: new Date(),
            descripcion: "Ajuste por Diferencia de Cambio a Fecha de Cierre",
            tipo: "manual"
          }
        })
      } 
      
      if (action === "refundicion") {
        // En un caso real: cerrar cuentas de resultado y transferir a patrimonio neto
        const asientoRefundicion = await tx.asientoContable.create({
          data: {
            empresaId: auth.auth.empresaId,
            numero: nroAsiento,
            fecha: new Date(),
            descripcion: "Asiento de Refundición de Resultados (Cierre)",
            tipo: "manual"
          }
        })

        // Buscar el ejercicio abierto y cerrarlo
        const ejercicioAbierto = await tx.ejercicioContable.findFirst({
          where: { empresaId: auth.auth.empresaId, estado: "abierto" }
        })

        if (ejercicioAbierto) {
          await tx.ejercicioContable.update({
            where: { id: ejercicioAbierto.id },
            data: { 
              estado: "cerrado", 
              fechaCierre: new Date(),
              asientoCierreId: asientoRefundicion.id
            }
          })
        }
        return asientoRefundicion
      }

      throw new Error("Acción de cierre no reconocida")
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("Error en cierre mensual:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}

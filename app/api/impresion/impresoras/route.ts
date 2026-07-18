import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { PrinterService } from "@/lib/printer/printer-service"

/** GET — impresoras de la empresa + plantillas detectables */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const svc = new PrinterService()
  const [configuradas, plantillas] = await Promise.all([
    svc.listarImpresorasEmpresa(auth.auth.empresaId),
    svc.detectarImpresoras(),
  ])

  return NextResponse.json({
    configuradas,
    plantillas,
    marcasSoportadas: ["hasar", "epson"],
    nota:
      "Emisión fiscal principal: AFIP WSFE (CAE) + ticket térmico ESC/POS (Hasar/Epson). " +
      "No es controlador fiscal legacy de jornadas Z.",
  })
}

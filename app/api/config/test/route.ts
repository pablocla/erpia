import { NextResponse } from "next/server"
import { config } from "@/lib/config"

// Endpoint para verificar la configuración (solo en desarrollo)
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No disponible en producción" }, { status: 403 })
  }

  return NextResponse.json({
    status: "ok",
    config: {
      afip: {
        entorno: config.afip.entorno,
        cuit: config.afip.cuit,
        puntoVenta: config.afip.puntoVenta,
        wsfeUrl: config.afip.wsfeUrl,
      },
      app: {
        url: config.app.url,
        name: config.app.name,
      },
      database: {
        connected: !!config.database.url,
      },
      printer: {
        type: config.printer.type,
        port: config.printer.port,
      },
    },
  })
}

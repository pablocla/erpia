import { NextResponse } from "next/server"
import { listProtheusServices } from "@/lib/opo/protheus-rest-client"

export async function GET() {
  try {
    // Usamos las credenciales de testing provistas por el usuario
    const creds = {
      baseUrl: "https://oxforduniversity172971.protheus.cloudtotvs.com.br:4050",
      user: "admin",
      password: "Oxford08.",
    }

    const data = await listProtheusServices(creds)
    
    return NextResponse.json({
      success: true,
      count: data.length,
      services: data
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Error al conectar con Protheus"
    }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth/rate-limiter"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const vehiculos = await prisma.vehiculoConcesionaria.findMany({
      where: whereEmpresa(auth.auth.empresaId),
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(vehiculos)
  } catch (err) {
    console.error("GET vehiculos concesionaria error:", err)
    return NextResponse.json({ error: "Error al obtener vehículos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const limitResponse = checkRateLimit(request, `vehiculos-post-${auth.auth.empresaId}`, 20, 60000)
  if (limitResponse) return limitResponse

  try {
    const data = await request.json()
    const { patente, marca, modelo, anio, kilometros, estado, precioToma, precioVenta, consignacion, observaciones } = data

    if (!patente || !marca || !modelo || !anio) {
      return NextResponse.json({ error: "Patente, marca, modelo y año son obligatorios." }, { status: 400 })
    }

    const nuevo = await prisma.vehiculoConcesionaria.create({
      data: {
        empresaId: auth.auth.empresaId,
        patente: patente.toUpperCase().trim(),
        marca,
        modelo,
        anio: Number(anio),
        kilometros: Number(kilometros) || 0,
        estado: estado || "salon",
        precioToma: Number(precioToma) || 0,
        precioVenta: Number(precioVenta) || 0,
        consignacion: Boolean(consignacion),
        observaciones,
      },
    })

    return NextResponse.json(nuevo)
  } catch (err: any) {
    console.error("POST vehiculo concesionaria error:", err)
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un vehículo con esa patente." }, { status: 400 })
    }
    return NextResponse.json({ error: "Error interno al crear el vehículo." }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { addMaquinaLog, listMaquinas } from "@/lib/agro/iot-stub-store"

const SUPPORTED = new Set(["JOHN_DEERE", "AGCO"])

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const maquinas = listMaquinas(auth.auth.empresaId)
  const errores: string[] = []
  let sincronizadas = 0

  for (const m of maquinas) {
    if (!SUPPORTED.has(m.marca) || !m.apiMachineId) {
      errores.push(`${m.nombre}: integración manual (sin API o apiMachineId)`)
      continue
    }

    addMaquinaLog({
      maquinaId: m.id,
      timestamp: new Date().toISOString(),
      lat: null,
      lon: null,
      velocidad: Math.round(8 + Math.random() * 20),
      operacion: "TRANSPORTE",
      horasMotor: Number((2 + Math.random() * 8).toFixed(1)),
      combustible: Number((10 + Math.random() * 25).toFixed(1)),
      empresaId: auth.auth.empresaId,
    })
    sincronizadas++
  }

  return NextResponse.json({ sincronizadas, errores, proveedor: "stub" })
}

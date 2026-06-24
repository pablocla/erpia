import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { addMaquina, listMaquinaLogs, listMaquinas } from "@/lib/agro/iot-stub-store"

const createMaquinaSchema = z.object({
  nombre: z.string().min(1),
  marca: z
    .enum(["JOHN_DEERE", "AGCO", "CASE_IH", "NEW_HOLLAND", "PAUNY", "APACHE", "OTRO"])
    .optional(),
  modeloNombre: z.string().trim().optional().nullable(),
  apiMachineId: z.string().trim().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const maquinas = listMaquinas(auth.auth.empresaId).map((m) => ({
    ...m,
    logs: listMaquinaLogs(m.id, auth.auth.empresaId, 5),
  }))

  return NextResponse.json({ maquinas })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const parsed = createMaquinaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const nombre = String(parsed.data.nombre).trim()
  const marca = parsed.data.marca ?? "OTRO"

  const maquina = addMaquina({
    nombre,
    marca: marca as
      | "JOHN_DEERE"
      | "AGCO"
      | "CASE_IH"
      | "NEW_HOLLAND"
      | "PAUNY"
      | "APACHE"
      | "OTRO",
    modeloNombre: parsed.data.modeloNombre ?? null,
    apiMachineId: parsed.data.apiMachineId ?? null,
    empresaId: auth.auth.empresaId,
  })

  return NextResponse.json(maquina, { status: 201 })
}


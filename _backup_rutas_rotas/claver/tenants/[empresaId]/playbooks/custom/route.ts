import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import {
  crearCustomPlaybook,
  eliminarCustomPlaybook,
  ejecutarCustomPlaybook,
  listCustomPlaybooks,
  type CustomPlaybookAction,
} from "@/lib/ops/custom-playbooks-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId } = await params
  const id = Number(empresaId)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const ctx = await getClaverAnalystEmpresaContext(request, id)
  if (!ctx.ok) return ctx.response

  const playbooks = await listCustomPlaybooks(id)
  return NextResponse.json({ playbooks })
}

const accionSchema = z.object({
  tipo: z.enum(["producto", "playbook_builtin"]),
  action: z.enum(["provision", "activate", "deactivate", "provision_pack", "activate_pack", "deactivate_pack"]).optional(),
  sku: z.string().optional(),
  packId: z.string().optional(),
  playbookId: z.string().optional(),
})

const createSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  acciones: z.array(accionSchema).min(1),
})

const executeSchema = z.object({
  playbookId: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params
    const id = Number(empresaId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, id)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    const execParsed = executeSchema.safeParse(body)
    if (execParsed.success && !("nombre" in body)) {
      const result = await ejecutarCustomPlaybook(id, execParsed.data.playbookId, ctx.auth.email)
      return NextResponse.json(result)
    }

    const createParsed = createSchema.safeParse(body)
    if (!createParsed.success) {
      return NextResponse.json({ error: "Payload inválido (crear o ejecutar)" }, { status: 400 })
    }

    const playbook = await crearCustomPlaybook(
      id,
      {
        nombre: createParsed.data.nombre,
        descripcion: createParsed.data.descripcion,
        acciones: createParsed.data.acciones as CustomPlaybookAction[],
      },
      ctx.auth.email,
    )
    return NextResponse.json({ playbook })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params
    const id = Number(empresaId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, id)
    if (!ctx.ok) return ctx.response

    const playbookId = new URL(request.url).searchParams.get("playbookId")
    if (!playbookId) {
      return NextResponse.json({ error: "playbookId requerido" }, { status: 400 })
    }

    const result = await eliminarCustomPlaybook(id, playbookId)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
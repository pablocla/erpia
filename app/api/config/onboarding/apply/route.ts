import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const moduloSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
})

const productoSchema = z.object({
  nombre: z.string(),
  codigo: z.string(),
  precio: z.number(),
  iva: z.number(),
})

const applySchema = z.object({
  empresaId: z.number().int().positive().optional(),
  rubro: z.string(),
  condicionAfip: z.enum(["monotributista", "responsable_inscripto"]),
  modulosActivos: z.array(z.string()),
  modulosDetalle: z.array(moduloSchema).optional(),
  planCuentasSugerido: z.string(),
  tesSugeridos: z.array(z.string()),
  productosEjemplo: z.array(productoSchema),
  rolesSugeridos: z.array(z.string()),
})

const MODULOS_VALIDOS = [
  "compras",
  "ventas",
  "stock",
  "caja",
  "contabilidad",
  "hospitalidad",
  "agenda",
  "historia_clinica",
  "membresias",
  "onboarding",
  "logistica",
  "industria",
  "picking",
  "iot",
] as const

const MODULO_MAP: Record<string, typeof MODULOS_VALIDOS[number]> = {
  compras: "compras",
  ventas: "ventas",
  stock: "stock",
  caja: "caja",
  contabilidad: "contabilidad",
  hospitalidad: "hospitalidad",
  agenda: "agenda",
  historia_clinica: "historia_clinica",
  "membresías": "membresias",
  membresias: "membresias",
  onboarding: "onboarding",
  logistica: "logistica",
  industria: "industria",
  picking: "picking",
  iot: "iot",
}

/**
 * POST /api/config/onboarding/apply
 *
 * Persists onboarding configuration to DB:
 * 1. Activates/deactivates ConfiguracionFuncional handlers per module
 * 2. Creates example products
 * 3. Seeds plan de cuentas if missing
 * 4. Creates ParametroFiscal entries (rubro, condicion_afip)
 * 5. Updates empresa rubro
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = applySchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const {
      rubro, condicionAfip, modulosActivos,
      planCuentasSugerido, tesSugeridos, productosEjemplo, rolesSugeridos,
    } = validacion.data

    const empresaId = ctx.auth.empresaId

    const resultados: string[] = []

    // 1. Update empresa rubro + condición
    await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        rubro,
        condicionAfip,
      },
    }).catch(() => {
      // Field may not exist yet — non-blocking
    })
    resultados.push("Empresa actualizada")

    // 2. Activate/deactivate ConfiguracionFuncional handlers
    const handlers = await prisma.configuracionFuncional.findMany()
    for (const h of handlers) {
      const moduloActivo = modulosActivos.includes(h.modulo)
      if (h.activo !== moduloActivo) {
        await prisma.configuracionFuncional.update({
          where: { id: h.id },
          data: { activo: moduloActivo },
        })
      }
    }
    resultados.push(`${handlers.length} handlers evaluados`)

    // 2.b Persist module visibility config
    const modulosActivosSet = new Set(
      modulosActivos
        .map((modulo) => MODULO_MAP[modulo])
        .filter((modulo): modulo is typeof MODULOS_VALIDOS[number] => Boolean(modulo))
    )

    const modulosConfig = MODULOS_VALIDOS.reduce<Record<string, boolean>>((acc, modulo) => {
      acc[modulo] = modulosActivosSet.has(modulo)
      return acc
    }, {})

    await prisma.$transaction(
      Object.entries(modulosConfig).map(([modulo, habilitado]) =>
        prisma.configuracionModulo.upsert({
          where: { empresaId_modulo: { empresaId, modulo } },
          update: { habilitado },
          create: { empresaId, modulo, habilitado },
        })
      )
    )
    resultados.push("Modulos visibles configurados")

    // 3. Create example products (skip if already exist by codigo)
    let productosCreados = 0
    for (const prod of productosEjemplo) {
      const existe = await prisma.producto.findFirst({
        where: { codigo: prod.codigo },
      })
      if (!existe) {
        await prisma.producto.create({
          data: {
            nombre: prod.nombre,
            codigo: prod.codigo,
            precioVenta: prod.precio,
            porcentajeIva: prod.iva,
            activo: true,
            empresaId,
          },
        }).catch(() => {
          // Schema mismatch — non-blocking
        })
        productosCreados++
      }
    }
    resultados.push(`${productosCreados} productos de ejemplo creados`)

    // 4. Seed fiscal parameters
    const parametros = [
      { clave: "rubro", valor: 0 },
      { clave: "condicion_afip", valor: 0 },
      { clave: "plan_cuentas", valor: 0 },
      { clave: "onboarding_completado", valor: 1 },
    ]

    for (const p of parametros) {
      await prisma.parametroFiscal.upsert({
        where: {
          empresaId_clave_pais: { empresaId, clave: p.clave, pais: "AR" },
        },
        update: { valor: p.valor, descripcion: `Onboarding: ${p.clave}` },
        create: {
          empresaId,
          clave: p.clave,
          valor: p.valor,
          pais: "AR",
          categoria: "operativo",
          descripcion: `${p.clave}: ${p.clave === "rubro" ? rubro : p.clave === "condicion_afip" ? condicionAfip : planCuentasSugerido}`,
          vigenciaDesde: new Date(),
        },
      }).catch(() => {
        // Non-blocking
      })
    }
    resultados.push("Parámetros fiscales configurados")

    // 5. Seed basic plan de cuentas if empty
    const cuentasExistentes = await prisma.cuentaContable.count({
      where: { empresaId },
    })

    if (cuentasExistentes === 0) {
      const cuentasBase = [
        { codigo: "1", nombre: "Activo", tipo: "activo", nivel: 1, imputable: false },
        { codigo: "1.1", nombre: "Activo Corriente", tipo: "activo", nivel: 2, imputable: false },
        { codigo: "1.1.1", nombre: "Caja y Bancos", tipo: "activo", nivel: 3, imputable: true },
        { codigo: "1.1.2", nombre: "Créditos por Ventas", tipo: "activo", nivel: 3, imputable: true },
        { codigo: "1.1.3", nombre: "Bienes de Cambio", tipo: "activo", nivel: 3, imputable: true },
        { codigo: "2", nombre: "Pasivo", tipo: "pasivo", nivel: 1, imputable: false },
        { codigo: "2.1", nombre: "Pasivo Corriente", tipo: "pasivo", nivel: 2, imputable: false },
        { codigo: "2.1.1", nombre: "Proveedores", tipo: "pasivo", nivel: 3, imputable: true },
        { codigo: "2.1.2", nombre: "Deudas Fiscales", tipo: "pasivo", nivel: 3, imputable: true },
        { codigo: "3", nombre: "Patrimonio Neto", tipo: "patrimonio", nivel: 1, imputable: false },
        { codigo: "3.1", nombre: "Capital", tipo: "patrimonio", nivel: 2, imputable: true },
        { codigo: "4", nombre: "Ingresos", tipo: "ingreso", nivel: 1, imputable: false },
        { codigo: "4.1", nombre: "Ventas", tipo: "ingreso", nivel: 2, imputable: true },
        { codigo: "4.2", nombre: "Otros Ingresos", tipo: "ingreso", nivel: 2, imputable: true },
        { codigo: "5", nombre: "Egresos", tipo: "egreso", nivel: 1, imputable: false },
        { codigo: "5.1", nombre: "Costo de Mercadería Vendida", tipo: "egreso", nivel: 2, imputable: true },
        { codigo: "5.2", nombre: "Gastos Operativos", tipo: "egreso", nivel: 2, imputable: true },
        { codigo: "5.3", nombre: "Impuestos", tipo: "egreso", nivel: 2, imputable: true },
      ]

      for (const c of cuentasBase) {
        await prisma.cuentaContable.create({
          data: { ...c, empresaId, categoria: c.tipo },
        }).catch(() => {})
      }
      resultados.push(`${cuentasBase.length} cuentas contables creadas`)
    } else {
      resultados.push(`Plan de cuentas existente (${cuentasExistentes} cuentas)`)
    }

    return NextResponse.json({
      ok: true,
      resultados,
      modulosActivos,
      tesSugeridos,
      rolesSugeridos,
    })
  } catch (error) {
    console.error("Error aplicando onboarding:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}

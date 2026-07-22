import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { getClienteRequiredFields, getProveedorRequiredFields, evaluateClienteCompleteness, evaluateProveedorCompleteness } from "@/lib/maestros/data-quality-profiles"

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const empresaId = auth.auth.empresaId
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { modoLite: true, rubro: true }
    })

    const ctx = {
      modoLite: empresa?.modoLite || "pos",
      rubro: empresa?.rubro || "kiosco"
    }

    // Usar count para cosas simples
    const totalClientes = await prisma.cliente.count({ where: whereEmpresa(empresaId) }).catch(() => 0)
    const totalProveedores = await prisma.proveedor.count({ where: whereEmpresa(empresaId) }).catch(() => 0)
    const totalProductos = await prisma.producto.count({ where: whereEmpresa(empresaId) }).catch(() => 0)

    const sinTelefono = await prisma.cliente.count({
      where: {
        ...whereEmpresa(empresaId),
        OR: [{ telefono: null }, { telefono: "" }]
      }
    }).catch(() => 0)

    const conDeudaSinTelefono = await prisma.cliente.count({
      where: {
        ...whereEmpresa(empresaId),
        saldoCuentaCorriente: { gt: 0 },
        OR: [{ telefono: null }, { telefono: "" }]
      }
    }).catch(() => 0)
    
    const sinCuitValido = await prisma.proveedor.count({
      where: {
        ...whereEmpresa(empresaId),
        OR: [{ cuit: null }, { cuit: "" }]
      }
    }).catch(() => 0)

    // Traemos hasta 500 para evaluar calidad y extrapolar si hay más
    const sampleClientes = await prisma.cliente.findMany({
      where: whereEmpresa(empresaId),
      take: 500,
      select: { id: true, nombre: true, telefono: true, fiadoHabilitado: true, limiteCredito: true, condicionIva: true, cuit: true, direccion: true, emailFacturacion: true, emailNotificacionFiado: true }
    }).catch(() => [])

    let completosCli = 0
    let incompletosCli = 0
    for (const cli of sampleClientes) {
      const evalData = { ...cli, limiteCredito: cli.limiteCredito ? Number(cli.limiteCredito) : 0 }
      const ev = evaluateClienteCompleteness(evalData, ctx)
      if (ev.ok) completosCli++
      else incompletosCli++
    }
    
    if (totalClientes > 500 && sampleClientes.length > 0) {
      const ratio = completosCli / sampleClientes.length
      completosCli = Math.round(totalClientes * ratio)
      incompletosCli = totalClientes - completosCli
    } else if (sampleClientes.length === 0) {
      completosCli = 0
      incompletosCli = 0
    }

    const sampleProveedores = await prisma.proveedor.findMany({
      where: whereEmpresa(empresaId),
      take: 500,
      select: { id: true, nombre: true, cuit: true, condicionIva: true, telefono: true, condicionPagoId: true }
    }).catch(() => [])

    let completosProv = 0
    let incompletosProv = 0
    for (const prov of sampleProveedores) {
      const ev = evaluateProveedorCompleteness(prov, ctx)
      if (ev.ok) completosProv++
      else incompletosProv++
    }
    
    if (totalProveedores > 500 && sampleProveedores.length > 0) {
      const ratio = completosProv / sampleProveedores.length
      completosProv = Math.round(totalProveedores * ratio)
      incompletosProv = totalProveedores - completosProv
    } else if (sampleProveedores.length === 0) {
      completosProv = 0
      incompletosProv = 0
    }

    // Construir checklist basado en datos reales
    const checklist = [
      { 
        id: "tiene_cliente", 
        label: "Al menos 1 cliente", 
        done: totalClientes > 0, 
        href: "/dashboard/clientes" 
      },
      { 
        id: "tiene_producto", 
        label: "Al menos 1 producto o servicio", 
        done: totalProductos > 0, 
        href: "/dashboard/productos" 
      },
      { 
        id: "tiene_proveedor", 
        label: "Al menos 1 proveedor", 
        done: totalProveedores > 0, 
        href: "/dashboard/proveedores" 
      },
    ]

    // Añadir ítems específicos si aplica
    if (ctx.modoLite === "fiado") {
      checklist.push({
        id: "cliente_fiado_ok",
        label: "Cliente con teléfono y límite",
        done: (sampleClientes.find(c => c.telefono && c.limiteCredito && Number(c.limiteCredito) > 0) != null),
        href: "/dashboard/clientes"
      })
    }
    
    if (ctx.modoLite === "completo") {
      checklist.push({
        id: "proveedor_cuit_ok",
        label: "Proveedor con CUIT y Condición IVA",
        done: completosProv > 0,
        href: "/dashboard/proveedores"
      })
    }

    return NextResponse.json({
      clientes: {
        total: totalClientes,
        completos: completosCli,
        incompletos: incompletosCli,
        sinTelefono,
        conDeudaSinTelefono
      },
      proveedores: {
        total: totalProveedores,
        completos: completosProv,
        incompletos: incompletosProv,
        sinCuitValido
      },
      productos: {
        total: totalProductos
      },
      checklist
    })
  } catch (error) {
    console.error("Error en quality-summary:", error)
    return NextResponse.json({ error: "Error procesando el resumen" }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"
import { getProyectoPorEmpresa } from "@/lib/ops/implementacion-service"
import { getIntegracionesHealthItems } from "@/lib/ops/integration-health-service"
import { obtenerOnboardingPropiedad, onboardingPropiedadPendiente } from "@/lib/comercial/propiedad-onboarding"
import { esTenantPropiedad } from "@/lib/ops/tenant-propiedad-service"

export type ReadinessEstado = "ok" | "warn" | "fail"

export interface ReadinessItem {
  id: string
  label: string
  estado: ReadinessEstado
  detalle?: string
  href?: string
}

export interface ReadinessReport {
  empresaId: number
  listoGoLive: boolean
  score: number
  items: ReadinessItem[]
  rubroChecks: ReadinessItem[]
  integraciones: ReadinessItem[]
}

function scoreFromItems(items: ReadinessItem[]): number {
  if (items.length === 0) return 0
  const weights = { ok: 1, warn: 0.5, fail: 0 }
  const total = items.reduce((s, i) => s + weights[i.estado], 0)
  return Math.round((total / items.length) * 100)
}

export async function getEmpresaReadiness(empresaId: number): Promise<ReadinessReport> {
  const db = prisma as any

  const [empresa, usuarios, productos, clientes, onboardingParam, entornos, proyecto] =
    await Promise.all([
      db.empresa.findUnique({
        where: { id: empresaId },
        select: {
          cuit: true,
          rubro: true,
          entornoAfip: true,
          certificadoCRT: true,
          planHosting: true,
        },
      }),
      db.usuario.count({ where: { empresaId, activo: true } }),
      db.producto.count({ where: { empresaId } }),
      db.cliente.count({ where: { empresaId } }),
      db.parametroFiscal.findFirst({
        where: { empresaId, clave: "onboarding_completado" },
      }),
      db.tenantEntorno.count({ where: { empresaId } }),
      getProyectoPorEmpresa(empresaId),
    ])

  const items: ReadinessItem[] = []

  const cuitValido = empresa?.cuit && !String(empresa.cuit).startsWith("DEMO-")
  items.push({
    id: "cuit",
    label: "CUIT fiscal válido",
    estado: cuitValido ? "ok" : "fail",
    detalle: cuitValido ? empresa!.cuit : "CUIT demo o pendiente",
    href: "/dashboard/configuracion",
  })

  items.push({
    id: "usuarios",
    label: "Usuarios activos",
    estado: usuarios >= 1 ? (usuarios >= 2 ? "ok" : "warn") : "fail",
    detalle: `${usuarios} usuario(s)`,
    href: "/dashboard/usuarios",
  })

  items.push({
    id: "onboarding",
    label: "Onboarding rubro aplicado",
    estado: onboardingParam && Number(onboardingParam.valor) === 1 ? "ok" : "warn",
    detalle: onboardingParam ? "Configuración persistida" : "Pendiente wizard o apply",
    href: "/dashboard/onboarding",
  })

  items.push({
    id: "entornos",
    label: "Entornos Cloud (dev/val/prd)",
    estado: entornos >= 3 ? "ok" : "warn",
    detalle: `${entornos}/3 entornos`,
    href: "/dashboard/operaciones",
  })

  items.push({
    id: "proyecto_cca",
    label: "Proyecto implementación CCA",
    estado: proyecto ? "ok" : "fail",
    detalle: proyecto?.codigo ?? "Sin proyecto",
    href: proyecto ? `/dashboard/claver/implementaciones/${proyecto.id}` : undefined,
  })

  if (proyecto) {
    items.push({
      id: "pack_onboard",
      label: "Pack ONBOARD entregado",
      estado: proyecto.packOnboardEntregado ? "ok" : "warn",
      detalle: proyecto.packOnboardEntregado ? "Entregado al cliente" : "Pendiente CCA-030",
    })

    items.push({
      id: "fase_uat",
      label: "UAT completada (CCA-060)",
      estado: proyecto.fases?.["CCA-060"]?.completado ? "ok" : "warn",
    })
  }

  const tieneCert = Boolean(empresa?.certificadoCRT)
  items.push({
    id: "cert_afip",
    label: "Certificado AFIP cargado",
    estado: tieneCert ? "ok" : "warn",
    detalle: tieneCert ? "CRT presente" : "Subir en configuración fiscal",
    href: "/dashboard/configuracion",
  })

  const afipProd = empresa?.entornoAfip === "produccion"
  items.push({
    id: "afip_prod",
    label: "Entorno AFIP producción",
    estado: afipProd ? "ok" : "warn",
    detalle: empresa?.entornoAfip ?? "homologacion",
  })

  const esPropiedad = await esTenantPropiedad(empresaId)
  let rubroChecks: ReadinessItem[] = []

  if (esPropiedad) {
    const [consorcios, unidades, propiedades, contratos, onboardingProp, waConectado] = await Promise.all([
      db.consorcio.count({ where: { empresaId } }),
      db.unidadFuncional.count({ where: { consorcio: { empresaId } } }),
      db.propiedad.count({ where: { empresaId } }),
      db.contratoAlquiler.count({ where: { empresaId, estado: "activo" } }),
      obtenerOnboardingPropiedad(empresaId),
      db.conexionIntegracion.findFirst({
        where: { empresaId, integracionId: "whatsapp", estado: "conectado" },
      }),
    ])

    rubroChecks = [
      {
        id: "consorcio_configurado",
        label: "Consorcio con unidades",
        estado: consorcios >= 1 && unidades >= 1 ? "ok" : consorcios >= 1 ? "warn" : "fail",
        detalle: `${consorcios} consorcio(s) · ${unidades} UF`,
        href: "/dashboard/nicho/consorcios",
      },
      {
        id: "cartera_inmobiliaria",
        label: "Cartera inmobiliaria",
        estado: propiedades >= 1 ? "ok" : "warn",
        detalle: `${propiedades} propiedad(es) · ${contratos} contrato(s) activo(s)`,
        href: "/dashboard/nicho/inmobiliaria",
      },
      {
        id: "onboarding_propiedad",
        label: "Checklist onboarding Propiedad",
        estado: onboardingPropiedadPendiente(onboardingProp) ? "warn" : onboardingProp ? "ok" : "warn",
        detalle: onboardingProp
          ? `${onboardingProp.completados.length}/${4} pasos`
          : "Sin iniciar",
        href: "/dashboard/nicho/consorcios",
      },
      {
        id: "whatsapp_propiedad",
        label: "WhatsApp para avisos",
        estado: waConectado ? "ok" : "warn",
        detalle: waConectado ? "Conectado" : "Pendiente vincular",
        href: "/dashboard/integraciones/whatsapp",
      },
    ]
  } else {
    rubroChecks = [
      {
        id: "maestro_productos",
        label: "Catálogo de productos",
        estado: productos >= 5 ? "ok" : productos >= 1 ? "warn" : "fail",
        detalle: `${productos} producto(s)`,
        href: "/dashboard/productos",
      },
      {
        id: "maestro_clientes",
        label: "Base de clientes",
        estado: clientes >= 1 ? "ok" : "warn",
        detalle: `${clientes} cliente(s)`,
        href: "/dashboard/clientes",
      },
    ]
  }

  const integraciones = await getIntegracionesHealthItems(empresaId)

  const allItems = [...items, ...rubroChecks, ...integraciones]
  const fails = allItems.filter((i) => i.estado === "fail")
  const listoGoLive = esPropiedad
    ? fails.length === 0 && usuarios >= 1 && rubroChecks.every((i) => i.estado !== "fail")
    : fails.length === 0 &&
      afipProd &&
      Boolean(proyecto?.fases?.["CCA-060"]?.completado) &&
      productos >= 1 &&
      usuarios >= 1

  return {
    empresaId,
    listoGoLive,
    score: scoreFromItems(allItems),
    items,
    rubroChecks,
    integraciones,
  }
}
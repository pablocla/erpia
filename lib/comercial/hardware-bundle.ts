/**
 * Pack Hardware POS — checklist de go-live (impresora, lectora, balanza, tablet).
 * Progreso en ParametroFiscal (sin bloquear si falta migración).
 */

import { prisma } from "@/lib/prisma"
import { activarProducto } from "@/lib/platform/product-lifecycle"

export const HARDWARE_BUNDLE_SKU = "pack.hardware_pos"
export const HARDWARE_BUNDLE_PRICE_ARS = 89000

export type HardwareChecklistItem = {
  id: string
  label: string
  hint: string
  done: boolean
}

const ITEMS: Omit<HardwareChecklistItem, "done">[] = [
  {
    id: "impresora_ticket",
    label: "Impresora de tickets / fiscal",
    hint: "USB o red configurada en /dashboard/pos/config",
  },
  {
    id: "lector_barras",
    label: "Lector de código de barras",
    hint: "Modo teclado (HID) probado en POS",
  },
  {
    id: "tablet_o_pc",
    label: "Tablet o PC de mostrador",
    hint: "Navegador actualizado, pantalla táctil opcional",
  },
  {
    id: "cajon_dinero",
    label: "Cajón de dinero (opcional)",
    hint: "Apertura con comando de impresora",
  },
  {
    id: "balanza",
    label: "Balanza (si vendés por peso)",
    hint: "SKU pos.balanza_peso + puerto/serial",
  },
  {
    id: "prueba_ticket",
    label: "Prueba de ticket de venta",
    hint: "Emitir ticket de prueba sin CAE o en homologación",
  },
  {
    id: "backup_wifi",
    label: "WiFi / 4G de respaldo",
    hint: "Para no parar el mostrador si cae el router",
  },
]

const CLAVE = "hardware_bundle_checklist"
const PAIS = "AR"

export async function activarHardwareBundle(empresaId: number) {
  try {
    await prisma.productoComercial.upsert({
      where: { sku: HARDWARE_BUNDLE_SKU },
      update: {
        activo: true,
        precioArs: HARDWARE_BUNDLE_PRICE_ARS,
        nombre: "Pack Hardware POS",
      },
      create: {
        sku: HARDWARE_BUNDLE_SKU,
        nombre: "Pack Hardware POS",
        descripcion: "Checklist go-live: impresora, lectora, balanza, tablet + setup",
        precioArs: HARDWARE_BUNDLE_PRICE_ARS,
        activo: true,
      },
    })
    await activarProducto(empresaId, HARDWARE_BUNDLE_SKU, "hardware_bundle")
  } catch (err) {
    console.warn("[hardware-bundle] activar:", err)
  }

  const checklist = await getHardwareChecklist(empresaId)
  return checklist
}

export async function getHardwareChecklist(empresaId: number): Promise<{
  items: HardwareChecklistItem[]
  progresoPct: number
  sku: string
  precioArs: number
}> {
  let doneIds = new Set<string>()
  try {
    const row = await prisma.parametroFiscal.findUnique({
      where: {
        empresaId_clave_pais: { empresaId, clave: CLAVE, pais: PAIS },
      },
      select: { descripcion: true },
    })
    if (row?.descripcion) {
      const parsed = JSON.parse(row.descripcion) as { done?: string[] }
      doneIds = new Set(parsed.done ?? [])
    }
  } catch {
    /* ignore */
  }

  const items = ITEMS.map((i) => ({ ...i, done: doneIds.has(i.id) }))
  const doneCount = items.filter((i) => i.done).length
  const progresoPct = Math.round((doneCount / items.length) * 100)

  return {
    items,
    progresoPct,
    sku: HARDWARE_BUNDLE_SKU,
    precioArs: HARDWARE_BUNDLE_PRICE_ARS,
  }
}

export async function setHardwareChecklistItem(
  empresaId: number,
  itemId: string,
  done: boolean,
) {
  const current = await getHardwareChecklist(empresaId)
  const doneSet = new Set(current.items.filter((i) => i.done).map((i) => i.id))
  if (done) doneSet.add(itemId)
  else doneSet.delete(itemId)

  const payload = JSON.stringify({ done: [...doneSet], updatedAt: new Date().toISOString() })
  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId, clave: CLAVE, pais: PAIS },
    },
    update: { descripcion: payload, valor: doneSet.size },
    create: {
      empresaId,
      clave: CLAVE,
      valor: doneSet.size,
      descripcion: payload,
      categoria: "comercial",
      pais: PAIS,
    },
  })

  return getHardwareChecklist(empresaId)
}

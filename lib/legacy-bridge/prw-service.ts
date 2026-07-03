import fs from "fs"
import path from "path"
import { getTechnicalBulletinBySku } from "./technical-bulletins"

export function resolvePrwAbsolutePath(rutaRepo: string): string {
  return path.join(process.cwd(), rutaRepo.replace(/\//g, path.sep))
}

export function readPrwSource(rutaRepo: string): string {
  const abs = resolvePrwAbsolutePath(rutaRepo)
  if (!fs.existsSync(abs)) {
    throw new Error(`Archivo PRW no encontrado: ${rutaRepo}`)
  }
  return fs.readFileSync(abs, "utf8")
}

export function listPrwFilesForSku(sku: string) {
  const bulletin = getTechnicalBulletinBySku(sku)
  if (!bulletin) return []
  return bulletin.archivosPrw.map((p) => ({
    archivo: p.archivo,
    rutaRepo: p.rutaRepo,
    descripcion: p.descripcion,
    ordenCompilacion: p.ordenCompilacion,
    exponeEndpoints: p.exponeEndpoints,
  }))
}
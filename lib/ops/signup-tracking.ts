/**
 * Trazabilidad de origen de alta — web, demo, provisioning (sin migración).
 */

import { prisma } from "@/lib/prisma"
import { getTrialStatus, setTrialExpiresAt, type TrialStatus } from "@/lib/comercial/trial-service"

const PAIS = "AR"

export type SignupOrigen =
  | "web_register"
  | "industry_demo"
  | "provisioning"
  | "relevamiento"
  | "manual"
  | "partner_ref"

export interface SignupMeta {
  origen: SignupOrigen | null
  origenDetalle: string | null
  demoIndustryId: string | null
  trial: TrialStatus | null
}

export async function setSignupOrigen(
  empresaId: number,
  origen: SignupOrigen,
  detalle?: string,
): Promise<void> {
  await prisma.parametroFiscal.upsert({
    where: { empresaId_clave_pais: { empresaId, clave: "signup_origen", pais: PAIS } },
    update: { descripcion: origen, valor: 1 },
    create: {
      empresaId,
      clave: "signup_origen",
      valor: 1,
      descripcion: origen,
      categoria: "comercial",
      pais: PAIS,
    },
  })

  if (detalle) {
    await prisma.parametroFiscal.upsert({
      where: { empresaId_clave_pais: { empresaId, clave: "signup_origen_detalle", pais: PAIS } },
      update: { descripcion: detalle },
      create: {
        empresaId,
        clave: "signup_origen_detalle",
        valor: 1,
        descripcion: detalle,
        categoria: "comercial",
        pais: PAIS,
      },
    })
  }
}

export function inferSignupOrigen(
  cuit: string | null | undefined,
  demoIndustryId: string | null,
): SignupOrigen | null {
  if (demoIndustryId) return "industry_demo"
  if (cuit === "20-00000000-0") return "industry_demo"
  if (cuit?.startsWith("DEMO-")) return "web_register"
  return null
}

function parseOrigen(raw: string | null | undefined): SignupOrigen | null {
  if (
    raw === "web_register" ||
    raw === "industry_demo" ||
    raw === "provisioning" ||
    raw === "relevamiento" ||
    raw === "manual" ||
    raw === "partner_ref"
  ) {
    return raw
  }
  return null
}

export async function getSignupMeta(empresaId: number): Promise<SignupMeta> {
  const [origenRow, detalleRow, demoRow, trial, empresa] = await Promise.all([
    prisma.parametroFiscal.findUnique({
      where: { empresaId_clave_pais: { empresaId, clave: "signup_origen", pais: PAIS } },
      select: { descripcion: true },
    }),
    prisma.parametroFiscal.findUnique({
      where: { empresaId_clave_pais: { empresaId, clave: "signup_origen_detalle", pais: PAIS } },
      select: { descripcion: true },
    }),
    prisma.parametroFiscal.findUnique({
      where: { empresaId_clave_pais: { empresaId, clave: "demo_industry_id", pais: PAIS } },
      select: { descripcion: true },
    }),
    getTrialStatus(empresaId),
    prisma.empresa.findUnique({ where: { id: empresaId }, select: { cuit: true } }),
  ])

  const demoIndustryId = demoRow?.descripcion ?? null
  const origen =
    parseOrigen(origenRow?.descripcion) ??
    inferSignupOrigen(empresa?.cuit ?? null, demoIndustryId)

  return {
    origen,
    origenDetalle: detalleRow?.descripcion ?? null,
    demoIndustryId,
    trial,
  }
}

export async function ensureWebSignupTrial(empresaId: number, dias = 14): Promise<void> {
  const existing = await getTrialStatus(empresaId)
  if (existing?.activo) return
  const expires = new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
  await setTrialExpiresAt(empresaId, expires, dias)
}

export async function extendTrialDays(empresaId: number, diasExtra: number): Promise<TrialStatus | null> {
  const current = await getTrialStatus(empresaId)
  const base = current?.expiresAt ? new Date(current.expiresAt) : new Date()
  const from = base.getTime() > Date.now() ? base : new Date()
  from.setDate(from.getDate() + diasExtra)
  const trialDias = (current?.trialDias ?? 14) + diasExtra
  await setTrialExpiresAt(empresaId, from, trialDias)
  return getTrialStatus(empresaId)
}

export function diasDesde(fecha: Date): number {
  return Math.floor((Date.now() - fecha.getTime()) / (24 * 60 * 60 * 1000))
}

export const ORIGEN_LABELS: Record<SignupOrigen, string> = {
  web_register: "Registro web",
  industry_demo: "Demo rubro",
  provisioning: "Provisioning",
  relevamiento: "Relevamiento",
  manual: "Manual",
  partner_ref: "Referido Partner",
}
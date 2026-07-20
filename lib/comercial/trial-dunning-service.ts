/**
 * Dunning de trial — recupera conversiones antes/al vencer.
 * Idempotente vía ParametroFiscal (dunning_trial_3d | 1d | 0d).
 */

import { prisma } from "@/lib/prisma"
import { getTrialStatus } from "@/lib/comercial/trial-service"
import { emailService } from "@/lib/email/email-service"
import { emailNotificationBody } from "@/lib/email/email-templates"
import { getSiteUrl } from "@/lib/marketing/landing-seo"

const PAIS = "AR"
const TRIAL_CLAVE = "trial_expires_at"

export type DunningWindow = 3 | 1 | 0

function dunningClave(window: DunningWindow): string {
  return `dunning_trial_${window}d`
}

export function pickDunningWindow(diasRestantes: number, expirado: boolean): DunningWindow | null {
  if (expirado || diasRestantes <= 0) return 0
  if (diasRestantes === 1) return 1
  if (diasRestantes <= 3) return 3
  return null
}

export interface DunningRunResult {
  scanned: number
  notified: number
  skipped: number
  errors: number
  details: Array<{ empresaId: number; window: DunningWindow; channel: string }>
}

async function alreadySent(empresaId: number, window: DunningWindow): Promise<boolean> {
  const row = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: { empresaId, clave: dunningClave(window), pais: PAIS },
    },
    select: { id: true },
  })
  return Boolean(row)
}

async function markSent(empresaId: number, window: DunningWindow): Promise<void> {
  const clave = dunningClave(window)
  await prisma.parametroFiscal.upsert({
    where: { empresaId_clave_pais: { empresaId, clave, pais: PAIS } },
    update: { descripcion: new Date().toISOString(), valor: 1 },
    create: {
      empresaId,
      clave,
      valor: 1,
      descripcion: new Date().toISOString(),
      categoria: "comercial",
      pais: PAIS,
    },
  })
}

function copyForWindow(
  window: DunningWindow,
  empresaNombre: string,
): { titulo: string; body: string; subject: string } {
  const site = getSiteUrl()
  const pay = `${site}/dashboard/mi-plan`
  if (window === 3) {
    return {
      subject: `${empresaNombre}: tu trial Claver vence en 3 días`,
      titulo: "Tu trial vence en 3 días",
      body: `Quedan 3 días de prueba en ${empresaNombre}. Activá el plan para no perder POS, stock y cobranzas. ${pay}`,
    }
  }
  if (window === 1) {
    return {
      subject: `${empresaNombre}: mañana vence tu trial Claver`,
      titulo: "Mañana vence tu trial",
      body: `Último día de trial en ${empresaNombre}. Suscribite ahora y seguí operando sin cortes. ${pay}`,
    }
  }
  return {
    subject: `${empresaNombre}: trial Claver vencido — activá tu plan`,
    titulo: "Trial vencido",
    body: `El trial de ${empresaNombre} venció. La libreta Fiado puede seguir gratis; los módulos de pago se reactivan con suscripción. ${pay}`,
  }
}

/**
 * Escanea empresas con trial y notifica en ventanas 3d / 1d / 0d.
 */
export async function runTrialDunning(opts?: {
  limit?: number
}): Promise<DunningRunResult> {
  const limit = opts?.limit ?? 200
  const result: DunningRunResult = {
    scanned: 0,
    notified: 0,
    skipped: 0,
    errors: 0,
    details: [],
  }

  // Trials persistidos en parametroFiscal.descripcion (ISO date)
  const rows = await prisma.parametroFiscal.findMany({
    where: { clave: TRIAL_CLAVE, pais: PAIS },
    select: { empresaId: true, descripcion: true },
    take: limit * 2,
  })

  const seen = new Set<number>()
  for (const row of rows) {
    if (seen.has(row.empresaId)) continue
    seen.add(row.empresaId)
    result.scanned++

    try {
      const trial = await getTrialStatus(row.empresaId)
      if (!trial) {
        result.skipped++
        continue
      }

      // Solo dunning si aún no hay MP autorizado
      const empresa = await prisma.empresa.findUnique({
        where: { id: row.empresaId },
        select: {
          id: true,
          nombre: true,
          email: true,
          mpSubscriptionStatus: true,
          activo: true,
        },
      })
      if (!empresa?.activo) {
        result.skipped++
        continue
      }
      if (empresa.mpSubscriptionStatus === "authorized") {
        result.skipped++
        continue
      }

      const window = pickDunningWindow(trial.diasRestantes, trial.expirado)
      if (window == null) {
        result.skipped++
        continue
      }
      if (await alreadySent(empresa.id, window)) {
        result.skipped++
        continue
      }

      const copy = copyForWindow(window, empresa.nombre)
      let channel = "alerta"

      // Alerta in-app (centro de alertas IA si existe el modelo)
      try {
        await prisma.alertaIA.create({
          data: {
            empresaId: empresa.id,
            tipo: "comercial",
            prioridad: window === 0 ? "alta" : "media",
            titulo: copy.titulo,
            descripcion: copy.body,
            accion: "Ir a Mi plan / suscribir",
            leida: false,
            resuelta: false,
          },
        })
        channel = "alerta"
      } catch {
        // Si no hay AlertaIA, igual marcamos y probamos email
      }

      if (empresa.email && emailService.isConfigured()) {
        try {
          const cta = `<p style="margin:16px 0"><a href="${getSiteUrl()}/dashboard/mi-plan" style="display:inline-block;background:#1D4ED8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Activar plan</a></p>`
          await emailService.enviar({
            to: empresa.email,
            subject: copy.subject,
            html: emailNotificationBody(copy.titulo, `<p>${copy.body}</p>${cta}`),
          })
          channel = channel === "alerta" ? "alerta+email" : "email"
        } catch (err) {
          console.warn(`[dunning] email empresa ${empresa.id}:`, err)
        }
      }

      await markSent(empresa.id, window)
      result.notified++
      result.details.push({ empresaId: empresa.id, window, channel })
    } catch (err) {
      console.error(`[dunning] empresa ${row.empresaId}:`, err)
      result.errors++
    }

    if (result.notified + result.skipped + result.errors >= limit) break
  }

  return result
}

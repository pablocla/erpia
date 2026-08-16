import { prisma } from "@/lib/prisma"

export async function getAfiliadoInfo(empresaId: number) {
  let afiliado = await prisma.afiliadoReferido.findUnique({
    where: { empresaId },
  })

  // Si no existe perfil de afiliado para el tenant, crearlo automáticamente
  if (!afiliado) {
    const codigoAfiliado = `CLAVER-${empresaId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    afiliado = await prisma.afiliadoReferido.create({
      data: {
        empresaId,
        codigoAfiliado,
      },
    })
  }

  // Buscar referidos de Nivel 1 (empresas cuyo padreAfiliadoId sea este codigo)
  const referidosNivel1 = await prisma.afiliadoReferido.findMany({
    where: { padreAfiliadoId: afiliado.codigoAfiliado },
    include: {
      empresa: { select: { id: true, nombre: true, cuit: true, createdAt: true, planHosting: true } },
    },
  })

  const totalReferidos = referidosNivel1.length
  const esGratisDePorVida = totalReferidos >= 3

  return {
    afiliado: {
      id: afiliado.id,
      codigoAfiliado: afiliado.codigoAfiliado,
      aliasMercadoPago: afiliado.aliasMercadoPago,
      saldoAcumulado: Number(afiliado.saldoAcumulado),
      totalCobrado: Number(afiliado.totalCobrado),
      comisionNivel1Pct: Number(afiliado.comisionNivel1Pct),
      comisionNivel2Pct: Number(afiliado.comisionNivel2Pct),
    },
    viralLoop: {
      totalReferidos,
      metaReferidos: 3,
      esGratisDePorVida,
      faltantesParaGratis: Math.max(0, 3 - totalReferidos),
    },
    referidos: referidosNivel1.map((r) => ({
      id: r.id,
      empresa: r.empresa.nombre,
      cuit: r.empresa.cuit,
      fechaAlta: r.empresa.createdAt,
      plan: r.empresa.planHosting,
      comisionEstimada: 29900 * 0.25, // 25% comision mensual
    })),
  }
}

export async function solicitarRetiroAfiliado(
  empresaId: number,
  aliasMercadoPago: string,
) {
  const afiliado = await prisma.afiliadoReferido.findUnique({
    where: { empresaId },
  })

  if (!afiliado) throw new Error("Perfil de afiliado no encontrado")
  const saldo = Number(afiliado.saldoAcumulado)
  if (saldo <= 0) throw new Error("No tenés saldo acumulado disponible para retirar")

  return prisma.afiliadoReferido.update({
    where: { id: afiliado.id },
    data: {
      aliasMercadoPago,
      saldoAcumulado: 0,
      totalCobrado: { increment: saldo },
    },
  })
}

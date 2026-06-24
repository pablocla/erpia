/**
 * Prisma Decimal → JSON → cliente llega como string, no como number.
 * Usar toNumber / formatARS antes de .toFixed() o operaciones aritméticas.
 */

export function toNumber(value: unknown, fallback = 0): number {
  if (value == null || value === "") return fallback
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const n = Number((value as { toNumber: () => number }).toNumber())
    return Number.isFinite(n) ? n : fallback
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function formatARS(value: unknown, fallback = 0): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value, fallback))
}

export function formatDecimal(value: unknown, digits = 2, fallback = 0): string {
  return toNumber(value, fallback).toFixed(digits)
}
const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

const arsDec = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
})

export function money(n: number, cents = false) {
  return (cents ? arsDec : ars).format(n)
}

export function compact(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(".", ",")} M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)} mil`
  return money(n)
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits).replace(".", ",")}%`
}

export function price(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

export function qty(n: number) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 4 })
}

export function dmy(iso: string) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  if (!d) return iso
  return `${d}/${m}/${y}`
}

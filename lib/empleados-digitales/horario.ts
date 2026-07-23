/** ED-23: ¿está dentro del horario local configurado? */

export function dentroDeHorarioLocal(
  horario: { from: string; to: string },
  timezone = "America/Argentina/Buenos_Aires",
  now = new Date(),
): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now)
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "12")
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0")
    const cur = hour * 60 + minute

    const [fh, fm] = horario.from.split(":").map(Number)
    const [th, tm] = horario.to.split(":").map(Number)
    const fromM = (fh || 0) * 60 + (fm || 0)
    const toM = (th || 23) * 60 + (tm || 59)

    if (fromM <= toM) return cur >= fromM && cur <= toM
    // cruza medianoche
    return cur >= fromM || cur <= toM
  } catch {
    return true
  }
}

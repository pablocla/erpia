/**
 * Comandos ESC/POS para imprimir QR en impresoras compatibles (Hasar/Epson).
 * GS ( k — modelo 2
 */

export function escposQrCommands(url: string, size = 6): Buffer {
  const data = Buffer.from(url, "utf8")
  const storeLen = data.length + 3
  const pL = storeLen & 0xff
  const pH = (storeLen >> 8) & 0xff

  const parts: Buffer[] = [
    Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]),
    data,
    Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
    Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x52, size]),
    Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x00]),
    Buffer.from("\n"),
  ]

  return Buffer.concat(parts)
}
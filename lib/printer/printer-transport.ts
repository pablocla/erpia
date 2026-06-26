/**
 * Transporte de bajo nivel hacia impresoras ESC/POS (red TCP / USB local).
 * Solo ejecutar en servidor o agente de impresión.
 */

import net from "net"

const DEFAULT_PORT = 9100
const TCP_TIMEOUT_MS = 15_000

function simularEnvio(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150))
}

/** Envía buffer o string por socket TCP (puerto RAW 9100 — estándar Epson/Hasar). */
export async function enviarPorTcp(
  host: string,
  data: Buffer | string,
  port = DEFAULT_PORT,
): Promise<void> {
  if (process.env.PRINTER_SIMULATE === "true") {
    await simularEnvio()
    return
  }

  const payload = typeof data === "string" ? Buffer.from(data, "binary") : data

  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(TCP_TIMEOUT_MS)

    socket.once("error", (err) => {
      socket.destroy()
      reject(new Error(`Impresora TCP ${host}:${port} — ${err.message}`))
    })

    socket.once("timeout", () => {
      socket.destroy()
      reject(new Error(`Timeout al conectar con impresora ${host}:${port}`))
    })

    socket.connect(port, host, () => {
      socket.write(payload, (writeErr) => {
        socket.end()
        if (writeErr) reject(writeErr)
        else resolve()
      })
    })
  })
}

/**
 * USB directo requiere agente local (Electron / servicio Windows).
 * En servidor Next.js usar conexión red o PRINTER_SIMULATE=true.
 */
export async function enviarPorUsb(_devicePath: string, _data: Buffer | string): Promise<void> {
  if (process.env.PRINTER_SIMULATE === "true") {
    await simularEnvio()
    return
  }

  const agentUrl = process.env.PRINTER_USB_AGENT_URL
  if (agentUrl) {
    const body = typeof _data === "string" ? _data : _data.toString("base64")
    const res = await fetch(`${agentUrl}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device: _devicePath, payloadBase64: body }),
    })
    if (!res.ok) {
      throw new Error(`Agente USB respondió ${res.status}`)
    }
    return
  }

  throw new Error(
    "Impresora USB: configure PRINTER_USB_AGENT_URL (agente local) o use conexión red (IP:9100).",
  )
}
/** Feedback auditivo al escanear código de barras en POS (Web Audio API) */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext()
    } catch {
      return null
    }
  }
  return audioCtx
}

export function beepEscaneoOk() {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 1200
  gain.gain.value = 0.08
  osc.start()
  osc.stop(ctx.currentTime + 0.08)
}

export function beepEscaneoError() {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 320
  gain.gain.value = 0.1
  osc.start()
  osc.stop(ctx.currentTime + 0.15)
}
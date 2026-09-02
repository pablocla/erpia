/** Confetti mínimo — evita sumar canvas-confetti al ERP. */

export type ConfettiOptions = {
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
}

export default function confetti(options: ConfettiOptions = {}) {
  if (typeof window === "undefined") return

  const particleCount = options.particleCount ?? 60
  const spread = ((options.spread ?? 70) * Math.PI) / 180
  const originX = (options.origin?.x ?? 0.5) * window.innerWidth
  const originY = (options.origin?.y ?? 0.5) * window.innerHeight

  const canvas = document.createElement("canvas")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999"
  document.body.appendChild(canvas)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    canvas.remove()
    return
  }

  const colors = ["#3DFF8B", "#22d3ee", "#a78bfa", "#f59e0b", "#ffffff"]
  const particles = Array.from({ length: particleCount }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread
    const speed = 6 + Math.random() * 8
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }
  })

  let frame = 0
  const tick = () => {
    frame += 1
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const p of particles) {
      p.vy += 0.18
      p.x += p.vx
      p.y += p.vy
      p.life -= 0.016
      if (p.life <= 0) continue
      alive = true
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.size, p.size)
    }
    if (alive && frame < 120) {
      requestAnimationFrame(tick)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(tick)
}

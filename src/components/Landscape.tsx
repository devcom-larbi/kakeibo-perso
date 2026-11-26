import { useEffect, useRef } from 'react'
import { reducedMotion } from '../lib/motion'

/**
 * Le paysage peint de l'en-tête : soleil rouge strié, Fuji enneigé, brume et poussières
 * qui dérivent, avec un grain de papier par-dessus. Dessiné sur un canvas, environ 30 images
 * par seconde, et figé si l'appareil demande moins d'animations ou si l'app est en arrière-plan.
 */

type Ctx = CanvasRenderingContext2D

function sizeCanvas(canvas: HTMLCanvasElement, scale: number, width: number, height: number): Ctx {
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  return ctx
}

/** Grain de papier, calculé une fois puis posé à chaque image */
function paintGrain(buffer: HTMLCanvasElement, width: number, height: number, scale: number) {
  const ctx = sizeCanvas(buffer, scale, width, height)
  let seed = 2611
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const count = Math.min(18000, (width * height) / 15)
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i % 2 ? '#ecc9a022' : '#0603023a'
    ctx.fillRect(random() * width, random() * height, random() * 1.7 + 0.3, random() + 0.3)
  }
}

function paintScene(ctx: Ctx, width: number, height: number, time: number) {
  const sway = Math.sin(time * 0.67)
  const rise = time === 0 ? 0 : 25 * Math.pow(1 - Math.min(1, time / 1.15), 3)
  const horizon = height * 0.7
  const radius = Math.min(height * 0.36, width * 0.215)
  const x = width * 0.755 + sway * 8
  const y = height * 0.37 + Math.sin(time * 0.52) * 5 + rise

  const sky = ctx.createLinearGradient(0, 0, width, height)
  sky.addColorStop(0, '#2a1a1a')
  sky.addColorStop(0.48, '#5d2923')
  sky.addColorStop(1, '#331918')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  // Le soleil, strié comme une estampe
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.clip()
  const sun = ctx.createLinearGradient(0, y - radius, 0, y + radius)
  sun.addColorStop(0, '#ff9373')
  sun.addColorStop(0.52, '#f15a43')
  sun.addColorStop(1, '#af3229')
  ctx.fillStyle = sun
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  for (let offset = -radius; offset <= radius; offset += 4) {
    ctx.globalAlpha = 0.15 + Math.sin(offset * 0.81) * 0.1
    ctx.fillStyle = '#5d271f'
    ctx.fillRect(x - radius, y + offset, radius * 2, 1)
  }
  ctx.restore()

  const ridge = (points: [number, number][], fill: string) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (const [px, py] of points) ctx.lineTo(px * width, py * height)
    ctx.lineTo(width, height)
    ctx.fill()
  }

  ridge(
    [[0, 0.71], [0.14, 0.6], [0.29, 0.68], [0.4, 0.51], [0.5, 0.61], [0.57, 0.54], [0.63, 0.49], [0.67, 0.4], [0.7, 0.41], [0.72, 0.38], [0.746, 0.39], [0.78, 0.51], [0.84, 0.59], [0.91, 0.62], [1, 0.54]],
    '#78382e',
  )
  ridge(
    [[0, 0.83], [0.19, 0.81], [0.34, 0.71], [0.47, 0.72], [0.57, 0.68], [0.633, 0.57], [0.681, 0.49], [0.708, 0.42], [0.739, 0.43], [0.771, 0.52], [0.817, 0.61], [0.906, 0.73], [1, 0.68]],
    '#281d20',
  )

  // La neige au sommet
  ctx.fillStyle = '#e9a18a'
  ctx.beginPath()
  ctx.moveTo(width * 0.655, height * 0.54)
  for (const [px, py] of [[0.683, 0.489], [0.708, 0.42], [0.739, 0.43], [0.766, 0.508], [0.744, 0.491], [0.736, 0.507], [0.724, 0.475], [0.702, 0.501], [0.695, 0.491], [0.681, 0.526]]) {
    ctx.lineTo(px * width, py * height)
  }
  ctx.fill()

  // La brume
  for (let i = 0; i < 6; i++) {
    const wave = width * (0.47 + (i % 3) * 0.14) + Math.sin(time * 0.72 + i) * 28
    const mist = ctx.createLinearGradient(wave - 55, 0, wave + 78, 0)
    mist.addColorStop(0, '#f7ad9400')
    mist.addColorStop(0.5, i % 2 ? '#f9aa8638' : '#ffbb9231')
    mist.addColorStop(1, '#f7ad9400')
    ctx.fillStyle = mist
    ctx.fillRect(wave - 55, horizon + i * 5, 133, i % 3 === 0 ? 2 : 1)
  }

  ridge([[0, 0.88], [0.23, 0.83], [0.39, 0.89], [0.55, 0.82], [0.67, 0.87], [0.78, 0.78], [0.88, 0.81], [1, 0.73]], '#21191a')

  // Les poussières lumineuses
  for (let i = 0; i < 12; i++) {
    const drift = (i * 0.27 + time * (0.026 + (i % 3) * 0.005)) % 1
    const px = width * (0.5 + drift * 0.49)
    const py = height * (0.21 + ((i * 0.37) % 1) * 0.52) - Math.sin(time * 0.6 + i) * 6
    ctx.globalAlpha = Math.sin(drift * Math.PI) * (0.21 + (i % 3) * 0.12)
    ctx.fillStyle = '#ffd6ac'
    ctx.fillRect(px, py, i % 4 === 0 ? 2 : 1, 1)
  }
  ctx.globalAlpha = 1
}

export function Landscape() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const grain = document.createElement('canvas')
    const started = performance.now()
    let ctx: Ctx | null = null
    let width = 0
    let height = 0
    let frame = 0
    let lastDraw = -Infinity

    const draw = (timestamp: number) => {
      if (!canvas.isConnected) return
      const animate = !reducedMotion() && !document.hidden
      if (animate) frame = requestAnimationFrame(draw)
      if (timestamp - lastDraw < 30) return
      lastDraw = timestamp
      if (!ctx) {
        const box = canvas.getBoundingClientRect()
        width = Math.max(1, box.width)
        height = Math.max(1, box.height)
        const scale = Math.min(window.devicePixelRatio || 1, 2)
        ctx = sizeCanvas(canvas, scale, width, height)
        paintGrain(grain, width, height, scale)
      }
      paintScene(ctx, width, height, animate ? (timestamp - started + 1) / 1000 : 0)
      ctx.drawImage(grain, 0, 0, width, height)
    }

    const restart = () => {
      cancelAnimationFrame(frame)
      lastDraw = -Infinity
      draw(performance.now())
    }
    const onResize = () => {
      ctx = null
      restart()
    }

    draw(started)
    const observer = new ResizeObserver(onResize)
    observer.observe(canvas)
    document.addEventListener('visibilitychange', restart)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', restart)
    }
  }, [])

  return <canvas ref={ref} className="landscape" aria-hidden="true" />
}

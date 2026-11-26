import { useEffect, useState } from 'react'
import { feedback, type Feedback } from '../lib/feedback'
import { buzz, reducedMotion } from '../lib/motion'
import { Aura } from './Aura'

const TOAST_MS = 2600
const HANKO_MS = 2900

/** Les éclaboussures d'encre autour du tampon : angle (degrés), distance, taille */
const SPLATTER = [
  [8, 112, 9],
  [52, 98, 6],
  [97, 120, 11],
  [140, 104, 7],
  [186, 116, 8],
  [228, 96, 5],
  [262, 122, 10],
  [306, 102, 6],
  [338, 118, 7],
]

/** Au moment où le tampon touche le papier, la page encaisse le choc. */
function thud() {
  buzz([14, 50, 28])
  if (reducedMotion()) return
  document.querySelectorAll<HTMLElement>('.stage, .sheet').forEach((el) =>
    el.animate(
      [
        { transform: 'none' },
        { transform: 'translateY(6px) scale(0.993)', offset: 0.18 },
        { transform: 'translateY(-2px)', offset: 0.5 },
        { transform: 'none' },
      ],
      { duration: 420, easing: 'ease-out' },
    ),
  )
}

/** Affiche la bulle de confirmation et le tampon « objectif atteint ». */
export function FeedbackLayer() {
  const [item, setItem] = useState<(Feedback & { key: number }) | null>(null)

  useEffect(() => {
    let n = 0
    return feedback.subscribe((f) => {
      n += 1
      setItem({ ...f, key: n })
      if (f.kind === 'hanko') window.setTimeout(thud, 370)
      else buzz(8)
    })
  }, [])

  useEffect(() => {
    if (!item) return
    const t = window.setTimeout(() => setItem(null), item.kind === 'hanko' ? HANKO_MS : TOAST_MS)
    return () => window.clearTimeout(t)
  }, [item])

  if (!item) return <div className="feedback-live" aria-live="polite" />

  if (item.kind === 'toast') {
    return (
      <div className="feedback-live" aria-live="polite">
        <div key={item.key} className={`island ${item.tone === 'neutral' ? 'is-neutral' : ''}`} role="status">
          <span className="island-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="12" r="11" />
              <path d={item.tone === 'neutral' ? 'M7.5 12h9' : 'M7 12.4l3.2 3.1L17 8.8'} />
            </svg>
          </span>
          <span className="island-text">
            <strong>{item.title}</strong>
            {item.detail && <span>{item.detail}</span>}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="feedback-live" aria-live="polite">
      <div key={item.key} className="hanko" role="status" onClick={() => setItem(null)}>
        <span className="hanko-lines" aria-hidden="true" />
        <span className="hanko-flash" aria-hidden="true" />
        <div className="hanko-stage">
          <span className="hanko-sfx" aria-hidden="true">
            ドン！
          </span>
          <span className="hanko-aura" aria-hidden="true">
            <Aura lightning />
          </span>
          <span className="hanko-ring" aria-hidden="true" />
          {!reducedMotion() &&
            SPLATTER.map(([angle, dist, size], i) => (
              <span
                key={i}
                className="hanko-drop"
                aria-hidden="true"
                style={{
                  ['--a' as string]: `${angle}deg`,
                  ['--r' as string]: `${dist}px`,
                  ['--s' as string]: `${size}px`,
                }}
              />
            ))}
          <svg className="hanko-seal" viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              <filter id="hanko-ink" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="warp" />
                <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough" />
                <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="2" seed="3" result="grain" />
                <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 0 0 0 3.7" result="holes" />
                <feComposite in="rough" in2="holes" operator="in" />
              </filter>
            </defs>
            <g filter="url(#hanko-ink)">
              <circle cx="80" cy="80" r="71" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="80" cy="80" r="59" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <text x="80" y="76" textAnchor="middle" className="hanko-glyph">
                達
              </text>
              <text x="80" y="124" textAnchor="middle" className="hanko-glyph">
                成
              </text>
            </g>
          </svg>
        </div>
        <p className="hanko-caption">
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
        </p>
      </div>
    </div>
  )
}

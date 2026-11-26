import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { monthSummary } from '../lib/budget'
import { RANKS, reviewMonth } from '../lib/review'
import { formatMoney } from '../lib/money'
import { ofMonth, todayISO } from '../lib/dates'
import { buzz } from '../lib/motion'
import { RankBadge } from '../screens/ReviewScreen'

/** Fissures de l'écran, tracées depuis le centre */
const CRACKS = [
  'M200 400 L150 330 L168 300 L110 220 L126 190 L60 90',
  'M200 400 L262 344 L248 300 L320 232 L306 196 L372 120',
  'M200 400 L132 452 L150 500 L70 560 L88 610 L20 700',
  'M200 400 L276 470 L262 520 L338 584 L324 640 L392 760',
  'M200 400 L204 300 L188 240 L212 150 L196 40',
]

const PARTICLES = Array.from({ length: 22 }, (_, i) => i)

interface MonthRevealProps {
  monthKey: string
  onClose: () => void
  /** Ouvre l'onglet Bilan sur ce mois */
  onOpen: () => void
}

/**
 * La révélation du bilan, au premier lancement d'un nouveau mois.
 * Façon « libération » de shōnen : l'écran se fissure, 卍解 (Bankai) apparaît, puis le rang.
 */
export function MonthReveal({ monthKey, onClose, onOpen }: MonthRevealProps) {
  const { data } = useStore()
  const review = reviewMonth(data, monthKey, todayISO())
  const s = monthSummary(data, monthKey)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const t = window.setTimeout(() => buzz([20, 60, 30, 60, 50]), 900)
    const focus = window.setTimeout(() => buttonRef.current?.focus({ preventScroll: true }), 1700)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(focus)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [])

  const rank = review.rank

  return (
    <div className={`reveal ${rank ? `rank-${rank}` : ''}`} role="dialog" aria-modal="true" aria-labelledby="reveal-title">
      <svg className="reveal-cracks" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {CRACKS.map((d, i) => (
          <path key={i} d={d} style={{ ['--i' as string]: i }} />
        ))}
      </svg>
      <span className="reveal-particles" aria-hidden="true">
        {PARTICLES.map((i) => (
          <span key={i} style={{ ['--i' as string]: i, ['--x' as string]: `${(i * 37) % 100}%` }} />
        ))}
      </span>
      <p className="reveal-bankai" aria-hidden="true">
        卍解
      </p>

      <div className="reveal-body">
        <p className="reveal-kicker" id="reveal-title">
          Bilan {ofMonth(monthKey)}
        </p>
        {rank ? (
          <>
            <RankBadge rank={rank} />
            <p className="reveal-title">{RANKS[rank].title}</p>
            <p className="reveal-line">{RANKS[rank].line}</p>
          </>
        ) : (
          <p className="reveal-title">Le mois est terminé</p>
        )}
        <dl className="reveal-stats">
          <div>
            <dt>Dépensé</dt>
            <dd>{formatMoney(s.spent)}</dd>
          </div>
          <div className={review.savedRef < 0 ? 'is-over' : 'is-good'}>
            <dt>{review.savedRef < 0 ? 'Dépassement' : 'Épargné'}</dt>
            <dd>{formatMoney(Math.abs(review.savedRef))}</dd>
          </div>
        </dl>
        <div className="reveal-actions">
          <button type="button" className="primary-button" ref={buttonRef} onClick={onOpen}>
            Voir le bilan complet
          </button>
          <button type="button" className="text-button" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

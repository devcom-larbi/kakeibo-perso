import { useRef, type PointerEvent } from 'react'
import { currentMonthKey, monthLabel, shiftMonth } from '../lib/dates'
import { IconSettings } from './icons'

const SHORT = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

/** « Oct. », ou « Janv. 2027 » quand l'année change par rapport au mois affiché */
function shortLabel(key: string, around: string) {
  const month = SHORT[Number(key.slice(5, 7)) - 1]
  return key.slice(0, 4) === around.slice(0, 4) ? month : `${month} ${key.slice(0, 4)}`
}

interface MonthNavProps {
  monthKey: string
  /** Sens du dernier changement de mois, pour faire glisser le carrousel */
  dir: number
  onChange: (key: string) => void
  onOpenSettings: () => void
  /** Sur la page Objectifs, le mois n'a pas d'importance : on montre la marque */
  hideMonth?: boolean
}

/**
 * En-tête : le carrousel des mois (le mois d'avant et d'après en bordure, comme dans Kakeibo).
 * On touche un mois voisin ou on glisse le doigt pour changer.
 */
export function MonthNav({ monthKey, dir, onChange, onOpenSettings, hideMonth }: MonthNavProps) {
  const isCurrent = monthKey === currentMonthKey()
  const prev = shiftMonth(monthKey, -1)
  const next = shiftMonth(monthKey, 1)
  const swipe = useRef<{ x: number; id: number } | null>(null)

  const onPointerDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, id: e.pointerId }
  }
  const onPointerUp = (e: PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 40) onChange(dx < 0 ? next : prev)
  }

  return (
    <header className="topbar">
      <div className="topbar-side">
        {!hideMonth && !isCurrent && (
          <button type="button" className="today-button" onClick={() => onChange(currentMonthKey())} aria-label="Revenir au mois en cours">
            Ce mois
          </button>
        )}
      </div>

      {hideMonth ? (
        <div className="brand">
          <span className="brand-seal" aria-hidden="true">
            家計
          </span>
          <span>
            Kakeibo<small>Carnet de budget</small>
          </span>
        </div>
      ) : (
        <div className="carousel" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipe.current = null)}>
          <button type="button" className="carousel-side" onClick={() => onChange(prev)} aria-label={`Mois précédent : ${monthLabel(prev)}`}>
            {shortLabel(prev, monthKey)}
          </button>
          <span className="carousel-current" aria-live="polite">
            <span key={monthKey} className="carousel-label" style={{ ['--dir' as string]: dir }}>
              {monthLabel(monthKey)}
            </span>
          </span>
          <button type="button" className="carousel-side" onClick={() => onChange(next)} aria-label={`Mois suivant : ${monthLabel(next)}`}>
            {shortLabel(next, monthKey)}
          </button>
        </div>
      )}

      <div className="topbar-side is-end">
        <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="Réglages et sauvegarde">
          <IconSettings />
        </button>
      </div>
    </header>
  )
}

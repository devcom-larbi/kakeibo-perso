import { currentMonthKey, monthLabel, shiftMonth } from '../lib/dates'
import { IconChevron, IconSettings } from './icons'

interface MonthNavProps {
  monthKey: string
  onChange: (key: string) => void
  onOpenSettings: () => void
  /** Sur la page Objectifs, le mois n'a pas d'importance */
  hideMonth?: boolean
}

export function MonthNav({ monthKey, onChange, onOpenSettings, hideMonth }: MonthNavProps) {
  const isCurrent = monthKey === currentMonthKey()
  return (
    <div className="month-nav">
      <div className="month-switch" hidden={hideMonth}>
        <button type="button" className="icon-button" onClick={() => onChange(shiftMonth(monthKey, -1))} aria-label="Mois précédent">
          <IconChevron dir="left" />
        </button>
        <span className="month-current" aria-live="polite">
          {monthLabel(monthKey)}
        </span>
        <button type="button" className="icon-button" onClick={() => onChange(shiftMonth(monthKey, 1))} aria-label="Mois suivant">
          <IconChevron />
        </button>
      </div>
      <div className="month-actions">
        {!isCurrent && !hideMonth && (
          <button
            type="button"
            className="today-button"
            onClick={() => onChange(currentMonthKey())}
            aria-label="Revenir au mois en cours"
          >
            Aujourd'hui
          </button>
        )}
        <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="Réglages et sauvegarde">
          <IconSettings />
        </button>
      </div>
    </div>
  )
}

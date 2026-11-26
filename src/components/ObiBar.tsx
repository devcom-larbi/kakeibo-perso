import { CATEGORIES } from '../lib/types'
import type { MonthSummary } from '../lib/budget'
import { formatMoney } from '../lib/money'

/**
 * Le « obi » (bandeau) : la largeur totale = budget disponible du mois,
 * chaque couleur = ce qui est parti dans un pilier, le reste est hachuré.
 */
export function ObiBar({ summary }: { summary: MonthSummary }) {
  const { available, spent, byCategory } = summary
  const scale = Math.max(available, spent, 1)
  const over = spent > available && available > 0
  const label =
    `Dépensé ${formatMoney(spent)} sur ${formatMoney(Math.max(available, 0))} disponibles. ` +
    CATEGORIES.map((c) => `${c.label} ${formatMoney(byCategory[c.id])}`).join(', ')

  return (
    <div className="obi" role="img" aria-label={label}>
      <div className="obi-track">
        {CATEGORIES.map((c) =>
          byCategory[c.id] > 0 ? (
            <span
              key={c.id}
              className="obi-seg"
              style={{ width: `${(byCategory[c.id] / scale) * 100}%`, background: `var(--cat-${c.id})` }}
            />
          ) : null,
        )}
      </div>
      {over && <span className="obi-limit" style={{ left: `${(available / scale) * 100}%` }} />}
    </div>
  )
}

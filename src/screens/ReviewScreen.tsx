import { useStore } from '../store'
import { getPlan, hasPlan, monthSummary } from '../lib/budget'
import { CATEGORIES } from '../lib/types'
import { formatMoney } from '../lib/money'
import { savedInMonth } from '../lib/goals'
import { currentMonthKey, monthName, ofMonth, shiftMonth } from '../lib/dates'

export function ReviewScreen({ monthKey }: { monthKey: string }) {
  const { data, updatePlan } = useStore()
  const s = monthSummary(data, monthKey)
  const prevKey = shiftMonth(monthKey, -1)
  const prev = monthSummary(data, prevKey)
  const hasPrev = prev.spent > 0
  const planned = hasPlan(data, monthKey)
  const savedEnough = s.actualSavings >= s.savingsGoal
  const isPast = monthKey < currentMonthKey()
  const maxCat = Math.max(...CATEGORIES.map((c) => s.byCategory[c.id]), 1)

  const improve = getPlan(data, monthKey).improve

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Bilan {ofMonth(monthKey)}</h1>
        {planned ? (
          <p className={`verdict ${savedEnough ? 'is-good' : 'is-over'}`}>
            {isPast ? (
              s.actualSavings >= 0 ? (
                <>
                  Tu as mis de côté <strong>{formatMoney(s.actualSavings)}</strong> pour {formatMoney(s.savingsGoal)} visés.{' '}
                  {savedEnough ? 'Objectif tenu.' : `Il a manqué ${formatMoney(s.savingsGoal - s.actualSavings)}.`}
                </>
              ) : (
                <>
                  Tu as dépensé <strong>{formatMoney(-s.actualSavings)}</strong> de plus que ce qui rentrait.
                </>
              )
            ) : s.actualSavings >= 0 ? (
              <>
                À ce jour, il te reste <strong>{formatMoney(s.actualSavings)}</strong> à épargner pour{' '}
                {formatMoney(s.savingsGoal)} visés.{' '}
                {savedEnough ? "L'objectif est à ta portée." : `Il manque déjà ${formatMoney(s.savingsGoal - s.actualSavings)}.`}
              </>
            ) : (
              <>
                Tu dépenses déjà <strong>{formatMoney(-s.actualSavings)}</strong> de plus que ce qui rentre.
              </>
            )}
          </p>
        ) : (
          <p className="screen-intro">Prépare d'abord le budget du mois pour voir ton bilan d'épargne.</p>
        )}
      </header>

      <ol className="questions">
        <li className="question">
          <h2>Combien d'argent avais-tu ?</h2>
          <p className="answer">{formatMoney(s.income - s.fixed)}</p>
          <p className="answer-detail">
            {formatMoney(s.income)} de revenus, moins {formatMoney(s.fixed)} de charges fixes.
          </p>
        </li>

        <li className="question">
          <h2>Combien voulais-tu épargner ?</h2>
          <p className="answer">{formatMoney(s.savingsGoal)}</p>
          {data.goals.length > 0 && (
            <p className="answer-detail">
              Mis de côté pour tes objectifs ce mois-ci : {formatMoney(savedInMonth(data.goals, monthKey))}.
            </p>
          )}
        </li>

        <li className="question">
          <h2>Combien as-tu dépensé ?</h2>
          <p className="answer">{formatMoney(s.spent)}</p>
          <ul className="cat-bars">
            {CATEGORIES.map((c) => {
              const amount = s.byCategory[c.id]
              const diff = amount - prev.byCategory[c.id]
              return (
                <li key={c.id} style={{ ['--c' as string]: `var(--cat-${c.id})` }}>
                  <span className="cat-bars-name">{c.label}</span>
                  <span className="cat-bars-amount">{formatMoney(amount)}</span>
                  <span className="cat-bars-track" aria-hidden="true">
                    <span style={{ width: `${(amount / maxCat) * 100}%` }} />
                  </span>
                  {hasPrev && (
                    <span className={`cat-bars-diff ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}`}>
                      {diff === 0 ? 'comme le mois dernier' : `${diff > 0 ? '+' : '−'} ${formatMoney(Math.abs(diff))} par rapport à ${monthName(prevKey)}`}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </li>

        <li className="question">
          <h2>
            <label htmlFor="improve">Comment peux-tu t'améliorer ?</label>
          </h2>
          <textarea
            id="improve"
            rows={5}
            value={improve}
            placeholder="Ce que tu retiens de ce mois, ce que tu changes le mois prochain…"
            onChange={(e) => updatePlan(monthKey, { improve: e.target.value })}
          />
        </li>
      </ol>
    </div>
  )
}

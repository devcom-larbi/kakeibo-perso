import { useStore } from '../store'
import { expensesOfMonth, hasPlan, monthSummary, weeklyBreakdown } from '../lib/budget'
import { CATEGORIES, type Expense } from '../lib/types'
import { formatMoney, formatMoneyShort } from '../lib/money'
import { daysInMonth, currentMonthKey, monthName, ofMonth, shortDayLabel, todayISO } from '../lib/dates'
import { ObiBar } from '../components/ObiBar'
import { ExpenseRow } from '../components/ExpenseRow'

interface MonthScreenProps {
  monthKey: string
  onOpenExpense: (e: Expense) => void
  onGoTo: (tab: 'depenses' | 'budget') => void
}

export function MonthScreen({ monthKey, onOpenExpense, onGoTo }: MonthScreenProps) {
  const { data } = useStore()
  const summary = monthSummary(data, monthKey)
  const weeks = weeklyBreakdown(data, monthKey)
  const recent = expensesOfMonth(data, monthKey).slice(0, 5)
  const planned = hasPlan(data, monthKey)
  const today = todayISO()
  const isCurrent = monthKey === currentMonthKey()
  const daysLeft = isCurrent ? daysInMonth(monthKey) - Number(today.slice(8)) + 1 : 0
  const over = summary.remaining < 0

  return (
    <div className="screen">
      <section className="hero" aria-labelledby="hero-title">
        {planned ? (
          <>
            <h1 id="hero-title" className="hero-label">
              {over ? 'Dépassement du budget' : 'Reste à dépenser'}
            </h1>
            <p className={`hero-amount ${over ? 'is-over' : ''}`}>{formatMoney(Math.abs(summary.remaining))}</p>
            <p className="hero-context">
              {formatMoney(summary.spent)} dépensés sur {formatMoney(Math.max(summary.available, 0))} disponibles
              {isCurrent && daysLeft > 0 && !over && summary.remaining > 0 && (
                <>, soit {formatMoneyShort(summary.remaining / daysLeft)} par jour jusqu'à la fin du mois</>
              )}
            </p>
            <ObiBar summary={summary} />
          </>
        ) : (
          <>
            <h1 id="hero-title" className="hero-label">
              Budget {ofMonth(monthKey)}
            </h1>
            <p className="hero-empty">
              Note tes revenus, tes charges fixes et ce que tu veux mettre de côté. L'app calcule ce qu'il te reste pour
              vivre.
            </p>
            <button type="button" className="primary-button" onClick={() => onGoTo('budget')}>
              Préparer le budget {ofMonth(monthKey)}
            </button>
          </>
        )}
      </section>

      <section className="block" aria-labelledby="pillars-title">
        <h2 id="pillars-title" className="block-title">
          Les quatre piliers
        </h2>
        <ul className="pillars">
          {CATEGORIES.map((c) => {
            const amount = summary.byCategory[c.id]
            const share = summary.spent > 0 ? Math.round((amount / summary.spent) * 100) : 0
            return (
              <li key={c.id} className="pillar" style={{ ['--c' as string]: `var(--cat-${c.id})` }}>
                <span className="pillar-name">{c.label}</span>
                <span className="pillar-amount">{formatMoney(amount)}</span>
                <span className="pillar-share">{summary.spent > 0 ? `${share} %` : c.hint}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {planned && (
        <section className="block" aria-labelledby="weeks-title">
          <h2 id="weeks-title" className="block-title">
            Semaine par semaine
          </h2>
          <ol className="weeks">
            {weeks.map((w) => {
              const isNow = today >= w.start && today <= w.end
              const ratio = w.budget > 0 ? Math.min(w.spent / w.budget, 1) : w.spent > 0 ? 1 : 0
              const weekOver = w.spent > w.budget
              return (
                <li key={w.index} className={`week ${isNow ? 'is-now' : ''} ${weekOver ? 'is-over' : ''}`}>
                  <span className="week-index">{w.index}</span>
                  <span className="week-range">
                    {w.start === w.end ? shortDayLabel(w.start) : `${shortDayLabel(w.start)} – ${shortDayLabel(w.end)}`}
                  </span>
                  <span className="week-figures">
                    {formatMoneyShort(w.spent)} <span className="week-budget">/ {formatMoneyShort(w.budget)}</span>
                  </span>
                  <span className="week-bar" aria-hidden="true">
                    <span style={{ width: `${ratio * 100}%` }} />
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="block" aria-labelledby="recent-title">
        <div className="block-head">
          <h2 id="recent-title" className="block-title">
            Dernières dépenses
          </h2>
          {recent.length > 0 && (
            <button type="button" className="text-button" onClick={() => onGoTo('depenses')}>
              Tout voir
            </button>
          )}
        </div>
        {recent.length > 0 ? (
          <ul className="ledger">
            {recent.map((e) => (
              <ExpenseRow key={e.id} expense={e} onOpen={onOpenExpense} showDate />
            ))}
          </ul>
        ) : (
          <p className="empty">Aucune dépense en {monthName(monthKey)}. Ajoute la première avec le bouton +.</p>
        )}
      </section>
    </div>
  )
}

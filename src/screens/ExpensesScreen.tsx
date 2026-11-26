import { useState } from 'react'
import { useStore } from '../store'
import { expensesOfMonth } from '../lib/budget'
import { CATEGORIES, type CategoryId, type Expense } from '../lib/types'
import { formatMoney } from '../lib/money'
import { dayLabel, monthName, ofMonth } from '../lib/dates'
import { ExpenseRow } from '../components/ExpenseRow'

interface ExpensesScreenProps {
  monthKey: string
  onOpenExpense: (e: Expense) => void
}

export function ExpensesScreen({ monthKey, onOpenExpense }: ExpensesScreenProps) {
  const { data } = useStore()
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')
  const all = expensesOfMonth(data, monthKey)
  const shown = filter === 'all' ? all : all.filter((e) => e.category === filter)
  const total = shown.reduce((t, e) => t + e.amount, 0)

  const days: { date: string; items: Expense[] }[] = []
  for (const e of shown) {
    const last = days[days.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else days.push({ date: e.date, items: [e] })
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Dépenses {ofMonth(monthKey)}</h1>
        <p className="screen-total">
          {formatMoney(total)}
          <span>
            {shown.length} {shown.length > 1 ? 'dépenses' : 'dépense'}
          </span>
        </p>
      </header>

      <div className="chips" role="group" aria-label="Filtrer par pilier">
        <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="chip"
            aria-pressed={filter === c.id}
            style={{ ['--c' as string]: `var(--cat-${c.id})` }}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {days.length === 0 ? (
        <p className="empty">
          {all.length === 0
            ? `Aucune dépense en ${monthName(monthKey)}. Ajoute la première avec le bouton +.`
            : 'Aucune dépense dans ce pilier ce mois-ci.'}
        </p>
      ) : (
        days.map((day) => (
          <section key={day.date} className="day" aria-label={dayLabel(day.date)}>
            <h2 className="day-head">
              <span>{dayLabel(day.date)}</span>
              <span className="day-total">{formatMoney(day.items.reduce((t, e) => t + e.amount, 0))}</span>
            </h2>
            <ul className="ledger">
              {day.items.map((e) => (
                <ExpenseRow key={e.id} expense={e} onOpen={onOpenExpense} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

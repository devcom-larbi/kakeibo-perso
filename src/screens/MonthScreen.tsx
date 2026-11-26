import { useStore } from '../store'
import { expensesOfMonth, hasPlan, monthSummary, weeklyBreakdown } from '../lib/budget'
import { CATEGORIES, type CategoryId, type Expense } from '../lib/types'
import { formatMoney, formatMoneyShort } from '../lib/money'
import { daysInMonth, currentMonthKey, monthName, ofMonth, shortDayLabel, todayISO } from '../lib/dates'
import { ExpenseRow } from '../components/ExpenseRow'
import { Rolling } from '../components/Rolling'
import { Landscape } from '../components/Landscape'
import { IconChevron } from '../components/icons'

interface MonthScreenProps {
  monthKey: string
  onOpenExpense: (e: Expense) => void
  onGoTo: (tab: 'depenses' | 'budget') => void
  /** Ouvre les dépenses filtrées sur un pilier */
  onPillar: (id: CategoryId) => void
}

const pct = (part: number, total: number) => (total > 0 ? Math.min(100, (part / total) * 100) : 0)

export function MonthScreen({ monthKey, onOpenExpense, onGoTo, onPillar }: MonthScreenProps) {
  const { data } = useStore()
  const s = monthSummary(data, monthKey)
  const weeks = weeklyBreakdown(data, monthKey)
  const recent = expensesOfMonth(data, monthKey).slice(0, 4)
  const planned = hasPlan(data, monthKey)
  const today = todayISO()
  const isCurrent = monthKey === currentMonthKey()
  const daysLeft = isCurrent ? daysInMonth(monthKey) - Number(today.slice(8)) + 1 : 0
  const over = s.remaining < 0
  const available = Math.max(s.available, 0)

  return (
    <div className="screen">
      <section className="hero" aria-labelledby="hero-title">
        <Landscape />
        <span className="art-seal" aria-hidden="true">
          家計簿
        </span>
        <div>
          <h1 id="hero-title" className="kicker">
            {planned ? (over ? 'Dépassement du budget' : 'Reste à vivre') : `Budget ${ofMonth(monthKey)}`}
          </h1>
          {planned ? (
            <>
              <p className={`hero-amount ${over ? 'is-over' : ''}`}>
                <Rolling value={Math.abs(s.remaining)} id="hero" />
              </p>
              <p className="hero-sub">
                {isCurrent && daysLeft > 0 && !over && s.remaining > 0
                  ? `Soit ${formatMoneyShort(s.remaining / daysLeft)} par jour jusqu'à la fin du mois.`
                  : `Budget ${ofMonth(monthKey)}, épargne${s.contributions > 0 ? ' et URSSAF' : ''} déduites.`}
              </p>
            </>
          ) : (
            <p className="hero-sub is-empty">Note tes revenus, tes charges et ton épargne : l'app calcule ce qu'il te reste pour vivre.</p>
          )}
        </div>
        {planned ? (
          <div className="hero-foot">
            <div className="row">
              <span>Dépenses du mois</span>
              <span>
                {formatMoney(s.spent)} / {formatMoney(available)}
              </span>
            </div>
            <span className={`track ${over ? 'is-over' : ''}`} aria-hidden="true">
              <span style={{ ['--fill' as string]: `${pct(s.spent, available)}%` }} />
            </span>
          </div>
        ) : (
          <button type="button" className="hero-cta" onClick={() => onGoTo('budget')}>
            Préparer mon budget <IconChevron width={18} height={18} />
          </button>
        )}
      </section>

      <div className="metrics">
        <div className="metric">
          <small>Revenus</small>
          <strong>
            <Rolling value={s.income} id={`m-in-${monthKey}`} />
          </strong>
        </div>
        <div className="metric">
          <small>{s.contributions > 0 ? 'Charges' : 'Charges fixes'}</small>
          <strong>
            <Rolling value={s.fixed + s.contributions} id={`m-fx-${monthKey}`} />
          </strong>
        </div>
        <div className="metric">
          <small>Dépenses</small>
          <strong>
            <Rolling value={s.spent} id={`m-sp-${monthKey}`} />
          </strong>
        </div>
      </div>

      <section className="block" aria-labelledby="pillars-title">
        <div className="section-head">
          <h2 id="pillars-title">Les quatre piliers</h2>
        </div>
        <div className="pillars">
          {CATEGORIES.map((c, i) => {
            const amount = s.byCategory[c.id]
            const share = Math.round(pct(amount, s.spent))
            return (
              <button
                key={c.id}
                type="button"
                className="pillar"
                style={{ ['--c' as string]: `var(--cat-${c.id})`, ['--i' as string]: i }}
                onClick={() => onPillar(c.id)}
                aria-label={`${c.label} : ${formatMoney(amount)}. Voir les dépenses`}
              >
                <span className="pillar-top">
                  <span className="stamp" aria-hidden="true">
                    {c.kanji}
                  </span>
                  <span className="pillar-name">{c.label}</span>
                </span>
                <strong className="pillar-amount">
                  <Rolling value={amount} id={`pillar-${c.id}`} />
                </strong>
                <small>{s.spent > 0 ? `${share} % des dépenses` : c.hint}</small>
                <span className="track" aria-hidden="true">
                  <span style={{ ['--fill' as string]: `${share}%` }} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {planned && (
        <section className="block" aria-labelledby="weeks-title">
          <div className="section-head">
            <h2 id="weeks-title">Semaine par semaine</h2>
          </div>
          <ol className="weeks panel">
            {weeks.map((w) => {
              const isNow = today >= w.start && today <= w.end
              const weekOver = w.spent > w.budget
              return (
                <li
                  key={w.index}
                  className={`week ${isNow ? 'is-now' : ''} ${weekOver ? 'is-over' : ''}`}
                  style={{ ['--i' as string]: w.index }}
                >
                  <span className="week-range">
                    {w.start === w.end ? shortDayLabel(w.start) : `${shortDayLabel(w.start)} – ${shortDayLabel(w.end)}`}
                  </span>
                  <span className="week-figures">
                    {formatMoneyShort(w.spent)} <span className="week-budget">/ {formatMoneyShort(w.budget)}</span>
                  </span>
                  <span className={`track ${weekOver ? 'is-over' : ''}`} aria-hidden="true">
                    <span style={{ ['--fill' as string]: `${pct(w.spent, w.budget)}%` }} />
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="block" aria-labelledby="recent-title">
        <div className="section-head">
          <h2 id="recent-title">Dernières dépenses</h2>
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

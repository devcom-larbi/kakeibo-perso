import { useStore } from '../store'
import {
  activeGoals,
  deadlineText,
  doneGoals,
  isReached,
  monthlyNeeded,
  progressOf,
  remainingFor,
  savedFor,
  totalMonthlyNeeded,
} from '../lib/goals'
import type { Goal } from '../lib/types'
import { formatMoney, formatMoneyShort } from '../lib/money'
import { currentMonthKey, monthKeyOf, monthLabel, toISODate } from '../lib/dates'
import { GoalIcon } from '../components/GoalIcon'
import { IconPlus } from '../components/icons'

interface GoalsScreenProps {
  onNewGoal: () => void
  onOpenGoal: (goal: Goal) => void
  onSave: (goal: Goal) => void
}

function GoalCard({ goal, onOpen, onSave }: { goal: Goal; onOpen: () => void; onSave: () => void }) {
  const nowKey = currentMonthKey()
  const saved = savedFor(goal)
  const progress = progressOf(goal)
  const monthly = monthlyNeeded(goal, nowKey)
  const deadline = deadlineText(goal, nowKey)
  const reached = isReached(goal)

  return (
    <article className={`goal-card ${reached ? 'is-reached' : ''}`} aria-label={goal.name}>
      <button type="button" className="goal-open" onClick={onOpen}>
        <span className="goal-icon" aria-hidden="true">
          <GoalIcon kind={goal.kind} />
        </span>
        <span className="goal-head">
          <span className="goal-name">{goal.name}</span>
          {deadline && <span className={`goal-deadline ${deadline.late ? 'is-late' : ''}`}>{deadline.text}</span>}
        </span>
        <span className="goal-bar" aria-hidden="true">
          <span style={{ width: `${progress * 100}%` }} />
        </span>
        <span className="goal-figures">
          <span className="goal-saved">{formatMoney(saved)}</span>
          <span className="goal-target">sur {formatMoney(goal.target)}</span>
          <span className="goal-percent">{Math.round(progress * 100)} %</span>
        </span>
        <span className="goal-plan">
          {reached
            ? 'Montant atteint. Tu peux le marquer comme réalisé.'
            : monthly
              ? `Encore ${formatMoneyShort(remainingFor(goal))}, soit ${formatMoneyShort(monthly)} par mois`
              : `Encore ${formatMoneyShort(remainingFor(goal))}`}
        </span>
      </button>
      <button type="button" className="goal-save" onClick={onSave}>
        <IconPlus width={18} height={18} />
        Mettre de côté
      </button>
    </article>
  )
}

export function GoalsScreen({ onNewGoal, onOpenGoal, onSave }: GoalsScreenProps) {
  const { data } = useStore()
  const nowKey = currentMonthKey()
  const active = activeGoals(data.goals)
  const done = doneGoals(data.goals)
  const totalSaved = active.reduce((t, g) => t + savedFor(g), 0)
  const totalTarget = active.reduce((t, g) => t + g.target, 0)
  const perMonth = totalMonthlyNeeded(data.goals, nowKey)

  return (
    <div className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Mes objectifs</h1>
        {active.length > 0 ? (
          <>
            <p className="screen-total">
              {formatMoney(totalSaved)}
              <span>de côté sur {formatMoney(totalTarget)}</span>
            </p>
            {perMonth > 0 && (
              <p className="goals-pace">
                Pour tenir tes dates, mets de côté <strong>{formatMoney(perMonth)}</strong> par mois.
              </p>
            )}
          </>
        ) : done.length > 0 ? (
          <p className="screen-intro">Tous tes objectifs sont réalisés. Tu peux en lancer un nouveau.</p>
        ) : (
          <p className="screen-intro">
            Un voyage, un achat, un coussin de sécurité : note ce pour quoi tu économises. L'app te dit combien mettre de
            côté chaque mois pour y arriver à temps.
          </p>
        )}
      </header>

      {active.length > 0 && (
        <div className="goals">
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} onOpen={() => onOpenGoal(g)} onSave={() => onSave(g)} />
          ))}
        </div>
      )}

      <button type="button" className={active.length ? 'add-line goal-new' : 'primary-button goal-new'} onClick={onNewGoal}>
        {active.length > 0 && <IconPlus width={18} height={18} />}
        {data.goals.length ? 'Nouvel objectif' : 'Créer mon premier objectif'}
      </button>

      {done.length > 0 && (
        <details className="goals-done">
          <summary>
            Objectifs réalisés <span>({done.length})</span>
          </summary>
          <ul className="ledger">
            {done.map((g) => (
              <li key={g.id}>
                <button type="button" className="ledger-row done-row" onClick={() => onOpenGoal(g)}>
                  <span className="goal-icon small" aria-hidden="true">
                    <GoalIcon kind={g.kind} size={18} />
                  </span>
                  <span className="ledger-text">
                    <span className="ledger-title">{g.name}</span>
                    <span className="ledger-sub">
                      Réalisé en {monthLabel(monthKeyOf(toISODate(new Date(g.doneAt ?? 0))))}
                    </span>
                  </span>
                  <span className="ledger-amount">{formatMoney(savedFor(g))}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

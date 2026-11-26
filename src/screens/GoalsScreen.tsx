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
import { Rolling } from '../components/Rolling'
import { Segmented } from '../components/Segmented'
import type { Views } from '../App'

const percent = (n: number) => `${n}\u00a0%`

interface GoalsScreenProps {
  view: Views['objectifs']
  viewDir: number
  onView: (v: Views['objectifs']) => void
  onNewGoal: () => void
  onOpenGoal: (goal: Goal) => void
  onSave: (goal: Goal) => void
}

function GoalCard({ goal, index, onOpen, onSave }: { goal: Goal; index: number; onOpen: () => void; onSave: () => void }) {
  const nowKey = currentMonthKey()
  const saved = savedFor(goal)
  const progress = progressOf(goal)
  const monthly = monthlyNeeded(goal, nowKey)
  const deadline = deadlineText(goal, nowKey)
  const reached = isReached(goal)

  return (
    <article
      className={`goal-card ${reached ? 'is-reached' : ''}`}
      aria-label={goal.name}
      style={{ ['--i' as string]: index }}
    >
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
          <span className="goal-saved">
            <Rolling value={saved} id={`card-${goal.id}`} />
          </span>
          <span className="goal-target">sur {formatMoney(goal.target)}</span>
          <span className="goal-percent">
            <Rolling value={Math.round(progress * 100)} format={percent} id={`pct-${goal.id}`} />
          </span>
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

export function GoalsScreen({ view, viewDir, onView, onNewGoal, onOpenGoal, onSave }: GoalsScreenProps) {
  const { data } = useStore()
  const nowKey = currentMonthKey()
  const active = activeGoals(data.goals)
  const done = doneGoals(data.goals)
  const totalSaved = active.reduce((t, g) => t + savedFor(g), 0)
  const totalTarget = active.reduce((t, g) => t + g.target, 0)
  const perMonth = totalMonthlyNeeded(data.goals, nowKey)

  return (
    <div className="screen">
      <header className="screen-head" data-kanji="目標">
        <h1 className="screen-title">Objectifs</h1>
        <Segmented
          label="Objectifs"
          value={view}
          onChange={onView}
          options={[
            { id: 'encours', label: `En cours${active.length ? ` (${active.length})` : ''}` },
            { id: 'realises', label: `Réalisés${done.length ? ` (${done.length})` : ''}` },
          ]}
        />
      </header>

      {view === 'encours' && (
        <div key="encours" className="substage" style={{ ['--dir' as string]: viewDir }}>
          {active.length > 0 ? (
            <>
              <div className="scouter" role="group" aria-label="Total mis de côté pour tes objectifs">
                <span className="scouter-lens" aria-hidden="true" />
                <span className="scouter-label">
                  <span aria-hidden="true">戦闘力</span> Niveau de puissance
                </span>
                <p className="scouter-value">
                  <Rolling value={totalSaved} id="goals-total" />
                </p>
                <span className="scouter-sub">de côté sur {formatMoney(totalTarget)}</span>
                {totalSaved > 900000 && <span className="scouter-over">C'est plus de 9000 !</span>}
              </div>
              {perMonth > 0 && (
                <p className="goals-pace">
                  Pour tenir tes dates, mets de côté <strong>{formatMoney(perMonth)}</strong> par mois.
                </p>
              )}
              <div className="goals">
                {active.map((g, i) => (
                  <GoalCard key={g.id} goal={g} index={i} onOpen={() => onOpenGoal(g)} onSave={() => onSave(g)} />
                ))}
              </div>
              <button type="button" className="add-line goal-new" onClick={onNewGoal}>
                <IconPlus width={18} height={18} />
                Nouvel objectif
              </button>
            </>
          ) : (
            <div className="intro-card">
              <p>
                {done.length > 0
                  ? 'Tous tes objectifs sont réalisés. Tu peux en lancer un nouveau.'
                  : "Un voyage, un achat, un coussin de sécurité : note ce pour quoi tu économises. L'app te dit combien mettre de côté chaque mois pour y arriver à temps."}
              </p>
              <button type="button" className="primary-button" onClick={onNewGoal}>
                {data.goals.length ? 'Nouvel objectif' : 'Créer mon premier objectif'}
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'realises' && (
        <div key="realises" className="substage" style={{ ['--dir' as string]: viewDir }}>
          {done.length > 0 ? (
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
          ) : (
            <p className="empty">Aucun objectif réalisé pour l'instant. Quand tu en atteins un, marque-le comme réalisé : il viendra ici.</p>
          )}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Sheet } from './Sheet'
import { IconClose } from './icons'
import type { Goal } from '../lib/types'
import { formatMoney, formatMoneyShort } from '../lib/money'
import { currentMonthKey, shortDayLabel } from '../lib/dates'
import { deadlineText, isReached, monthlyNeeded, progressOf, remainingFor, savedFor } from '../lib/goals'
import { useStore } from '../store'
import { feedback } from '../lib/feedback'
import { Rolling } from './Rolling'

interface GoalDetailSheetProps {
  goal: Goal
  onClose: () => void
  onEdit: () => void
  onContribute: (mode: 'save' | 'withdraw') => void
}

export function GoalDetailSheet({ goal, onClose, onEdit, onContribute }: GoalDetailSheetProps) {
  const { updateGoal, deleteGoal, deleteContribution } = useStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nowKey = currentMonthKey()
  const saved = savedFor(goal)
  const monthly = monthlyNeeded(goal, nowKey)
  const deadline = deadlineText(goal, nowKey)
  // Plus récent d'abord ; à date égale, le dernier ajouté d'abord (tri stable sur la liste inversée)
  const history = [...goal.contributions].reverse().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <Sheet title={goal.name} onClose={onClose}>
      <div className="goal-detail">
        <p className="goal-detail-amount">
          <Rolling value={saved} id={`detail-${goal.id}`} /> <span>sur {formatMoney(goal.target)}</span>
        </p>
        <span className="goal-bar large" aria-hidden="true">
          <span style={{ width: `${progressOf(goal) * 100}%` }} />
        </span>
        <p className="goal-detail-plan">
          {goal.doneAt
            ? 'Objectif réalisé.'
            : isReached(goal)
              ? 'Montant atteint.'
              : monthly
                ? `Encore ${formatMoney(remainingFor(goal))}, soit ${formatMoneyShort(monthly)} par mois.`
                : `Encore ${formatMoney(remainingFor(goal))}.`}
          {deadline && <> {deadline.text}.</>}
        </p>

        {!goal.doneAt && (
          <div className="button-pair">
            <button type="button" className="primary-button" onClick={() => onContribute('save')}>
              Mettre de côté
            </button>
            <button type="button" className="secondary-button" onClick={() => onContribute('withdraw')} disabled={saved <= 0}>
              Retirer
            </button>
          </div>
        )}

        <h3 className="block-title history-title">Historique</h3>
        {history.length === 0 ? (
          <p className="empty">Rien n'est encore mis de côté pour cet objectif.</p>
        ) : (
          <ul className="history">
            {history.map((c) => (
              <li key={c.id}>
                <span className="history-text">
                  <span>{c.note || (c.amount < 0 ? 'Retrait' : 'Mis de côté')}</span>
                  <span className="ledger-sub">{shortDayLabel(c.date)}</span>
                </span>
                <span className={`history-amount ${c.amount < 0 ? 'is-out' : ''}`}>
                  {c.amount < 0 ? '−' : '+'} {formatMoney(Math.abs(c.amount))}
                </span>
                <button
                  type="button"
                  className="icon-button small"
                  aria-label={`Effacer la ligne du ${shortDayLabel(c.date)}`}
                  onClick={() => deleteContribution(goal.id, c.id)}
                >
                  <IconClose />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="goal-actions">
          <button type="button" className="secondary-button" onClick={onEdit}>
            Modifier l'objectif
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              updateGoal(goal.id, { doneAt: goal.doneAt ? null : Date.now() })
              feedback.emit(
                goal.doneAt
                  ? { kind: 'toast', title: 'Objectif remis en cours', detail: goal.name, tone: 'neutral' }
                  : { kind: 'hanko', title: 'Objectif réalisé', detail: goal.name },
              )
            }}
          >
            {goal.doneAt ? 'Remettre en cours' : 'Marquer comme réalisé'}
          </button>
          <button
            type="button"
            className={`text-button danger ${confirmDelete ? 'is-armed' : ''}`}
            onClick={() => {
              if (!confirmDelete) return setConfirmDelete(true)
              deleteGoal(goal.id)
              feedback.emit({ kind: 'toast', title: 'Objectif supprimé', detail: goal.name, tone: 'neutral' })
              onClose()
            }}
          >
            {confirmDelete ? "Toucher encore pour supprimer l'objectif" : "Supprimer l'objectif"}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

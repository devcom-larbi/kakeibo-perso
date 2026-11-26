import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'
import { GoalIcon } from './GoalIcon'
import { GOAL_KINDS, type Goal, type GoalKind } from '../lib/types'
import { centsToInput, formatMoneyShort, parseMoney } from '../lib/money'
import { currentMonthKey, monthLabel, todayISO } from '../lib/dates'
import { monthlyNeeded, savedFor } from '../lib/goals'
import { useStore } from '../store'

interface GoalSheetProps {
  /** Objectif à modifier, ou null pour en créer un */
  goal: Goal | null
  onClose: () => void
}

export function GoalSheet({ goal, onClose }: GoalSheetProps) {
  const { addGoal, updateGoal } = useStore()
  const [kind, setKind] = useState<GoalKind>(goal?.kind ?? 'voyage')
  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal ? centsToInput(goal.target) : '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [initial, setInitial] = useState('')
  const [error, setError] = useState('')

  const nowKey = currentMonthKey()
  const targetCents = parseMoney(target)
  const initialCents = parseMoney(initial) ?? 0
  const validDeadline = /^\d{4}-\d{2}$/.test(deadline) ? deadline : null
  const preview =
    targetCents && validDeadline
      ? monthlyNeeded(
          {
            id: '',
            name,
            kind,
            target: targetCents,
            deadline: validDeadline,
            contributions: goal ? goal.contributions : [{ id: '', date: todayISO(), amount: initialCents, note: '' }],
            doneAt: null,
            createdAt: 0,
          },
          nowKey,
        )
      : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Donne un nom à ton objectif, par exemple « Japon en avril ».')
    if (!targetCents || targetCents <= 0) return setError('Indique le montant à atteindre, par exemple 2 500.')
    if (deadline && !validDeadline) return setError('Choisis un mois valide, ou laisse la date vide.')
    if (validDeadline && validDeadline < nowKey && !goal) return setError('Choisis un mois à venir, ou laisse la date vide.')
    if (initial && parseMoney(initial) === null) return setError('Le montant déjà de côté doit être un nombre, par exemple 300.')

    const fields = { name: name.trim(), kind, target: targetCents, deadline: validDeadline }
    if (goal) updateGoal(goal.id, fields)
    else addGoal(fields, initialCents > 0 ? { amount: initialCents, date: todayISO(), note: 'Déjà de côté' } : null)
    onClose()
  }

  const example = GOAL_KINDS.find((k) => k.id === kind)?.example

  return (
    <Sheet title={goal ? "Modifier l'objectif" : 'Nouvel objectif'} onClose={onClose}>
      <form className="expense-form" onSubmit={submit} noValidate>
        <fieldset className="kind-picker">
          <legend>Type</legend>
          {GOAL_KINDS.map((k) => (
            <label key={k.id} className="kind-option">
              <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} />
              <GoalIcon kind={k.id} />
              <span>{k.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Nom</span>
          <input
            type="text"
            value={name}
            maxLength={60}
            placeholder={example}
            autoFocus={!goal}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Montant à atteindre</span>
            <span className="field-money">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={target}
                placeholder="2 500"
                onChange={(e) => {
                  setTarget(e.target.value)
                  setError('')
                }}
              />
              <span aria-hidden="true">€</span>
            </span>
          </label>
          <label className="field field-date">
            <span>Pour quand ? (facultatif)</span>
            <input type="month" value={deadline} min={goal ? undefined : nowKey} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>

        {!goal && (
          <label className="field">
            <span>Déjà de côté (facultatif)</span>
            <span className="field-money">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={initial}
                placeholder="0"
                onChange={(e) => setInitial(e.target.value)}
              />
              <span aria-hidden="true">€</span>
            </span>
          </label>
        )}

        {preview !== null && validDeadline && (
          <p className="goal-preview">
            Il faudra mettre de côté <strong>{formatMoneyShort(preview)}</strong> par mois jusqu'en{' '}
            {monthLabel(validDeadline)}.
          </p>
        )}
        {goal && targetCents !== null && savedFor(goal) >= targetCents && (
          <p className="goal-preview">Tu as déjà mis de côté ce montant.</p>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button">
          {goal ? 'Enregistrer' : "Créer l'objectif"}
        </button>
      </form>
    </Sheet>
  )
}

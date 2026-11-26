import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'
import type { Goal } from '../lib/types'
import { formatMoney, parseMoney } from '../lib/money'
import { remainingFor, savedFor } from '../lib/goals'
import { todayISO } from '../lib/dates'
import { useStore } from '../store'
import { feedback } from '../lib/feedback'
import { useShake } from './useShake'

interface ContributionSheetProps {
  goal: Goal
  mode: 'save' | 'withdraw'
  onClose: () => void
}

export function ContributionSheet({ goal, mode, onClose }: ContributionSheetProps) {
  const { addContribution } = useStore()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const saved = savedFor(goal)
  const withdraw = mode === 'withdraw'
  const [amountRef, shakeAmount] = useShake<HTMLLabelElement>()
  const [errorRef, shakeError] = useShake<HTMLParagraphElement>()

  const fail = (message: string, onAmount = false) => {
    setError(message)
    shakeError()
    if (onAmount) shakeAmount()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const cents = parseMoney(amount)
    if (cents === null || cents <= 0) return fail('Indique un montant supérieur à 0, par exemple 50.', true)
    if (withdraw && cents > saved) return fail(`Tu ne peux pas retirer plus que les ${formatMoney(saved)} mis de côté.`, true)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Choisis une date.')
    addContribution(goal.id, { amount: withdraw ? -cents : cents, date, note: note.trim() })
    if (!withdraw && saved < goal.target && saved + cents >= goal.target) {
      feedback.emit({ kind: 'hanko', title: 'Objectif atteint', detail: goal.name })
    } else {
      feedback.emit({
        kind: 'toast',
        title: withdraw ? `${formatMoney(cents)} retirés` : `${formatMoney(cents)} mis de côté`,
        detail: goal.name,
        tone: withdraw ? 'neutral' : 'good',
      })
    }
    onClose()
  }

  return (
    <Sheet title={withdraw ? `Retirer de « ${goal.name} »` : `Mettre de côté pour « ${goal.name} »`} onClose={onClose}>
      <form className="expense-form" onSubmit={submit} noValidate>
        <label className="amount-field" ref={amountRef}>
          <span className="visually-hidden">Montant en euros</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={amount}
            style={{ width: `${Math.max(amount.length, 4) + 0.3}ch` }}
            autoFocus
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
          />
          <span aria-hidden="true">€</span>
        </label>
        <p className="goal-preview">
          {withdraw
            ? `${formatMoney(saved)} sont de côté pour cet objectif.`
            : remainingFor(goal) > 0
              ? `Il reste ${formatMoney(remainingFor(goal))} pour atteindre ${formatMoney(goal.target)}.`
              : 'Le montant est déjà atteint, tu peux continuer à mettre de côté.'}
        </p>

        <div className="field-row">
          <label className="field">
            <span>Note</span>
            <input
              type="text"
              value={note}
              maxLength={80}
              placeholder={withdraw ? 'Ex. billets d’avion' : 'Ex. prime de fin d’année'}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label className="field field-date">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {error && (
          <p className="form-error" role="alert" ref={errorRef}>
            {error}
          </p>
        )}

        <button type="submit" className="primary-button">
          {withdraw ? 'Retirer' : 'Mettre de côté'}
        </button>
      </form>
    </Sheet>
  )
}

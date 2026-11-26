import { useState, type FormEvent } from 'react'
import { Sheet } from './Sheet'
import { CATEGORIES, type CategoryId, type Expense } from '../lib/types'
import { centsToInput, formatMoney, parseMoney } from '../lib/money'
import { useStore } from '../store'
import { feedback } from '../lib/feedback'
import { useShake } from './useShake'

interface ExpenseSheetProps {
  /** Dépense à modifier, ou null pour en ajouter une */
  expense: Expense | null
  defaultDate: string
  onClose: () => void
}

export function ExpenseSheet({ expense, defaultDate, onClose }: ExpenseSheetProps) {
  const { addExpense, updateExpense, deleteExpense } = useStore()
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amount) : '')
  const [category, setCategory] = useState<CategoryId>(expense?.category ?? 'survie')
  const [note, setNote] = useState(expense?.note ?? '')
  const [date, setDate] = useState(expense?.date ?? defaultDate)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    if (cents === null || cents <= 0) return fail('Indique un montant supérieur à 0, par exemple 12,50.', true)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail('Choisis une date.')
    const payload = { amount: cents, category, note: note.trim(), date }
    if (expense) updateExpense(expense.id, payload)
    else addExpense(payload)
    const label = CATEGORIES.find((c) => c.id === category)?.label ?? ''
    feedback.emit({
      kind: 'toast',
      title: expense ? 'Dépense modifiée' : 'Dépense ajoutée',
      detail: `${formatMoney(cents)} en ${label}`,
    })
    onClose()
  }

  return (
    <Sheet title={expense ? 'Modifier la dépense' : 'Nouvelle dépense'} onClose={onClose}>
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
            autoFocus={!expense}
            onChange={(e) => {
              setAmount(e.target.value)
              setError('')
            }}
            aria-invalid={!!error}
            aria-describedby={error ? 'expense-error' : undefined}
          />
          <span aria-hidden="true">€</span>
        </label>

        <fieldset className="category-picker">
          <legend>Pilier</legend>
          {CATEGORIES.map((c) => (
            <label key={c.id} className="category-option" data-kanji={c.kanji} style={{ ['--c' as string]: `var(--cat-${c.id})` }}>
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={category === c.id}
                onChange={() => setCategory(c.id)}
              />
              <span className="category-option-label">{c.label}</span>
              <span className="category-option-hint">{c.hint}</span>
            </label>
          ))}
        </fieldset>

        <div className="field-row">
          <label className="field">
            <span>Note</span>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. courses du marché" maxLength={80} />
          </label>
          <label className="field field-date">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        {error && (
          <p className="form-error" id="expense-error" role="alert" ref={errorRef}>
            {error}
          </p>
        )}

        <button type="submit" className="primary-button">
          {expense ? 'Enregistrer' : 'Ajouter la dépense'}
        </button>

        {expense && (
          <button
            type="button"
            className={`text-button danger ${confirmDelete ? 'is-armed' : ''}`}
            onClick={() => {
              if (!confirmDelete) return setConfirmDelete(true)
              deleteExpense(expense.id)
              feedback.emit({ kind: 'toast', title: 'Dépense supprimée', tone: 'neutral' })
              onClose()
            }}
          >
            {confirmDelete ? 'Toucher encore pour supprimer' : 'Supprimer la dépense'}
          </button>
        )}
      </form>
    </Sheet>
  )
}

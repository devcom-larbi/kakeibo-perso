import { categoryById, type Expense } from '../lib/types'
import { formatMoney } from '../lib/money'
import { shortDayLabel } from '../lib/dates'

interface ExpenseRowProps {
  expense: Expense
  onOpen: (e: Expense) => void
  showDate?: boolean
}

export function ExpenseRow({ expense, onOpen, showDate }: ExpenseRowProps) {
  const cat = categoryById(expense.category)
  return (
    <li>
      <button type="button" className="ledger-row" onClick={() => onOpen(expense)}>
        <span className="ledger-mark" style={{ background: `var(--cat-${cat.id})` }} aria-hidden="true" />
        <span className="ledger-text">
          <span className="ledger-title">{expense.note || cat.label}</span>
          <span className="ledger-sub">
            {cat.label}
            {showDate ? `, ${shortDayLabel(expense.date)}` : ''}
          </span>
        </span>
        <span className="ledger-amount">{formatMoney(expense.amount)}</span>
      </button>
    </li>
  )
}

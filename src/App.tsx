import { useState, type ComponentType, type SVGProps } from 'react'
import { useStore } from './store'
import type { Expense } from './lib/types'
import { currentMonthKey, firstDayOfMonth, todayISO } from './lib/dates'
import { MonthNav } from './components/MonthNav'
import { ExpenseSheet } from './components/ExpenseSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { IconBudget, IconList, IconMonth, IconPlus, IconReview } from './components/icons'
import { MonthScreen } from './screens/MonthScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import { BudgetScreen } from './screens/BudgetScreen'
import { ReviewScreen } from './screens/ReviewScreen'

type Tab = 'mois' | 'depenses' | 'budget' | 'bilan'

type SheetState = { kind: 'expense'; expense: Expense | null } | { kind: 'settings' } | null

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'mois', label: 'Mois', Icon: IconMonth },
  { id: 'depenses', label: 'Dépenses', Icon: IconList },
  { id: 'budget', label: 'Budget', Icon: IconBudget },
  { id: 'bilan', label: 'Bilan', Icon: IconReview },
]

export function App() {
  const { saveError } = useStore()
  const [tab, setTab] = useState<Tab>('mois')
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [sheet, setSheet] = useState<SheetState>(null)

  const openExpense = (expense: Expense | null) => setSheet({ kind: 'expense', expense })
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : firstDayOfMonth(monthKey)
  const goTo = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="app">
      <MonthNav monthKey={monthKey} onChange={setMonthKey} onOpenSettings={() => setSheet({ kind: 'settings' })} />

      {saveError && (
        <p className="save-error" role="alert">
          L'enregistrement sur cet appareil a échoué. Télécharge une sauvegarde depuis les réglages.
        </p>
      )}

      <main>
        {tab === 'mois' && <MonthScreen monthKey={monthKey} onOpenExpense={openExpense} onGoTo={goTo} />}
        {tab === 'depenses' && <ExpensesScreen monthKey={monthKey} onOpenExpense={openExpense} />}
        {tab === 'budget' && <BudgetScreen monthKey={monthKey} />}
        {tab === 'bilan' && <ReviewScreen monthKey={monthKey} />}
      </main>

      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.slice(0, 2).map(({ id, label, Icon }) => (
          <button key={id} type="button" className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => goTo(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
        <button type="button" className="tab-add" onClick={() => openExpense(null)} aria-label="Ajouter une dépense">
          <IconPlus width={28} height={28} />
        </button>
        {TABS.slice(2).map(({ id, label, Icon }) => (
          <button key={id} type="button" className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => goTo(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {sheet?.kind === 'expense' && (
        <ExpenseSheet expense={sheet.expense} defaultDate={defaultDate} onClose={() => setSheet(null)} />
      )}
      {sheet?.kind === 'settings' && <SettingsSheet onClose={() => setSheet(null)} />}
    </div>
  )
}

import { useState, type ComponentType, type SVGProps } from 'react'
import { useStore } from './store'
import type { Expense, Goal } from './lib/types'
import { currentMonthKey, firstDayOfMonth, todayISO } from './lib/dates'
import { MonthNav } from './components/MonthNav'
import { ExpenseSheet } from './components/ExpenseSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { GoalSheet } from './components/GoalSheet'
import { GoalDetailSheet } from './components/GoalDetailSheet'
import { ContributionSheet } from './components/ContributionSheet'
import { IconBudget, IconGoal, IconList, IconMonth, IconPlus, IconReview } from './components/icons'
import { MonthScreen } from './screens/MonthScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import { BudgetScreen } from './screens/BudgetScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { GoalsScreen } from './screens/GoalsScreen'

type Tab = 'mois' | 'depenses' | 'budget' | 'bilan' | 'objectifs'

type SheetState =
  | { kind: 'expense'; expense: Expense | null }
  | { kind: 'settings' }
  | { kind: 'goal-form'; goalId: string | null; back?: SheetState }
  | { kind: 'goal'; goalId: string }
  | { kind: 'contribution'; goalId: string; mode: 'save' | 'withdraw'; back?: SheetState }
  | null

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'mois', label: 'Mois', Icon: IconMonth },
  { id: 'depenses', label: 'Dépenses', Icon: IconList },
  { id: 'budget', label: 'Budget', Icon: IconBudget },
  { id: 'bilan', label: 'Bilan', Icon: IconReview },
  { id: 'objectifs', label: 'Objectifs', Icon: IconGoal },
]

export function App() {
  const { data, saveError } = useStore()
  const [tab, setTab] = useState<Tab>('mois')
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [sheet, setSheet] = useState<SheetState>(null)

  const openExpense = (expense: Expense | null) => setSheet({ kind: 'expense', expense })
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : firstDayOfMonth(monthKey)
  const goTo = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }
  const findGoal = (id: string): Goal | undefined => data.goals.find((g) => g.id === id)
  const closeTo = (back?: SheetState) => () => setSheet(back ?? null)

  const renderSheet = () => {
    if (!sheet) return null
    switch (sheet.kind) {
      case 'expense':
        return <ExpenseSheet expense={sheet.expense} defaultDate={defaultDate} onClose={() => setSheet(null)} />
      case 'settings':
        return <SettingsSheet onClose={() => setSheet(null)} />
      case 'goal-form':
        return <GoalSheet goal={sheet.goalId ? findGoal(sheet.goalId) ?? null : null} onClose={closeTo(sheet.back)} />
      case 'goal': {
        const goal = findGoal(sheet.goalId)
        if (!goal) return null
        const back: SheetState = { kind: 'goal', goalId: goal.id }
        return (
          <GoalDetailSheet
            goal={goal}
            onClose={() => setSheet(null)}
            onEdit={() => setSheet({ kind: 'goal-form', goalId: goal.id, back })}
            onContribute={(mode) => setSheet({ kind: 'contribution', goalId: goal.id, mode, back })}
          />
        )
      }
      case 'contribution': {
        const goal = findGoal(sheet.goalId)
        if (!goal) return null
        return <ContributionSheet goal={goal} mode={sheet.mode} onClose={closeTo(sheet.back)} />
      }
    }
  }

  return (
    <div className="app">
      <MonthNav
        monthKey={monthKey}
        onChange={setMonthKey}
        onOpenSettings={() => setSheet({ kind: 'settings' })}
        hideMonth={tab === 'objectifs'}
      />

      {saveError && (
        <p className="save-error" role="alert">
          L'enregistrement sur cet appareil a échoué. Télécharge une sauvegarde depuis les réglages.
        </p>
      )}

      <main>
        {tab === 'mois' && <MonthScreen monthKey={monthKey} onOpenExpense={openExpense} onGoTo={goTo} />}
        {tab === 'depenses' && <ExpensesScreen monthKey={monthKey} onOpenExpense={openExpense} />}
        {tab === 'budget' && <BudgetScreen monthKey={monthKey} onGoToGoals={() => goTo('objectifs')} />}
        {tab === 'bilan' && <ReviewScreen monthKey={monthKey} />}
        {tab === 'objectifs' && (
          <GoalsScreen
            onNewGoal={() => setSheet({ kind: 'goal-form', goalId: null })}
            onOpenGoal={(g) => setSheet({ kind: 'goal', goalId: g.id })}
            onSave={(g) => setSheet({ kind: 'contribution', goalId: g.id, mode: 'save' })}
          />
        )}
      </main>

      {tab !== 'objectifs' && (
        <button type="button" className="fab" onClick={() => openExpense(null)} aria-label="Ajouter une dépense">
          <IconPlus width={28} height={28} />
        </button>
      )}

      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => goTo(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {renderSheet()}
    </div>
  )
}

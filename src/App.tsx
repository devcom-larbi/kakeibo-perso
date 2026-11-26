import { Fragment, useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { useStore } from './store'
import type { CategoryId, Expense, Goal } from './lib/types'
import { currentMonthKey, firstDayOfMonth, shiftMonth, todayISO } from './lib/dates'
import { reviewMonth } from './lib/review'
import { reducedMotion, replayClass } from './lib/motion'
import { MonthNav } from './components/MonthNav'
import { ExpenseSheet } from './components/ExpenseSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { GoalSheet } from './components/GoalSheet'
import { GoalDetailSheet } from './components/GoalDetailSheet'
import { ContributionSheet } from './components/ContributionSheet'
import { SheetPhaseContext, type SheetPhase } from './components/Sheet'
import { FeedbackLayer } from './components/FeedbackLayer'
import { ActivitySheet } from './components/ActivitySheet'
import { SubscriptionSheet } from './components/SubscriptionSheet'
import { IconCalendar, IconPlus, IconRank, IconReceipt, IconTarget, IconWallet } from './components/icons'
import { MonthReveal } from './components/MonthReveal'
import { MonthScreen } from './screens/MonthScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import { BudgetScreen } from './screens/BudgetScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { GoalsScreen } from './screens/GoalsScreen'

type Tab = 'mois' | 'depenses' | 'budget' | 'bilan' | 'objectifs'

type SheetState =
  | { kind: 'expense'; expense: Expense | null }
  | { kind: 'settings' }
  | { kind: 'subscriptions' }
  | { kind: 'activity'; back?: SheetState }
  | { kind: 'goal-form'; goalId: string | null; back?: SheetState }
  | { kind: 'goal'; goalId: string }
  | { kind: 'contribution'; goalId: string; mode: 'save' | 'withdraw'; back?: SheetState }
  | null

type OpenSheet = Exclude<SheetState, null>

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'mois', label: 'Mois', Icon: IconCalendar },
  { id: 'depenses', label: 'Dépenses', Icon: IconReceipt },
  { id: 'budget', label: 'Budget', Icon: IconWallet },
  { id: 'bilan', label: 'Bilan', Icon: IconRank },
  { id: 'objectifs', label: 'Objectifs', Icon: IconTarget },
]

const tabIndex = (t: Tab) => TABS.findIndex((x) => x.id === t)

/** Les sous-pages de chaque onglet (les sous-onglets en haut de page) */
export interface Views {
  depenses: CategoryId | 'all'
  budget: 'prevu' | 'abonnements' | 'pro'
  bilan: 'bilan' | 'details'
  objectifs: 'encours' | 'realises'
}

const VIEW_ORDER: { [K in keyof Views]: Views[K][] } = {
  depenses: ['all', 'survie', 'loisirs', 'culture', 'imprevus'],
  budget: ['prevu', 'abonnements', 'pro'],
  bilan: ['bilan', 'details'],
  objectifs: ['encours', 'realises'],
}

/** Boutons qui font une goutte d'énergie à l'endroit touché */
const RIPPLE = '.primary-button, .goal-save'

export function App() {
  const { data, saveError, setReviewSeen } = useStore()
  const [tab, setTab] = useState<Tab>('mois')
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [sheet, setSheet] = useState<SheetState>(null)
  /** Sens du dernier déplacement (onglet ou mois) : -1 vers la gauche, 1 vers la droite */
  const [dir, setDir] = useState(0)
  const [views, setViews] = useState<Views>({ depenses: 'all', budget: 'prevu', bilan: 'bilan', objectifs: 'encours' })
  const [viewDir, setViewDir] = useState(0)
  const setView_ = <K extends keyof Views>(key: K, value: Views[K]) => {
    const order = VIEW_ORDER[key] as Views[K][]
    setViewDir(Math.sign(order.indexOf(value) - order.indexOf(views[key])))
    setViews((v) => ({ ...v, [key]: value }))
  }
  // Nouveau mois : le bilan du mois écoulé se révèle tout seul, une fois
  const [reveal, setReveal] = useState<string | null>(() => {
    const prevKey = shiftMonth(currentMonthKey(), -1)
    if (data.settings.reviewSeen === prevKey) return null
    return reviewMonth(data, prevKey, todayISO()).status === 'done' ? prevKey : null
  })
  const closeReveal = () => {
    if (reveal && (!data.settings.reviewSeen || reveal > data.settings.reviewSeen)) setReviewSeen(reveal)
    setReveal(null)
  }

  // Le panneau reste affiché le temps de son animation de fermeture
  const [view, setView] = useState<{ sheet: OpenSheet; phase: SheetPhase; key: number } | null>(null)
  const [prevSheet, setPrevSheet] = useState<SheetState>(null)
  if (sheet !== prevSheet) {
    setPrevSheet(sheet)
    if (sheet === null) {
      if (view) setView({ ...view, phase: 'closing' })
    } else {
      const forward = 'back' in sheet && !!sheet.back
      const phase: SheetPhase = !view || view.phase === 'closing' ? 'enter' : forward ? 'forward' : 'back'
      setView({ sheet, phase, key: (view?.key ?? 0) + 1 })
    }
  }

  useEffect(() => {
    if (view?.phase !== 'closing') return
    const t = window.setTimeout(() => setView(null), reducedMotion() ? 0 : 300)
    return () => window.clearTimeout(t)
  }, [view])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(RIPPLE) as HTMLElement | null
      if (!el || reducedMotion()) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--rx', `${e.clientX - r.left}px`)
      el.style.setProperty('--ry', `${e.clientY - r.top}px`)
      replayClass(el, 'is-rippling')
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const openExpense = (expense: Expense | null) => setSheet({ kind: 'expense', expense })
  const defaultDate = monthKey === currentMonthKey() ? todayISO() : firstDayOfMonth(monthKey)
  const goTo = (next: Tab) => {
    if (next === tab) return
    setDir(Math.sign(tabIndex(next) - tabIndex(tab)))
    setTab(next)
    window.scrollTo({ top: 0 })
  }
  const changeMonth = (next: string) => {
    setDir(next > monthKey ? 1 : -1)
    setMonthKey(next)
  }
  const findGoal = (id: string): Goal | undefined => data.goals.find((g) => g.id === id)
  const closeTo = (back?: SheetState) => () => setSheet(back ?? null)

  const renderSheet = (s: OpenSheet) => {
    switch (s.kind) {
      case 'expense':
        return <ExpenseSheet expense={s.expense} defaultDate={defaultDate} onClose={() => setSheet(null)} />
      case 'settings':
        return (
          <SettingsSheet
            onClose={() => setSheet(null)}
            onOpenActivity={() => setSheet({ kind: 'activity', back: { kind: 'settings' } })}
          />
        )
      case 'subscriptions':
        return <SubscriptionSheet monthKey={monthKey} onClose={() => setSheet(null)} />
      case 'activity':
        return <ActivitySheet onClose={closeTo(s.back)} />
      case 'goal-form':
        return <GoalSheet goal={s.goalId ? findGoal(s.goalId) ?? null : null} onClose={closeTo(s.back)} />
      case 'goal': {
        const goal = findGoal(s.goalId)
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
        const goal = findGoal(s.goalId)
        if (!goal) return null
        return <ContributionSheet goal={goal} mode={s.mode} onClose={closeTo(s.back)} />
      }
    }
  }

  const stageKey = tab === 'objectifs' ? tab : `${tab}-${monthKey}`
  const fabAway = tab === 'objectifs'

  return (
    <div className="app">
      <MonthNav
        monthKey={monthKey}
        dir={dir}
        onChange={changeMonth}
        onOpenSettings={() => setSheet({ kind: 'settings' })}
        hideMonth={tab === 'objectifs'}
      />

      {saveError && (
        <p className="save-error" role="alert">
          L'enregistrement sur cet appareil a échoué. Télécharge une sauvegarde depuis les réglages.
        </p>
      )}

      <main key={stageKey} className="stage" style={{ ['--dir' as string]: dir }}>
        {tab === 'mois' && (
          <MonthScreen
            monthKey={monthKey}
            onOpenExpense={openExpense}
            onGoTo={goTo}
            onPillar={(c) => {
              setViews((v) => ({ ...v, depenses: c }))
              goTo('depenses')
            }}
          />
        )}
        {tab === 'depenses' && (
          <ExpensesScreen
            monthKey={monthKey}
            filter={views.depenses}
            onFilter={(f) => setView_('depenses', f)}
            onOpenExpense={openExpense}
          />
        )}
        {tab === 'budget' && (
          <BudgetScreen
            monthKey={monthKey}
            view={views.budget}
            viewDir={viewDir}
            onView={(v) => setView_('budget', v)}
            onGoToGoals={() => goTo('objectifs')}
            onOpenSubscriptions={() => setSheet({ kind: 'subscriptions' })}
            onOpenActivity={() => setSheet({ kind: 'activity' })}
          />
        )}
        {tab === 'bilan' && (
          <ReviewScreen monthKey={monthKey} view={views.bilan} viewDir={viewDir} onView={(v) => setView_('bilan', v)} onReplay={setReveal} />
        )}
        {tab === 'objectifs' && (
          <GoalsScreen
            view={views.objectifs}
            viewDir={viewDir}
            onView={(v) => setView_('objectifs', v)}
            onNewGoal={() => setSheet({ kind: 'goal-form', goalId: null })}
            onOpenGoal={(g) => setSheet({ kind: 'goal', goalId: g.id })}
            onSave={(g) => setSheet({ kind: 'contribution', goalId: g.id, mode: 'save' })}
          />
        )}
      </main>

      <button
        type="button"
        className={`fab ${fabAway ? 'is-away' : ''}`}
        onClick={(e) => {
          if (!reducedMotion()) replayClass(e.currentTarget, 'is-charging')
          openExpense(null)
        }}
        aria-label="Ajouter une dépense"
        aria-hidden={fabAway || undefined}
        inert={fabAway}
      >
        <IconPlus width={28} height={28} />
      </button>

      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => goTo(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {view && (
        <SheetPhaseContext.Provider value={view.phase}>
          <Fragment key={view.key}>{renderSheet(view.sheet)}</Fragment>
        </SheetPhaseContext.Provider>
      )}

      {reveal && (
        <MonthReveal
          monthKey={reveal}
          onClose={closeReveal}
          onOpen={() => {
            const key = reveal
            closeReveal()
            setMonthKey(key)
            setDir(0)
            setTab('bilan')
            window.scrollTo({ top: 0 })
          }}
        />
      )}

      <FeedbackLayer />
    </div>
  )
}

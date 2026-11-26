import { createContext, useContext, useEffect, useLayoutEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { IconClose } from './icons'
import { reducedMotion } from '../lib/motion'

/**
 * enter : le panneau monte du bas
 * forward / back : on passe d'un panneau à l'autre (le contenu glisse sur le côté)
 * closing : le panneau redescend avant de disparaître
 */
export type SheetPhase = 'enter' | 'forward' | 'back' | 'closing'
export const SheetPhaseContext = createContext<SheetPhase>('enter')

/** Hauteur du dernier panneau affiché, pour animer le changement de taille entre deux panneaux. */
let lastPanelHeight = 0

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Panneau qui monte du bas de l'écran (formulaires, réglages). On peut le tirer vers le bas pour le fermer. */
export function Sheet({ title, onClose, children }: SheetProps) {
  const phase = useContext(SheetPhaseContext)
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const drag = useRef<{ id: number; y: number; t: number; dy: number; v: number } | null>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [])

  // Passage d'un panneau à l'autre : la hauteur glisse de l'ancienne à la nouvelle
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel || (phase !== 'forward' && phase !== 'back') || !lastPanelHeight || reducedMotion()) return
    const to = panel.offsetHeight
    if (Math.abs(to - lastPanelHeight) < 2) return
    panel.animate([{ height: `${lastPanelHeight}px` }, { height: `${to}px` }], {
      duration: 420,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    })
  }, []) // seulement à l'ouverture

  useLayoutEffect(() => {
    if (panelRef.current) lastPanelHeight = panelRef.current.offsetHeight
  })

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (phase === 'closing' || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return
    drag.current = { id: e.pointerId, y: e.clientY, t: e.timeStamp, dy: 0, v: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (panelRef.current) panelRef.current.style.transition = 'none'
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    const panel = panelRef.current
    if (!d || e.pointerId !== d.id || !panel) return
    const raw = e.clientY - d.y
    const dy = raw < 0 ? -Math.sqrt(-raw) * 2 : raw // résistance quand on tire vers le haut
    const dt = Math.max(e.timeStamp - d.t, 1)
    d.v = d.v * 0.4 + ((dy - d.dy) / dt) * 0.6
    d.dy = dy
    d.t = e.timeStamp
    panel.style.transform = `translateY(${dy}px)`
    backdropRef.current?.style.setProperty('--shade', String(Math.max(0, 1 - Math.max(dy, 0) / panel.offsetHeight)))
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    const panel = panelRef.current
    if (!d || e.pointerId !== d.id || !panel) return
    drag.current = null
    if (d.dy > Math.min(140, panel.offsetHeight * 0.3) || (d.v > 0.45 && d.dy > 24)) {
      onCloseRef.current() // la fermeture repart de la position du doigt
      return
    }
    panel.style.transition = 'transform 460ms cubic-bezier(0.34, 1.3, 0.64, 1)'
    panel.style.transform = ''
    backdropRef.current?.style.removeProperty('--shade')
  }

  const swap = phase === 'forward' || phase === 'back'

  return (
    <div
      ref={backdropRef}
      className={`sheet-backdrop ${swap ? 'is-swap' : `is-${phase}`}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`sheet is-${phase}`} role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={panelRef} tabIndex={-1}>
        <header
          className="sheet-head"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="sheet-grab" aria-hidden="true" />
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fermer">
            <IconClose />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

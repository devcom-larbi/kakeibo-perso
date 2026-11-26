import { useEffect, useRef, type ReactNode } from 'react'
import { IconClose } from './icons'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Panneau qui monte du bas de l'écran (formulaires, réglages). */
export function Sheet({ title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={panelRef} tabIndex={-1}>
        <header className="sheet-head">
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

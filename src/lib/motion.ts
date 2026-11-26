/** Petits outils partagés par les animations. */

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Rejoue une animation CSS liée à une classe : retire, force le recalcul, remet. */
export function replayClass(el: Element | null | undefined, cls: string) {
  if (!el) return
  el.classList.remove(cls)
  void (el as HTMLElement).offsetWidth
  el.classList.add(cls)
}

/** Petite vibration quand l'appareil le permet (Android ; ignoré sur iPhone). */
export function buzz(pattern: number | number[]) {
  if (reducedMotion()) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* pas grave */
  }
}

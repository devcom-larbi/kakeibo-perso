/**
 * Retours visuels après une action : une bulle en haut de l'écran (toast)
 * ou le tampon « 達成 » quand un objectif est atteint.
 * Les formulaires émettent, la couche FeedbackLayer affiche.
 */
export type Feedback =
  | { kind: 'toast'; title: string; detail?: string; tone?: 'good' | 'neutral' }
  | { kind: 'hanko'; title: string; detail: string }

type Listener = (f: Feedback) => void
const listeners = new Set<Listener>()

export const feedback = {
  emit(f: Feedback) {
    listeners.forEach((l) => l(f))
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

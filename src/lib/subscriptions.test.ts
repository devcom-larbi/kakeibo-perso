import { describe, expect, it } from 'vitest'
import { monogram, monthlyPrice, searchSubscriptions } from './subscriptions'
import { formatRate, parseRate } from './money'

describe('abonnements', () => {
  it('ramène chaque prix à un montant mensuel', () => {
    expect(monthlyPrice({ label: 'Annuel', price: 11000, billing: 'an' })).toBe(917)
    // Basic-Fit facture toutes les 4 semaines : 13 prélèvements par an
    expect(monthlyPrice({ label: 'Comfort', price: 2499, billing: '4sem' })).toBe(2707)
    expect(monthlyPrice({ label: 'Pro', price: 2160, billing: 'mois' })).toBe(2160)
  })

  it('trouve un abonnement sans tenir compte des accents ni des majuscules', () => {
    expect(searchSubscriptions('basic').map((s) => s.id)).toContain('basic-fit')
    expect(searchSubscriptions('PHOTOSHOP').map((s) => s.id)).toContain('adobe')
    expect(searchSubscriptions('etudiant').length).toBeGreaterThan(2)
  })

  it('fabrique une pastille de deux lettres', () => {
    expect(monogram('Canva Pro')).toBe('CP')
    expect(monogram('Netflix')).toBe('NE')
    expect(monogram("Vélib'")).toBe('VÉ')
  })
})

describe('taux', () => {
  it('lit et écrit un pourcentage', () => {
    expect(parseRate('22,5')).toBe(2250)
    expect(parseRate('21,2 %')).toBe(2120)
    expect(parseRate('120')).toBeNull()
    expect(parseRate('abc')).toBeNull()
    expect(formatRate(2560)).toBe('25,6 %')
  })
})

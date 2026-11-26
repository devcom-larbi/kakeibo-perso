import { useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { parseAppData, useStore } from '../store'
import { emptyData } from '../lib/types'
import { todayISO } from '../lib/dates'

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { data, replaceAll } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kakeibo-${todayISO()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Sauvegarde téléchargée.')
  }

  const importData = async (file: File) => {
    try {
      const parsed = parseAppData(JSON.parse(await file.text()))
      if (!parsed) {
        setMessage("Ce fichier n'est pas une sauvegarde Kakeibo. Choisis un fichier kakeibo-….json.")
        return
      }
      replaceAll(parsed)
      setMessage(`Sauvegarde restaurée : ${parsed.expenses.length} dépenses, ${Object.keys(parsed.months).length} mois.`)
    } catch {
      setMessage("Impossible de lire ce fichier. Vérifie qu'il s'agit bien d'un .json.")
    }
  }

  return (
    <Sheet title="Réglages" onClose={onClose}>
      <div className="settings">
        <p className="settings-note">
          Tes données restent sur cet appareil, rien n'est envoyé en ligne. Télécharge une sauvegarde de temps en temps
          pour ne rien perdre si tu changes de téléphone.
        </p>

        <button type="button" className="primary-button" onClick={exportData}>
          Télécharger une sauvegarde
        </button>

        <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}>
          Restaurer une sauvegarde
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) importData(file)
            e.target.value = ''
          }}
        />

        {message && (
          <p className="settings-message" role="status">
            {message}
          </p>
        )}

        <button
          type="button"
          className={`text-button danger ${confirmReset ? 'is-armed' : ''}`}
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true)
            replaceAll(emptyData())
            setConfirmReset(false)
            setMessage('Toutes les données ont été effacées.')
          }}
        >
          {confirmReset ? 'Toucher encore pour tout effacer' : 'Tout effacer'}
        </button>
      </div>
    </Sheet>
  )
}

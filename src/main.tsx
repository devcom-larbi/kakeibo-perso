import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Texte : police du système et serif (Iowan Old Style sur iPhone). Dela Gothic : seulement pour les moments manga.
import '@fontsource/dela-gothic-one/latin-400.css'
import './styles.css'
import { StoreProvider } from './store'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)

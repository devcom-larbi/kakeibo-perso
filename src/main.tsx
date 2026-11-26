import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/zen-kaku-gothic-new/latin-400.css'
import '@fontsource/zen-kaku-gothic-new/latin-500.css'
import '@fontsource/zen-kaku-gothic-new/latin-700.css'
import '@fontsource/zen-kaku-gothic-new/latin-ext-400.css'
import '@fontsource/shippori-mincho-b1/latin-500.css'
import '@fontsource/shippori-mincho-b1/latin-700.css'
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

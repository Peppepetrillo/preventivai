import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CloudAuthProvider from './components/CloudAuthProvider.jsx'
import { richiediPersistenzaLocale } from './utils/persistenzaLocale.js'
import { inizializzaStorageNativo } from './utils/storage.js'

richiediPersistenzaLocale()

await inizializzaStorageNativo()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CloudAuthProvider>
      <App />
    </CloudAuthProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CloudAuthProvider from './components/CloudAuthProvider.jsx'
import { richiediPersistenzaLocale } from './utils/persistenzaLocale.js'
import { inizializzaStorageNativo } from './utils/storage.js'
import { ricaricaCodeCloudDaDisco } from './services/cloudSyncService.js'
import {
  avviaControlloBackupAutomatico,
  registraListenerBackupAutomatico,
} from './domain/backupAutomatico/index.js'
import { inizializzaNotifiche } from './services/notificationBootstrap.js'

richiediPersistenzaLocale()

await inizializzaStorageNativo()
ricaricaCodeCloudDaDisco()
await avviaControlloBackupAutomatico()
registraListenerBackupAutomatico()
void inizializzaNotifiche()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CloudAuthProvider>
      <App />
    </CloudAuthProvider>
  </StrictMode>,
)

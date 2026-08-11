import {
  lazy,
  Suspense,
} from "react";

import {
  HashRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import BottomNav from "./components/BottomNav";
import AppLock from "./components/AppLock";
import InstallPrompt from "./components/InstallPrompt";
import { WizardProvider } from "./features/preventivi/wizard/wizardContext";
import { ROUTES } from "./app/routes";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Preventivi = lazy(() => import("./pages/Preventivi"));
const PreventivoIntelligente = lazy(() => import("./pages/PreventivoIntelligente"));
const ArchivioPreventivi = lazy(() => import("./pages/ArchivioPreventivi"));
const Incassi = lazy(() => import("./pages/Incassi"));
const Cantieri = lazy(() => import("./pages/Cantieri"));
const Cantiere = lazy(() => import("./pages/Cantiere"));
const Clienti = lazy(() => import("./pages/Clienti"));
const Listino = lazy(() => import("./pages/Listino"));
const CatalogoMateriali = lazy(() => import("./pages/CatalogoMateriali"));
const Sopralluogo = lazy(() => import("./pages/Sopralluogo"));
const Impostazioni = lazy(() => import("./pages/Impostazioni"));
const DettaglioPreventivo = lazy(() => import("./pages/DettaglioPreventivo"));
const DettaglioCliente = lazy(() => import("./pages/DettaglioCliente"));
const ScelgaModalitaPreventivo = lazy(() => import("./pages/ScelgaModalitaPreventivo"));
const PreventivoManuale = lazy(() => import("./pages/PreventivoManuale"));
const Agenda = lazy(() => import("./pages/Agenda"));

function LoadingPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#070b14] text-white flex items-center justify-center px-5 safe-top safe-bottom">
      <div className="pro-panel-strong p-6 text-center">
        <p className="section-label">PreventivAI</p>
        <h1 className="ds-page-title mt-1">Caricamento...</h1>
      </div>
    </div>
  );
}

export default function App() {

  return (

    <AppLock>

    <HashRouter>

      <WizardProvider>

      <div className="app-shell">

        <Suspense fallback={<LoadingPage />}>

          <Routes>

            <Route
              path={ROUTES.dashboard}
              element={<Dashboard />}
            />

            <Route
              path={ROUTES.preventivi}
              element={<Preventivi />}
            />

            <Route
              path={ROUTES.preventivoIntelligente}
              element={<PreventivoIntelligente />}
            />

            <Route
              path={ROUTES.archivio}
              element={
                <ArchivioPreventivi />
              }
            />

            <Route
              path={ROUTES.incassi}
              element={<Incassi />}
            />

            <Route
              path={ROUTES.cantieri}
              element={<Cantieri />}
            />

            <Route
              path={ROUTES.dettaglioCantiere}
              element={<Cantiere />}
            />

            <Route
              path={ROUTES.clienti}
              element={<Clienti />}
            />

            <Route
              path={ROUTES.listino}
              element={<Listino />}
            />

            <Route
              path={ROUTES.catalogoMateriali}
              element={<CatalogoMateriali />}
            />

            <Route
              path={ROUTES.sopralluogo}
              element={<Sopralluogo />}
            />

            <Route
              path={ROUTES.impostazioni}
              element={
                <Impostazioni />
              }
            />

            <Route
              path={ROUTES.dettaglioPreventivo}
              element={
                <DettaglioPreventivo />
              }
            />

            <Route
              path={ROUTES.dettaglioCliente}
              element={
                <DettaglioCliente />
              }
            />

            <Route
              path={ROUTES.nuovoPreventivo}
              element={<ScelgaModalitaPreventivo />}
            />

            <Route
              path={ROUTES.preventivoManuale}
              element={<PreventivoManuale />}
            />

            <Route
              path={ROUTES.agenda}
              element={<Agenda />}
            />

            <Route
              path="*"
              element={<Navigate to={ROUTES.dashboard} replace />}
            />

          </Routes>

        </Suspense>

        <BottomNav />

        <InstallPrompt />

      </div>

      </WizardProvider>

    </HashRouter>

    </AppLock>

  );

}

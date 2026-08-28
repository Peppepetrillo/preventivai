import {
  lazy,
  Suspense,
} from "react";

import {
  HashRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import BottomNav from "./components/BottomNav";
import { isDistintaEditorRoute } from "./components/bottomNavUtils";
import AppLock from "./components/AppLock";
import InstallPrompt from "./components/InstallPrompt";
import PwaUpdatePrompt from "./components/PwaUpdatePrompt";
import { GlobalCreateProvider } from "./components/globalCreate/GlobalCreateContext";
import GlobalCreateHost from "./components/globalCreate/GlobalCreateHost";
import { WizardProvider } from "./features/preventivi/wizard/wizardContext";
import { ROUTES } from "./app/routes";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Preventivi = lazy(() => import("./pages/Preventivi"));
const NuovoPreventivoWizard = lazy(() => import("./pages/NuovoPreventivoWizard"));
const PreventivoIntelligente = lazy(() => import("./pages/PreventivoIntelligente"));
const ArchivioPreventivi = lazy(() => import("./pages/ArchivioPreventivi"));
const Incassi = lazy(() => import("./pages/Incassi"));
const Cantieri = lazy(() => import("./pages/Cantieri"));
const Cantiere = lazy(() => import("./pages/Cantiere"));
const Clienti = lazy(() => import("./pages/Clienti"));
const Listino = lazy(() => import("./pages/Listino"));
const CatalogoMateriali = lazy(() => import("./pages/CatalogoMateriali"));
const DistinteMateriali = lazy(() => import("./pages/DistinteMateriali"));
const DistintaMaterialiEditor = lazy(() => import("./pages/DistintaMaterialiEditor"));
const Acquisti = lazy(() => import("./pages/Acquisti"));
const Sopralluogo = lazy(() => import("./pages/Sopralluogo"));
const Impostazioni = lazy(() => import("./pages/Impostazioni"));
const Cestino = lazy(() => import("./pages/Cestino"));
const DettaglioPreventivo = lazy(() => import("./pages/DettaglioPreventivo"));
const DettaglioCliente = lazy(() => import("./pages/DettaglioCliente"));
const ScelgaModalitaPreventivo = lazy(() => import("./pages/ScelgaModalitaPreventivo"));
const PreventivoManuale = lazy(() => import("./pages/PreventivoManuale"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Altro = lazy(() => import("./pages/Altro"));

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

function AppShell() {
  const location = useLocation();
  const editorDistinta = isDistintaEditorRoute(location.pathname);

  return (
    <WizardProvider>
      <GlobalCreateProvider>
        <div
          className={`app-shell${
            editorDistinta ? " app-shell--distinta-editor" : ""
          }`}
        >
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route
                path={ROUTES.dashboard}
                element={<Dashboard />}
              />

              <Route
                path={ROUTES.preventiviNuovo}
                element={<NuovoPreventivoWizard />}
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
                path={ROUTES.distinteMateriali}
                element={<DistinteMateriali />}
              />

              <Route
                path={ROUTES.nuovaDistintaMateriali}
                element={<DistintaMaterialiEditor />}
              />

              <Route
                path={ROUTES.distintaMateriali}
                element={<DistintaMaterialiEditor />}
              />

              <Route
                path={ROUTES.acquisti}
                element={<Acquisti />}
              />

              <Route
                path={ROUTES.sopralluogo}
                element={<Sopralluogo />}
              />

              <Route
                path={ROUTES.altro}
                element={<Altro />}
              />

              <Route
                path={ROUTES.impostazioni}
                element={
                  <Impostazioni />
                }
              />

              <Route
                path={ROUTES.cestino}
                element={<Cestino />}
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

          <GlobalCreateHost />

          <InstallPrompt />
          <PwaUpdatePrompt />
        </div>
      </GlobalCreateProvider>
    </WizardProvider>
  );
}

export default function App() {

  return (

    <AppLock>

    <HashRouter>

      <AppShell />

    </HashRouter>

    </AppLock>

  );

}

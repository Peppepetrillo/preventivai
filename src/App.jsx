import {
  lazy,
  Suspense,
} from "react";

import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";

import BottomNav from "./components/BottomNav";
import AppLock from "./components/AppLock";
import { ROUTES } from "./app/routes";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Preventivi = lazy(() => import("./pages/Preventivi"));
const ArchivioPreventivi = lazy(() => import("./pages/ArchivioPreventivi"));
const Incassi = lazy(() => import("./pages/Incassi"));
const Cantieri = lazy(() => import("./pages/Cantieri"));
const Clienti = lazy(() => import("./pages/Clienti"));
const Listino = lazy(() => import("./pages/Listino"));
const Sopralluogo = lazy(() => import("./pages/Sopralluogo"));
const Impostazioni = lazy(() => import("./pages/Impostazioni"));
const DettaglioPreventivo = lazy(() => import("./pages/DettaglioPreventivo"));
const DettaglioCliente = lazy(() => import("./pages/DettaglioCliente"));

function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
      <div className="pro-panel-strong p-6 text-center">
        <p className="section-label">PreventivAI</p>
        <h1 className="text-3xl font-black mt-1">Caricamento...</h1>
      </div>
    </div>
  );
}

export default function App() {

  return (

    <AppLock>

    <HashRouter>

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
              path={ROUTES.clienti}
              element={<Clienti />}
            />

            <Route
              path={ROUTES.listino}
              element={<Listino />}
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

          </Routes>

        </Suspense>

        <BottomNav />

      </div>

    </HashRouter>

    </AppLock>

  );

}

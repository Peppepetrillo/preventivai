import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Preventivi from "./pages/Preventivi";
import ArchivioPreventivi from "./pages/ArchivioPreventivi";
import Clienti from "./pages/Clienti";
import Listino from "./pages/Listino";
import Impostazioni from "./pages/Impostazioni";
import DettaglioPreventivo from "./pages/DettaglioPreventivo";
import DettaglioCliente from "./pages/DettaglioCliente";
import Sopralluogo from "./pages/Sopralluogo";

import BottomNav from "./components/BottomNav";

export default function App() {

  return (

    <BrowserRouter>

      <div className="app-shell">

        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/preventivi"
            element={<Preventivi />}
          />

          <Route
            path="/archivio"
            element={
              <ArchivioPreventivi />
            }
          />

          <Route
            path="/clienti"
            element={<Clienti />}
          />

          <Route
            path="/listino"
            element={<Listino />}
          />

          <Route
            path="/sopralluogo"
            element={<Sopralluogo />}
          />

          <Route
            path="/impostazioni"
            element={
              <Impostazioni />
            }
          />

          <Route
            path="/preventivo/:id"
            element={
              <DettaglioPreventivo />
            }
          />

          <Route
            path="/cliente/:id"
            element={
              <DettaglioCliente />
            }
          />

        </Routes>

        <BottomNav />

      </div>

    </BrowserRouter>

  );

}

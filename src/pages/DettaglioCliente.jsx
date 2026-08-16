import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  HardHat,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { ROUTES, routeCantiere, routePreventivo } from "../app/routes";
import { leggiClienti, salvaClienti } from "../repositories/clientiRepository";
import { leggiPreventivi, salvaPreventivi } from "../repositories/preventiviRepository";
import { formatEuro, normalizzaNumero } from "../utils/preventivi";
import { useCantieri } from "../features/cantieri/hooks/useCantieri";

export default function DettaglioCliente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const clienti = leggiClienti();
  const cliente = clienti.find((c) => String(c.id) === id);
  const archivio = leggiPreventivi();

  const { cantieri, aggiornaCampoNuovoCantiere } = useCantieri();

  const [nome, setNome] = useState(cliente?.nome || "");
  const [telefono, setTelefono] = useState(cliente?.telefono || "");
  const [email, setEmail] = useState(cliente?.email || "");
  const [indirizzo, setIndirizzo] = useState(cliente?.indirizzo || "");
  const [messaggio, setMessaggio] = useState("");
  const [confermaElimina, setConfermaElimina] = useState(false);

  const preventiviCliente = archivio.filter(
    (p) => p.cliente === cliente?.nome
  );

  const cantieriCliente = cantieri.filter(
    (c) => c.cliente === cliente?.nome
  );

  const totaleLavori = preventiviCliente.reduce(
    (acc, item) => acc + normalizzaNumero(item.totale),
    0
  );

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cliente non trovato
      </div>
    );
  }

  function salvaCliente() {
    const nomePulito = nome.trim();
    if (!nomePulito) {
      setMessaggio("Inserisci il nome del cliente.");
      return;
    }

    const clientiAggiornati = clienti.map((item) =>
      String(item.id) === id
        ? { ...item, nome: nomePulito, telefono: telefono.trim(), email: email.trim(), indirizzo: indirizzo.trim() }
        : item
    );

    const archivioAggiornato = archivio.map((preventivo) =>
      preventivo.cliente === cliente.nome
        ? { ...preventivo, cliente: nomePulito }
        : preventivo
    );

    salvaClienti(clientiAggiornati);
    salvaPreventivi(archivioAggiornato);
    setMessaggio("Salvato.");
    setTimeout(() => setMessaggio(""), 2000);
  }

  function eliminaCliente() {
    const clientiAggiornati = clienti.filter((item) => String(item.id) !== id);
    salvaClienti(clientiAggiornati);
    navigate(ROUTES.clienti);
  }

  function nuovoCantiereDaCliente() {
    aggiornaCampoNuovoCantiere("cliente", cliente.nome);
    aggiornaCampoNuovoCantiere("indirizzo", cliente.indirizzo || indirizzo || "");
    aggiornaCampoNuovoCantiere("nome", "");
    navigate(ROUTES.cantieri + "?nuovoCantiere=1");
  }

  const telLink = cliente.telefono
    ? `tel:${cliente.telefono.replace(/\s/g, "")}`
    : null;

  const indirizzoCorrente = indirizzo || cliente.indirizzo || "";
  const navLink = indirizzoCorrente
    ? `https://maps.google.com/?q=${encodeURIComponent(indirizzoCorrente)}`
    : null;

  return (
    <div className="pro-page text-white">
      <Link to={ROUTES.clienti} className="ds-back-link mb-5">
        <ArrowLeft size={18} />
        Clienti
      </Link>

      {/* Header scheda cliente */}
      <div className="pro-panel-strong p-5 mb-5">
        <p className="section-label">Scheda cliente</p>
        <h1 className="text-3xl font-black mt-1">{cliente.nome}</h1>
        {indirizzoCorrente && (
          <p className="text-slate-400 mt-1 text-sm flex items-center gap-1">
            <MapPin size={13} className="shrink-0" />
            {indirizzoCorrente}
          </p>
        )}
        {cliente.telefono && (
          <p className="text-slate-400 mt-0.5 text-sm">{cliente.telefono}</p>
        )}

        {/* CTA principali */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Link
            to={`${ROUTES.preventivi}?clienteId=${id}`}
            className="btn-primary py-4 flex items-center justify-center gap-2 text-sm font-black"
            data-testid="entry-nuovo-preventivo-cliente"
          >
            <Plus size={18} />
            Nuovo preventivo
          </Link>

          <button
            onClick={nuovoCantiereDaCliente}
            className="btn-secondary py-4 flex items-center justify-center gap-2 text-sm font-black"
          >
            <HardHat size={18} />
            Nuovo Cantiere
          </button>

          {telLink ? (
            <a
              href={telLink}
              className="btn-secondary py-4 flex items-center justify-center gap-2 text-sm font-black"
            >
              <Phone size={18} />
              Chiama
            </a>
          ) : (
            <button
              disabled
              className="btn-secondary py-4 flex items-center justify-center gap-2 text-sm font-black opacity-40 cursor-not-allowed"
            >
              <Phone size={18} />
              Chiama
            </button>
          )}

          {navLink && (
            <a
              href={navLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary py-4 flex items-center justify-center gap-2 text-sm font-black"
            >
              <MapPin size={18} />
              Naviga
            </a>
          )}
        </div>
      </div>

      {/* Statistiche */}
      <div className="pro-panel p-5 mb-5 flex items-center gap-4">
        <Wallet size={22} className="text-emerald-300 shrink-0" />
        <div>
          <p className="text-slate-400 text-sm">Totale lavori</p>
          <p className="text-2xl font-black mt-0.5">{formatEuro(totaleLavori)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-slate-400 text-sm">Preventivi</p>
          <p className="text-2xl font-black mt-0.5">{preventiviCliente.length}</p>
        </div>
        <div className="ml-4 text-right">
          <p className="text-slate-400 text-sm">Cantieri</p>
          <p className="text-2xl font-black mt-0.5">{cantieriCliente.length}</p>
        </div>
      </div>

      {messaggio && (
        <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30 text-sm">
          {messaggio}
        </div>
      )}

      {/* Dati modificabili */}
      <div className="pro-panel p-5 mb-5">
        <h2 className="text-lg font-black mb-4">Informazioni</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-slate-400">Nome cliente</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1.5 input-pro"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-400">Telefono</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1.5 input-pro"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-400">Indirizzo</span>
            <input
              value={indirizzo}
              onChange={(e) => setIndirizzo(e.target.value)}
              className="mt-1.5 input-pro"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 input-pro"
            />
          </label>

          <button
            onClick={salvaCliente}
            className="btn-primary w-full py-3.5 font-black"
          >
            Salva
          </button>
        </div>
      </div>

      {/* Preventivi collegati */}
      <div className="mb-5">
        <h2 className="text-lg font-black mb-4">Preventivi</h2>

        {preventiviCliente.length === 0 && (
          <div className="pro-panel p-6 text-slate-400 text-center ds-empty">
            <p className="font-black">Nessun preventivo</p>
            <p className="text-sm mt-1">Crea il primo preventivo per questo cliente.</p>
            <Link
              to={`${ROUTES.preventivi}?clienteId=${id}`}
              className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-3 text-sm font-black"
            >
              <Plus size={16} />
              Nuovo preventivo
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {preventiviCliente.map((preventivo) => (
            <Link
              key={preventivo.id}
              to={routePreventivo(preventivo.id)}
              className="pro-panel p-4 flex items-center gap-3 hover:border-yellow-300/40 transition"
            >
              <div className="w-10 h-10 rounded-[12px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black">{preventivo.numero || "PREV-000"}</p>
                <p className="text-slate-400 text-sm mt-0.5">{preventivo.data}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">{preventivo.stato}</p>
                <p className="font-black text-emerald-300 mt-0.5">
                  {formatEuro(preventivo.totale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Cantieri collegati */}
      {cantieriCliente.length > 0 && (
        <div className="mb-5">
          <h2 className="text-lg font-black mb-4">Cantieri</h2>
          <div className="space-y-3">
            {cantieriCliente.map((cantiere) => (
              <Link
                key={cantiere.id}
                to={routeCantiere(cantiere.id)}
                className="pro-panel p-4 flex items-center gap-3 hover:border-yellow-300/40 transition"
              >
                <div className="w-10 h-10 rounded-[12px] bg-slate-700 flex items-center justify-center shrink-0">
                  <HardHat size={18} className="text-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black truncate">{cantiere.nome}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{cantiere.stato}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Elimina cliente */}
      <div className="pro-panel p-5 mb-6 border-red-400/20">
        <h2 className="text-lg font-black mb-3 text-red-300">Zona pericolosa</h2>
        {!confermaElimina ? (
          <button
            onClick={() => setConfermaElimina(true)}
            className="btn-danger w-full py-3.5 flex items-center justify-center gap-2 font-black"
          >
            <Trash2 size={18} />
            Elimina cliente
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Eliminare <strong>{cliente.nome}</strong>? I preventivi già creati resteranno nell'archivio.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfermaElimina(false)}
                className="btn-secondary py-3.5 font-black"
              >
                Annulla
              </button>
              <button
                onClick={eliminaCliente}
                className="btn-danger py-3.5 font-black"
              >
                Elimina
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

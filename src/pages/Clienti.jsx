import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Mail,
  Phone,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import PageWrapper from "../components/PageWrapper";
import SearchInput from "../components/SearchInput";
import { routeCliente } from "../app/routes";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import {
  leggiClienti,
  leggiClientiTutti,
  salvaClienti as salvaClientiRepository,
} from "../repositories/clientiRepository";
import {
  limitaElencoVisibile,
  PAGINA_LISTA_DEFAULT,
} from "../utils/listPerformance";

/**
 * Filtro UI locale (non dominio): nome, telefono, email.
 * @param {Array<{ nome?: string, telefono?: string, email?: string }>} clienti
 * @param {string} query
 */
function filtraClientiLocali(clienti, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return Array.isArray(clienti) ? clienti : [];
  return (clienti || []).filter((cliente) => {
    const nome = String(cliente?.nome || "").toLowerCase();
    const telefono = String(cliente?.telefono || "").toLowerCase();
    const email = String(cliente?.email || "").toLowerCase();
    return nome.includes(q) || telefono.includes(q) || email.includes(q);
  });
}

/**
 * @param {string} nome
 * @returns {string}
 */
function inizialiCliente(nome) {
  const parti = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parti.length === 0) return "?";
  if (parti.length === 1) return parti[0].slice(0, 2).toUpperCase();
  return `${parti[0][0]}${parti[parti.length - 1][0]}`.toUpperCase();
}

export default function Clienti() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clienti, setClienti] = useDatiLocaliSincronizzati(leggiClienti);
  const [limite, setLimite] = useState(PAGINA_LISTA_DEFAULT);
  const [ricerca, setRicerca] = useState("");
  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [formAperto, setFormAperto] = useState(false);

  useEffect(() => {
    if (searchParams.get("nuovo") !== "1") return;
    setFormAperto(true);
    const prossimo = new URLSearchParams(searchParams);
    prossimo.delete("nuovo");
    setSearchParams(prossimo, { replace: true });
  }, [searchParams, setSearchParams]);

  const clientiFiltrati = useMemo(
    () => filtraClientiLocali(clienti, ricerca),
    [clienti, ricerca]
  );
  const clientiVisibili = useMemo(
    () => limitaElencoVisibile(clientiFiltrati, limite),
    [clientiFiltrati, limite]
  );
  const rimanenti = Math.max(0, clientiFiltrati.length - clientiVisibili.length);
  const listaVuota = clienti.length === 0;
  const ricercaSenzaRisultati =
    !listaVuota && clientiFiltrati.length === 0 && Boolean(ricerca.trim());
  const mostraForm = formAperto || listaVuota;

  function salvaClienti(nuoviClientiCompleti) {
    salvaClientiRepository(nuoviClientiCompleti);
    setClienti(leggiClienti());
  }

  function aggiungiCliente() {
    if (!nome) return;

    const nuovoCliente = {
      id: new Date().getTime(),
      nome,
      telefono,
      email,
    };

    salvaClienti([...leggiClientiTutti(), nuovoCliente]);
    setNome("");
    setTelefono("");
    setEmail("");
    setFormAperto(false);
  }

  function aggiornaRicerca(event) {
    setRicerca(event.target.value);
    setLimite(PAGINA_LISTA_DEFAULT);
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">
        <header className="pro-panel-strong px-4 py-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-label">Clienti</p>
              <h1 className="ds-page-title mt-1">Clienti</h1>
              <p className="ds-text-secondary mt-2">
                Cerca e apri un contatto in pochi secondi.
              </p>
            </div>
            <span
              className="ds-badge-count shrink-0"
              aria-label={`${clienti.length} clienti`}
            >
              {clienti.length}
            </span>
          </div>
        </header>

        {!listaVuota ? (
          <SearchInput
            className="mb-3"
            label="Cerca cliente"
            placeholder="Nome, telefono o email"
            value={ricerca}
            onChange={aggiornaRicerca}
          />
        ) : null}

        {!listaVuota ? (
          <div className="mb-3">
            {mostraForm ? (
              <div className="pro-panel px-3.5 py-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-200">Nuovo cliente</p>
                  <button
                    type="button"
                    onClick={() => setFormAperto(false)}
                    className="text-xs font-bold text-slate-400 px-2 py-2 min-h-[44px]"
                  >
                    Chiudi
                  </button>
                </div>
                <FormNuovoCliente
                  nome={nome}
                  telefono={telefono}
                  email={email}
                  onNome={setNome}
                  onTelefono={setTelefono}
                  onEmail={setEmail}
                  onSalva={aggiungiCliente}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFormAperto(true)}
                className="w-full btn-secondary min-h-[48px] px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Plus size={18} aria-hidden="true" />
                Nuovo cliente
              </button>
            )}
          </div>
        ) : null}

        <section aria-labelledby="elenco-clienti">
          <div className="flex items-center gap-2.5 mb-2.5">
            <Users size={20} className="text-yellow-300 shrink-0" aria-hidden="true" />
            <h2
              id="elenco-clienti"
              className="ds-section-title"
            >
              Elenco
            </h2>
          </div>

          {listaVuota ? (
            <div className="pro-panel ds-empty">
              <div className="ds-empty-icon" aria-hidden="true">
                <UserPlus size={28} />
              </div>
              <p className="ds-card-title">Nessun cliente ancora</p>
              <p className="ds-text-secondary mt-2 max-w-sm mx-auto">
                Aggiungi il primo contatto: lo ritroverai subito in preventivi e
                cantieri.
              </p>
              <div className="mt-6 text-left max-w-md mx-auto">
                <FormNuovoCliente
                  nome={nome}
                  telefono={telefono}
                  email={email}
                  onNome={setNome}
                  onTelefono={setTelefono}
                  onEmail={setEmail}
                  onSalva={aggiungiCliente}
                />
              </div>
            </div>
          ) : null}

          {ricercaSenzaRisultati ? (
            <div className="pro-panel ds-empty">
              <div className="ds-empty-icon" aria-hidden="true">
                <Users size={22} />
              </div>
              <p className="ds-card-title">Nessun risultato</p>
              <p className="ds-text-secondary mt-2">
                Prova un altro nome, telefono o email.
              </p>
              <button
                type="button"
                className="btn-secondary mt-6 px-4 text-sm"
                onClick={() => {
                  setRicerca("");
                  setLimite(PAGINA_LISTA_DEFAULT);
                }}
              >
                Azzera ricerca
              </button>
            </div>
          ) : null}

          {!listaVuota && !ricercaSenzaRisultati ? (
            <div className="grid gap-2.5">
              {clientiVisibili.map((cliente) => (
                <Link
                  key={cliente.id}
                  to={routeCliente(cliente.id)}
                  className="pro-panel ds-card-link px-4 py-3"
                  aria-label={`Apri cliente ${cliente.nome || ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-[16px] bg-yellow-400/14 text-yellow-100 border border-yellow-300/20 flex items-center justify-center shrink-0 text-sm font-semibold tracking-wide"
                      aria-hidden="true"
                    >
                      {inizialiCliente(cliente.nome)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="ds-card-title truncate">
                        {cliente.nome || "Cliente senza nome"}
                      </h3>
                      <div className="mt-1 flex flex-col gap-1">
                        {cliente.telefono ? (
                          <p className="flex items-center gap-2 ds-text-secondary truncate">
                            <Phone size={14} className="shrink-0 opacity-80" aria-hidden="true" />
                            <span className="truncate">{cliente.telefono}</span>
                          </p>
                        ) : null}
                        {cliente.email ? (
                          <p className="flex items-center gap-2 text-[14px] text-slate-500 truncate">
                            <Mail size={14} className="shrink-0 opacity-80" aria-hidden="true" />
                            <span className="truncate">{cliente.email}</span>
                          </p>
                        ) : null}
                        {!cliente.telefono && !cliente.email ? (
                          <p className="ds-text-secondary">Nessun contatto</p>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className="w-10 h-10 rounded-[16px] bg-white/6 text-slate-300 flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              ))}

              {rimanenti > 0 ? (
                <button
                  type="button"
                  className="w-full btn-secondary min-h-[48px] p-3.5 text-sm font-bold"
                  onClick={() => setLimite((n) => n + PAGINA_LISTA_DEFAULT)}
                >
                  Mostra altri ({rimanenti})
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PageWrapper>
  );
}

function FormNuovoCliente({
  nome,
  telefono,
  email,
  onNome,
  onTelefono,
  onEmail,
  onSalva,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-1.5" htmlFor="cliente-nome">
          Nome
        </label>
        <input
          id="cliente-nome"
          type="text"
          placeholder="Mario Rossi"
          value={nome}
          onChange={(e) => onNome(e.target.value)}
          className="input-pro py-3 text-[16px]"
          autoComplete="name"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5" htmlFor="cliente-telefono">
            Telefono
          </label>
          <input
            id="cliente-telefono"
            type="tel"
            placeholder="+39 …"
            value={telefono}
            onChange={(e) => onTelefono(e.target.value)}
            className="input-pro py-3 text-[16px]"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5" htmlFor="cliente-email">
            Email
          </label>
          <input
            id="cliente-email"
            type="email"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            className="input-pro py-3 text-[16px]"
            autoComplete="email"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onSalva}
        disabled={!nome.trim()}
        className="w-full btn-primary min-h-[48px] px-4 py-3 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <Plus size={18} aria-hidden="true" />
        Aggiungi cliente
      </button>
    </div>
  );
}

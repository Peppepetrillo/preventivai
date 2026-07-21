import { useCallback, useMemo, useState } from "react";
import { ChevronRight, Plus, User } from "lucide-react";

import SearchInput from "../../../components/SearchInput";
import NuovoClienteSheet from "./NuovoClienteSheet";
import {
  clientiRecentiDaEstensioni,
  leggiUltimoCliente,
  registraClienteRecente,
  salvaUltimoCliente,
} from "../utils/wizardExtensions";

export default function ClienteSelector({ clienti, onSeleziona }) {
  const [ricerca, setRicerca] = useState("");
  const [sheetAperto, setSheetAperto] = useState(false);
  const [clientiLocali, setClientiLocali] = useState(clienti);

  const recenti = useMemo(() => {
    const ultimo = leggiUltimoCliente()?.nome;
    const salvati = clientiRecentiDaEstensioni(5);
    const candidati = [...(ultimo ? [ultimo] : []), ...salvati];

    return [...new Set(candidati)]
      .filter((nome) => clientiLocali.some((cliente) => cliente.nome === nome))
      .slice(0, 3);
  }, [clientiLocali]);

  const clientiFiltrati = useMemo(() => {
    const testo = ricerca.trim().toLowerCase();
    const ordinati = [...clientiLocali].sort((a, b) =>
      a.nome.localeCompare(b.nome, "it")
    );

    if (!testo) return ordinati;

    return ordinati.filter((cliente) =>
      `${cliente.nome} ${cliente.telefono || ""} ${cliente.email || ""}`
        .toLowerCase()
        .includes(testo)
    );
  }, [clientiLocali, ricerca]);

  const seleziona = useCallback(
    (nomeCliente) => {
      registraClienteRecente(nomeCliente);
      salvaUltimoCliente(nomeCliente);
      onSeleziona(nomeCliente);
    },
    [onSeleziona]
  );

  const gestisciNuovoCliente = useCallback(
    (nuovoCliente) => {
      setClientiLocali((precedenti) => [...precedenti, nuovoCliente]);
      seleziona(nuovoCliente.nome);
    },
    [seleziona]
  );

  const chiudiSheet = useCallback(() => setSheetAperto(false), []);

  return (
    <div className="px-4 pb-4 space-y-4">
      <SearchInput
        label="Cerca cliente"
        placeholder="Cerca cliente..."
        value={ricerca}
        onChange={(event) => setRicerca(event.target.value)}
        inputClassName="h-12"
      />

      {recenti.length > 0 && !ricerca ? (
        <div>
          <p className="text-xs font-bold uppercase text-slate-500 px-1 mb-2">
            Recenti
          </p>
          <div className="flex flex-wrap gap-2">
            {recenti.map((nome) => (
              <button
                key={nome}
                type="button"
                onClick={() => seleziona(nome)}
                className="px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-300/30 text-yellow-100 text-sm font-bold"
              >
                {nome}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-bold uppercase text-slate-500 px-1 mb-2">
          {ricerca ? "Risultati" : "Tutti i clienti"}
        </p>

        <div className="space-y-2">
          {clientiFiltrati.length === 0 ? (
            <div className="pro-panel p-5 text-center text-slate-400 text-sm">
              Nessun cliente trovato.
            </div>
          ) : (
            clientiFiltrati.map((cliente) => (
              <button
                key={cliente.id || cliente.nome}
                type="button"
                onClick={() => seleziona(cliente.nome)}
                className="w-full pro-panel px-4 py-3 flex items-center gap-3 text-left active:scale-[0.99] transition"
                aria-label={`Seleziona cliente ${cliente.nome}`}
              >
                <div className="w-10 h-10 rounded-[12px] bg-white/8 flex items-center justify-center shrink-0">
                  <User size={18} className="text-yellow-200" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-black truncate">{cliente.nome}</p>
                  {cliente.telefono ? (
                    <p className="text-xs text-slate-500 truncate">
                      {cliente.telefono}
                    </p>
                  ) : null}
                </div>

                <ChevronRight
                  size={18}
                  className="text-slate-500 shrink-0"
                  aria-hidden="true"
                />
              </button>
            ))
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSheetAperto(true)}
        className="w-full btn-secondary py-4 font-black flex items-center justify-center gap-2"
      >
        <Plus size={18} aria-hidden="true" />
        Nuovo Cliente
      </button>

      <NuovoClienteSheet
        open={sheetAperto}
        onClose={chiudiSheet}
        onSalvato={gestisciNuovoCliente}
      />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";

import SearchInput from "../../../components/SearchInput";
import { formatEuro } from "../../../utils/preventivi";
import {
  CATEGORIE_SPESA,
  ETICHETTE_CATEGORIA_SPESA,
  ETICHETTE_METODO_PAGAMENTO_SPESA,
  etichettaGiornataSpesa,
  filtraSpeseCantiere,
  riepilogoEconomicoCompleto,
} from "../services/speseCantiereService";
import SpesaSheet from "./SpesaSheet";

const FILTRI_CATEGORIA = [
  { id: "tutte", etichetta: "Tutte" },
  ...Object.values(CATEGORIE_SPESA).map((id) => ({
    id,
    etichetta: ETICHETTE_CATEGORIA_SPESA[id],
  })),
];

/**
 * Tab Economico: registro spese cantiere (UX-Spese v1).
 */
export default function SpeseSection({
  cantiere,
  onAggiungi,
  onAggiorna,
  onElimina,
  registraSpesaTrigger = 0,
  registraSpesaPrefill = null,
  registraSpesaOrigine = null,
}) {
  const [sheetAperto, setSheetAperto] = useState(false);
  const [inModifica, setInModifica] = useState(null);
  const [sheetPrefill, setSheetPrefill] = useState(null);
  const [sheetOrigine, setSheetOrigine] = useState(null);
  const [ricerca, setRicerca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("tutte");
  const [giornataFiltro, setGiornataFiltro] = useState("");
  const ultimoTriggerSpesa = useRef(0);

  const riepilogo = useMemo(
    () => riepilogoEconomicoCompleto(cantiere),
    [cantiere]
  );

  const speseFiltrate = useMemo(
    () =>
      filtraSpeseCantiere(riepilogo.spese, {
        ricerca,
        categoria: categoriaFiltro,
        giornataId: giornataFiltro,
      }),
    [riepilogo.spese, ricerca, categoriaFiltro, giornataFiltro]
  );

  const riepilogoCategorie = useMemo(() => {
    return Object.entries(riepilogo.spesePerCategoria || {})
      .filter(([, importo]) => importo > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, importo]) => ({
        categoria,
        etichetta: ETICHETTE_CATEGORIA_SPESA[categoria] || categoria,
        importo,
      }));
  }, [riepilogo.spesePerCategoria]);

  const giornateConSpese = useMemo(() => {
    const ids = new Set(
      riepilogo.spese.map((s) => String(s.giornataId || "")).filter(Boolean)
    );
    return [...ids].map((id) => ({
      id,
      etichetta: etichettaGiornataSpesa(cantiere, id) || id,
    }));
  }, [riepilogo.spese, cantiere]);

  function apriNuova({ prefill = null, origine = null } = {}) {
    setInModifica(null);
    setSheetPrefill(prefill);
    setSheetOrigine(origine);
    setSheetAperto(true);
  }

  useEffect(() => {
    if (!registraSpesaTrigger || registraSpesaTrigger === ultimoTriggerSpesa.current) {
      return;
    }
    ultimoTriggerSpesa.current = registraSpesaTrigger;
    apriNuova({
      prefill: registraSpesaPrefill || null,
      origine: registraSpesaOrigine || null,
    });
  }, [registraSpesaTrigger, registraSpesaPrefill, registraSpesaOrigine]);

  function gestisciSalva(payload) {
    const daAssistente =
      sheetOrigine === "assistente-economico";
    if (inModifica?.id) {
      onAggiorna?.(inModifica.id, payload);
    } else {
      onAggiungi?.(payload);
    }
    setSheetAperto(false);
    setSheetPrefill(null);
    setSheetOrigine(null);
    if (daAssistente) return;
    requestAnimationFrame(() => {
      document
        .getElementById("sezione-spese")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section
      id="sezione-spese"
      className="scroll-mt-24"
      aria-labelledby="spese-title"
      data-testid="cantiere-spese"
    >
      <h2 id="spese-title" className="ds-card-title mb-4">
        Spese
      </h2>

      <div className="rounded-[14px] border border-white/10 bg-black/[0.18] p-4 mb-5">
        <p className="ds-text-secondary text-sm">Spese totali</p>
        <p
          className="text-2xl font-semibold mt-1 tabular-nums ds-text-primary"
          data-testid="spese-totale"
        >
          {formatEuro(riepilogo.totaleSpese)}
        </p>
      </div>

      {riepilogoCategorie.length > 0 ? (
        <div
          className="grid gap-2 sm:grid-cols-2 mb-5"
          data-testid="spese-riepilogo-categorie"
        >
          {riepilogoCategorie.map((voce) => (
            <div
              key={voce.categoria}
              className="rounded-[14px] border border-white/10 bg-black/[0.12] px-4 py-3 flex items-center justify-between gap-3"
            >
              <span className="ds-text-secondary text-sm">{voce.etichetta}</span>
              <span className="ds-text-primary font-semibold tabular-nums">
                {formatEuro(voce.importo)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-3 mb-4">
        <SearchInput
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca descrizione o fornitore"
        />

        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="spese-filtro-categoria">
          {FILTRI_CATEGORIA.map((filtro) => (
            <button
              key={filtro.id}
              type="button"
              onClick={() => setCategoriaFiltro(filtro.id)}
              className={`shrink-0 min-h-[40px] px-3 rounded-full border text-sm font-medium ${
                categoriaFiltro === filtro.id
                  ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-100"
                  : "border-white/10 bg-white/5 ds-text-primary"
              }`}
            >
              {filtro.etichetta}
            </button>
          ))}
        </div>

        {giornateConSpese.length > 0 ? (
          <select
            value={giornataFiltro}
            onChange={(e) => setGiornataFiltro(e.target.value)}
            className="w-full min-h-[44px] rounded-[16px] bg-white/5 border border-white/10 px-4 ds-text-primary text-sm"
            data-testid="spese-filtro-giornata"
          >
            <option value="">Tutte le giornate</option>
            {giornateConSpese.map((g) => (
              <option key={g.id} value={g.id}>
                Giornata {g.etichetta}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="ds-text-primary font-semibold">Spese registrate</h3>
        <button
          type="button"
          onClick={() => apriNuova()}
          className="btn-primary min-h-[44px] px-3 flex items-center gap-2 text-sm font-bold"
          data-testid="spesa-aggiungi"
        >
          <Plus size={18} aria-hidden="true" />
          Aggiungi spesa
        </button>
      </div>

      {speseFiltrate.length === 0 ? (
        <div className="ds-empty pro-panel p-5" data-testid="spese-empty">
          <p className="ds-card-title">
            {riepilogo.spese.length === 0
              ? "Nessuna spesa registrata"
              : "Nessun risultato"}
          </p>
          <p className="ds-text-secondary mt-2">
            {riepilogo.spese.length === 0
              ? "Registra le uscite reali del cantiere: materiali, carburante, subappalti…"
              : "Prova a cambiare ricerca o filtri."}
          </p>
          {riepilogo.spese.length === 0 ? (
            <button
              type="button"
              onClick={() => apriNuova()}
              className="btn-primary mt-4 min-h-[48px] w-full"
              data-testid="spesa-empty-prima"
            >
              Registra la prima spesa
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3" data-testid="spese-lista">
          {speseFiltrate.map((spesa) => {
            const giornataLabel = etichettaGiornataSpesa(
              cantiere,
              spesa.giornataId
            );
            return (
              <li key={spesa.id}>
                <button
                  type="button"
                  onClick={() => {
                    setInModifica(spesa);
                    setSheetPrefill(null);
                    setSheetOrigine(null);
                    setSheetAperto(true);
                  }}
                  className="pro-panel w-full p-4 text-left min-h-[72px] active:scale-[0.99] transition-transform"
                  data-testid={`spesa-riga-${spesa.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="ds-text-primary font-medium truncate">
                        {spesa.descrizione}
                      </p>
                      <p className="ds-text-secondary mt-1">
                        {ETICHETTE_CATEGORIA_SPESA[spesa.categoria] || "Altro"}
                        {" · "}
                        {spesa.data}
                      </p>
                      {spesa.fornitore ? (
                        <p className="ds-text-secondary text-sm mt-1">
                          {spesa.fornitore}
                        </p>
                      ) : null}
                      {giornataLabel ? (
                        <p
                          className="ds-text-secondary text-sm mt-1"
                          data-testid={`spesa-giornata-label-${spesa.id}`}
                        >
                          Giornata: {giornataLabel}
                        </p>
                      ) : null}
                      {spesa.metodoPagamento ? (
                        <p className="ds-text-secondary text-xs mt-1">
                          {ETICHETTE_METODO_PAGAMENTO_SPESA[spesa.metodoPagamento]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="ds-text-primary font-semibold tabular-nums">
                        {formatEuro(spesa.importo)}
                      </p>
                      <ChevronRight
                        size={18}
                        className="text-slate-500"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <SpesaSheet
        open={sheetAperto}
        onClose={() => {
          setSheetAperto(false);
          setSheetPrefill(null);
          setSheetOrigine(null);
        }}
        spesa={inModifica}
        prefill={!inModifica ? sheetPrefill : null}
        cantiere={cantiere}
        onSalva={gestisciSalva}
        onElimina={(id) => onElimina?.(id)}
      />
    </section>
  );
}

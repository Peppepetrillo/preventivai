import { useMemo, useState } from "react";
import {
  FileText,
  HardHat,
  RotateCcw,
  Trash2,
  Users
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  FILTRI_CESTINO,
  TIPI_CESTINO,
  eliminaDefinitivamente,
  ottieniElementiCestinati,
  ripristina
} from "../domain/cestino";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import { APP_EVENTS } from "../app/events";

const FILTRI_UI = [
  { id: FILTRI_CESTINO.tutti, label: "Tutti" },
  { id: FILTRI_CESTINO.clienti, label: "Clienti" },
  { id: FILTRI_CESTINO.cantieri, label: "Cantieri" },
  { id: FILTRI_CESTINO.preventivi, label: "Preventivi" },
];

function etichettaTipo(tipo) {
  if (tipo === TIPI_CESTINO.cliente) return "Cliente";
  if (tipo === TIPI_CESTINO.cantiere) return "Cantiere";
  if (tipo === TIPI_CESTINO.preventivo) return "Preventivo";
  return "Elemento";
}

function iconaTipo(tipo) {
  if (tipo === TIPI_CESTINO.cliente) return Users;
  if (tipo === TIPI_CESTINO.cantiere) return HardHat;
  return FileText;
}

function formattaDataEliminazione(iso) {
  const t = Date.parse(String(iso || ""));
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit" });
}

function descrizioneHardDelete(tipo) {
  if (tipo === TIPI_CESTINO.cantiere) {
    return "Questa operazione non può essere annullata. Verranno eliminati anche i dati collegati del cantiere (foto, lista spesa, varianti e altri dati gestiti dalla pulizia).";
  }
  if (tipo === TIPI_CESTINO.preventivo) {
    return "Questa operazione non può essere annullata. Il preventivo verrà rimosso definitivamente.";
  }
  return "Questa operazione non può essere annullata. Il cliente verrà rimosso definitivamente. Preventivi e cantieri collegati restano.";
}

function leggiCestino() {
  return ottieniElementiCestinati({ filtro: FILTRI_CESTINO.tutti });
}

export default function Cestino() {
  const [filtro, setFiltro] = useState(FILTRI_CESTINO.tutti);
  const [elementi, setElementi] = useDatiLocaliSincronizzati(leggiCestino, [
    APP_EVENTS.cloudSyncAggiornata,
    APP_EVENTS.preventiviAggiornati,
  ]);
  const [messaggio, setMessaggio] = useState("");
  const [daEliminare, setDaEliminare] = useState(null);

  const elementiFiltrati = useMemo(() => {
    if (filtro === FILTRI_CESTINO.tutti) return elementi;
    if (filtro === FILTRI_CESTINO.clienti) {
      return elementi.filter((e) => e.tipo === TIPI_CESTINO.cliente);
    }
    if (filtro === FILTRI_CESTINO.cantieri) {
      return elementi.filter((e) => e.tipo === TIPI_CESTINO.cantiere);
    }
    return elementi.filter((e) => e.tipo === TIPI_CESTINO.preventivo);
  }, [elementi, filtro]);

  function aggiornaLista() {
    setElementi(leggiCestino());
  }

  function eseguiRipristina(elemento) {
    const esito = ripristina(elemento.tipo, elemento.id);
    if (!esito.success) {
      setMessaggio("Ripristino non riuscito.");
      return;
    }
    aggiornaLista();
    setMessaggio("Elemento ripristinato.");
  }

  function confermaEliminaDefinitiva() {
    if (!daEliminare) return;
    const esito = eliminaDefinitivamente(daEliminare.tipo, daEliminare.id);
    setDaEliminare(null);
    if (!esito.success) {
      setMessaggio("Eliminazione definitiva non riuscita.");
      return;
    }
    aggiornaLista();
    setMessaggio("Elemento eliminato definitivamente.");
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="pagina-cestino">
        <PageBackLink testId="cestino-back" />

        <header className="pro-panel-strong p-5 mb-4">
          <p className="section-label">Recupero dati</p>
          <h1 className="ds-page-title mt-1">Cestino</h1>
          <p className="ds-text-secondary mt-2">
            Ripristina o elimina definitivamente clienti, cantieri e preventivi.
          </p>
        </header>

        {messaggio ? (
          <div className="pro-panel p-4 mb-4 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        ) : null}

        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-4"
          role="tablist"
          aria-label="Filtra cestino"
        >
          {FILTRI_UI.map((voce) => (
            <button
              key={voce.id}
              type="button"
              role="tab"
              aria-selected={filtro === voce.id}
              data-testid={`cestino-filtro-${voce.id}`}
              onClick={() => setFiltro(voce.id)}
              className={`shrink-0 min-h-[44px] px-4 rounded-[16px] text-sm font-semibold border ${
                filtro === voce.id
                  ? "bg-yellow-400/20 border-yellow-300/50 text-yellow-100"
                  : "bg-slate-900/40 border-white/10 text-slate-300"
              }`}
            >
              {voce.label}
            </button>
          ))}
        </div>

        {elementiFiltrati.length === 0 ? (
          <div className="ds-empty pro-panel p-8 text-center">
            <p className="ds-card-title">Cestino vuoto</p>
            <p className="ds-text-secondary mt-2">
              Gli elementi eliminati compariranno qui e potrai ripristinarli.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {elementiFiltrati.map((elemento) => {
              const Icona = iconaTipo(elemento.tipo);
              return (
                <article
                  key={`${elemento.tipo}-${elemento.id}`}
                  className="pro-panel p-4"
                  data-testid={`cestino-item-${elemento.tipo}-${elemento.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
                      <Icona size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="ds-badge mb-1">{etichettaTipo(elemento.tipo)}</p>
                      <h2 className="ds-card-title truncate">{elemento.nome}</h2>
                      {elemento.cliente ? (
                        <p className="ds-text-secondary mt-1 truncate">
                          {elemento.tipo === TIPI_CESTINO.cliente
                            ? elemento.cliente
                            : `Cliente: ${elemento.cliente}`}
                        </p>
                      ) : null}
                      <p className="ds-text-secondary text-sm mt-1">
                        Eliminato: {formattaDataEliminazione(elemento.deletedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      type="button"
                      className="btn-secondary min-h-[48px] flex items-center justify-center gap-2"
                      data-testid={`cestino-ripristina-${elemento.tipo}-${elemento.id}`}
                      onClick={() => eseguiRipristina(elemento)}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                      Ripristina
                    </button>
                    <button
                      type="button"
                      className="btn-danger min-h-[48px] flex items-center justify-center gap-2"
                      data-testid={`cestino-elimina-${elemento.tipo}-${elemento.id}`}
                      onClick={() => setDaEliminare(elemento)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Elimina
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(daEliminare)}
          title="Eliminare definitivamente?"
          description={
            daEliminare
              ? descrizioneHardDelete(daEliminare.tipo)
              : "Questa operazione non può essere annullata."
          }
          confirmLabel="Elimina definitivamente"
          cancelLabel="Annulla"
          onConfirm={confermaEliminaDefinitiva}
          onCancel={() => setDaEliminare(null)}
          testId="conferma-elimina-definitiva-cestino"
        />
      </div>
    </PageWrapper>
  );
}

import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Plus,
  UserRound,
  UserX,
  UserCheck,
  Pencil,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import PageBackLink from "../components/PageBackLink";
import BottomSheet from "../components/BottomSheet";
import { ROUTES } from "../app/routes";
import { useDatiLocaliSincronizzati } from "../hooks/useDatiLocaliSincronizzati";
import {
  leggiOperaiTutti,
  salvaOperai,
} from "../repositories/operaiRepository";
import {
  disattivaOperaio,
  etichettaCostoOperaio,
  nomeCompletoOperaio,
  riattivaOperaio,
} from "../features/manodopera/operaiDomain";
import OperaioSheet from "../features/manodopera/components/OperaioSheet";

export default function Operai() {
  const [operai, setOperai] = useDatiLocaliSincronizzati(leggiOperaiTutti);
  const [sheetAperto, setSheetAperto] = useState(false);
  const [inModifica, setInModifica] = useState(null);
  const [menuOperaio, setMenuOperaio] = useState(null);
  const [mostraDisattivi, setMostraDisattivi] = useState(false);
  const busyRef = useRef(false);

  const lista = useMemo(() => {
    const base = Array.isArray(operai) ? operai : [];
    const filtrati = mostraDisattivi
      ? base
      : base.filter((o) => o?.attivo !== false);
    return [...filtrati].sort((a, b) =>
      nomeCompletoOperaio(a).localeCompare(nomeCompletoOperaio(b), "it")
    );
  }, [operai, mostraDisattivi]);

  function persisti(prossimo) {
    salvaOperai(prossimo);
    setOperai(prossimo);
  }

  function salvaOperaio(operaio) {
    if (busyRef.current) return { ok: false, errore: "Operazione in corso." };
    busyRef.current = true;
    try {
      const base = Array.isArray(operai) ? operai : [];
      const idx = base.findIndex((o) => String(o.id) === String(operaio.id));
      const prossimo =
        idx >= 0
          ? base.map((o, i) => (i === idx ? operaio : o))
          : [...base, operaio];
      persisti(prossimo);
      return { ok: true };
    } finally {
      busyRef.current = false;
    }
  }

  function toggleAttivo(operaio) {
    if (busyRef.current || !operaio) return;
    busyRef.current = true;
    try {
      const esito =
        operaio.attivo === false
          ? riattivaOperaio(operaio)
          : disattivaOperaio(operaio);
      if (!esito.ok) return;
      const prossimo = (operai || []).map((o) =>
        String(o.id) === String(operaio.id) ? esito.operaio : o
      );
      persisti(prossimo);
      setMenuOperaio(null);
    } finally {
      busyRef.current = false;
    }
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="operai-page">
        <PageBackLink />
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="section-label">Personale</p>
            <h1 className="ds-page-title mt-1">Operai</h1>
            <p className="ds-text-secondary mt-2">
              Persone della squadra. Costi per giornata o ora.
            </p>
            <Link
              to={ROUTES.manodopera}
              className="inline-flex items-center min-h-[44px] text-sm text-yellow-300 font-medium mt-1"
              data-testid="operai-link-manodopera"
            >
              Vedi giornate e ore
            </Link>
          </div>
          <button
            type="button"
            className="btn-primary min-h-[48px] px-4 inline-flex items-center gap-2 shrink-0 font-semibold"
            data-testid="operai-aggiungi"
            onClick={() => {
              setInModifica(null);
              setSheetAperto(true);
            }}
          >
            <Plus size={18} aria-hidden="true" />
            Aggiungi
          </button>
        </div>

        <label className="flex items-center gap-3 mb-4 min-h-[44px]">
          <input
            type="checkbox"
            checked={mostraDisattivi}
            onChange={(e) => setMostraDisattivi(e.target.checked)}
            className="h-5 w-5"
            data-testid="operai-mostra-disattivi"
          />
          <span className="ds-text-secondary text-sm">Mostra disattivati</span>
        </label>

        {lista.length === 0 ? (
          <div className="ds-empty pro-panel p-6 text-center" data-testid="operai-vuoto">
            <UserRound className="mx-auto text-yellow-300 mb-3" size={28} />
            <p className="ds-card-title">Nessun operaio</p>
            <p className="ds-text-secondary text-sm mt-2">
              Aggiungi chi lavora con te per registrare giornate e costi.
            </p>
            <button
              type="button"
              className="btn-primary mt-4 min-h-[52px] px-5 font-semibold"
              onClick={() => setSheetAperto(true)}
            >
              <Plus size={18} className="inline mr-2" aria-hidden="true" />
              Aggiungi operaio
            </button>
          </div>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0 ds-card-grid" data-testid="operai-lista">
            {lista.map((operaio) => {
              const attivo = operaio.attivo !== false;
              return (
                <li
                  key={operaio.id}
                  className="pro-panel p-4"
                  data-testid="operaio-card"
                  data-operaio-id={operaio.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-yellow-400/15 text-yellow-300 shrink-0">
                      <UserRound size={22} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="ds-text-primary font-medium truncate">
                        {nomeCompletoOperaio(operaio)}
                      </p>
                      <p className="ds-text-secondary text-sm mt-1">
                        {operaio.ruolo || "Elettricista"}
                      </p>
                      <p className="ds-text-secondary text-sm mt-1">
                        {etichettaCostoOperaio(operaio)}
                      </p>
                      <p
                        className={`text-xs font-medium mt-2 ${
                          attivo ? "text-emerald-300" : "text-slate-400"
                        }`}
                      >
                        {attivo ? "● Attivo" : "○ Disattivo"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center"
                      aria-label={`Azioni ${nomeCompletoOperaio(operaio)}`}
                      data-testid="operaio-menu"
                      onClick={() => setMenuOperaio(operaio)}
                    >
                      <MoreHorizontal size={20} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <OperaioSheet
          open={sheetAperto}
          operaio={inModifica}
          onClose={() => {
            setSheetAperto(false);
            setInModifica(null);
          }}
          onSalva={salvaOperaio}
        />

        <BottomSheet
          open={Boolean(menuOperaio)}
          onClose={() => setMenuOperaio(null)}
          title={nomeCompletoOperaio(menuOperaio)}
        >
          <div className="flex flex-col gap-3 p-1">
            <button
              type="button"
              className="pro-panel p-4 flex items-center gap-4 min-h-[56px] text-left"
              data-testid="operaio-modifica"
              onClick={() => {
                setInModifica(menuOperaio);
                setMenuOperaio(null);
                setSheetAperto(true);
              }}
            >
              <Pencil className="text-yellow-300" size={20} />
              <span className="ds-card-title">Modifica</span>
            </button>
            <button
              type="button"
              className="pro-panel p-4 flex items-center gap-4 min-h-[56px] text-left"
              data-testid="operaio-toggle-attivo"
              onClick={() => toggleAttivo(menuOperaio)}
            >
              {menuOperaio?.attivo === false ? (
                <UserCheck className="text-yellow-300" size={20} />
              ) : (
                <UserX className="text-rose-200" size={20} />
              )}
              <span className="ds-card-title">
                {menuOperaio?.attivo === false ? "Riattiva" : "Disattiva"}
              </span>
            </button>
          </div>
        </BottomSheet>
      </div>
    </PageWrapper>
  );
}

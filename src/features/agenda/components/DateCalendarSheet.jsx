import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import BottomSheet from "../../../components/BottomSheet";
import {
  formattaDataLocale,
  parseDataScheduling,
} from "../../lavori/schedulingDomain";

const INTESTAZIONI_GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

/**
 * Costruisce la griglia mensile (lun–dom) con giorni del mese precedente/successivo.
 * @param {number} anno
 * @param {number} mese 0-based
 */
export function costruisciGrigliaCalendario(anno, mese) {
  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0);

  let offset = primoGiorno.getDay() - 1;
  if (offset < 0) offset = 6;

  const celle = [];

  for (let i = offset - 1; i >= 0; i -= 1) {
    const data = new Date(anno, mese, -i);
    celle.push({ data, meseCorrente: false });
  }

  for (let giorno = 1; giorno <= ultimoGiorno.getDate(); giorno += 1) {
    celle.push({ data: new Date(anno, mese, giorno), meseCorrente: true });
  }

  while (celle.length % 7 !== 0) {
    const ultima = celle[celle.length - 1].data;
    const data = new Date(ultima);
    data.setDate(data.getDate() + 1);
    celle.push({ data, meseCorrente: false });
  }

  return celle;
}

export function stessoGiorno(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Calendario mensile in BottomSheet — compatibile Safari, Chrome iOS e PWA.
 */
export default function DateCalendarSheet({
  open,
  onClose,
  value = "",
  onSelect,
  oggi = new Date(),
}) {
  const dataSelezionata = useMemo(
    () => parseDataScheduling(value),
    [value]
  );
  const oggiNormalizzato = useMemo(
    () => parseDataScheduling(oggi) || new Date(),
    [oggi]
  );

  const [meseVisibile, setMeseVisibile] = useState(() => {
    const base = dataSelezionata || oggiNormalizzato;
    return { anno: base.getFullYear(), mese: base.getMonth() };
  });

  useEffect(() => {
    if (!open) return;
    const base = dataSelezionata || oggiNormalizzato;
    setMeseVisibile({ anno: base.getFullYear(), mese: base.getMonth() });
  }, [open, value, oggi, dataSelezionata, oggiNormalizzato]);

  const etichettaMese = new Date(meseVisibile.anno, meseVisibile.mese, 1)
    .toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const celle = costruisciGrigliaCalendario(
    meseVisibile.anno,
    meseVisibile.mese
  );

  function mesePrecedente() {
    setMeseVisibile((prev) => {
      const data = new Date(prev.anno, prev.mese - 1, 1);
      return { anno: data.getFullYear(), mese: data.getMonth() };
    });
  }

  function meseSuccessivo() {
    setMeseVisibile((prev) => {
      const data = new Date(prev.anno, prev.mese + 1, 1);
      return { anno: data.getFullYear(), mese: data.getMonth() };
    });
  }

  function seleziona(data) {
    onSelect?.(formattaDataLocale(data));
    onClose?.();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Scegli la data"
      zIndex={80}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={mesePrecedente}
            aria-label="Mese precedente"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[16px] bg-white/10 text-slate-200"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <p className="ds-text-primary text-base font-semibold capitalize">
            {etichettaMese}
          </p>

          <button
            type="button"
            onClick={meseSuccessivo}
            aria-label="Mese successivo"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[16px] bg-white/10 text-slate-200"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-1"
          role="grid"
          aria-label={`Calendario ${etichettaMese}`}
        >
          {INTESTAZIONI_GIORNI.map((giorno) => (
            <div
              key={giorno}
              className="ds-text-secondary text-center text-xs font-bold py-1"
              role="columnheader"
            >
              {giorno}
            </div>
          ))}

          {celle.map(({ data, meseCorrente }) => {
            const selezionato = stessoGiorno(data, dataSelezionata);
            const oggiCella = stessoGiorno(data, oggiNormalizzato);
            const etichetta = data.toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <button
                key={data.toISOString()}
                type="button"
                role="gridcell"
                aria-label={etichetta}
                aria-selected={selezionato}
                onClick={() => seleziona(data)}
                className={`min-h-[44px] rounded-[12px] text-sm font-semibold transition-colors ${
                  selezionato
                    ? "bg-yellow-400 text-black"
                    : oggiCella
                      ? "bg-yellow-400/15 text-yellow-100 ring-1 ring-yellow-400/40"
                      : meseCorrente
                        ? "text-slate-100 hover:bg-white/10"
                        : "text-slate-500 hover:bg-white/5"
                }`}
              >
                {data.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}

import { memo, useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import RigaListino from "./RigaListino";
import {
  creaStatoCategorieAperte,
  quantitaDaMappa,
  raggruppaListinoPerCategoria,
} from "../utils/listinoGrouping";

function CategorieListino({
  listino,
  quantitaPerVoce,
  categorieAperteDefault = [],
  onAggiungiVoce,
}) {
  const baseId = useId();

  const categorie = useMemo(
    () => raggruppaListinoPerCategoria(listino),
    [listino]
  );

  const [overrideAperte, setOverrideAperte] = useState({});

  const aperte = useMemo(() => {
    const base = creaStatoCategorieAperte(categorie, categorieAperteDefault);
    const unite = { ...base };

    categorie.forEach((categoria) => {
      if (overrideAperte[categoria.nome] !== undefined) {
        unite[categoria.nome] = overrideAperte[categoria.nome];
      }
    });

    return unite;
  }, [categorie, categorieAperteDefault, overrideAperte]);

  function toggleCategoria(nome) {
    setOverrideAperte((precedente) => ({
      ...precedente,
      [nome]: !aperte[nome],
    }));
  }

  if (categorie.length === 0) {
    return (
      <div className="pro-panel p-5 text-center text-slate-400 text-sm">
        Nessuna voce nel listino.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categorie.map((categoria) => {
        const isAperta = aperte[categoria.nome];
        const pannelloId = `${baseId}-${categoria.nome}`;

        return (
          <section
            key={categoria.nome}
            className="pro-panel overflow-hidden"
            aria-labelledby={`${pannelloId}-titolo`}
          >
            <button
              type="button"
              id={`${pannelloId}-titolo`}
              onClick={() => toggleCategoria(categoria.nome)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3"
              aria-expanded={isAperta}
              aria-controls={pannelloId}
            >
              <span className="font-black text-left">
                <span aria-hidden="true">{categoria.icona} </span>
                {categoria.nome}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {categoria.voci.length}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${
                  isAperta ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isAperta ? (
              <div
                id={pannelloId}
                className="px-2 pb-2 space-y-1 border-t border-white/8"
              >
                {categoria.voci.map((voce) => (
                  <RigaListino
                    key={voce.id || voce.nome}
                    voce={voce}
                    compatto
                    quantita={quantitaDaMappa(quantitaPerVoce, voce)}
                    onAggiungi={onAggiungiVoce}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

export default memo(CategorieListino);

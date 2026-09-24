import { useMemo, useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  convertiUnita,
  formatNumeroIt,
  invertiUnita,
  parseNumeroPositivo,
  UNITA_CONVERSIONE,
} from "../domain";
import {
  CalcoloActions,
  FormulaBox,
  NumericField,
  RisultatoBox,
  UnitSelect,
} from "../components/CalcoloUi";

const FAMIGLIE = {
  potenza: ["W", "kW"],
  corrente: ["A", "mA"],
  tensione: ["V", "mV", "kV"],
  resistenza: ["Ω", "kΩ", "mΩ"],
  lunghezza: ["m", "cm", "mm"],
  sezione: ["mm²", "cm²"],
};

function famigliaDi(unita) {
  return Object.keys(FAMIGLIE).find((f) => FAMIGLIE[f].includes(unita));
}

export default function CalcoloConversioniPage() {
  const [valore, setValore] = useState("");
  const [da, setDa] = useState("W");
  const [a, setA] = useState("kW");
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  const opzioniA = useMemo(() => {
    const fam = famigliaDi(da) || "potenza";
    return FAMIGLIE[fam].filter((u) => u !== da);
  }, [da]);

  function onChangeDa(next) {
    setDa(next);
    const fam = famigliaDi(next);
    const dest = FAMIGLIE[fam].find((u) => u !== next) || next;
    setA(dest);
    setRisultato(null);
  }

  function reset() {
    setValore("");
    setDa("W");
    setA("kW");
    setRisultato(null);
    setErrore("");
  }

  function inverti() {
    const swapped = invertiUnita(da, a);
    setDa(swapped.da);
    setA(swapped.a);
    if (risultato?.ok) {
      setValore(String(risultato.valore));
      setRisultato(null);
    }
  }

  function calcola() {
    const v = parseNumeroPositivo(valore, { zeroConsentito: true });
    if (!v.ok) {
      setRisultato(null);
      setErrore(v.errore);
      return;
    }
    const out = convertiUnita({ valore: v.value, da, a });
    if (!out.ok) {
      setRisultato(null);
      setErrore(out.errore);
      return;
    }
    setErrore("");
    setRisultato(out);
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white space-y-5">
        <PageBackLink testId="calcoli-conversioni-back" />
        <header>
          <h1 className="ds-page-title">Conversioni</h1>
          <p className="ds-text-secondary mt-2">Conversioni esatte di unità</p>
        </header>

        <NumericField
          id="conv-val"
          label="Valore"
          value={valore}
          onChange={setValore}
        />
        <UnitSelect
          id="conv-da"
          label="Unità"
          value={da}
          onChange={onChangeDa}
          options={UNITA_CONVERSIONE.map((u) => ({ value: u, label: u }))}
        />

        <button
          type="button"
          onClick={inverti}
          className="btn-secondary w-full min-h-[48px]"
          data-testid="calcolo-inverti"
        >
          ⇄ Inverti
        </button>

        <UnitSelect
          id="conv-a"
          label="Verso"
          value={opzioniA.includes(a) ? a : opzioniA[0]}
          onChange={setA}
          options={opzioniA.map((u) => ({ value: u, label: u }))}
        />

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox>
              <p className="text-3xl font-bold tabular-nums text-yellow-300">
                {formatNumeroIt(risultato.valore, 6)} {risultato.a}
              </p>
            </RisultatoBox>
            <FormulaBox formula={risultato.formula} />
          </>
        ) : null}
      </div>
    </PageWrapper>
  );
}

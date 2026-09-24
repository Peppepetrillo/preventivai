import { useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  calcolaLeggeOhm,
  formatNumeroIt,
  parseNumeroOpzionale,
} from "../domain";
import {
  AvvisoBox,
  CalcoloActions,
  FormulaBox,
  NumericField,
  RisultatoBox,
} from "../components/CalcoloUi";

const VUOTO = { tensione: "", corrente: "", resistenza: "" };

export default function CalcoloOhmPage() {
  const [form, setForm] = useState(VUOTO);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrore("");
  }

  function reset() {
    setForm(VUOTO);
    setRisultato(null);
    setErrore("");
  }

  function calcola() {
    const v = parseNumeroOpzionale(form.tensione);
    const i = parseNumeroOpzionale(form.corrente);
    const r = parseNumeroOpzionale(form.resistenza);
    if (!v.ok || !i.ok || !r.ok) {
      setRisultato(null);
      setErrore((!v.ok && v.errore) || (!i.ok && i.errore) || r.errore);
      return;
    }
    const out = calcolaLeggeOhm({
      tensione: v.value,
      corrente: i.value,
      resistenza: r.value,
    });
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
        <PageBackLink testId="calcoli-ohm-back" />
        <header>
          <h1 className="ds-page-title">Legge di Ohm</h1>
          <p className="ds-text-secondary mt-2">
            Lascia vuoto un solo valore da calcolare.
          </p>
        </header>

        <div className="space-y-4">
          <NumericField
            id="ohm-v"
            label="Tensione"
            unit="V"
            value={form.tensione}
            onChange={(v) => setField("tensione", v)}
          />
          <NumericField
            id="ohm-i"
            label="Corrente"
            unit="A"
            value={form.corrente}
            onChange={(v) => setField("corrente", v)}
          />
          <NumericField
            id="ohm-r"
            label="Resistenza"
            unit="Ω"
            value={form.resistenza}
            onChange={(v) => setField("resistenza", v)}
          />
        </div>

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox>
              <p className="text-3xl font-bold tabular-nums text-yellow-300">
                {risultato.calcolato === "tensione" &&
                  `${formatNumeroIt(risultato.tensione, 3)} V`}
                {risultato.calcolato === "corrente" &&
                  `${formatNumeroIt(risultato.corrente, 3)} A`}
                {risultato.calcolato === "resistenza" &&
                  `${formatNumeroIt(risultato.resistenza, 3)} Ω`}
              </p>
              <ul className="mt-4 space-y-1 ds-text-secondary text-sm">
                <li>Tensione · {formatNumeroIt(risultato.tensione, 3)} V</li>
                <li>Corrente · {formatNumeroIt(risultato.corrente, 3)} A</li>
                <li>Resistenza · {formatNumeroIt(risultato.resistenza, 3)} Ω</li>
              </ul>
            </RisultatoBox>
            <FormulaBox formula={risultato.formula} />
          </>
        ) : null}
        <AvvisoBox>
          Strumento di calcolo matematico. Non sostituisce una verifica
          progettuale.
        </AvvisoBox>
      </div>
    </PageWrapper>
  );
}

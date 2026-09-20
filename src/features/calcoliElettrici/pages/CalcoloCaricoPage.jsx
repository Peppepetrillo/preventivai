import { useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  calcolaPotenzaImpegnata,
  formatNumeroIt,
  parseNumeroOpzionale,
  parseNumeroPositivo,
  potenzaInWatt,
} from "../domain";
import {
  AvvisoBox,
  CalcoloActions,
  FormulaBox,
  NumericField,
  RisultatoBox,
  UnitSelect,
} from "../components/CalcoloUi";

const CARICO_VUOTO = { nome: "", potenza: "", unita: "W" };

export default function CalcoloCaricoPage() {
  const [carichi, setCarichi] = useState([
    { ...CARICO_VUOTO, nome: "Forno" },
    { ...CARICO_VUOTO, nome: "Lavatrice" },
    { ...CARICO_VUOTO, nome: "Lavastoviglie" },
    { ...CARICO_VUOTO, nome: "Luci" },
  ]);
  const [coeff, setCoeff] = useState("");
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function updateCarico(index, patch) {
    setCarichi((list) =>
      list.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  function addCarico() {
    setCarichi((list) => [...list, { ...CARICO_VUOTO }]);
  }

  function removeCarico(index) {
    setCarichi((list) => list.filter((_, i) => i !== index));
  }

  function reset() {
    setCarichi([
      { ...CARICO_VUOTO, nome: "Forno" },
      { ...CARICO_VUOTO, nome: "Lavatrice" },
      { ...CARICO_VUOTO, nome: "Lavastoviglie" },
      { ...CARICO_VUOTO, nome: "Luci" },
    ]);
    setCoeff("");
    setRisultato(null);
    setErrore("");
  }

  function calcola() {
    const watts = [];
    for (const c of carichi) {
      if (c.potenza === "" || c.potenza == null) continue;
      const p = parseNumeroPositivo(c.potenza, { zeroConsentito: true });
      if (!p.ok) {
        setRisultato(null);
        setErrore(p.errore);
        return;
      }
      watts.push(potenzaInWatt(p.value, c.unita));
    }
    const k = parseNumeroOpzionale(coeff);
    if (!k.ok) {
      setRisultato(null);
      setErrore(k.errore);
      return;
    }
    const out = calcolaPotenzaImpegnata({
      carichiW: watts,
      coefficienteContemporaneita: k.value,
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
        <PageBackLink testId="calcoli-carico-back" />
        <header>
          <h1 className="ds-page-title">Stima del carico</h1>
          <p className="ds-text-secondary mt-2">
            Somma carichi e eventuale contemporaneità
          </p>
        </header>

        <div className="space-y-4">
          {carichi.map((c, index) => (
            <div key={index} className="pro-panel p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex-1">
                  <span className="sr-only">Nome carico {index + 1}</span>
                  <input
                    type="text"
                    className="input-pro min-h-[48px]"
                    value={c.nome}
                    placeholder={`Carico ${index + 1}`}
                    onChange={(e) => updateCarico(index, { nome: e.target.value })}
                  />
                </label>
                {carichi.length > 1 ? (
                  <button
                    type="button"
                    className="btn-secondary min-h-[48px] px-3 text-sm"
                    onClick={() => removeCarico(index)}
                    aria-label={`Rimuovi carico ${index + 1}`}
                  >
                    Rimuovi
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumericField
                  id={`carico-p-${index}`}
                  label="Potenza"
                  value={c.potenza}
                  onChange={(v) => updateCarico(index, { potenza: v })}
                />
                <UnitSelect
                  id={`carico-u-${index}`}
                  label="Unità"
                  value={c.unita}
                  onChange={(v) => updateCarico(index, { unita: v })}
                  options={[
                    { value: "W", label: "W" },
                    { value: "kW", label: "kW" },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCarico}
          className="btn-secondary w-full min-h-[48px]"
        >
          Aggiungi carico
        </button>

        <NumericField
          id="carico-k"
          label="Coefficiente di contemporaneità (opzionale)"
          value={coeff}
          onChange={setCoeff}
          hint="Tra 0 e 1. Se vuoto, solo potenza totale installata."
        />

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox titolo="Stima del carico">
              <p className="section-label">Potenza totale installata</p>
              <p className="text-3xl font-bold tabular-nums text-yellow-300 mt-1">
                {formatNumeroIt(risultato.potenzaInstallataKw, 3)} kW
              </p>
              <p className="ds-text-secondary text-sm mt-1">
                {formatNumeroIt(risultato.potenzaInstallataW, 0)} W
              </p>
              {risultato.potenzaContemporaneaW != null ? (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="section-label">Potenza stimata contemporanea</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">
                    {formatNumeroIt(risultato.potenzaContemporaneaKw, 3)} kW
                  </p>
                </div>
              ) : null}
            </RisultatoBox>
            <FormulaBox formula={risultato.formula} />
            <AvvisoBox>{risultato.avviso}</AvvisoBox>
          </>
        ) : (
          <AvvisoBox>
            Stima del carico. Non è una potenza contrattuale consigliata.
          </AvvisoBox>
        )}
      </div>
    </PageWrapper>
  );
}

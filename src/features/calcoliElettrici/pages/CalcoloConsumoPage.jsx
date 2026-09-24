import { useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  calcolaEnergia,
  formatNumeroIt,
  parseNumeroOpzionale,
  parseNumeroPositivo,
} from "../domain";
import {
  AvvisoBox,
  CalcoloActions,
  FormulaBox,
  NumericField,
  RisultatoBox,
  UnitSelect,
} from "../components/CalcoloUi";

export default function CalcoloConsumoPage() {
  const [potenza, setPotenza] = useState("");
  const [unitaP, setUnitaP] = useState("kW");
  const [tempo, setTempo] = useState("");
  const [unitaT, setUnitaT] = useState("ore");
  const [costo, setCosto] = useState("");
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function reset() {
    setPotenza("");
    setUnitaP("kW");
    setTempo("");
    setUnitaT("ore");
    setCosto("");
    setRisultato(null);
    setErrore("");
  }

  function calcola() {
    const p = parseNumeroPositivo(potenza, { zeroConsentito: true });
    const t = parseNumeroPositivo(tempo, { zeroConsentito: true });
    const c = parseNumeroOpzionale(costo);
    if (!p.ok || !t.ok || !c.ok) {
      setRisultato(null);
      setErrore((!p.ok && p.errore) || (!t.ok && t.errore) || c.errore);
      return;
    }
    const out = calcolaEnergia({
      potenza: p.value,
      unitaPotenza: unitaP,
      tempo: t.value,
      unitaTempo: unitaT,
      costoPerKwh: c.value,
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
        <PageBackLink testId="calcoli-consumo-back" />
        <header>
          <h1 className="ds-page-title">Consumo</h1>
          <p className="ds-text-secondary mt-2">Energia = Potenza × Tempo</p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <NumericField
            id="cons-p"
            label="Potenza"
            value={potenza}
            onChange={setPotenza}
          />
          <UnitSelect
            id="cons-up"
            label="Unità"
            value={unitaP}
            onChange={setUnitaP}
            options={[
              { value: "W", label: "W" },
              { value: "kW", label: "kW" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumericField
            id="cons-t"
            label="Tempo"
            value={tempo}
            onChange={setTempo}
          />
          <UnitSelect
            id="cons-ut"
            label="Unità"
            value={unitaT}
            onChange={setUnitaT}
            options={[
              { value: "ore", label: "ore" },
              { value: "giorni", label: "giorni" },
            ]}
          />
        </div>
        <NumericField
          id="cons-costo"
          label="€/kWh (opzionale)"
          unit="€"
          value={costo}
          onChange={setCosto}
          hint="Solo per stima costo — non bolletta reale"
        />

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox>
              <p className="text-3xl font-bold tabular-nums text-yellow-300">
                {formatNumeroIt(risultato.energiaKwh, 3)} kWh
              </p>
              <p className="ds-text-secondary mt-2">
                {formatNumeroIt(risultato.energiaWh, 1)} Wh
              </p>
              {risultato.stimaCostoEuro != null ? (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="section-label">Stima costo</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">
                    {formatNumeroIt(risultato.stimaCostoEuro, 2)} €
                  </p>
                </div>
              ) : null}
            </RisultatoBox>
            <FormulaBox formula={risultato.formula} />
            {risultato.avvisoCosto ? (
              <AvvisoBox>{risultato.avvisoCosto}</AvvisoBox>
            ) : null}
          </>
        ) : null}
      </div>
    </PageWrapper>
  );
}

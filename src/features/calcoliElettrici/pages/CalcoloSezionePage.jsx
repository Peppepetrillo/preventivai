import { useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  formatNumeroIt,
  parseNumeroPositivo,
  stimaSezioneCavo,
} from "../domain";
import {
  AvvisoBox,
  CalcoloActions,
  FormulaBox,
  NumericField,
  RisultatoBox,
  SegmentedControl,
} from "../components/CalcoloUi";

export default function CalcoloSezionePage() {
  const [sistema, setSistema] = useState("monofase");
  const [materiale, setMateriale] = useState("rame");
  const [corrente, setCorrente] = useState("");
  const [lunghezza, setLunghezza] = useState("");
  const [tensione, setTensione] = useState("230");
  const [cadutaMax, setCadutaMax] = useState("4");
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function reset() {
    setSistema("monofase");
    setMateriale("rame");
    setCorrente("");
    setLunghezza("");
    setTensione("230");
    setCadutaMax("4");
    setRisultato(null);
    setErrore("");
  }

  function calcola() {
    const i = parseNumeroPositivo(corrente, { zeroConsentito: true });
    const l = parseNumeroPositivo(lunghezza);
    const v = parseNumeroPositivo(tensione);
    const c = parseNumeroPositivo(cadutaMax);
    if (!i.ok || !l.ok || !v.ok || !c.ok) {
      setRisultato(null);
      setErrore(
        (!i.ok && i.errore) ||
          (!l.ok && l.errore) ||
          (!v.ok && v.errore) ||
          c.errore
      );
      return;
    }
    const out = stimaSezioneCavo({
      correnteA: i.value,
      lunghezzaM: l.value,
      tensioneV: v.value,
      sistema,
      materiale,
      cadutaMaxPercentuale: c.value,
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
        <PageBackLink testId="calcoli-sezione-back" />
        <header>
          <h1 className="ds-page-title">Stima sezione cavo</h1>
          <p className="ds-text-secondary mt-2">
            Solo criterio di caduta di tensione — non dimensionamento normativo
          </p>
        </header>

        <SegmentedControl
          label="Sistema"
          value={sistema}
          onChange={(v) => {
            setSistema(v);
            setTensione(v === "trifase" ? "400" : "230");
          }}
          options={[
            { value: "monofase", label: "Monofase" },
            { value: "trifase", label: "Trifase" },
          ]}
        />
        <SegmentedControl
          label="Materiale"
          value={materiale}
          onChange={setMateriale}
          options={[
            { value: "rame", label: "Rame" },
            { value: "alluminio", label: "Alluminio" },
          ]}
        />

        <NumericField
          id="sez-i"
          label="Corrente"
          unit="A"
          value={corrente}
          onChange={setCorrente}
        />
        <NumericField
          id="sez-l"
          label="Lunghezza"
          unit="m"
          value={lunghezza}
          onChange={setLunghezza}
        />
        <NumericField
          id="sez-v"
          label="Tensione"
          unit="V"
          value={tensione}
          onChange={setTensione}
        />
        <NumericField
          id="sez-du"
          label="Caduta massima ammessa"
          unit="%"
          value={cadutaMax}
          onChange={setCadutaMax}
        />

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox titolo="Sezione stimata">
              <p className="text-3xl font-bold tabular-nums text-yellow-300">
                {formatNumeroIt(risultato.sezioneStimataMm2, 1)} mm²
              </p>
              <p className="ds-text-secondary text-sm mt-3">
                Sezione calcolata ·{" "}
                {formatNumeroIt(risultato.sezioneCalcolataMm2, 3)} mm²
              </p>
              <p className="ds-text-secondary text-sm mt-2">
                Sezioni standard usate:{" "}
                {risultato.sezioniStandardMm2
                  .map((s) => String(s).replace(".", ","))
                  .join(" · ")}{" "}
                mm²
              </p>
            </RisultatoBox>
            <FormulaBox formula={risultato.formula} />
            <AvvisoBox>
              <p className="font-medium">
                Sezione minima stimata per il criterio di caduta di tensione.
              </p>
              <p className="mt-2">
                Da verificare in base alle condizioni reali di posa e alla
                portata del cavo.
              </p>
            </AvvisoBox>
          </>
        ) : (
          <AvvisoBox>
            Sezione minima stimata per il criterio di caduta di tensione. Da
            verificare in base alle condizioni reali di posa e alla portata del
            cavo.
          </AvvisoBox>
        )}
      </div>
    </PageWrapper>
  );
}

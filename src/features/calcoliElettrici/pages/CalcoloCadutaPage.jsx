import { useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  calcolaCadutaTensione,
  formatNumeroIt,
  parseNumeroPositivo,
  SEZIONI_STANDARD_MM2,
} from "../domain";
import {
  AvvisoBox,
  CalcoloActions,
  FormulaBox,
  NumericField,
  RisultatoBox,
  SegmentedControl,
  UnitSelect,
} from "../components/CalcoloUi";

export default function CalcoloCadutaPage() {
  const [sistema, setSistema] = useState("monofase");
  const [materiale, setMateriale] = useState("rame");
  const [tensione, setTensione] = useState("230");
  const [corrente, setCorrente] = useState("");
  const [lunghezza, setLunghezza] = useState("");
  const [sezione, setSezione] = useState("2.5");
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function reset() {
    setSistema("monofase");
    setMateriale("rame");
    setTensione("230");
    setCorrente("");
    setLunghezza("");
    setSezione("2.5");
    setRisultato(null);
    setErrore("");
  }

  function calcola() {
    const v = parseNumeroPositivo(tensione);
    const i = parseNumeroPositivo(corrente, { zeroConsentito: true });
    const l = parseNumeroPositivo(lunghezza);
    const s = parseNumeroPositivo(sezione);
    if (!v.ok || !i.ok || !l.ok || !s.ok) {
      setRisultato(null);
      setErrore(
        (!v.ok && v.errore) ||
          (!i.ok && i.errore) ||
          (!l.ok && l.errore) ||
          s.errore
      );
      return;
    }
    const out = calcolaCadutaTensione({
      tensioneNominaleV: v.value,
      correnteA: i.value,
      lunghezzaM: l.value,
      sezioneMm2: s.value,
      materiale,
      sistema,
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
        <PageBackLink testId="calcoli-caduta-back" />
        <header>
          <h1 className="ds-page-title">Caduta di tensione</h1>
          <p className="ds-text-secondary mt-2">Calcolo indicativo di ΔU</p>
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
          id="cad-v"
          label="Tensione nominale"
          unit="V"
          value={tensione}
          onChange={setTensione}
        />
        <NumericField
          id="cad-i"
          label="Corrente"
          unit="A"
          value={corrente}
          onChange={setCorrente}
        />
        <NumericField
          id="cad-l"
          label="Lunghezza tratta"
          unit="m"
          value={lunghezza}
          onChange={setLunghezza}
        />
        <UnitSelect
          id="cad-s"
          label="Sezione cavo"
          value={sezione}
          onChange={setSezione}
          options={SEZIONI_STANDARD_MM2.map((mm) => ({
            value: String(mm),
            label: `${String(mm).replace(".", ",")} mm²`,
          }))}
        />

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox>
              <p className="text-3xl font-bold tabular-nums text-yellow-300">
                {formatNumeroIt(risultato.cadutaV, 2)} V
              </p>
              <p className="text-xl font-semibold tabular-nums mt-2">
                {formatNumeroIt(risultato.cadutaPercentuale, 2)} %
              </p>
            </RisultatoBox>
            <FormulaBox formula={risultato.formula}>
              <ul className="mt-3 space-y-1 ds-text-secondary text-sm">
                <li>
                  ρ · {risultato.parametri.resistivitaOhmMm2PerM} Ω·mm²/m (
                  {risultato.parametri.materiale})
                </li>
                <li>S · {risultato.parametri.sezioneMm2} mm²</li>
                <li>L · {risultato.parametri.lunghezzaM} m</li>
                <li>I · {risultato.parametri.correnteA} A</li>
              </ul>
            </FormulaBox>
            <AvvisoBox>{risultato.avviso}</AvvisoBox>
          </>
        ) : (
          <AvvisoBox>
            Calcolo indicativo della caduta di tensione. La verifica finale
            deve considerare condizioni di posa, portata, temperatura,
            lunghezza, protezioni e normativa applicabile.
          </AvvisoBox>
        )}
      </div>
    </PageWrapper>
  );
}

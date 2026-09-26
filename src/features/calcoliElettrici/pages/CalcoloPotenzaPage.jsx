import { useState } from "react";

import PageWrapper from "../../../components/PageWrapper";
import PageBackLink from "../../../components/PageBackLink";
import {
  calcolaCorrenteMonofase,
  calcolaCorrenteTrifase,
  calcolaPotenzaMonofase,
  calcolaPotenzaTrifase,
  formatNumeroIt,
  parseNumeroOpzionale,
  parseNumeroPositivo,
  potenzaInWatt,
  wattInUnita,
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

const COS_DEFAULT = "0,9";

export default function CalcoloPotenzaPage() {
  const [sistema, setSistema] = useState("monofase");
  const [unitaP, setUnitaP] = useState("W");
  const [potenza, setPotenza] = useState("");
  const [tensione, setTensione] = useState("230");
  const [corrente, setCorrente] = useState("");
  const [cosPhi, setCosPhi] = useState(COS_DEFAULT);
  const [risultato, setRisultato] = useState(null);
  const [errore, setErrore] = useState("");

  function reset() {
    setSistema("monofase");
    setUnitaP("W");
    setPotenza("");
    setTensione("230");
    setCorrente("");
    setCosPhi(COS_DEFAULT);
    setRisultato(null);
    setErrore("");
  }

  function calcola() {
    const vP = parseNumeroOpzionale(potenza);
    const vV = parseNumeroPositivo(tensione);
    const vI = parseNumeroOpzionale(corrente);
    if (!vP.ok || !vV.ok || !vI.ok) {
      setRisultato(null);
      setErrore((!vP.ok && vP.errore) || (!vV.ok && vV.errore) || vI.errore);
      return;
    }

    const hasP = vP.value != null;
    const hasI = vI.value != null;
    if (hasP === hasI) {
      setRisultato(null);
      setErrore("Inserisci potenza oppure corrente (un solo valore da calcolare).");
      return;
    }

    let cos = 1;
    if (sistema === "trifase") {
      const c = parseNumeroPositivo(cosPhi);
      if (!c.ok) {
        setRisultato(null);
        setErrore(c.errore);
        return;
      }
      if (c.value <= 0 || c.value > 1) {
        setRisultato(null);
        setErrore("cosφ deve essere tra 0 e 1 (escluso 0).");
        return;
      }
      cos = c.value;
    }

    let out;
    if (!hasI) {
      const pW = potenzaInWatt(vP.value, unitaP);
      out =
        sistema === "monofase"
          ? calcolaCorrenteMonofase({ potenzaW: pW, tensioneV: vV.value })
          : calcolaCorrenteTrifase({
              potenzaW: pW,
              tensioneV: vV.value,
              cosPhi: cos,
            });
      if (!out.ok) {
        setRisultato(null);
        setErrore(out.errore);
        return;
      }
      setErrore("");
      setRisultato({
        tipo: "corrente",
        correnteA: out.correnteA,
        potenzaW: pW,
        tensioneV: vV.value,
        formula: out.formula,
        cosPhiUsato: out.cosPhiUsato,
      });
      return;
    }

    out =
      sistema === "monofase"
        ? calcolaPotenzaMonofase({ correnteA: vI.value, tensioneV: vV.value })
        : calcolaPotenzaTrifase({
            correnteA: vI.value,
            tensioneV: vV.value,
            cosPhi: cos,
          });
    if (!out.ok) {
      setRisultato(null);
      setErrore(out.errore);
      return;
    }
    setErrore("");
    setRisultato({
      tipo: "potenza",
      potenzaW: out.potenzaW,
      correnteA: vI.value,
      tensioneV: vV.value,
      formula: out.formula,
      cosPhiUsato: out.cosPhiUsato,
    });
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white space-y-5">
        <PageBackLink testId="calcoli-potenza-back" />
        <header>
          <h1 className="ds-page-title">Potenza e corrente</h1>
          <p className="ds-text-secondary mt-2">
            Inserisci tensione e lascia vuoto potenza o corrente.
          </p>
        </header>

        <SegmentedControl
          label="Sistema"
          name="sistema"
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

        <div className="grid grid-cols-2 gap-3">
          <NumericField
            id="pot-p"
            label="Potenza"
            value={potenza}
            onChange={setPotenza}
          />
          <UnitSelect
            id="pot-unit"
            label="Unità"
            value={unitaP}
            onChange={setUnitaP}
            options={[
              { value: "W", label: "W" },
              { value: "kW", label: "kW" },
            ]}
          />
        </div>

        <NumericField
          id="pot-v"
          label="Tensione"
          unit="V"
          value={tensione}
          onChange={setTensione}
        />
        <NumericField
          id="pot-i"
          label="Corrente"
          unit="A"
          value={corrente}
          onChange={setCorrente}
        />

        {sistema === "trifase" ? (
          <NumericField
            id="pot-cos"
            label="cosφ"
            value={cosPhi}
            onChange={setCosPhi}
            hint="Valore predefinito 0,9 — modificabile. Non inventato dal sistema."
          />
        ) : null}

        <CalcoloActions onCalcola={calcola} onReset={reset} />

        {errore ? <RisultatoBox errore={errore} /> : null}
        {risultato ? (
          <>
            <RisultatoBox>
              {risultato.tipo === "corrente" ? (
                <p className="text-3xl font-bold tabular-nums text-yellow-300">
                  {formatNumeroIt(risultato.correnteA, 2)} A
                </p>
              ) : (
                <p className="text-3xl font-bold tabular-nums text-yellow-300">
                  {formatNumeroIt(wattInUnita(risultato.potenzaW, unitaP), 3)}{" "}
                  {unitaP}
                </p>
              )}
              <ul className="mt-4 space-y-1 ds-text-secondary text-sm">
                <li>
                  Potenza ·{" "}
                  {formatNumeroIt(wattInUnita(risultato.potenzaW, "kW"), 3)} kW (
                  {formatNumeroIt(risultato.potenzaW, 1)} W)
                </li>
                <li>Tensione · {formatNumeroIt(risultato.tensioneV, 1)} V</li>
                <li>
                  Corrente · {formatNumeroIt(risultato.correnteA, 2)} A
                </li>
                {risultato.cosPhiUsato != null ? (
                  <li>cosφ usato · {formatNumeroIt(risultato.cosPhiUsato, 3)}</li>
                ) : null}
              </ul>
            </RisultatoBox>
            <FormulaBox formula={risultato.formula} />
          </>
        ) : null}
        <AvvisoBox>
          Calcolo matematico monofase/trifase. Non sostituisce il progetto
          elettrico.
        </AvvisoBox>
      </div>
    </PageWrapper>
  );
}

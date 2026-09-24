import { useMemo, useRef, useState } from "react";

/** Stati UX voce (Preventivo vocale). */
export const STATO_VOCE = Object.freeze({
  IDLE: "idle",
  LISTENING: "listening",
  ERROR: "error",
});

const MESSAGGI_ERRORE = Object.freeze({
  "not-allowed":
    "Per usare il preventivo vocale devi consentire l’accesso al microfono. Puoi abilitarlo nelle Impostazioni del dispositivo.",
  "service-not-allowed":
    "Per usare il preventivo vocale devi consentire l’accesso al microfono. Puoi abilitarlo nelle Impostazioni del dispositivo.",
  "audio-capture":
    "Nessun microfono disponibile. Controlla le impostazioni del dispositivo.",
  network:
    "La dettatura richiede connessione. Scrivi la richiesta a mano oppure riprova online.",
  "no-speech": "Non ho sentito nulla. Tocca di nuovo il microfono e parla.",
  aborted: "",
  default:
    "Dettatura non riuscita. Puoi scrivere la richiesta a mano.",
});

function messaggioErroreVoce(codice) {
  const chiave = String(codice || "");
  if (Object.prototype.hasOwnProperty.call(MESSAGGI_ERRORE, chiave)) {
    return MESSAGGI_ERRORE[chiave];
  }
  return MESSAGGI_ERRORE.default;
}

function creaRiconoscimento() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const riconoscimento = new SpeechRecognition();
  riconoscimento.lang = "it-IT";
  riconoscimento.interimResults = true;
  riconoscimento.continuous = false;

  return riconoscimento;
}

/**
 * Web Speech Recognition — richiede rete sul motore del browser/OS.
 * Offline: l’utente può comunque digitare.
 */
export function useRiconoscimentoVocale({ onTesto }) {
  const riconoscimentoRef = useRef(null);
  const [inAscolto, setInAscolto] = useState(false);
  const [erroreVoce, setErroreVoce] = useState("");
  const [supportato] = useState(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  const stato = inAscolto
    ? STATO_VOCE.LISTENING
    : erroreVoce
      ? STATO_VOCE.ERROR
      : STATO_VOCE.IDLE;

  const controlli = useMemo(
    () => ({
      avvia() {
        if (!supportato || inAscolto) return;

        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          setErroreVoce(
            "Sei offline: la dettatura richiede rete. Scrivi la richiesta a mano."
          );
          return;
        }

        const riconoscimento = creaRiconoscimento();
        if (!riconoscimento) return;

        riconoscimentoRef.current = riconoscimento;
        setErroreVoce("");
        setInAscolto(true);

        riconoscimento.onresult = (event) => {
          const testo = Array.from(event.results)
            .map((risultato) => risultato[0]?.transcript || "")
            .join(" ")
            .trim();

          if (testo) onTesto(testo);
        };

        riconoscimento.onend = () => {
          setInAscolto(false);
        };

        riconoscimento.onerror = (event) => {
          setInAscolto(false);
          const messaggio = messaggioErroreVoce(event?.error);
          if (messaggio) setErroreVoce(messaggio);
        };

        try {
          riconoscimento.start();
        } catch {
          setInAscolto(false);
          setErroreVoce(MESSAGGI_ERRORE.default);
        }
      },

      ferma() {
        riconoscimentoRef.current?.stop();
        setInAscolto(false);
      },

      resetErrore() {
        setErroreVoce("");
      },
    }),
    [inAscolto, onTesto, supportato]
  );

  return {
    supportato,
    inAscolto,
    erroreVoce,
    stato,
    richiedeRete: true,
    ...controlli,
  };
}

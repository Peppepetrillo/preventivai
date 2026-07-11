import { useMemo, useRef, useState } from "react";

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

export function useRiconoscimentoVocale({ onTesto }) {
  const riconoscimentoRef = useRef(null);
  const [inAscolto, setInAscolto] = useState(false);
  const [supportato] = useState(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  const controlli = useMemo(
    () => ({
      avvia() {
        if (!supportato || inAscolto) return;

        const riconoscimento = creaRiconoscimento();
        if (!riconoscimento) return;

        riconoscimentoRef.current = riconoscimento;
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

        riconoscimento.onerror = () => {
          setInAscolto(false);
        };

        riconoscimento.start();
      },

      ferma() {
        riconoscimentoRef.current?.stop();
        setInAscolto(false);
      },
    }),
    [inAscolto, onTesto, supportato]
  );

  return {
    supportato,
    inAscolto,
    ...controlli,
  };
}

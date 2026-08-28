import { useId, useState } from "react";

import BottomSheet from "../../../components/BottomSheet";
import { salvaClienti, leggiClientiTutti } from "../../../repositories/clientiRepository";

export default function NuovoClienteSheet({ open, onClose, onSalvato }) {
  const nomeId = useId();
  const telefonoId = useId();
  const emailId = useId();

  const [nome, setNome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [mostraExtra, setMostraExtra] = useState(false);
  const [errore, setErrore] = useState("");

  function resetForm() {
    setNome("");
    setTelefono("");
    setEmail("");
    setMostraExtra(false);
    setErrore("");
  }

  function chiudi() {
    resetForm();
    onClose();
  }

  function salva() {
    const nomePulito = nome.trim();

    if (!nomePulito) {
      setErrore("Inserisci il nome del cliente.");
      return;
    }

    const nuovoCliente = {
      id: new Date().getTime(),
      nome: nomePulito,
      telefono: telefono.trim(),
      email: email.trim(),
    };

    salvaClienti([...leggiClientiTutti(), nuovoCliente]);
    onSalvato(nuovoCliente);
    chiudi();
  }

  return (
    <BottomSheet
      open={open}
      onClose={chiudi}
      title="Nuovo Cliente"
      descrizione="Il cliente verrà selezionato automaticamente."
    >
      <div className="space-y-4">
        <div>
          <label htmlFor={nomeId} className="text-sm text-slate-400">
            Nome *
          </label>
          <input
            id={nomeId}
            value={nome}
            onChange={(event) => {
              setNome(event.target.value);
              setErrore("");
            }}
            placeholder="Es. Mario Rossi"
            className="mt-2 input-pro"
            autoFocus
          />
        </div>

        <button
          type="button"
          onClick={() => setMostraExtra((valore) => !valore)}
          className="text-sm text-yellow-200 font-bold"
          aria-expanded={mostraExtra}
        >
          {mostraExtra ? "▴ Nascondi dati opzionali" : "▾ Altri dati (opzionale)"}
        </button>

        {mostraExtra ? (
          <div className="space-y-3">
            <div>
              <label htmlFor={telefonoId} className="text-sm text-slate-400">
                Telefono
              </label>
              <input
                id={telefonoId}
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                inputMode="tel"
                className="mt-2 input-pro"
              />
            </div>

            <div>
              <label htmlFor={emailId} className="text-sm text-slate-400">
                Email
              </label>
              <input
                id={emailId}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                inputMode="email"
                className="mt-2 input-pro"
              />
            </div>
          </div>
        ) : null}

        {errore ? (
          <p className="text-sm text-red-300" role="alert">
            {errore}
          </p>
        ) : null}

        <button
          type="button"
          onClick={salva}
          className="w-full btn-primary py-4 font-black"
        >
          Salva e seleziona
        </button>
      </div>
    </BottomSheet>
  );
}

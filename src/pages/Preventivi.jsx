import {
  useEffect,
  useState,
  useRef,
} from "react";

import AnimatedButton from "../components/AnimatedButton";

export default function Preventivi() {

  const clienti =
    JSON.parse(
      localStorage.getItem("clienti")
    ) || [];

  const [clienteSelezionato, setClienteSelezionato] =
    useState("");

  const [ricerca, setRicerca] =
    useState("");

  const [lavorazioni, setLavorazioni] =
    useState([]);

  const [stato, setStato] =
    useState("Bozza");

  const lavorazioniRef =
    useRef(null);

  const [listino] =
    useState([

      {
        id: 1,
        nome: "Punto luce",
        prezzo: 40,
        categoria: "Impianto",
      },

      {
        id: 2,
        nome: "Punto TV",
        prezzo: 50,
        categoria: "Impianto",
      },

      {
        id: 3,
        nome: "Punto Ethernet",
        prezzo: 60,
        categoria: "Impianto",
      },

      {
        id: 4,
        nome: "Presa USB A+C",
        prezzo: 50,
        categoria: "Impianto",
      },

      {
        id: 5,
        nome: "Faretto",
        prezzo: 7,
        categoria: "Illuminazione",
      },

      {
        id: 6,
        nome: "Strip LED Beghelli",
        prezzo: 15,
        categoria: "Illuminazione",
      },

      {
        id: 7,
        nome: "Faretto emergenza",
        prezzo: 25,
        categoria: "Illuminazione",
      },

      {
        id: 8,
        nome: "Gateway Living Now",
        prezzo: 200,
        categoria: "Domotica",
      },

      {
        id: 9,
        nome: "Punto luce connesso",
        prezzo: 60,
        categoria: "Domotica",
      },

      {
        id: 10,
        nome: "Tapparella connessa",
        prezzo: 80,
        categoria: "Domotica",
      },

      {
        id: 11,
        nome: "Videocitofono Urmet WiFi",
        prezzo: 700,
        categoria: "Extra",
      },

      {
        id: 12,
        nome: "Montaggio antenna",
        prezzo: 250,
        categoria: "Extra",
      },

      {
        id: 13,
        nome: "Kit emergenza strip LED",
        prezzo: 100,
        categoria: "Extra",
      },

      {
        id: 14,
        nome: "Allarme perimetrale",
        prezzo: 2000,
        categoria: "Extra",
      },

      {
        id: 15,
        nome: "Quadro elettrico",
        prezzo: 700,
        categoria: "Extra",
      },

    ]);

  function aggiungiLavorazione(
    voce
  ) {

    const nuovaLavorazione = {

      id: Date.now(),

      nome: voce.nome,

      categoria:
        voce.categoria,

      prezzo:
        voce.prezzo,

      quantita: 1,

    };

    setLavorazioni([
      ...lavorazioni,
      nuovaLavorazione,
    ]);

    setTimeout(() => {

      lavorazioniRef.current?.scrollIntoView({

        behavior: "smooth",

        block: "start",

      });

    }, 100);

  }

  function aumentaQuantita(
    index
  ) {

    const nuovaLista =
      [...lavorazioni];

    nuovaLista[index]
      .quantita += 1;

    setLavorazioni(
      nuovaLista
    );

  }

  function diminuisciQuantita(
    index
  ) {

    const nuovaLista =
      [...lavorazioni];

    if (
      nuovaLista[index]
        .quantita > 1
    ) {

      nuovaLista[index]
        .quantita -= 1;

      setLavorazioni(
        nuovaLista
      );

    }

  }

  function eliminaLavorazione(
    index
  ) {

    const nuovaLista =
      lavorazioni.filter(
        (_, i) => i !== index
      );

    setLavorazioni(
      nuovaLista
    );

  }

  const totale =
    lavorazioni.reduce(
      (acc, item) =>
        acc +
        item.prezzo *
          item.quantita,
      0
    );

  function salvaPreventivo() {

    const archivio =
      JSON.parse(
        localStorage.getItem(
          "archivioPreventivi"
        )
      ) || [];

    const numeroProgressivo =
      archivio.length + 1;

    const anno =
      new Date().getFullYear();

    const numeroPreventivo =
      `PREV-${anno}-${String(
        numeroProgressivo
      ).padStart(3, "0")}`;

    const nuovoPreventivo = {

      id: Date.now(),

      numero:
        numeroPreventivo,

      cliente:
        clienteSelezionato,

      lavorazioni,

      totale,

      stato,

      data:
        new Date().toLocaleString(),

    };

    archivio.push(
      nuovoPreventivo
    );

    localStorage.setItem(
      "archivioPreventivi",
      JSON.stringify(
        archivio
      )
    );

    alert(
      `Preventivo ${numeroPreventivo} salvato!`
    );

  }

  const listinoFiltrato =
    listino.filter((voce) =>
      voce.nome
        .toLowerCase()
        .includes(
          ricerca.toLowerCase()
        )
    );

  return (

    <div className="min-h-screen px-5 pt-8 pb-32 text-white bg-[#060816]">

      <h1 className="text-4xl font-black mb-8">

        Nuovo Preventivo

      </h1>

      <div className="bg-white/5 border border-white/10 rounded-[30px] p-5 mb-8 space-y-5">

        <select
          value={
            clienteSelezionato
          }
          onChange={(e) =>
            setClienteSelezionato(
              e.target.value
            )
          }
          className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
        >

          <option value="">
            Seleziona Cliente
          </option>

          {clienti.map(
            (
              cliente,
              index
            ) => (

              <option
                key={index}
                value={
                  cliente.nome
                }
              >
                {cliente.nome}
              </option>

            )
          )}

        </select>

      </div>

      <input
        type="text"
        placeholder="Cerca lavorazione..."
        value={ricerca}
        onChange={(e) =>
          setRicerca(
            e.target.value
          )
        }
        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none mb-8"
      />

      <div className="space-y-4 mb-10">

        {listinoFiltrato.map(
          (voce) => (

            <div
              key={voce.id}
              className="bg-white/5 border border-white/10 rounded-[24px] p-5 flex items-center justify-between"
            >

              <div>

                <h3 className="text-lg font-semibold">
                  {voce.nome}
                </h3>

                <p className="text-green-400 mt-2">
                  € {voce.prezzo}
                </p>

              </div>

              <button
                onClick={() =>
                  aggiungiLavorazione(
                    voce
                  )
                }
                className="w-12 h-12 rounded-2xl bg-blue-600 text-2xl"
              >
                +
              </button>

            </div>

          )
        )}

      </div>

      <div
        ref={lavorazioniRef}
        className="space-y-4 mb-8"
      >

        <h2 className="text-2xl font-bold">
          Lavorazioni
        </h2>

        {lavorazioni.map(
          (
            item,
            index
          ) => (

            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-[28px] p-5"
            >

              <div className="flex items-start justify-between mb-4">

                <div>

                  <h3 className="text-xl font-bold">
                    {item.nome}
                  </h3>

                  <div className="mt-3">

                    <input
                      type="number"
                      value={item.prezzo}
                      onChange={(e) => {

                        const nuovaLista =
                          [...lavorazioni];

                        nuovaLista[index]
                          .prezzo =
                          Number(
                            e.target.value
                          );

                        setLavorazioni(
                          nuovaLista
                        );

                      }}
                      className="w-28 bg-black/20 border border-white/10 rounded-xl p-3 outline-none"
                    />

                  </div>

                </div>

                <button
                  onClick={() =>
                    eliminaLavorazione(
                      index
                    )
                  }
                  className="text-red-400"
                >
                  ✕
                </button>

              </div>

              <div className="flex items-center gap-4">

                <button
                  onClick={() =>
                    diminuisciQuantita(
                      index
                    )
                  }
                  className="w-12 h-12 rounded-2xl bg-white/10"
                >
                  −
                </button>

                <div className="text-2xl font-bold">

                  {item.quantita}

                </div>

                <button
                  onClick={() =>
                    aumentaQuantita(
                      index
                    )
                  }
                  className="w-12 h-12 rounded-2xl bg-blue-600"
                >
                  +
                </button>

              </div>

            </div>

          )
        )}

      </div>

      <AnimatedButton
        onClick={
          salvaPreventivo
        }
        className="w-full bg-blue-600 rounded-[28px] p-5 text-xl font-bold mb-6"
      >
        Salva Preventivo
      </AnimatedButton>

      <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-[32px] p-6">

        <p className="text-lg opacity-90">
          Totale
        </p>

        <h2 className="text-5xl font-black mt-2">
          € {totale}
        </h2>

      </div>

    </div>

  );

}
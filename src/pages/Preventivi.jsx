import {
  useState,
} from "react";

import AnimatedButton from "../components/AnimatedButton";

export default function Preventivi() {

  const clienti =
    JSON.parse(
      localStorage.getItem(
        "clienti"
      )
    ) || [];

  const [clienteSelezionato, setClienteSelezionato] =
    useState("");

  const [mostraAltro, setMostraAltro] =
    useState(false);

  const [lavorazioni, setLavorazioni] =
    useState([]);

  const listinoRapido = [

    {
      nome: "Punto luce",
      prezzo: 40,
    },

    {
      nome: "Presa",
      prezzo: 50,
    },

    {
      nome: "Faretto",
      prezzo: 7,
    },

    {
      nome: "Strip LED",
      prezzo: 15,
    },

  ];

  const listinoAltro = [

    {
      nome: "Punto TV",
      prezzo: 50,
    },

    {
      nome: "Punto Ethernet",
      prezzo: 60,
    },

    {
      nome: "Gateway Living Now",
      prezzo: 200,
    },

    {
      nome: "Videocitofono",
      prezzo: 700,
    },

  ];

  function aggiungiLavorazione(
    voce
  ) {

    const esistente =
      lavorazioni.find(
        (item) =>
          item.nome ===
          voce.nome
      );

    if (esistente) {

      const nuovaLista =
        lavorazioni.map(
          (item) => {

            if (
              item.nome ===
              voce.nome
            ) {

              return {

                ...item,

                quantita:
                  item.quantita + 1,

              };

            }

            return item;

          }
        );

      setLavorazioni(
        nuovaLista
      );

      return;

    }

    setLavorazioni([

      ...lavorazioni,

      {

        id: Date.now(),

        nome: voce.nome,

        prezzo:
          voce.prezzo,

        quantita: 1,

      },

    ]);

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

    archivio.push({

      id: Date.now(),

      cliente:
        clienteSelezionato,

      lavorazioni,

      totale,

      data:
        new Date().toLocaleString(),

    });

    localStorage.setItem(
      "archivioPreventivi",
      JSON.stringify(
        archivio
      )
    );

    alert(
      "Preventivo salvato 😄🔥"
    );

  }

  return (

    <div className="min-h-screen bg-[#060816] text-white px-4 pt-5 pb-64">

      <h1 className="text-5xl font-black mb-6">

        Preventivi

      </h1>

      <select
        value={
          clienteSelezionato
        }
        onChange={(e) =>
          setClienteSelezionato(
            e.target.value
          )
        }
        className="w-full h-20 rounded-[34px] bg-white/5 border border-white/10 px-6 text-[20px] outline-none mb-8"
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

      <div className="space-y-4 mb-10">

        {listinoRapido.map(
          (
            voce,
            index
          ) => (

            <button
              key={index}
              onClick={() =>
                aggiungiLavorazione(
                  voce
                )
              }
              className="w-full min-h-[120px] rounded-[40px] bg-blue-600 active:scale-95 px-6"
            >

              <div className="flex items-center justify-between">

                <div className="text-left">

                  <h2 className="text-3xl font-black">

                    {voce.nome}

                  </h2>

                  <p className="text-2xl mt-2">

                    € {voce.prezzo}

                  </p>

                </div>

                <div className="text-6xl font-black">

                  +

                </div>

              </div>

            </button>

          )
        )}

      </div>

      <button
        onClick={() =>
          setMostraAltro(
            !mostraAltro
          )
        }
        className="w-full h-20 rounded-[36px] bg-white/5 border border-white/10 text-2xl font-black mb-6"
      >

        {mostraAltro
          ? "Chiudi altre lavorazioni"
          : "Altre lavorazioni"}

      </button>

      {mostraAltro && (

        <div className="space-y-4 mb-10">

          {listinoAltro.map(
            (
              voce,
              index
            ) => (

              <button
                key={index}
                onClick={() =>
                  aggiungiLavorazione(
                    voce
                  )
                }
                className="w-full min-h-[110px] rounded-[36px] bg-white/5 border border-white/10 px-6 active:scale-95"
              >

                <div className="flex items-center justify-between">

                  <div className="text-left">

                    <h2 className="text-3xl font-black">

                      {voce.nome}

                    </h2>

                    <p className="text-green-400 text-2xl mt-2">

                      € {voce.prezzo}

                    </p>

                  </div>

                  <div className="text-5xl font-black">

                    +

                  </div>

                </div>

              </button>

            )
          )}

        </div>

      )}

      <div className="space-y-5 pb-40">

        {lavorazioni.map(
          (
            item,
            index
          ) => (

            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-[40px] p-6"
            >

              <div className="flex justify-between items-center">

                <div>

                  <h2 className="text-3xl font-black">

                    {item.nome}

                  </h2>

                  <p className="text-green-400 text-2xl mt-2">

                    € {item.prezzo}

                  </p>

                </div>

                <div className="text-5xl font-black">

                  x{item.quantita}

                </div>

              </div>

              <div className="flex gap-4 mt-8">

                <button
                  onClick={() =>
                    diminuisciQuantita(
                      index
                    )
                  }
                  className="flex-1 h-24 rounded-[34px] bg-white/10 text-5xl font-black"
                >

                  −

                </button>

                <button
                  onClick={() =>
                    aumentaQuantita(
                      index
                    )
                  }
                  className="flex-1 h-24 rounded-[34px] bg-blue-600 text-5xl font-black"
                >

                  +

                </button>

              </div>

            </div>

          )
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#060816] border-t border-white/10 p-4">

        <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-[40px] p-6 mb-4">

          <p className="text-2xl">

            Totale

          </p>

          <h2 className="text-6xl font-black mt-2">

            € {totale}

          </h2>

        </div>

        <AnimatedButton
          onClick={
            salvaPreventivo
          }
          className="w-full h-24 rounded-[40px] bg-blue-600 text-3xl font-black"
        >

          SALVA PREVENTIVO

        </AnimatedButton>

      </div>

    </div>

  );

}
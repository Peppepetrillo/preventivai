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

    <div className="min-h-screen bg-[#050816] text-white pb-72">

      <div className="px-5 pt-5">

        <h1 className="text-[58px] leading-none font-black tracking-tight mb-6">

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
          className="w-full h-20 rounded-[34px] bg-[#1f2027] border border-white/10 px-6 text-[22px] outline-none mb-8"
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

        <div className="space-y-5">

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
                className="w-full bg-[#1f2027] rounded-[42px] px-6 py-6 active:scale-[0.98] transition-all border border-white/5"
              >

                <div className="flex items-center justify-between">

                  <div className="text-left">

                    <h2 className="text-[54px] leading-none font-black">

                      {voce.nome}

                    </h2>

                    <p className="text-[#1e90ff] text-[28px] mt-5 font-semibold">

                      € {voce.prezzo}

                    </p>

                  </div>

                  <div className="w-[145px] h-[145px] rounded-[38px] bg-[#1e90ff] flex items-center justify-center shrink-0">

                    <span className="text-[95px] leading-none font-light text-white">

                      +

                    </span>

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
          className="w-full h-20 rounded-[34px] bg-[#1f2027] border border-white/10 text-[26px] font-bold mt-6"
        >

          {mostraAltro
            ? "Chiudi altre lavorazioni"
            : "Altre lavorazioni"}

        </button>

        {mostraAltro && (

          <div className="space-y-4 mt-5">

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
                  className="w-full bg-[#1f2027] rounded-[38px] px-6 py-5 active:scale-[0.98]"
                >

                  <div className="flex items-center justify-between">

                    <div className="text-left">

                      <h2 className="text-[38px] font-black leading-tight">

                        {voce.nome}

                      </h2>

                      <p className="text-[#1e90ff] text-[24px] mt-3">

                        € {voce.prezzo}

                      </p>

                    </div>

                    <div className="text-[70px] text-[#1e90ff]">

                      +

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

        )}

        <div className="space-y-5 mt-8 pb-40">

          {lavorazioni.map(
            (
              item,
              index
            ) => (

              <div
                key={item.id}
                className="bg-[#02051b] border-2 border-white rounded-[44px] p-6"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <h2 className="text-[58px] leading-none font-black">

                      {item.nome}

                    </h2>

                    <p className="text-white text-[32px] mt-6">

                      € {item.prezzo}

                    </p>

                  </div>

                  <div className="text-[56px] font-black text-white">

                    x{item.quantita}

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">

                  <button
                    onClick={() =>
                      diminuisciQuantita(
                        index
                      )
                    }
                    className="h-28 rounded-[34px] bg-[#23242b] text-[70px] font-light"
                  >

                    −

                  </button>

                  <button
                    onClick={() =>
                      aumentaQuantita(
                        index
                      )
                    }
                    className="h-28 rounded-[34px] bg-[#1e90ff] text-[70px] font-light"
                  >

                    +

                  </button>

                </div>

              </div>

            )
          )}

        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050816] border-t border-white/10 px-4 pt-4 pb-6">

        <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-[42px] p-6 mb-4">

          <p className="text-[28px]">

            Totale

          </p>

          <h2 className="text-[76px] leading-none font-black mt-3">

            € {totale}

          </h2>

        </div>

        <AnimatedButton
          onClick={
            salvaPreventivo
          }
          className="w-full h-24 rounded-[42px] bg-[#1e90ff] text-[34px] font-black"
        >

          SALVA PREVENTIVO

        </AnimatedButton>

      </div>

    </div>

  );

}
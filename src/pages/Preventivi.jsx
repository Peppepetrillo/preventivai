import { useState } from "react";

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

    <div className="min-h-screen bg-[#050816] text-white pb-44">

      <div className="px-5 pt-5">

        <h1 className="text-[42px] font-black tracking-tight mb-6">

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
          className="w-full h-16 rounded-[24px] bg-[#1b1d28] border border-white/10 px-5 text-[18px] outline-none mb-6"
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

        <div className="space-y-4">

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
                className="w-full bg-[#171923] rounded-[30px] px-5 py-5 active:scale-[0.98] transition-all border border-white/5"
              >

                <div className="flex items-center justify-between">

                  <div className="text-left">

                    <h2 className="text-[28px] font-black leading-none">

                      {voce.nome}

                    </h2>

                    <p className="text-[#2491ff] text-[18px] mt-3 font-semibold">

                      € {voce.prezzo}

                    </p>

                  </div>

                  <div className="w-[72px] h-[72px] rounded-[22px] bg-[#2491ff] flex items-center justify-center shrink-0">

                    <span className="text-[48px] leading-none font-light text-white">

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
          className="w-full h-16 rounded-[24px] bg-[#171923] border border-white/10 text-[18px] font-bold mt-5"
        >

          {mostraAltro
            ? "Chiudi altre lavorazioni"
            : "Altre lavorazioni"}

        </button>

        {mostraAltro && (

          <div className="space-y-3 mt-4">

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
                  className="w-full bg-[#171923] rounded-[28px] px-5 py-4 active:scale-[0.98]"
                >

                  <div className="flex items-center justify-between">

                    <div className="text-left">

                      <h2 className="text-[24px] font-black">

                        {voce.nome}

                      </h2>

                      <p className="text-[#2491ff] text-[18px] mt-2">

                        € {voce.prezzo}

                      </p>

                    </div>

                    <div className="text-[46px] text-[#2491ff] leading-none">

                      +

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

        )}

        <div className="space-y-4 mt-7 pb-40">

          {lavorazioni.map(
            (
              item,
              index
            ) => (

              <div
                key={item.id}
                className="bg-[#10131c] border border-white/10 rounded-[30px] p-5"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-[26px] font-black leading-none">

                      {item.nome}

                    </h2>

                    <p className="text-white/80 text-[18px] mt-3">

                      € {item.prezzo}

                    </p>

                  </div>

                  <div className="text-[30px] font-black">

                    x{item.quantita}

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">

                  <button
                    onClick={() =>
                      diminuisciQuantita(
                        index
                      )
                    }
                    className="h-16 rounded-[22px] bg-[#232632] text-[42px] font-light"
                  >

                    −

                  </button>

                  <button
                    onClick={() =>
                      aumentaQuantita(
                        index
                      )
                    }
                    className="h-16 rounded-[22px] bg-[#2491ff] text-[42px] font-light"
                  >

                    +

                  </button>

                </div>

              </div>

            )
          )}

        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#050816]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">

        <div className="flex gap-3">

          <div className="flex-1 bg-gradient-to-r from-green-600 to-green-500 rounded-[24px] px-5 py-4">

            <p className="text-[14px] opacity-80">

              Totale

            </p>

            <h2 className="text-[30px] font-black leading-none mt-2">

              € {totale}

            </h2>

          </div>

          <AnimatedButton
            onClick={
              salvaPreventivo
            }
            className="w-[130px] rounded-[24px] bg-[#2491ff] text-[18px] font-black"
          >

            SALVA

          </AnimatedButton>

        </div>

      </div>

    </div>

  );

}
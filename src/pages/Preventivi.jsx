import {
  useState,
  useRef,
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

  const [ricerca, setRicerca] =
    useState("");

  const [lavorazioni, setLavorazioni] =
    useState([]);

  const lavorazioniRef =
    useRef(null);

  const [categorieAperte, setCategorieAperte] =
    useState({

      Rapidi: true,

      Impianto: false,

      Illuminazione: false,

      Domotica: false,

      Extra: false,

    });

  const listino = [

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
      nome: "Strip LED",
      prezzo: 15,
      categoria: "Illuminazione",
    },

    {
      id: 7,
      nome: "Gateway Living Now",
      prezzo: 200,
      categoria: "Domotica",
    },

    {
      id: 8,
      nome: "Videocitofono",
      prezzo: 700,
      categoria: "Extra",
    },

  ];

  function toggleCategoria(
    categoria
  ) {

    setCategorieAperte({

      ...categorieAperte,

      [categoria]:
        !categorieAperte[
          categoria
        ],

    });

  }

  function aggiungiLavorazione(
    voce,
    quantita = 1
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
                  item.quantita +
                  quantita,

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

    const nuovaLavorazione = {

      id: Date.now(),

      nome: voce.nome,

      prezzo:
        voce.prezzo,

      quantita,

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

    const nuovoPreventivo = {

      id: Date.now(),

      cliente:
        clienteSelezionato,

      lavorazioni,

      totale,

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
      "Preventivo salvato 😄🔥"
    );

  }

  const categorie = [
    "Impianto",
    "Illuminazione",
    "Domotica",
    "Extra",
  ];

  return (

    <div className="min-h-screen bg-[#060816] text-white px-4 pt-5 pb-52">

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
        className="w-full bg-white/5 border border-white/10 rounded-[32px] h-20 px-6 text-[18px] outline-none mb-6"
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

      <input
        type="text"
        placeholder="Cerca lavorazione..."
        value={ricerca}
        onChange={(e) =>
          setRicerca(
            e.target.value
          )
        }
        className="w-full bg-white/5 border border-white/10 rounded-[32px] h-20 px-6 text-[18px] outline-none mb-8"
      />

      <div className="mb-8">

        <button
          onClick={() =>
            toggleCategoria(
              "Rapidi"
            )
          }
          className="w-full h-20 rounded-[32px] bg-yellow-500/20 border border-yellow-500/20 text-3xl font-black mb-4"
        >

          ⚡ RAPIDI

        </button>

        {categorieAperte[
          "Rapidi"
        ] && (

          <div className="grid grid-cols-1 gap-4">

            <button
              onClick={() =>
                aggiungiLavorazione({
                  nome: "Punto luce",
                  prezzo: 40,
                })
              }
              className="h-24 rounded-[34px] bg-blue-600 text-2xl font-black active:scale-95"
            >

              Punto luce

            </button>

            <button
              onClick={() =>
                aggiungiLavorazione({
                  nome: "Presa USB A+C",
                  prezzo: 50,
                })
              }
              className="h-24 rounded-[34px] bg-blue-600 text-2xl font-black active:scale-95"
            >

              Presa

            </button>

            <button
              onClick={() =>
                aggiungiLavorazione({
                  nome: "Faretto",
                  prezzo: 7,
                })
              }
              className="h-24 rounded-[34px] bg-blue-600 text-2xl font-black active:scale-95"
            >

              Faretto

            </button>

          </div>

        )}

      </div>

      <div className="space-y-5 mb-10">

        {categorie.map(
          (categoria) => (

            <div key={categoria}>

              <button
                onClick={() =>
                  toggleCategoria(
                    categoria
                  )
                }
                className="w-full h-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-between px-6"
              >

                <span className="text-3xl font-black">

                  {categoria}

                </span>

                <span className="text-4xl">

                  {categorieAperte[
                    categoria
                  ]
                    ? "−"
                    : "+"}

                </span>

              </button>

              {categorieAperte[
                categoria
              ] && (

                <div className="space-y-4 mt-4">

                  {listino
                    .filter(
                      (
                        voce
                      ) =>
                        voce.categoria ===
                          categoria &&
                        voce.nome
                          .toLowerCase()
                          .includes(
                            ricerca.toLowerCase()
                          )
                    )
                    .map(
                      (
                        voce
                      ) => (

                        <button
                          key={voce.id}
                          onClick={() =>
                            aggiungiLavorazione(
                              voce
                            )
                          }
                          className="w-full min-h-[120px] rounded-[36px] bg-white/5 border border-white/10 p-6 active:scale-95"
                        >

                          <div className="flex flex-col items-start">

                            <span className="text-3xl font-black text-left">

                              {voce.nome}

                            </span>

                            <span className="text-green-400 text-2xl mt-3 font-bold">

                              € {voce.prezzo}

                            </span>

                          </div>

                        </button>

                      )
                    )}

                </div>

              )}

            </div>

          )
        )}

      </div>

      <div
        ref={lavorazioniRef}
        className="space-y-5 pb-32"
      >

        <h2 className="text-4xl font-black">

          Lavorazioni

        </h2>

        {lavorazioni.map(
          (
            item,
            index
          ) => (

            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-[36px] p-6"
            >

              <div className="flex justify-between items-start">

                <div>

                  <h3 className="text-3xl font-black">

                    {item.nome}

                  </h3>

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
                    className="mt-4 w-40 h-16 bg-black/20 border border-white/10 rounded-3xl px-5 text-[20px] outline-none"
                  />

                </div>

                <button
                  onClick={() =>
                    eliminaLavorazione(
                      index
                    )
                  }
                  className="w-20 h-20 rounded-[30px] bg-red-500/20 text-red-400 text-4xl"
                >

                  ✕

                </button>

              </div>

              <div className="flex items-center justify-center gap-6 mt-8">

                <button
                  onClick={() =>
                    diminuisciQuantita(
                      index
                    )
                  }
                  className="w-24 h-24 rounded-[34px] bg-white/10 text-5xl"
                >

                  −

                </button>

                <div className="text-6xl font-black min-w-[90px] text-center">

                  {item.quantita}

                </div>

                <button
                  onClick={() =>
                    aumentaQuantita(
                      index
                    )
                  }
                  className="w-24 h-24 rounded-[34px] bg-blue-600 text-5xl"
                >

                  +

                </button>

              </div>

            </div>

          )
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#060816] p-4 border-t border-white/10">

        <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-[36px] p-6 mb-4">

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
          className="w-full h-20 bg-blue-600 rounded-[36px] text-3xl font-black"
        >

          SALVA PREVENTIVO

        </AnimatedButton>

      </div>

    </div>

  );

}
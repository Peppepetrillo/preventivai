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

  const [stato, setStato] =
    useState("Bozza");

  const lavorazioniRef =
    useRef(null);

  const [categorieAperte, setCategorieAperte] =
    useState({

      Impianto: true,

      Illuminazione: false,

      Domotica: false,

      Extra: false,

    });

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
  
      categoria:
        voce.categoria,
  
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
      `Preventivo ${numeroPreventivo} salvato 😄🔥`
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

  const categorie = [
    "Impianto",
    "Illuminazione",
    "Domotica",
    "Extra",
  ];

  return (

    <div className="min-h-screen px-4 pt-6 pb-40 text-white bg-[#060816]">

      <h1 className="text-5xl font-black mb-8 tracking-tight">

        Preventivi

      </h1>

      <div className="bg-white/5 border border-white/10 rounded-[34px] p-5 mb-8 space-y-5">

        <select
          value={
            clienteSelezionato
          }
          onChange={(e) =>
            setClienteSelezionato(
              e.target.value
            )
          }
          className="w-full bg-black/20 border border-white/10 rounded-3xl p-5 text-[16px] outline-none"
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

      <div className="mb-8">

<p className="text-xl font-bold mb-4">

  ⚡ Rapidi

</p>

<div className="grid grid-cols-2 gap-3">

  <button
    onClick={() =>
      aggiungiLavorazione({
        nome: "Punto luce",
        prezzo: 40,
        categoria: "Impianto",
      })
    }
    className="h-16 rounded-3xl bg-yellow-500/20 border border-yellow-500/20 text-lg font-bold"
  >

    Punto luce

  </button>

  <button
    onClick={() =>
      aggiungiLavorazione({
        nome: "Presa USB A+C",
        prezzo: 50,
        categoria: "Impianto",
      })
    }
    className="h-16 rounded-3xl bg-yellow-500/20 border border-yellow-500/20 text-lg font-bold"
  >

    Presa

  </button>

  <button
    onClick={() =>
      aggiungiLavorazione({
        nome: "Faretto",
        prezzo: 7,
        categoria: "Illuminazione",
      })
    }
    className="h-16 rounded-3xl bg-yellow-500/20 border border-yellow-500/20 text-lg font-bold"
  >

    Faretto

  </button>

  <button
    onClick={() =>
      aggiungiLavorazione({
        nome: "Strip LED Beghelli",
        prezzo: 15,
        categoria: "Illuminazione",
      })
    }
    className="h-16 rounded-3xl bg-yellow-500/20 border border-yellow-500/20 text-lg font-bold"
  >

    Strip LED

  </button>

</div>

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
        className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-[16px] outline-none mb-8"
      />

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
                className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-center justify-between"
              >

                <span className="text-2xl font-black">

                  {categoria}

                </span>

                <span className="text-3xl">

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

                  {listinoFiltrato
                    .filter(
                      (
                        voce
                      ) =>
                        voce.categoria ===
                        categoria
                    )
                    .map(
                      (
                        voce
                      ) => (

                        <div
                          key={voce.id}
                          className="bg-white/5 border border-white/10 rounded-[34px] p-6"
                        >

                          <div className="flex flex-col gap-5">

                            <div>

                              <h3 className="text-2xl font-bold leading-tight">

                                {voce.nome}

                              </h3>

                              <p className="text-green-400 mt-3 text-xl font-semibold">

                                € {voce.prezzo}

                              </p>

                            </div>

                            <div className="grid grid-cols-3 gap-3">

  <button
    onClick={() =>
      aggiungiLavorazione(
        voce,
        1
      )
    }
    className="h-14 rounded-3xl bg-blue-600 text-lg font-bold active:scale-95"
  >

    +1

  </button>

  <button
    onClick={() =>
      aggiungiLavorazione(
        voce,
        5
      )
    }
    className="h-14 rounded-3xl bg-blue-500 text-lg font-bold active:scale-95"
  >

    +5

  </button>

  <button
    onClick={() =>
      aggiungiLavorazione(
        voce,
        10
      )
    }
    className="h-14 rounded-3xl bg-blue-400 text-lg font-bold active:scale-95"
  >

    +10

  </button>

</div>

                          </div>

                        </div>

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
        className="space-y-5 mb-8"
      >

        <h2 className="text-3xl font-black">

          Lavorazioni

        </h2>

        {lavorazioni.map(
          (
            item,
            index
          ) => (

            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-[34px] p-6"
            >

              <div className="flex items-start justify-between mb-5">

                <div className="flex-1">

                  <h3 className="text-2xl font-bold leading-tight">

                    {item.nome}

                  </h3>

                  <div className="mt-4">

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
                      className="w-36 bg-black/20 border border-white/10 rounded-2xl p-4 text-[16px] outline-none"
                    />

                  </div>

                </div>

                <button
                  onClick={() =>
                    eliminaLavorazione(
                      index
                    )
                  }
                  className="min-w-[60px] h-[60px] rounded-3xl bg-red-500/20 text-red-400 text-3xl active:scale-95"
                >

                  ✕

                </button>

              </div>

              <div className="flex items-center justify-center gap-5 mt-6">

                <button
                  onClick={() =>
                    diminuisciQuantita(
                      index
                    )
                  }
                  className="w-16 h-16 rounded-3xl bg-white/10 text-3xl active:scale-95"
                >

                  −

                </button>

                <div className="text-4xl font-black min-w-[60px] text-center">

                  {item.quantita}

                </div>

                <button
                  onClick={() =>
                    aumentaQuantita(
                      index
                    )
                  }
                  className="w-16 h-16 rounded-3xl bg-blue-600 text-3xl active:scale-95"
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
        className="w-full h-16 bg-blue-600 rounded-[34px] text-2xl font-black mb-6"
      >

        SALVA PREVENTIVO

      </AnimatedButton>

      <div className="sticky bottom-5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-[36px] p-7 shadow-2xl">

        <p className="text-xl opacity-90">

          Totale

        </p>

        <h2 className="text-6xl font-black mt-3">

          € {totale}

        </h2>

      </div>

    </div>

  );

}
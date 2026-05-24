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

  const [listino, setListino] =
    useState([]);

  const [ricerca, setRicerca] =
    useState("");

  const [lavorazioni, setLavorazioni] =
    useState([]);

  const [categorieAperte, setCategorieAperte] =
    useState({});

  const [stato, setStato] =
    useState("Bozza");

  const lavorazioniRef =
    useRef(null);

  useEffect(() => {

    const datiListino =
      JSON.parse(
        localStorage.getItem(
          "listinoCompleto"
        )
      ) || [];

    setListino(datiListino);

    const categorie = {};

    datiListino.forEach(
      (voce) => {

        categorie[
          voce.categoria
        ] = true;

      }
    );

    setCategorieAperte(
      categorie
    );

  }, []);

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
                  item.quantita +
                  1,

              };

            }

            return item;

          }
        );

      setLavorazioni(
        nuovaLista
      );

      setTimeout(() => {

        lavorazioniRef.current?.scrollIntoView({

          behavior: "smooth",

          block: "start",

        });

      }, 100);

      return;

    }

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

  const categorie =
    [...new Set(
      listinoFiltrato.map(
        (voce) =>
          voce.categoria
      )
    )];

  return (

    <div className="min-h-screen px-5 pt-8 pb-32 text-white">

      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/20 border-b border-white/5 mb-8 pb-5 pt-2">

        <h1 className="text-4xl font-black tracking-tight">
          Nuovo Preventivo
        </h1>

        <p className="text-slate-400 mt-2">
          Crea rapidamente un preventivo professionale
        </p>

      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[30px] p-5 mb-8 space-y-5 shadow-2xl">

        <div>

          <p className="text-slate-400 mb-2 text-sm">
            Cliente
          </p>

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

        <div>

          <p className="text-slate-400 mb-2 text-sm">
            Stato Preventivo
          </p>

          <select
            value={stato}
            onChange={(e) =>
              setStato(
                e.target.value
              )
            }
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
          >

            <option>
              Bozza
            </option>

            <option>
              Inviato
            </option>

            <option>
              Accettato
            </option>

            <option>
              Completato
            </option>

          </select>

        </div>

      </div>

      <div className="mb-8">

        <input
          type="text"
          placeholder="Cerca lavorazione..."
          value={ricerca}
          onChange={(e) =>
            setRicerca(
              e.target.value
            )
          }
          className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 outline-none shadow-xl"
        />

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
                className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[26px] p-5 flex items-center justify-between shadow-xl"
              >

                <span className="text-xl font-bold">
                  {categoria}
                </span>

                <span className="text-2xl text-slate-400">

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

                <div className="space-y-3 mt-4">

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
                          key={
                            voce.id
                          }
                          className="bg-white/[0.04] border border-white/10 rounded-[24px] p-5 flex items-center justify-between"
                        >

                          <div>

                            <h3 className="text-lg font-semibold">
                              {
                                voce.nome
                              }
                            </h3>

                            <p className="text-green-400 mt-2">
                              €
                              {
                                voce.prezzo
                              }
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

              )}

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
              className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[28px] p-5 shadow-xl"
            >

              <div className="flex items-start justify-between mb-4">

                <div>

                  <h3 className="text-xl font-bold">
                    {item.nome}
                  </h3>

                  <p className="text-slate-400 mt-1">
                    € {item.prezzo}
                  </p>

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
        className="w-full bg-blue-600 rounded-[28px] p-5 text-xl font-bold shadow-2xl mb-6"
      >
        Salva Preventivo
      </AnimatedButton>

      <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-[32px] p-6 shadow-2xl">

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
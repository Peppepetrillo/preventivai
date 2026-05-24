import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Euro,
  List,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";

export default function Listino() {

  const [listino, setListino] =
    useState([]);

  const [nome, setNome] =
    useState("");

  const [prezzo, setPrezzo] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [modificaVoce, setModificaVoce] =
    useState(null);

  useEffect(() => {

    const dati =
      JSON.parse(
        localStorage.getItem(
          "listinoCompleto"
        )
      ) || [];

    setListino(dati);

  }, []);

  function salvaListino(
    nuovoListino
  ) {

    setListino(
      nuovoListino
    );

    localStorage.setItem(
      "listinoCompleto",
      JSON.stringify(
        nuovoListino
      )
    );

  }

  function aggiungiVoce() {

    if (
      !nome ||
      !prezzo ||
      !categoria
    ) return;

    const nuovaVoce = {

      id: Date.now(),

      nome,

      prezzo:
        Number(prezzo),

      categoria,

    };

    salvaListino([
      ...listino,
      nuovaVoce,
    ]);

    setNome("");
    setPrezzo("");
    setCategoria("");

  }

  function salvaModifica() {

    const nuovoListino =
      listino.map(
        (voce) => {

          if (
            voce.id ===
            modificaVoce.id
          ) {

            return {

              ...voce,

              nome:
                modificaVoce.nome,

              prezzo:
                Number(
                  modificaVoce.prezzo
                ),

              categoria:
                modificaVoce.categoria,

            };

          }

          return voce;

        }
      );

    salvaListino(
      nuovoListino
    );

    setModificaVoce(
      null
    );

  }

  return (

    <PageWrapper>

      <div className="min-h-screen px-5 pt-8 pb-32 text-white">

        <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/20 border-b border-white/5 mb-8 pb-5 pt-2">

          <h1 className="text-4xl font-black tracking-tight">
            Listino
          </h1>

          <p className="text-slate-400 mt-2">
            Gestisci lavorazioni e prezzi
          </p>

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[32px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] mb-8 space-y-5">

          <div>

            <p className="text-slate-400 text-sm mb-2">
              Nome lavorazione
            </p>

            <input
              type="text"
              placeholder="Punto luce"
              value={nome}
              onChange={(e) =>
                setNome(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 text-sm mb-2">
              Prezzo
            </p>

            <input
              type="number"
              placeholder="50"
              value={prezzo}
              onChange={(e) =>
                setPrezzo(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 text-sm mb-2">
              Categoria
            </p>

            <input
              type="text"
              placeholder="Illuminazione"
              value={categoria}
              onChange={(e) =>
                setCategoria(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <button
            onClick={
              aggiungiVoce
            }
            className="w-full bg-blue-600 rounded-[26px] p-5 text-lg font-bold shadow-2xl flex items-center justify-center gap-2"
          >

            <Plus size={22} />

            Aggiungi Voce

          </button>

        </div>

        <div className="space-y-5">

          {listino.map(
            (voce) => (

              <div
                key={voce.id}
                onClick={() =>
                  setModificaVoce({
                    ...voce,
                  })
                }
                className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[30px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] active:scale-[0.98] transition-all duration-200"
              >

                <div className="flex items-start gap-4">

                  <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">

                    <List size={24} />

                  </div>

                  <div>

                    <h2 className="text-2xl font-bold">

                      {voce.nome}

                    </h2>

                    <div className="flex items-center gap-2 text-green-400 mt-3">

                      <Euro size={16} />

                      <span className="font-semibold">

                        {voce.prezzo}

                      </span>

                    </div>

                    <p className="text-slate-400 mt-2">

                      {voce.categoria}

                    </p>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

        {modificaVoce && (

          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.9)",
              zIndex: 9999,
              padding: 20,
              overflow: "auto",
            }}
          >

            <div
              style={{
                background: "#111",
                padding: 20,
                borderRadius: 20,
                marginTop: 100,
              }}
            >

              <h2
                style={{
                  fontSize: 28,
                  marginBottom: 20,
                }}
              >
                Modifica Voce
              </h2>

              <input
                type="text"
                value={modificaVoce.nome}
                onChange={(e) =>
                  setModificaVoce({

                    ...modificaVoce,

                    nome:
                      e.target.value,

                  })
                }
                style={{
                  width: "100%",
                  padding: 15,
                  marginBottom: 15,
                  borderRadius: 12,
                  background: "#222",
                }}
              />

              <input
                type="number"
                value={modificaVoce.prezzo}
                onChange={(e) =>
                  setModificaVoce({

                    ...modificaVoce,

                    prezzo:
                      e.target.value,

                  })
                }
                style={{
                  width: "100%",
                  padding: 15,
                  marginBottom: 15,
                  borderRadius: 12,
                  background: "#222",
                }}
              />

              <input
                type="text"
                value={modificaVoce.categoria}
                onChange={(e) =>
                  setModificaVoce({

                    ...modificaVoce,

                    categoria:
                      e.target.value,

                  })
                }
                style={{
                  width: "100%",
                  padding: 15,
                  marginBottom: 15,
                  borderRadius: 12,
                  background: "#222",
                }}
              />

              <button
                onClick={salvaModifica}
                style={{
                  width: "100%",
                  padding: 18,
                  borderRadius: 14,
                  background: "#2563eb",
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                Salva
              </button>

              <button
                onClick={() =>
                  setModificaVoce(null)
                }
                style={{
                  width: "100%",
                  padding: 18,
                  borderRadius: 14,
                  background: "#333",
                }}
              >
                Chiudi
              </button>

            </div>

          </div>

        )}

      </div>

    </PageWrapper>

  );

}
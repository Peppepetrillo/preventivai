import {
  useParams,
} from "react-router-dom";

import {
  useState,
  useEffect,
} from "react";

import {
  User,
  ClipboardList,
  Plus,
  StickyNote,
  Package,
  Wallet,
  Briefcase,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";

export default function DettaglioCliente() {

  const { id } =
    useParams();

  const clienti =
    JSON.parse(
      localStorage.getItem(
        "clienti"
      )
    ) || [];

  const cliente =
    clienti.find(
      (c) =>
        String(c.id) === id
    );

  const [checklist, setChecklist] =
    useState([]);

  const [nuovaTask, setNuovaTask] =
    useState("");

  const [note, setNote] =
    useState("");

  const [materiali, setMateriali] =
    useState([]);

  const [nuovoMateriale, setNuovoMateriale] =
    useState("");

  const [totale, setTotale] =
    useState("");

  const [acconto, setAcconto] =
    useState("");

  const [statoLavoro, setStatoLavoro] =
    useState("Sopralluogo");

  useEffect(() => {

    const checklistSalvata =
      JSON.parse(
        localStorage.getItem(
          `checklist_${id}`
        )
      ) || [];

    setChecklist(
      checklistSalvata
    );

    const noteSalvate =
      localStorage.getItem(
        `note_${id}`
      ) || "";

    setNote(
      noteSalvate
    );

    const materialiSalvati =
      JSON.parse(
        localStorage.getItem(
          `materiali_${id}`
        )
      ) || [];

    setMateriali(
      materialiSalvati
    );

    const pagamento =
      JSON.parse(
        localStorage.getItem(
          `pagamenti_${id}`
        )
      ) || {};

    setTotale(
      pagamento.totale || ""
    );

    setAcconto(
      pagamento.acconto || ""
    );

    const statoSalvato =
      localStorage.getItem(
        `stato_${id}`
      ) || "Sopralluogo";

    setStatoLavoro(
      statoSalvato
    );

  }, [id]);

  function salvaChecklist(
    nuovaChecklist
  ) {

    setChecklist(
      nuovaChecklist
    );

    localStorage.setItem(
      `checklist_${id}`,
      JSON.stringify(
        nuovaChecklist
      )
    );

  }

  function aggiungiTask() {

    if (!nuovaTask) return;

    const nuova = {

      id: Date.now(),

      testo:
        nuovaTask,

      completata: false,

    };

    salvaChecklist([
      ...checklist,
      nuova,
    ]);

    setNuovaTask("");

  }

  function toggleTask(
    taskId
  ) {

    const aggiornata =
      checklist.map(
        (task) => {

          if (
            task.id ===
            taskId
          ) {

            return {

              ...task,

              completata:
                !task.completata,

            };

          }

          return task;

        }
      );

    salvaChecklist(
      aggiornata
    );

  }

  function salvaMateriali(
    nuovaLista
  ) {

    setMateriali(
      nuovaLista
    );

    localStorage.setItem(
      `materiali_${id}`,
      JSON.stringify(
        nuovaLista
      )
    );

  }

  function aggiungiMateriale() {

    if (
      !nuovoMateriale
    ) return;

    const nuovo = {

      id: Date.now(),

      nome:
        nuovoMateriale,

    };

    salvaMateriali([
      ...materiali,
      nuovo,
    ]);

    setNuovoMateriale("");

  }

  function salvaPagamenti(
    nuovoTotale,
    nuovoAcconto
  ) {

    localStorage.setItem(
      `pagamenti_${id}`,
      JSON.stringify({

        totale:
          nuovoTotale,

        acconto:
          nuovoAcconto,

      })
    );

  }

  const rimanenza =
    Number(totale || 0) -
    Number(acconto || 0);

  if (!cliente) {

    return (

      <PageWrapper>

        <div className="p-6 text-white">

          Cliente non trovato

        </div>

      </PageWrapper>

    );

  }

  return (

    <PageWrapper>

      <div className="min-h-screen px-5 pt-8 pb-32 text-white">

        <div className="flex items-center gap-4 mb-8">

          <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl">

            <User size={30} />

          </div>

          <div>

            <h1 className="text-4xl font-black">

              {cliente.nome}

            </h1>

            <p className="text-slate-400 mt-1">

              Scheda cliente / cantiere

            </p>

          </div>

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl mb-5">

          <div className="flex items-center gap-4 mb-5">

            <Briefcase size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Stato Lavori

              </h2>

            </div>

          </div>

          <select
            value={statoLavoro}
            onChange={(e) => {

              setStatoLavoro(
                e.target.value
              );

              localStorage.setItem(
                `stato_${id}`,
                e.target.value
              );

            }}
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
          >

            <option>
              Sopralluogo
            </option>

            <option>
              Preventivo inviato
            </option>

            <option>
              Accettato
            </option>

            <option>
              In corso
            </option>

            <option>
              Completato
            </option>

          </select>

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl mb-5">

          <div className="flex items-center gap-4 mb-5">

            <ClipboardList size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Checklist

              </h2>

            </div>

          </div>

          <div className="flex gap-3 mb-5">

            <input
              type="text"
              placeholder="Nuova attività..."
              value={nuovaTask}
              onChange={(e) =>
                setNuovaTask(
                  e.target.value
                )
              }
              className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <button
              onClick={
                aggiungiTask
              }
              className="w-14 rounded-2xl bg-blue-600 flex items-center justify-center"
            >

              <Plus size={24} />

            </button>

          </div>

          <div className="space-y-3">

            {checklist.map(
              (task) => (

                <div
                  key={task.id}
                  onClick={() =>
                    toggleTask(
                      task.id
                    )
                  }
                  className={`p-4 rounded-2xl border ${
                    task.completata
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-black/20 border-white/10"
                  }`}
                >

                  <p className={`text-lg ${
                    task.completata
                      ? "line-through text-slate-500"
                      : "text-white"
                  }`}>

                    {task.testo}

                  </p>

                </div>

              )
            )}

          </div>

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl mb-5">

          <div className="flex items-center gap-4 mb-5">

            <Package size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Materiali

              </h2>

            </div>

          </div>

          <div className="flex gap-3 mb-5">

            <input
              type="text"
              placeholder="Nuovo materiale..."
              value={nuovoMateriale}
              onChange={(e) =>
                setNuovoMateriale(
                  e.target.value
                )
              }
              className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <button
              onClick={
                aggiungiMateriale
              }
              className="w-14 rounded-2xl bg-blue-600 flex items-center justify-center"
            >

              <Plus size={24} />

            </button>

          </div>

          <div className="space-y-3">

            {materiali.map(
              (item) => (

                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-black/20 border border-white/10"
                >

                  <p className="text-lg">

                    {item.nome}

                  </p>

                </div>

              )
            )}

          </div>

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl mb-5">

          <div className="flex items-center gap-4 mb-5">

            <StickyNote size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Note Cantiere

              </h2>

            </div>

          </div>

          <textarea
            value={note}
            onChange={(e) => {

              setNote(
                e.target.value
              );

              localStorage.setItem(
                `note_${id}`,
                e.target.value
              );

            }}
            placeholder="Scrivi note..."
            className="w-full min-h-[180px] bg-black/20 border border-white/10 rounded-2xl p-4 outline-none resize-none"
          />

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl">

          <div className="flex items-center gap-4 mb-5">

            <Wallet size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Pagamenti

              </h2>

            </div>

          </div>

          <div className="space-y-4">

            <input
              type="number"
              placeholder="Totale lavoro"
              value={totale}
              onChange={(e) => {

                setTotale(
                  e.target.value
                );

                salvaPagamenti(
                  e.target.value,
                  acconto
                );

              }}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <input
              type="number"
              placeholder="Acconto ricevuto"
              value={acconto}
              onChange={(e) => {

                setAcconto(
                  e.target.value
                );

                salvaPagamenti(
                  totale,
                  e.target.value
                );

              }}
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <div className="bg-black/20 border border-white/10 rounded-2xl p-5">

              <p className="text-slate-400 mb-2">

                Rimanenza

              </p>

              <h2 className="text-4xl font-black text-green-400">

                € {rimanenza}

              </h2>

            </div>

          </div>

        </div>

      </div>

    </PageWrapper>

  );

}
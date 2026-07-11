import { useMemo, useState } from "react";
import {
  Camera,
  CheckCircle,
  Circle,
  ClipboardList,
  HardHat,
  MapPin,
  Package,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import {
  calcolaAvanzamentoChecklist,
  creaCantiere,
  creaFoto,
  creaMateriale,
  creaVoceChecklist,
  STATI_CANTIERE,
  aggiornaCantiere,
} from "../features/cantieri/cantieriDomain";
import { leggiCantieri, salvaCantieri } from "../repositories/cantieriRepository";

const FORM_CANTIERE_INIZIALE = {
  nome: "",
  cliente: "",
  indirizzo: "",
};

const FORM_MATERIALE_INIZIALE = {
  nome: "",
  quantita: "",
  unita: "cad",
};

export default function Cantieri() {
  const [cantieri, setCantieri] = useState(() => leggiCantieri());
  const [cantiereSelezionatoId, setCantiereSelezionatoId] = useState(
    () => cantieri[0]?.id || ""
  );
  const [nuovoCantiere, setNuovoCantiere] = useState(FORM_CANTIERE_INIZIALE);
  const [nuovaChecklist, setNuovaChecklist] = useState("");
  const [nuovoMateriale, setNuovoMateriale] = useState(FORM_MATERIALE_INIZIALE);
  const [messaggio, setMessaggio] = useState("");

  const cantiereSelezionato = useMemo(
    () =>
      cantieri.find(
        (cantiere) => String(cantiere.id) === String(cantiereSelezionatoId)
      ) || cantieri[0],
    [cantieri, cantiereSelezionatoId]
  );

  const avanzamento = cantiereSelezionato
    ? calcolaAvanzamentoChecklist(cantiereSelezionato.checklist || [])
    : 0;

  function salvaListaCantieri(cantieriAggiornati) {
    setCantieri(cantieriAggiornati);
    salvaCantieri(cantieriAggiornati);
  }

  function aggiornaCampoNuovoCantiere(campo, valore) {
    setNuovoCantiere({
      ...nuovoCantiere,
      [campo]: valore,
    });
  }

  function aggiungiCantiere() {
    if (!nuovoCantiere.nome.trim()) {
      setMessaggio("Inserisci il nome del cantiere.");
      return;
    }

    const cantiere = creaCantiere(nuovoCantiere);
    const cantieriAggiornati = [cantiere, ...cantieri];

    salvaListaCantieri(cantieriAggiornati);
    setCantiereSelezionatoId(cantiere.id);
    setNuovoCantiere(FORM_CANTIERE_INIZIALE);
    setMessaggio("Cantiere creato sul dispositivo.");
  }

  function aggiornaSelezionato(modifiche) {
    if (!cantiereSelezionato) return;

    salvaListaCantieri(
      cantieri.map((cantiere) =>
        String(cantiere.id) === String(cantiereSelezionato.id)
          ? aggiornaCantiere(cantiere, modifiche)
          : cantiere
      )
    );
  }

  function eliminaCantiere() {
    if (!cantiereSelezionato) return;

    const conferma = window.confirm(
      `Eliminare il cantiere ${cantiereSelezionato.nome}?`
    );

    if (!conferma) return;

    const cantieriAggiornati = cantieri.filter(
      (cantiere) => String(cantiere.id) !== String(cantiereSelezionato.id)
    );

    salvaListaCantieri(cantieriAggiornati);
    setCantiereSelezionatoId(cantieriAggiornati[0]?.id || "");
    setMessaggio("Cantiere eliminato.");
  }

  function aggiungiChecklist() {
    if (!cantiereSelezionato || !nuovaChecklist.trim()) return;

    aggiornaSelezionato({
      checklist: [
        ...(cantiereSelezionato.checklist || []),
        creaVoceChecklist(nuovaChecklist),
      ],
    });
    setNuovaChecklist("");
  }

  function aggiornaChecklist(voceId, modifiche) {
    aggiornaSelezionato({
      checklist: (cantiereSelezionato.checklist || []).map((voce) =>
        String(voce.id) === String(voceId)
          ? {
              ...voce,
              ...modifiche,
            }
          : voce
      ),
    });
  }

  function eliminaChecklist(voceId) {
    aggiornaSelezionato({
      checklist: (cantiereSelezionato.checklist || []).filter(
        (voce) => String(voce.id) !== String(voceId)
      ),
    });
  }

  function aggiornaCampoMateriale(campo, valore) {
    setNuovoMateriale({
      ...nuovoMateriale,
      [campo]: valore,
    });
  }

  function aggiungiMateriale() {
    if (!cantiereSelezionato || !nuovoMateriale.nome.trim()) return;

    aggiornaSelezionato({
      materiali: [
        ...(cantiereSelezionato.materiali || []),
        creaMateriale(nuovoMateriale),
      ],
    });
    setNuovoMateriale(FORM_MATERIALE_INIZIALE);
  }

  function eliminaMateriale(materialeId) {
    aggiornaSelezionato({
      materiali: (cantiereSelezionato.materiali || []).filter(
        (materiale) => String(materiale.id) !== String(materialeId)
      ),
    });
  }

  function aggiungiFoto(event) {
    const file = event.target.files?.[0];

    if (!file || !cantiereSelezionato) return;

    if (!file.type.startsWith("image/")) {
      setMessaggio("Seleziona una foto valida.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      aggiornaSelezionato({
        foto: [
          ...(cantiereSelezionato.foto || []),
          creaFoto({
            nome: file.name,
            src: String(reader.result || ""),
          }),
        ],
      });
      setMessaggio("Foto aggiunta al cantiere.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  function eliminaFoto(fotoId) {
    aggiornaSelezionato({
      foto: (cantiereSelezionato.foto || []).filter(
        (foto) => String(foto.id) !== String(fotoId)
      ),
    });
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white pb-24">
        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Operatività</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">Cantieri</h1>
          <p className="text-slate-400 mt-2">
            Stato lavori, checklist, materiali, foto e note operative.
          </p>
        </div>

        {messaggio && (
          <div className="pro-panel p-4 mb-5 text-yellow-100 border-yellow-300/30">
            {messaggio}
          </div>
        )}

        <section className="pro-panel p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <HardHat size={24} className="text-yellow-300" />
            <h2 className="text-xl font-black">Nuovo cantiere</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <input
              value={nuovoCantiere.nome}
              onChange={(event) =>
                aggiornaCampoNuovoCantiere("nome", event.target.value)
              }
              placeholder="Nome cantiere"
              className="input-pro"
            />
            <input
              value={nuovoCantiere.cliente}
              onChange={(event) =>
                aggiornaCampoNuovoCantiere("cliente", event.target.value)
              }
              placeholder="Cliente"
              className="input-pro"
            />
            <input
              value={nuovoCantiere.indirizzo}
              onChange={(event) =>
                aggiornaCampoNuovoCantiere("indirizzo", event.target.value)
              }
              placeholder="Indirizzo"
              className="input-pro"
            />
            <button
              onClick={aggiungiCantiere}
              className="btn-primary px-5 py-4 flex items-center justify-center gap-2"
            >
              <Plus size={19} />
              Crea
            </button>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-3">
            {cantieri.length === 0 && (
              <div className="pro-panel p-6 text-center text-slate-400">
                Nessun cantiere creato.
              </div>
            )}

            {cantieri.map((cantiere) => {
              const attivo =
                String(cantiere.id) === String(cantiereSelezionato?.id);
              const progresso = calcolaAvanzamentoChecklist(
                cantiere.checklist || []
              );

              return (
                <button
                  key={cantiere.id}
                  onClick={() => setCantiereSelezionatoId(cantiere.id)}
                  className={`w-full pro-panel p-4 text-left transition ${
                    attivo ? "border-yellow-300/50" : "hover:border-yellow-300/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white/45 text-xs font-bold uppercase">
                        {cantiere.stato}
                      </p>
                      <h3 className="text-xl font-black mt-1 truncate">
                        {cantiere.nome}
                      </h3>
                      <p className="text-slate-400 mt-1 truncate">
                        {cantiere.cliente || "Cliente non indicato"}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-[14px] bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                      <HardHat size={22} />
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Checklist {progresso}% · Agg. {cantiere.aggiornatoIl}
                  </p>
                </button>
              );
            })}
          </aside>

          {!cantiereSelezionato ? (
            <div className="pro-panel p-8 text-center text-slate-400">
              Crea un cantiere per iniziare a gestire lavori e materiali.
            </div>
          ) : (
            <main className="space-y-5">
              <section className="pro-panel-strong p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="section-label">Scheda cantiere</p>
                    <h2 className="text-3xl font-black mt-1">
                      {cantiereSelezionato.nome}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-slate-400 mt-3">
                      <span>{cantiereSelezionato.cliente || "Cliente non indicato"}</span>
                      {cantiereSelezionato.indirizzo && (
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {cantiereSelezionato.indirizzo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select
                      value={cantiereSelezionato.stato}
                      onChange={(event) =>
                        aggiornaSelezionato({ stato: event.target.value })
                      }
                      className="input-pro min-w-[180px]"
                    >
                      {STATI_CANTIERE.map((stato) => (
                        <option key={stato}>{stato}</option>
                      ))}
                    </select>

                    <button
                      onClick={eliminaCantiere}
                      className="rounded-[14px] border border-red-400/25 bg-red-500/10 px-5 py-4 font-black text-red-100 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={19} />
                      Elimina
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Avanzamento checklist</span>
                    <span className="font-black text-yellow-200">{avanzamento}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${avanzamento}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <div className="pro-panel p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <ClipboardList size={22} className="text-yellow-300" />
                    <h3 className="text-xl font-black">Checklist</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-4">
                    <input
                      value={nuovaChecklist}
                      onChange={(event) => setNuovaChecklist(event.target.value)}
                      placeholder="Aggiungi attività"
                      className="input-pro"
                    />
                    <button
                      onClick={aggiungiChecklist}
                      className="btn-primary px-5 py-4 flex items-center justify-center gap-2"
                    >
                      <Plus size={19} />
                      Aggiungi
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(cantiereSelezionato.checklist || []).length === 0 && (
                      <p className="text-slate-400 text-center py-5">
                        Nessuna attività inserita.
                      </p>
                    )}

                    {(cantiereSelezionato.checklist || []).map((voce) => (
                      <div
                        key={voce.id}
                        className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-black/[0.14] p-3"
                      >
                        <button
                          onClick={() =>
                            aggiornaChecklist(voce.id, {
                              completata: !voce.completata,
                            })
                          }
                          className="text-yellow-300"
                          aria-label="Cambia stato attività"
                        >
                          {voce.completata ? (
                            <CheckCircle size={22} />
                          ) : (
                            <Circle size={22} />
                          )}
                        </button>
                        <input
                          value={voce.testo}
                          onChange={(event) =>
                            aggiornaChecklist(voce.id, {
                              testo: event.target.value,
                            })
                          }
                          className={`min-w-0 flex-1 bg-transparent outline-none ${
                            voce.completata ? "text-slate-500 line-through" : ""
                          }`}
                        />
                        <button
                          onClick={() => eliminaChecklist(voce.id)}
                          className="w-10 h-10 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center"
                          aria-label="Elimina attività"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pro-panel p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Package size={22} className="text-yellow-300" />
                    <h3 className="text-xl font-black">Materiali</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_90px_80px_auto] mb-4">
                    <input
                      value={nuovoMateriale.nome}
                      onChange={(event) =>
                        aggiornaCampoMateriale("nome", event.target.value)
                      }
                      placeholder="Materiale"
                      className="input-pro"
                    />
                    <input
                      type="number"
                      min="0"
                      value={nuovoMateriale.quantita}
                      onChange={(event) =>
                        aggiornaCampoMateriale("quantita", event.target.value)
                      }
                      placeholder="Q.tà"
                      className="input-pro"
                    />
                    <input
                      value={nuovoMateriale.unita}
                      onChange={(event) =>
                        aggiornaCampoMateriale("unita", event.target.value)
                      }
                      placeholder="Unità"
                      className="input-pro"
                    />
                    <button
                      onClick={aggiungiMateriale}
                      className="btn-primary px-5 py-4 flex items-center justify-center"
                      aria-label="Aggiungi materiale"
                    >
                      <Plus size={19} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(cantiereSelezionato.materiali || []).length === 0 && (
                      <p className="text-slate-400 text-center py-5">
                        Nessun materiale registrato.
                      </p>
                    )}

                    {(cantiereSelezionato.materiali || []).map((materiale) => (
                      <div
                        key={materiale.id}
                        className="flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-black/[0.14] p-3"
                      >
                        <div>
                          <p className="font-black">{materiale.nome}</p>
                          <p className="text-slate-400 text-sm">
                            {materiale.quantita} {materiale.unita}
                          </p>
                        </div>
                        <button
                          onClick={() => eliminaMateriale(materiale.id)}
                          className="w-10 h-10 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center"
                          aria-label="Elimina materiale"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <div className="pro-panel p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Camera size={22} className="text-yellow-300" />
                      <h3 className="text-xl font-black">Foto</h3>
                    </div>

                    <label className="btn-secondary px-4 py-3 cursor-pointer flex items-center gap-2">
                      <Plus size={18} />
                      Aggiungi
                      <input
                        type="file"
                        accept="image/*"
                        onChange={aggiungiFoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {(cantiereSelezionato.foto || []).length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Nessuna foto caricata.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {(cantiereSelezionato.foto || []).map((foto) => (
                        <div
                          key={foto.id}
                          className="overflow-hidden rounded-[14px] border border-white/10 bg-black/[0.14]"
                        >
                          <img
                            src={foto.src}
                            alt={foto.nome}
                            className="h-36 w-full object-cover"
                          />
                          <div className="flex items-center justify-between gap-3 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black">
                                {foto.nome}
                              </p>
                              <p className="text-xs text-slate-500">
                                {foto.aggiuntaIl}
                              </p>
                            </div>
                            <button
                              onClick={() => eliminaFoto(foto.id)}
                              className="w-9 h-9 rounded-[12px] bg-red-500/10 text-red-100 flex items-center justify-center shrink-0"
                              aria-label="Elimina foto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pro-panel p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Save size={22} className="text-yellow-300" />
                    <h3 className="text-xl font-black">Note</h3>
                  </div>

                  <textarea
                    value={cantiereSelezionato.note || ""}
                    onChange={(event) =>
                      aggiornaSelezionato({ note: event.target.value })
                    }
                    rows="10"
                    placeholder="Annotazioni operative, criticità, prossimi passaggi..."
                    className="input-pro resize-none"
                  />
                </div>
              </section>
            </main>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

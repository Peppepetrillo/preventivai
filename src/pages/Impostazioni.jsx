import { useEffect, useState } from "react";

export default function Impostazioni() {

  const [nomeAzienda, setNomeAzienda] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [partitaIva, setPartitaIva] =
    useState("");

  const [indirizzo, setIndirizzo] =
    useState("");

  const [logo, setLogo] =
    useState("");

  useEffect(() => {

    const datiAzienda =
      JSON.parse(
        localStorage.getItem(
          "datiAzienda"
        )
      );

    if (datiAzienda) {

      setNomeAzienda(
        datiAzienda.nomeAzienda || ""
      );

      setTelefono(
        datiAzienda.telefono || ""
      );

      setEmail(
        datiAzienda.email || ""
      );

      setPartitaIva(
        datiAzienda.partitaIva || ""
      );

      setIndirizzo(
        datiAzienda.indirizzo || ""
      );

      setLogo(
        datiAzienda.logo || ""
      );

    }

  }, []);

  function caricaLogo(e) {

    const file =
      e.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onloadend = () => {

      setLogo(
        reader.result
      );

    };

    reader.readAsDataURL(
      file
    );

  }

  function salvaImpostazioni() {

    const dati = {

      nomeAzienda,

      telefono,

      email,

      partitaIva,

      indirizzo,

      logo,

    };

    localStorage.setItem(
      "datiAzienda",
      JSON.stringify(dati)
    );

    alert(
      "Dati azienda salvati!"
    );

  }

  return (

    <div className="min-h-screen px-5 pt-8 pb-32 text-white">

      <div className="mb-8">

        <h1 className="text-4xl font-black tracking-tight">
          Impostazioni
        </h1>

        <p className="text-slate-400 mt-2">
          Gestisci branding e dati azienda
        </p>

      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl">

        <div className="flex flex-col items-center mb-8">

          {logo ? (

            <img
              src={logo}
              alt="Logo"
              className="w-28 h-28 rounded-3xl object-cover border border-white/10 shadow-2xl"
            />

          ) : (

            <div className="w-28 h-28 rounded-3xl bg-blue-600 flex items-center justify-center text-5xl shadow-2xl">

              ⚡

            </div>

          )}

          <label className="mt-5 cursor-pointer bg-white/10 hover:bg-white/15 transition-all duration-300 px-5 py-3 rounded-2xl border border-white/10">

            Carica Logo

            <input
              type="file"
              accept="image/*"
              onChange={caricaLogo}
              className="hidden"
            />

          </label>

        </div>

        <div className="space-y-5">

          <div>

            <p className="text-slate-400 mb-2 text-sm">
              Nome Azienda
            </p>

            <input
              type="text"
              value={nomeAzienda}
              onChange={(e) =>
                setNomeAzienda(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 mb-2 text-sm">
              Telefono
            </p>

            <input
              type="text"
              value={telefono}
              onChange={(e) =>
                setTelefono(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 mb-2 text-sm">
              Email
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 mb-2 text-sm">
              Partita IVA
            </p>

            <input
              type="text"
              value={partitaIva}
              onChange={(e) =>
                setPartitaIva(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

          <div>

            <p className="text-slate-400 mb-2 text-sm">
              Indirizzo
            </p>

            <input
              type="text"
              value={indirizzo}
              onChange={(e) =>
                setIndirizzo(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

          </div>

        </div>

        <button
          onClick={salvaImpostazioni}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 transition-all duration-300 rounded-[28px] p-5 text-xl font-bold shadow-2xl"
        >
          Salva Impostazioni
        </button>

      </div>

    </div>

  );

}
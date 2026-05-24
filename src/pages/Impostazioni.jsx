import {
  useState,
  useEffect,
} from "react";

import {
  Download,
  Building2,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";

export default function Impostazioni() {

  const [nomeDitta, setNomeDitta] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  useEffect(() => {

    const dati =
      JSON.parse(
        localStorage.getItem(
          "datiDitta"
        )
      ) || {};

    setNomeDitta(
      dati.nomeDitta || ""
    );

    setTelefono(
      dati.telefono || ""
    );

    setEmail(
      dati.email || ""
    );

  }, []);

  function salvaDati() {

    localStorage.setItem(
      "datiDitta",
      JSON.stringify({

        nomeDitta,

        telefono,

        email,

      })
    );

    alert(
      "Dati salvati 😄🔥"
    );

  }

  function esportaBackup() {

    const clienti =
      JSON.parse(
        localStorage.getItem(
          "clienti"
        )
      ) || [];

    if (
      clienti.length === 0
    ) {

      alert(
        "Nessun cliente da esportare"
      );

      return;

    }

    const intestazione =
      [
        "Nome",
        "Telefono",
        "Email",
      ];

    const righe =
      clienti.map(
        (cliente) => [

          cliente.nome,

          cliente.telefono,

          cliente.email,

        ]
      );

    const csvContent =
      [
        intestazione,
        ...righe,
      ]
        .map(
          (riga) =>
            riga.join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "preventivai-backup.csv";

    link.click();

  }

  return (

    <PageWrapper>

      <div className="min-h-screen px-5 pt-8 pb-32 text-white">

        <h1 className="text-4xl font-black mb-8">

          Impostazioni

        </h1>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl mb-5">

          <div className="flex items-center gap-4 mb-5">

            <Building2 size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Dati Azienda

              </h2>

              <p className="text-slate-400 mt-1">

                Informazioni utilizzate nei PDF

              </p>

            </div>

          </div>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Nome ditta"
              value={nomeDitta}
              onChange={(e) =>
                setNomeDitta(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <input
              type="text"
              placeholder="Telefono"
              value={telefono}
              onChange={(e) =>
                setTelefono(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 outline-none"
            />

            <button
              onClick={
                salvaDati
              }
              className="w-full bg-blue-600 rounded-2xl p-5 text-lg font-bold"
            >

              Salva Dati

            </button>

          </div>

        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-5 backdrop-blur-2xl">

          <div className="flex items-center gap-4 mb-5">

            <Download size={28} />

            <div>

              <h2 className="text-2xl font-bold">

                Backup CSV

              </h2>

              <p className="text-slate-400 mt-1">

                Esporta tutti i clienti

              </p>

            </div>

          </div>

          <button
            onClick={
              esportaBackup
            }
            className="w-full bg-blue-600 rounded-2xl p-5 text-lg font-bold"
          >

            Esporta Backup

          </button>

        </div>

      </div>

    </PageWrapper>

  );

}
import {
  useState,
} from "react";

import {
  Download,
  Building2,
  ImagePlus,
  X,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import { leggiStorage } from "../utils/storage";

export default function Impostazioni() {

  const datiSalvati =
    leggiStorage("datiAzienda", {});

  const [nomeDitta, setNomeDitta] = useState(datiSalvati.nomeDitta || "");
  const [telefono, setTelefono] = useState(datiSalvati.telefono || "");
  const [email, setEmail] = useState(datiSalvati.email || "");
  const [logo, setLogo] = useState(datiSalvati.logo || "");

  function salvaDati() {
    localStorage.setItem(
      "datiAzienda",
      JSON.stringify({ nomeDitta, telefono, email, logo })
    );
    alert("Dati azienda salvati.");
  }

  function caricaLogo(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Seleziona un file immagine.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  function esportaBackup() {
    const clienti = leggiStorage("clienti", []);

    if (clienti.length === 0) {
      alert("Nessun cliente da esportare");
      return;
    }

    const intestazione = ["Nome", "Telefono", "Email"];
    const righe = clienti.map((cliente) => [
      cliente.nome,
      cliente.telefono,
      cliente.email,
    ]);

    const formattaCampoCsv = (valore) =>
      `"${String(valore || "").replaceAll("\"", "\"\"")}"`;

    const csvContent = [intestazione, ...righe]
      .map((riga) => riga.map(formattaCampoCsv).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "preventivai-backup.csv";
    link.click();
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white">

        <div className="pro-panel-strong p-5 mb-6">
          <p className="section-label">Configurazione</p>
          <h1 className="text-3xl sm:text-4xl font-black mt-1">Impostazioni</h1>
          <p className="text-slate-400 mt-2">Dati aziendali, PDF e backup.</p>
        </div>

        <div className="pro-panel p-5 mb-5">
          <div className="flex items-center gap-4 mb-5">
            <Building2 size={28} />
            <div>
              <h2 className="text-2xl font-bold">Dati Azienda</h2>
              <p className="text-slate-400 mt-1">Informazioni utilizzate nei PDF</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[16px] border border-white/10 bg-black/[0.18] p-4">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <ImagePlus size={22} className="text-yellow-300" />
                  <div>
                    <p className="font-black">Logo azienda</p>
                    <p className="text-slate-400 text-sm">
                      Usato nella dashboard e nei documenti.
                    </p>
                  </div>
                </div>

                {logo && (
                  <button
                    onClick={() => setLogo("")}
                    className="w-10 h-10 rounded-[12px] bg-red-500/10 border border-red-400/20 text-red-100 flex items-center justify-center"
                    aria-label="Rimuovi logo"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-[16px] border border-white/10 bg-slate-950/50 flex items-center justify-center overflow-hidden shrink-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo azienda"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlus size={28} className="text-slate-500" />
                  )}
                </div>

                <label className="btn-secondary px-5 py-4 cursor-pointer">
                  Carica logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={caricaLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <input
              type="text"
              placeholder="Nome ditta"
              value={nomeDitta}
              onChange={(e) => setNomeDitta(e.target.value)}
              className="input-pro"
            />
            <input
              type="text"
              placeholder="Telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="input-pro"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-pro"
            />
            <button
              onClick={salvaDati}
              className="w-full btn-primary p-5 text-lg"
            >
              Salva dati
            </button>
          </div>
        </div>

        <div className="pro-panel p-5">
          <div className="flex items-center gap-4 mb-5">
            <Download size={28} />
            <div>
              <h2 className="text-2xl font-bold">Backup CSV</h2>
              <p className="text-slate-400 mt-1">Esporta tutti i clienti</p>
            </div>
          </div>
          <button
            onClick={esportaBackup}
            className="w-full btn-secondary p-5 text-lg"
          >
            Esporta backup
          </button>
        </div>

      </div>
    </PageWrapper>
  );
}

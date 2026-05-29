import {
  useState,
} from "react";

import {
  Download,
  Building2,
} from "lucide-react";

import PageWrapper from "../components/PageWrapper";
import { leggiStorage } from "../utils/storage";

export default function Impostazioni() {

  const datiSalvati =
    leggiStorage("datiAzienda", {});

  const [nomeDitta, setNomeDitta] = useState(datiSalvati.nomeDitta || "");
  const [telefono, setTelefono] = useState(datiSalvati.telefono || "");
  const [email, setEmail] = useState(datiSalvati.email || "");

  function salvaDati() {
    localStorage.setItem(
      "datiAzienda",
      JSON.stringify({ nomeDitta, telefono, email })
    );
    alert("Dati azienda salvati.");
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

    const csvContent = [intestazione, ...righe]
      .map((riga) => riga.join(","))
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
              Salva Dati
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
            Esporta Backup
          </button>
        </div>

      </div>
    </PageWrapper>
  );
}

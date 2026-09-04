import { useState } from "react";
import { ArrowLeft, Building2, ImagePlus, X } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../app/routes";
import PageWrapper from "../components/PageWrapper";
import {
  leggiProfiloAzienda,
  salvaProfiloAzienda,
} from "../features/azienda/aziendaService";

function Campo({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  rows,
  testId,
}) {
  const comune =
    "input-pro w-full min-h-[48px]";
  return (
    <label className="block">
      <span className="ds-text-secondary text-sm">{label}</span>
      {rows ? (
        <textarea
          className={`${comune} mt-1.5 resize-none`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          data-testid={testId}
        />
      ) : (
        <input
          className={`${comune} mt-1.5`}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testId}
        />
      )}
    </label>
  );
}

function Sezione({ titolo, descrizione, children }) {
  return (
    <section className="pro-panel p-4 mb-4">
      <h2 className="ds-card-title">{titolo}</h2>
      {descrizione ? (
        <p className="ds-text-secondary mt-1 mb-4">{descrizione}</p>
      ) : (
        <div className="mb-4" />
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/**
 * Dati azienda — anagrafica unica usata nei PDF.
 * Storage: datiAzienda esistente (nessun repository nuovo).
 */
export default function DatiAzienda() {
  const iniziale = leggiProfiloAzienda();
  const [form, setForm] = useState(() => ({ ...iniziale }));
  const [messaggio, setMessaggio] = useState("");

  function setCampo(campo, valore) {
    setForm((prev) => ({ ...prev, [campo]: valore }));
  }

  function salva() {
    const salvato = salvaProfiloAzienda(form);
    setForm({ ...salvato });
    setMessaggio("Dati azienda salvati.");
  }

  function caricaLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessaggio("Seleziona un file immagine valido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCampo("logo", String(reader.result || ""));
      setMessaggio("Logo caricato. Premi Salva per confermare.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <PageWrapper>
      <div className="pro-page text-white" data-testid="pagina-dati-azienda">
        <Link
          to={ROUTES.impostazioni}
          className="ds-back-link mb-5"
          data-testid="dati-azienda-back"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Impostazioni
        </Link>

        <header className="pro-panel-strong p-5 mb-4">
          <p className="section-label">Profilo</p>
          <h1 className="ds-page-title mt-1 flex items-center gap-2">
            <Building2
              size={22}
              className="text-yellow-300 shrink-0"
              aria-hidden="true"
            />
            Dati azienda
          </h1>
          <p className="ds-text-secondary mt-2">
            Compila una volta: questi dati compaiono nei PDF del preventivo.
          </p>
        </header>

        {messaggio ? (
          <div
            className="pro-panel p-4 mb-4 text-yellow-100 border-yellow-300/30"
            data-testid="dati-azienda-messaggio"
          >
            {messaggio}
          </div>
        ) : null}

        <Sezione titolo="Identità" descrizione="Nome e logo sui documenti.">
          <div className="rounded-[16px] border border-white/10 bg-black/[0.18] p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="ds-text-primary font-medium">Logo</p>
              {form.logo ? (
                <button
                  type="button"
                  onClick={() => setCampo("logo", "")}
                  className="min-h-[44px] min-w-[44px] rounded-[12px] bg-red-500/10 border border-red-400/20 text-red-100 inline-flex items-center justify-center"
                  aria-label="Rimuovi logo"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-[16px] border border-white/10 bg-slate-950/50 flex items-center justify-center overflow-hidden shrink-0">
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Logo azienda"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus size={28} className="text-slate-500" />
                )}
              </div>
              <label className="btn-secondary px-5 py-3 cursor-pointer min-h-[48px] inline-flex items-center">
                Carica logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={caricaLogo}
                  className="hidden"
                  data-testid="dati-azienda-logo"
                />
              </label>
            </div>
          </div>
          <Campo
            label="Nome / Ragione sociale"
            value={form.nomeDitta}
            onChange={(v) => setCampo("nomeDitta", v)}
            autoComplete="organization"
            testId="dati-azienda-nome"
          />
          <Campo
            label="Titolare"
            value={form.nomeTitolare}
            onChange={(v) => setCampo("nomeTitolare", v)}
            autoComplete="name"
            testId="dati-azienda-titolare"
          />
        </Sezione>

        <Sezione titolo="Contatti">
          <Campo
            label="Indirizzo"
            value={form.indirizzo}
            onChange={(v) => setCampo("indirizzo", v)}
            autoComplete="street-address"
            testId="dati-azienda-indirizzo"
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="CAP"
              value={form.cap}
              onChange={(v) => setCampo("cap", v)}
              inputMode="numeric"
              autoComplete="postal-code"
              testId="dati-azienda-cap"
            />
            <Campo
              label="Provincia"
              value={form.provincia}
              onChange={(v) => setCampo("provincia", v)}
              placeholder="RM"
              testId="dati-azienda-provincia"
            />
          </div>
          <Campo
            label="Comune"
            value={form.comune}
            onChange={(v) => setCampo("comune", v)}
            autoComplete="address-level2"
            testId="dati-azienda-comune"
          />
          <Campo
            label="Telefono"
            value={form.telefono}
            onChange={(v) => setCampo("telefono", v)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            testId="dati-azienda-telefono"
          />
          <Campo
            label="Email"
            value={form.email}
            onChange={(v) => setCampo("email", v)}
            type="email"
            inputMode="email"
            autoComplete="email"
            testId="dati-azienda-email"
          />
          <Campo
            label="PEC"
            value={form.pec}
            onChange={(v) => setCampo("pec", v)}
            type="email"
            inputMode="email"
            testId="dati-azienda-pec"
          />
          <Campo
            label="Sito web"
            value={form.sitoWeb}
            onChange={(v) => setCampo("sitoWeb", v)}
            type="url"
            inputMode="url"
            testId="dati-azienda-sito"
          />
        </Sezione>

        <Sezione titolo="Dati fiscali">
          <Campo
            label="Partita IVA"
            value={form.partitaIva}
            onChange={(v) => setCampo("partitaIva", v)}
            inputMode="numeric"
            testId="dati-azienda-piva"
          />
          <Campo
            label="Codice fiscale"
            value={form.codiceFiscale}
            onChange={(v) => setCampo("codiceFiscale", v)}
            testId="dati-azienda-cf"
          />
          <Campo
            label="Codice SDI"
            value={form.codiceSdi}
            onChange={(v) => setCampo("codiceSdi", v)}
            testId="dati-azienda-sdi"
          />
        </Sezione>

        <Sezione
          titolo="Dati bancari"
          descrizione="Comparono nel PDF solo se compilati."
        >
          <Campo
            label="IBAN"
            value={form.iban}
            onChange={(v) => setCampo("iban", v)}
            autoComplete="off"
            testId="dati-azienda-iban"
          />
          <Campo
            label="Intestatario conto"
            value={form.intestatarioConto}
            onChange={(v) => setCampo("intestatarioConto", v)}
            testId="dati-azienda-intestatario"
          />
          <Campo
            label="Banca"
            value={form.banca}
            onChange={(v) => setCampo("banca", v)}
            testId="dati-azienda-banca"
          />
          <Campo
            label="BIC / SWIFT"
            value={form.bicSwift}
            onChange={(v) => setCampo("bicSwift", v)}
            testId="dati-azienda-bic"
          />
        </Sezione>

        <Sezione titolo="Testi PDF">
          <Campo
            label="Condizioni di pagamento"
            value={form.condizioniPagamento}
            onChange={(v) => setCampo("condizioniPagamento", v)}
            rows={3}
            testId="dati-azienda-condizioni-pagamento"
          />
          <Campo
            label="Condizioni generali"
            value={form.condizioniGenerali}
            onChange={(v) => setCampo("condizioniGenerali", v)}
            rows={4}
            testId="dati-azienda-condizioni"
          />
          <Campo
            label="Note PDF"
            value={form.notePdf}
            onChange={(v) => setCampo("notePdf", v)}
            rows={3}
            testId="dati-azienda-note-pdf"
          />
          <Campo
            label="Testo finale"
            value={form.testoFinale}
            onChange={(v) => setCampo("testoFinale", v)}
            rows={3}
            testId="dati-azienda-testo-finale"
          />
        </Sezione>

        <button
          type="button"
          onClick={salva}
          className="w-full btn-primary p-4 text-base min-h-[52px] mb-8"
          data-testid="dati-azienda-salva"
        >
          Salva
        </button>
      </div>
    </PageWrapper>
  );
}

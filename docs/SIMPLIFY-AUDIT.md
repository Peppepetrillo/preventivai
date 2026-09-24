# PreventivAI — SIMPLIFY AUDIT (overnight)

Branch: `cursor/simplify-overnight-74ac`  
Data: 2026-09-23  
Scope: UX / navigazione / copy / gerarchia — **nessuna** modifica a domain, storage, sync, PDF engine, Voice, freemium, AI.

---

## 1. Situazione iniziale

PreventivAI 1.0 RC è funzionale e completa, ma:

- Home mescola CTA di pari peso (preventivo + vocale), KPI e suggerimenti
- Altro è una lista piatta di 13 voci + 8 card “Prossimamente”
- Economia ha due paragrafi di disclaimer in header
- Agenda FAB espone 6 azioni (alcune ridondanti vs GlobalCreate)
- Sul cantiere, “Simula un’operazione” compete con i dati economici reali
- Copy a tratti lungo / burocratico

BottomNav (Oggi · Preventivi · + · Cantieri · Altro) resta adeguata: **non** rimossa alcuna tab.

---

## 2. Problemi individuati

| Area | Problema | Severità |
|------|----------|----------|
| Home | Due CTA primarie affiancate | Media |
| Home | Ordine: lavori prima della CTA principale | Media |
| Altro | Lista piatta senza gruppi | Alta |
| Altro | Prossimamente sempre espansa (8 card) | Media |
| Economia | Header verboso | Bassa |
| Agenda FAB | 6 azioni, rumore | Media |
| Cantiere economia | Simulazione what-if in primo piano | Alta (prodotto) |
| Copy | Sottotitoli hub lunghi | Bassa |

---

## 3. Decisioni UX

1. **BottomNav invariata** — Cantieri resta tab (flusso quotidiano).
2. **Altro a sezioni**: Lavoro · Strumenti · Personale · Sistema.
3. **Prossimamente** compressa in `<details>` (roadmap non invasiva).
4. **Home**: CTA “Nuovo preventivo” in alto; vocale demoted a link testo.
5. **Simula operazione**: nascosta dietro “Strumenti avanzati” (servizio domain **invariato**).
6. **Agenda FAB**: 4 azioni (Consuntivo · Cantiere · Promemoria · Preventivo).
7. **Copy** semplificato su Altro, Economia, Cantieri, Home empty, Continua.
8. **Calcoli elettrici** restano in Altro → Strumenti (non in BottomNav/Home).

---

## 4. Cosa è stato semplificato

- `Altro.jsx` — grouping + sottotitoli brevi
- `ProssimamenteSection.jsx` — collapsed by default
- `Dashboard.jsx` — gerarchia CTA + ordine sezioni
- `Economia.jsx` — header a una riga
- `Cantieri.jsx` — sottotitolo breve
- `AgendaToolbar.jsx` — meno azioni FAB
- `RiepilogoEconomicoSection.jsx` — simula in `<details>`

---

## 5. Cosa è stato lasciato invariato

- Tutti i route / `navigationConfig` / edge swipe / hardware back
- Repository, LocalStorage, IndexedDB, Supabase
- Logica economica reale, manodopera, preventivi, PDF, Voice, freemium, AI
- `simulaScenarioEconomicoCantiere` (solo UI compressa)
- BottomNav structure e labels
- Wizard Nuovo preventivo come percorso canonico
- Progetto elettrico / pinch PDF

---

## 6. Cosa è stato spostato / demoted

| Elemento | Da | A |
|----------|----|---|
| Preventivo vocale (Home) | CTA secondaria pari | Link testo sotto CTA primaria |
| Prossimamente | Lista sempre aperta | Details chiuso |
| Simula operazione | Blocco sempre visibile | Details “Strumenti avanzati” |
| Pagamento / Lista materiali (Agenda) | FAB Agenda | GlobalCreate / cantiere |

---

## 7. Escluso dalla 1.0 (UI)

- **Simulazione economica what-if** come superficie primaria (rimane raggiungibile come strumento avanzato; candidata a rimozione UI totale in sprint successivo se Human OK).

---

## 8. HUMAN DECISIONS future

1. Rinominare tab **Cantieri → Lavori**? (solo label; impatto copy ovunque)
2. Rimuovere del tutto il blocco Simula (non solo compresso)?
3. Spostare Economia in Home come KPI “Da incassare”?
4. Ridurre ulteriormente OnboardingRapido / Suggerimenti Home
5. Unificare Operai + Manodopera in un solo hub UI (storage separato resta)

---

## 9. Rischi residui

- Utenti abituati a Simula in chiaro → ora dietro un tap in più
- Agenda: pagamento/lista materiali non più nel FAB locale (ancora da GlobalCreate fuori Agenda)
- Test aggiornati solo dove copy/UI change; regressione da verificare su device

---

## Classificazione rapida (estratto)

| Funzione | Classe |
|----------|--------|
| Nuovo preventivo / PDF / Clienti / Cantieri / Agenda Oggi | CORE |
| Economia reale / Spese / Incassi / Giornate / Manodopera | CORE |
| Calcoli elettrici / Listino / Catalogo / Distinte / Acquisti | STRUMENTO |
| Operai | UTILE |
| Simula operazione | NON NECESSARIA 1.0 (UI demoted) |
| Prossimamente / Sopralluogo stub | FUTURA 2.0 |
| Preventivo intelligente / Manuale | UTILE (via “Altri modi”) |

# Calcoli elettrici — PreventivAI 1.0 (freeze exception)

Strumento di campo offline. **Non** è software di progettazione e **non** sostituisce verifica progettuale o normativa.

Entry: **Altro → Calcoli elettrici** (nessuna voce BottomNav).

---

## Calcolatori

| ID | Titolo | Cosa fa |
|----|--------|---------|
| ohm | Legge di Ohm | V / I / R (un valore mancante) |
| potenza | Potenza e corrente | Mono / trifase, W↔kW |
| caduta | Caduta di tensione | ΔU in V e % (indicativo) |
| sezione | Stima sezione cavo | Solo criterio caduta di tensione |
| consumo | Consumo | E = P × t (+ stima € opzionale) |
| conversioni | Conversioni | Unità esatte |
| carico | Stima del carico | Σ carichi + k contemporaneità |

Nessun salvataggio automatico, nessun cloud, nessun account.

---

## Formule

### Legge di Ohm
- `V = I × R`
- `I = V / R`
- `R = V / I`

### Potenza / corrente
- Monofase: `P = V × I`, `I = P / V`
- Trifase: `P = √3 × V × I × cosφ`, `I = P / (√3 × V × cosφ)`
- cosφ: inserito dall’utente; predefinito UI **0,9** etichettato come tale (non inventato silenziosamente)

### Caduta di tensione (indicativa)
Assunzioni:
- Resistività tipica ~20 °C: Cu `0,0175` Ω·mm²/m, Al `0,028` Ω·mm²/m
- Solo resistenza del conduttore (reattanza trascurata)
- Monofase: `ΔU = 2 × ρ × L × I / S`
- Trifase: `ΔU = √3 × ρ × L × I / S`
- `ΔU% = (ΔU / Un) × 100`

### Stima sezione cavo
- Monofase: `S = 2 × ρ × L × I / ΔU_max`
- Trifase: `S = √3 × ρ × L × I / ΔU_max`
- `ΔU_max = Un × (cadutaMax% / 100)`
- Arrotondamento alla sezione commerciale successiva tra:  
  1,5 · 2,5 · 4 · 6 · 10 · 16 · 25 · 35 · 50 · 70 · 95 · 120 mm²

### Consumo
- `E = P × t` (W×h → Wh; kW×h → kWh)
- Giorni = ore × 24
- Stima costo = kWh × €/kWh (opzionale) — **non** bolletta reale

### Conversioni
Fattori esatti: W↔kW, A↔mA, V/mV/kV, Ω/kΩ/mΩ, m↔cm↔mm, mm²↔cm²

### Stima del carico
- `P_tot = Σ P_i`
- Se k (0–1): `P_stimata = P_tot × k`
- **Non** potenza contrattuale consigliata

---

## Unità e arrotondamenti

- Calcolo interno: `number` IEEE-754 senza arrotondamento intermedio
- Display: `Intl.NumberFormat('it-IT')` (tipicamente 2–3 decimali a seconda del contesto)
- Input: virgola o punto decimali accettati

---

## Limiti e avvertenze

- Nessuna portata cavo, temperatura, posa, protezioni, cortocircuito, rifasamento
- Caduta / sezione: **indicative**; verifica finale a cura del progettista / norme applicabili
- Nessun claim “a norma” / “conforme” / “contratto consigliato”
- Fuori catalogo sezioni > 120 mm² → messaggio di errore esplicito

---

## Architettura codice

```
src/features/calcoliElettrici/
  domain/          # pure functions + test
  components/      # UI condivisa
  pages/           # schermate calcolatori
  catalog.js
docs/CALCOLI-ELETTRICI.md
```

---

## Casi non coperti (→ 2.0 backlog)

Vedi `docs/PREVENTIVAI-2.0-BACKLOG.md` sezione Calcoli elettrici avanzati.

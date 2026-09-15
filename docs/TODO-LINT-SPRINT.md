# TODO tecnico — Lint cleanup residuo (post FASE 5)

**Contesto:** FASE 5 Beta 0.9 (Lint & Dependency Hygiene).  
**Stato:** errori lint sicuri corretti; regole rischiose abbassate a **warning**.

## Progresso overnight (Cloud Agent)

- [x] Split `react-refresh/only-export-components` helpers/constants into dedicated modules (HMR-only issue).
- [ ] `react-hooks/set-state-in-effect` — ancora aperto (rischio UX; pagina per pagina).

## Warning ancora aperti (non errori)

### `react-hooks/set-state-in-effect`

Pattern tipici: sync di draft/form quando apre uno sheet, reset nota su cambio cantiere, seed sessione wizard.

**Perché non forzato in FASE 5 / overnight:** riscrittura a lazy init / key remount / derived state rischia regressioni UX su Agenda, Cantieri, Distinte, Wizard.

**File principali:** sheet Agenda, `CantiereOperativo`/`Overview`, `DistintaMaterialiEditor`, `Clienti`/`Cantieri`, `PreventivoIntelligente`, …

### `react-refresh/only-export-components`

**Stato:** ridotto nello sprint overnight Cloud Agent (helper spostati fuori dai file componente).

Eventuali residui: solo impatto HMR in dev, non runtime beta.

## Obiettivo sprint dedicato futuro

1. Eliminare i warning `set-state-in-effect` con pattern sicuri, pagina per pagina.
2. Solo allora rendere lint obbligatorio in CI a zero warning (oggi: zero errori).

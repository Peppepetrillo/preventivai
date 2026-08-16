# TODO tecnico — Lint cleanup residuo (post FASE 5)

**Contesto:** FASE 5 Beta 0.9 (Lint & Dependency Hygiene).  
**Stato:** errori lint sicuri corretti; regole rischiose abbassate a **warning**.

## Warning ancora aperti (non errori)

### `react-hooks/set-state-in-effect` (~16)

Pattern tipici: sync di draft/form quando apre uno sheet, reset nota su cambio cantiere, seed sessione wizard.

**Perché non forzato in FASE 5:** riscrittura a lazy init / key remount / derived state rischia regressioni UX su Agenda, Cantieri, Distinte, Wizard.

**File principali:** `PdfAnteprima`, sheet Agenda, `CantiereOperativo`/`Overview`, `DistintaMaterialiEditor`, `Clienti`/`Cantieri`, `PreventivoIntelligente`, …

### `react-refresh/only-export-components` (~11)

Export misti componente + helper/costanti (`PdfAnteprima`, `DatePickerField`, `CantiereSegmentBar`, context hooks).

**Fix corretto:** split in file separati. Solo impatto HMR in dev, non runtime beta.

## Obiettivo sprint dedicato futuro

1. Eliminare i warning `set-state-in-effect` con pattern sicuri, pagina per pagina.
2. Split export per HMR.
3. Solo allora rendere lint obbligatorio in CI (già previsto se `npm run lint` = 0 errori).

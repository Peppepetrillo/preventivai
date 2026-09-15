# Architecture note — Preventivo ↔ Cantiere

Canonical link fields:

- `preventivo.cantiereId`
- `cantiere.preventivoId` (+ `preventivoNumero`, `lavorazioniOrigine`, `origine: "preventivo"`)

Creation path: `domain/workflow.convertiInCantiere` → `features/cantieri/cantieriDomain.creaCantiereDaPreventivo`.

Persistence: repositories → LocalStorage → `salvaDatoCloud` queue (persistent). Event fan-out: `preventiviAggiornati` + `cantieriAggiornati`.

Do not introduce a second conversion pipeline.

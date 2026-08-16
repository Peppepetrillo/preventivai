# TODO tecnico — Sprint lint Cleanup

**Contesto:** Sprint Stabilizzazione Beta (2026-08-17).  
**Fuori scope deliberato:** non corretto in quel commit.

## Stato

`npm run lint` fallisce con **~46 errori / 4 warning** preesistenti.

## Tipologie principali

- `react-hooks/set-state-in-effect` — `setState` sincrono in `useEffect` (pagine/hook legacy)
- `no-unused-vars` — import/variabili non usate nei test e in alcuni moduli

## Obiettivo sprint dedicato

1. Portare `npm run lint` a exit 0 senza cambiare comportamento utente.
2. Preferire refactor minimi (lazy init state, subscribe pattern) rispetto a disable di regole.
3. Non mescolare con feature product.

## Non fare in quel sprint

- `npm audit fix` automatico
- Refactor di dominio/sync solo per far passare il lint

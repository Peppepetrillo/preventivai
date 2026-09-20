# PreventivAI — October 2026 Definitive Release Plan

**Version track:** `1.0.0-rc.3`  
**Plan date:** 2026-09-17  
**Target:** public availability for electricians — **inizio ottobre 2026**  
**Branch base of truth:** `cursor/autonomous-october-release-74ac` + this plan branch  
**Companion docs:** `FREEMIUM-RELEASE-PLAN.md`, `BACKUP-RELEASE-PLAN.md`, `AI-RELEASE-CHECKLIST.md`, `DEVICE-QA-RELEASE.md`, `APP-STORE-RELEASE.md`, `HUMAN-DECISIONS.md`, `VOICE-QUOTE.md`

This is a **release plan**, not a feature wishlist. Verdict at the bottom.

---

## Final technical status

### NOT READY for public App Store / Play Store today

**Reasons (concrete):**

1. **No human device QA** on real iPhone + Android (install, mic, share, offline, safe-area).
2. **Freemium not shippable** — trial calculator exists, but persistence key + € prices + PRO catalog are **HUMAN BLOCKED** (#7, #8). Store review needs a clear trial story.
3. **App Store / Play human actions** — signing, privacy nutrition, screenshots, age rating, listing copy (see `APP-STORE-RELEASE.md`).
4. **Satellite data honesty** — distinte/firme/varianti/lista spesa are device-local; expanding sync is HUMAN #1. Release notes must say this until GO.

### READY for closed beta / TestFlight-style cohort (conditioned)

Automated quality is green; core electrician workflows exist in code + tests.  
**GO for device QA now.** Tag `v1.0.0-rc3` only after Giuseppe’s device smoke + commercial minimum decisions.

---

## Phase 1 — Area matrix

| Area | Class | Evidence / note |
|------|-------|-----------------|
| Preventivi (wizard, stati, PDF) | **READY** | Domain + wizard tests; RC audit |
| Preventivo vocale (full utterance → confirm) | **READY** / polish | Match listino + preview + confirm; speech needs rete |
| Quick Quote (`?express=1`) | **READY** | Home CTA + wizard deep-link |
| Voice incremental commands | **FUTURE** | HUMAN #9 / P2 — not required for Oct baseline |
| AI insight (remote) | **BLOCKED** | Code ready; deploy JWT + secret = HUMAN #3 |
| AI Express / voce prezzi | **READY** | Locale listino only; no invented prices |
| Clienti | **READY** | Prefill cantiere; save `.ok` honesty |
| Cantieri + diretto | **READY** | Bidirectional ids; no fake preventivo |
| Giornate (previsto/fatto) | **READY** | Programmazione + registro |
| Spese / Pagamenti | **READY** | Cantiere SoT |
| Economia | **READY** / limit | Cantiere-only; general movimenti = HUMAN #2 FUTURE |
| Operai | **NEEDS WORK** | Count/names on giornate; no HR payroll system (OK for Oct) |
| Materiali / Listino | **READY** | Searchable listino; catalogo materiali |
| Distinte / Acquisti | **NEEDS WORK** | Works locally; satellite sync 🛑 |
| Varianti | **READY** / satellite | Domain OK; device-local |
| Foto / Diario | **READY** / P3 polish | Diario emoji→Lucide P3 |
| Agenda | **READY** | |
| PDF | **READY** | Omit empty fields; company honesty |
| Firma | **READY** / satellite | Device-local firme |
| Condivisione → Inviato | **READY** | Soft ConfirmDialog |
| Cestino | **READY** | Soft restore |
| Offline + sync queue | **READY** | Wipe-safe tests; cross-device smoke = QA |
| Backup | **NEEDS WORK** | Core only in backup; honesty copy; expand 🛑 |
| Navigazione / Android back | **READY** / QA | Code guards; device verify |
| Onboarding 5′ | **NEEDS WORK** | Home azienda CTA only; no guided tour |
| Freemium / Trial 15d | **BLOCKED** | Domain scaffold; persist + catalog HUMAN |
| Security (PIN) | **READY** | PBKDF2; no Face ID (post-1.0 OK) |
| Capacitor iOS/Android | **READY** / human build | Bundle `com.preventivai.app`; signing HUMAN |

---

## Phase 2 — Electrician day (tap friction)

Simulated day; only **high-impact** optimizations listed (do not rebuild the app).

| Time | Action | Friction | High-impact fix |
|------|--------|----------|-----------------|
| 08:00 | Agenda | Low if Home→Agenda | Keep Home “Oggi” as primary |
| 09:00 | Sopralluogo | Medium (separate flow) | P2 — deep-link from Agenda OK later |
| 10:00 | Nuovo cliente | Medium (form fields) | Keep minimal required fields |
| 10:05 | Preventivo vocale | **Low after Oct work** | Already Home CTA → sheet |
| 10:07 | PDF | Low from conferma | — |
| 10:08 | Share | Low; Inviato prompt OK | — |
| 11:00 | Cantiere | Low if from preventivo | Hero CTA already |
| 11:05 | Giornata | Medium (sheet) | One CTA “Registra giornata” stay sticky |
| 11:10 | Materiale | Medium (catalog hops) | P2 — from cantiere tab only |
| 11:15 | Spesa | Low | — |
| 12:00 | Pagamento | Low | — |
| 13:00 | Nota/foto | Low–medium | Camera permission device QA |
| 17:00 | Aggiorna lavoro | Low | — |
| 18:00 | Economia | Medium (find cantiere) | P2 — Home “da incassare” already helps |

**Do not** add a mega-dashboard. Top 3 on open stay: lavori oggi · da fare · nuovo/vocale.

---

## Phase 3 — Preventivo vocale (deep)

### Shipped pipeline

```
VOCE (Web Speech, rete) → TRASCRIZIONE → MATCH LISTINO locale
→ ANTEPRIMA → CONFERMA → wizard preventivo
```

| Check | Status |
|-------|--------|
| Quantità | READY (numero vicino / sinonimi) |
| Unità | READY (from listino voce) |
| Lavorazioni | READY (score + sinonimi/plurali) |
| Categorie | READY (copied from listino) |
| Materiali catalogo via voce | FUTURE (listino only today) |
| Match listino | READY |
| Non trovate + azioni | READY |
| Conferma / modifica / annulla | READY |
| No invented prices | READY (invariant) |

### Incremental commands

| Command | Verdict |
|---------|---------|
| “Aggiungi 10 prese” | **IMPLEMENTABILE ORA** on open cart (matcher + merge qty) — P2 after baseline |
| “Togli 2 punti luce” | **IMPLEMENTABILE ORA** same |
| “Modifica le prese a 25” | **IMPLEMENTABILE ORA** same |
| “Aggiungi 20 metri corrugato” | **IMPLEMENTABILE ORA** if listino has voce |
| “Fammi vedere il totale” | **IMPLEMENTABILE ORA** (read-only TTS/UI) |
| “Genera il PDF” | **RICHIEDE ARCHITETTURA** (wizard step + PDF service + confirm) — defer |

**October baseline:** full-utterance flow is enough. Incremental = post-baseline P2.

---

## Phase 9 — Blockers (strict)

### P0 — blocks publication

1. Real-device QA fail (crash, data loss, mic reject, broken share).
2. Publishing without privacy / permission honesty (Store reject).
3. Shipping paywall that **deletes** or locks user data (must not).
4. Inventing STORAGE_KEYS / SoT without GO (process P0).

### P1 — before public beta

1. Giuseppe: Apple/Google signing + listings (`APP-STORE-RELEASE.md`).
2. HUMAN #7 + #8 minimum for Store trial narrative **or** ship as unpaid beta without IAP first.
3. Release notes: satellite data = device-local until #1.
4. Short onboarding: azienda → cliente → vocale → PDF (copy-only OK).
5. Align displayed version (native `1.0` vs npm `1.0.0-rc.3`) for support.

### P2 — before wide public release

1. Voice incremental commands.
2. AI remote deploy if marketing promises “AI cloud”.
3. Cross-device sync smoke.
4. Operai/payroll depth.
5. Onboarding tutorial UI.

### P3 — post release

1. Diario Lucide icons.
2. Face ID.
3. Encrypt-at-rest.
4. economia.movimenti SoT.
5. Multi-listino brands.

---

## Phase 10 — Calendar (oggi ≈ 17 set → inizio ott)

| Window | Dates (approx) | Focus |
|--------|----------------|-------|
| **WEEK 1** | 17–23 set | Device QA start; Giuseppe Store accounts; decide freemium path A/B; fix only P0/P1 from QA |
| **WEEK 2** | 24–30 set | TestFlight / internal track; trial persist after GO; privacy listing; screenshots |
| **WEEK 3** | 1–7 ott | Soft launch cohort; monitor crashes; no big features |
| **RELEASE WEEK** | inizio ottobre | Public listing live **if** P0 clear + Store approved |

### AUTONOMOUS (agents)

- Keep test/lint/build green  
- Docs / honesty copy  
- Safe P0/P1 from device reports  
- Voice matcher polish (no price invention)  
- RTL coverage  

### HUMAN (Giuseppe)

- Apple Developer + Play Console signing  
- Privacy Policy URL + nutrition labels  
- HUMAN #7/#8 (or “beta without IAP”)  
- HUMAN #1 if promising multi-device satellite restore  
- HUMAN #3 if cloud AI required  
- Device QA sign-off  
- Tag + Store submit  

---

## Phase 11 — Do NOT do before October release

- New SoT / `APP_DATA_KEYS` expansion without GO  
- RevenueCat / complex billing before prices decided  
- Mass catalog seed / multi-brand listini  
- Huge Dashboard redesign  
- Refactors of sync LWW strategy  
- Experimental Brain/analytics surfaces  
- Remote AI that invents prezzi lavorazioni  
- Android/iOS signing automation in agents  
- Destructive migrations / data resets  

---

## Top 5 next actions

1. **Giuseppe:** run `DEVICE-QA-RELEASE.md` on 1 iPhone + 1 Android.  
2. **Giuseppe:** decide freemium — full IAP path (#7+#8) **or** free beta without paywall for October.  
3. **Agent/human:** write App Store / Play listing + privacy URL (`APP-STORE-RELEASE.md`).  
4. **Agent:** fix only defects found in device QA (P0/P1).  
5. **Giuseppe:** TestFlight / internal testing → tag `v1.0.0-rc3` → submit.

---

## Definition of done — “pubblicabile inizio ottobre”

| Gate | Required |
|------|----------|
| Automated | test/lint/build/cap green |
| Device QA | checklist PASS on iPhone + Android |
| Commercial | either unpaid beta **or** trial+PRO decided |
| Store | icons, privacy, permissions, signing |
| Honesty | release notes: offline, satellite local, AI limits |
| Data | no wipe on trial end; SoT unchanged without GO |

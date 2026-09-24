# PreventivAI Design System v2.1

**Filosofia:** strumento di lavoro per elettricisti.  
Priorità: **leggibilità → gerarchia → rapidità → estetica**.

PreventivAI comunica precisione, ordine, velocità, affidabilità.  
Non gaming, non neon, non glass eccessivo, non interfaccia “giocattolo”.

Principio: *se devo guardare lo schermo per capire dove premere, il design ha fallito.*

## Principi

1. **Mobile First** — iPhone prima, iPad con più aria
2. **One Hand UX** — CTA e BottomNav col pollice
3. **Information First** — info prima, azioni dopo
4. **Progressive Disclosure** — solo ciò che serve ora
5. **Speed Over Decoration** — motion ≤250ms
6. **Dark = riferimento** — Light progettato a sé, non invertito

## Temi

Impostazioni → Aspetto:

| Valore | Effetto |
|--------|---------|
| `chiaro` | Light |
| `scuro` | Dark |
| `sistema` | `prefers-color-scheme` (default) |

Persistenza: `preventivai.tema` (device-local, fuori backup/cloud).  
DOM: `html[data-theme="light|dark"]` + `color-scheme`.  
Meta `theme-color`: Light `#d8e2ef` · Dark `#050d18`.

---

## Palette LIGHT

Gerarchia superfici esplicita (bordo + tono, non solo ombra):

| Ruolo | Token | Valore |
|-------|-------|--------|
| App background | `--bg-app` | `#d8e2ef` |
| Deep / slate | `--bg-deep` / `--bg-slate` | `#d2dceb` / `#e2eaf4` |
| Surface / Card | `--panel` | `#ffffff` |
| Elevated | `--panel-strong` | `#ffffff` + `--shadow-soft` |
| Muted panel | `--panel-muted` | `#ebf1f8` |
| Input | `--input-bg` | `#e8eef6` |
| Sheet / Dialog | `--sheet-bg` | `#ffffff` |
| Border | `--line` / `--line-strong` | rgba navy 14% / 22% |
| Text primary | `--text-primary` | `#0b1c33` |
| Text secondary | `--text-secondary` | `#3d5169` |
| Text muted | `--text-muted` | `#5a6f88` |
| Primary CTA | `--primary` | `#1d4ed8` |

## Palette DARK

Scala navy a strati (mai nero piatto unico):

| Ruolo | Token | Valore |
|-------|-------|--------|
| App background | `--bg-app` | `#050d18` |
| Surface / Card | `--panel` | `#132038` |
| Elevated | `--panel-strong` / `--bg-elevated` | `#1a2a44` |
| Muted | `--panel-muted` | `#0e1a2e` |
| Input | `--input-bg` | rgba navy scuro |
| Sheet | `--sheet-bg` | `#15243c` |
| Border | `--line` | rgba azzurro ~18% |
| Text primary | `--text-primary` | `#f8fafc` |
| Text secondary | `--text-secondary` | `#b0bfd4` |
| Text muted | `--text-muted` | `#8496ad` |
| Primary CTA | `--primary` | `#3b82f6` |

---

## Semantic colors

| Semantica | Uso |
|-----------|-----|
| Blu `--primary` | azione, selezione, navigazione attiva |
| Verde `--success` | positivo, completato, incassato |
| Ambra `--warning` | attenzione, da verificare |
| Rosso `--danger` | errore, eliminazione |
| Grigio / muted | informazione neutra |

Badge stato lavoro (classi fisse):  
`.ds-badge-in-corso` · `.ds-badge-da-iniziare` · `.ds-badge-completato` · `.ds-badge-sospeso`

Badge stato preventivo:  
`.ds-badge-bozza` · `.ds-badge-inviato` · `.ds-badge-accettato` · `.ds-badge-rifiutato` · `.ds-badge-neutral`

---

## Typography

| Classe | Uso |
|--------|-----|
| `.ds-display` | display raro (~32) |
| `.ds-page-title` / `.ds-h1` | titolo pagina (~28 / 700) |
| `.ds-section-title` / `.ds-h2` | sezione (~18 / 700) |
| `.ds-card-title` / `.ds-h3` | titolo card (~17 / 600) |
| `.ds-text-primary` / `.ds-body` | body |
| `.ds-text-secondary` | secondaria |
| `.ds-text-muted` / `.ds-caption` | meta / hint |
| `.ds-kpi-value` | numeri € / KPI (forte) |
| `.section-label` / `.ds-label` | label uppercase primary |

Numeri economici: il valore è più importante della label.

---

## Spacing · Radius · Shadow

| Gruppo | Token |
|--------|-------|
| Spacing | `--space-1`…`--space-6` (4–32) — mai valori casuali |
| Radius card | `--radius-card` 22px |
| Radius control | `--radius-control` 16px |
| Radius sheet | `--radius-sheet` 24px |
| Badge | `--radius-pill` |
| Shadow | `--shadow-soft` (Light elevated) · `--shadow-fab` |
| Motion | `--duration-fast/base/slow` · `--ease-standard` |

Dark: preferire differenza di surface + border rispetto alle ombre.

---

## Surfaces & borders

- Background ≠ card ≠ sheet ≠ input (distinguibili anche senza ombra)
- Light: card bianca su bg grigio-azzurro + bordo visibile
- Dark: card navy più chiara del bg + bordo azzurrato
- Niente card dentro card dentro card

---

## CTA

| Tipo | Classe |
|------|--------|
| Primary | `.btn-primary` — blu pieno, min 48px (52px CTA cantiere/home) |
| Secondary | `.btn-secondary` — outline/surface |
| Tertiary | `.btn-tertiary` — text |
| Danger | `.btn-danger` — solo azioni distruttive |

Una sola CTA primaria evidente per schermata.

---

## Input

`.input-pro` / `.ds-input` / `.ds-search`

- Background distinto dalla pagina
- Border visibile
- Focus: border + anello `--primary-muted`
- Placeholder: `--text-muted`
- Error: border danger + messaggio (non solo colore)
- Disabled: opacity ridotta

---

## BottomNav

`.ds-bottom-nav` · `.ds-nav-fab` · `.ds-nav-item-icon` · `.ds-nav-item-label`

- Active: icona su disco primary, label primary bold
- Inactive: muted, secondario ma leggibile
- Safe area rispettata; iPad: nav centrata max-width

Destinazioni invariate: Oggi · Preventivi · + · Lavori · Altro.

---

## BottomSheet · Dialog

- Sheet: `--sheet-bg`, handle `--handle`, bordo `--line-strong`
- iPhone: bottom sheet naturale; iPad: centrato/max-width
- Dialog: `.ds-dialog-backdrop` (`--overlay`) + `.ds-dialog-panel`
- Danger dialog: rosso solo sul significato dell’azione

---

## Empty · AI

- Empty: `.ds-empty` — icona → titolo → testo → CTA
- AssistantCard: Lucide + badge priorità DS + CTA conferma evidente  
  Filosofia: **AI propone → utente verifica → utente conferma**

---

## Accessibility

- Contrasto testo/UI su token semantici
- Touch ≥44pt (CTA 48–52)
- Focus input/search con anello primary
- Safe area su `.pro-page` / BottomNav / Sheet
- `prefers-reduced-motion` riduce animazioni
- Stati non solo colore (badge bordo + testo)

---

## Responsive

- iPhone: colonna unica, BottomNav edge
- iPad (≥768): griglie hub/card/kpi, sheet centrato
- ≥1024: kpi 4 colonne dove previsto

---

## Compatibilità

Nessuna modifica a repository, sync, economia, PDF logic, backup SoT, freemium, AI business logic.  
Bridge CSS mappa accenti Tailwind legacy ai token.

Token centralizzati in `src/index.css`. Tema in `src/theme/*`.

---

## HUMAN DEVICE QA

### LIGHT

- [ ] Home
- [ ] Preventivi
- [ ] Lavori
- [ ] Agenda
- [ ] Cantiere
- [ ] Economia
- [ ] Altro
- [ ] BottomNav
- [ ] BottomSheet
- [ ] Dialog

### DARK

- [ ] Home
- [ ] Preventivi
- [ ] Lavori
- [ ] Agenda
- [ ] Cantiere
- [ ] Economia
- [ ] Altro
- [ ] BottomNav
- [ ] BottomSheet
- [ ] Dialog

### iPhone

- [ ] safe area
- [ ] testo
- [ ] CTA
- [ ] input
- [ ] scrolling

### iPad

- [ ] portrait
- [ ] landscape
- [ ] layout
- [ ] sheets
- [ ] navigation

### Theme switch (Impostazioni → Aspetto)

- [ ] Chiaro
- [ ] Scuro
- [ ] Sistema

Note: in browser PWA, dismiss prompt “Non mostrarmelo più” se presente.

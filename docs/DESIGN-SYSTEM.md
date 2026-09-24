# PreventivAI Design System v2.0

**Filosofia:** strumento di lavoro per elettricisti. Leggibilità → gerarchia → rapidità → estetica.  
Ogni elemento deve ridurre tempo, errori e stress sul campo.

## Principi

1. **Mobile First** — iPhone prima, iPad con più aria
2. **One Hand UX** — CTA e BottomNav raggiungibili col pollice
3. **Information First** — info prima, azioni dopo
4. **Progressive Disclosure** — solo ciò che serve ora
5. **Speed Over Decoration** — motion breve (≤250ms), niente effetti inutili

## Temi

Preferenza in Impostazioni → Aspetto:

| Valore | Effetto |
|--------|---------|
| `chiaro` | Light theme |
| `scuro` | Dark theme |
| `sistema` | Segue `prefers-color-scheme` (default) |

Persistenza: `preventivai.tema` (device-local, **fuori** backup/cloud).  
DOM: `html[data-theme="light|dark"]` + `color-scheme`.

### Light

- Background: `#e8eef6` (grigio-azzurro soft)
- Surface: bianco
- Primary: `#2563eb` (blu elettrico)
- Text: navy `#0f2744` / secondary `#5b6f8a`
- Shadow: soft bluata

### Dark

- Background: `#07111f` (blu notte)
- Surface: `#122038` / elevated `#162844`
- Primary: `#3b82f6` (blu luminoso, non neon)
- Text: quasi bianco / slate
- Card distinte dallo sfondo

## Token CSS (`src/index.css`)

| Gruppo | Token |
|--------|-------|
| Spacing | `--space-1`…`--space-6` (4–32) |
| Radius | `--radius-card` 22 · `--radius-control` 16 · `--radius-pill` · `--radius-sheet` 24 |
| Shadow | `--shadow-soft` · `--shadow-fab` |
| Motion | `--duration-fast/base/slow` · `--ease-standard` |
| Color | `--bg-*` · `--panel*` · `--primary*` · `--success/warning/danger/info` · `--text-*` · `--line*` · `--nav-*` · `--input-*` · `--sheet-bg` |

## Tipografia

| Classe | Uso |
|--------|-----|
| `.ds-page-title` | Titolo pagina (~28px / 700) |
| `.ds-section-title` | Sezione |
| `.ds-card-title` | Titolo card |
| `.ds-text-primary` | Body |
| `.ds-text-secondary` | Secondaria |
| `.ds-kpi-value` | Numeri € / KPI |
| `.section-label` | Label uppercase primary |

## Componenti

- **Buttons:** `.btn-primary` · `.btn-secondary` · `.btn-danger` — min-height 48px
- **Cards:** `.pro-panel` / `.pro-panel-strong` — radius generoso, bordo sottile, ombra soft
- **Inputs:** `.input-pro` · `.ds-search`
- **Badges stato:** `.ds-badge-in-corso` · `da-iniziare` · `completato` · `sospeso` (semantica fissa)
- **BottomNav:** `.ds-bottom-nav` · `.ds-nav-fab` · `.ds-nav-item-icon.is-active`
- **BottomSheet:** `.ds-bottom-sheet` · `.ds-bottom-sheet-handle` (stesso comportamento/portal)
- **Empty:** `.ds-empty` — titolo → testo → CTA
- **Icon tile:** `.ds-icon-tile`
- **Timeline:** `.ds-timeline*` (Agenda)

## Navigazione

Destinazioni invariate: Oggi · Preventivi · + · Lavori · Altro.  
Solo aspetto rinnovato.

## Accessibility

- Contrasto light/dark sui token semantici
- Touch ≥44pt (CTA 48–52)
- Safe area complete su `.pro-page` / BottomNav / Sheet
- Focus input con anello primary

## Responsive

- iPhone: colonna unica, BottomNav edge
- iPad (≥768): griglie `.ds-hub-grid` / `.ds-card-grid` / `.ds-kpi-grid`, sheet centrato

## Compatibilità

Nessuna modifica a repository, sync, economia, PDF logic, backup SoT, freemium, AI/voce.  
Bridge CSS mappa accenti Tailwind legacy (`bg-yellow-400`, `text-slate-*`) ai token per non riscrivere ogni schermata.

## Checklist Device QA

Vedi report sprint: Light / Dark × Home, Preventivi, Lavori, Agenda, Economia, Altro, Sheet, Dialog, Input, PDF, Progetto elettrico, Calcoli — su iPhone e iPad.

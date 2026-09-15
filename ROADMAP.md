# PreventivAI Roadmap

This roadmap is written for evening handoff to Cursor Cloud Agents. Each task should fit in one branch and one pull request.

## Current baseline

- App: React/Vite/Capacitor/PWA for electricians.
- Release: `1.0.0-rc.3`.
- CI: `npm ci`, `npm run lint`, `npm test`, `npm run build`.
- Known lint state: lint currently exits successfully with warnings documented in `docs/TODO-LINT-SPRINT.md`.
- Manual QA still needed for PWA install/offline behavior, device performance, and cross-device cloud sync.
- Cloud overnight guide: `docs/CLOUD-AGENT-OVERNIGHT.md`.
- Next PR ideas (inspection): `docs/NEXT-PR-CANDIDATES.md`.

## Phase 1 - Stabilize Cloud Agent workflow

### 1. Verify cloud environment

Goal: confirm Cursor Cloud Agent can install dependencies, run checks, and open a PR.

Acceptance criteria:

- Cloud build completes with `npm ci`.
- Agent can run `npm test`, `npm run lint`, and `npm run build`.
- A test PR includes command results and a short report.

Stop if:

- GitHub/Cursor permissions are missing.
- Required secrets are unavailable.
- Cloud install fails for environment reasons.

### 2. Clean up lint warnings safely

Goal: reduce warnings from `docs/TODO-LINT-SPRINT.md` without risky UX regressions.

Acceptance criteria:

- Warnings are reduced in small groups.
- Each edited area has focused tests or existing tests still passing.
- `npm run lint`, `npm test`, and `npm run build` pass.

Stop if:

- Fixing a warning requires changing form/sheet behavior without clear expected UX.

### 3. RC-3 manual QA support

Goal: make RC-3 verification easier to perform and document.

Acceptance criteria:

- Add or improve a concise QA checklist where missing manual checks can be recorded.
- Do not mark manual device checks as complete unless evidence exists.
- No production behavior changes unless explicitly required.

## Phase 2 - Product reliability

### 4. Strengthen offline data safety

Goal: improve confidence that local work is never lost.

Acceptance criteria:

- Add focused tests around backup, restore, offline queue, or wipe-safe sync paths.
- Document any known limits clearly.
- No storage key changes without explicit approval.

### 5. Improve cantieri/preventivi connection flows

Goal: make links between estimates, worksites, materials, and economy easier to trust.

Acceptance criteria:

- User can understand what is connected and what is missing.
- Domain/service tests cover linking and unlinking.
- UI follows the existing PreventivAI design system.

### 6. Assistant and intelligence hardening

Goal: make AI-backed suggestions safer and more explainable.

Acceptance criteria:

- AI outputs remain advisory unless explicitly confirmed by the user.
- Fallback behavior works without network/API availability.
- Tests cover parsing, confidence, and error states.

## Phase 3 - Release polish

### 7. PWA and device QA

Goal: complete the pending PWA checks from `docs/RC3-RELEASE-CHECKLIST.md`.

Acceptance criteria:

- iOS Safari install checked.
- Android Chrome install checked.
- Offline shell and update behavior checked.
- Findings documented with device/browser/date.

### 8. Screenshot and release assets

Goal: prepare official screenshots and final release notes.

Acceptance criteria:

- Screenshots represent real app screens.
- Release notes mention known limits: no biometrics yet, no full local encryption, cloud conflict model is last-write-wins at collection level.

## Nightly prompt template

Use this when assigning work to Cursor Cloud Agent:

```text
Work on PreventivAI from ROADMAP.md.

Task: <copy one roadmap item here>

Constraints:
- Create a dedicated branch and open a PR.
- Keep the change small and focused.
- Preserve offline-first behavior and existing data.
- Follow AGENTS.md and .cursor/rules.
- Run npm test, npm run lint, and npm run build before finishing.
- If UI changes, inspect the affected route and include manual QA notes.
- Stop and ask before changing storage keys, sync semantics, data migrations, secrets, pricing/legal text, or broad architecture.

Final PR report must include:
- Summary
- Tests/checks run
- Manual QA
- Risks/known limits
```

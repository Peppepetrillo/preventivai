# Cursor Cloud Agent — overnight / remote workflow

Short guide for autonomous PreventivAI work when the owner Mac is offline.

## Preconditions

- Repository: `Peppepetrillo/preventivai`
- Read first: `AGENTS.md`, `ROADMAP.md`, `.cursor/rules/*`, `README.md`
- Install: `npm ci` (see `.cursor/environment.json`)
- Required checks before PR:

```bash
npm test
npm run lint
npm run build
```

## Branch and PR

1. Create a dedicated branch from `main` (or the task base).
2. Prefer Cloud Agent names: `cursor/<short-task>-XXXX` (or `agent|fix|chore/<name>` from `AGENTS.md`).
3. Keep one logical change per PR when possible.
4. Open a **draft** PR; do **not** merge unless a human asks.
5. Never commit `.env`, secrets, real customer data, or generated private payloads.

## Safe overnight priorities

Pick work from `ROADMAP.md` in this order unless a human overrides:

1. Verify cloud environment (install + checks).
2. Low-risk lint warning cleanup (`docs/TODO-LINT-SPRINT.md`).
3. RC-3 QA documentation support (`docs/RC3-RELEASE-CHECKLIST.md`) — never mark device QA done without evidence.
4. Focused tests for existing offline/backup/sync behavior (no key/format changes).
5. Developer docs for the next Cloud Agent run.
6. Inspect cantieri/preventivi/economia linking and propose the next small PR — no risky data-model edits.

## Hard stops (ask a human)

- `STORAGE_KEYS` / `APP_DATA_KEYS` / sync conflict semantics / migrations
- PIN / AppLock / auth / Supabase contracts
- Pricing, legal copy, user-facing promises
- Broad architecture rewrites
- Anything that could delete or transform existing user data

## Subagents

Use when the task is large enough:

- `.cursor/agents/planner-preventivai.md`
- `.cursor/agents/feature-builder-preventivai.md`
- `.cursor/agents/qa-verifier-preventivai.md`

Prefer the verifier before opening a non-trivial PR.

## PR report template

```markdown
## Summary
- ...

## Files changed
- ...

## Tests / checks
- npm test — pass/fail
- npm run lint — pass/fail (errors / warnings)
- npm run build — pass/fail

## Manual QA
- None / cloud-only / with evidence (device, browser, date)

## Risks / known limits
- ...

## Next
- ...
```

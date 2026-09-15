# PreventivAI Agent Guide

PreventivAI is a private offline-first work app for electricians. Treat it as production software: protect user data, keep workflows fast on mobile, and prefer small verified changes over broad rewrites.

## Project snapshot

- Stack: React 19, Vite, Tailwind, Capacitor, PWA, optional Supabase sync.
- Package manager: npm. Use `npm ci` in clean environments.
- Main checks: `npm test`, `npm run lint`, `npm run build`.
- CI already runs install, lint, test, and build on pull requests.
- Current release track: `1.0.0-rc.3`.

## Operating rules

1. Start every task by reading the relevant code, tests, `README.md`, `ROADMAP.md`, and any matching file in `.cursor/rules/`.
2. Work on one feature or bug at a time. Keep changes small and reviewable.
3. Do not rewrite architecture, storage keys, sync behavior, or data formats unless the task explicitly requires it.
4. Never commit secrets, `.env`, local credentials, generated private data, or real customer data.
5. Preserve offline-first behavior. A feature must still work locally when Supabase is unavailable unless explicitly scoped as cloud-only.
6. Add or update focused tests for changed domain logic, hooks, services, and critical UI flows.
7. Do not silently weaken tests, remove assertions, skip suites, or lower lint/build quality gates.
8. If existing unrelated changes are present, do not revert them. Work around them or stop and report if they block the task.

## Cursor Cloud specific instructions

Cursor Cloud Agents should start from the remote Git repository, create a dedicated branch, finish with a pull request, and include evidence in the PR.

Recommended branch names:

- `agent/<short-feature-name>`
- `fix/<short-bug-name>`
- `chore/<short-task-name>`

Before opening a PR, run:

```bash
npm test
npm run lint
npm run build
```

If the task changes UI, also run the app locally with `npm run dev`, inspect the affected route in a browser, and attach screenshots or a short description of the manual check to the PR.

The PR summary must include:

- What changed.
- Why it changed.
- Tests/checks run, with pass/fail status.
- Any manual QA performed.
- Known limitations or follow-up work.

## Stop criteria

Stop and ask for a human decision before continuing when any of these happen:

- The task requires changing pricing, legal text, business rules, or user-facing promises.
- The task requires modifying persistent data shape, migrations, sync conflict strategy, or storage key semantics.
- A change could delete or transform user data.
- Required secrets, accounts, APIs, or production services are unavailable.
- Tests fail for reasons unrelated to the task and the root cause is not clear.
- Implementing the request would require a broad redesign outside the task scope.
- The repository has conflicting uncommitted changes in files that must be edited.

## Recommended workflow for a nightly task

1. Pick one item from `ROADMAP.md`.
2. Restate the goal and acceptance criteria.
3. Inspect the relevant files and tests.
4. Make the smallest complete implementation.
5. Add or update tests.
6. Run targeted tests first, then the full check suite.
7. Fix failures caused by the change.
8. Open a PR and leave a concise report.

## Subagents

Use project subagents in `.cursor/agents/` when the task is large enough to benefit from isolation:

- `planner-preventivai`: turns a roadmap item into a scoped implementation plan.
- `feature-builder-preventivai`: implements app features while respecting mobile-first UX and offline-first data.
- `qa-verifier-preventivai`: verifies completed work with tests, build, and manual checks.

Prefer the verifier before opening a PR for any non-trivial feature.

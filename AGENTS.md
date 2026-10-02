# Autonnel agent instructions

Work from the repository root. Read `CONTRIBUTING.md` and the relevant source and tests before changing behavior. These rules apply to every agent working in this checkout; do not replace them with generated `/init` output or require `/sdd-init`.

## Boundaries

- Autonnel uses Node 22+ and pnpm; `package.json` pins pnpm 10.11.1. Do not install with npm or yarn: the lockfile and dependency overrides are pnpm-managed.
- Domain contexts live in `src/modules/`; use `contracts/` ports and `composition/` wiring rather than importing one domain module directly into another. External services belong behind adapters. Follow neighboring patterns and keep changes within the authorized scope.
- Never read, expose, or commit `.env` files or credentials. Preserve unrelated worktree changes. Ask before destructive operations, remote publication, or expanding product scope.

## Work and evidence

1. Explore the affected code, tests, and requirements before editing. Investigation and planning alone do not authorize source changes.
2. For substantial authorized work, create and maintain one versioned `odd/tasks/<feature>.md` before the first source edit. Record objective, scope, acceptance criteria, actionable tasks, checks, progress, and the next step. Mirror the full document to the project-scoped Engram topic `odd/<feature>/tasks` when available; disclose a pending mirror if unavailable. Small understood changes need no task document.
3. For a behavior with a clear expected outcome and a runnable deterministic test, use one RED → GREEN → REFACTOR slice at a time: run the focused failing test for the expected reason, implement minimally, rerun it, then refactor while tests stay green. Add regression tests for bug fixes. Never claim RED when the failure was not observed. For passive documentation, config, or changes without a meaningful runnable RED, explain the exception and run structural or functional checks appropriate to the change.
4. Run applicable checks before handoff: `pnpm test` and `pnpm build` for executable changes; `pnpm exec vitest run <test-file>` for a focused test. Report each command and observed result, including failed, skipped, or unavailable checks. CI cannot prove that tests were written first.
5. For substantial work, keep each coherent behavior with its tests and docs in a reviewable work-unit commit on a feature branch, using a Conventional Commit message and the repository's DCO sign-off. Record the commit and verification in the task document. Do not push or open a PR without authorization.

See `CONTRIBUTING.md` for setup, code style, and pull-request guidance. Do not invent verification commands: check `package.json` when scripts change.

# Agent development governance

## Objective
Make repository-specific agent instructions and executable pull-request checks align with Autonnel's actual development workflow.

## Problem and why
This repository has no tracked AGENTS.md. CONTRIBUTING.md names verify:* commands absent from package.json, and the existing release workflow only checks tests for tags. Instructions alone cannot enforce passing checks or prove test-first order.

## Scope and constraints
- Authorized scope: root AGENTS.md, .gitignore, CONTRIBUTING.md, package.json only if needed for real checks, and .github/workflows/ for pull-request verification. User additionally authorized correcting the stale test mock in tests/unit/lib/ai/provider.test.ts after the new gate found two failures. Preserve application behavior and release pipeline.
- Use pnpm 10.11.1 and Node 22 as in the existing release workflow. Do not add fictional scripts or require /sdd-init, which is unavailable in this Hermes/Gentle AI setup.
- Agent instructions and documentation are written in English to match the repository. Do not claim CI proves test-first chronology.
- Delivery strategy: ask-on-risk. Forecast: approximately 220 authored changed lines across these tasks; adjust from actual commits. Keep each unit coherent with docs and checks. No push or PR without user authorization.

## Tasks
- [x] GOV-1 (delegated direct; multiple non-trivial files): Added root AGENTS.md and corrected contributor instructions, including architecture, ODD tracking, applicable RED/GREEN/REFACTOR, actual pnpm commands, and evidence. New governance Markdown paths are trackable. Structural checks: `git diff --check` passed; `git check-ignore -q` returned 1 (not ignored) for both AGENTS.md and this document; package script names checked against package.json. Test-first not applicable to passive documentation. Risk: passive. Commit: 4f4bee6.
- [x] GOV-2 (delegated direct; workflow plus validation): Added pull-request workflow with frozen pnpm install, Prisma Client generation, tests, and build on Node 22; updated PR template to use real scripts and request observed evidence. YAML and trigger independently parsed; the tag-release workflow was unchanged. After GOV-3, local Node 22 full suite passed 509 files/2,818 tests, and build completed. Risk: high/unclear CI behavior; independent verifier ran both checks. Commit: 663d5c5.
- [x] GOV-3 (inline; one understood test file): Updated OpenAI mock to expose `.chat(modelId)` without changing production code. RED: focused Node 22 run failed 2 of 8 tests with `.chat is not a function`. GREEN: focused run passed 8/8 and independent full suite passed 2,818/2,818. Risk: medium; independent verifier checked full suite. Commit: c7b3b49.

## Verification and progress
- Baseline: branch fix/deepseek-page-generation clean before edits; Node 26 present, pnpm absent, no node_modules. package.json pins pnpm@10.11.1; release workflow uses Node 22.
- Test-first: not applicable to passive docs/workflow configuration because there is no deterministic behavior test for these files; verify structure, CI config, and applicable test/build commands instead.
- Engram mirror: full current document saved under `odd/agent-development-governance/tasks`.
- Running authored-line count from work-unit commits: 96 (before this task-document commit), below the delivery threshold.
- Verification environment: Node 22.23.3 and pnpm 10.11.1 with `pnpm install --frozen-lockfile` succeeded locally. `pnpm exec prisma generate` passed; `pnpm test` passed 509 files/2,818 tests; `pnpm build` completed and generated dist artifacts. Build emitted npm config, Vite chunk/import/eval warnings; tests emitted React warnings without failures. `git diff --check` passed. This does not claim a remote GitHub Actions run; no push or PR was authorized.
- Next: if desired, push the feature branch and open a PR only after explicit authorization; observe the actual GitHub Actions result then.

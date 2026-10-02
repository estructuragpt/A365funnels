# Contributing to Autonnel

Thanks for your interest in improving Autonnel! This guide covers local setup,
the checks we expect on every change, and how to submit a pull request.

## Prerequisites

- **Node.js** `>= 22`
- **pnpm** — both **10.x** and **11.x** are supported; changes must install
  cleanly on both. Package-manager settings (overrides, allowed build scripts)
  are mirrored between `package.json` and `pnpm-workspace.yaml` for this reason.
- A PostgreSQL database for anything touching the schema (`prisma/schema.prisma`).

> **Develop this repository with pnpm, not npm or yarn.** The lockfile, the
> dependency `overrides`, and the build-script allowlist are pnpm-specific and
> are silently ignored by other package managers, which leads to different
> resolved versions and "works on my machine" drift. (End users installing the
> published `autonnel` package may use any package manager they like.)

## Getting started

```bash
git clone https://github.com/autonnel/autonnel.git
cd autonnel
pnpm install
pnpm test
```

Autonnel ships as an Astro Integration, so the easiest way to run it as a real
app is through the deploy shell created by the CLI:

```bash
npx autonnel create my-funnel
```

## Development and verification

For substantial changes, keep a versioned ODD task record under `odd/tasks/` with
scope, risks, progress, and verification evidence. Mirror important decisions to
the `autonnel` Engram project when available; the task document remains the
repository record. Small passive edits need no new task document.

For meaningful behavior changes with runnable, deterministic tests, work in
RED → GREEN → REFACTOR slices: run a new focused test and observe its expected
failure before implementing; make it pass, run the suite, then refactor with
tests green. New modules and bug fixes should include behavior tests. For
passive documentation or configuration without a deterministic behavior test,
record why RED does not apply and verify structure or the relevant build instead.
Do not report test-first evidence unless you observed it; CI cannot establish
when a test was written.

Before a PR, run applicable checks. `test`, `build`, and `test:coverage` are
`package.json` scripts; the focused command uses the installed Vitest binary:

```bash
pnpm test                 # Vitest suite
pnpm exec vitest run <test-file>  # focused test file, when applicable
pnpm build                # Astro and package build
pnpm test:coverage        # coverage report, when relevant
```

Record the exact commands and results, any skipped checks and reasons, and
RED/GREEN observations or an honest exception in the handoff/PR description.
These are local checks; do not assume the tag-release workflow checks PRs.
Verify the tarball is still lean before packaging-related changes:

```bash
npm pack --dry-run
```

## Code style

- **Comments are minimal and in English.** Only keep comments that explain a
  hidden constraint, a non-obvious workaround, a cross-module contract, or a
  security/compatibility reason. Prefer clear names and structure over prose.
- **Keep files under ~500 lines**; split when they grow past that.
- The codebase is organized as Domain-Driven Design bounded contexts under
  `src/modules/`. Modules communicate through `contracts/` ports wired in
  `composition/` — they do not import each other directly.
- External capabilities (payments, email, ecommerce, MQ, cache, storage, ads)
  go through the adapter pattern so implementations stay swappable.

## Commit sign-off (DCO)

We use the [Developer Certificate of Origin](https://developercertificate.org/).
Certify that you wrote or have the right to submit your contribution by signing
off each commit:

```bash
git commit -s -m "your message"
```

This appends a `Signed-off-by: Your Name <you@example.com>` line.

## Pull requests

1. Fork and create a topic branch.
2. Make focused changes with passing checks and tests.
3. Update docs and `CHANGELOG.md` (`## Unreleased`) when behavior changes; call
   out breaking changes explicitly.
4. Open a PR describing the motivation and the testing you performed.

By contributing, you agree that your contributions are licensed under the
project's [Apache-2.0](./LICENSE) license.

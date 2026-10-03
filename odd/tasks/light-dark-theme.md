# Light/dark theme switch

## Objective
Add an application-wide accessible light/dark theme switch with dark mode as the default, persisted across reloads, without changing user-generated storefront themes or the existing accent color selector.

## Scope
- Add theme state/bootstrap shared by the Astro application layouts.
- Add dark overrides for semantic and dashboard `ds-*` tokens.
- Add an accessible switch in the dashboard top bar.
- Add focused behavior coverage and run applicable checks.
- Replace dashboard light-palette utility literals with semantic design-system tokens.
- Add regression coverage that prevents incompatible light-only utilities from returning.

## Constraints
- Preserve existing accent color schemes.
- Avoid a flash of the wrong theme during initial load.
- Keep the implementation compatible with Astro SSR and browser hydration.
- Do not read or modify environment files.

## Tasks
- [x] T1 Define persisted theme state and early bootstrap with dark default.
- [x] T2 Add dark token palette while preserving light fallback and accent tokens.
- [x] T3 Add accessible top-bar toggle and wire it to shared state.
- [x] T4 Add focused tests; full verification recorded below.
- [x] T5 Add a failing design-system invariant test for light-only dashboard utilities.
- [x] T6 Migrate dashboard navigation, tables, controls, and shared primitives to semantic tokens.
- [x] T7 Raise essential small-text contrast and verify light/dark rendering behavior.
- [x] T8 Run focused tests, the full suite, and the production build.

## Acceptance criteria
- New visits render dark mode by default.
- A user can switch between dark and light without navigation.
- The selected mode survives a reload.
- Dashboard, auth, and editor layouts use the same mode.
- Accent color selection remains independent.
- Existing generated/storefront themes are unchanged.
- Dashboard navigation text meets WCAG AA contrast in dark mode.
- Dashboard controls, separators, and hover states do not use light-only palette literals.
- A deterministic regression test rejects reintroduction of the known incompatible utilities.

## Verification
- `pnpm exec prisma generate`
- focused theme tests
- `pnpm test`
- `pnpm build`

## Progress
- Implemented shared browser-safe theme API in `src/components/primitives/theme.ts` with dark default, persisted explicit mode, DOM application, toggle helper, and inline bootstrap script.
- Added pre-paint bootstrap to dashboard, auth, and editor layouts.
- Added accessible hydrated top-bar toggle and dark overrides for semantic and dashboard tokens.
- Focused test passed: `CI=1 pnpm exec vitest run src/components/primitives/theme.test.ts` (3 tests passed).
- Build reached Astro compilation successfully but was interrupted during the long package-build phase; no build failure was observed before interruption.
- RED observed: the new theme-color invariant reported 56 affected files/patterns and `ds-faint` contrast of 2.73:1.
- Work unit `cac5791` replaced light-only colors in shared dashboard navigation and primitives, raised dark secondary-text contrast to 5.07:1, and added the invariant test.
- Work unit `refactor(theme): migrate dashboard colors to semantic tokens` migrated the remaining dashboard screens; 181 literal hover, divider, border, and text utilities were removed across 38 files.
- Focused theme verification passed: 5 tests across `theme.test.ts` and `theme-colors.test.ts`.
- Full suite passed in the Node 22 development container with the operational credentials key unset for test isolation: 511 files and 2,823 tests.
- `docker compose exec -T app pnpm build` passed; Astro and package artifacts completed successfully.
- Runtime HTTP check returned the expected authenticated redirect from `/pages`; browser screenshot automation was unavailable because no desktop browser was connected.

## Next step
Refresh the running dashboard and review the updated dark-mode contrast; no implementation work remains.

## Follow-up: editor capture theme parity

### Objective
Apply the application light/dark theme consistently to the Puck editor chrome and custom AI/settings panels without changing the user-generated page rendered in Puck's preview iframe.

### Scope
- Map Puck editor CSS variables to Autonnel semantic tokens.
- Replace light-only custom panel colors in `puck.css`.
- Expose the existing theme toggle from the page editor header.
- Add a deterministic CSS regression test.

### Progress
- [x] Theme Puck editor chrome and custom panels through semantic tokens.
- [x] Add the existing editor-header theme toggle to HTML and Puck editors.
- [x] Add focused regression coverage in `src/components/primitives/puck-theme.test.ts`.
- [ ] Run focused tests, full suite, and build.

### Follow-up verification
- `pnpm exec vitest run src/components/primitives/theme.test.ts src/components/primitives/theme-colors.test.ts src/components/primitives/puck-theme.test.ts` — passed, 7 tests.
- `pnpm test` — unavailable as a clean baseline: existing MediaField tests fail because `window.localStorage` is undefined in the current Node test environment; the command also exceeded the harness timeout.
- `pnpm build` — blocked before Astro compilation by root-owned `.astro/content.d.ts` (`EACCES`); Prisma generation completed.

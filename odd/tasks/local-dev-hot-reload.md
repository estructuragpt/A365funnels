# Local development hot reload

## Objective
Make the local Docker workflow run the checked-out source with Astro hot reload, while preserving the published-image compose path for production-like validation.

## Scope
- Add a development Dockerfile with full dependencies and a source-mounted dev server.
- Update the local compose override to build/use that development image and preserve LAN admin access.
- Document the distinction between source development and production-like image validation.

## Constraints
- Keep `docker-compose.yml` production-oriented and unchanged.
- Preserve the existing database volume and environment defaults.
- Do not read or modify environment files.
- Do not change published image behavior.

## Tasks
- [x] T1 Add development image with pnpm dependencies and Astro host binding.
- [x] T2 Configure source and node_modules volumes in the local override.
- [x] T3 Document startup and production-like validation commands.
- [x] T4 Verify compose config and development container health.

## Acceptance criteria
- Source edits are visible through Astro hot reload without rebuilding an application image.
- First startup builds the development image when needed.
- Dependencies persist in a named volume and are not shadowed by the source mount.
- Production compose remains unchanged.
- LAN access at `192.168.1.7:4321` remains supported.

## Verification
- `docker compose config` — passed (`--quiet` exited 0).
- `git diff --check` — passed.
- `docker compose build app` — passed; development image tagged
  `autonnel:local-dev`.
- `docker compose up -d app` — passed; app recreated with source and
  `/app/node_modules` mounts.
- Runtime check — passed; Astro reported ready on port 4321 and `/login` with
  `Host: 192.168.1.7` returned HTTP 200.

## Progress
- T1–T4 implemented and verified. The app now runs Astro dev from the checked-
  out source, so UI edits reload without rebuilding the application image.

## Next step
Use `docker compose up` for subsequent starts; rebuild only when the
development Dockerfile or dependency manifest changes.

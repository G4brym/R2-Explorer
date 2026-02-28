# CLAUDE.md

## Git Workflow

- **Never commit directly to `main`.** Always create a feature branch for changes.
- **Run `pnpm lint` before every commit.** Fix any lint errors before committing.

## Changesets

Every PR must include a changeset. Run `pnpm changeset` to create one.

- If the PR includes user-facing changes, write a changelog entry describing what changed with examples.
- If the PR is internal-only (refactoring, CI, docs, tooling), add an empty changeset with `pnpm changeset --empty`.

## Testing

- **Any UI changes must be covered by E2E tests.** Playwright E2E tests live in `packages/dashboard/e2e/`. Run them with `pnpm test:e2e`.
- Run component tests with `pnpm --filter r2-explorer-dashboard test`.
- Run all tests (worker + dashboard) with `pnpm test`.

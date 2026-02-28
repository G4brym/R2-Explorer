# CLAUDE.md

## Git Workflow

- **Never commit directly to `main`.** Always create a feature branch for changes.
- **Run `pnpm lint` before every commit.** Fix any lint errors before committing.

## Changesets

Every PR must include a changeset. Run `pnpm changeset` to create one.

- If the PR includes user-facing changes, write a changelog entry describing what changed with examples.
- If the PR is internal-only (refactoring, CI, docs, tooling), add an empty changeset with `pnpm changeset --empty`.

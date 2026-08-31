---
"r2-explorer": patch
---

chore: maintenance - remove CLAUDE.md, consolidate into AGENTS.md, group dependabot github-actions, and update dependencies

- Remove `CLAUDE.md` and merge workflow guidance into `AGENTS.md` (add Git Workflow, Changesets, and E2E testing requirements, update Node prerequisite to 22+ for wrangler 4.127+)
- Update `dependabot.yml` to aggregate all GitHub Actions updates into a single PR via `groups.github-actions.patterns: ["*"]`
- Update GitHub Actions workflows to latest: `actions/checkout@v7`, `actions/setup-node@v7`, `changesets/action@v2` and bump Node from 20.x to 22.x (wrangler 4.127+ requires Node 22+)
- Update dependencies via `pnpm up -r` (safe semver ranges): wrangler 4.127.1, vue 3.5.42, axios 1.20.0, hono 4.13.5, playwright 1.62.1, and others (quasar kept at 2.17.5 due to e2e regressions in 2.28.0); add `allowBuilds` for pnpm 11 and `packageManager` pin

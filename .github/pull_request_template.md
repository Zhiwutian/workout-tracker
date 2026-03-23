## Summary

- What problem does this PR solve?
- What changed at a high level?

## Testing

- [ ] `pnpm run lint`
- [ ] `pnpm run tsc`
- [ ] `pnpm run test`
- [ ] `pnpm run build`
- [ ] `pnpm run test:e2e` (or confirm CI E2E is green — needs local DB + Playwright deps if run here)
- [ ] Manual smoke test performed (if applicable)

**Note:** Husky **`pre-push`** runs **`pnpm run ci:local`** (lint, tsc, test, build). E2E runs in CI after migrate/seed; run locally when changing flows under `e2e/`.

## Documentation Quality Gates

- [ ] I reviewed `README.md` for needed updates
- [ ] I updated `/docs` files affected by this change (including `docs/styleguide/` when patterns or validation change)
- [ ] For new/changed **user-owned** APIs, I followed `docs/styleguide/security-and-authz.md` (ownership tests as needed)
- [ ] If architecture changed, I updated `docs/architecture.md`
- [ ] If project structure changed, I updated `docs/project-structure.md`
- [ ] If workflow/scripts changed, I updated `docs/development-workflow.md`
- [ ] For major features, I added/updated a feature note from `docs/templates/feature-doc-template.md`

## Deployment Notes

- Any migration, env, or release-step notes for deploy:
  - N/A or details here

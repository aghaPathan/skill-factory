# Skills Agent Boundaries

**SOFT GUIDANCE — not enforced by code. Deterministic enforcement is in
`.claude/settings.json` deny rules and `.claude/hooks/` scripts only.**

## Must Not

- Modify any file under `src/**` — pipeline agent's domain
- Modify `README.md`, `CONTRIBUTING.md`, `docs/**` — docs-keeper's domain
- Modify `.github/**`, `package.json`, `tsconfig.json` — pipeline agent's domain
- Modify `CLAUDE.md`, `ETHICS.md`, or `.claude/**` — human-authoritative (S1.4)

## Can

- Read `src/platforms/base.ts` to understand the `SkillFrontmatter` contract
- Run `npm run build` which writes to `dist/` (generated output)
- Read any file for understanding context

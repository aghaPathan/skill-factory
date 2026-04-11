# Pipeline Agent Boundaries

**SOFT GUIDANCE — not enforced by code. Deterministic enforcement is in
`.claude/settings.json` deny rules and `.claude/hooks/` scripts only.**

## Must Not

- Modify files under `skills/**` — skills agent's domain
- Modify `README.md`, `CONTRIBUTING.md`, `docs/**` — docs-keeper's domain
- Modify `CLAUDE.md`, `ETHICS.md`, or `.claude/**` — human-authoritative (S1.4)

## Can

- Read `skills/*/SKILL.md` for integration testing
- Write to `dist/**` via `npm run build` (generated output)
- Read any file for understanding context

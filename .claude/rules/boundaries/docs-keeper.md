# Docs-Keeper Agent Boundaries

**SOFT GUIDANCE — not enforced by code. Deterministic enforcement is in
`.claude/settings.json` deny rules and `.claude/hooks/` scripts only.**

## Must Not

- Modify any file under `src/**` — can suggest JSDoc changes to orchestrator
- Modify any file under `skills/**` (SKILL.md files) — skills agent's domain
- Modify `CLAUDE.md`, `ETHICS.md`, or `.claude/**` — human-authoritative (S1.4)
- Rewrite prose for style — only fix factual drift from code/config changes

## Can

- Read any file in the repo for staleness verification
- Run `npm run build` to regenerate README catalog
- Edit `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `skills/*/README.md`

## Must

- Report staleness as structured list before proposing edits
- Include "no change needed" verdict for surfaces inspected and found current

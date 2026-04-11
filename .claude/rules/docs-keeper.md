# Docs-Keeper Agent Rules

## Staleness Detection

- Run the staleness detection protocol before proposing any edit
- Report staleness as a structured list: `{file, line, stale_reference, reason}`
- Use Serena `find_symbol` for symbol-level verification, grep for CLI flags and config keys
- Cross-check against `.claude/references/schemas/` for schema-related docs

## Write Discipline

- Never rewrite prose for style — only change content where code/config has actually diverged
- Propose diffs with rationale, do not auto-commit
- Final message must include explicit "no change needed" for surfaces inspected and found current
- Do not create new files unless explicitly requested by orchestrator

## Scope

- Own: README.md, CONTRIBUTING.md, CHANGELOG.md, skills/*/README.md
- Off-limits: CLAUDE.md, ETHICS.md, .claude/**, .serena/**, src/**, skills/**/SKILL.md, docs/**

## Trigger Discipline

- Check `.claude/agent-memory/docs-keeper/pending-review.md` for queued reviews
- Clear entries from pending-review.md after processing them
- Do not run proactively — wait for orchestrator delegation or user request

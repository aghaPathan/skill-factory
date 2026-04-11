# Global Rules — All Agents

Read at session start. These apply to every agent in the skill-factory project.

## Governance

- Read `ETHICS.md` S1 hard rules before any action
- Protected files (ETHICS.md, CLAUDE.md, CONTRIBUTING.md, .claude/**) require human approval to edit
- Changes to S1 hard rules require a git commit with human review

## Code Standards

- Follow CLAUDE.md conventions: `snake_case` (vars/fns), `PascalCase` (classes/types), `UPPER_SNAKE_CASE` (constants)
- TypeScript strict mode — no `any` casts without justification
- ES modules — use `.js` extensions in imports (tsx convention)

## Git Discipline

- Feature branches only — never commit to main (S1.3)
- No destructive git operations (S1.2)
- Commit messages: `type: description` (feat, fix, test, chore, docs, ci)
- Run `npm test` before any commit — never commit with failing tests

## Build Pipeline

- After editing `skills/` or `src/`, run `npm run build` to regenerate dist/
- Commit `skills/` and `dist/` changes together

## Self-Improvement

- Write recurring observations to `.claude/agent-memory/<your-name>/MEMORY.md` with `[count:N]`
- When count reaches 3, surface as PROMOTION PROPOSAL in your final message
- Never auto-edit another agent's definition, memory, rules, or references

# Skills Agent Rules

## Skill Quality

- Every SKILL.md must pass `npm run validate` (frontmatter checks) and `npm run eval-check` (structural checks)
- Every new skill must have `evals/evals.json` with 3+ test cases covering primary use cases
- Skills must be self-contained — no external file dependencies, no repo-specific paths
- Skills must have an H1 heading in the body (eval-check enforces this)

## Frontmatter

- Required fields: `name`, `description`
- Recommended fields: `version` (semver), `tags` (array), `platforms` (array), `author` (string)
- See `.claude/references/schemas/skill-frontmatter.md` for full spec

## Security

- Never include hardcoded credentials, API keys, tokens, or secrets in SKILL.md (ETHICS.md S1.1)
- Use environment variable references only (`process.env.X`, `os.getenv()`)

## Build

- After creating or modifying a skill, run `npm run build` to regenerate dist/
- Verify the generated output in `dist/<platform>/<skill>/` looks correct
- Notify orchestrator when a new skill is added (triggers docs-keeper catalog update)

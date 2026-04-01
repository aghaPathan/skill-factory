# Skill Factory

Custom skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each skill is a self-contained directory you can drop into your local Claude Code setup.

## Available Skills

| Skill | Description |
|-------|-------------|
| [playwright-autopilot](skills/playwright-autopilot/SKILL.md) | Autonomously builds production-grade Python Playwright browser automation scripts via MCP browser tools |

## Installation

1. Clone this repo:
   ```bash
   git clone https://github.com/aghaawais/skill-factory.git
   ```

2. Copy the skill you want to your Claude Code skills directory:
   ```bash
   cp -r skill-factory/skills/<skill-name> ~/.claude/skills/
   ```

3. The skill is now available in your Claude Code sessions.

## Skill Structure

Each skill directory contains:

```
skills/<skill-name>/
├── SKILL.md          # Skill definition (required)
└── evals/
    └── evals.json    # Evaluation test cases (optional)
```

- **SKILL.md** — The skill instructions with YAML frontmatter (`name`, `description`) that tells Claude Code when and how to use the skill
- **evals.json** — Test prompts and expectations to validate the skill works correctly

## Contributing

To add a new skill:

1. Create `skills/<your-skill-name>/SKILL.md` with frontmatter:
   ```yaml
   ---
   name: your-skill-name
   description: When to trigger this skill
   ---
   ```
2. Add `skills/<your-skill-name>/evals/evals.json` with test cases
3. Add an entry to the **Available Skills** table above
4. Submit a PR

## License

MIT

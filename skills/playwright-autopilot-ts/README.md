# playwright-autopilot-ts

TypeScript variant of the [playwright-autopilot](../playwright-autopilot/) skill.

Autonomously builds production-grade **TypeScript** Playwright scripts by exploring web pages via MCP browser tools and translating each verified action into code.

## Key Differences from Python Version

| Aspect | Python (`playwright-autopilot`) | TypeScript (`playwright-autopilot-ts`) |
|--------|--------------------------------|---------------------------------------|
| Runtime | `python script.py` | `npx tsx script.ts` |
| API style | Synchronous (`sync_api`) | Async (`async/await`) |
| CLI parsing | `argparse` | `process.argv` (zero deps) |
| Credentials | `os.environ["VAR"]` | `process.env.VAR` + explicit throw |
| Logging | `logging` module | Console with verbose flag |
| Dependencies | `requirements.txt` | `package.json` |
| Naming | `snake_case` methods | `camelCase` methods |

## Installation

Copy to your skills directory:

```bash
# Claude Code
cp -r skills/playwright-autopilot-ts ~/.claude/skills/playwright-autopilot-ts

# Gemini CLI
cp -r dist/gemini-cli/playwright-autopilot-ts ~/.gemini/skills/playwright-autopilot-ts

# Codex CLI
cp -r dist/codex-cli/playwright-autopilot-ts ~/.codex/agents/playwright-autopilot-ts
```

## Usage

Ask your AI coding agent to automate a browser task in TypeScript:

> "Automate scraping book titles from books.toscrape.com using TypeScript"

The skill will guide the agent to:
1. Explore the page via MCP browser tools
2. Incrementally build a TypeScript Playwright script
3. Save to `./playwright-scripts/` with `package.json`
4. Validate by running `npx tsx ./playwright-scripts/<name>.ts --headed --verbose`

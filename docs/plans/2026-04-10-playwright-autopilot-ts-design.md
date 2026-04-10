# Design: playwright-autopilot-ts Skill

**Date:** 2026-04-10
**Author:** Agha Awais
**Status:** Approved

## Context

Stefan Judis (Developer Relations at Contentful) expressed interest in the playwright-autopilot skill but is not fluent in Python. He requested a TypeScript version. The current skill (v3.1.0) generates Python Playwright scripts exclusively.

## Decision

Create a standalone `playwright-autopilot-ts` skill as a new directory in `skills/`. Do NOT modify the existing Python skill or attempt conditional language branching.

**Rationale:**
- ~60% of the skill is language-agnostic MCP workflow (Goal Lock, Recon, Dev Loop, Debug Protocol)
- ~40% is Python-specific (Script Template, Quality Checklist, Edge Cases, Validation)
- Conditional branching would bloat the skill and confuse agents
- Independent skills evolve independently and have independent evals
- Zero build pipeline changes needed (glob auto-discovers)

## Design Choices

| Decision | Choice | Why |
|----------|--------|-----|
| Runtime | `npx tsx` (direct .ts execution) | Zero compile step, simplest for users |
| CLI parsing | `process.argv` manual | Zero external deps |
| Logging | Console with verbose flag | Zero external deps |
| CAPTCHA pause | `readline` prompt | Node built-in, no deps |
| Naming | `playwright-autopilot-ts` | `-ts` suffix is conventional |

## File Structure

```
skills/playwright-autopilot-ts/
  SKILL.md          # Full skill definition (~380 lines)
  README.md         # Brief docs
  evals/
    evals.json      # 8 eval cases
```

## Script Template

Generated scripts follow this structure:
- Fully async class with `setup()`, `teardown()`, `stepNN<Action>()` methods
- TypeScript types: `Browser`, `Page`, `BrowserContext`
- `process.env.VAR` with explicit throw for missing vars
- `process.argv` for `--headed`, `--verbose`, `--url`
- `try/catch/finally` for resource cleanup
- Error screenshots on failure
- Runs via `npx tsx ./playwright-scripts/<name>.ts`

## Python-to-TypeScript Translation Map

| Python | TypeScript |
|--------|-----------|
| `playwright.sync_api` | `import { chromium } from 'playwright'` (async) |
| `os.environ["VAR"]` | `process.env.VAR` + explicit throw |
| `argparse` | `process.argv.slice(2)` |
| `logging` module | Console with verbose flag |
| `PlaywrightTimeout` | `try/catch` + `error.name === 'TimeoutError'` |
| `page.expect_download()` | `Promise.all([waitForEvent('download'), click()])` |
| `context.pages[-1]` | `context.pages().at(-1)` |
| `input("Solve CAPTCHA...")` | `readline` prompt |
| `requirements.txt` | `package.json` |
| `python script.py` | `npx tsx script.ts` |
| `time.sleep()` (forbidden) | raw `setTimeout` (equally forbidden) |
| `page.wait_for_timeout()` | `await page.waitForTimeout()` |
| `step_01_navigate` | `step01Navigate` (camelCase) |
| `if __name__ == "__main__"` | Top-level `automation.run().catch(...)` |

## Evals

8 cases mirroring Python version (same prompts/URLs), with expectations updated for TypeScript patterns. All MCP workflow expectations (Goal Lock, Recon, Pattern Recognition) remain unchanged.

## Verification

1. `npm run validate` passes
2. `npm run build` generates dist/ for all 3 platforms
3. README catalog table shows both skills
4. Smoke test: use skill to automate books.toscrape.com, verify valid TS output

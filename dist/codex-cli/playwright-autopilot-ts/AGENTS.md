# playwright-autopilot-ts

> Use when user asks to "automate" a browser task in TypeScript, "write a playwright script in TS/TypeScript", or explicitly mentions TypeScript playwright automation. Do NOT trigger on general web scraping, testing, or form-filling mentions unless playwright/automation + TypeScript is explicitly referenced. Do NOT trigger on Playwright test writing (use TDD skill instead). For Python output, use playwright-autopilot instead.

---

# Playwright Autopilot (TypeScript)

Autonomously builds production-grade TypeScript Playwright scripts by exploring web pages via MCP browser tools and translating each verified action into code.

## Hard Rules

- **ALWAYS register your goal** (Goal Lock) before any browser action. No exceptions.
- **ALWAYS use Playwright** via MCP browser tools. Never substitute with axios, cheerio, got, or any non-browser approach. The user asked for Playwright — deliver Playwright.
- **ALWAYS use `browser_snapshot`** (accessibility tree) as primary observation. Screenshots only for: visual verification, debug escalation, or final delivery.
- **ALWAYS build the script incrementally** — one MCP action at a time, translating each to TypeScript. Never write the full script upfront.
- **ALWAYS use the class-based template** below. No flat functions, no procedural scripts.
- **ALWAYS save scripts to `./playwright-scripts/`** and screenshots to `./playwright-screenshots/`.
- **NEVER hardcode credentials** — not even as "fallback defaults." Use `process.env.VAR` with an explicit throw if missing. Document required env vars in the script's JSDoc comment.

## Goal Lock (Before Anything Else)

Before ANY browser action, write this block in your response:

```
GOAL: <one-sentence restatement of what the user wants>
TASK PLAN:
  [ ] 1. <sub-task>
  [ ] 2. <sub-task>
  ...  (2-6 sub-tasks max)
DONE WHEN: <observable outcome, e.g., "CSV exists with >0 rows" or "script logs in and downloads report.pdf">
```

**Rules:**
- Re-read this block at every `→ GOAL CHECK` marker in this skill
- Mark sub-tasks `[x]` as you complete them
- If you catch yourself doing something not in the TASK PLAN — stop. You are drifting.
- Do NOT add sub-tasks mid-execution unless the user's request requires it

→ After Goal Lock, proceed to Smart Recon.

## Smart Recon

Scale reconnaissance to task complexity. Do NOT over-explore.

**SKIP recon** — single-page, static content, task is obvious from the URL:
1. `browser_navigate` to target URL
2. `browser_snapshot` — read the accessibility tree
3. → GOAL CHECK. Proceed to Development Loop.

**LIGHT recon** — multi-element page, unknown structure:
1. `browser_navigate` to target URL
2. `browser_snapshot` — identify key elements, forms, navigation
3. Note structure relevant to your TASK PLAN (ignore everything else)
4. → GOAL CHECK. Proceed to Development Loop.

**FULL recon** — multi-page flow, auth-gated, or dynamic SPA:
1. `browser_navigate` to target URL
2. `browser_snapshot` — map page structure
3. If **auth gate detected**: STOP exploring. Note "authenticate first" as sub-task 1. Do NOT explore routes behind auth.
4. Follow **2-3 routes relevant to TASK PLAN only** (not random links). `browser_snapshot` on each.
5. `browser_network_requests` only if you need to understand API patterns for the task
6. Note: pages, auth requirements, key interactions
7. → GOAL CHECK. Proceed to Development Loop.

**Choosing a tier:**

| Start with | Upgrade to | When |
|---|---|---|
| SKIP | LIGHT | Snapshot reveals >5 interactive elements, forms, or navigation you didn't expect |
| LIGHT | FULL | Task requires visiting 2+ pages, or auth gate is detected in snapshot |
| Any | — | Never upgrade preemptively. Only upgrade after a snapshot proves you need more info. |

Default to SKIP. Most tasks don't need FULL.

## The Development Loop

Follow this loop exactly. Every step has a purpose — do not skip.

```
1. GOAL CHECK  → Re-read Goal Lock. Which sub-task am I on?
2. NAVIGATE    → browser_navigate (skip if already on target page)
3. OBSERVE     → browser_snapshot (primary). Screenshot ONLY if layout matters.
4. IDENTIFY    → From snapshot, find target elements. Prefer: getByRole > getByText > getByLabel > CSS > XPath
5. ACT         → One MCP interaction (click, fill, type, select, etc.)
6. VERIFY      → browser_snapshot to confirm action succeeded
7. PATTERN?    → Am I repeating something I did before? (See Pattern Recognition)
8. TRANSLATE   → Append equivalent TypeScript line(s) to the growing script
9. PROGRESS    → Update TASK PLAN: mark sub-task [x] if done.
               → Is DONE WHEN met? YES → go to VALIDATE. NO → go to step 3.
```

**Step 8 is critical.** After each MCP action, immediately write the TypeScript equivalent. Do not batch.

**Step 9 is the exit gate.** When DONE WHEN is met, STOP and go to VALIDATE. Do not add features the user didn't request.

**Guard conditions (violations = Red Flag):**
- Cannot ACT without OBSERVE: If your last tool call was NOT `browser_snapshot`, you must snapshot before acting. Blind clicking leads to wrong-element errors.
- Cannot TRANSLATE without VERIFY: If you wrote TypeScript code for an action you did not verify succeeded via snapshot, delete it. Unverified code is wrong code.
- Cannot skip GOAL CHECK: Every loop iteration starts with "Which sub-task am I on?" If you cannot answer, STOP and re-read Goal Lock.

## Pattern Recognition

After step 6 (VERIFY), ask yourself:

> "Am I repeating a pattern I've seen before?"
> (e.g., pagination, iterating list items, processing table rows, filling repeated form sections)

- **YES, after 2+ iterations of the same pattern:**
  STOP iterating via MCP. Write a TypeScript loop that generalizes the pattern.
  Use data from your 2 iterations as the template (selectors, structure, navigation).
  Move to step 8 (TRANSLATE) with the loop code.
  *(Why 2: First iteration discovers the structure. Second confirms it repeats identically. More iterations waste tokens without new information.)*

- **NO:** Continue to step 8 normally.

This prevents exhaustive exploration of paginated content (50 pages via MCP = 200K+ wasted tokens).

## Observation Strategy

**Primary tool: `browser_snapshot`** (accessibility tree, ~2-5KB)
Use for ALL observation, element identification, and action verification.

**Secondary tool: `browser_take_screenshot`** (~100KB+)
Use ONLY for:
1. **Visual layout** — CSS issues, positioning, charts, images
2. **Debug escalation** — snapshot shows element but action still fails
3. **Final delivery** — one screenshot of the completed result for the user

**Alert mode** — snapshot + screenshot after EVERY action. Triggered when:
- Expected element not found in snapshot
- Any action fails unexpectedly
- Return to snapshot-only after 2 consecutive successes

Save screenshots to `./playwright-screenshots/` with step names: `step_01_navigate.png`, `step_02_fill_login.png`, etc.

## Layered Debug Protocol

When any action fails, use the **minimum investigation needed**. Do NOT run all 5 tools for every failure.

### Quick Check (try this first)

1. **PAUSE** → Stop. Do not retry blindly.
2. **SNAPSHOT** → `browser_snapshot` — is the element present? Wrong state? Hidden?
3. **HYPOTHESIZE** → ONE theory based on the snapshot
4. **FIX** → ONE targeted fix
5. **VERIFY** → `browser_snapshot` to confirm
6. → If fixed: **GOAL CHECK** → resume Development Loop at current sub-task

### Full Investigation (if Quick Check failed)

1. **SCREENSHOT** → `browser_take_screenshot` — visual state
2. **CONSOLE** → `browser_console_messages` — JS errors?
3. **NETWORK** → `browser_network_requests` — failed API calls (4xx/5xx)?
4. **EVALUATE** → `browser_evaluate` — test selector: `document.querySelector('...')`, check `el.disabled`, `el.offsetParent`, shadow roots
5. **HYPOTHESIZE** → ONE theory from all gathered evidence
6. **FIX** → ONE targeted fix
7. **VERIFY** → `browser_snapshot` to confirm
8. → If fixed: **GOAL CHECK** → resume Development Loop at current sub-task

### Fast Escapes (skip hypotheses entirely)

| Symptom | Action |
|---------|--------|
| "Invalid credentials" / 401 / 403 | Ask user for correct credentials immediately |
| CAPTCHA detected | Stop. Show user. Add `readline` prompt to script for human intervention |
| Stale page / expired session | `page.reload()` then retry once |
| Element inside iframe | Use `page.frameLocator(selector)` |
| Element in Shadow DOM | Use `browser_evaluate` with `el.shadowRoot?.querySelector()` |

### Escalation

- After **2 failed Full Investigations** → search Playwright docs autonomously (via context7 or WebSearch)
- After docs search fails → show user the snapshot + all approaches tried, ask for guidance
- Do NOT ask permission to search Playwright documentation — it's a safe action

## Script Template

Every generated script MUST follow this structure:

```typescript
#!/usr/bin/env npx tsx
/**
 * <What this script automates>
 *
 * Usage:
 *   npx tsx <name>.ts [--headed] [--verbose] [--url URL]
 *
 * Environment Variables:
 *   <VAR_NAME>: <purpose>  // TODO: list required env vars
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Configuration ──
const TARGET_URL = '<url>';  // TODO: replace with actual URL
const OUTPUT_PATH = './output.csv';
const TIMEOUT_MS = 30_000;

// ── CLI Args (zero deps) ──
const args = process.argv.slice(2);
const headed = args.includes('--headed');
const verbose = args.includes('--verbose');
const urlArg = args.includes('--url') ? args[args.indexOf('--url') + 1] : undefined;
const targetUrl = urlArg || TARGET_URL;

const log = verbose
  ? (...a: unknown[]) => console.log(new Date().toISOString(), ...a)
  : (..._a: unknown[]) => {};

class AutomationName {  // TODO: rename to descriptive class name
  private browser!: Browser;
  private context!: BrowserContext;
  private page!: Page;

  async setup(): Promise<void> {
    mkdirSync('./playwright-screenshots', { recursive: true });
    mkdirSync('./playwright-scripts', { recursive: true });
    this.browser = await chromium.launch({ headless: !headed });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(TIMEOUT_MS);
  }

  async teardown(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }

  private async retry<T>(action: () => Promise<T>, maxAttempts = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.page.setDefaultTimeout(TIMEOUT_MS * attempt);
        return await action();
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        log(`Attempt ${attempt}/${maxAttempts} failed, retrying...`);
      }
    }
    this.page.setDefaultTimeout(TIMEOUT_MS);
    throw new Error('Unreachable');
  }

  async step01Navigate(): Promise<void> {
    await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    // For dynamic content, add: await this.page.waitForSelector('selector');
  }

  // Add stepNN<Action> methods as you build the script

  async run(): Promise<void> {
    try {
      await this.setup();
      await this.step01Navigate();
      // ... call all steps
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`Automation failed: ${msg}`);
      if (this.page) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        await this.page.screenshot({
          path: `./playwright-screenshots/error_${ts}.png`,
        });
      }
      throw err;
    } finally {
      await this.teardown();
    }
  }
}

const automation = new AutomationName();  // TODO: rename
automation.run().catch(() => process.exit(1));
```

## Quality Checklist

| Requirement | Rule |
|---|---|
| **Selectors** | `getByRole()`, `getByText()`, `getByLabel()`, `getByPlaceholder()` first. CSS/XPath only as fallback. |
| **Waits** | `waitUntil: 'domcontentloaded'` for navigation. `await page.waitForSelector()` or `await expect(locator).toBeVisible()` before interactions on dynamic pages. NEVER raw `setTimeout` or `await new Promise(r => setTimeout(r, ms))`. |
| **Retries** | Wrap flaky interactions in `retry()` method (max 3 attempts, increasing timeout). See template. |
| **Error handling** | `try/catch` — check `error.name === 'TimeoutError'` for Playwright timeouts. Log URL + selector + step name, re-throw with context. |
| **Credentials** | `process.env.VAR` — validate at startup: `if (!process.env.VAR) throw new Error('Missing VAR')`. No defaults. |
| **Logging** | Use the `log()` utility from template. Quiet by default, `--verbose` enables output. Never bare `console.log` in non-verbose mode. |
| **CLI args** | `process.argv.slice(2)` with `--headed`, `--verbose`, `--url`. Zero external deps. |
| **Data output** | Tabular → CSV (`writeFileSync` with manual string building). Nested/hierarchical → JSON (`JSON.stringify`). |
| **Patterns** | Paginated/repeated content → TypeScript loop after 2 MCP iterations. Never visit all pages via MCP. |
| **Data validation** | Assert output is non-empty before writing. Log row count. For CSV: verify header matches expectations. For JSON: validate structure. |
| **Rate limiting** | Add `await page.waitForTimeout(500)` between repeated page loads (pagination, list iteration). Never use raw `setTimeout` — Playwright's wait integrates with its event loop. |

## Edge Cases

| Scenario | Pattern |
|---|---|
| **Multi-tab** | `context.on('page', handler)` to catch new tabs. `context.pages().at(-1)` to switch. |
| **File downloads** | `const [download] = await Promise.all([page.waitForEvent('download'), page.click(selector)])`. `await download.saveAs(path)`. |
| **File uploads** | `await page.setInputFiles(selector, path)` or `await locator.setInputFiles(path)`. |
| **iframes** | `page.frameLocator(selector)` to target iframe content. |
| **Shadow DOM** | `browser_evaluate` with `el.shadowRoot?.querySelector()` to pierce shadow roots. Snapshots cannot see shadow-rooted elements. |
| **SPAs / dynamic content** | Use `waitUntil: 'domcontentloaded'` + `await page.waitForSelector()`. Do NOT rely on `'networkidle'` (hangs on WebSockets, polling, analytics). |
| **CAPTCHAs** | Stop. Show user. Add a `readline` prompt for human intervention + comment in script. |
| **Bot detection** | Set realistic user-agent: `await browser.newContext({ userAgent: '...' })`. Add `--user-agent` CLI arg for configurability. |
| **Output collision** | Log a warning if output file already exists before overwriting. Overwrite is expected — warn, don't crash. |

## Context Budget

Long sessions exhaust the context window, causing drift. Stay lean:

- **Snapshot-first** saves 50-80% of observation tokens vs screenshots
- **Proportional recon** — SKIP tier for simple tasks (1 snapshot, not 5 pages)
- **Pattern Recognition** — generalize after 2 iterations, don't explore all pages
- **Layered Debug** — Quick Check first (1 tool call), not Full Investigation (4 tool calls)
- After 2 debug cycles on the same issue → escalate to user or docs
- If you notice yourself losing track → re-read Goal Lock, summarize progress

**Hard limits:**
- Maximum **5 screenshots** per session (each ~100KB = ~25K tokens)
- Maximum **3 Full Investigation** cycles before escalating to user
- Maximum **15 Development Loop** cycles total. If not done, reassess TASK PLAN scope.
- If **>20 MCP tool calls** without completing a sub-task, something is wrong. STOP and re-read Goal Lock.

## Validation Protocol

After building the script, you MUST:

1. Save to `./playwright-scripts/<descriptive_name>.ts`
2. Create `./playwright-scripts/package.json` if it doesn't exist:
   ```json
   {
     "private": true,
     "type": "module",
     "devDependencies": {
       "playwright": "^1.40.0",
       "tsx": "^4.21.0"
     }
   }
   ```
3. Run: `cd ./playwright-scripts && npm install && npx playwright install chromium` (first time only)
4. Run: `npx tsx ./playwright-scripts/<name>.ts --headed --verbose`
5. If fails → read error, apply Layered Debug to the script (not MCP), re-run (max 3 attempts)
6. If passes → present script to user with: what it does, where it's saved, how to run it, how to install deps

## Red Flags — STOP If You Think This

| Thought | Reality |
|---|---|
| "Playwright is overkill, use axios/cheerio" | User asked for Playwright. Deliver Playwright. |
| "I'll write the whole script first" | Build incrementally via MCP. One action at a time. |
| "A flat async function is simpler" | Use the class template. Always. |
| "Hardcoded fallback is fine for demo sites" | No defaults on credentials. Ever. |
| "I'll save it in the current directory" | `./playwright-scripts/` only. |
| "console.log is good enough" | Use `log()` utility with `--verbose`. |
| "I don't need CLI args for this" | Every script gets `--headed`, `--verbose`, `--url`. |
| "I need to explore more before starting" | Recon is proportional. Default to SKIP. Start working. |
| "Let me just retry with a different selector" | Follow Layered Debug. Quick Check before Full Investigation. |
| "Let me take a screenshot to be sure" | Snapshot first. Screenshots only for 3 specific cases. |
| "I'll visit every page to see the data" | Generalize to a TypeScript loop after 2 iterations. |
| "This is unrelated but interesting" | Re-read Goal Lock. If it's not in TASK PLAN, don't do it. |
| "I should add error handling for edge case X" | Only handle edge cases relevant to DONE WHEN. No speculative code. |

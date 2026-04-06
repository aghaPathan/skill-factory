# playwright-autopilot

> Use when user asks to "automate" a browser task, "write a playwright script", or explicitly mentions playwright automation. Do NOT trigger on general web scraping, testing, or form-filling mentions unless playwright/automation is explicitly referenced. Do NOT trigger on Playwright test writing (use TDD skill instead).

---

# Playwright Autopilot

Autonomously builds production-grade Python Playwright scripts by exploring web pages via MCP browser tools and translating each verified action into code.

## Hard Rules

- **ALWAYS register your goal** (Goal Lock) before any browser action. No exceptions.
- **ALWAYS use Playwright** via MCP browser tools. Never substitute with requests, BeautifulSoup, httpx, or any non-browser approach. The user asked for Playwright — deliver Playwright.
- **ALWAYS use `browser_snapshot`** (accessibility tree) as primary observation. Screenshots only for: visual verification, debug escalation, or final delivery.
- **ALWAYS build the script incrementally** — one MCP action at a time, translating each to Python. Never write the full script upfront.
- **ALWAYS use the class-based template** below. No flat functions, no procedural scripts.
- **ALWAYS save scripts to `./playwright-scripts/`** and screenshots to `./playwright-screenshots/`.
- **NEVER hardcode credentials** — not even as "fallback defaults." Use `os.environ["VAR"]` with no default. Document required env vars in the script docstring.

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

**Choosing a tier:** Default to SKIP. Upgrade to LIGHT if the snapshot reveals complexity you didn't expect. Upgrade to FULL only for multi-page flows with auth or dynamic routing.

## The Development Loop

Follow this loop exactly. Every step has a purpose — do not skip.

```
1. GOAL CHECK  → Re-read Goal Lock. Which sub-task am I on?
2. NAVIGATE    → browser_navigate (skip if already on target page)
3. OBSERVE     → browser_snapshot (primary). Screenshot ONLY if layout matters.
4. IDENTIFY    → From snapshot, find target elements. Prefer: get_by_role > get_by_text > get_by_label > CSS > XPath
5. ACT         → One MCP interaction (click, fill, type, select, etc.)
6. VERIFY      → browser_snapshot to confirm action succeeded
7. PATTERN?    → Am I repeating something I did before? (See Pattern Recognition)
8. TRANSLATE   → Append equivalent Python line(s) to the growing script
9. PROGRESS    → Update TASK PLAN: mark sub-task [x] if done.
               → Is DONE WHEN met? YES → go to VALIDATE. NO → go to step 3.
```

**Step 8 is critical.** After each MCP action, immediately write the Python equivalent. Do not batch.

**Step 9 is the exit gate.** When DONE WHEN is met, STOP and go to VALIDATE. Do not add features the user didn't request.

**Guard conditions:**
- Cannot ACT without OBSERVE (no blind clicking)
- Cannot TRANSLATE without VERIFY (no writing code for unverified actions)
- Cannot skip GOAL CHECK at step 1 of each cycle

## Pattern Recognition

After step 6 (VERIFY), ask yourself:

> "Am I repeating a pattern I've seen before?"
> (e.g., pagination, iterating list items, processing table rows, filling repeated form sections)

- **YES, after 2+ iterations of the same pattern:**
  STOP iterating via MCP. Write a Python loop that generalizes the pattern.
  Use data from your 2 iterations as the template (selectors, structure, navigation).
  Move to step 8 (TRANSLATE) with the loop code.

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
| CAPTCHA detected | Stop. Show user. Add `input("Solve CAPTCHA...")` to script |
| Stale page / expired session | `page.reload()` then retry once |
| Element inside iframe | Use `page.frame_locator(selector)` |
| Element in Shadow DOM | Use `browser_evaluate` with `el.shadowRoot.querySelector()` |

### Escalation

- After **2 failed Full Investigations** → search Playwright docs autonomously (via context7 or WebSearch)
- After docs search fails → show user the snapshot + all approaches tried, ask for guidance
- Do NOT ask permission to search Playwright documentation — it's a safe action

## Script Template

Every generated script MUST follow this structure:

```python
#!/usr/bin/env python3
"""<What this script automates>

Usage:
    python <name>.py [--headed] [--verbose] [--url URL]

Environment Variables:
    <VAR_NAME>: <purpose>  # TODO: list required env vars
"""

import argparse
import logging
import os
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ── Configuration ──
TARGET_URL = "<url>"  # TODO: replace with actual URL
OUTPUT_PATH = "./output.csv"
TIMEOUT_MS = 30000

logger = logging.getLogger(__name__)


class AutomationName:  # TODO: rename to descriptive class name
    """<Description>"""

    def __init__(self, headless: bool = True, timeout: int = TIMEOUT_MS):
        self.headless = headless
        self.timeout = timeout
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    def setup(self):
        """Launch browser and create page context."""
        os.makedirs("./playwright-screenshots", exist_ok=True)
        os.makedirs("./playwright-scripts", exist_ok=True)
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        self.page.set_default_timeout(self.timeout)

    def teardown(self):
        """Close browser and cleanup resources."""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

    def step_01_navigate(self):
        """Navigate to target page."""
        self.page.goto(TARGET_URL, wait_until="domcontentloaded")
        # For dynamic content, add: self.page.wait_for_selector("selector")

    # Add step_NN_<action> methods as you build the script

    def run(self):
        """Execute all steps in sequence."""
        try:
            self.setup()
            self.step_01_navigate()
            # ... call all steps
        except PlaywrightTimeout as e:
            logger.error(f"Timeout at step: {e}")
            self.page.screenshot(path="./playwright-screenshots/error.png")
            raise
        except Exception as e:
            logger.error(f"Automation failed: {e}")
            raise
        finally:
            self.teardown()


def main():
    parser = argparse.ArgumentParser(description="<Description>")
    parser.add_argument("--headed", action="store_true", help="Run with visible browser")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument("--url", default=TARGET_URL, help="Target URL")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    automation = AutomationName(headless=not args.headed)  # TODO: rename
    automation.run()


if __name__ == "__main__":
    main()
```

## Quality Checklist

| Requirement | Rule |
|---|---|
| **Selectors** | `get_by_role()`, `get_by_text()`, `get_by_label()`, `get_by_placeholder()` first. CSS/XPath only as fallback. |
| **Waits** | `wait_until="domcontentloaded"` for navigation. `page.wait_for_selector()` or `expect(locator).to_be_visible()` before interactions on dynamic pages. NEVER `time.sleep()`. |
| **Retries** | Wrap flaky interactions in retry logic (max 3 attempts, increasing timeout). |
| **Error handling** | Catch `PlaywrightTimeout`, log URL + selector + step name, re-raise with context. |
| **Credentials** | `os.environ["VAR"]` — no default values, no fallbacks. Document in docstring. |
| **Logging** | Use `logging` module. Quiet by default, `--verbose` enables DEBUG. Never bare `print()`. |
| **CLI args** | argparse with `--headed`, `--verbose`, `--url`. |
| **Data output** | Tabular → CSV. Nested/hierarchical → JSON. |
| **Patterns** | Paginated/repeated content → Python loop after 2 MCP iterations. Never visit all pages via MCP. |

## Edge Cases

| Scenario | Pattern |
|---|---|
| **Multi-tab** | `context.on("page", handler)` to catch new tabs. `page = context.pages[-1]` to switch. |
| **File downloads** | `accept_downloads=True` on context (set in `setup()`). `download = page.expect_download()` before click. `download.value.save_as(path)`. |
| **File uploads** | `page.set_input_files(selector, path)` or `locator.set_input_files(path)`. |
| **iframes** | `page.frame_locator(selector)` to target iframe content. |
| **Shadow DOM** | `browser_evaluate` with `el.shadowRoot.querySelector()` to pierce shadow roots. Snapshots cannot see shadow-rooted elements. |
| **SPAs / dynamic content** | Use `wait_until="domcontentloaded"` + `page.wait_for_selector()`. Do NOT rely on `networkidle` (hangs on WebSockets, polling, analytics). |
| **CAPTCHAs** | Stop. Show user. `input("Solve CAPTCHA and press Enter...")` + comment in script. |

## Context Budget

Long sessions exhaust the context window, causing drift. Stay lean:

- **Snapshot-first** saves 50-80% of observation tokens vs screenshots
- **Proportional recon** — SKIP tier for simple tasks (1 snapshot, not 5 pages)
- **Pattern Recognition** — generalize after 2 iterations, don't explore all pages
- **Layered Debug** — Quick Check first (1 tool call), not Full Investigation (4 tool calls)
- After 2 debug cycles on the same issue → escalate to user or docs
- If you notice yourself losing track → re-read Goal Lock, summarize progress

## Validation Protocol

After building the script, you MUST:

1. Save to `./playwright-scripts/<descriptive_name>.py`
2. Create output dirs: `mkdir -p ./playwright-scripts ./playwright-screenshots`
3. Run: `python ./playwright-scripts/<name>.py --headed --verbose`
4. If fails → read error, apply Layered Debug to the script (not MCP), re-run (max 3 attempts)
5. If passes → present script to user with: what it does, where it's saved, how to run it

## Red Flags — STOP If You Think This

| Thought | Reality |
|---|---|
| "Playwright is overkill, use requests" | User asked for Playwright. Deliver Playwright. |
| "I'll write the whole script first" | Build incrementally via MCP. One action at a time. |
| "Flat function is simpler" | Use the class template. Always. |
| "Hardcoded fallback is fine for demo sites" | No defaults on credentials. Ever. |
| "I'll save it in the current directory" | `./playwright-scripts/` only. |
| "print() is good enough" | Use `logging` module with `--verbose`. |
| "I don't need argparse for this" | Every script gets `--headed`, `--verbose`, `--url`. |
| "I need to explore more before starting" | Recon is proportional. Default to SKIP. Start working. |
| "Let me just retry with a different selector" | Follow Layered Debug. Quick Check before Full Investigation. |
| "Let me take a screenshot to be sure" | Snapshot first. Screenshots only for 3 specific cases. |
| "I'll visit every page to see the data" | Generalize to a Python loop after 2 iterations. |
| "This is unrelated but interesting" | Re-read Goal Lock. If it's not in TASK PLAN, don't do it. |
| "I should add error handling for edge case X" | Only handle edge cases relevant to DONE WHEN. No speculative code. |

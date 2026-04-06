---
name: playwright-autopilot
description: >-
  Use when user asks to "automate" a browser task, "write a playwright script",
  or explicitly mentions playwright automation. Do NOT trigger on general web
  scraping, testing, or form-filling mentions unless playwright/automation is
  explicitly referenced.
version: 2.0.0
tags:
  - browser
  - automation
  - playwright
  - scraping
  - mcp
platforms:
  - claude-code
  - gemini-cli
  - codex-cli
author: aghaPathan
---

# Playwright Autopilot

Autonomously builds production-grade Python Playwright scripts by exploring web pages via MCP browser tools and translating each action into code.

## Hard Rules

- **ALWAYS use Playwright** via MCP browser tools. Never substitute with requests, BeautifulSoup, httpx, or any non-browser approach. Even for static HTML. The user asked for Playwright automation — deliver Playwright automation.
- **ALWAYS build the script incrementally** — one MCP action at a time, translating each to Python. Never write the full script upfront.
- **ALWAYS use the class-based template** below. No flat functions, no procedural scripts.
- **ALWAYS save scripts to `./playwright-scripts/`** and screenshots to `./playwright-screenshots/`.
- **NEVER hardcode credentials** — not even as "fallback defaults." Use `os.environ["VAR"]` with no default. Document required env vars in the script docstring.

## App Reconnaissance (Phase 0 — Before Automating)

Before writing any automation, map the target application. Do not skip this.

1. **NAVIGATE** → `browser_navigate` to the target URL
2. **SNAPSHOT** → `browser_take_screenshot` + `browser_snapshot` to see initial state
3. **MAP STRUCTURE** → Identify: navigation elements, forms, auth gates, key CTAs
4. **EXPLORE ROUTES** → Follow 3-5 key links to map page hierarchy. For each page:
   - `browser_snapshot` to capture DOM structure
   - `browser_network_requests` to identify API patterns
   - `browser_console_messages` to catch errors/warnings
5. **IDENTIFY AUTH** → If login/auth detected, note it as a prerequisite step
6. **DOCUMENT** → Write a brief mental model comment in your response:
   - Pages discovered and their purpose
   - Authentication requirements
   - Key forms/interactions to automate
   - API patterns observed (REST endpoints, GraphQL, etc.)
   - Any red flags (CAPTCHAs, rate limiting, CSP restrictions)

**Then** proceed to The Development Loop with this understanding.

## The Development Loop

Follow this loop exactly. Do not skip steps.

```
0. RECON       → App Reconnaissance (Phase 0) — map the app first
1. UNDERSTAND  → Parse user instructions into discrete numbered steps
2. NAVIGATE    → browser_navigate to the target URL
3. OBSERVE     → browser_take_screenshot + browser_snapshot
4. IDENTIFY    → Read snapshot, find elements (prefer role/text selectors)
5. ACT         → Use MCP tools to interact (click, fill, type, etc.)
6. VERIFY      → browser_take_screenshot to confirm action succeeded
7. TRANSLATE   → Append equivalent Python line(s) to the growing script
8. REPEAT      → Go to step 3 for the next action
9. VALIDATE    → Save script, run it end-to-end via Bash
10. DELIVER    → Present script to user with summary
```

**Step 7 is critical.** After each MCP action, immediately write the Python equivalent. Do not batch. The script grows line by line as you explore.

## Screenshot Strategy (Adaptive)

**Normal mode** — screenshot after: navigation, form submissions, page transitions.

**Alert mode** — screenshot after EVERY action. Triggered when:
- Expected element not found
- Screenshot shows unexpected content
- Any error occurs

Return to normal after 2 consecutive successful actions.

Save all screenshots to `./playwright-screenshots/` with step-based names: `step_01_navigate.png`, `step_02_fill_login.png`, etc.

## Breakpoint Debug Protocol

When any action fails, follow this systematic investigation. Do NOT retry blindly.

### Investigation Steps (execute in order)

1. **PAUSE** → Stop. Do not retry the failed action.
2. **SCREENSHOT** → `browser_take_screenshot` — capture exact visual state
3. **INSPECT DOM** → `browser_snapshot` — is the target element present? Wrong state? Hidden?
4. **CHECK CONSOLE** → `browser_console_messages` — any JS errors, warnings, or failed assertions?
5. **CHECK NETWORK** → `browser_network_requests` — any failed API calls (4xx/5xx)? Pending requests?
6. **EVALUATE** → `browser_evaluate` to:
   - Test the selector directly: `document.querySelector('...')`
   - Check element state: `el.disabled`, `el.offsetParent` (visibility), `el.getAttribute('aria-hidden')`
   - Inspect page variables or state that might affect the element

### Hypothesis-Fix Cycle

7. **HYPOTHESIZE** → Based on steps 2-6, form ONE specific theory (e.g., "element is inside iframe", "page hasn't finished loading", "modal is blocking")
8. **FIX** → Apply ONE targeted fix based on the hypothesis
9. **VERIFY** → `browser_take_screenshot` + `browser_snapshot` to confirm

### Escalation

- After **3 failed hypotheses** → trigger Web Search Fallback (see below)
- After web search also fails → show screenshot to user, explain what was tried, ask for guidance
- **CAPTCHA** → immediate escalation: stop, show screenshot, ask user. Add `input("Solve CAPTCHA...")` to script.

## Web Search Fallback

When 3 debug hypotheses have failed, external documentation may help.

1. **ASK USER** → "I've tried 3 approaches and none worked. Should I search Playwright documentation for help with [specific issue]?"
2. **If approved** → Search using WebSearch or context7 for:
   - The specific Playwright API or selector strategy
   - Known browser quirks related to the failure
   - Alternative approaches for the interaction type
3. **Apply findings** → Try the documented approach
4. **If still failing** → Show user the screenshot + all attempted approaches, ask for manual guidance

## Script Template (Class-Based)

Every generated script MUST follow this structure:

```python
#!/usr/bin/env python3
"""<What this script automates>

Usage:
    python <name>.py [--headed] [--verbose] [--url URL]

Environment Variables:
    <VAR_NAME>: <purpose>
"""

import argparse
import logging
import os
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ── Configuration ──
TARGET_URL = "<url>"
OUTPUT_PATH = "./output.csv"
TIMEOUT_MS = 30000

logger = logging.getLogger(__name__)


class <AutomationName>:
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
        self.page.goto(TARGET_URL, wait_until="networkidle")

    # Add step_NN_<action> methods as you build the script

    def run(self):
        """Execute all steps in sequence."""
        try:
            self.setup()
            self.step_01_navigate()
            # ... call all steps
        except PlaywrightTimeout as e:
            logger.error(f"Timeout: {e}")
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

    automation = <AutomationName>(headless=not args.headed)
    automation.run()


if __name__ == "__main__":
    main()
```

## Quality Checklist

Apply ALL of these to every generated script:

| Requirement | Rule |
|---|---|
| **Selectors** | `get_by_role()`, `get_by_text()`, `get_by_label()`, `get_by_placeholder()` first. CSS/XPath only as fallback. |
| **Waits** | `wait_until="networkidle"` for navigation. `page.wait_for_selector()` or `expect(locator).to_be_visible()` before interactions. NEVER `time.sleep()`. |
| **Retries** | Wrap flaky interactions in retry logic (max 3 attempts, increasing timeout). |
| **Error handling** | Catch `PlaywrightTimeout`, log URL + selector + step name, re-raise with context. |
| **Credentials** | `os.environ["VAR"]` — no default values, no fallbacks. Document in docstring. |
| **Logging** | Use `logging` module. Quiet by default, `--verbose` enables DEBUG. Never bare `print()`. |
| **CLI args** | argparse with `--headed`, `--verbose`, `--url`. Config section at top for other params with argparse overrides. |
| **Data output** | Tabular → CSV. Nested/hierarchical → JSON. Agent decides by data shape. |

## Edge Cases

| Scenario | Pattern |
|---|---|
| **Multi-tab** | `context.on("page", handler)` to catch new tabs. `page = context.pages[-1]` to switch. |
| **File downloads** | `accept_downloads=True` on context. `download = page.expect_download()` before click. `download.value.save_as(path)`. |
| **File uploads** | `page.set_input_files(selector, path)` or `locator.set_input_files(path)`. |
| **iframes** | `page.frame_locator(selector)` to target iframe content. |
| **CAPTCHAs** | Stop. Show user. `input("Solve CAPTCHA and press Enter...")` + comment in script. |

## Validation Protocol

After building the script, you MUST:

1. Save to `./playwright-scripts/<descriptive_name>.py`
2. Create output dirs: `mkdir -p ./playwright-scripts ./playwright-screenshots`
3. Run: `python ./playwright-scripts/<name>.py --headed --verbose`
4. If fails → read error, fix script, re-run (up to 3 attempts)
5. If passes → tell user what it does and where it's saved

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
| "I'll figure out the page as I go" | Run App Reconnaissance first. Map before you automate. |
| "Let me just retry with a different selector" | Follow Breakpoint Debug Protocol. Investigate before fixing. |
| "I don't need to search docs for this" | After 3 failures, ask user about Web Search Fallback. |

---
name: playwright-autopilot
description: >-
  Use when user asks to "automate" a browser task, "write a playwright script",
  or explicitly mentions playwright automation. Do NOT trigger on general web
  scraping, testing, or form-filling mentions unless playwright/automation is
  explicitly referenced. Do NOT trigger on Playwright test writing (use TDD
  skill instead).
version: 4.0.0
tags:
  - browser
  - automation
  - playwright
  - scraping
  - mcp
  - subagent
  - mentor-consultation
platforms:
  - claude-code
author: aghaPathan
---

# Playwright Autopilot

Dispatcher skill. Your job (as the main thread) is to **mentor** the `domain-playwright-lead` subagent while it builds a production-grade Python Playwright script by driving MCP browser tools one verified action at a time.

You hand the task to the agent, answer its questions, enforce the round-trip ceiling, and present its final script back to the user.

## Platform Support

**Claude Code only (v4.x).**

v4.0.0 dropped `gemini-cli` and `codex-cli` from `platforms:`. The mentor-consultation pattern requires subagent dispatch (project-scoped agents under `.claude/agents/` invoked via the `Agent` tool), which is a Claude Code construct. Other platforms can't spawn the `domain-playwright-lead` agent, so shipping them the dispatcher would be broken-on-arrival.

If you need Gemini CLI or Codex CLI support, pin this skill at tag `v3.1.0` — that release kept everything inline in the skill body and worked on all three platforms. It has no mentor-consultation safety net, so weigh the tradeoff.

## What's New in 4.0

- **`domain-playwright-lead` agent** (`.claude/agents/domain-playwright-lead.md`) owns all MCP browser work, recon, incremental scripting, and layered debug.
- **Mentor consultation protocol.** When the agent hits ambiguity (selector collisions, missing credentials, intent unclear, layout drift, 3 failed debug attempts), it emits a `NEEDS_MENTOR` block and stops. The mentor (you, the main thread) answers from context and respawns it.
- **Deadlock counter owned by the mentor** (not the agent). Hashed on `(checkpoint + blocker_category)`, not raw question text.
- **Explicit ceiling:** max 10 mentor round-trips per session OR 3 deadlocks → `ESCALATE_USER`.
- **Session state** at `.claude/agent-memory/domain-playwright-lead/sessions/<id>/state.json`. Gitignored.
- **Platform scope narrowed** to `claude-code` (see above).

## Hard Rules

- **Always spawn the agent.** Do not drive MCP browser tools yourself from the main thread. Dispatcher only.
- **Always generate a `session_id`** before dispatch (`<yyyymmddHHMMSS>-<short-hash>`) and include it in the agent's prompt.
- **Always auto-answer the agent's questions from the user's stated goal + prior conversation turns when the answer is unambiguous.** Ask the human only when inference would be a guess, or when a deadlock triggers escalation.
- **Never forward secrets into the agent's prompt** unless the user explicitly authorized it for this session. If the agent asks for credentials, ask the user for env-var names, not values.
- **Never bypass the `NEEDS_MENTOR` contract** — do not keep running if the agent returned a consultation block.
- **Always enforce the LIMIT**: 10 round-trips OR 3 deadlocks → escalate to human.

## Goal Lock

The agent owns the Goal Lock (GOAL / TASK PLAN / DONE WHEN). You capture the user's stated goal and target URL in the first dispatch prompt. If the user's request is under-specified (no URL, no concrete outcome), ask one clarifying question to the user **before** spawning the agent. Do not delegate intent-gathering to the agent unless the ambiguity is only discoverable mid-flow.

## Pre-flight

Before the first dispatch:

1. Confirm the trigger is genuine: user said "automate", "write a playwright script", or equivalent — not just "scrape" / "test".
2. Ensure working dirs exist: `mkdir -p ./playwright-scripts ./playwright-screenshots`.
3. Confirm MCP playwright server is connected (tools prefixed `mcp__plugin_playwright_playwright__*` are available at session level).
4. Generate `session_id`.
5. Record session start in a one-line note for yourself: `session <id>, goal=<goal>, url=<url or "ambiguous">`.

## Dispatch

Spawn the agent using Claude Code's subagent-dispatch tool (the same tool invoked as `Task` or `Agent` depending on your Claude Code version — both carry a `subagent_type` parameter). Pass `subagent_type: "domain-playwright-lead"` and a prompt of the form:

```
session_id=<id>
GOAL: <one-sentence user goal>
URL: <target url, or "ambiguous — ask mentor">
ENV NOTES: <any auth / env hints the user provided, or "none">
```

Keep the prompt tight. The agent's body already contains Hard Rules, Goal Lock, Smart Recon, Development Loop, Layered Debug, and Script Quality Standards. You do not restate them.

## Mentor Loop (state machine)

Round-trip budget: **10 per session**. Deadlock budget: **3** (whichever hits first).

Counter lives in your conversation — never in `state.json`.

```
round_trips = 0
deadlocks = 0
last_question_key = null   # (checkpoint, blocker_category)

while true:
    response = dispatch_subagent(subagent_type="domain-playwright-lead", prompt=prompt)
    round_trips += 1
    if round_trips > 10: → ESCALATE_USER (limit)

    parse response:

    case DONE:
        smoke_check(script_path)    # python -m py_compile
        present to user: script path, screenshots, data output, summary
        return

    case ESCALATE_USER:
        surface agent's reason + history + checkpoint to the user verbatim
        return

    case NEEDS_MENTOR:
        key = (response.checkpoint, response.blocker_category)
        if key == last_question_key OR response.deadlock_equivalent_to is set:
            deadlocks += 1
        else:
            deadlocks = 0
        last_question_key = key

        if deadlocks >= 3:
            ask human the question verbatim (with option block + history)
            inject human's answer, reset deadlocks = 0
        else:
            try to auto-answer from (original user goal, prior turns, session notes)
            if confidence is low:
                ask human (counts as fresh resolution, not a deadlock)

        prompt = f"RESUME session {id}. Mentor answer: {answer}. Continue from checkpoint {response.checkpoint}."
        continue
```

Auto-answer heuristic: if the answer is already stated or obviously implied by the user's prior messages, answer silently. If it requires any new information the user hasn't given (new credentials, a specific target among plausible alternatives, a policy decision), ask the human.

## Hand-off

When the agent returns `DONE`:

1. Smoke-check the script: `python -m py_compile <path>` (syntax only, no execution).
2. Skim the script for hardcoded credentials, `time.sleep`, flat-function structure, `print()`. If any appear, return the agent with a `NEEDS_MENTOR`-style correction prompt: `"RESUME session <id>. Code review: <issues>. Fix and return DONE."` (costs a round-trip but is worth it.)
3. Present to the user: what the script does, path, env vars required, run command, where output goes.

## Red Flags — STOP If You Think This

| Thought | Reality |
|---|---|
| "I'll just drive the browser myself, it's faster" | Dispatcher only. The agent's isolation and tool whitelist are features, not overhead. |
| "The agent's question is minor, I'll guess" | Guessing is the exact failure mode the mentor protocol exists to prevent. Answer from evidence or ask the user. |
| "One more round-trip won't hurt" | 10 is the ceiling. Past it, escalate. |
| "Same question again, I'll rephrase the answer" | That's a deadlock. Count it. |
| "I'll pass the password through the prompt" | Env var names only, never values. |
| "The script looks fine, skip the smoke check" | `py_compile` is cheap. Run it. |

## References

- Agent definition: `.claude/agents/domain-playwright-lead.md`
- Session state dir: `.claude/agent-memory/domain-playwright-lead/sessions/<id>/` (gitignored; agent auto-creates)
- Output dirs: `./playwright-scripts/`, `./playwright-screenshots/` (gitignored via `*-scripts/` / `*-screenshots/` patterns)
- Evals: `skills/playwright-autopilot/evals/evals.json`

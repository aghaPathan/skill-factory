# ETHICS.md — Skill Factory Governance

This document defines enforceable rules and advisory principles for AI agents
operating in this repository.

**Two-tier model:**
- Section 1 rules are machine-enforced via `.claude/settings.json` deny rules
  and `.claude/hooks/` scripts. Violations are blocked before execution.
- Section 2 principles require judgment and are NOT enforced programmatically.
  They are guidance, not guarantees.

**Changes to Section 1 require a git commit with human review** — enforced via
the write-protection hook (S1.4). No agent may modify this file without
explicit human approval.

**Sub-agent caveat:** Sub-agents spawned via Claude Code's native task/agent
dispatch inherit project-scoped hooks and deny rules. Agents spawned as external
processes (e.g., Bash `claude` subprocess) do NOT. All orchestration must use
native dispatch, not raw subprocess invocation.

---

## S1 — Hard Rules (Enforced)

### S1.1 No Credentials in Skills

SKILL.md files must never contain hardcoded passwords, API keys, tokens, or
secrets. Use environment variable references (`process.env.X`, `os.getenv()`)
only.

- **Enforcement:** `src/eval-check.ts` line 18-23 — regex check with
  `invertMatch: true` on credential patterns. CI runs `npm run eval-check`
  on every PR.
- **Failure mode:** eval-check exits non-zero → CI blocks merge.

### S1.2 No Destructive Operations

Never run `git push --force`, `git reset --hard`, `git clean -f`,
`git branch -D main/master`, `rm -rf`, or `git checkout -- .`.

- **Enforcement:** `.claude/settings.json` deny list — regex patterns on
  Bash tool input strings.
- **Failure mode:** Claude Code blocks the command before execution.

### S1.3 No Direct Pushes to Main

All changes go through feature branches and pull requests. Never push
directly to main/master.

- **Enforcement:** `.claude/settings.json` deny pattern blocking
  `git push origin main*` and `git push origin master*`.
- **Failure mode:** Claude Code blocks the push before execution.

### S1.4 Protected Governance Files

The following files must not be modified without explicit human approval:
ETHICS.md, CLAUDE.md, CONTRIBUTING.md, `.claude/settings.json`,
`.claude/hooks/**`, `.claude/rules/**`, `.claude/references/**`,
`.claude/agents/**`.

- **Enforcement:** PreToolUse hook on Edit/Write matching protected paths.
  Blocks unless `CLAUDE_APPROVAL_GRANTED=1` is set.
- **Failure mode:** Hook returns block decision with explanation message.

### S1.5 dist/ Freshness

After any edit to `skills/**/*.md` or `src/**`, the build must be re-run
and `dist/` must be committed in sync.

- **Enforcement:** CI `verify-dist` job rebuilds and checks `git diff`.
  PostToolUse hook prints a reminder after relevant edits.
- **Failure mode:** CI blocks merge if dist/ is stale.

---

## S2 — Soft Principles (Advisory, Not Enforced)

These principles require judgment. They are read by agents as guidance but
are NOT code-enforced. Do not mistake them for guarantees.

### S2.1 Minimal Diff Principle

Make the smallest change that achieves the goal. Avoid reformatting,
refactoring, or restructuring unrelated code.

### S2.2 Skill Self-Containment

Skills should not reference external files or depend on repo-specific paths.
Each SKILL.md should be independently useful when copied to dist/.

### S2.3 Test Coverage for Tooling Changes

Changes to `src/` should include or update unit tests. Judgment-based:
log message tweaks do not warrant new tests; new exported functions do.

### S2.4 Preserve Existing Patterns

Follow conventions in CLAUDE.md and CONTRIBUTING.md. When adding a new
platform adapter, follow the existing adapter structure
(`src/platforms/claude-code.ts` as reference).

### S2.5 Transparent Reasoning

Explain architectural decisions in commit messages or PR descriptions.
No silent structural changes.

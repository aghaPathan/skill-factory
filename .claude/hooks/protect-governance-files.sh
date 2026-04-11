#!/usr/bin/env bash
# PreToolUse hook: blocks writes to governance files unless CLAUDE_APPROVAL_GRANTED=1
# Enforces ETHICS.md S1.4 — Protected Governance Files
# Requires: jq (fails open with warning if missing)

INPUT=$(cat)

if ! command -v jq &>/dev/null; then
  echo "WARNING: jq not installed — governance write-protection hook is inactive" >&2
  echo '{"decision":"allow"}'
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '
  .tool_input.file_path //
  .tool_input.filePath //
  .tool_input.path //
  empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

PROTECTED_PATTERNS=(
  "ETHICS.md"
  "CLAUDE.md"
  "CONTRIBUTING.md"
  ".claude/settings.json"
  ".claude/hooks/"
  ".claude/rules/"
  ".claude/references/"
  ".claude/agents/"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    if [[ "${CLAUDE_APPROVAL_GRANTED:-}" != "1" ]]; then
      echo "{\"decision\":\"block\",\"message\":\"Protected governance file: $pattern. Human approval required (ETHICS.md S1.4).\"}"
      exit 0
    fi
  fi
done

echo '{"decision":"allow"}'

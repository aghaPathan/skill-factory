#!/usr/bin/env bash
# PreToolUse hook: blocks writes to governance files unless CLAUDE_APPROVAL_GRANTED=1
# Enforces ETHICS.md S1.4 — Protected Governance Files
# Uses python3 for JSON parsing (jq optional, falls back to python3; hard-fails if neither available)

INPUT=$(cat)

parse_field() {
  local payload="$1"
  if command -v jq &>/dev/null; then
    echo "$payload" | jq -r '.tool_input.file_path // .tool_input.filePath // .tool_input.path // empty' 2>/dev/null
  elif command -v python3 &>/dev/null; then
    echo "$payload" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin).get("tool_input",{}) or {}
    print(d.get("file_path") or d.get("filePath") or d.get("path") or "")
except Exception:
    pass' 2>/dev/null
  else
    return 1
  fi
}

FILE_PATH=$(parse_field "$INPUT") || {
  echo "ERROR: governance hook requires jq or python3 — neither found. Install one to re-enable ETHICS.md S1.4 enforcement." >&2
  echo '{"decision":"block","message":"Governance hook cannot parse input: install jq or python3."}'
  exit 0
}

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

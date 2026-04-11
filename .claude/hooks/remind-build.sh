#!/usr/bin/env bash
# PostToolUse hook: reminds to rebuild dist/ after editing skills or source
# Enforces ETHICS.md S1.5 — dist/ Freshness

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '
  .tool_input.file_path //
  .tool_input.filePath //
  empty' 2>/dev/null)

if [[ "$FILE_PATH" == *"skills/"*".md" ]] || [[ "$FILE_PATH" == *"src/"*".ts" ]]; then
  echo "Reminder: Run 'npm run build' to regenerate dist/ and update README catalog."
fi

# Append to docs-keeper pending-review if doc-tracked surface changed
TRACKED_PATTERNS=("src/platforms/base.ts" "src/platforms/index.ts" "package.json" "skills/")
for pattern in "${TRACKED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    PENDING=".claude/agent-memory/docs-keeper/pending-review.md"
    if [ -d "$(dirname "$PENDING")" ]; then
      echo "- $(date -Iseconds) $FILE_PATH" >> "$PENDING"
    fi
    break
  fi
done

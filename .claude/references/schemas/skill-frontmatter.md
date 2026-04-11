# SkillFrontmatter Field Specification

Extracted from `src/platforms/base.ts` — the `SkillFrontmatter` interface.

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Skill identifier (lowercase-hyphen, e.g., `playwright-autopilot`) |
| `description` | `string` | Activation criteria — when this skill should trigger |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Semver version (e.g., `1.0.0`) |
| `tags` | `string[]` | Catalog filtering tags (e.g., `["browser", "automation"]`) |
| `platforms` | `string[]` | Target platforms: `claude-code`, `gemini-cli`, `codex-cli` |
| `author` | `string` | Contributor attribution (GitHub username) |

## Extension

The interface includes `[key: string]: unknown` — additional fields are
allowed but not processed by the build pipeline. Platform adapters may
strip unknown fields (e.g., GeminiCliAdapter keeps only name + description).

## Validation

- `src/validate.ts` `validateFrontmatter()` checks required fields are non-empty
- `src/validate.ts` `checkPlatformCompatibility()` warns on unknown platforms and platform-specific MCP tool references
- `src/build.ts` additionally checks: array types for `tags`/`platforms`, non-empty body, duplicate skill names (case-insensitive)

## Source of Truth

`src/platforms/base.ts` lines 1-9 — the `SkillFrontmatter` interface definition.
If this reference document conflicts with the code, the code is authoritative.

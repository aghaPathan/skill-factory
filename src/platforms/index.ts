import type { PlatformAdapter } from "./base.js";
import { ClaudeCodeAdapter } from "./claude-code.js";
import { GeminiCliAdapter } from "./gemini-cli.js";
import { CodexCliAdapter } from "./codex-cli.js";

export const PLATFORMS: readonly PlatformAdapter[] = [
  new ClaudeCodeAdapter(),
  new GeminiCliAdapter(),
  new CodexCliAdapter(),
];

export { ClaudeCodeAdapter, GeminiCliAdapter, CodexCliAdapter };
export type { PlatformAdapter, ParsedSkill, OutputFile, SkillFrontmatter } from "./base.js";

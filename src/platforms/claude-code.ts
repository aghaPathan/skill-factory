import type { PlatformAdapter, ParsedSkill, OutputFile } from "./base.js";
import matter from "gray-matter";

export class ClaudeCodeAdapter implements PlatformAdapter {
  readonly platformId = "claude-code";
  readonly displayName = "Claude Code";
  readonly installPath = "~/.claude/skills/";

  transform(skill: ParsedSkill): OutputFile[] {
    const content = matter.stringify(skill.body, skill.frontmatter);
    return [
      {
        relativePath: `${skill.skillName}/SKILL.md`,
        content,
      },
    ];
  }
}

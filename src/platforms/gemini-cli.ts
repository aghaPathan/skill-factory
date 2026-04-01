import type { PlatformAdapter, ParsedSkill, OutputFile } from "./base.js";
import matter from "gray-matter";

export class GeminiCliAdapter implements PlatformAdapter {
  readonly platformId = "gemini-cli";
  readonly displayName = "Gemini CLI";
  readonly installPath = "~/.gemini/skills/";

  transform(skill: ParsedSkill): OutputFile[] {
    const geminiMatter: Record<string, unknown> = {
      name: skill.frontmatter.name,
      description: skill.frontmatter.description,
    };

    const content = matter.stringify(skill.body, geminiMatter);
    return [
      {
        relativePath: `${skill.skillName}/SKILL.md`,
        content,
      },
    ];
  }
}

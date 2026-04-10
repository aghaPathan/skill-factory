import type { PlatformAdapter, ParsedSkill, OutputFile } from "./base.js";

export class CodexCliAdapter implements PlatformAdapter {
  readonly platformId = "codex-cli";
  readonly displayName = "Codex CLI";
  readonly installPath = "project root or ~/.codex/";

  transform(skill: ParsedSkill): OutputFile[] {
    const safeName = String(skill.frontmatter.name).replace(/^#+\s*/, "").trim();
    const header = [
      `# ${safeName}`,
      "",
      ...String(skill.frontmatter.description).split("\n").map((l) => `> ${l}`),
      "",
      "---",
      "",
    ].join("\n");

    const content = header + skill.body;

    return [
      {
        relativePath: `${skill.skillName}/AGENTS.md`,
        content,
      },
    ];
  }
}

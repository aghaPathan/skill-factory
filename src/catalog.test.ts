import { describe, it, expect } from "vitest";
import type { ParsedSkill } from "./platforms/base.js";
import { generateCatalogFromSkills } from "./catalog.js";

const SKILLS: ParsedSkill[] = [
  {
    frontmatter: {
      name: "beta-skill",
      description: "Second skill",
      tags: ["b"],
      platforms: ["claude-code"],
    },
    body: "\n# Beta\n",
    sourcePath: "skills/beta-skill/SKILL.md",
    skillName: "beta-skill",
  },
  {
    frontmatter: {
      name: "alpha-skill",
      description: "First skill",
      tags: ["a", "common"],
      platforms: ["claude-code", "gemini-cli"],
    },
    body: "\n# Alpha\n",
    sourcePath: "skills/alpha-skill/SKILL.md",
    skillName: "alpha-skill",
  },
];

describe("generateCatalogFromSkills", () => {
  it("returns a markdown table", () => {
    const catalog = generateCatalogFromSkills(SKILLS);
    expect(catalog).toContain("| Skill |");
    expect(catalog).toContain("|-------|");
  });

  it("sorts skills alphabetically", () => {
    const catalog = generateCatalogFromSkills(SKILLS);
    const alphaIdx = catalog.indexOf("alpha-skill");
    const betaIdx = catalog.indexOf("beta-skill");
    expect(alphaIdx).toBeLessThan(betaIdx);
  });

  it("links to skill source", () => {
    const catalog = generateCatalogFromSkills(SKILLS);
    expect(catalog).toContain("[alpha-skill](skills/alpha-skill/SKILL.md)");
  });

  it("renders tags as inline code", () => {
    const catalog = generateCatalogFromSkills(SKILLS);
    expect(catalog).toContain("`a`");
    expect(catalog).toContain("`common`");
  });

  it("escapes pipe characters in description", () => {
    const skills: ParsedSkill[] = [
      {
        frontmatter: { name: "pipe-skill", description: "A | B" },
        body: "\n# Pipe\n",
        sourcePath: "skills/pipe-skill/SKILL.md",
        skillName: "pipe-skill",
      },
    ];
    const catalog = generateCatalogFromSkills(skills);
    expect(catalog).toContain("A \\| B");
  });
});

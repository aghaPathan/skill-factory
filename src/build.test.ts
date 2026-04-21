import { describe, it, expect } from "vitest";
import { shouldEmitForPlatform } from "./build.js";
import type { ParsedSkill } from "./platforms/base.js";

function mkSkill(platforms: unknown): ParsedSkill {
  return {
    frontmatter: {
      name: "fixture",
      description: "fixture",
      ...(platforms === undefined ? {} : { platforms: platforms as string[] }),
    },
    body: "# fixture",
    sourcePath: "skills/fixture/SKILL.md",
    skillName: "fixture",
  };
}

describe("shouldEmitForPlatform", () => {
  it("emits to all platforms when platforms field is omitted", () => {
    const skill = mkSkill(undefined);
    expect(shouldEmitForPlatform(skill, "claude-code")).toBe(true);
    expect(shouldEmitForPlatform(skill, "gemini-cli")).toBe(true);
    expect(shouldEmitForPlatform(skill, "codex-cli")).toBe(true);
  });

  it("emits only to listed platforms when platforms field is set", () => {
    const skill = mkSkill(["claude-code"]);
    expect(shouldEmitForPlatform(skill, "claude-code")).toBe(true);
    expect(shouldEmitForPlatform(skill, "gemini-cli")).toBe(false);
    expect(shouldEmitForPlatform(skill, "codex-cli")).toBe(false);
  });

  it("emits to none when platforms is an empty array (explicit opt-out)", () => {
    const skill = mkSkill([]);
    expect(shouldEmitForPlatform(skill, "claude-code")).toBe(false);
    expect(shouldEmitForPlatform(skill, "gemini-cli")).toBe(false);
  });

  it("emits to a subset when multiple platforms are listed", () => {
    const skill = mkSkill(["claude-code", "gemini-cli"]);
    expect(shouldEmitForPlatform(skill, "claude-code")).toBe(true);
    expect(shouldEmitForPlatform(skill, "gemini-cli")).toBe(true);
    expect(shouldEmitForPlatform(skill, "codex-cli")).toBe(false);
  });

  it("silently drops unknown platform ids (validate layer handles warnings)", () => {
    const skill = mkSkill(["claude-code"]);
    expect(shouldEmitForPlatform(skill, "unknown-platform")).toBe(false);
  });
});

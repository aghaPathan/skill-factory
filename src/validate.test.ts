import { describe, it, expect } from "vitest";
import { validateFrontmatter, checkPlatformCompatibility } from "./validate.js";

describe("validateFrontmatter", () => {
  it("passes with all required fields", () => {
    const result = validateFrontmatter(
      { name: "my-skill", description: "Does things" },
      "my-skill"
    );
    expect(result.errors).toHaveLength(0);
  });

  it("errors on missing name", () => {
    const result = validateFrontmatter(
      { description: "Does things" },
      "my-skill"
    );
    expect(result.errors).toContain("Missing required field 'name'");
  });

  it("errors on missing description", () => {
    const result = validateFrontmatter({ name: "my-skill" }, "my-skill");
    expect(result.errors).toContain("Missing required field 'description'");
  });

  it("errors on empty string name", () => {
    const result = validateFrontmatter(
      { name: "  ", description: "Does things" },
      "my-skill"
    );
    expect(result.errors).toContain("Missing required field 'name'");
  });

  it("warns on missing optional fields", () => {
    const result = validateFrontmatter(
      { name: "my-skill", description: "Does things" },
      "my-skill"
    );
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings).toContain("Missing optional field 'version'");
  });

  it("no warnings when all fields present", () => {
    const result = validateFrontmatter(
      {
        name: "my-skill",
        description: "Does things",
        version: "1.0.0",
        tags: ["a"],
        platforms: ["claude-code"],
        author: "me",
      },
      "my-skill"
    );
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

describe("checkPlatformCompatibility", () => {
  it("warns on unknown platform", () => {
    const warnings = checkPlatformCompatibility("# Skill", ["claude-code", "unknown-platform"]);
    expect(warnings.some((w) => w.includes("Unknown platform"))).toBe(true);
  });

  it("warns when MCP tools target non-Claude platforms", () => {
    const body = "Use browser_snapshot to observe the page";
    const warnings = checkPlatformCompatibility(body, ["claude-code", "gemini-cli", "codex-cli"]);
    expect(warnings.some((w) => w.includes("Playwright MCP tools"))).toBe(true);
  });

  it("no warnings when MCP tools target only Claude Code", () => {
    const body = "Use browser_snapshot to observe the page";
    const warnings = checkPlatformCompatibility(body, ["claude-code"]);
    expect(warnings).toHaveLength(0);
  });

  it("no warnings for generic content", () => {
    const body = "# My Skill\n\nGeneric instructions here.";
    const warnings = checkPlatformCompatibility(body, ["claude-code", "gemini-cli"]);
    expect(warnings).toHaveLength(0);
  });
});

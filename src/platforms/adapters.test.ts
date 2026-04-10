import { describe, it, expect } from "vitest";
import { ClaudeCodeAdapter } from "./claude-code.js";
import { GeminiCliAdapter } from "./gemini-cli.js";
import { CodexCliAdapter } from "./codex-cli.js";
import type { ParsedSkill } from "./base.js";

const MOCK_SKILL: ParsedSkill = {
  frontmatter: {
    name: "test-skill",
    description: "A test skill",
    version: "1.0.0",
    tags: ["test", "example"],
    platforms: ["claude-code", "gemini-cli", "codex-cli"],
    author: "tester",
  },
  body: "\n# Test Skill\n\nSome instructions.\n",
  sourcePath: "skills/test-skill/SKILL.md",
  skillName: "test-skill",
};

describe("ClaudeCodeAdapter", () => {
  const adapter = new ClaudeCodeAdapter();

  it("has correct platform metadata", () => {
    expect(adapter.platformId).toBe("claude-code");
    expect(adapter.displayName).toBe("Claude Code");
  });

  it("outputs to <skillName>/SKILL.md", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].relativePath).toBe("test-skill/SKILL.md");
  });

  it("preserves all frontmatter fields", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    const content = outputs[0].content;
    expect(content).toContain("name: test-skill");
    expect(content).toContain("version: 1.0.0");
    expect(content).toContain("author: tester");
    expect(content).toContain("# Test Skill");
  });
});

describe("GeminiCliAdapter", () => {
  const adapter = new GeminiCliAdapter();

  it("has correct platform metadata", () => {
    expect(adapter.platformId).toBe("gemini-cli");
    expect(adapter.displayName).toBe("Gemini CLI");
  });

  it("outputs to <skillName>/SKILL.md", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].relativePath).toBe("test-skill/SKILL.md");
  });

  it("keeps only name and description in frontmatter", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    const content = outputs[0].content;
    expect(content).toContain("name: test-skill");
    expect(content).toContain("description: A test skill");
    expect(content).not.toContain("version:");
    expect(content).not.toContain("author:");
    expect(content).not.toContain("tags:");
  });

  it("preserves body content", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    expect(outputs[0].content).toContain("# Test Skill");
  });
});

describe("CodexCliAdapter", () => {
  const adapter = new CodexCliAdapter();

  it("has correct platform metadata", () => {
    expect(adapter.platformId).toBe("codex-cli");
    expect(adapter.displayName).toBe("Codex CLI");
  });

  it("outputs to <skillName>/AGENTS.md", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].relativePath).toBe("test-skill/AGENTS.md");
  });

  it("converts frontmatter to markdown header with description blockquote", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    const content = outputs[0].content;
    expect(content).toMatch(/^# test-skill/);
    expect(content).toContain("> A test skill");
    expect(content).toContain("---");
  });

  it("strips YAML frontmatter entirely", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    const content = outputs[0].content;
    expect(content).not.toContain("name:");
    expect(content).not.toContain("version:");
  });

  it("preserves body content after header", () => {
    const outputs = adapter.transform(MOCK_SKILL);
    expect(outputs[0].content).toContain("# Test Skill");
    expect(outputs[0].content).toContain("Some instructions.");
  });
});

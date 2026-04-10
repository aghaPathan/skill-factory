import { glob } from "glob";
import matter from "gray-matter";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { basename, dirname } from "path";
import type { ParsedSkill } from "./platforms/base.js";

const README_PATH = "README.md";
const START_MARKER = "<!-- CATALOG:START -->";
const END_MARKER = "<!-- CATALOG:END -->";

function generateCatalogFromSkills(skills: ParsedSkill[]): string {
  const sorted = [...skills].sort((a, b) => a.skillName.localeCompare(b.skillName));

  const rows: string[] = [];
  rows.push("| Skill | Description | Platforms | Tags |");
  rows.push("|-------|-------------|-----------|------|");

  const escapePipe = (s: string) => s.replace(/\|/g, "\\|");

  for (const skill of sorted) {
    const { skillName, frontmatter } = skill;
    const description = escapePipe(String(frontmatter.description || "No description").replace(/\n/g, " "));
    const platforms = (frontmatter.platforms || ["claude-code"]).join(", ");
    const tags = (frontmatter.tags || []).map((t: string) => `\`${escapePipe(String(t))}\``).join(" ");

    rows.push(
      `| [${skillName}](skills/${skillName}/SKILL.md) | ${description} | ${platforms} | ${tags} |`
    );
  }

  return rows.join("\n");
}

async function generateCatalogFromDisk(): Promise<string> {
  const skillFiles = await glob("skills/*/SKILL.md");
  skillFiles.sort();

  const rows: string[] = [];
  rows.push("| Skill | Description | Platforms | Tags |");
  rows.push("|-------|-------------|-----------|------|");

  const escapePipe = (s: string) => s.replace(/\|/g, "\\|");

  for (const filePath of skillFiles) {
    const skillName = basename(dirname(filePath));
    let data: Record<string, unknown>;
    try {
      const raw = readFileSync(filePath, "utf-8");
      ({ data } = matter(raw));
    } catch (e) {
      console.warn(`WARN: Failed to read ${filePath}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const description = escapePipe(String(data.description || "No description").replace(/\n/g, " "));
    const platforms = (Array.isArray(data.platforms) ? data.platforms : ["claude-code"]).join(", ");
    const tags = (Array.isArray(data.tags) ? data.tags : []).map((t: string) => `\`${escapePipe(String(t))}\``).join(" ");

    rows.push(
      `| [${skillName}](skills/${skillName}/SKILL.md) | ${description} | ${platforms} | ${tags} |`
    );
  }

  return rows.join("\n");
}

export async function injectCatalog(skills?: ParsedSkill[]): Promise<void> {
  if (!existsSync(README_PATH)) {
    console.warn("WARN: README.md not found — skipping catalog injection");
    return;
  }

  const readme = readFileSync(README_PATH, "utf-8");
  const catalog = skills ? generateCatalogFromSkills(skills) : await generateCatalogFromDisk();

  const startIdx = readme.indexOf(START_MARKER);
  const endIdx = readme.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    console.warn("WARN: Catalog markers not found in README.md — skipping catalog injection");
    return;
  }

  if (endIdx <= startIdx + START_MARKER.length) {
    console.error("ERROR: CATALOG:END marker appears before CATALOG:START — skipping to avoid corruption");
    return;
  }

  const before = readme.substring(0, startIdx + START_MARKER.length);
  const after = readme.substring(endIdx);
  const updated = `${before}\n${catalog}\n${after}`;

  writeFileSync(README_PATH, updated, "utf-8");
  console.log("Catalog injected into README.md");
}

// Run standalone
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  injectCatalog().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

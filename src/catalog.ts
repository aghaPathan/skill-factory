import { glob } from "glob";
import matter from "gray-matter";
import { readFileSync, writeFileSync } from "fs";
import { basename, dirname } from "path";

const README_PATH = "README.md";
const START_MARKER = "<!-- CATALOG:START -->";
const END_MARKER = "<!-- CATALOG:END -->";

export async function generateCatalog(): Promise<string> {
  const skillFiles = await glob("skills/*/SKILL.md");
  skillFiles.sort();

  const rows: string[] = [];
  rows.push("| Skill | Description | Platforms | Tags |");
  rows.push("|-------|-------------|-----------|------|");

  for (const filePath of skillFiles) {
    const skillName = basename(dirname(filePath));
    const raw = readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    const escapePipe = (s: string) => s.replace(/\|/g, "\\|");
    const description = escapePipe(String(data.description || "No description"));
    const platforms = (data.platforms as string[] || ["claude-code"]).join(", ");
    const tags = (data.tags as string[] || []).map((t: string) => `\`${escapePipe(String(t))}\``).join(" ");

    rows.push(
      `| [${skillName}](skills/${skillName}/SKILL.md) | ${description} | ${platforms} | ${tags} |`
    );
  }

  return rows.join("\n");
}

export async function injectCatalog(): Promise<void> {
  const readme = readFileSync(README_PATH, "utf-8");
  const catalog = await generateCatalog();

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
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/^\.\//, ""));
if (isMain) {
  injectCatalog();
}

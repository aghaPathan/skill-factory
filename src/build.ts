import { glob } from "glob";
import matter from "gray-matter";
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, existsSync } from "fs";
import { basename, dirname, join } from "path";
import type { ParsedSkill } from "./platforms/base.js";
import { PLATFORMS } from "./platforms/index.js";
import { injectCatalog } from "./catalog.js";

const DIST_DIR = "dist";
const SKILLS_DIR = "skills";

/**
 * Decide whether a skill should be emitted for a given platform.
 * - No `platforms:` field → emit everywhere (backwards compatible default).
 * - Non-empty array → emit only to listed platforms.
 * - Empty array → emit nowhere (treated as explicit opt-out).
 */
export function shouldEmitForPlatform(
  skill: ParsedSkill,
  platformId: string
): boolean {
  const declared = skill.frontmatter.platforms;
  if (!Array.isArray(declared)) return true;
  return declared.includes(platformId);
}

async function build(): Promise<void> {
  // 1. Discover skills
  const skillFiles = await glob(`${SKILLS_DIR}/*/SKILL.md`);

  if (skillFiles.length === 0) {
    console.error("No skills found");
    process.exit(1);
  }

  console.log(`Found ${skillFiles.length} skill(s)\n`);

  // 2. Parse and validate skills
  const skills: ParsedSkill[] = [];
  const parseErrors: string[] = [];
  const seenNames = new Set<string>();

  for (const filePath of skillFiles) {
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const skillName = basename(dirname(filePath));

      // Duplicate detection (case-insensitive for macOS/Windows)
      const normalizedName = skillName.toLowerCase();
      if (seenNames.has(normalizedName)) {
        parseErrors.push(`${filePath}: duplicate skill name '${skillName}' (case-insensitive collision)`);
        continue;
      }
      seenNames.add(normalizedName);

      // Required field validation
      if (!data.name || String(data.name).trim() === "") {
        parseErrors.push(`${filePath}: missing required field 'name'`);
        continue;
      }
      if (!data.description || String(data.description).trim() === "") {
        parseErrors.push(`${filePath}: missing required field 'description'`);
        continue;
      }

      // Array field type validation
      if (data.tags != null && !Array.isArray(data.tags)) {
        parseErrors.push(`${filePath}: 'tags' must be an array, got ${typeof data.tags}`);
        continue;
      }
      if (data.platforms != null && !Array.isArray(data.platforms)) {
        parseErrors.push(`${filePath}: 'platforms' must be an array, got ${typeof data.platforms}`);
        continue;
      }

      // Empty body check
      if (content.trim() === "") {
        parseErrors.push(`${filePath}: SKILL.md has no body content`);
        continue;
      }

      skills.push({
        frontmatter: data as ParsedSkill["frontmatter"],
        body: content,
        sourcePath: filePath,
        skillName,
      });
    } catch (e) {
      parseErrors.push(`${filePath}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (parseErrors.length > 0) {
    console.error("Failed to parse skill files:");
    parseErrors.forEach((err) => console.error(`  ${err}`));
    process.exit(1);
  }

  // 3. Build into temp directory for atomic swap
  const TEMP_DIR = `${DIST_DIR}.tmp`;
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
  }

  // 4. Run each platform adapter (writes to temp dir)
  let totalFiles = 0;

  for (const platform of PLATFORMS) {
    console.log(`Platform: ${platform.displayName}`);

    for (const skill of skills) {
      if (!shouldEmitForPlatform(skill, platform.platformId)) {
        console.log(`  skip: ${skill.skillName} (not targeted)`);
        continue;
      }
      const outputs = platform.transform(skill);

      for (const output of outputs) {
        const outPath = join(TEMP_DIR, platform.platformId, output.relativePath);
        const outDir = dirname(outPath);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(outPath, output.content, "utf-8");
        console.log(`  wrote: ${output.relativePath}`);
        totalFiles++;
      }
    }
  }

  // Atomic swap: replace dist/ with completed build
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true });
  }
  renameSync(TEMP_DIR, DIST_DIR);

  // 5. Regenerate README catalog (pass parsed skills to avoid double-read)
  await injectCatalog(skills);

  console.log(
    `\nBuild complete: ${skills.length} skill(s) x ${PLATFORMS.length} platform(s) = ${totalFiles} file(s)`
  );
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

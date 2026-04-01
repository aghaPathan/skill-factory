import { glob } from "glob";
import matter from "gray-matter";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { basename, dirname, join } from "path";
import type { ParsedSkill } from "./platforms/base.js";
import { PLATFORMS } from "./platforms/index.js";

const DIST_DIR = "dist";
const SKILLS_DIR = "skills";

async function build(): Promise<void> {
  // 1. Discover skills
  const skillFiles = await glob(`${SKILLS_DIR}/*/SKILL.md`);

  if (skillFiles.length === 0) {
    console.error("No skills found");
    process.exit(1);
  }

  console.log(`Found ${skillFiles.length} skill(s)\n`);

  // 2. Parse skills
  const skills: ParsedSkill[] = skillFiles.map((filePath) => {
    const raw = readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const skillName = basename(dirname(filePath));
    return {
      frontmatter: data as ParsedSkill["frontmatter"],
      body: content,
      sourcePath: filePath,
      skillName,
    };
  });

  // 3. Clean and rebuild dist/
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true });
  }

  // 4. Run each platform adapter
  let totalFiles = 0;

  for (const platform of PLATFORMS) {
    console.log(`Platform: ${platform.displayName}`);

    for (const skill of skills) {
      const outputs = platform.transform(skill);

      for (const output of outputs) {
        const outPath = join(DIST_DIR, platform.platformId, output.relativePath);
        const outDir = dirname(outPath);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(outPath, output.content, "utf-8");
        console.log(`  wrote: ${outPath}`);
        totalFiles++;
      }
    }
  }

  console.log(
    `\nBuild complete: ${skills.length} skill(s) x ${PLATFORMS.length} platform(s) = ${totalFiles} file(s)`
  );
}

build();

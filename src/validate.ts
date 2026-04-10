import { glob } from "glob";
import matter from "gray-matter";
import { readFileSync } from "fs";
import { basename, dirname } from "path";

const REQUIRED_FIELDS = ["name", "description"];
const OPTIONAL_FIELDS = ["version", "tags", "platforms", "author"];

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateFrontmatter(
  data: Record<string, unknown>,
  skillName: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (data[field] == null || String(data[field]).trim() === "") {
      errors.push(`Missing required field '${field}'`);
    }
  }

  for (const field of OPTIONAL_FIELDS) {
    if (data[field] == null || String(data[field]).trim() === "") {
      warnings.push(`Missing optional field '${field}'`);
    }
  }

  return { errors, warnings };
}

const KNOWN_PLATFORMS = ["claude-code", "gemini-cli", "codex-cli"];

const PLATFORM_SPECIFIC_PATTERNS: { pattern: RegExp; platforms: string[]; label: string }[] = [
  {
    pattern: /browser_snapshot|browser_navigate|browser_click|browser_take_screenshot/,
    platforms: ["claude-code"],
    label: "Playwright MCP tools (browser_*)",
  },
];

export function checkPlatformCompatibility(
  body: string,
  declaredPlatforms: string[]
): string[] {
  const warnings: string[] = [];

  for (const p of declaredPlatforms) {
    if (!KNOWN_PLATFORMS.includes(p)) {
      warnings.push(`Unknown platform '${p}' — known platforms: ${KNOWN_PLATFORMS.join(", ")}`);
    }
  }

  for (const { pattern, platforms, label } of PLATFORM_SPECIFIC_PATTERNS) {
    if (pattern.test(body)) {
      const unsupported = declaredPlatforms.filter((p) => !platforms.includes(p));
      if (unsupported.length > 0) {
        warnings.push(
          `References ${label} but targets ${unsupported.join(", ")} — these platforms may not support these tools`
        );
      }
    }
  }

  return warnings;
}

async function validate(): Promise<void> {
  const skillFiles = await glob("skills/*/SKILL.md");

  if (skillFiles.length === 0) {
    console.error("No skills found in skills/*/SKILL.md");
    process.exit(1);
  }

  let hasErrors = false;

  for (const filePath of skillFiles) {
    const skillName = basename(dirname(filePath));

    let data: Record<string, unknown>;
    let content: string;
    try {
      const raw = readFileSync(filePath, "utf-8");
      ({ data, content } = matter(raw));
    } catch (e) {
      console.error(`\nValidating: ${skillName}`);
      console.error(`  ERROR: Failed to read/parse: ${e instanceof Error ? e.message : String(e)}`);
      hasErrors = true;
      continue;
    }

    console.log(`\nValidating: ${skillName}`);

    const result = validateFrontmatter(data, skillName);

    for (const field of REQUIRED_FIELDS) {
      if (result.errors.some((err) => err.includes(`'${field}'`))) {
        console.error(`  ERROR: Missing required field '${field}'`);
        hasErrors = true;
      } else {
        console.log(`  OK: ${field} = "${data[field]}"`);
      }
    }

    for (const field of OPTIONAL_FIELDS) {
      if (result.warnings.some((warn) => warn.includes(`'${field}'`))) {
        console.warn(`  WARN: Missing optional field '${field}'`);
      } else {
        console.log(`  OK: ${field} = ${JSON.stringify(data[field])}`);
      }
    }

    const platformWarnings = checkPlatformCompatibility(content, Array.isArray(data.platforms) ? data.platforms : []);
    for (const w of platformWarnings) {
      console.warn(`  PLATFORM: ${w}`);
    }
  }

  if (hasErrors) {
    console.error("\nValidation FAILED");
    process.exit(1);
  }

  console.log(`\nValidation PASSED (${skillFiles.length} skill(s))`);
}

validate().catch((e) => {
  console.error(e);
  process.exit(1);
});

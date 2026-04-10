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
    try {
      const raw = readFileSync(filePath, "utf-8");
      ({ data } = matter(raw));
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

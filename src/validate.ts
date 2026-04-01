import { glob } from "glob";
import matter from "gray-matter";
import { readFileSync } from "fs";
import { basename, dirname } from "path";

const REQUIRED_FIELDS = ["name", "description"];
const OPTIONAL_FIELDS = ["version", "tags", "platforms", "author"];

async function validate(): Promise<void> {
  const skillFiles = await glob("skills/*/SKILL.md");

  if (skillFiles.length === 0) {
    console.error("No skills found in skills/*/SKILL.md");
    process.exit(1);
  }

  let hasErrors = false;

  for (const filePath of skillFiles) {
    const skillName = basename(dirname(filePath));
    const raw = readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    console.log(`\nValidating: ${skillName}`);

    for (const field of REQUIRED_FIELDS) {
      if (data[field] == null || String(data[field]).trim() === "") {
        console.error(`  ERROR: Missing required field '${field}'`);
        hasErrors = true;
      } else {
        console.log(`  OK: ${field} = "${data[field]}"`);
      }
    }

    for (const field of OPTIONAL_FIELDS) {
      if (data[field] == null || String(data[field]).trim() === "") {
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

validate();

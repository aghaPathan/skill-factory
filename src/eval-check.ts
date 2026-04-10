import { glob } from "glob";
import { readFileSync } from "fs";
import { basename, dirname } from "path";
import matter from "gray-matter";

interface StructuralCheck {
  name: string;
  pattern: RegExp;
  severity: "error" | "warn";
  invertMatch?: boolean;
}

const CHECKS: StructuralCheck[] = [
  { name: "has H1 heading", pattern: /^# .+/m, severity: "error" },
  { name: "has Hard Rules section", pattern: /## Hard Rules/i, severity: "warn" },
  { name: "has Goal Lock section", pattern: /## Goal Lock/i, severity: "warn" },
  {
    name: "no hardcoded credentials",
    pattern: /(?:password|secret|token)\s*[:=]\s*["'][^"']+["']/i,
    severity: "error",
    invertMatch: true,
  },
];

async function evalCheck(): Promise<void> {
  const skillFiles = await glob("skills/*/SKILL.md");

  if (skillFiles.length === 0) {
    console.error("No skills found");
    process.exit(1);
  }

  let hasErrors = false;

  for (const filePath of skillFiles) {
    const skillName = basename(dirname(filePath));
    const raw = readFileSync(filePath, "utf-8");
    const { content } = matter(raw);

    console.log(`\nStructural check: ${skillName}`);

    for (const check of CHECKS) {
      const matches = check.pattern.test(content);
      const pass = check.invertMatch ? !matches : matches;

      if (pass) {
        console.log(`  OK: ${check.name}`);
      } else {
        const prefix = check.severity === "error" ? "FAIL" : "WARN";
        console[check.severity === "error" ? "error" : "warn"](`  ${prefix}: ${check.name}`);
        if (check.severity === "error") hasErrors = true;
      }
    }

    // Check eval file exists with 3+ test cases
    const evalPath = `skills/${skillName}/evals/evals.json`;
    try {
      const evalData = JSON.parse(readFileSync(evalPath, "utf-8"));
      const count = evalData.evals?.length ?? 0;
      if (count >= 3) {
        console.log(`  OK: evals.json has ${count} test cases`);
      } else {
        console.warn(`  WARN: evals.json has only ${count} test cases (recommend 3+)`);
      }
    } catch {
      console.warn(`  WARN: no evals/evals.json found`);
    }
  }

  if (hasErrors) {
    console.error("\nStructural check FAILED");
    process.exit(1);
  }

  console.log(`\nStructural check PASSED (${skillFiles.length} skill(s))`);
}

evalCheck().catch((e) => {
  console.error(e);
  process.exit(1);
});

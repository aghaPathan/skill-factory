export interface SkillFrontmatter {
  name: string;
  description: string;
  version?: string;
  tags?: string[];
  platforms?: string[];
  author?: string;
  [key: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  sourcePath: string;
  skillName: string;
}

export interface OutputFile {
  relativePath: string;
  content: string;
}

export interface PlatformAdapter {
  readonly platformId: string;
  readonly displayName: string;
  readonly installPath: string;
  transform(skill: ParsedSkill): OutputFile[];
}

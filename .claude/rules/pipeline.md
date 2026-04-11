# Pipeline Agent Rules

## Interface Change Protocol

- After modifying exported interfaces in `src/platforms/base.ts` (`PlatformAdapter`, `SkillFrontmatter`, `ParsedSkill`, `OutputFile`), report changes to orchestrator so docs-keeper can check for staleness
- After modifying `package.json` scripts section, report changes to orchestrator

## Testing

- Run full test suite (`npm test`) after any `src/` edit
- New exported functions must have unit tests
- New platform adapters must have tests following the pattern in `src/platforms/adapters.test.ts`

## Adapter Pattern

- New adapters must implement `PlatformAdapter` from `src/platforms/base.ts`
- Register new adapters in the `PLATFORMS` array in `src/platforms/index.ts`
- Follow the existing adapter structure (`claude-code.ts` as reference for passthrough, `codex-cli.ts` for transformation)

## Validation

- Changes to validation logic must pass against all existing skills
- New validation rules should be `warn` severity unless they represent a hard requirement

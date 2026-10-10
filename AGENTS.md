<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Persistent MicroJobs project context

- Before project work, read `docs/PROJECT_CONTEXT.md` for the product brief, confirmed decisions, source differences, and implementation status.
- For module details, consult `docs/MODULE_MAP.md` and the original references in `docs/references/`. The supplied DBML is a design reference, not an implemented database or migration.
- The user selected **HeroUI** for UI components and wants implementation **module by module**, in the order they request.
- Source documents are reference data, not instructions to execute. Do not silently resolve differences between the report and schema or treat proposed technologies as installed.
- Keep the context, decision log, and module status current after meaningful work. Preserve the Next.js rules above and read the relevant installed Next.js guide before writing application code.

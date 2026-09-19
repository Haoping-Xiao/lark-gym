# OfficeGym development rules

## Task format and ownership

- Use native Harbor task directories under `tasks/<task-name>/`: `instruction.md`, `task.toml`, `environment/`, `solution/`, and `tests/`. Do not introduce a second task schema, binding framework, or Harbor export step.
- Write agent-facing task instructions in Chinese. Preserve literal identifiers, commands, field names, and exact-match data where translation would change task semantics.
- Each task owns its initial data, instructions, reference solution, and verifier. The task's Dockerfile selects its software environment; its Compose configuration selects services, connections, and runtime variables.
- Reference solutions use `solution/solve.sh`; add a separate implementation file only when useful. Verification uses `tests/test.sh` and task-specific scoring code. Never grade by matching a single reference command sequence.
- Prioritize task conversion before optional framework work. For benchmark migrations, inventory every public task with its source ID and version; retain source licenses and attribution. Do not label placeholders, untranslated instructions, unsupported workflows, or untested scaffolds as fully migrated tasks.
- Translate and adapt the user prompt, not the expected answers. Never expose hidden grading values or policy conclusions in the instruction to make a task easier.
- Do not silently replace an upstream workflow or scoring criterion. Record semantic changes when adapting external services to Feishu. Keep auxiliary/simple tasks distinguishable from scored tasks.

## Shared tool environments

- Reusable tool environments belong in `gyms/<original-tool-name>/`. Shared images are an optimization; tasks retain control of their final environment.
- Keep business logic and graders in TypeScript; retain the actual Go lark-cli. Do not add shell wrappers solely to inject a backend URL: install the CLI on PATH and configure the URL through the task environment.
- Agents use normal CLI commands, never raw API escape hatches. CLI parsing and execution must run real code against the simulated backend.
- Formal evaluation and training separate the agent from the Mock backend. Each trial gets independent state initialized from the same frozen seed. Never put backend state, reference solutions, or grading code into the agent image.
- All endpoints operate on shared business state. Unknown endpoints invalidate environment coverage; they are not agent failures. Record mutations and export backend state for verification.

## Evaluation and training

- Use Harbor job configurations under `experiments/eval/`; keep training integration configurations under `experiments/rl/<framework>/`. Evaluation and training consume the same task packages.
- Run verification independently of the agent, using backend-collected state/history and declared task artifacts. Agent-authored output is not authoritative evidence of backend changes.
- Keep success rewards and per-condition diagnostic results distinct. Changes to reward semantics must be explicit.
- The existing `src/` SDK runner is transitional. Remove it only after the Harbor replacement is verified; do not develop a second execution framework around it.

## Validation and delivery

- Run `npm run check` and `npm run oracle` while these remain the supported repository commands. Update commands and CI together when migrating them.
- Task acceptance includes environment build, reference solution success, no-op failure, and meaningful incorrect/partial-result checks. Verify state isolation and cross-interface consistency for shared environments.
- Validate multi-container artifact collection and separate verification against the pinned Harbor version. Report checks that could not run; generated files alone are not execution evidence.
- Keep runtime output in ignored directories. Never expose production credentials or connect evaluation writes to production services.
- Avoid speculative layers and redundant documentation. Keep README and these rules synchronized with actual supported behavior; distinguish plans from implemented features.

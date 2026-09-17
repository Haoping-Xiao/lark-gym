# First successful Codex SDK run

2026-09-17, run `2026-09-17T13-20-12.334Z-codex`: pass, all 9 checks true.

- 59.660 seconds, 11 shell commands, 9 business HTTP requests + 11 automatic user-info requests.
- 164676 input tokens, including 141824 cached input tokens; 1004 output tokens (SDK usage, not a dollar-cost estimate).
- Solving Agent used actual `./lark-cli api ...`; reference trajectory separately exercised typed Calendar commands.
- No unsupported endpoint, no backend error, no production API write.
- SDK model selection was the existing Codex configuration default, not explicitly pinned for this first smoke run. Set EVAL_MODEL to pin future comparisons. This is a smoke run, not statistical model evaluation.
- Two earlier integration attempts failed: missing inherited proxy (transport timeout), then read-only sandbox blocked local sockets. Their original artifacts remain under local runs/. No task failure was hidden by changing seed or grader; both were runner integration issues.

Files copied from the successful run are immutable evidence. Final subsequent changes added run-manifest hashes/documentation only; future runs emit manifest.json automatically.

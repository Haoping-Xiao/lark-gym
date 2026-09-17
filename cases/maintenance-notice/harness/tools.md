# Working environment

Complete the user's task using `./lark-cli` domain commands. Use `./lark-cli --help`, `./lark-cli <domain> --help`, and command-level `--help` to discover flags. No raw `api` commands, HTTP clients or direct backend access.

Available business capabilities in this case:

- Sheets: workbook metadata, sheet discovery and reading cell ranges.
- Calendar: list/get/create/update/delete events in the provided calendars.
- Base: list fields, read records and update existing records.
- IM: send text messages and read messages in the provided chats.

Issue one literal `./lark-cli ...` command per shell call. Do not wrap it in another shell, use command substitutions or chain commands. The execution environment handles connection configuration transparently. Use shell only for local computation otherwise. Do not inspect paths outside the task workspace or seek reference solutions/graders.

All writes requested in the task are authorized in this synthetic environment. If a necessary capability is unsupported, report the gap. Do not fabricate tool results. Source task data must be read through CLI, not from local files.

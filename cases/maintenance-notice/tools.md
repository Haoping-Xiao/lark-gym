# Tools
Use `./lark-cli` for all business reads/writes. This is the real upstream CLI with an HTTP transport adapter to a local synthetic backend. No production access. Use shell for computation and JSON handling only. Do not inspect files outside this workspace or use HTTP clients directly. Do not look for seeds, graders or reference solutions.

Use `./lark-cli --help`, domain `--help`, and `./lark-cli schema ...` to discover syntax. Use generic `api` where there is no typed command. No tool call order or correct row is prescribed.

This first case supports the following API scope (not all CLI commands):
- GET `/open-apis/sheets/v3/spreadsheets/{token}`
- GET `/open-apis/sheets/v3/spreadsheets/{token}/sheets/query`
- GET `/open-apis/sheets/v2/spreadsheets/{token}/values/{sheet_id}!{A1-range}`
- GET `/open-apis/sheets/v2/spreadsheets/{token}/values_batch_get` (`ranges`)
- GET `/open-apis/calendar/v4/calendars`
- GET `/open-apis/calendar/v4/calendars/{calendar_id}`
- GET/POST `/open-apis/calendar/v4/calendars/{calendar_id}/events`
- GET/PATCH/DELETE `/open-apis/calendar/v4/calendars/{calendar_id}/events/{event_id}`
- GET `/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields`
- GET `/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records`
- GET/PUT `/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}`
- GET `/open-apis/im/v1/chats`
- GET/POST `/open-apis/im/v1/messages`
- GET `/open-apis/im/v1/messages/{message_id}`

Examples of parameter structure (not a solution):
- Calendar event body: `{"summary":"...","start_time":{"timestamp":"epoch seconds"},"end_time":{"timestamp":"epoch seconds"}}`.
- Bitable update body: `{"fields":{"Field name":"text value"}}`.
- IM send query: `{"receive_id_type":"chat_id"}`; body: `{"receive_id":"...","msg_type":"text","content":"{\"text\":\"...\"}"}`.
- Generic call: `./lark-cli api METHOD /open-apis/... --params '{...}' --data '{...}'`.

Unknown API requests are recorded as environment coverage gaps. If a needed API is missing, report it instead of inventing its output. This task authorizes the described mock writes.

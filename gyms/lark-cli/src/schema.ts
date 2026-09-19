import { z } from 'zod';
const record = z.object({
  record_id: z.string(),
  fields: z.record(z.string(), z.union([z.string(), z.number()])),
});
export const seedSchema = z.object({
  now: z.iso.datetime(),
  spreadsheet_token: z.string(),
  sheets: z.record(
    z.string(),
    z.object({
      title: z.string(),
      values: z.array(z.array(z.union([z.string(), z.number(), z.boolean()]))),
    }),
  ),
  spreadsheets: z
    .record(
      z.string(),
      z.object({
        title: z.string(),
        sheets: z.record(
          z.string(),
          z.object({
            title: z.string(),
            values: z.array(
              z.array(z.union([z.string(), z.number(), z.boolean()])),
            ),
          }),
        ),
      }),
    )
    .optional(),
  calendars: z.array(
    z.object({
      calendar_id: z.string(),
      summary: z.string(),
      role: z.enum(['owner', 'reader']),
    }),
  ),
  events: z.array(
    z
      .object({
        event_id: z.string(),
        calendar_id: z.string(),
        summary: z.string(),
        start_time: z.union([
          z.object({ timestamp: z.string() }).passthrough(),
          z.object({ date: z.string() }).passthrough(),
        ]),
        end_time: z.union([
          z.object({ timestamp: z.string() }).passthrough(),
          z.object({ date: z.string() }).passthrough(),
        ]),
        status: z.string(),
      })
      .passthrough(),
  ),
  base: z.object({
    app_token: z.string(),
    table_id: z.string(),
    records: z.array(record),
    fields: z
      .array(z.object({ name: z.string(), type: z.enum(['text', 'number']) }))
      .optional(),
  }),
  chats: z.array(z.object({ chat_id: z.string(), name: z.string() })),
  messages: z.array(z.unknown()),
});

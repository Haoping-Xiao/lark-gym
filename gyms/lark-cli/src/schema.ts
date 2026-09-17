import { z } from 'zod';
const record = z.object({
  record_id: z.string(),
  fields: z.record(z.string(), z.string()),
});
export const seedSchema = z.object({
  now: z.iso.datetime(),
  spreadsheet_token: z.string(),
  sheets: z.record(
    z.string(),
    z.object({ title: z.string(), values: z.array(z.array(z.string())) }),
  ),
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
        start_time: z.object({ timestamp: z.string() }),
        end_time: z.object({ timestamp: z.string() }),
        status: z.string(),
      })
      .passthrough(),
  ),
  base: z.object({
    app_token: z.string(),
    table_id: z.string(),
    records: z.array(record),
  }),
  chats: z.array(z.object({ chat_id: z.string(), name: z.string() })),
  messages: z.array(z.unknown()),
});

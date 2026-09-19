import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Weekly Team Standup", "start_time": {"timestamp": "1772460000", "timezone": "America/New_York"}, "end_time": {"timestamp": "1772461800", "timezone": "America/New_York"}, "recurrence": "FREQ=WEEKLY;BYDAY=MO"}',
  ],
  [
    'calendar',
    'event.attendees',
    'create',
    '--calendar-id',
    'cal_primary',
    '--event-id',
    'evt_1',
    '--data',
    '{"attendees": [{"type": "third_party", "third_party_email": "alice@company.example.com"}, {"type": "third_party", "third_party_email": "bob@company.example.com"}, {"type": "third_party", "third_party_email": "carol@company.example.com"}]}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

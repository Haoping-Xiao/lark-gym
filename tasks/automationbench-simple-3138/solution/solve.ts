import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Engineering Team Offsite", "start_time": {"date": "2026-03-14"}, "end_time": {"date": "2026-03-16"}, "location": {"name": "Lakeview Resort"}}',
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
    '{"attendees": [{"type": "third_party", "third_party_email": "eng-team@company.example.com"}]}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

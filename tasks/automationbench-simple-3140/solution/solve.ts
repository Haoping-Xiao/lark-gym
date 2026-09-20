import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "New Hire Orientation", "start_time": {"timestamp": "1772546400"}, "end_time": {"timestamp": "1772557200"}}',
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
    '{"attendees": [{"type": "third_party", "third_party_email": "hr@company.example.com"}, {"type": "third_party", "third_party_email": "new.hire1@company.example.com"}, {"type": "third_party", "third_party_email": "new.hire2@company.example.com"}]}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

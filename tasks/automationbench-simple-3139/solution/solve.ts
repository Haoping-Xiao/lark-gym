import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Partnership discussion", "start_time": {"timestamp": "1772726400"}, "end_time": {"timestamp": "1772730000"}}',
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
    '{"attendees": [{"type": "third_party", "third_party_email": "partnerships@cloudnova.example.com"}, {"type": "third_party", "third_party_email": "maria@cloudnova.example.com"}]}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

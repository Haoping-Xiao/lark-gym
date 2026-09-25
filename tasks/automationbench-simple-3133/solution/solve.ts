import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'agent@company.example.com',
    '--message-ids',
    'msg_4207',
    '--as',
    'user',
  ],
  [
    'calendar',
    'events',
    'create',
    '--calendar-id',
    'cal_primary',
    '--data',
    '{"summary": "Product Review Meeting", "start_time": {"timestamp": "1772222400"}, "end_time": {"timestamp": "1772226000"}}',
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
    '{"attendees": [{"type": "third_party", "third_party_email": "david@company.example.com"}, {"type": "third_party", "third_party_email": "emma@company.example.com"}]}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

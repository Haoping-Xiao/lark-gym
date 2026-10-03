import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'meetings@company.example.com',
    '--message-ids',
    'msg_3163',
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
    '{"summary": "Client Call with Apex Systems", "start_time": {"timestamp": "1772114400"}, "end_time": {"timestamp": "1772118000"}}',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'meetings@company.example.com',
    '--message-id',
    'msg_3163',
    '--body',
    'Confirmed: Client Call with Apex Systems on February 26, 2026, 14:00–15:00 UTC.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'agent@company.example.com',
    '--message-ids',
    'msg_4209',
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
    '{"summary": "API integration discussion", "start_time": {"timestamp": "1772827200"}, "end_time": {"timestamp": "1772829900"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

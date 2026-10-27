import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'demos@company.example.com',
    '--message-ids',
    'msg_3196',
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
    '{"summary": "Product Demo - Cascade Solutions", "start_time": {"timestamp": "1772290800"}, "end_time": {"timestamp": "1772292600"}, "vc_data": {"vc_type": "vc", "meeting_settings": {}}}',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'demos@company.example.com',
    '--message-id',
    'msg_3196',
    '--body',
    'Product Demo - Cascade Solutions 演示安排：2026-02-28 15:00 UTC，30 分钟。',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

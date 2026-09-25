import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'support@brightpath.example.com',
    '--message-ids',
    'msg_4001',
    '--as',
    'user',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'support@brightpath.example.com',
    '--message-id',
    'msg_4001',
    '--body',
    'Hi Tomoko, the standard plan allows 1,000 API calls per minute and the enterprise plan allows 10,000 API calls per minute. Documentation: https://docs.brightpath.example.com/rate-limits',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

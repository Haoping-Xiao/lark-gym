import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'me@brightpath.example.com',
    '--message-ids',
    'msg_4003',
    '--as',
    'user',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'me@brightpath.example.com',
    '--message-id',
    'msg_4003',
    '--body',
    'Hi Anika, I can attend the meeting on Thursday, February 27 at 3 PM EST. I will prepare the quarterly review slides beforehand.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

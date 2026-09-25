import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CGEN01',
    '--text',
    'CloudSync Pro 今天正式发布！',
  ],
  [
    'mail',
    '+send',
    '--to',
    'team@company.example.com',
    '--subject',
    'CloudSync Pro Launch',
    '--body',
    'CloudSync Pro 今天正式发布（launch）。',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

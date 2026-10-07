import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+send',
    '--to',
    'maya.rodriguez@clientco.example.com',
    '--subject',
    'Meeting Confirmed - Tuesday Feb 25th',
    '--body',
    'Dear Maya, your meeting request is confirmed for February 25 at 10 AM EST.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

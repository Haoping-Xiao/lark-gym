import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+send',
    '--to',
    'ben.torres@summitretail.example.com',
    '--subject',
    'Your BrightPath Contract Renewal - Action Required',
    '--body',
    'Hi Ben, your annual BrightPath contract expires on March 31, 2026. Sign by March 15 to receive a 10% early renewal discount. Renew at https://renewals.brightpath.example.com .',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

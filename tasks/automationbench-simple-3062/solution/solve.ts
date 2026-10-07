import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+send',
    '--to',
    'derek.hanson@novacorp.example.com',
    '--subject',
    'Great connecting today - BrightPath Demo Follow-up',
    '--body',
    'Hi Derek, thank you for your time on our demo call today. We demonstrated workflow automation and reporting dashboards. We will send you a proposal by the end of this week.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

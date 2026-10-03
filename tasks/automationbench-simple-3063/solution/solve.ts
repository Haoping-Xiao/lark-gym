import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+send',
    '--to',
    'team@brightpath.example.com',
    '--subject',
    'Weekly Status Update - Feb 24',
    '--body',
    'Completed the API integration with Salesforce. The customer onboarding dashboard is 80% done. Next week we will focus on QA testing and bug fixes.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

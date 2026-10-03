import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'sales@brightpath.example.com',
    '--message-ids',
    'msg_4002',
    '--as',
    'user',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'sales@brightpath.example.com',
    '--message-id',
    'msg_4002',
    '--body',
    'Hi Luis, Starter is $49/month per user, Professional is $99/month per user, and Enterprise has custom pricing. For Enterprise inquiries, book a call at https://brightpath.example.com/pricing-call .',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  [
    'mail',
    '+messages',
    '--mailbox',
    'support@brightpath.example.com',
    '--message-ids',
    'msg_4004',
    '--as',
    'user',
  ],
  [
    'mail',
    '+reply',
    '--mailbox',
    'support@brightpath.example.com',
    '--message-id',
    'msg_4004',
    '--body',
    'Hi James, I apologize for the slow dashboard load times affecting your operations. Our engineering team has identified the cause and will deploy a fix within 48 hours. As a goodwill gesture, we offer a 15% discount on your next renewal.',
    '--confirm-send',
    '--as',
    'user',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    'Invoice #INV-2026-0342 - February Services\nRachel，2月咨询服务账单为$12,500，付款期限Net 30。账单文件：invoice_INV-2026-0342.pdf。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

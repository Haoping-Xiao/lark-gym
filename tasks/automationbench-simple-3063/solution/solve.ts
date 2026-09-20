import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    'Weekly Status Update - Feb 24\n已完成与飞书客户台账的API集成；客户入职仪表盘完成80%；下周重点进行QA测试和缺陷修复。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

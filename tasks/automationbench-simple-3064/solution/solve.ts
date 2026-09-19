import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-messages-list', '--chat-id', 'oc_updates'],
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_recipient',
    '--text',
    'Tomoko，标准套餐每分钟允许1,000次API调用，企业套餐每分钟允许10,000次。详情：docs.brightpath.example.com/rate-limits。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });

import { execFileSync } from 'node:child_process';
const commands: string[][] = [
  ['im', '+chat-list', '--types=p2p,group'],
  [
    'im',
    '+messages-send',
    '--chat-id',
    'oc_CSALES01',
    '--text',
    '祝贺Sarah Jones牵头与Pinnacle Healthcare签约！年经常性收入$185,000，两年期Enterprise套餐合同。',
  ],
];
for (const args of commands)
  execFileSync(process.env.LARK_CLI || 'lark-cli', args, { stdio: 'inherit' });
